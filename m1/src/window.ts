// window.ts - the run identity and its time boundaries (blueprint §4; contract §2.5; workflow P2.TURN-01).
// Worker-compatible: Intl with IANA zones only, no Node APIs. R36 render window: the active
// week plus one week of history on the left, closing at the Friday 21:00 UTC session end.

export interface RunWindow {
  asset: string;
  weekMonday: string;      // YYYY-MM-DD
  openUtc: number;         // Sunday 22:00 UTC before the Monday (ms)
  cutoffUtc: number;       // Monday 09:00 Europe/London (ms)
  endUtc: number;          // Friday 21:00 UTC (ms)
  renderFromUtc: number;   // Monday - 7 days 00:00 UTC (R36: active week + one week left)
  renderToUtc: number;     // Friday 21:00 UTC session end (R36: no right extension)
}

import { E1Refusal } from './refusals';

const DAY = 86_400_000;
const HOUR = 3_600_000;

/** Offset in minutes of an IANA zone at an instant (positive east of UTC). */
export function zoneOffsetMinutes(utcMs: number, timeZone: string): number {
  const f = new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const p: Record<string, string> = {};
  for (const x of f.formatToParts(new Date(utcMs))) p[x.type] = x.value;
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return Math.round((asUtc - utcMs) / 60000);
}

/** The UTC instant of a wall-clock time in a zone (two-pass offset resolution). */
export function wallClockToUtc(y: number, m: number, d: number, hh: number, mm: number, timeZone: string): number {
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const t1 = guess - zoneOffsetMinutes(guess, timeZone) * 60000;
  return guess - zoneOffsetMinutes(t1, timeZone) * 60000;
}

export function runWindow(asset: string, weekMonday: string): RunWindow {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(weekMonday);
  if (!m) throw new E1Refusal('E1_IDENTITY_INVALID', `W0_WEEK_INVALID: ${weekMonday}`);
  const [y, mo, d] = [+m[1], +m[2], +m[3]];
  const monday = Date.UTC(y, mo - 1, d);
  if (new Date(monday).getUTCDay() !== 1) throw new E1Refusal('E1_IDENTITY_INVALID', `W0_WEEK_NOT_MONDAY: ${weekMonday} - WINDOW_NON_MONDAY_REJECTED`);
  if (!['DXY', 'EURUSD', 'GBPUSD'].includes(asset)) throw new E1Refusal('E1_ASSET_UNSUPPORTED', `W0_ASSET_UNSUPPORTED: ${asset}`);
  return {
    asset, weekMonday,
    openUtc: monday - 2 * HOUR,                               // Sunday 22:00 UTC
    cutoffUtc: wallClockToUtc(y, mo, d, 9, 0, 'Europe/London'),
    endUtc: monday + 4 * DAY + 21 * HOUR,                     // Friday 21:00 UTC
    renderFromUtc: monday - 7 * DAY,
    renderToUtc: monday + 4 * DAY + 21 * HOUR,                // R36: Friday 21:00 UTC session end
  };
}

/** The trading-session date of a bar. The FX day rolls at 17:00 New York; measured on TVC:DXY the
 *  week opens Sunday 22:00 UTC (18:00 EDT). Shifting NY wall time by +6h maps 18:00 NY to 00:00 of
 *  the session day, so the rule is DST-correct in both seasons. */
export function sessionDate(utcMs: number): string {
  const ny = utcMs + zoneOffsetMinutes(utcMs, 'America/New_York') * 60000 + 6 * HOUR;
  return new Date(ny).toISOString().slice(0, 10);
}
