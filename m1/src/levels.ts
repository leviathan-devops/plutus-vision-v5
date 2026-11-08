// levels.ts - the one level record every pillar emits (blueprint §8.3).
export type Pillar = 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6' | 'P7' | 'P8' | 'P9';
export type Kind = 'pivot' | 'ma' | 'ma-cluster' | 'option' | 'analyst' | 'swing-low' | 'swing-high' | 'order-block' | 'lsz' | 'magnet'
  | 'sd-4h' | 'sd-1h' | 'prior-close' | 'minor-swing' | 'fib' | 'round' | 'arena' | 'intra-zone';
export interface Level {
  id: string; pillar: Pillar; kind: Kind; price: number; label: string;
  timeframe?: string; formedAt?: number; source: string[];
  side?: 'support' | 'resistance';
  legacy?: boolean;            // +0.5 legacy bonus (P1 :1059, P5 :1219)
  tags?: string[];             // canonical tags: 'Liquidity Sweep Target', 'Confluent Floor', ...
  extremeBonus?: number;       // Structural Extreme Bonus contribution (:1476-1484)
  meta?: Record<string, unknown>;
}
export const round5 = (x: number) => Math.round(x * 1e5) / 1e5;
