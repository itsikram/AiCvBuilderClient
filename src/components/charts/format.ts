// Number and date formatting shared by the admin charts and their tables.

const whole = new Intl.NumberFormat("en-US");
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export const fmtInt = (n: number) => whole.format(Math.round(n));
/** In full under 10,000, compact above (12.9K) */
export const fmtCompact = (n: number) => (Math.abs(n) >= 10_000 ? compact.format(n) : whole.format(Math.round(n)));
export const fmtTaka = (n: number) => `৳${whole.format(Math.round(n))}`;
export const fmtTakaCompact = (n: number) => `৳${fmtCompact(n)}`;
/** 0.1234 -> "12.3%" */
export const fmtPct = (ratio: number, digits = 1) => `${(ratio * 100).toFixed(ratio > 0 && ratio < 0.001 ? 2 : digits)}%`;
export const share = (part: number, whole: number) => (whole > 0 ? part / whole : 0);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-11-08" -> "8 Nov", "2026-11" -> "Nov 2026" (keys are already Bangladesh dates) */
export const bucketLabel = (key: string, withYear = false) => {
  const [y, m, d] = key.split("-").map(Number);
  if (!d) return `${MONTHS[m - 1]} ${y}`;
  return `${d} ${MONTHS[m - 1]}${withYear ? ` ${y}` : ""}`;
};

/** An instant as a Bangladesh date, e.g. "8 Nov 2026" */
export const bdDateLabel = (value: string | Date) =>
  new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Dhaka" });

/** Round axis ticks from 0 to just above `max`: steps of 1, 2, 2.5 or 5 x 10^n. */
export const niceTicks = (max: number, count = 4): number[] => {
  if (!(max > 0)) return [0, 1];
  const raw = max / count;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= raw) ?? 10 * power;
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => Math.round(i * step * 1e6) / 1e6);
};

export type DeltaTone = "good" | "bad" | "neutral";
export interface Delta {
  text: string;
  tone: DeltaTone;
  direction: "up" | "down" | "flat";
}

/** Change against the previous period as a percentage, coloured by whether up is good. */
export const percentDelta = (current: number, previous: number | null | undefined, higherIsBetter = true): Delta | undefined => {
  if (previous === null || previous === undefined) return undefined;
  if (current === previous) return { text: "No change", tone: "neutral", direction: "flat" };
  if (previous === 0) return { text: "New", tone: higherIsBetter ? "good" : "bad", direction: "up" };
  const change = (current - previous) / Math.abs(previous);
  const up = change > 0;
  const pct = Math.abs(change * 100);
  return {
    text: `${up ? "+" : "−"}${pct >= 10 ? Math.round(pct) : pct.toFixed(1)}%`,
    tone: up === higherIsBetter ? "good" : "bad",
    direction: up ? "up" : "down",
  };
};

/** CSV text from rows of cells; quotes every cell that needs it. */
export const toCsv = (rows: Array<Array<string | number>>) =>
  rows.map((row) => row.map((cell) => (/[",\n]/.test(String(cell)) ? `"${String(cell).replace(/"/g, '""')}"` : String(cell))).join(",")).join("\n");

export const downloadText = (filename: string, text: string, type = "text/csv;charset=utf-8") => {
  // A byte-order mark so Excel reads Bangla text as UTF-8
  const blob = new Blob(["﻿", text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
