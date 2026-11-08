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

---

<!-- LQZ:CANON-HAND -->
## THE E1-AUTOMATIC STATE BLOCK (2026-10-05 — supersedes the 2026-10-03 block above)

**THE VERIFIED ARTIFACTS (the E1-automatic build).**

| artifact | sha256 (16) | role |
|---|---|---|
| `plutus-vision-v2.pine` | `282517ac622769bd` | THE DELIVERABLE — the sealed v1 + the E1 IP zones + the E2 predicted path (ON) |
| `pine-ide/ide/renderer/plutus-vision-v2.pine` | `282517ac622769bd` | the SERVED copy (in sync) |
| `plutus-vision-v1.pine` | `0d20e8314ce992fc` | the SEALED baseline — `HARD STOP H1` if it drifts |
| `plutus-vision-v0.pine` | `605bff82d3539e9e` | the parity reference (never edited) |

**THE RENDER (the deliverable's observable behaviour).** The 6 labelled institutional-pressure
zones — IP Resistance Ceiling · Upper IP Resistance · Equilibrium Zone · Mid-Range Support · IP
Support Floor · Key IP Support — anchored to the chart's own last bar (`_bAnchor = bar_index`), for the chart's own
trading week; they follow bar replay (the A1 re-drive: census `bars 1614 → 988` on `replayStart`).
The E2 predicted path renders alongside the labels (2 plots · 6 boxes · 101 lines · 2006 labels · 798 segs together) — a continuous jagged line from the spot to the week's extreme.

**THE GATES (the evidence, bound to tool results).**
- `.omp/ct-results.json:1` — the W9 host-live artifact: `overallVerdict: PASS`, 7/7 angles (A1-A7),
  `artifactSha256 282517ac622769bd…`.
- `TESTING_LOG.md:1541` — the P5 adversarial pass + `AUDIT GATE: PASS`.
- `RUNTIME_LEDGER.md:1` — what RUNNING taught (the A1 replay-follow, the renderer limits, the
  anchor law).
- `Checkpoints/v2-working-baseline-2026-10-05/CHECKPOINT_MANIFEST.md:1` — the sealed checkpoint.
- `packages/plutus-vision-e1-automatic/plutus-vision-e1-automatic_DPL1_SPEC.md:1` — the binding
  authority (C1-C16; the corrected C7 command; the items-5/6 footnote).

**THE PER-DOC GUIDE (which canon doc to read for what).**

| doc | role | read it when |
|---|---|---|
| `CURRENT_STATE.md` | the system as it is NOW + the build truth SHAs | first, on any resume |
| `POST-COMPACTION_PROMPT.md` | the resume prompt + the load-bearing anchors | a fresh session boots |
| `BUILD_STATE.md` | the sha chain + the module inventory + the frozen list | verifying a build |
| `EVIDENCE_STATE.md` | per-gate evidence with shas + the honest gaps | checking a claim |
| `DECISION_CHAIN.md` | the operator's rulings VERBATIM + the derived decisions | resolving a fork |
| `NEXT_STEPS.md` | the queued work + the fired ideas | planning the next wave |
| `TASK_QUEUE.md` | every task, its gate, its evidence, its status | tracking progress |
| `CHANGELOG.md` | the wave history (append-only) | reconstructing the timeline |
| `RUNNING_BUILD_LOG.md` | the per-milestone build log (append-only, high frequency) | the moment-of-work record |
| `RUNNING_DEBUG_LOG.md` | the per-defect debug log (append-only) | a symptom→cause lookup |
| `COMPACTION_SURVIVAL.md` | the session record | surviving a compaction |
| `CANON_MANIFEST.md` | THIS file — the index + the state blocks | orienting in the canon |

**THE RESIDUALS (named, not hidden).** The E2 path + the E1 labels cannot paint together (a vela
PineTS renderer limit; E2 defaults off). The `--live` nine-source web harvest is the operator's
opt-in (it times out offline; the fixture path is the deterministic default). C16 (the operator's
visual verdict on display `:3`) is the sole unmet criterion.
<!-- /LQZ:CANON-HAND -->
