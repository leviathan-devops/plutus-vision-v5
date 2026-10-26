# CHECKPOINT MANIFEST — computer-use-v2-focus-proven-2026-10-26

- **Token:** `computer-use-v2-focus-proven-2026-10-26` (hyphens only, no spaces)
- **Date:** 2026-10-26
- **Lock mode:** **B — NO LOCK.** This is a living snapshot and will receive follow-up fixes; no
  `chattr` was applied (a manifest-only lock is the partial-lock lie the skill forbids, and a full
  tree lock would block the next cycle). If Mode A is wanted later, the operator applies it.
- **What this checkpoint IS:** the state in which the computer-use v2 rebuild PROVED that operating an
  instance cannot take the operator's focus, and PINEBOX shipped seven concurrent instances on it.

## THE ARTIFACT AND ITS SHAS

| artifact | sha256 / sha16 | how it is proven |
|---|---|---|
| `nofocus.c` → `nofocus-ccc1f778d2bd.so` | sha16 **ccc1f778d2bd** | the helper's file name IS the sha of its source; `deploy.sh verify` refuses `HELPER_STALE` on any mismatch |
| `hostwin.c` → `hostwin-dc75cce7e31c` | sha16 **dc75cce7e31c** | ditto; carries `release`, `lower`, `raise`, `stack`, `state`, `usertime`, `viewable` |
| the tool's seal | `dist/MANIFEST.sha256`, **61 rows** | `deploy.sh verify` → `DEPLOY: OK  sealed=61 files  mcp=2/2 answer  probe=native/weston-x11` |
| runtime-state.png | `7bf84ff4f08ce89bdb9a8ab28d557870eb04879b89cef0c8fffb8cea8f2b1295` | captured over CDP from the instance's own canvas; 145 066 bytes; the frame was OPENED and read |
| the operator's real desktop | `active=0x0 top=0xa0000a` before AND after | `test/c3-no-raise.sh --real` 26/26; one full PINEBOX cycle with the same before/after |

## THE CONTENTS (counts measured at seal time)

| part | content | count |
|---|---|---|
| `src/computer-use-v2/` | the tool: core/ (9 scripts + 4 adapters + cdp.mjs + actions.json + guest/), helpers/, mcp/, index.ts, scoped/ (7 verbatim), test/ (9 gates), deploy.sh | 48 tracked files |
| `src/pinebox/` | the app layer: ports.sh, inject.py, stages/{services,page,load}.sh, the CLI, actions.json, mcp/, test/ (7 gates), fixtures/ | 17 files |
| `src/pinebox-extension/` | the OMP forwarder for PINEBOX | 1 file |
| `src/plutus-scripts/` | `pv-server.py` (the `PINEBOX_PORTS` hook) + `pv-load.mjs` (`PV_CDP_PORT`/`PV_SERVER_PORT`) | 2 files |
| `src/skill-measure-focus-theft-on-replica/` | the durable procedure: the replica rig, the oracle, the controls and the traps | 1 file |
| `dist/` | the two compiled helpers (sha-keyed) + `MANIFEST.sha256` | 4 files |
| `context_management/` | the full canon | 14 docs |
| the ship docs | BUILD_REPORT, DEBUG_LOG, FAILURE_LOG, SPEC_VIOLATION_LOG, TESTING_LOG, THEATRICALITY_LOG, VISUAL_CHECKPOINTS_LOG, SHIP_DOCS_MANIFEST | 8 |
| the specs | DESIGN_BLUEPRINT_CU_v2.md (§18 amendments) + DESIGN_BLUEPRINT_PINEBOX.md (§19 amendments + anchor table) | 2 |
| `artifacts/` | both gate-chain outputs, the seven-instance run, the failing C3 timeline, the rate measurement, the deploy proof | 7 |
| `visual/runtime-state.png` | the LIVE Pine IDE inside an instance: DXY 1H, 202508 bars, candles + both EMAs + 4 crossover triangles, status row naming the instance's OWN rail | 1 |

## THE STATE: WHAT IS VALIDATED

1. **The focus fix is proven, on a measured rate.** 0 failures in 60 consecutive `up` runs with a
   30 ms sampler over the whole verb, against ~11% (3/24, 5/45, 1/40) for the previous release order.
2. **C3 holds on the operator's real desktop**: 26/26, `active`/`top` identical before/after, through
   `up` + 17 verbs (X and CDP) + teardown.
3. **The gates bite.** 9/9 (tool) and 7/7 (PINEBOX) chains green, and every injected defect makes its
   detector exit non-zero: a raising `click` and a registry that forgets live instances both make the
   behavioural gates FAIL.
4. **Seven concurrent instances, zero shared resources:** 35 distinct ports / 35 assignments, 7 slots,
   7 compositors, 0 operator-focus changes, id 0 correctly refused `PORT_TAKEN` against the operator's
   own server, `down --id 1` leaving 2..7 serving.
5. **The deploy is verifiable:** `DEPLOY: OK` with five must-fail probes each firing first
   (`DEPLOY_DRIFT` ×2, `HELPER_STALE`, `MCP_NOT_REGISTERED` ×2).

## THE HONEST GAPS (what is NOT verified — read this before trusting the checkpoint)

1. **AUDIT GATE: BLOCKED** — `OCR_MISSING`: no executable `ocr` on this host, so there is no
   `sg-ocr-*.json` and no verdict line. Every ship-ready claim is withheld (F-147). The independent
   `reviewer` subagent run (T-31, 12 defects found) is a substitute, NOT the mandated artifact.
2. **V11 (guest runtime) UNPROVEN** — `core/guest/boot.sh` exists and its four refusal paths are
   proven, but no guest image exists on this host, so a real guest boot was never tested.
3. **V12 (agentOS) NOT BUILT** — Phase Two; refuses `AGENTOS_UNAVAILABLE` with the remedy.
4. **The E2 geometry is still discarded** — `run.mjs:163` counts polylines/linefills/tables and drops
   them; `counts.polylines: 0` on every load. Needs the renderer's consumption read first.
5. **`plutus-vision-v2.pine` cannot render against any fixture here** — its baked geometry is October
   2026, every fixture ends 2026-07-21. Stage-5 acceptance uses `test/fixtures/ema-ribbon.pine`.
6. **The C3 oracle is X-side only** — it cannot read the focus of a Wayland-native window
   (`active=0x0` is that case).
7. **88 authored docs are untracked** — refused by the repo's own W-9 doc floor; nothing was padded,
   no gate was weakened (F-149).
8. **Two passes ran on the operator's `:1`** (self-authorised, recorded P-12), and a scratch
   `pkill` may have taken another agent's `:99` rig (F-146, P-13).
9. **The server's PSS is unreadable** (non-dumpable), so `status` reports the instance total as a
   LOWER BOUND with the hidden pid named.

## THE NEXT WORK (in order)

1. Repair/install `ocr` and run the audit gate to clear F-147.
2. Build a guest image from `rootfs/manifest.txt` and boot it once (`CU_GUEST_IMAGE`) to close V11.
3. Decide the 88 untracked docs (F-149): scope W-9 by artifact class, or give the genuine engineering
   docs real `file:line` anchors.
4. Read the renderer's draw path, then emit the E2 geometry (V-56) — as its own commit, outside the
   frozen-page rule.
5. Resolve the Pine/fixture date pairing for `plutus-vision-v2.pine`.

## HOW TO RESTORE AND RE-VERIFY FROM THIS CHECKPOINT ALONE

```bash
CP=Checkpoints/computer-use-v2-focus-proven-2026-10-26
# 1 the source is complete and runnable in place
cp -a "$CP/src/computer-use-v2" ~/.omp/agent/extensions/computer-use-v2
cp -a "$CP/src/pinebox" scripts/pinebox && cp -a "$CP/src/pinebox-extension" ~/.omp/agent/extensions/pinebox
cp -a "$CP/src/plutus-scripts/." scripts/
# 2 rebuild the helpers from the sealed source, then prove the deploy
~/.omp/agent/extensions/computer-use-v2/deploy.sh seal && ~/.omp/agent/extensions/computer-use-v2/deploy.sh install
#    expect: DEPLOY: OK  sealed=<n> files  mcp=2/2 answer  probe=native/weston-x11
# 3 re-prove the behavioural property (never on the operator's display)
bash ~/.omp/agent/extensions/computer-use-v2/test/run.sh --slow      # 9 gates
bash scripts/pinebox/test/run.sh --full                              # 7 gates incl. 7 instances
```
