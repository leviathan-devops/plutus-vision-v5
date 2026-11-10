export type RefusalToken =
  | "E1_IDENTITY_INVALID"
  | "E1_CUTOFF_VIOLATION"
  | "E1_EVIDENCE_HASH_MISMATCH"
  | "E1_CARD_INVALID"
  | "E1_PILLAR_FAILED"
  | "E1_ORGAN_INPUT_POST_CUTOFF"
  | "E1_OBCV_30M_DATA_MISSING"
  | "E1_LMV_LOOKBACK_TRUNCATED"
  | "E1_ASSET_UNSUPPORTED"
  | "E1_BASE_CARD_MUTATED"
  | "E1_DERIVED_CHAIN_INVALID"
  | "E1_RENDER_BUDGET_EXCEEDED"
  | "E1_COMPOSE_BASELINE_DRIFT"
  | "E1_PROOF_FAILED"
  | "E1_PROOF_UNAVAILABLE";

export class E1Refusal extends Error {
  constructor(readonly token: RefusalToken, readonly detail: string) {
    super(`${token}: ${detail}`);
  }
}
