// Builds MARcheck as ONE self-contained HTML file (inline JS + CSS, no server).
// Used for hosting the demo as a static page. Output: dist-static/marcheck.html
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const out = path.join(root, "dist-static");
mkdirSync(out, { recursive: true });

execFileSync("npx", ["@tailwindcss/cli", "-i", "src/app/globals.css", "-o", "dist-static/app.css", "--minify"], { stdio: "inherit" });

const result = await build({
  entryPoints: ["src/spa/main.tsx"],
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  write: false,
  logLevel: "warning",
  tsconfig: "tsconfig.json",
  alias: {
    "next/link": "./src/spa/shims/link.tsx",
    "next/navigation": "./src/spa/shims/navigation.ts",
  },
  define: {
    "process.env.NODE_ENV": '"production"',
    "process.env.NEXT_PUBLIC_STATIC_DEMO": '"true"',
  },
});

const js = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const css = readFileSync(path.join(out, "app.css"), "utf8").replace(/<\/style/gi, "<\\/style");

const html = `<title>MARcheck</title>
<meta name="description" content="MARcheck eMAR demonstration prototype. Fictional data only. Not for clinical use.">
<style>${css}</style>
<noscript>MARcheck needs JavaScript. DEMO ONLY — NOT FOR CLINICAL USE.</noscript>
<div id="root"></div>
<script>${js}</script>
`;
writeFileSync(path.join(out, "marcheck.html"), html);
console.log(`dist-static/marcheck.html  ${(html.length / 1024).toFixed(0)} KB`);
