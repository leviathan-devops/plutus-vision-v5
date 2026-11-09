// assemble.ts - SYNTHESIS ENGINE (5.3.3 :1461-1526) + PILLAR 9 (regime, strength-based ZFP, measured move :1455-1459,
// Appendix B :4052-4074) + BoM/MoM, reaction counter (:1145-1161), intra-zone levels (0.6, :1312-1333), core/spike (5.5).
import type { Bar } from './bars';
import type { Level } from './levels';
import type { SdZone } from './p5';

export const DEGREES = [[12, 'EXTREME'], [10, 'HEAVY'], [8, 'MODERATE-HEAVY'], [6, 'MODERATE'], [4, 'LIGHT'], [0, 'MINIMAL']] as const;
export type Degree = typeof DEGREES[number][1];
export const degreeOf = (s: number): Degree => DEGREES.find(([t]) => s >= t)![1];
const TECH = new Set(['pivot', 'ma', 'ma-cluster', 'fib']);
const STRUCT = new Set(['swing-low', 'swing-high', 'order-block', 'lsz', 'magnet', 'sd-4h', 'sd-1h', 'prior-close', 'minor-swing']);

export interface Dims { technical: number; options: number; analyst: number; structural: number; psychological: number; regime: number }
export interface ScoredLevel extends Level { dims: Dims; bonus: number; base: number; total: number; why: string[] }
export interface Zone {
  id: string; lo: number; hi: number; role: 'resistance' | 'support' | 'equilibrium'; name: string; members: ScoredLevel[];
  score: number; degree: Degree; dims: Dims; bonus: number; modifiers: string[];
  poiTier: 1 | 2 | null; bom?: { tf: string; type: 'BoM' | 'MoM'; side: string; lo: number; hi: number; date: string; mitigations: number };
  zoneType: string; zfpBase: number; zfpMods: { signal: string; value: number }[]; zfp: number; breakoutRisk: boolean; measuredMove: number | null;
  reactionsPreCutoff: number; reactionState: 'Virgin' | 'Active' | 'Depleted';
  intra: { price: number; type: string; source: string }[]; core?: { lo: number; hi: number }; spike?: { lo: number; hi: number };
  optionDriver: string | null; highDensity: boolean; tight: boolean; postConsolidation: boolean;
  origin: number;                // the candle that established the zone: earliest structural member (S/D origin, swing, OB), else earliest member
  // time-dependent B.2 rules applied at the moment of a test (canon midpoints): Spring Release once the driving option
  // has expired; Cascade once the nearer same-side zone has broken.
  zfpRules: { springReleaseAt: number | null; springRelease: number; cascade: number; cascadeAfter: string | null };
}
export interface Regime { state: 'consolidation' | 'momentum' | 'breakout'; direction: 'up' | 'down' | 'flat'; basis: string; ema200Cross: boolean }

/** P9 regime at the cutoff from completed D1 sessions: breakout when spot is outside the prior-week range;
 *  momentum when the 5-session close change exceeds half the prior-week range; else consolidation. */
export function regimeAt(spot: number, priorWeek: { high: number; low: number }, closes: number[], ema200Cross: boolean): Regime {
  const r = priorWeek.high - priorWeek.low; const ch = closes[closes.length - 1] - closes[closes.length - 6];
  const direction = ch > 0 ? 'up' : ch < 0 ? 'down' : 'flat';
  const state = spot > priorWeek.high || spot < priorWeek.low ? 'breakout' : Math.abs(ch) > r / 2 ? 'momentum' : 'consolidation';
  return { state, direction, ema200Cross, basis: `spot ${spot} vs prior week [${priorWeek.low}, ${priorWeek.high}], 5-session change ${ch.toFixed(3)} vs half-range ${(r / 2).toFixed(3)}` };
}

function scoreLevel(l: Level, all: Level[], regime: Regime, spot: number, unit: number): ScoredLevel {
  const pip = unit * 0.01;
  const why: string[] = []; const near = (d: number, f: (x: Level) => boolean) => all.filter(x => x !== l && f(x) && Math.abs(x.price - l.price) <= d);
  const isTech = TECH.has(l.kind);
  const techExact = (isTech ? 1 : 0) + near(0.03 * unit, x => TECH.has(x.kind) && x.id.split('|')[1] !== l.id.split('|')[1]).length;
  const technical = techExact >= 2 ? 2 : (isTech || near(0.10 * unit, x => TECH.has(x.kind)).length) ? 1 : 0;
  if (technical) why.push(`technical ${technical} (${techExact} technical within ${0.03 * unit})`);
  const opts = [l, ...near(0.15 * unit, x => x.kind === 'option')].filter(x => x.kind === 'option' && Math.abs(x.price - l.price) <= ((x.meta?.band as number) ?? 0.10 * unit) && x.meta?.r1);
  const options = opts.some(o => o.meta!.tier === 1) ? 2 : opts.some(o => o.meta!.tier === 2) ? 1 : 0;
  if (options) why.push(`options ${options} (${opts.map(o => o.label).join(', ')})`);
  const analyst = 0;                                                       // P4: no pre-cutoff explicit levels acquired (missing_data)
  // Structural (:1472): 2 = an exact price anchor AND a structural extreme at this level (both within 3 pips);
  // 1 = proximity (10 pips) to a structural EXTREME, or an exact (3-pip) price anchor. Anchors are prior closes/HWC/LWC;
  // extremes are qualified swings, magnets, LSZs, order blocks and S/D origins. Minor swings (0h) are gap-fill only.
  const EXT = ['swing-low', 'swing-high', 'magnet', 'lsz', 'order-block', 'sd-4h', 'sd-1h'];
  const isExt = (x: Level) => EXT.includes(x.kind);
  const exactExt = isExt(l) || near(0.03 * unit, isExt).length > 0;
  const exactAnchor = l.kind === 'prior-close' || near(0.03 * unit, x => x.kind === 'prior-close').length > 0;
  const structural = exactExt && exactAnchor ? 2 : (exactExt || exactAnchor || near(0.10 * unit, isExt).length) ? 1 : 0;
  if (structural) why.push(`structural ${structural}`);
  // quarter grid in pips: 25-pip figures get 1, 50-pip big figures get 2, within 3 pips (DXY: 0.25/0.50/0.03 — identical to the canon's absolute numbers)
  const quarter = 25 * pip, half = 50 * pip, dec = pip === 0.01 ? 2 : 4;
  const nearestQ = Math.round(l.price / quarter) * quarter; const distQ = Math.abs(l.price - nearestQ);
  const major = Math.abs(nearestQ / half - Math.round(nearestQ / half)) < 1e-9;
  const psychological = distQ <= 3 * pip ? (major ? 2 : 1) : 0;
  if (psychological) why.push(`psychological ${psychological} (${nearestQ.toFixed(dec)})`);
  const towards = regime.direction === 'up' ? l.price > spot : regime.direction === 'down' ? l.price < spot : false;
  const regimeDim = regime.state === 'consolidation' ? 2 : regime.state === 'momentum' ? (towards ? 1 : 2) : (towards ? 0 : 1);
  why.push(`regime ${regimeDim} (${regime.state}${towards ? ', in path' : ''})`);
  const bonuses = [l, ...near(0.03 * unit, x => (x.extremeBonus ?? 0) > 0)].map(x => x.extremeBonus ?? 0);
  const bonus = Math.min(2, Math.max(0, ...bonuses));
  const legacy = l.legacy ? 0.5 : 0;
  const dims = { technical, options, analyst, structural, psychological, regime: regimeDim };
  const base = technical + options + analyst + structural + psychological + regimeDim;
  return { ...l, dims, bonus, base, total: Math.min(14, base + bonus + legacy), why: legacy ? [...why, 'legacy +0.5'] : why };
}

export interface AssembleIn { levels: Level[]; sd: SdZone[]; spot: number; cutoff: number; regime: Regime; preBars: Bar[]; priorDayCloses: { key: string; close: number }[]; optionExpiryTimes: Record<string, number>;
  arena: { lo: number; hi: number }; unit: number }   // unit = pip-parity scale (m1/src/units.ts); arena = the week's expected range (run.ts render_policy band): a BoM outside it is not this week's target

export function assemble(inp: AssembleIn): { zones: Zone[]; scored: ScoredLevel[]; gapFills: { price: number; signals: string[] }[]; reverify: string; audit: string[] } {
  const { spot, regime } = inp; const audit: string[] = [];
  // R1: sort all levels high -> low, no spot filter; R2: score each level
  // identical prices from different formulas (fib R3 == classic R2, fib PP == classic PP) are ONE level with merged provenance
  const byPrice = new Map<string, Level>();
  for (const l of inp.levels.filter(l => l.kind !== 'arena')) {
    const k = `${l.kind}|${l.price.toFixed(5)}`; const e = byPrice.get(k);
    if (e) { e.source = [...new Set([...e.source, ...l.source])]; e.label = `${e.label} = ${l.label}`; } else byPrice.set(k, { ...l, source: [...l.source] });
  }
  const zoneable = [...byPrice.values()];
  const scored = zoneable.map(l => scoreLevel(l, zoneable, regime, spot, inp.unit)).sort((a, b) => b.price - a.price);
  // R3: clustering scan
  const dens = (l: ScoredLevel, d: number) => scored.filter(x => x !== l && Math.abs(x.price - l.price) <= d).length;
  // R4: zones form AROUND clusters: seed from the highest-scoring unassigned level and take every unassigned level within
  // +/-0.075 (a 0.15 band, :1499-1500); levels that join no seed stay single-level zones and score on their own.
  const groups: ScoredLevel[][] = []; const taken = new Set<ScoredLevel>();
  for (const seed of [...scored].sort((a, b) => b.total - a.total || b.price - a.price)) {
    if (taken.has(seed)) continue;
    const g = scored.filter(x => !taken.has(x) && Math.abs(x.price - seed.price) <= 0.075 * inp.unit);
    g.forEach(x => taken.add(x)); groups.push(g.sort((a, b) => b.price - a.price));
  }
  groups.sort((a, b) => b[0].price - a[0].price);
  const zones: Zone[] = groups.map((g, k) => {
    const top = g.reduce((a, b) => b.total > a.total ? b : a);                 // R5: degree from the highest-scoring level
    const lo = Math.min(...g.map(x => x.price)), hi = Math.max(...g.map(x => x.price));
    const role = lo > spot ? 'resistance' : hi < spot ? 'support' : 'equilibrium';
    const modifiers: string[] = []; let score = top.total; const isIp = top.total >= 6;   // an IP zone = MODERATE+ on its own levels
    // consolidation modifier (:1505): the zone holds a 4H/1H origin formed after consolidation
    const sdIn = inp.sd.filter(z => !z.rejected && z.lo <= hi + 0.05 * inp.unit && z.hi >= lo - 0.05 * inp.unit);
    const postConsolidation = sdIn.some(z => z.postConsolidation);
    if (postConsolidation) { score += 1; modifiers.push('POST-CONSOLIDATION ZONE +1'); }
    // 9.7 POI tier: 4H BoM 0X-1X overlapping -> Tier 1 +2; else IP-only Tier 2 +1
    const bom4 = sdIn.find(z => z.tf === '4H' && z.type === 'BoM' && z.mitigations <= 1);
    // 9.7 (:1509-1514): Tier 1 = IP zone overlapping a 4H BoM 0X-1X (+2); Tier 2 = IP zone, no 4H BoM (+1); a 4H BoM with no
    // IP zone is Tier 3 (informational, no bonus); sub-IP clusters carry no POI tier.
    const poiTier = isIp ? (bom4 ? 1 : 2) : null;
    if (poiTier === 1) { score += 2; modifiers.push('POI Tier 1 Confluent +2'); } else if (poiTier === 2) { score += 1; modifiers.push('POI Tier 2 IP-only +1'); }
    else if (bom4) modifiers.push('POI Tier 3: 4H-only level (informational)');
    score = Math.min(14, score);
    const bestSd = bom4 ?? sdIn.sort((a, b) => (a.type === 'BoM' ? 0 : 1) - (b.type === 'BoM' ? 0 : 1) || a.mitigations - b.mitigations)[0];
    // 9.8 option driver re-verification: only >= $850M R1-qualified strikes may drive the options dimension
    const optM = g.filter(x => x.kind === 'option');
    const driver = optM.filter(o => o.meta?.r1 && (o.meta.tier as number) <= 2).sort((a, b) => (a.meta!.tier as number) - (b.meta!.tier as number))[0];
    // The zone starts at its ORIGIN: the earliest structural member's formation (S/D origin, swing, OB, LSZ, magnet,
    // close), else the earliest member formation. The same instant starts the box on the chart and the reaction count.
    const born = Math.min(...g.map(x => x.formedAt ?? inp.cutoff - 14 * 86_400_000));
    const structT = g.filter(x => ['sd-4h', 'sd-1h', 'swing-low', 'swing-high', 'order-block', 'lsz', 'magnet', 'minor-swing', 'prior-close'].includes(x.kind) && x.formedAt !== undefined).map(x => x.formedAt!);
    const origin = structT.length ? Math.min(...structT) : born;
    // reaction counter (:1154-1159): a STRONG reaction = price enters the zone from one side and leaves it back to the
    // SAME side by >= 0.15 (the canonical cluster band). Passing through the zone is not a reaction.
    let reactions = 0, side: 'above' | 'below' | null = null, entered: 'above' | 'below' | null = null;
    for (const b of inp.preBars) { if (b.time < origin) continue;
      const touches = b.low <= hi && b.high >= lo;
      if (touches) { if (side && !entered) entered = side; continue; }
      const now = b.low > hi ? 'above' : 'below';
      if (entered && now === entered && (now === 'above' ? b.high - hi : lo - b.low) >= 0.15 * inp.unit) { reactions++; entered = null; }
      else if (entered && now !== entered) entered = null;          // passed through
      side = now;
    }
    // P9 zone type (Appendix B.1) and strength-based ZFP
    const pillars = new Set(g.map(x => x.pillar)).size;
    const tier1 = optM.some(o => o.meta?.r1 && o.meta.tier === 1), tier2 = optM.some(o => o.meta?.r1 && o.meta.tier === 2);
    const confluentFC = g.some(x => x.tags?.some(t => t === 'Confluent Floor' || t === 'Confluent Ceiling'));
    const lszOnly = g.every(x => x.kind === 'lsz');
    const [zoneType, zfpBase] = lszOnly ? ['Liquidity Sweep Zone', 50] as const
      : tier1 && pillars >= 3 && confluentFC ? ['Hard Wall', 10] as const
      : (tier1 || tier2) && pillars >= 2 ? ['Standard Wall', 22.5] as const
      : pillars >= 2 ? ['Soft Wall', 40] as const : ['One-Touch', 60] as const;
    // B.2 modifiers at the range midpoints of the canon table (:4069-4074). Static ones apply at the cutoff; the
    // time-dependent ones (Spring Release after the driver's expiry; Cascade after the nearer same-side zone breaks)
    // are carried as rules and applied at the moment of the test (m1/src/evaluate.ts, the chart label).
    const zfpMods: { signal: string; value: number }[] = [];
    const towards = regime.direction === 'up' ? lo > spot : regime.direction === 'down' ? hi < spot : false;
    if (regime.state !== 'consolidation' && towards) zfpMods.push({ signal: 'Increasing momentum toward zone (B.2 +10-20)', value: 15 });
    if (regime.ema200Cross) zfpMods.push({ signal: 'Regime change: EMA 200 cross (B.2 +15-25)', value: 20 });
    let zfp = Math.max(1, Math.min(99, zfpBase + zfpMods.reduce((s, m) => s + m.value, 0)));
    // BoM (:1150) "100% guaranteed reaction if unmitigated": an unmitigated, untested BoM origin inside the zone takes the
    // Hard Wall floor of B.1 (5%).
    const virginBom = sdIn.some(z => z.type === 'BoM' && z.mitigations === 0) && reactions === 0;
    if (virginBom) { zfpMods.push({ signal: 'Unmitigated BoM, virgin: guaranteed reaction (:1150) -> B.1 floor 5%', value: 5 - zfp }); zfp = 5; }
    const springAt = driver && inp.optionExpiryTimes[driver.id] !== undefined ? inp.optionExpiryTimes[driver.id] : null;
    const dims = top.dims;
    return { id: `Z${k + 1}`, origin, lo, hi, role, name: '', members: g, score, degree: degreeOf(score), dims, bonus: top.bonus, modifiers, poiTier, zoneType, zfpBase, zfpMods, zfp,
      breakoutRisk: zfp > 50, measuredMove: null, reactionsPreCutoff: reactions, reactionState: reactions === 0 ? 'Virgin' : reactions <= 2 ? 'Active' : 'Depleted',
      intra: [], optionDriver: driver ? driver.label : null, highDensity: g.some(x => dens(x, 0.15 * inp.unit) >= 2), tight: g.some(x => dens(x, 0.10 * inp.unit) >= 1), postConsolidation,
      bom: bestSd ? { tf: bestSd.tf, type: bestSd.type, side: bestSd.side, lo: bestSd.lo, hi: bestSd.hi, date: bestSd.date, mitigations: bestSd.mitigations } : undefined,
      zfpRules: { springReleaseAt: springAt, springRelease: 25, cascade: 25, cascadeAfter: null } } as Zone;
  });
  // Canon :1159 — a Depleted zone (3+ reactions) lying between price and a deeper same-side BoM zone "will likely pierce":
  // "likely to fail" maps to the One-Touch band of B.1 (50-70%), midpoint 60. Cascade (B.2): each IP zone's "prior zone"
  // is the next IP zone between it and price on the same side.
  const ip = zones.filter(z => z.score >= 6);
  for (const z of ip) {
    if (z.role === 'equilibrium') continue;
    // the deeper BoM must be a target THIS week: inside the week's expected arena
    const beyond = (z.role === 'support' ? ip.filter(y => y.role === 'support' && y.hi < z.lo) : ip.filter(y => y.role === 'resistance' && y.lo > z.hi))
      .filter(y => y.hi >= inp.arena.lo && y.lo <= inp.arena.hi);
    const nearer = z.role === 'support' ? ip.filter(y => y.lo > z.hi && y.hi < spot).sort((a, b) => a.lo - b.lo)[0] : ip.filter(y => y.hi < z.lo && y.lo > spot).sort((a, b) => b.hi - a.hi)[0];
    z.zfpRules.cascadeAfter = nearer ? nearer.id : null;
    // "price will likely pierce through it to reach the BoM zone" (:1159): the BoM must lie in the direction price is
    // travelling at the cutoff (P9 regime direction), otherwise the zone is not on the way to it.
    const travelling = z.role === 'support' ? regime.direction === 'down' : regime.direction === 'up';
    if (z.reactionsPreCutoff >= 3 && travelling && beyond.some(y => y.bom?.type === 'BoM') && z.zfp < 60) {
      z.zfpMods.push({ signal: 'Depleted between price and a deeper BoM zone: likely pierce (:1159) -> B.1 One-Touch midpoint 60%', value: 60 - z.zfp });
      z.zfp = 60; z.breakoutRisk = true;
    }
  }
  // R6 measured move for ZFP > 45%: the zone-to-opposing-zone distance projected beyond the zone
  const ranked = zones.filter(z => z.degree !== 'MINIMAL');
  for (const z of zones) if (z.zfp > 45) {
    const opp = z.role === 'support' ? ranked.filter(y => y.lo > z.hi).sort((a, b) => a.lo - b.lo)[0] : ranked.filter(y => y.hi < z.lo).sort((a, b) => b.hi - a.hi)[0];
    if (opp) z.measuredMove = z.role === 'support' ? z.lo - (opp.lo - z.hi) : z.hi + (z.lo - opp.hi);
  }
  // R7 names (the zone's position in the ladder relative to spot)
  const res = zones.filter(z => z.role === 'resistance').sort((a, b) => a.lo - b.lo), sup = zones.filter(z => z.role === 'support').sort((a, b) => b.hi - a.hi);
  for (const z of zones) {
    if (z.role === 'equilibrium') z.name = 'EQUILIBRIUM ZONE';
    else if (z.members.every(m => m.kind === 'lsz')) z.name = 'LIQUIDITY SWEEP ZONE';
    else if (z.role === 'resistance') { const i = res.indexOf(z); z.name = i === res.length - 1 ? 'BREAKOUT EXTENSION TARGET' : z.degree === 'EXTREME' || z.degree === 'HEAVY' ? 'RESISTANCE CEILING' : 'UPPER RESISTANCE'; }
    else { const i = sup.indexOf(z); z.name = i === sup.length - 1 ? 'BREAKOUT EXTENSION TARGET' : z.degree === 'EXTREME' || z.degree === 'HEAVY' || z.degree === 'MODERATE-HEAVY' ? 'KEY SUPPORT BAND' : 'MID-RANGE SUPPORT'; }
  }
  // 0.6 intra-zone levels for MODERATE+ zones; 5.5 core/spike for KEY SUPPORT BAND
  for (const z of zones.filter(z => z.score >= 6)) {
    const span = Math.max(1e-9, z.hi - z.lo);
    const cands: { price: number; source: string }[] = [];
    for (const s of inp.sd.filter(s => !s.rejected && s.tf === '1H' && s.lo >= z.lo && s.hi <= z.hi)) cands.push({ price: (s.lo + s.hi) / 2, source: `1H zone ${s.date}` });
    for (const r of [0.382, 0.618]) cands.push({ price: z.lo + r * span, source: `zone fib ${r}` });
    for (const c of inp.priorDayCloses) if (c.close >= z.lo && c.close <= z.hi) cands.push({ price: c.close, source: `prior close ${c.key}` });
    for (let q = Math.ceil(z.lo * 4) / 4; q <= z.hi; q += 0.25) cands.push({ price: q, source: 'round number' });
    z.intra = cands.map(c => { const f = (c.price - z.lo) / span; return { ...c, type: f <= 0.4 ? 'Intra-Zone Precision Floor' : f >= 0.6 ? 'Intra-Zone Precision Ceiling' : 'Intra-Zone Mid-Anchor' }; });
    if (z.name === 'KEY SUPPORT BAND') {
      const bs = inp.preBars.filter(b => b.low <= z.hi && b.high >= z.lo);
      if (bs.length) { const bodyLo = Math.max(z.lo, Math.min(...bs.map(b => Math.min(b.open, b.close)))), wickLo = Math.min(...bs.map(b => b.low));
        z.core = { lo: bodyLo, hi: z.hi }; if (wickLo < bodyLo) z.spike = { lo: wickLo, hi: bodyLo }; }
    }
  }
  // 9.5 gap scan: gaps >= 0.20 between adjacent MODERATE+ zones, 2+ supporting signals -> GAP IN-FILL LEVEL
  const mod = zones.filter(z => z.score >= 6).sort((a, b) => b.hi - a.hi); const gapFills: { price: number; signals: string[] }[] = [];
  for (let i = 0; i + 1 < mod.length; i++) {
    const top = mod[i].lo, bot = mod[i + 1].hi; if (top - bot < 0.20 * inp.unit) continue;
    const inGap = scored.filter(l => l.price < top && l.price > bot);
    for (const l of inGap) { const sig = inGap.filter(x => Math.abs(x.price - l.price) <= 0.05 * inp.unit).map(x => x.kind);
      if (new Set(sig).size >= 2 && !gapFills.some(g => Math.abs(g.price - l.price) <= 0.05 * inp.unit)) gapFills.push({ price: l.price, signals: [...new Set(sig)] }); }
  }
  // 9.8 re-verification
  let corrected = 0;
  for (const z of zones) if (z.dims.options > 0 && !z.optionDriver) { z.dims = { ...z.dims, options: 0 }; corrected++; }
  const reverify = `Zone Synthesis Re-verification: ${zones.length} zones verified | ${corrected} zones corrected | ${zones.length - corrected} zones unchanged`;
  audit.push(reverify, `zones ${zones.length}: ` + DEGREES.map(([, d]) => `${d} ${zones.filter(z => z.degree === d).length}`).join(', '));
  return { zones, scored, gapFills, reverify, audit };
}
