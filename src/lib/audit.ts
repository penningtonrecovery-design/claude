import type { AuditEvent, DemoState, Role } from "./types";

/**
 * DEMO hash: FNV-1a (two passes with different seeds) → 16 hex chars.
 * This is NOT cryptographically secure. It only demonstrates the idea of a
 * hash-chained, append-only log. Production needs SHA-256 (or better) with
 * server-side, write-once storage and independent verification.
 */
export function demoHash(input: string): string {
  const pass = (seed: number) => {
    let h = seed >>> 0;
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, "0");
  };
  return pass(0x811c9dc5) + pass(0x01234567);
}

export const GENESIS_HASH = "0000000000000000";

function canonical(e: Omit<AuditEvent, "hash">): string {
  return JSON.stringify([
    e.seq,
    e.id,
    e.at,
    e.actorId,
    e.actorName,
    e.actorRole,
    e.action,
    e.entityType,
    e.entityId,
    e.summary,
    e.data ?? null,
    e.prevHash,
  ]);
}

export interface Actor {
  id: string;
  name: string;
  role: Role | "system";
}

export const SYSTEM_ACTOR: Actor = { id: "system", name: "MARcheck Demo System", role: "system" };

let idCounter = 0;
export function newId(prefix: string): string {
  idCounter = (idCounter + 1) % 1_000_000;
  return `${prefix}_${Date.now().toString(36)}${idCounter.toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** Returns a new audit array with one event appended. Never mutates or rewrites history. */
export function appendAudit(
  audit: readonly AuditEvent[],
  input: {
    actor: Actor;
    at: number;
    action: AuditEvent["action"];
    entityType: AuditEvent["entityType"];
    entityId: string;
    summary: string;
    data?: Record<string, unknown>;
  },
): AuditEvent[] {
  const last = audit[audit.length - 1];
  const base: Omit<AuditEvent, "hash"> = {
    seq: last ? last.seq + 1 : 1,
    id: newId("evt"),
    at: input.at,
    actorId: input.actor.id,
    actorName: input.actor.name,
    actorRole: input.actor.role,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    summary: input.summary,
    data: input.data,
    prevHash: last ? last.hash : GENESIS_HASH,
  };
  return [...audit, { ...base, hash: demoHash(canonical(base)) }];
}

export function withAudit(state: DemoState, input: Parameters<typeof appendAudit>[1]): DemoState {
  return { ...state, audit: appendAudit(state.audit, input) };
}

export type ChainCheck = { ok: true; count: number } | { ok: false; count: number; brokenAtSeq: number; problem: string };

/** Recomputes every hash and link. Detects edits, deletions and reordering. */
export function verifyAuditChain(audit: readonly AuditEvent[]): ChainCheck {
  let prev = GENESIS_HASH;
  for (let i = 0; i < audit.length; i++) {
    const e = audit[i];
    if (e.seq !== i + 1) return { ok: false, count: audit.length, brokenAtSeq: e.seq, problem: "Sequence gap (event removed or reordered)" };
    if (e.prevHash !== prev) return { ok: false, count: audit.length, brokenAtSeq: e.seq, problem: "Link to previous event does not match" };
    const { hash, ...rest } = e;
    if (demoHash(canonical(rest)) !== hash) return { ok: false, count: audit.length, brokenAtSeq: e.seq, problem: "Event content was modified" };
    prev = hash;
  }
  return { ok: true, count: audit.length };
}

export function auditToCsv(audit: readonly AuditEvent[], facility: string): string {
  const esc = (v: unknown) => {
    const s = v === undefined || v === null ? "" : typeof v === "string" ? v : JSON.stringify(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const lines = [
    `# DEMO PROTOTYPE EXPORT - NOT A VALIDATED COMPLIANCE SYSTEM - FICTIONAL DATA - ${facility}`,
    ["seq", "timestamp_iso", "actor_id", "actor_name", "actor_role", "action", "entity_type", "entity_id", "summary", "data", "prev_hash", "hash"].join(","),
  ];
  for (const e of audit) {
    lines.push(
      [e.seq, new Date(e.at).toISOString(), e.actorId, e.actorName, e.actorRole, e.action, e.entityType, e.entityId, e.summary, e.data, e.prevHash, e.hash]
        .map(esc)
        .join(","),
    );
  }
  return lines.join("\n");
}
