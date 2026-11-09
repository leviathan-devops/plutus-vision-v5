// run.ts - one E1 run for (asset, week): R1 identity -> R5 nine pillars -> R6 assemble -> R8 card (+ SHA).
// Usage: bun m1/src/run.ts DXY 2026-07-06   -> m1/out/e1-card-<asset>-<monday>.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { runWindow } from './window';
import { loadBars, dailyBars, weeklyBars, type Bar } from './bars';
import { fsSource } from './fs-source';
import { pillar1, overlappingWeeks } from './p1';
import { pillar2 } from './p2';
import { pillar3and8, type Extraction } from './options';
import { pillar5 } from './p5';
import { pillar6, pillar7 } from './p6p7';
import { assemble, regimeAt } from './assemble';
import { unitFor, pipFor } from './units';

const ROOT = new URL('../../', import.meta.url).pathname;
export const SCHEMA = 'pv-e1-card/1';

export async function runE1(asset: string, monday: string) {
  const w = runWindow(asset, monday); const src = fsSource();
  const unit = unitFor(asset), pip = pipFor(asset);   // pip-parity scale for the canon's absolute constants (m1/src/units.ts)
  const from = w.openUtc - 400 * 86_400_000;
  const h1 = await loadBars(src, asset, '1H', from, w.renderToUtc); const h4 = await loadBars(src, asset, '4H', from, w.renderToUtc);
  const preH1 = h1.filter(b => b.time < w.cutoffUtc);
  const days = dailyBars(preH1); const done = days.filter(d => d.key < monday); const weeks = weeklyBars(done);
  const priorWeek = weeks[weeks.length - 1];
  if (!priorWeek || priorWeek.key >= monday) throw new Error('E1_PRIOR_WEEK_ABSENT');
  const priorDays = done.filter(d => d.key >= priorWeek.key);
  const spot = preH1[preH1.length - 1].close;
  const missing: { protocol: string; reason: string; impact: string }[] = [];
  // P1
  const p1 = pillar1(priorWeek, priorDays, overlappingWeeks(weeks, priorWeek));
  // P2
  const p2 = pillar2(done, unit);
  // P3 + P8 (Protocol A evidence for this asset/week)
  const evPath = `${ROOT}m1/evidence/protocol-a/extraction.json`;
  const x = JSON.parse(readFileSync(evPath, 'utf8')) as Extraction;
  if (!x.published_at.startsWith(monday)) throw new Error(`P3_EVIDENCE_WEEK_MISMATCH: ${x.published_at} vs ${monday}`);
  const pubT = Date.parse(x.published_at);
  // DXY_ref only exists for the DXY map (P3 converts component strikes to DXY); native maps take their own pair's
  // strikes at face value and never load a DXY reference.
  let dxyRef: number | null = null; let dxyRefAt = 'n/a (native strike map)';
  if (asset === 'DXY') {
    const dxy15 = await loadBars(src, 'DXY', '15m', pubT - 86_400_000, pubT + 900_000);
    const ref = [...dxy15].reverse().find(b => b.time <= pubT)!;
    dxyRef = ref.open; dxyRefAt = `TVC:DXY 15m bar ${new Date(ref.time).toISOString()} open (publication ${x.published_at})`;
  }
  const opt = pillar3and8({ extraction: x, asset, unit, dxyRef, dxyRefAt,
    spotSource: `Protocol A table spot at publication ${x.published_at}`, h10Status: `release covering ${priorWeek.key}.. published after the cutoff (Mondays 16:15 ET); prior release stale` });
  if (asset !== 'DXY' && !opt.conversions.length) missing.push({ protocol: 'P3/P8 options', reason: `no ${asset} strikes in the ${x.published_at} Protocol A post`, impact: 'options dimension = 0 for every level' });
  missing.push({ protocol: 'P3/P8 spot', reason: 'Fed H.10 for the prior week is released after the Monday cutoff', impact: 'supplementary publication-instant spots used; confidence bands widened +0.03 (:1115)' });
  // P4
  missing.push({ protocol: 'P4 analyst levels', reason: `no explicit pre-cutoff ${asset} S/R levels found from ING/forex.com/FXStreet (searches logged in m1/evidence/p4-search.json)`, impact: 'Analyst Consensus dimension = 0 for every level' });
  // P5
  const p5 = pillar5(days, h4, h1, w.cutoffUtc, spot, priorWeek, weeks, unit);
  // P6, P7
  const d90 = done.filter(d => d.from >= done[done.length - 1].from - 90 * 86_400_000);
  const p6 = pillar6(priorWeek, p5.swings, { lo: Math.min(...d90.map(d => d.low)), hi: Math.max(...d90.map(d => d.high)) }, pip);
  const p7 = pillar7(opt.conversions);
  missing.push({ protocol: 'P7 ICE/CME', reason: 'supplementary exchange data not acquired', impact: 'arena from the 9-pillar primary mapping fallback (:1432)' });
  // P9 regime
  const ema200 = p2.levels.find(l => l.id === 'P2|EMA200')!.price;
  const closes = done.map(d => d.close);
  const ema200Cross = closes.slice(-4).some((c, i, a) => i > 0 && (a[i - 1] - ema200) * (c - ema200) < 0);
  const regime = regimeAt(spot, priorWeek, closes, ema200Cross);
  const levels = [...p1.levels.map(l => ({ ...l, kind: 'pivot' as const, label: l.name, formedAt: priorWeek.to, source: [l.source] })), ...p2.levels, ...opt.levels, ...p5.levels, ...p6, ...p7.levels];
  const expiryTimes: Record<string, number> = {};
  for (const c of opt.levels) expiryTimes[c.id] = Date.parse(`${c.meta!.date}T14:00:00Z`);
  // The week's expected arena = spot +/- the larger of the prior week's range and the mean range of the last 4 completed
  // weeks (measured per asset per week; no fixed price constant). It bounds this week's BoM targets and the chart band.
  const rs = weeks.slice(-4).map(x => x.high - x.low); const meanR = rs.reduce((s, r) => s + r, 0) / rs.length;
  const half = Math.max(priorWeek.high - priorWeek.low, meanR); const arena = { lo: spot - half, hi: spot + half };
  const asm = assemble({ levels, sd: p5.sd, spot, cutoff: w.cutoffUtc, regime, preBars: preH1.filter(b => b.time >= w.cutoffUtc - 21 * 86_400_000), priorDayCloses: priorDays.map(d => ({ key: d.key, close: d.close })), optionExpiryTimes: expiryTimes, arena, unit });
  const card = {
    schema_version: SCHEMA, asset, week_monday: monday,
    window: { open: new Date(w.openUtc).toISOString(), cutoff: new Date(w.cutoffUtc).toISOString(), end: new Date(w.endUtc).toISOString(), render_from: new Date(w.renderFromUtc).toISOString(), render_to: new Date(w.renderToUtc).toISOString() },
    spot_at_cutoff: spot, regime, unit, pip,
    source_manifest: { bars: asset === 'DXY' ? `TradingView store ${asset} 1H/4H/15m` : `TradingView store ${asset} 1H/4H`, prior_week: priorWeek, prior_days: priorDays, protocol_a: { path: 'm1/evidence/protocol-a/extraction.json', sha256: createHash('sha256').update(readFileSync(evPath)).digest('hex'), image_sha256: x.image.sha256 } },
    pillars: {
      P1: { sets: p1.sets.length, audit: p1.audit }, P2: { asOf: p2.asOf, clusters: p2.clusters, recaptures: p2.recaptures },
      P3P8: { K: opt.K, audit: opt.audit }, P4: 'MISSING', P5: { scanDays: p5.scanDays, audit: p5.audit, sd: p5.sd.filter(z => !z.rejected), orderBlocks: p5.orderBlocks, magnets: p5.magnets, lsz: p5.lsz },
      P6: p6.length, P7: p7.arena, P9: regime },
    zones: asm.zones.map(z => ({ ...z, members: z.members.map(m => ({ id: m.id, pillar: m.pillar, kind: m.kind, price: m.price, label: m.label, total: m.total, why: m.why })) })),
    gap_fills: asm.gapFills, reverify: asm.reverify, missing_data: missing, audit: asm.audit,
    render_policy: { synthesis: 'MODERATE and above', full_output: 'all zones (card)', band: arena,
      basis: `spot ${spot} +/- max(prior-week range ${(priorWeek.high - priorWeek.low).toFixed(3)}, mean 4-week range ${meanR.toFixed(3)}) = +/-${half.toFixed(3)}` },
  };
  const body = JSON.stringify(card, null, 1);
  const sha = createHash('sha256').update(body).digest('hex');
  mkdirSync(`${ROOT}m1/out`, { recursive: true });
  const path = `${ROOT}m1/out/e1-card-${asset}-${monday}.json`;
  writeFileSync(path, JSON.stringify({ sha256: sha, card }, null, 1) + '\n');
  return { path, sha, card };
}

if (import.meta.main) {
  const [asset = 'DXY', monday = '2026-07-06'] = process.argv.slice(2);
  const { path, sha, card } = await runE1(asset, monday);
  console.log(`card ${path} sha256 ${sha}`);
  console.log(card.audit.join('\n'));
  const dec = pip === 0.01 ? 3 : 5;
  for (const z of card.zones.filter(z => z.score >= 4).sort((a, b) => b.hi - a.hi))
    console.log(`${z.id} ${z.lo.toFixed(dec)}-${z.hi.toFixed(dec)} ${z.role} ${z.name} | ${z.degree} ${z.score} | ZFP ${z.zfp}% ${z.zoneType} | ${z.bom ? z.bom.tf + ' ' + z.bom.type + ' ' + z.bom.mitigations + 'X' : '-'} | react ${z.reactionsPreCutoff} | ${z.members.map(m => m.kind).join(',')}`);
}
