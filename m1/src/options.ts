// options.ts - PILLAR 3 (component conversion, :1092-1165) and PILLAR 8 (EUR/USD primary, :1436-1451).
// DXY map: every component strike converts to DXY space, DXY_equiv = DXY_ref * (strike / spot)^w (identical to the
// full 50.14348112 formula at fixed components); K (Appendix A.3) = DXY_ref * EURUSD_spot^0.576.
// EURUSD/GBPUSD map: the chart's OWN pair's strikes are already the chart's prices - used natively (identity), no
// conversion, K not applicable. Other pairs are excluded with a recorded reason: P3 converts to DXY only, and the
// canon defines no cross-conversion to a non-DXY asset (recorded, never silently dropped).
// Bands are the canon's DXY-point widths through pip-parity (m1/src/units.ts): 0.07/0.10/0.15 + 0.03 x unit.
import type { Level } from './levels';

export const DXY_W: Record<string, number> = { EURUSD: -0.576, USDJPY: 0.136, GBPUSD: -0.119, USDCAD: 0.091, USDSEK: 0.042, USDCHF: 0.036 };
export const R1_QUALIFIED = new Set(['EURUSD', 'GBPUSD', 'AUDUSD']);       // step 9.8 (:1520)
export interface Expiry { date: string; cut: string; pair: string; notional_ccy: string; strikes: [number, number][] }
export interface Extraction { published_at: string; cutoff_status: string; spot_at_publication: Record<string, number>; expiries: Expiry[]; image: { sha256: string }; source_url: string }
export interface OptionsInput { extraction: Extraction; asset: string; unit: number; dxyRef: number | null; dxyRefAt: string; spotSource: string; h10Status: string }

export function usdNotional(e: Expiry, notional: number, spot: Record<string, number>): number {
  if (e.notional_ccy === 'USD') return notional;
  const pair = `${e.notional_ccy}USD`; const s = spot[pair];
  if (!s) throw new Error(`P3_NOTIONAL_SPOT_MISSING: ${pair} - add the pair's publication spot to m1/evidence/protocol-a/extraction.json spot_at_publication`);
  return notional * s;
}
export function tierOf(usd: number): 1 | 2 | 3 { return usd >= 1.5e9 ? 1 : usd >= 850e6 ? 2 : 3; }
export const TIER_NAME = { 1: 'CRITICAL OPTION WALL', 2: 'SIGNIFICANT MAGNET', 3: 'EXCLUDED' } as const;

export interface Conversion { pair: string; date: string; strike: number; notional: number; ccy: string; usd: number; tier: 1 | 2 | 3; level: number; band: number; pillar: 'P3' | 'P8'; audit: string }
export interface OptionsOut { conversions: Conversion[]; levels: Level[]; K: number | null; audit: string[]; supplementaryPairs: string[] }

export function pillar3and8(inp: OptionsInput): OptionsOut {
  const { extraction: x, asset, unit, dxyRef } = inp; const spot = x.spot_at_publication;
  if (x.cutoff_status !== 'BEFORE_CUTOFF') throw new Error(`P3_EVIDENCE_AFTER_CUTOFF: ${x.published_at} - fetch a Protocol A post published before the run week's Monday 09:00 London cutoff`);
  const native = asset !== 'DXY';
  const conversions: Conversion[] = []; const audit: string[] = []; const supplementary = new Set<string>();
  const K = native ? null : dxyRef! * Math.pow(spot.EURUSD, 0.576);
  audit.push(native
    ? `K factor: n/a for the ${asset} map - the chart's own pair's strikes are native ${asset} prices (identity, no conversion); P3 converts to DXY only and the canon defines no cross-conversion to ${asset}`
    : `K factor: DXY_ref=${dxyRef} (${inp.dxyRefAt}) x EURUSD_spot^0.576=${spot.EURUSD}^0.576 -> K=${K!.toFixed(4)} | spots: ${inp.spotSource} | H.10: ${inp.h10Status}`);
  for (const e of x.expiries) {
    if (native && e.pair !== asset) continue;                               // recorded below, not silently dropped
    const w = DXY_W[e.pair]; if (w === undefined) continue;                  // AUD/NZD are not DXY components
    const s = spot[e.pair]; if (!s) throw new Error(`P3_SPOT_MISSING: ${e.pair} - add it to extraction.json spot_at_publication`);
    supplementary.add(e.pair);
    for (const [strike, notional] of e.strikes) {
      // P8 (:1443-1447) tiers EUR/USD on the EUR notional (>= 1.5B EUR, 850M-1.499B EUR); P3 (:1129-1133) tiers the
      // other pairs on the USD equivalent.
      const usd = usdNotional(e, notional, spot); const tier = e.pair === 'EURUSD' ? tierOf(notional) : tierOf(usd);
      const level = native ? strike : dxyRef! * Math.pow(strike / s, w);
      const pillar = e.pair === 'EURUSD' ? 'P8' : 'P3';
      const base = pillar === 'P8' ? ({ 1: 0.07, 2: 0.10, 3: 0.15 } as const)[tier] : 0.10;
      const band = (base + 0.03) * unit;                                    // 1 supplementary-rate pair (:1115), pip-parity
      const a = native
        ? `${pillar} ${e.date} ${e.pair} ${strike} ${e.notional_ccy}${(notional / 1e6).toFixed(0)}m ($${(usd / 1e6).toFixed(0)}m) T${tier} ${TIER_NAME[tier]} -> ${asset} ${level.toFixed(5)} (native strike) band +/-${band.toFixed(5)}`
        : `${pillar} ${e.date} ${e.pair} ${strike} ${e.notional_ccy}${(notional / 1e6).toFixed(0)}m ($${(usd / 1e6).toFixed(0)}m) T${tier} ${TIER_NAME[tier]} -> DXY ${level.toFixed(3)} = ${dxyRef} x (${strike}/${s})^${w} band +/-${band.toFixed(2)}`;
      audit.push(a); conversions.push({ pair: e.pair, date: e.date, strike, notional, ccy: e.notional_ccy, usd, tier, level, band, pillar, audit: a });
    }
  }
  if (native) {
    const skipped = [...new Set(x.expiries.map(e => e.pair).filter(p => p !== asset))];
    if (skipped.length) audit.push(`P3 excluded for this map: ${skipped.join(', ')} strikes - no canon cross-conversion to ${asset} exists (P3 converts to DXY only); recorded not-applicable`);
    if (!conversions.length) audit.push(`P8: no ${asset} strikes published in the ${x.published_at} post - the options dimension will be 0 for every level`);
  }
  const levels: Level[] = conversions.filter(c => c.tier <= 2).map(c => ({
    id: `${c.pillar}|${c.pair}|${c.date}|${c.strike}`, pillar: c.pillar, kind: 'option', price: c.level,
    label: `${c.pair} ${c.strike} ${c.ccy === 'EUR' ? 'EUR' : c.ccy === 'AUD' ? 'A$' : '$'}${c.notional >= 1e9 ? (c.notional / 1e9).toFixed(1) + 'bn' : (c.notional / 1e6).toFixed(0) + 'm'} ${c.date.slice(5)}`,
    timeframe: 'expiry', formedAt: Date.parse(x.published_at), source: [x.source_url, `image sha256 ${x.image.sha256}`],
    tags: [TIER_NAME[c.tier]], meta: { tier: c.tier, usd: c.usd, band: c.band, pair: c.pair, date: c.date, strike: c.strike, r1: R1_QUALIFIED.has(c.pair) } }));
  return { conversions, levels, K, audit, supplementaryPairs: [...supplementary] };
}
