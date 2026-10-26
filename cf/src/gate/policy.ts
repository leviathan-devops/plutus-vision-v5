/**
 * THE POLICY — derived bars only. A policy without a source file is E_UNCALIBRATED.
 * These values come from the sweeps in calibration/*.json; the file is the authority.
 */
import type { Policy } from "../steps/clef";

export interface PolicySet {
  e1: Policy;
  e2: Policy;
  e3: Policy;
  g3: Policy;
  g4: Policy;
}

/** Placeholder thresholds are NOT allowed at runtime: source+rows are checked. */
function policy(act: number, flag: number, source: string, rows: number, perQuestion: Record<string, number> = {}): Policy {
  if (!source || rows < 1) throw new Error(`E_UNCALIBRATED:${source}`);
  return { act, flag, fail: "closed", perQuestion, source, rows };
}

export const POLICY: PolicySet = {
  e1: policy(0.85, 0.60, "calibration/e1-attest.json", 240, { Z1: 0.90, Z2: 0.90 }),
  e2: policy(0.78, 0.60, "calibration/e2.json", 240, { A3: 0.85, A4: 0.85 }),
  e3: policy(0.78, 0.60, "calibration/e3.json", 240, { D2: 0.80, D3: 0.80 }),
  g3: policy(0.80, 0.60, "calibration/g3.json", 20),
  g4: policy(0.85, 0.60, "calibration/g4.json", 20),
};
