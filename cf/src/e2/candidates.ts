/**
 * E2 CANDIDATES — code-built spans over attested zones. The judge can subtract,
 * never invent a span, a level, or a shape.
 */
import { anatomyOf, licensed, type Candidate } from "./chain";
import type { Zone } from "../card/schema";
import type { WeekWindow } from "../e1/context";
import type { Bars } from "../e1/build";
import { Fatal } from "../steps/errors";

/**
 * Build one candidate per contiguous movement into an attested zone. The span is
 * measured from the 1H bars, its target ZFP is the zone's, and its direction is
 * the side the zone can serve. No bar is read after the window's anchor.
 */
export function candidatesFrom(bars1h: Bars, zones: Zone[], window: WeekWindow): Candidate[] {
  const n = bars1h.ts.length;
  if (n < 4) throw new Fatal("E2_BARS_SHORT", { have: n });
  const out: Candidate[] = [];
  for (const z of zones) {
    const targetIdx = bars1h.ts.findIndex((t) => t >= z.mid - 0.00001 && t <= z.mid + 0.00001);
    if (targetIdx < 1) continue;
    const startIdx = Math.max(0, targetIdx - 3);
    const endIdx = Math.min(n - 1, targetIdx + 1);
    const ts = bars1h.ts.slice(startIdx, endIdx + 1);
    const open = bars1h.open.slice(startIdx, endIdx + 1);
    const high = bars1h.high.slice(startIdx, endIdx + 1);
    const low = bars1h.low.slice(startIdx, endIdx + 1);
    const close = bars1h.close.slice(startIdx, endIdx + 1);
    const startTs = ts[0];
    const endTs = ts[ts.length - 1];
    if (startTs === undefined || endTs === undefined) continue;
    if (ts.length < 2 || endTs > window.anchor) continue;
    const direction: Candidate["direction"] = z.role === "CEILING" || z.role === "UPPER RESISTANCE" ? "down" : "up";
    const anatomy = anatomyOf(close, high, low, open);
    const span: Candidate = {
      id: `${z.id}:${startTs}-${endTs}`,
      shape: "SS",
      target: z.id,
      targetZfp: z.zfp,
      targetRole: z.role,
      direction,
      startTs,
      endTs,
      licensed: licensed(anatomy, z.zfp < 20 ? "<20" : z.zfp < 30 ? "20-30" : z.zfp < 40 ? "30-40" : z.zfp < 45 ? "40-45" : z.zfp < 60 ? "45-60" : z.zfp < 80 ? "60-80" : ">80"),
      anatomy,
      prev: null,
    };
    if (span.licensed.length) out.push(span);
  }
  return out;
}
