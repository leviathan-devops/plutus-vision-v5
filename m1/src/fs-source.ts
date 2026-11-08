// fs-source.ts - the disk BarSource for M1 runs (Bun). The Worker uses an HTTP BarSource over the same layout.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import type { Bar, BarSource } from './bars';
export const STORE = process.env.PV_BAR_STORE ?? `${process.env.HOME}/.local/share/pinebox/data/tv-bars`;
const TF: Record<string, string> = { '1H': '60', '4H': '240', '1D': '1D', '15m': '15', '30m': '30' };
export function fsSource(root = STORE): BarSource {
  return {
    async months(symbol, tf) { const d = `${root}/${symbol}/${TF[tf] ?? tf}`; if (!existsSync(d)) throw new Error(`BARS_STORE_ABSENT: ${d}`); return readdirSync(d).filter(f => f.endsWith('.json')).map(f => f.slice(0, 7)); },
    async month(symbol, tf, ym) { return JSON.parse(readFileSync(`${root}/${symbol}/${TF[tf] ?? tf}/${ym}.json`, 'utf8')) as Bar[]; },
  };
}
