// p2.ts - PILLAR 2: MA confluence grid (5.3.3 :1065-1088).
// EMA/SMA 9,10,20,50,100,200 on completed D1 sessions before the cutoff; clusters of 3+ within 0.15;
// recapture of 50/100/200 within 3 sessions (+2 bonus). Weights per :1077-1084.
import type { Ohlc } from './bars';
import type { Level } from './levels';

const PERIODS = [9, 10, 20, 50, 100, 200];
export const MA_WEIGHT: Record<number, number> = { 200: 3, 100: 2, 50: 1.5, 20: 1, 10: 0.5, 9: 0.5 };
function sma(x: number[], n: number, i: number) { if (i + 1 < n) return NaN; let s = 0; for (let k = i - n + 1; k <= i; k++) s += x[k]; return s / n; }
function emaSeries(x: number[], n: number) { const a = 2 / (n + 1); const o: number[] = []; let e = NaN;
  for (let i = 0; i < x.length; i++) { if (i + 1 === n) e = sma(x, n, i); else if (i + 1 > n) e = a * x[i] + (1 - a) * e; o.push(e); } return o; }

export interface P2Out { levels: Level[]; clusters: { lo: number; hi: number; members: string[]; weight: number; recapture: boolean }[]; recaptures: string[]; asOf: string }

export function pillar2(days: Ohlc[], unit: number): P2Out {
  if (days.length < 200) throw new Error(`P2_INSUFFICIENT_HISTORY: ${days.length} sessions < 200`);
  const c = days.map(d => d.close); const last = days.length - 1;
  const mas: { name: string; n: number; type: 'EMA' | 'SMA'; v: number; series: number[] }[] = [];
  for (const n of PERIODS) {
    const s = c.map((_, i) => sma(c, n, i)); mas.push({ name: `SMA${n}`, n, type: 'SMA', v: s[last], series: s });
    const e = emaSeries(c, n); mas.push({ name: `EMA${n}`, n, type: 'EMA', v: e[last], series: e });
  }
  const recaptures: string[] = [];
  for (const m of mas.filter(m => [50, 100, 200].includes(m.n))) {
    for (let k = last; k > last - 3; k--) if (c[k - 1] < m.series[k - 1] && c[k] > m.series[k]) { recaptures.push(m.name); break; }
  }
  const levels: Level[] = mas.map(m => ({ id: `P2|${m.name}`, pillar: 'P2', kind: 'ma', price: m.v, label: `${m.name} (D1)`, timeframe: 'D',
    source: [`tv-bars D1 closes to ${days[last].key}`], tags: recaptures.includes(m.name) ? ['RECAPTURE ZONE'] : [],
    meta: { weight: MA_WEIGHT[m.n], recapture: recaptures.includes(m.name) } }));
  const sorted = [...levels].sort((a, b) => a.price - b.price); const clusters: P2Out['clusters'] = []; const used = new Set<string>();
  for (let i = 0; i < sorted.length; i++) {
    const grp = sorted.filter(l => l.price >= sorted[i].price && l.price - sorted[i].price <= 0.15 * unit);   // MA cluster 15 pips
    if (grp.length >= 3 && !grp.every(g => used.has(g.id))) {
      grp.forEach(g => used.add(g.id));
      clusters.push({ lo: grp[0].price, hi: grp[grp.length - 1].price, members: grp.map(g => g.id),
        weight: grp.reduce((s, g) => s + (g.meta!.weight as number), 0), recapture: grp.some(g => g.meta!.recapture) });
    }
  }
  for (const cl of clusters) levels.push({ id: `P2|cluster|${cl.lo.toFixed(3)}`, pillar: 'P2', kind: 'ma-cluster', price: (cl.lo + cl.hi) / 2,
    label: `MA cluster ${cl.members.length}x`, timeframe: 'D', source: cl.members, tags: cl.recapture ? ['RECAPTURE ZONE'] : [], meta: { ...cl } });
  return { levels, clusters, recaptures, asOf: days[last].key };
}
