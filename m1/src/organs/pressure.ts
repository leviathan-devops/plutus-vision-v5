// pressure.ts — P3 organ: pressure lifecycle (zone-pressure.ts donor semantics).
// battles = qualifying touch events (gap-through PASS_THROUGH never counts);
// pierced = any pierce battle -> BROKEN (terminal); 4+ holds -> FORTRESS; 3 -> DEPLETED;
// 2 -> ACTIVE_2; 1 -> ACTIVE_1; 0 -> VIRGIN. nested = nearest contained liquidity;
// shield = nearest front-side liquidity within 20 pips; absorption = opposite reaction
// without progress; operativeDefense = shield ? SHIELD_FUEL : PRESSURE_STRUCTURE.
import type { OrganZone, TouchEvent } from './candlePressure';

export type ZoneLifecycle = 'VIRGIN' | 'ACTIVE_1' | 'ACTIVE_2' | 'DEPLETED' | 'FORTRESS' | 'BROKEN';
export interface PressureOut {
  lifecycle: ZoneLifecycle; battles: number; pierced: boolean;
  nested: number | null; shield: number | null;
  absorption: 'INTACT' | 'ABSORBED'; operativeDefense: 'SHIELD_FUEL' | 'PRESSURE_STRUCTURE';
}

const BATTLE = new Set(['SWEEP', 'WICK_REJECT', 'BODY_DEFEND', 'CONSOL_DWELL']);
const SHIELD_PIPS = 20;

/** Build pressure state. Battles with gap_through are ignored (not battles). */
export function buildPressure(
  zone: OrganZone, battlesIn: TouchEvent[], liquidity: number[], unit: number,
): PressureOut {
  const battles = battlesIn.filter((e) => BATTLE.has(e.kind) && !e.gap_through);
  const pierced = battles.some((e) => e.pierce);
  const n = battles.length;
  const lifecycle: ZoneLifecycle =
    pierced ? 'BROKEN' : n >= 4 ? 'FORTRESS' : n === 3 ? 'DEPLETED' : n === 2 ? 'ACTIVE_2' : n === 1 ? 'ACTIVE_1' : 'VIRGIN';
  const pip = 0.01 * unit;
  const center = (zone.lo + zone.hi) / 2;
  let nested: number | null = null; let bestNest = Infinity;
  for (const p of liquidity) {
    if (p >= zone.lo && p <= zone.hi && Math.abs(p - center) < bestNest) { bestNest = Math.abs(p - center); nested = p; }
  }
  let shield: number | null = null; let bestShield = Infinity;
  const band = SHIELD_PIPS * pip;
  for (const p of liquidity) {
    const front = zone.side === 'demand' ? (p > zone.hi && p <= zone.hi + band) : (p < zone.lo && p >= zone.lo - band);
    if (!front) continue;
    const d = zone.side === 'demand' ? p - zone.hi : zone.lo - p;
    if (d < bestShield) { bestShield = d; shield = p; }
  }
  const kinds = new Set(battles.map((e) => e.kind));
  const absorption = !pierced && kinds.has('SWEEP') && (kinds.has('WICK_REJECT') || kinds.has('BODY_DEFEND')) ? 'ABSORBED' : 'INTACT';
  return { lifecycle, battles: n, pierced, nested, shield, absorption,
    operativeDefense: shield !== null ? 'SHIELD_FUEL' : 'PRESSURE_STRUCTURE' };
}
