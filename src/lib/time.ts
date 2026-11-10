export const pad = (n: number) => String(n).padStart(2, "0");

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;

/** Local calendar date key, YYYY-MM-DD. */
export function dateKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseKey(key: string): [number, number, number] {
  const [y, m, d] = key.split("-").map(Number);
  return [y, m, d];
}

export function addDays(key: string, n: number): string {
  const [y, m, d] = parseKey(key);
  return dateKey(new Date(y, m - 1, d + n).getTime());
}

/** Epoch ms for a local date key + "HH:MM". */
export function atTime(key: string, hhmm: string): number {
  const [y, m, d] = parseKey(key);
  const [h, mi] = hhmm.split(":").map(Number);
  return new Date(y, m - 1, d, h, mi).getTime();
}

export function startOfDay(key: string): number {
  return atTime(key, "00:00");
}

export function fmtTime(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function fmtHHMM(hhmm: string): string {
  return fmtTime(atTime("2000-01-01", hhmm));
}

export function fmtDate(key: string): string {
  const [y, m, d] = parseKey(key);
  return new Date(y, m - 1, d).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function fmtDateTime(ms: number): string {
  return new Date(ms).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function relative(ms: number, now: number): string {
  const diff = Math.round((ms - now) / MINUTE);
  const abs = Math.abs(diff);
  const text = abs < 60 ? `${abs} min` : abs < 48 * 60 ? `${Math.floor(abs / 60)} h ${abs % 60} min` : `${Math.floor(abs / 1440)} days`;
  if (abs < 1) return "now";
  return diff > 0 ? `in ${text}` : `${text} ago`;
}

export type Shift = "Day" | "Evening" | "Night";

export function shiftFor(hhmm: string): Shift {
  const h = Number(hhmm.split(":")[0]);
  if (h >= 6 && h < 14) return "Day";
  if (h >= 14 && h < 22) return "Evening";
  return "Night";
}
