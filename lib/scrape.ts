import { lookup as dnsLookup } from "node:dns/promises";
import * as cheerio from "cheerio";
import type { SiteSignals } from "./types";

const FETCH_TIMEOUT_MS = 10_000;
const MAX_BODY_BYTES = 3_000_000; // 3MB, generous for a marketing site's HTML
const USER_AGENT =
  "PGAIConsultingAuditBot/1.0 (+https://penningtonrecovery.example; free website audit tool)";

export class AuditFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuditFetchError";
  }
}

/** Accepts a bare domain, a URL missing its scheme, or a full URL. */
export function normalizeUrl(input: string): URL {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new AuditFetchError("Please enter a website URL.");
  }
  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed);
  const withScheme = hasScheme ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new AuditFetchError("That doesn't look like a valid website URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new AuditFetchError("Only http and https websites can be audited.");
  }
  return url;
}

const IPV4_PRIVATE_PREFIXES = [
  /^0\./,
  /^10\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // 100.64.0.0/10 (CGNAT)
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
];

function isPrivateIPv4(ip: string): boolean {
  return IPV4_PRIVATE_PREFIXES.some((re) => re.test(ip));
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  return (
    lower === "::1" ||
    lower === "::" ||
    lower.startsWith("fe80:") || // link-local
    lower.startsWith("fc") || // unique local fc00::/7
    lower.startsWith("fd") ||
    lower.startsWith("::ffff:127.") ||
    lower.startsWith("::ffff:10.")
  );
}

const DISALLOWED_HOSTNAMES = new Set(["localhost", "localhost.localdomain", "0.0.0.0"]);

/** SSRF guard: refuse to fetch hosts that resolve to loopback/private/link-local addresses. */
async function assertPublicHostname(hostname: string): Promise<void> {
  const lower = hostname.toLowerCase();
  if (DISALLOWED_HOSTNAMES.has(lower) || lower.endsWith(".localhost")) {
    throw new AuditFetchError("That host can't be audited.");
  }

  let addresses: { address: string; family: number }[];
  try {
    addresses = await dnsLookup(hostname, { all: true });
  } catch {
    throw new AuditFetchError("Couldn't resolve that website's address. Check the URL and try again.");
  }

  for (const { address, family } of addresses) {
    const blocked = family === 4 ? isPrivateIPv4(address) : isPrivateIPv6(address);
    if (blocked) {
      throw new AuditFetchError("That host can't be audited.");
    }
  }
}

async function readBodyCapped(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    return await response.text();
  }
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel();
        break;
      }
      chunks.push(value);
    }
  }
  const merged = new Uint8Array(total > MAX_BODY_BYTES ? MAX_BODY_BYTES : total);
  let offset = 0;
  for (const chunk of chunks) {
    const remaining = merged.length - offset;
    if (remaining <= 0) break;
    merged.set(chunk.subarray(0, remaining), offset);
    offset += Math.min(chunk.length, remaining);
  }
  return new TextDecoder("utf-8").decode(merged);
}

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

const PHONE_RE = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const REVIEW_KEYWORDS = [
  "google reviews",
  "trustpilot",
  "yelp",
  "facebook.com",
  "g2.com",
  "testimonial",
  "5-star",
  "five star",
  "★",
];

export async function fetchAndAnalyze(rawUrl: string): Promise<SiteSignals> {
  const url = normalizeUrl(rawUrl);
  await assertPublicHostname(url.hostname);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const startedAt = Date.now();

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html,application/xhtml+xml",
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new AuditFetchError("That site took too long to respond.");
    }
    throw new AuditFetchError("Couldn't reach that website. Check the URL and try again.");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new AuditFetchError(`That site responded with an error (HTTP ${response.status}).`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType && !contentType.includes("html")) {
    throw new AuditFetchError("That URL doesn't appear to point to a webpage.");
  }

  // Re-validate the post-redirect host, in case the redirect chain landed on a private address.
  const finalUrl = new URL(response.url || url.toString());
  if (finalUrl.hostname !== url.hostname) {
    await assertPublicHostname(finalUrl.hostname);
  }

  const html = await readBodyCapped(response);
  const fetchMs = Date.now() - startedAt;
  const htmlBytes = Buffer.byteLength(html, "utf-8");

  const $ = cheerio.load(html);
  $("script, style, noscript").each((_, el) => {
    $(el).remove();
  });

  const bodyText = collapseWhitespace($("body").text());
  const lowerHtml = html.toLowerCase();

  const ctaTexts = Array.from(
    new Set(
      $("a, button")
        .map((_, el) => collapseWhitespace($(el).text()))
        .get()
        .filter((t) => t.length > 0 && t.length <= 60),
    ),
  ).slice(0, 15);

  const navLinkTexts = Array.from(
    new Set(
      $("nav a, header a")
        .map((_, el) => collapseWhitespace($(el).text()))
        .get()
        .filter((t) => t.length > 0 && t.length <= 40),
    ),
  ).slice(0, 15);

  const reviewSignalHits = REVIEW_KEYWORDS.filter((kw) => lowerHtml.includes(kw));
  if ($('a[href*="google.com/maps"], a[href*="g.page"]').length > 0) {
    reviewSignalHits.push("google maps link");
  }

  const images = $("img");
  let imagesMissingDimensionsCount = 0;
  images.each((_, el) => {
    const $el = $(el);
    if (!$el.attr("width") && !$el.attr("height")) {
      imagesMissingDimensionsCount += 1;
    }
  });

  return {
    finalUrl: finalUrl.toString(),
    statusCode: response.status,
    fetchMs,
    htmlBytes,
    title: $("title").first().text().trim() || null,
    metaDescription: $('meta[name="description"]').attr("content")?.trim() || null,
    viewportContent: $('meta[name="viewport"]').attr("content")?.trim() || null,
    h1Texts: $("h1")
      .map((_, el) => collapseWhitespace($(el).text()))
      .get()
      .filter((t) => t.length > 0)
      .slice(0, 3),
    telLinkCount: $('a[href^="tel:"]').length,
    mailtoLinkCount: $('a[href^="mailto:"]').length,
    phoneNumberMatchCount: (bodyText.match(PHONE_RE) ?? []).length,
    reviewSignalHits: Array.from(new Set(reviewSignalHits)),
    ctaTexts,
    navLinkTexts,
    footerTextSnippet: collapseWhitespace($("footer").text()).slice(0, 1000),
    aboveFoldTextSnippet: bodyText.slice(0, 600),
    scriptTagCount: $("script[src]").length,
    stylesheetCount: $('link[rel="stylesheet"]').length,
    imageCount: images.length,
    imagesMissingDimensionsCount,
  };
}
