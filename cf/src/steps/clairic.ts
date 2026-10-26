/**
 * CLAIRIC = THE READER. Unstructured -> typed, with p_null and span.
 * An absent field is INCONCLUSIVE; a violated invariant is FATAL. Never a guess.
 */
import { runModel } from "./clef";
import { Fatal, must } from "./errors";
import { arr, at, num, str } from "./guards";

export const OPTIONS_FIELDS = {
  pair: { type: "text" },
  expiry_date: { type: "date", instructions: "the expiry this ladder belongs to" },
  cut_time: { type: "time", instructions: "the NY cut time printed on the page" },
  strikes: {
    type: "list", items: "number", decimals: 4,
    instructions: "every strike printed, ascending",
  },
  notionals_b: {
    type: "list", items: "number", decimals: 2,
    instructions: "notional in BILLIONS, same order as strikes",
  },
  open_interest: {
    type: "list", items: "number", integer: true,
    instructions: "OI per strike if printed, else null",
  },
  printed_total_b: {
    type: "estimate", min: 0, max: 500, step: 0.1,
    instructions: "the printed total for the week, if present",
  },
} as const;

export const CALENDAR_FIELDS = {
  events:      { type: "list", items: "text", instructions: "each event title, in date order" },
  event_dates: { type: "list", items: "datetime", instructions: "each event's release time, same order" },
  impact:      { type: "list", items: "text", instructions: "high / medium / low as printed, same order" },
  currency:    { type: "list", items: "text", instructions: "three-letter currency code, same order" },
} as const;

export interface CalEvent {
  ts: number;
  title: string;
  impact: "high" | "medium" | "low";
  currency: string;
}

export async function extractCalendar(
  env: Env, png: Uint8Array, weekStart: number, weekEnd: number,
): Promise<CalEvent[]> {
  const raw = await runModel(env, "@cf/cloudflare/clairic", {
    state: "Economic calendar for one trading week. Read every row: title, release time, impact, currency.",
    images: [toBase64(png)],
    fields: CALENDAR_FIELDS,
  });
  if (at(raw, "truncated") === true) throw new Fatal("W3_EXTRACT_TRUNCATED", {});
  for (const f of Object.keys(CALENDAR_FIELDS)) {
    const p = num(at(raw, "answers", f, "p_null"));
    if (p === undefined) throw new Fatal("W3_NO_PNULL", { field: f });
    if (p > 0.5) throw new Fatal("W3_INCONCLUSIVE", { field: f, p_null: p });
  }
  const list = (f: string): unknown[] => must(arr(at(raw, "answers", f, "value")), "W3_FIELD_NOT_LIST", { field: f });
  const titles = list("events");
  const dates = list("event_dates");
  const impacts = list("impact");
  const curs = list("currency");
  if (new Set([titles.length, dates.length, impacts.length, curs.length]).size !== 1)
    throw new Fatal("W3_I1_ALIGNMENT", { n: [titles.length, dates.length, impacts.length, curs.length] });
  const out: CalEvent[] = [];
  for (let i = 0; i < titles.length; i++) {
    const title = must(str(titles[i]), "W3_FIELD_INVALID", { field: "events", i });
    const ts = Date.parse(must(str(dates[i]), "W3_FIELD_INVALID", { field: "event_dates", i }));
    if (!Number.isFinite(ts)) throw new Fatal("W3_I2_DATE", { i });
    if (ts < weekStart || ts > weekEnd) throw new Fatal("W3_I3_WINDOW", { i, ts });
    const impact = must(str(impacts[i]), "W3_FIELD_INVALID", { field: "impact", i }).toLowerCase();
    if (impact !== "high" && impact !== "medium" && impact !== "low") throw new Fatal("W3_I4_IMPACT", { i, impact });
    const currency = must(str(curs[i]), "W3_FIELD_INVALID", { field: "currency", i }).toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) throw new Fatal("W3_I5_CURRENCY", { i, currency });
    out.push({ ts, title, impact, currency });
  }
  return out;
}

export interface Walls {
  pair: string;
  expiry: number;
  cut: string;
  strikes: number[];
  notionals_b: number[];
  oi: (number | null)[];
  captureSha: string;
}

export async function extractOptions(
  env: Env,
  png: Uint8Array,
  pair: string,
  weekStart: number,
  weekEnd: number,
): Promise<Walls> {
  const raw = await runModel(env, "@cf/cloudflare/clairic", {
    state: `FX options expiry ladder for ${pair}, week of ${new Date(weekStart).toISOString().slice(0, 10)}.`,
    images: [toBase64(png)],
    fields: OPTIONS_FIELDS,
  });

  if (at(raw, "truncated") === true) throw new Fatal("W2_EXTRACT_TRUNCATED", {});

  for (const f of Object.keys(OPTIONS_FIELDS)) {
    const node = at(raw, "answers", f);
    if (node === undefined) throw new Fatal("W2_FIELD_ABSENT", { field: f });
    const p = num(at(node, "p_null"));
    if (p === undefined) throw new Fatal("W2_NO_PNULL", { field: f });
    if (p > 0.5) throw new Fatal("W2_INCONCLUSIVE", { field: f, p_null: p });
  }

  const listOf = (field: string): unknown[] =>
    must(arr(at(raw, "answers", field, "value")), "W2_FIELD_NOT_LIST", { field });
  const numbers = (field: string): number[] =>
    listOf(field).map((v, i) => must(num(v), "W2_FIELD_INVALID", { field, i }));
  const strikes = numbers("strikes");
  const notionals = numbers("notionals_b");
  const oi = listOf("open_interest").map((v, i) =>
    v === null ? null : must(num(v), "W2_FIELD_INVALID", { field: "open_interest", i }));

  // I1 ALIGNMENT
  if (strikes.length !== notionals.length || strikes.length !== oi.length)
    throw new Fatal("W2_I1_ALIGNMENT", { n: [strikes.length, notionals.length, oi.length] });
  // I2 UNITS — the ladder is already in billions
  if (notionals.some((n) => !(n > 0 && n < 500))) throw new Fatal("W2_I2_UNITS", { notionals });
  // I3 DOMAIN
  const spot = must(strikes[Math.floor(strikes.length / 2)], "W2_NO_STRIKES", {});
  if (strikes.some((s) => Math.abs(s - spot) > spot * 0.15)) throw new Fatal("W2_I3_DOMAIN", {});
  // I4 WINDOW
  const expiryStr = str(at(raw, "answers", "expiry_date", "value"));
  if (!expiryStr) throw new Fatal("W2_FIELD_ABSENT", { field: "expiry_date" });
  const expiry = Date.parse(expiryStr);
  if (!(weekStart <= expiry && expiry <= weekEnd)) throw new Fatal("W2_I4_WINDOW", { expiry });
  // I5 TOTAL
  const total = num(at(raw, "answers", "printed_total_b", "value"));
  if (total !== undefined) {
    const sum = notionals.reduce((a, b) => a + b, 0);
    if (Math.abs(total - sum) > 0.02 * sum) throw new Fatal("W2_I5_TOTAL", { total, sum });
  }

  const cut = must(str(at(raw, "answers", "cut_time", "value")), "W2_FIELD_ABSENT", { field: "cut_time" });
  return { pair, expiry, cut, strikes, notionals_b: notionals, oi, captureSha: await sha(png) };
}

function toBase64(b: Uint8Array): string {
  let s = "";
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s);
}

async function sha(b: Uint8Array): Promise<string> {
  const copy = new Uint8Array(b.length);
  copy.set(b);
  const d = await crypto.subtle.digest("SHA-256", copy.buffer);
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
