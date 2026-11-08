# WAVE PLAN — PLUTUS VISION LIQUIDITY
WAVES: 3

## W1 — lqz-core.pine (detection)
- owner: detector-desk
- files (DISJOINT): `plutus-vision-lqz/lqz-core.pine`
- deliverable: shared `lqzLevels` array; `lqzSource` input = V1|V2|both;
  V1 taps the 14 existing LuxAlgo draw sites; V2 implements the candle detector
- gate: compiles on station :9741; `python3 scripts/compare.py` shows ZERO new deltas
- test ids: `test_cluster_merges_within_tol` `test_cluster_rejects_beyond_tol`
            `test_source_select_is_total`

## W2 — lqz-render.pine (output layer)
- owner: render-desk
- files (DISJOINT): `plutus-vision-lqz/lqz-render.pine`
- deliverable: full-width zone emitter, side→colour, thickness rule
- gate: every zone left edge ≤ `bar_index-500`, right edge ≥ `bar_index+20`
- depends on: W1's exported array (interface only, not implementation)
- test ids: `test_zone_spans_full_width` `test_colour_by_side`

## W3 — lqz-ab.mjs + lqz_ab.py (split test)
- owner: rig-desk
- files (DISJOINT): `scripts/lqz-ab.mjs` `scripts/lqz_ab.py`
- deliverable: runs both detectors on identical bars, prints the zone sets + a diff
- gate: `bun scripts/lqz-ab.mjs` emits two JSON zone lists and a non-empty diff
- depends on: W1 + W2 (integration wave — the only serial point)
- test ids: `test_ab_diff_is_measurable` `test_ab_shares_output_layer`
