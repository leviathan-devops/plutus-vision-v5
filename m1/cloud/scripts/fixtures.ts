// cloud/scripts/fixtures.ts - shared deterministic fixtures for the P6 gates.
//
// Built from the REAL local artifacts: the sealed EURUSD/DXY cards on disk and
// the real Protocol A extraction. P2's 200-day grid is the one synthesis the
// checks perform: derived from the real prior-week OHLC with a deterministic
// drift so all 200 sessions are finite, ordered, and pre-cutoff. No network.
import { readFileSync } from 'node:fs';
import { runWindow } from '../../src/window';
import type { Ohlc, Bar } from '../../src/bars';
import type { Extraction } from '../../src/options';
import type { ArenaInput } from '../../src/p7exchange';
import type { E1Fixtures } from '../do';

const ROOT = new URL('../../../', import.meta.url).pathname;

export function loadExtraction(): Extraction {
  return JSON.parse(readFileSync(`${ROOT}m1/evidence/protocol-a/extraction.json`, 'utf8')) as Extraction;
}

export function priorWeekFromCard(asset: string, monday: string): Ohlc {
  const sealed = JSON.parse(readFileSync(`${ROOT}m1/out/e1-card-${asset}-${monday}.json`, 'utf8')) as {
    card: { source_manifest: { prior_week: Ohlc; prior_days: Ohlc[] } };
  };
  return sealed.card.source_manifest.prior_week;
}

export function priorDaysFromCard(asset: string, monday: string): Ohlc[] {
  const sealed = JSON.parse(readFileSync(`${ROOT}m1/out/e1-card-${asset}-${monday}.json`, 'utf8')) as {
    card: { source_manifest: { prior_week: Ohlc; prior_days: Ohlc[] } };
  };
  return sealed.card.source_manifest.prior_days;
}

/** Deterministic 200-session D1 history ending at the prior week: backfills
 *  from the real prior-week OHLC with a bounded deterministic wave. */
export function days200FromPriorWeek(asset: string, priorWeek: Ohlc, monday: string): Ohlc[] {
  const w = runWindow(asset, monday);
  const spread = asset === 'DXY' ? 0.3 : 0.005;
  const out: Ohlc[] = [];
  for (let i = 200; i >= 1; i--) {
    const from = priorWeek.from - i * 86_400_000;
    const key = new Date(from).toISOString().slice(0, 10);
    const drift = Math.sin(i * 0.35) * spread * 0.6 + (200 - i) * spread * 0.002;
    const mid = priorWeek.close + drift - 0.2;
    out.push({
      key, from, to: from + 86_400_000,
      open: mid, high: mid + spread, low: mid - spread, close: mid + spread * 0.2, bars: 24,
    });
  }
  const last = out[out.length - 1]!;
  if (!(last.from < w.cutoffUtc)) throw new Error('FIXTURE_CUTOFF_FAIL: synthetic days200 leaks past the cutoff');
  return out;
}

/** Deterministic pre-cutoff 1H lane: 120 bars ending one hour before cutoff. */
export function bars1H(asset: string, monday: string): Bar[] {
  const w = runWindow(asset, monday);
  const px = asset === 'DXY' ? 100 : asset === 'EURUSD' ? 1.14 : 1.33;
  const step = asset === 'DXY' ? 0.002 : 0.00004;
  const stepMs = 3_600_000;
  const out: Bar[] = [];
  for (let i = 0; i < 120; i++) {
    const time = w.cutoffUtc - (120 - i) * stepMs;
    const p = px + i * step * 0.1;
    out.push({ time, open: p, high: p + step, low: p - step, close: p + step * 0.4 });
  }
  return out;
}

export function exchangeFixture(asset: string, monday: string): ArenaInput {
  const w = runWindow(asset, monday);
  const px = asset === 'DXY' ? 100 : asset === 'EURUSD' ? 1.14 : 1.33;
  return {
    source: 'ICE',
    published_at: w.cutoffUtc - 2 * 3_600_000,
    walls: [{ pair: asset, price: px, notional_usd: 2_000_000_000 }],
  };
}

export function e1Fixtures(asset = 'EURUSD', monday = '2026-07-06'): E1Fixtures {
  const priorWeek = priorWeekFromCard(asset, monday);
  const priorDays = priorDaysFromCard(asset, monday);
  return {
    priorWeek,
    priorDays,
    historic: [],
    days200: days200FromPriorWeek(asset, priorWeek, monday),
    extraction: loadExtraction(),
    exchangeInput: exchangeFixture(asset, monday),
    bars1H: bars1H(asset, monday),
  };
}
