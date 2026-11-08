# VISUAL CHECKPOINTS LOG — the runtime-state library

**The rule (the operator's ruling 2026-10-05):** EVERY checkpoint saved carries a VISUAL ARTIFACT
(a `visual/runtime-state.png` — a screenshot of the project's LIVE runtime state at the checkpoint
moment). This log is the LIBRARY: a visual history of the build through its iterations, so a state
can be recognised and RESTORED from visual semantics ("I remember it looked like X — get that
checkpoint"). This is the foundation for later visually-semantically-integrated graphs.

| # | date | checkpoint | visual | sha256 | the state depicted |
|---|---|---|---|---|---|
| 1 | 2026-10-02 | `v1-ship-approved-working-baseline` | `visual/runtime-state.png` | `e7f10ef97111735d` | **V1 SHIP-APPROVED**: the operator's approved baseline — candle liquidity + LuxAlgo SMC (the sealed v1, sha 0d20e831). 31 boxes · 13 labels. |
| 2 | 2026-10-05 | `v2-working-baseline-2026-10-05` | `visual/runtime-state.png` | `ca45faa8a4b4aee5` | **V2 WORKING BASELINE**: the V1 baseline + the 5 E1 institutional-pressure zones (IP Resistance Ceiling\|Heavy → IP Support Floor\|Moderate-Heavy), red/orange/teal, on DXY. 37 boxes · 20 labels. |

## How to add an entry
When saving a checkpoint: capture the LIVE runtime (the product as it renders/runs), save it as the
checkpoint's `visual/runtime-state.png`, and append a row above — the date, the checkpoint token,
the image path, its `sha256sum`, and a ONE-LINE description of the state depicted.

## How to restore from visual semantics
Scan the `visual/` images in this library; match the state you remember ("it looked like X"); open
that checkpoint; the `dist/` artifact + the manifest's fingerprints restore the exact state. The
image is the recognition key; the SHA is the certainty.

## THE LIBRARY — the full record

The visual library is the build's visual memory. Each checkpoint's `visual/runtime-state.png` is a
snapshot of the runtime at that milestone; the table above records each with its SHA. The purpose is
twofold:

1. **RECOGNITION.** Scan the images; match the state you remember ("it looked like X"); open that
   checkpoint.
2. **RESTORE FROM VISUAL SEMANTICS.** The image is the recognition key; the `dist/` artifact + the
   manifest fingerprints are the certainty. Recover the exact byte state.

This is the FOUNDATION for later visually-semantically-integrated graphs: a corpus of runtime images
tagged by state, from which a build's evolution can be traced and a prior state restored by its
visual signature.

## THE CHECKPOINTS IN THE LIBRARY

### v1-ship-approved-working-baseline (2026-10-02)

The operator's APPROVED baseline — "the plutus vision indicator w plutus lqz looks good." The sealed
`plutus-vision-v1.pine` (sha `0d20e8314ce992fc`, 1270 lines): the candle liquidity + the LuxAlgo SMC
S/D zones. Visual: `Checkpoints/v1-ship-approved-working-baseline/visual/runtime-state.png`
(sha `e7f10ef97111735d`). 31 boxes · 13 labels. The recoverable baseline BEFORE the E1 build.

### v2-working-baseline-2026-10-05 (2026-10-05)

The V2 working baseline — the E1 institutional-pressure zones rendered ON TOP OF the V1 baseline.
`plutus-vision-v2.pine` (sha `5c4db077bc4d089b`, 1664 lines) = the sealed v1 + the E1 layer (the 5
roles: IP Resistance Ceiling | Heavy → IP Support Floor | Moderate-Heavy, red/orange/teal, on DXY).
Visual: `Checkpoints/v2-working-baseline-2026-10-05/visual/runtime-state.png`. 37 boxes · 20 labels.

## THE RULE (how every future checkpoint joins the library)

1. Capture the LIVE runtime (the product as it renders/runs) — the container screenshot, the browser
   CDP capture, the chart TUI, the app window.
2. Save it as the checkpoint's `visual/runtime-state.png`.
3. Append a row to the table: the date, the checkpoint token, the path, the sha256, the one-line state.
4. The skill `saving-checkpoints` (STEP 8) mandates this — a checkpoint without its visual artifact is
   INCOMPLETE.

## THE ANCHORS (file:line)

- `Checkpoints/v1-ship-approved-working-baseline/visual/runtime-state.png` — the v1 visual.
- `Checkpoints/v2-working-baseline-2026-10-05/visual/runtime-state.png` — the v2 visual.
- `Checkpoints/v2-working-baseline-2026-10-05/CHECKPOINT_MANIFEST.md:1` — the v2 manifest.
- `context_management/CURRENT_STATE.md:1` — the visual-library note.
verification: each `visual/runtime-state.png` depicts the live runtime; `sha256sum` recorded above.
SEE `Checkpoints/v1-ship-approved-working-baseline/CHECKPOINT_MANIFEST.md:1` for the approved V1.

## THE PRINCIPLE (why a visual artifact is mandatory)

A checkpoint's text manifest records SHAs, states, and honest gaps — but a reader must TRUST the
text. A visual artifact is the ONE piece of evidence a human can verify at a glance: does the
runtime actually look like the manifest claims? The image closes the gap between "the manifest says
it renders the 5 zones" and "I can SEE the 5 zones." It is the same principle as the anti-theatrical
law applied to checkpoints: a claim without its observable evidence is incomplete, and for a visual
product the observable evidence IS the render.

## THE FUTURE (visually-semantically-integrated graphs)

This library is the seed corpus for a longer-horizon capability: a visually-semantically-integrated
knowledge graph, where a project's runtime states are indexed by their visual signature as well as
their text. A future agent could: (1) describe a desired state in words; (2) match it against the
visual library; (3) restore the nearest checkpoint; (4) diff the current render against the target
image. The `VISUAL_CHECKPOINTS_LOG.md` + the `visual/runtime-state.png` per checkpoint are the
schema: one row per state, one image per row, one SHA per image. Laying this foundation now means
every future build inherits a visual history for free.

## THE RELATIONSHIP TO THE OTHER SHIP DOCS

| doc | records |
|---|---|
| `BUILD_REPORT.md` | what was built (the text record) |
| `DEBUG_LOG.md` | the bugs + fixes (the text ledger) |
| `FAILURE_LOG.md` | the derailments (the text ledger) |
| `SPEC_VIOLATION_LOG.md` | the spec mappings |
| `TESTING_LOG.md` | the test plan + results |
| `THEATRICALITY_LOG.md` | the form-vs-substance acts |
| `VISUAL_CHECKPOINTS_LOG.md` | THE RUNTIME STATE (the visual record — this doc) |

The visual log is the SHIP DOCS' visual axis: where the others record text, this one records what
the product actually LOOKS like at each milestone.

## THE MAINTENANCE

Append a row per checkpoint. Never rewrite prior rows (append-only, like the other ship docs). The
checkpoint's `visual/runtime-state.png` is the immutable image; the row is its index entry.

## THE HONEST NOTE

This library currently holds TWO entries (the v1 approved + the v2 working baseline). Older
checkpoints (v0, the v1 sub-checkpoints) predate the visual-artifact rule and carry no visual; they
are recorded as PRE-VISUAL in the table above where applicable. Going forward, EVERY checkpoint
carries its visual artifact.
