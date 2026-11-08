# CANON MANIFEST — PLUTUS VISION
Generated: 2026-10-02 03:50 UTC
Indicator sha256: 0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1
Generator: scripts/gen_canon.py (re-run after every milestone)
Docs:
- POST-COMPACTION_PROMPT.md (69 lines) — overwrite
- CURRENT_STATE.md (203 lines) — overwrite
- NEXT_STEPS.md (73 lines) — overwrite
- TASK_QUEUE.md (43 lines) — overwrite
- BUILD_STATE.md (163 lines) — overwrite
- CHANGELOG.md (22 lines) — append
- COMPACTION_SURVIVAL.md (36 lines) — overwrite
- EVIDENCE_STATE.md (54 lines) — overwrite
- DECISION_CHAIN.md (34 lines) — overwrite
- RUNNING_BUILD_LOG.md (23 lines) — append
- RUNNING_DEBUG_LOG.md (29 lines) — append


---

## STATE BLOCK — 2026-10-03 (supersedes every earlier SHA in this document)

**THE VERIFIED ARTIFACT**
```
plutus-vision-v1.pine   sha256 0d20e8314ce992fc   1270 lines   SERVED_PINE_OK
```
This is the operator-approved state. Any SHA named above this block that disagrees is
HISTORICAL and is preserved as history, not current truth.

**THE SHIP**
```
Checkpoints/v1-working-baseline-2026-10-03/        the V1 WORKING BASELINE checkpoint
Checkpoints/v1-ship-2026-10-02/PLUTUS_VISION_SHIP_v1.1.zip
Checkpoints/v1-visual-clean-2026-10-02/            the pre-calibration visual save
```

**WHAT CHANGED TO REACH IT (each measured on the rig, EURUSD 1H W29)**
- The render emits FILLED ZONES, not hairlines (the library's median band is 5.5px; ours was 1px).
- `vision.mjs` reads BOTH `bgcolor` and `color` — the engine emits a box fill under `color`,
  so every LQZ box was arriving with no fill (measured `boxesWithBgColor: 0` of 39).
- The merge key is PRICE (was SIDE) — opposite-side levels could never merge, which produced
  pairs of identical bands in opposite colours.
- Side is assigned ONCE from the merged band (was derived per-sink from `price >= close`).
- The invented "Buy/Sellside Liquidity" labels are REMOVED.
- LIQUIDITY IS ONE GREEN CLASS. It was being coloured red/teal by positional side, which is
  why the chart banded: top looked like supply, bottom like demand.

**THE MEASURED RENDER (the numbers, not the prose)**
```
LQZ zones 27 (all green #2E8B57)   overlapping pairs 0   cross-side overlaps 0
identical duplicate bands 0        labels 24 (the SMC's own)  LuxAlgo SMC boxes 5 (untouched)
```

**HONEST GAPS — WHAT IS NOT IN THIS ARTIFACT**
- Engine 1 and Engine 2 from the v5.3.3 prompt are ABSENT. The grep census over the artifact
  reads 0 for ZFP, BoM/MoM, the reaction counter, the fortress phase, the IPZone record, all
  three pivot variants, the option-wall tiers, analyst tiering, the shape taxonomy, the shape
  decision matrix, the ZFP-conditioned transitions, consolidation phase, day decomposition, the
  forward mapping procedure, the speed rule and TF matching. The full census, the 23-item scope
  and the 6-wave plan are in `artifacts/PLUTUS_VISION_V2_E1E2_SPEC.md`.
- The LuxAlgo SMC supply/demand (5 boxes) is UNVERIFIED against the operator's canon notes
  beyond "it renders"; the origin-candle mapping has NOT been independently checked.
- The carried-forward ship docs describe an EARLIER baseline and are NOT a current verification
  of this artifact.
