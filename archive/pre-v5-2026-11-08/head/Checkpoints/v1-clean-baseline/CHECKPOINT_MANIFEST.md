# CHECKPOINT MANIFEST — v1-clean-baseline

- **Token:** `v1-clean-baseline` (no spaces) · **Created:** 2026-10-01T16:27:25Z · **Seal:** MODE B (mutable working snapshot — no chattr; do not edit, re-seal as v2)
- **Indicator:** `plutus-vision-v0.pine` sha256 `605bff82d3539e9e5e258da30ba4ec80607a3df7749fb5deb5f4402350f95847` (1520 lines)
- **Contents:** 1521 files, 50M (incl. PineTS node_modules 39M)

## LOAD IT
```
<checkpoint>/launch-pine-ide                      # IDE on display :3 + the v1 indicator (or: PINE_IDE_HOME=<checkpoint> pine-ide)
<checkpoint>/launch-pine-ide <file.pine> GBP/USD 4H   # any indicator / pair / tf (15m 30m 1H 4H; EUR/USD GBP/USD DXY)
<checkpoint>/launch-pine-ide --shot /tmp/x.png        # capture the window for vision-in-the-loop
python3 <checkpoint>/scripts/vil.py                   # the ship gate     python3 <checkpoint>/scripts/compare.py  # parity
```
Prereqs (outside the tree): X display :3 (computer-use-virtual-display skill), node, bun, python3+Pillow, google-chrome-stable, local VLM seat :4171 for the reader.

## STATE (validated / pending)
- VALIDATED: compile · parity SMC 195/195 POOLS 25/25 SWEEPS 258/258 VOIDS 380/500 (oldest evicted) · ViL pipeline gate PASS 15m/30m/1H/4H + battery · self-contained launch (TESTING_LOG R-05).
- PENDING / OPEN: engineer-read deltas D1-D3 (EN-021, R-04) · drawings draggable · no indicator settings menu · no D timeframe · sub-1H tuning · LuxAlgo settings map.

## DOCS IN THIS CHECKPOINT
| doc | lines |
|---|---|
| `BUILD_REPORT.md` | 59 |
| `DEBUG_LOG.md` | 174 |
| `FAILURE_LOG.md` | 60 |
| `SPEC_VIOLATION_LOG.md` | 54 |
| `TESTING_LOG.md` | 282 |
| `THEATRICALITY_LOG.md` | 57 |
| `SHIP_DOCS_MANIFEST.md` | 8 |
| `context_management/BUILD_STATE.md` | 115 |
| `context_management/CANON_MANIFEST.md` | 16 |
| `context_management/CHANGELOG.md` | 22 |
| `context_management/COMPACTION_SURVIVAL.md` | 36 |
| `context_management/CURRENT_STATE.md` | 193 |
| `context_management/DECISION_CHAIN.md` | 34 |
| `context_management/EVIDENCE_STATE.md` | 44 |
| `context_management/NEXT_STEPS.md` | 63 |
| `context_management/POST-COMPACTION_PROMPT.md` | 59 |
| `context_management/RUNNING_BUILD_LOG.md` | 23 |
| `context_management/RUNNING_DEBUG_LOG.md` | 29 |
| `context_management/TASK_QUEUE.md` | 43 |

## KEY FILE SHAS
| file | sha256-16 |
|---|---|
| `plutus-vision-v0.pine` | `605bff82d3539e9e` |
| `launch-pine-ide` | `ff1e3219044776e4` |
| `scripts/pv-ide.sh` | `888b8d346378e6a2` |
| `scripts/pv-load.mjs` | `f7117357a26f7fda` |
| `scripts/pv-server.py` | `096784ce9b89fb1e` |
| `scripts/vil.py` | `a037d8f24d4390b7` |
| `scripts/compare.py` | `fd957e26c7b8522c` |
| `scripts/parity_sweeps.py` | `12cd597ebe9f9f06` |
| `scripts/parity_bisect.py` | `2b9621dd21bdb6b8` |
| `scripts/gen_canon.py` | `8f13d196c823d046` |
| `pine-ide/ide/renderer/pine.html` | `5a9b605ef90d03c3` |
| `pine-ide/pine-ide/vision.mjs` | `cd3d6d47d121cf8b` |
| `pine-ide/pine-ide/gate.mjs` | `8015960811976eec` |
| `pine-ide/pine-ide/pine-ide.mjs` | `6006c29f77c230dc` |
| `pine-ide/pine-station/lib/run.mjs` | `5607c0bfb2bd89f7` |
| `pine-ide/pine-station/server.mjs` | `2fe3fc8775d87c0a` |
| `fixtures/bars/2026-07-06.json` | `0c8f7d7aa3171af8` |
| `sources/smart-money-concepts-smc.pine` | `a8046ad353c1b495` |
| `sources/liquidity-sweeps.pine` | `c81921370a81425e` |
| `sources/liquidity-voids-fvg.pine` | `e2a5223d726f43fa` |
| `sources/buyside-sellside-liquidity.pine` | `6cc2fd6ea98cfa77` |
| `vil/vil-results.json` | `604eb9762dbfbae9` |

## HONEST GAPS
- Canon docs: 9 of 11 below the 200-line canon floor (dense generated data, not padded): see the table above.
- ViL reader is a 4B local model — it confirms presence, it missed D1-D3; the engineer read is the stricter gate.
- VOIDS shows 380 of its 500 slices (one-script 500-box ceiling). 3-4 dropped anchors = SMC source behaviour.
- scripts/sandbox_up.py still hardcodes the live tree (no longer used by the launcher).
- The launcher prints the pids fuser killed on one line (cosmetic).
- Excluded from the copy: pine-ide-fork/ (stale earlier fork), parity_frames/, vision_frames/ (old evidence), *.bak*, station.log, older Checkpoints/.

## NEXT WORK
context_management/NEXT_STEPS.md N-1..N-8 (lock drawings → borderless VOIDS → label size/clip → sub-1H inputs → settings map → settings menu → D timeframe → v2 seal).
