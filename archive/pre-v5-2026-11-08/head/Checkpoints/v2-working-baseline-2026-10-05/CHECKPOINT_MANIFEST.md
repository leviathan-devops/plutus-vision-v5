# CHECKPOINT MANIFEST — v2-working-baseline-2026-10-05 (updated)

**Date:** 2026-10-05 · **Project:** PLUTUS VISION · **git HEAD:** 4bc81f1
**Seal mode:** NO-LOCK (mutable working snapshot; the v1 SHA is checked by every build — the H1 guard is the seal)
**Milestone:** THE E1 ZONES RENDER WITH LABELS — the v2 working baseline, the E1 label defect
fixed (the E2 path loop was suppressing the label pass; the SMC filled the budget).

## THE ARTIFACT FINGERPRINTS
| artifact | sha256 (16) | what |
|---|---|---|
| `dist/plutus-vision-v2.pine` | `471a7849a18f7bf0` | v1 + the E1 layer + the E2 path (default OFF) |
| `dist/plutus-vision-v1.pine` (the sealed baseline) | `0d20e8314ce992fc` | UNCHANGED — HARD STOP H1 guard |
| `lqz/e1-render.pine` | the E1 render source | the 5 role labels + the box loop |
| `lqz/e2-render.pine` | the E2 render source | the path (loop UNROLLED; default OFF) |
| `visual/e1-labels-render.png` | `49f47f0f037e4d48` | the live render (looked) |
| `desktop/pine-ide` | the Tauri desktop launcher | ONE-COMMAND, 2.9x lighter than Chrome |

## THE STATE (what this checkpoint IS)
- **the spec + the plan + the blueprint** — `spec/plutus-vision-e1-automatic_DPL1_SPEC.md` (the
  BINDING authority, APPROVED 0/8, carrying the corrected C7 command †) · `spec/06-WAVES.md`
  (`WAVES: 10`) · `spec/MASTER_BLUEPRINT.md` · `spec/00-INDEX.md`.
- `plutus-vision-v2.pine` = the SEALED v1 baseline + the E1 institutional-pressure layer +
  the E2 predicted path (togglable).
- The E1 zones render as **5 DISTINCT bands** (no stacking) with the **5.3.3 §5.2.1 role
  labels**: IP Resistance Ceiling · Upper IP Resistance · Equilibrium Zone · Mid-Range Support ·
  IP Support Floor.
- The E1 data derives from the chart's own last bar (the anchor law), not a hardcoded week.
- A first-class DESKTOP app (Tauri) launches the IDE from the terminal on the operator's session.

## THE VALIDATED (measured this session)
- v1 seal intact (`0d20e8314ce992fc`, HARD STOP H1 not tripped).
- battery: ST-18 8/0 · ST-19 10/0 · ST-20 7/0 (the E1 gates green).
- the live render (looked): the 5 labelled zones on the DXY chart, census 34 boxes · 28 lines ·
  6 labels (E2 off).
- the desktop app: `pine-ide` from any cwd; 572 MB RSS vs Chrome 1685 MB.
- **A1 (the live replay rewind) — RE-DRIVEN this session.** The vela replay control is reachable
  at `window.PlutusPineShell.chart.replayControl.ctrl`; `replayStart({from})` → the C11 handler
  fed the truncated series (census `bars 1614 → 988`), `replayStep()` ×3 → the cursor advanced
  (`remaining 626 → 623`, census `→ 991`) and the E1 zones re-anchored; `replayStop()` → `bars 1614`
  (the 5 labels back). The replay-follow is CONFIRMED live. Evidence: `RUNTIME_LEDGER.md` (the A1
  entry) + `.omp/ct-results.json` (the A1 scenario).
- the W9 artifact: `.omp/ct-results.json` — `overallVerdict: PASS`, 7/7 angles (A1-A7), artifact
  sha `471a7849a18f7bf0`, the v1 seal `0d20e8314ce992fc`.
- **spec item 14 wired (2026-10-05)** — `make e1` now runs the nine-source harvest
  (`e1_sources.py → data/e1/sources.json`) BEFORE the extractor (the `harvest → extract → wire →
  build` chain); the extractor merges the harvest's per-source status into the payload's
  `sources` (additive). The zones are OHLC-derived (blueprint §7) so the render is unchanged
  (the v2 sha holds `471a7849a18f7bf0`); the 9 suites stay green. See `DEBUG_LOG` EN-108.

## THE KNOWN CONSTRAINT (named)
- The vela PineTS renderer cannot paint the E2 path lines AND the E1 zone labels together — the
  line geometry suppresses the label pass. `e2Enabled` defaults FALSE; the E1 map (with labels)
  is the default. See DEBUG_LOG EN-104/105.
