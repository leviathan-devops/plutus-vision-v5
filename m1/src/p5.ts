// p5.ts - PILLAR 5: structural extremes, price anchors and liquidity engineering (5.3.3 :1205-1420).
// Step 0 (D1 90/180-day swings, wicks, order blocks, confluent floors/ceilings), 0.45 (LSZ + extension, active
// SL trigger), 0.5 (repeated-extreme magnets, role reversal, institutional magnet), 0f (4H singular-candle S/D with
// BoM/MoM and mitigation), 0g (1H precision anchors by the same singular-candle rule), 0h (minor swings),
// Steps 1-5 price anchors (prior closes, HWC/LWC). Every level is an exact, date-stamped bar value (:1209).
// The swing definition is the 5-bar fractal (2 bars each side) on every timeframe - one rule, every week.
import type { Bar, Ohlc } from './bars';
import { sessionDate } from './window';
import type { Level } from './levels';

const DAY = 86_400_000;
const isSwingLow = (xs: { low: number }[], i: number) => i >= 2 && i + 2 < xs.length && [i - 2, i - 1, i + 1, i + 2].every(k => xs[i].low <= xs[k].low);
const isSwingHigh = (xs: { high: number }[], i: number) => i >= 2 && i + 2 < xs.length && [i - 2, i - 1, i + 1, i + 2].every(k => xs[i].high >= xs[k].high);

export interface Swing { price: number; date: string; t: number; wick: number; side: 'low' | 'high'; qualified: boolean; legacy: boolean }
export interface OrderBlock { side: 'demand' | 'supply'; lo: number; hi: number; from: string; to: string; move: number; days: number; highConviction: boolean }
export interface SdZone { tf: '4H' | '1H'; side: 'demand' | 'supply'; lo: number; hi: number; t: number; date: string; move: number; moveDays: number;
  type: 'BoM' | 'MoM'; mitigations: number; mitigationTimes: number[]; brokenAt: number | null; postConsolidation: boolean; rejected?: string }
export interface Lsz { side: 'demand' | 'supply'; lo: number; hi: number; extLo: number; extHi: number; source: string; date: string; priority: 'ACTIVE SL TRIGGER' | 'STANDARD' | 'HIDDEN'; confluentBoM?: string }
export interface Magnet { price: number; dates: string[]; type: 'Repeated Low Magnet' | 'Repeated High Magnet' | 'Role Reversal Magnet'; bonus: number; institutional: boolean }
export interface P5Out { swings: Swing[]; minorSwings: Swing[]; orderBlocks: OrderBlock[]; lsz: Lsz[]; magnets: Magnet[]; sd: SdZone[]; anchors: Level[]; levels: Level[]; scanDays: number; audit: string[] }

function wickOf(d: Ohlc, side: 'low' | 'high') { return side === 'low' ? Math.min(d.open, d.close) - d.low : d.high - Math.max(d.open, d.close); }

/** Step 0f / 0g: singular origin candle before a strong directional move (>= minMove, lasting >= minDays sessions). */
export function scanSd(bars: Bar[], tf: '4H' | '1H', cutoff: number, minMove = 0.5, minDays = 3): SdZone[] {
  const pre = bars.filter(b => b.time < cutoff); const out: SdZone[] = [];
  const sess = pre.map(b => sessionDate(b.time));
  for (let i = 2; i + 2 < pre.length; i++) {
    for (const side of ['demand', 'supply'] as const) {
      if (side === 'demand' ? !isSwingLow(pre, i) : !isSwingHigh(pre, i)) continue;
      // The move (:1352) is measured from the origin candle to the extreme reached before price returns into the
      // origin candle; it "lasts" for the sessions from the origin until that return (or the cutoff if never).
      const o = pre[i]; let ext = side === 'demand' ? o.high : o.low; let left = false; let j = i + 1;
      for (; j < pre.length; j++) {
        const b = pre[j]; const touches = b.low <= o.high && b.high >= o.low;
        if (left && touches) break;
        if (!touches) left = true;
        if (side === 'demand' ? b.low < o.low : b.high > o.high) break;
        if (side === 'demand' ? b.high > ext : b.low < ext) ext = side === 'demand' ? b.high : b.low;
      }
      const move = side === 'demand' ? ext - o.high : o.low - ext;
      const days = new Set(sess.slice(i + 1, j)).size;
      const next = pre[i + 1];
      const directional = side === 'demand' ? next.close > next.open && next.close > o.high - (o.high - o.low) / 2 : next.close < next.open && next.close < o.low + (o.high - o.low) / 2;
      if (move < minMove || days < minDays || !directional) continue;
      // BoM (:1148): the origin of a new directional leg. MoM (:1149): "formed during an ongoing move ... price paused
      // here then continued". Mechanically: a prior unbroken same-side zone starts a running leg, and the pullback into
      // this candle retraced less than half of that leg (a pause). A >= 0.5 retracement is a new leg -> BoM.
      const prev = [...out].reverse().find(z => z.side === side && z.tf === tf && z.t < o.time && (side === 'demand' ? z.lo < o.low : z.hi > o.high)
        && pre.slice(pre.findIndex(b => b.time === z.t) + 1, i).every(b => side === 'demand' ? b.low >= z.lo : b.high <= z.hi));
      let inside = false;
      if (prev) {
        const between = pre.slice(pre.findIndex(b => b.time === prev.t) + 1, i);
        const legExt = side === 'demand' ? Math.max(...between.map(b => b.high)) : Math.min(...between.map(b => b.low));
        const retrace = side === 'demand' ? (legExt - o.low) / Math.max(1e-9, legExt - prev.lo) : (o.high - legExt) / Math.max(1e-9, prev.hi - legExt);
        inside = between.length > 0 && retrace < 0.5;
      }
      // post-consolidation (:1505): the 6 bars before the origin sit inside a range narrower than the origin-to-extreme move / 4
      const prior = pre.slice(Math.max(0, i - 6), i); const pr = prior.length ? Math.max(...prior.map(b => b.high)) - Math.min(...prior.map(b => b.low)) : Infinity;
      out.push({ tf, side, lo: o.low, hi: o.high, t: o.time, date: new Date(o.time).toISOString().slice(0, 16), move, moveDays: days, type: inside ? 'MoM' : 'BoM',
        mitigations: 0, mitigationTimes: [], brokenAt: null, postConsolidation: pr < move / 4 });
    }
  }
  // mitigation (pre-cutoff): each separate return into the zone after leaving it; broken on a close through the far edge
  for (const z of out) {
    let inZone = true;
    for (const b of pre) {
      if (b.time <= z.t) continue;
      const touches = b.low <= z.hi && b.high >= z.lo;
      if (touches && !inZone) { z.mitigations++; z.mitigationTimes.push(b.time); }
      inZone = touches;
      if (z.side === 'demand' ? b.close < z.lo : b.close > z.hi) { z.brokenAt = b.time; break; }
    }
    if (z.hi - z.lo > 0.40) z.rejected = 'width > 0.40 (:1388)';
  }
  // the same-timeframe opposite-type overlap prohibition (:1359): the later zone is rejected
  for (const z of out) if (!z.rejected) for (const y of out) if (y !== z && !y.rejected && y.side !== z.side && y.t < z.t && !y.brokenAt && y.lo <= z.hi && y.hi >= z.lo) z.rejected = `overlaps ${y.side} ${y.date} (:1359)`;
  return out;
}

export function pillar5(d1: Ohlc[], h4: Bar[], h1: Bar[], cutoff: number, spot: number, priorWeek: Ohlc, weekly: Ohlc[]): P5Out {
  const audit: string[] = [];
  const pre = d1.filter(d => d.key < sessionDate(cutoff));       // completed sessions only; Monday's partial is spot, not structure
  const last = pre[pre.length - 1];
  const t90 = last.from - 90 * DAY, t180 = last.from - 180 * DAY;
  const all = pre.filter(d => d.from >= t180);
  // Step 0a/0b/0c on the 180-day window, flagging legacy (90-180d) swings
  const swings: Swing[] = []; const minor: Swing[] = [];
  for (let i = 0; i < all.length; i++) for (const side of ['low', 'high'] as const) {
    if (side === 'low' ? !isSwingLow(all, i) : !isSwingHigh(all, i)) continue;
    const d = all[i]; const w = wickOf(d, side); const pos = (d.close - d.low) / Math.max(1e-9, d.high - d.low);
    const qualified = w >= 0.15 && (side === 'low' ? pos >= 0.5 : pos <= 0.5);
    const s: Swing = { price: side === 'low' ? d.low : d.high, date: d.key, t: d.from, wick: w, side, qualified, legacy: d.from < t90 };
    (qualified ? swings : minor).push(s);
  }
  // 180-day conditional extension (:1219): keep 90-180d qualified swings only when spot is within 1.0 of one of them
  const ext = swings.some(s => s.legacy && Math.abs(s.price - spot) <= 1.0);
  const sw = swings.filter(s => !s.legacy || ext); const mn = minor.filter(s => !s.legacy);
  audit.push(`P5 Step 0: D1 sessions ${all.length} (180d) | qualified swings ${sw.length} (legacy ${sw.filter(s => s.legacy).length}, 180d extension ${ext ? 'ON' : 'OFF'}) | minor swings ${mn.length}`);
  // Step 0d order blocks on D1
  const ob: OrderBlock[] = []; const win = pre.filter(d => d.from >= (ext ? t180 : t90));
  const bodies = win.map(d => Math.abs(d.close - d.open)).sort((a, b) => a - b); const med = bodies[Math.floor(bodies.length / 2)] ?? 0;
  for (let i = 0; i < win.length; i++) for (const side of ['demand', 'supply'] as const) {
    const bull = side === 'demand';
    let k = i; const base: Ohlc[] = [];
    while (k < win.length && base.length < 3 && (bull ? win[k].close > win[k].open : win[k].close < win[k].open) && Math.abs(win[k].close - win[k].open) >= med) base.push(win[k++]);
    if (!base.length || (i > 0 && (bull ? win[i - 1].close > win[i - 1].open : win[i - 1].close < win[i - 1].open) && Math.abs(win[i - 1].close - win[i - 1].open) >= med)) continue;
    const lo = Math.min(...base.map(b => b.low)), hi = Math.max(...base.map(b => b.high));
    let extp = bull ? hi : lo, extAt = k - 1;
    for (let j = k; j < win.length; j++) { if (bull ? win[j].low < lo : win[j].high > hi) break; if (bull ? win[j].high > extp : win[j].low < extp) { extp = bull ? win[j].high : win[j].low; extAt = j; } }
    const move = bull ? extp - hi : lo - extp; const days = extAt - (k - 1);
    if (move >= 1.0 && days >= 5) ob.push({ side, lo, hi, from: base[0].key, to: base[base.length - 1].key, move, days, highConviction: move >= 2.0 && days >= 10 });
  }
  audit.push(`P5 Step 0d: order blocks ${ob.length} (high-conviction ${ob.filter(o => o.highConviction).length})`);
  // Step 0e confluent floors/ceilings
  const levels: Level[] = [];
  for (const s of sw) {
    const confluent = ob.some(o => (s.side === 'low' ? o.side === 'demand' : o.side === 'supply') && s.price >= o.lo && s.price <= o.hi);
    const tag = s.side === 'low' ? 'Liquidity Sweep Target' : 'Supply Ceiling Target';
    levels.push({ id: `P5|swing|${s.side}|${s.date}`, pillar: 'P5', kind: s.side === 'low' ? 'swing-low' : 'swing-high', price: s.price, label: `D1 swing ${s.side} ${s.date}`,
      timeframe: 'D', formedAt: s.t, source: [`tv-bars D1 ${s.date}`], legacy: s.legacy, side: s.side === 'low' ? 'support' : 'resistance',
      tags: confluent ? [tag, s.side === 'low' ? 'Confluent Floor' : 'Confluent Ceiling'] : [tag], extremeBonus: confluent ? 2 : 1, meta: { wick: s.wick } });
  }
  for (const o of ob) {
    levels.push({ id: `P5|ob|${o.side}|${o.from}|lo`, pillar: 'P5', kind: 'order-block', price: o.lo, label: `D1 ${o.side} OB ${o.from} low`, timeframe: 'D', formedAt: Date.parse(o.from), source: [`tv-bars D1 ${o.from}..${o.to}`], side: o.side === 'demand' ? 'support' : 'resistance', tags: o.highConviction ? ['High-Conviction Order Block'] : [], meta: { ...o } });
    levels.push({ id: `P5|ob|${o.side}|${o.from}|hi`, pillar: 'P5', kind: 'order-block', price: o.hi, label: `D1 ${o.side} OB ${o.from} high`, timeframe: 'D', formedAt: Date.parse(o.from), source: [`tv-bars D1 ${o.from}..${o.to}`], side: o.side === 'demand' ? 'support' : 'resistance', tags: o.highConviction ? ['High-Conviction Order Block'] : [], meta: { ...o } });
  }
  // Step 0f 4H and 0g 1H singular-candle S/D
  const sd = [...scanSd(h4, '4H', cutoff), ...scanSd(h1, '1H', cutoff)];
  // noise rejection (:1387-1391) parts that need no IP map: MoM with 3X+ mitigations; >3 weeks old with no interaction in the last 3 weeks
  for (const z of sd) if (!z.rejected) {
    if (z.type === 'MoM' && z.mitigations >= 3) z.rejected = 'MoM 3X+ mitigated (:1389)';
    else if (cutoff - z.t > 21 * DAY && !z.mitigationTimes.some(t => cutoff - t <= 21 * DAY)) z.rejected = 'older than 3 weeks, no recent interaction (:1390)';
    else if (z.brokenAt) z.rejected = `broken ${new Date(z.brokenAt).toISOString().slice(0, 16)}`;
  }
  audit.push(`P5 Step 0f/0g: 4H zones ${sd.filter(z => z.tf === '4H').length} (live ${sd.filter(z => z.tf === '4H' && !z.rejected).length}) | 1H zones ${sd.filter(z => z.tf === '1H').length} (live ${sd.filter(z => z.tf === '1H' && !z.rejected).length})`);
  for (const z of sd.filter(z => !z.rejected)) for (const edge of ['lo', 'hi'] as const)
    levels.push({ id: `P5|sd|${z.tf}|${z.side}|${z.date}|${edge}`, pillar: 'P5', kind: z.tf === '4H' ? 'sd-4h' : 'sd-1h', price: z[edge], label: `${z.tf} ${z.type} ${z.side} ${z.mitigations}X ${z.date}`,
      timeframe: z.tf, formedAt: z.t, source: [`tv-bars ${z.tf} ${z.date}`], side: z.side === 'demand' ? 'support' : 'resistance', tags: [z.type], meta: { zone: z } });
  // Step 0.45 LSZ + 0.45a extension + 0.45d BoM confluence + 0.45e active trigger
  const lsz: Lsz[] = sw.map(s => {
    const demand = s.side === 'low';
    const lo = demand ? s.price : s.price - 0.05, hi = demand ? s.price + 0.05 : s.price;
    const extLo = demand ? s.price - 0.10 : lo, extHi = demand ? hi : s.price + 0.10;
    const bom = sd.find(z => !z.rejected && z.type === 'BoM' && z.tf === '4H' && (demand ? z.side === 'demand' : z.side === 'supply') && z.lo <= extHi && z.hi >= extLo);
    const near = Math.min(Math.abs(lo - spot), Math.abs(hi - spot)) <= 0.30;
    return { side: demand ? 'demand' : 'supply', lo, hi, extLo, extHi, source: `D1 swing ${s.side} ${s.date}`, date: s.date,
      priority: near ? 'ACTIVE SL TRIGGER' : 'STANDARD', confluentBoM: bom ? `${bom.tf} ${bom.side} ${bom.date}` : undefined } as Lsz;
  });
  for (const l of lsz) levels.push({ id: `P5|lsz|${l.side}|${l.date}`, pillar: 'P5', kind: 'lsz', price: l.side === 'demand' ? l.lo : l.hi, label: `LSZ ${l.side} ${l.date}`, timeframe: 'D',
    formedAt: Date.parse(l.date), source: [l.source], side: l.side === 'demand' ? 'support' : 'resistance', tags: [l.priority, ...(l.confluentBoM ? ['CONFLUENT LIQUIDITY SWEEP + BoM ZONE'] : [])], meta: { ...l } });
  // Step 0.5 magnets
  const magnets: Magnet[] = []; const seen = new Set<string>();
  for (const a of sw) {
    const group = sw.filter(b => b.side === a.side && Math.abs(b.price - a.price) <= 0.05);
    const dates = [...new Set(group.map(g => g.date))];
    const key = `${a.side}|${dates.sort().join(',')}`;
    if (dates.length >= 2 && !seen.has(key)) { seen.add(key);
      const wsum = group.reduce((s, g) => s + g.wick, 0); const price = group.reduce((s, g) => s + g.price * g.wick, 0) / wsum;
      magnets.push({ price, dates, type: a.side === 'low' ? 'Repeated Low Magnet' : 'Repeated High Magnet', bonus: dates.length >= 3 ? 2 : 1.5, institutional: false }); }
    const rr = sw.filter(b => b.side !== a.side && Math.abs(b.price - a.price) <= 0.05);
    if (rr.length && a.side === 'low') { const k2 = `rr|${a.date}|${rr.map(r => r.date).join(',')}`; if (!seen.has(k2)) { seen.add(k2);
      magnets.push({ price: (a.price + rr.reduce((s, r) => s + r.price, 0)) / (1 + rr.length), dates: [a.date, ...rr.map(r => r.date)], type: 'Role Reversal Magnet', bonus: 2, institutional: false }); } }
  }
  for (const m of magnets) { m.institutional = ob.some(o => m.price >= o.lo && m.price <= o.hi);
    levels.push({ id: `P5|magnet|${m.type}|${m.dates.join(',')}`, pillar: 'P5', kind: 'magnet', price: m.price, label: `${m.type} (${m.dates.length})`, timeframe: 'D', source: m.dates.map(d => `tv-bars D1 ${d}`),
      tags: [m.type, ...(m.institutional ? ['Institutional Magnet'] : [])], extremeBonus: m.institutional ? 2 : m.bonus }); }
  // Step 0h minor swings
  for (const s of mn) levels.push({ id: `P5|minor|${s.side}|${s.date}`, pillar: 'P5', kind: 'minor-swing', price: s.price, label: `D1 minor swing ${s.side} ${s.date}`, timeframe: 'D', formedAt: s.t, source: [`tv-bars D1 ${s.date}`], side: s.side === 'low' ? 'support' : 'resistance' });
  // Steps 1-5 price anchors: prior-week daily closes, the prior week close, HWC/LWC of the 90-day weekly closes
  const anchors: Level[] = [];
  for (const d of pre.filter(d => d.key >= priorWeek.key)) anchors.push({ id: `P5|close|${d.key}`, pillar: 'P5', kind: 'prior-close', price: d.close, label: `prior close ${d.key}`, timeframe: 'D', formedAt: d.to, source: [`tv-bars D1 ${d.key}`] });
  const w90 = weekly.filter(w => w.from >= t90 && w.to < cutoff);
  if (w90.length) { const hw = w90.reduce((a, b) => b.close > a.close ? b : a), lw = w90.reduce((a, b) => b.close < a.close ? b : a);
    anchors.push({ id: `P5|HWC|${hw.key}`, pillar: 'P5', kind: 'prior-close', price: hw.close, label: `HWC ${hw.key}`, timeframe: 'W', source: [`tv-bars W ${hw.key}`], tags: ['HWC'] });
    anchors.push({ id: `P5|LWC|${lw.key}`, pillar: 'P5', kind: 'prior-close', price: lw.close, label: `LWC ${lw.key}`, timeframe: 'W', source: [`tv-bars W ${lw.key}`], tags: ['LWC'] }); }
  levels.push(...anchors);
  return { swings: sw, minorSwings: mn, orderBlocks: ob, lsz, magnets, sd, anchors, levels, scanDays: ext ? 180 : 90, audit };
}
