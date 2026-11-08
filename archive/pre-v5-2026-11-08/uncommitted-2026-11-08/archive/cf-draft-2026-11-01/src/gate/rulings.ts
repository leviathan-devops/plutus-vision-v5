/**
 * THE OPERATOR FORKS. Every constant the canon gives as a range, or does not give at all.
 * A run reads these through requireRulings(); while any fork is unruled the run is refused
 * with the fork named. The value shown is the recommended reading — it is not used until the
 * operator flips `ruled` to true, because an unruled constant is an invented number.
 */
import { Refusal } from "../steps/errors";

export interface Ruling<T> {
  id: string;
  value: T;
  ruled: boolean;
  source: string;
}

export const RULINGS = {
  zfpPoint: {
    id: "D1", value: "midpoint" as const, ruled: false,
    source: "master spec 4.3: Appendix B gives ranges; the point within the range is unruled",
  },
  momentumK: {
    id: "D2", value: 0.5, ruled: false,
    source: "master spec 4.3: |ROC5| > k*ATR20 — k is the only unsourced momentum constant",
  },
  zfpClamp: {
    id: "D3", value: [0, 99] as [number, number], ruled: false,
    source: "master spec 4.3: six modifiers sum to +125; the clamp is unruled",
  },
  calibrationTolerancePp: {
    id: "D4", value: 15, ruled: false,
    source: "master spec 4.8: the per-bucket tolerance must be fixed before the calibration run",
  },
  strikeRangePct: {
    id: "D11", value: 0.02, ruled: false,
    source: "B.2 spring_release: 'zone inside the striking range' — the range width is unruled",
  },
  crossPairTolPct: {
    id: "D12", value: 0.05, ruled: false,
    source: "B.2 cross_pair: 'structurally equivalent zone' — the range-position tolerance is unruled",
  },
  clusterTolFrac: {
    id: "D13", value: 0.00004, ruled: false,
    source: "master spec 3.2: levels within 0.004 at DXY ~100 merge — the per-pair fraction is unruled",
  },
} satisfies Record<string, Ruling<unknown>>;

export function requireRulings(): typeof RULINGS {
  const open = Object.values(RULINGS).filter((r) => !r.ruled).map((r) => `${r.id} (${r.source})`);
  if (open.length)
    throw new Refusal(
      "RULING_PENDING",
      "the operator sets ruled:true for each listed fork in cf/src/gate/rulings.ts",
      { open },
    );
  return RULINGS;
}
