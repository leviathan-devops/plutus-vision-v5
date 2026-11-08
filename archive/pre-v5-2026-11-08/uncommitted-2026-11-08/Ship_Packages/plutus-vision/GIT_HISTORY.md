# GIT HISTORY — PLUTUS VISION (reconstructed lineage, no .git shipped)

## branch / HEAD
```
branch: step_agent
HEAD:   829287bd0666f0f392b689d21c58bf0bd82866a3
```

## git log --oneline -30
```
829287b feat(pinebox): verify + week — "run the indicator and see if it works" as a predicate
707bf09 docs(canon,ship): this cycle's evidence into both doc sets (U1-U4 green, S1-S7 green, dist 653eea1a)
f4727e0 docs(ship): the computer-use v2 rebuild — EN-140..159, F-142..149, V-45..56, P-12..14, T-31..36, AP-25..32
ea8c45a docs(canon): the bibles, the canon data, handovers and the step docs
ce8c929 chore(repo): anchor the agent-state ignores for nested paths
febe42f docs(checkpoints): checkpoint evidence, visual renders and the JEV gate artefacts
35457af feat(scripts): battle.py, frame_axis.py and the two pinebox prototypes
3287587 test(gates): the enforcement gates and their good/bad fixtures
9b70141 chore(repo): ignore the 1,395 built knowledge cards and the built ship package
97c32c1 chore(repo): ignore the two handover archives (duplicates, and one exceeds GitHub's 100 MB limit)
9c0092d chore(repo): ignore the two branch worktrees, the pine-ide archive, scratch and vendored files
4de2be2 feat(pinebox): the Pine IDE as a multi-instance agent computer, on a computer-use v2 that never takes the operator's focus
0a8bf4f docs(canon): sync the manifest counts after the final log append (17 checks PASS)
17b6dea fix(canon): the manifest is GENERATED — --sync to a fixpoint; two stale docs stamped SUPERSEDED
bb3270c docs(canon): the design+workflow cycle — state, workflow, decisions, evidence (U-gates green, seal 0d20e831)
ea70789 fix(ship): ship desktop/ (the IDE's own shell) + count shipped content, not installed deps
baeba7b docs(ship): EN-139 — the commit gate counts ts/md/json/sh/yml anchors only
8e465b4 feat(pine-ide): the collapsible layout + the backtest resurrection + the 2026.10.14 ship package
c058e3e docs(muse-agent): canon deep-read synthesis + knowledge graph + measured chart exercises
f13516b docs(setup): SETUP.md — the Pine IDE pull + run guide
559ca3b feat(W6): the enriched litmus header — canonical geometry + dead-path audit in every chunk
11c7326 fix(F-138): the E2 transcribed — the full §6 chain in Pine (classify+walk+ghost+days)
94e746a docs(ship): the record refresh — status rows, W6/W7 milestones, violation dispositions
5f4d60a chore(W7): the slump cleanup + the D11 commit — twin/orphans/scratch removed, keepers committed
caef1f9 fix(restore): RESTORE the V2 ship-approved checkpoint (e1-e2-v2-pending-ship-approval-2026-10-06) — v2 87628e54 + v1 seal 0d20e831, the operator's C16-approved render. The W5 rewrite is backed up at /tmp/w5-work-backup.pine.
0b40379 fix(W5): position the 5 zones around the SPOT (the v8: 2 RES above, 1 MID straddling, 2 SUP below); the thin-band fix kept. SC-19 0.
0ab8a29 docs(W5): F-128 (the fat-block zones — a full-height partition, crushing the candles; fixed to thin bands 48548ed) + EN-130 (the vision-in-the-loop skill minted)
48548ed fix(W5): THE FAT-BLOCK DEFECT — the zones were full-height partitions (the whole range), crushing the candles (the operator's screenshot). Now THIN bands at the level's midpoint (9% of the range tall), per the v8's narrow zTp/zBt. SC-19 0, boxes 5.
4630ab3 docs(W6): EN-129 — the render is deterministic (AUTO off; 3 identical runs) + the compute reads the IDE's real bars (510, 98.096-102.013); the multi-week litmus needs the bars reloaded (a harness dataFile param)
8f777e8 docs(W5): EN-128 (the degree ladder matches the v8 structure) + the BUILD_REPORT milestone (Engine 1+2 compute; SC-19 0; 525e2cb)
```

## git diff --stat ea8c45a..HEAD
```
 BUILD_REPORT.md                                    |  127 +
 .../BUILD_REPORT.md                                | 2551 +++++++++++++++
 .../CHECKPOINT_MANIFEST.md                         |   97 +
 .../DEBUG_LOG.md                                   | 3455 ++++++++++++++++++++
 .../DESIGN_BLUEPRINT_CU_v2.md                      |  978 ++++++
 .../DESIGN_BLUEPRINT_PINEBOX.md                    |  913 ++++++
 .../FAILURE_LOG.md                                 | 2510 ++++++++++++++
 .../SHIP_DOCS_MANIFEST.md                          |  103 +
 .../SPEC_VIOLATION_LOG.md                          |  379 +++
 .../TESTING_LOG.md                                 | 2224 +++++++++++++
 .../THEATRICALITY_LOG.md                           |  567 ++++
 .../VISUAL_CHECKPOINTS_LOG.md                      |  130 +
 .../artifacts/c3-failing-timeline.txt              |   33 +
 .../artifacts/deploy-verify.txt                    |    1 +
 .../artifacts/gate-chain-computer-use.txt          |   12 +
 .../artifacts/gate-chain-pinebox.txt               |   10 +
 .../artifacts/pinebox-seven-instances.txt          |   71 +
 .../artifacts/release-order-rate.txt               |    4 +
 .../artifacts/tl-fail-1.txt                        |   30 +
 .../artifacts/tl-fail-2.txt                        |   30 +
 .../context_management/BUILD_STATE.md              |  305 ++
 .../context_management/CANON_MANIFEST.md           |  153 +
 .../context_management/CHANGELOG.md                |  422 +++
 .../context_management/COMPACTION_SURVIVAL.md      |  366 +++
 .../context_management/CURRENT_STATE.md            |  260 ++
 .../context_management/DECISION_CHAIN.md           |  462 +++
 .../context_management/ENGINE_BLUEPRINT.md         |  186 ++
 .../context_management/EVIDENCE_STATE.md           |  487 +++
 .../context_management/NEXT_STEPS.md               |  235 ++
 .../context_management/NEXT_STEPS_BLUEPRINT.md     |  116 +
 .../context_management/POST-COMPACTION_PROMPT.md   |  259 ++
 .../context_management/RUNNING_BUILD_LOG.md        | 1535 +++++++++
 .../context_management/RUNNING_DEBUG_LOG.md        | 1232 +++++++
 .../context_management/TASK_QUEUE.md               |  324 ++
 .../dist/MANIFEST.sha256                           |   61 +
 .../dist/hostwin-dc75cce7e31c                      |  Bin 0 -> 17496 bytes
 .../dist/lib/hostwin                               |  Bin 0 -> 17496 bytes
 .../dist/lib/nofocus.so                            |  Bin 0 -> 16200 bytes
 .../dist/nofocus-ccc1f778d2bd.so                   |  Bin 0 -> 16200 bytes
 .../src/computer-use-v2/MANIFEST.sha256            |   61 +
 .../src/computer-use-v2/computer                   |    3 +
 .../src/computer-use-v2/core/actions.json          |   52 +
 .../src/computer-use-v2/core/adapters/existing.sh  |   38 +
 .../src/computer-use-v2/core/adapters/order        |    4 +
 .../computer-use-v2/core/adapters/weston-vnc.sh    |  102 +
 .../computer-use-v2/core/adapters/weston-x11.sh    |  154 +
 .../src/computer-use-v2/core/adapters/xvfb.sh      |   68 +
 .../src/computer-use-v2/core/cdp.mjs               |  143 +
 .../src/computer-use-v2/core/cli.sh                |  223 ++
 .../src/computer-use-v2/core/drive.sh              |  203 ++
 .../src/computer-use-v2/core/govern.sh             |  151 +
 .../src/computer-use-v2/core/guest/boot.sh         |  100 +
 .../computer-use-v2/core/guest/rootfs/assert.sh    |   20 +
 .../computer-use-v2/core/guest/rootfs/manifest.txt |   24 +
 .../src/computer-use-v2/core/lib.sh                |  181 +
 .../src/computer-use-v2/core/probe.sh              |   45 +
 .../src/computer-use-v2/core/runtime.sh            |   16 +
 .../src/computer-use-v2/core/state-cli.ts          |   46 +
 .../src/computer-use-v2/core/state.sh              |   34 +
 .../src/computer-use-v2/core/surface.sh            |   60 +
 .../src/computer-use-v2/core/terminal.sh           |   38 +
 .../src/computer-use-v2/deploy.sh                  |  109 +
 .../src/computer-use-v2/helpers/build.sh           |   39 +
 .../src/computer-use-v2/helpers/hostwin.c          |  188 ++
 .../src/computer-use-v2/helpers/nofocus.c          |   75 +
 .../src/computer-use-v2/index.ts                   |  130 +
 .../src/computer-use-v2/mcp/server.mjs             |  105 +
 .../src/computer-use-v2/scoped/db-path.ts          |   66 +
 .../src/computer-use-v2/scoped/scope-binding.ts    |  208 ++
 .../src/computer-use-v2/scoped/scope-guard.ts      |  102 +
 .../src/computer-use-v2/scoped/scope-resolver.ts   |  176 +
 .../src/computer-use-v2/scoped/scoped-store.ts     |  201 ++
 .../src/computer-use-v2/scoped/session-state.ts    |   78 +
 .../scoped/workspace-scoping.test.ts               |  284 ++
 .../src/computer-use-v2/test/c3-no-raise.sh        |  177 +
 .../src/computer-use-v2/test/cmp-guard.sh          |   24 +
 .../src/computer-use-v2/test/isolation.sh          |   68 +
 .../src/computer-use-v2/test/leak-check.sh         |   37 +
 .../src/computer-use-v2/test/mcp.sh                |   57 +
 .../src/computer-use-v2/test/mutate.sh             |   70 +
 .../src/computer-use-v2/test/replica.sh            |   94 +
 .../src/computer-use-v2/test/run.sh                |   35 +
 .../src/computer-use-v2/test/strings.sh            |   79 +
 .../src/computer-use-v2/test/subshell-exit.sh      |   69 +
 .../src/computer-use-v2/test/v1.sha256             |    1 +
 .../src/pinebox-extension/index.ts                 |  107 +
 .../src/pinebox/actions.json                       |   39 +
 .../src/pinebox/inject.py                          |  113 +
 .../src/pinebox/mcp/server.mjs                     |   92 +
 .../src/pinebox/pinebox                            |  321 ++
 .../src/pinebox/ports.sh                           |   55 +
 .../src/pinebox/stages/load.sh                     |   40 +
 .../src/pinebox/stages/page.sh                     |   62 +
 .../src/pinebox/stages/services.sh                 |   93 +
 .../src/pinebox/test/fixtures/ema-ribbon.pine      |    9 +
 .../src/pinebox/test/inject.sh                     |   62 +
 .../src/pinebox/test/mcp.sh                        |   51 +
 .../src/pinebox/test/multi.sh                      |  126 +
 .../src/pinebox/test/mutate.sh                     |   44 +
 .../src/pinebox/test/run.sh                        |   30 +
 .../src/pinebox/test/strings.sh                    |   54 +
 .../src/plutus-scripts/pv-load.mjs                 |   88 +
 .../src/plutus-scripts/pv-server.py                |  686 ++++
 .../skill-measure-focus-theft-on-replica/SKILL.md  |   56 +
 .../visual/runtime-state.png                       |  Bin 0 -> 145066 bytes
 DEBUG_LOG.md                                       |  424 +++
 FAILURE_LOG.md                                     |  202 ++
 SHIP_DOCS_MANIFEST.md                              |    7 +-
 SPEC_VIOLATION_LOG.md                              |   17 +
 TESTING_LOG.md                                     |  250 ++
 THEATRICALITY_LOG.md                               |  156 +
 VISUAL_CHECKPOINTS_LOG.md                          |   11 +
 context_management/BUILD_STATE.md                  |   47 +
 context_management/CANON_MANIFEST.md               |    4 +-
 context_management/CHANGELOG.md                    |   28 +
 context_management/COMPACTION_SURVIVAL.md          |   47 +
 context_management/CURRENT_STATE.md                |   47 +
 context_management/DECISION_CHAIN.md               |   32 +
 context_management/EVIDENCE_STATE.md               |   47 +
 context_management/NEXT_STEPS.md                   |   26 +
 context_management/POST-COMPACTION_PROMPT.md       |   47 +
 context_management/RUNNING_BUILD_LOG.md            |   44 +
 context_management/RUNNING_DEBUG_LOG.md            |   53 +
 context_management/TASK_QUEUE.md                   |   20 +
 scripts/pinebox/actions.json                       |  244 +-
 scripts/pinebox/pinebox                            |   17 +
 scripts/pinebox/stages/verify.sh                   |   84 +
 127 files changed, 28812 insertions(+), 36 deletions(-)
```

## git status --short (worktree honesty at package time)
```
 M Ship_Packages/plutus-vision/BUILD_REPORT.md
 M Ship_Packages/plutus-vision/DEBUG_LOG.md
 M Ship_Packages/plutus-vision/DEPLOY.sh
 M Ship_Packages/plutus-vision/FAILURE_LOG.md
 M Ship_Packages/plutus-vision/FULL_BUILD_CONTEXT.md
 D Ship_Packages/plutus-vision/GIT_HISTORY.md
 D Ship_Packages/plutus-vision/MASTER_INDEX.md
 D Ship_Packages/plutus-vision/PACKAGE_AUDIT.md
 D Ship_Packages/plutus-vision/README.md
 D Ship_Packages/plutus-vision/SETUP.md
 M Ship_Packages/plutus-vision/SHIP_DOCS_MANIFEST.md
 M Ship_Packages/plutus-vision/SHIP_MANIFEST.md
 M Ship_Packages/plutus-vision/SPEC_VIOLATION_LOG.md
 M Ship_Packages/plutus-vision/TESTING_LOG.md
 M Ship_Packages/plutus-vision/THEATRICALITY_LOG.md
 M Ship_Packages/plutus-vision/VISUAL_CHECKPOINTS_LOG.md
 D Ship_Packages/plutus-vision/boilerplate/BOILERPLATE_MANIFEST.md
 D Ship_Packages/plutus-vision/boilerplate/modules/collapsible-layout/layout.css
 D Ship_Packages/plutus-vision/boilerplate/modules/collapsible-layout/layout.js
 D Ship_Packages/plutus-vision/boilerplate/modules/proxy-loop-guards/the-guards.patch
 D Ship_Packages/plutus-vision/boilerplate/modules/workspace-persist/pine-persist.mjs
 M Ship_Packages/plutus-vision/context_management/BUILD_STATE.md
 M Ship_Packages/plutus-vision/context_management/CANON_MANIFEST.md
 M Ship_Packages/plutus-vision/context_management/CHANGELOG.md
 M Ship_Packages/plutus-vision/context_management/COMPACTION_SURVIVAL.md
 M Ship_Packages/plutus-vision/context_management/CURRENT_STATE.md
 M Ship_Packages/plutus-vision/context_management/DECISION_CHAIN.md
 M Ship_Packages/plutus-vision/context_management/ENGINE_BLUEPRINT.md
 M Ship_Packages/plutus-vision/context_management/EVIDENCE_STATE.md
 M Ship_Packages/plutus-vision/context_management/NEXT_STEPS.md
 M Ship_Packages/plutus-vision/context_management/NEXT_STEPS_BLUEPRINT.md
 M Ship_Packages/plutus-vision/context_management/POST-COMPACTION_PROMPT.md
 M Ship_Packages/plutus-vision/context_management/RUNNING_BUILD_LOG.md
 M Ship_Packages/plutus-vision/context_management/RUNNING_DEBUG_LOG.md
 M Ship_Packages/plutus-vision/context_management/TASK_QUEUE.md
 D Ship_Packages/plutus-vision/desktop/assets/index.html
 D Ship_Packages/plutus-vision/desktop/icons/plutus-vision.png
 D Ship_Packages/plutus-vision/desktop/icons/plutus-vision.svg
 D Ship_Packages/plutus-vision/desktop/install.sh
 D Ship_Packages/plutus-vision/desktop/pine-ide
 D Ship_Packages/plutus-vision/desktop/pine-ide-webview.py
 D Ship_Packages/plutus-vision/desktop/pine-ide.desktop
 D Ship_Packages/plutus-vision/desktop/pv-servers.sh
 D Ship_Packages/plutus-vision/desktop/tauri/.gitignore
 D Ship_Packages/plutus-vision/desktop/tauri/Cargo.lock
 D Ship_Packages/plutus-vision/desktop/tauri/Cargo.toml
 D Ship_Packages/plutus-vision/desktop/tauri/build.rs
 D Ship_Packages/plutus-vision/desktop/tauri/icons/icon.png
 D Ship_Packages/plutus-vision/desktop/tauri/src/main.rs
 D Ship_Packages/plutus-vision/desktop/tauri/tauri.conf.json
 D Ship_Packages/plutus-vision/fixtures/bars/2026-04-20.json
 D Ship_Packages/plutus-vision/fixtures/bars/2026-07-06.json
 D Ship_Packages/plutus-vision/fixtures/bars/2026-07-06.validated-harvest.json
 D Ship_Packages/plutus-vision/fixtures/bars/EURUSD-live.json
 D Ship_Packages/plutus-vision/fixtures/bars/_current.json
 D Ship_Packages/plutus-vision/fixtures/bars/cv-2026-04-13.json
 D Ship_Packages/plutus-vision/fixtures/bars/cv-2026-05-04.json
 D Ship_Packages/plutus-vision/fixtures/bars/cv-2026-06-15.json
 D Ship_Packages/plutus-vision/fixtures/bars/cv-2026-06-29.json
 D Ship_Packages/plutus-vision/fixtures/bars/cv-2026-08-24.json
 D Ship_Packages/plutus-vision/fixtures/bars/dxy-full-to-jul21.json
 D Ship_Packages/plutus-vision/fixtures/bars/pv-long.json
 D Ship_Packages/plutus-vision/pine-ide/charts/build.mjs
 D Ship_Packages/plutus-vision/pine-ide/charts/trade.html
 D Ship_Packages/plutus-vision/pine-ide/charts/workbench-dev.html
 D Ship_Packages/plutus-vision/pine-ide/charts/workbench.bundle.js
 D Ship_Packages/plutus-vision/pine-ide/charts/workbench.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/_w14dxy.pine
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/_w14eu.pine
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/agent-tab.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/app.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/browser-polyfill.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/browser-tab.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/charts/build.mjs
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/charts/trade.html
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/charts/workbench-dev.html
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/charts/workbench.bundle.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/charts/workbench.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/display-surface.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/index.html
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/lqz-luxalgo.pine
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/lqz-plutus.pine
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/mock-data.json
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/mt5-tab.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/error-handler.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/alt.svg
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/clipboard.svg
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/connect.svg
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/ctrl.svg
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/ctrlaltdel.svg
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/disconnect.svg
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/drag.svg
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/error.svg
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/esc.svg
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/expander.svg
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/fullscreen.svg
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/handle.svg
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/handle_bg.svg
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/icons/Makefile
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/icons/novnc-120x120.png
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/icons/novnc-144x144.png
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/icons/novnc-152x152.png
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/icons/novnc-16x16.png
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/icons/novnc-192x192.png
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/icons/novnc-24x24.png
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/icons/novnc-32x32.png
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/icons/novnc-48x48.png
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/icons/novnc-60x60.png
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/icons/novnc-64x64.png
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/icons/novnc-72x72.png
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/icons/novnc-76x76.png
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/icons/novnc-96x96.png
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/icons/novnc-icon-sm.svg
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/icons/novnc-icon.svg
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/info.svg
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/keyboard.svg
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/power.svg
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/settings.svg
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/tab.svg
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/toggleextrakeys.svg
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/warning.svg
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/images/windows.svg
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/locale/README
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/locale/cs.json
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/locale/de.json
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/locale/el.json
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/locale/es.json
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/locale/fr.json
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/locale/ja.json
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/locale/ko.json
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/locale/nl.json
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/locale/pl.json
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/locale/pt_BR.json
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/locale/ru.json
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/locale/sv.json
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/locale/tr.json
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/locale/zh_CN.json
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/locale/zh_TW.json
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/localization.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/sounds/CREDITS
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/sounds/bell.mp3
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/sounds/bell.oga
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/styles/Orbitron700.ttf
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/styles/Orbitron700.woff
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/styles/base.css
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/ui.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/app/webutil.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/core/base64.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/core/decoders/copyrect.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/core/decoders/hextile.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/core/decoders/raw.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/core/decoders/rre.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/core/decoders/tight.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/core/decoders/tightpng.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/core/deflator.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/core/des.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/core/display.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/core/encodings.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/core/inflator.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/core/input/domkeytable.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/core/input/fixedkeys.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/core/input/gesturehandler.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/core/input/keyboard.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/core/input/keysym.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/core/input/keysymdef.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/core/input/util.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/core/input/vkeys.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/core/input/xtscancodes.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/core/rfb.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/core/util/browser.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/core/util/cursor.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/core/util/element.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/core/util/events.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/core/util/eventtarget.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/core/util/int.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/core/util/logging.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/core/util/strings.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/core/websock.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/vnc.html
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/novnc/vnc_lite.html
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/pine.html
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/plutus-vision-v0.pine
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/plutus-vision-v1.pine
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/plutus-vision-v2.pine
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/styles.css
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/tab-manager.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/tabs/_agent-desk.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/tabs/_rail.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/tabs/_shell.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/tabs/_term-bridge.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/tabs/backtest-persist.mjs
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/tabs/backtest-persist.selftest.mjs
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/tabs/backtest.css
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/tabs/backtest.html
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/tabs/backtest.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/tabs/journal.css
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/tabs/journal.html
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/tabs/journal.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/tabs/pineshell.css
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/tabs/pineshell.html
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/tabs/pineshell.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/toast.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/tokens.css
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/trade-canvas.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/trade-chat.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/trade-tab.js
 D Ship_Packages/plutus-vision/pine-ide/ide/renderer/trade-tracker.js
 D Ship_Packages/plutus-vision/pine-ide/pine-ide/agent-face.mjs
 D Ship_Packages/plutus-vision/pine-ide/pine-ide/gate.mjs
 D Ship_Packages/plutus-vision/pine-ide/pine-ide/input_parser_v2.mjs
 D Ship_Packages/plutus-vision/pine-ide/pine-ide/microtabs.mjs
 D Ship_Packages/plutus-vision/pine-ide/pine-ide/pine-editor.mjs
 D Ship_Packages/plutus-vision/pine-ide/pine-ide/pine-ide.mjs
 D Ship_Packages/plutus-vision/pine-ide/pine-ide/pine-persist.mjs
 D Ship_Packages/plutus-vision/pine-ide/pine-ide/pine-persist.selftest.mjs
 D Ship_Packages/plutus-vision/pine-ide/pine-ide/study-legend.mjs
 D Ship_Packages/plutus-vision/pine-ide/pine-ide/vil-rail.mjs
 D Ship_Packages/plutus-vision/pine-ide/pine-ide/vision.mjs
 D Ship_Packages/plutus-vision/pine-ide/pine-station/.gitignore
 D Ship_Packages/plutus-vision/pine-ide/pine-station/lib/bars.mjs
 D Ship_Packages/plutus-vision/pine-ide/pine-station/lib/canon.mjs
 D Ship_Packages/plutus-vision/pine-ide/pine-station/lib/catalog.mjs
 D Ship_Packages/plutus-vision/pine-ide/pine-station/lib/run.mjs
 D Ship_Packages/plutus-vision/pine-ide/pine-station/package-lock.json
 D Ship_Packages/plutus-vision/pine-ide/pine-station/package.json
 D Ship_Packages/plutus-vision/pine-ide/pine-station/server.mjs
 D Ship_Packages/plutus-vision/pine-ide/tv-feed/package-lock.json
 D Ship_Packages/plutus-vision/pine-ide/tv-feed/package.json
 D Ship_Packages/plutus-vision/pine-ide/tv-feed/server.mjs
 D Ship_Packages/plutus-vision/pine-ide/tv-feed/test/probe-anon.mjs
 D Ship_Packages/plutus-vision/scripts/_chain_probe.py
 D Ship_Packages/plutus-vision/scripts/anchor2.py
 D Ship_Packages/plutus-vision/scripts/anchor_testing_log.py
 D Ship_Packages/plutus-vision/scripts/canon_gate.sh
 D Ship_Packages/plutus-vision/scripts/cap_sweeps.py
 D Ship_Packages/plutus-vision/scripts/ceiling_test.py
 D Ship_Packages/plutus-vision/scripts/check_render_libs.py
 D Ship_Packages/plutus-vision/scripts/compare.py
 D Ship_Packages/plutus-vision/scripts/crop.py
 D Ship_Packages/plutus-vision/scripts/crop_lib.py
 D Ship_Packages/plutus-vision/scripts/crop_view.py
 D Ship_Packages/plutus-vision/scripts/deguard.py
 D Ship_Packages/plutus-vision/scripts/drive.sh
 D Ship_Packages/plutus-vision/scripts/e1_category.py
 D Ship_Packages/plutus-vision/scripts/e1_extract.py
 D Ship_Packages/plutus-vision/scripts/e1_fetch.py
 D Ship_Packages/plutus-vision/scripts/e1_judge.py
 D Ship_Packages/plutus-vision/scripts/e1_render_tests.py
 D Ship_Packages/plutus-vision/scripts/e1_sources.py
 D Ship_Packages/plutus-vision/scripts/e1_st_18.py
 D Ship_Packages/plutus-vision/scripts/e1_st_19.py
 D Ship_Packages/plutus-vision/scripts/e1_st_20.py
 D Ship_Packages/plutus-vision/scripts/e1_st_21.py
 D Ship_Packages/plutus-vision/scripts/e1_st_22.py
 D Ship_Packages/plutus-vision/scripts/e1_st_26.py
 D Ship_Packages/plutus-vision/scripts/e1_tests.py
 D Ship_Packages/plutus-vision/scripts/e1_vlm_options.py
 D Ship_Packages/plutus-vision/scripts/e1_week.py
 D Ship_Packages/plutus-vision/scripts/e1_zfp.py
 D Ship_Packages/plutus-vision/scripts/e2_engine.py
 D Ship_Packages/plutus-vision/scripts/e2_render_tests.py
 D Ship_Packages/plutus-vision/scripts/e2_tests.py
 D Ship_Packages/plutus-vision/scripts/enforce_budget.py
 D Ship_Packages/plutus-vision/scripts/failure_forensics.py
 D Ship_Packages/plutus-vision/scripts/finalize.sh
 D Ship_Packages/plutus-vision/scripts/find_content.py
 D Ship_Packages/plutus-vision/scripts/fix_budget_guard.py
 D Ship_Packages/plutus-vision/scripts/fix_indent.py
 D Ship_Packages/plutus-vision/scripts/fix_labels.py
 D Ship_Packages/plutus-vision/scripts/fix_load_race.py
 D Ship_Packages/plutus-vision/scripts/fix_locked_remove.py
 D Ship_Packages/plutus-vision/scripts/fix_parser_v2.py
 D Ship_Packages/plutus-vision/scripts/fix_persist2.py
 D Ship_Packages/plutus-vision/scripts/fix_pools_roll.py
 D Ship_Packages/plutus-vision/scripts/fix_removemany.py
 D Ship_Packages/plutus-vision/scripts/fix_removemany2.py
 D Ship_Packages/plutus-vision/scripts/fix_renderer.py
 D Ship_Packages/plutus-vision/scripts/fix_renderer2.py
 D Ship_Packages/plutus-vision/scripts/fix_renderer3.py
 D Ship_Packages/plutus-vision/scripts/fix_renderer4.py
 D Ship_Packages/plutus-vision/scripts/fix_tdz.py
 D Ship_Packages/plutus-vision/scripts/gen_canon.py
 D Ship_Packages/plutus-vision/scripts/goal_audit.py
 D Ship_Packages/plutus-vision/scripts/indicator_gate.py
 D Ship_Packages/plutus-vision/scripts/input_parser_v2.mjs
 D Ship_Packages/plutus-vision/scripts/inspect_drawings.py
 D Ship_Packages/plutus-vision/scripts/inspect_fixture.py
 D Ship_Packages/plutus-vision/scripts/inspect_inputs.py
 D Ship_Packages/plutus-vision/scripts/inspect_lines_labels.py
 D Ship_Packages/plutus-vision/scripts/inspect_raw.py
 D Ship_Packages/plutus-vision/scripts/layers.py
 D Ship_Packages/plutus-vision/scripts/lexcheck.py
 D Ship_Packages/plutus-vision/scripts/liquidity_logic.py
 D Ship_Packages/plutus-vision/scripts/load_merged.py
 D Ship_Packages/plutus-vision/scripts/look.py
 D Ship_Packages/plutus-vision/scripts/loop_verify.py
 D Ship_Packages/plutus-vision/scripts/lqz-panel.mjs
 D Ship_Packages/plutus-vision/scripts/lqz_ab.py
 D Ship_Packages/plutus-vision/scripts/lqz_adversarial.py
 D Ship_Packages/plutus-vision/scripts/lqz_assemble.py
 D Ship_Packages/plutus-vision/scripts/lqz_core.test.ts
 D Ship_Packages/plutus-vision/scripts/lqz_diag.py
 D Ship_Packages/plutus-vision/scripts/lqz_luxalgo_build.py
 D Ship_Packages/plutus-vision/scripts/lqz_panel_ide.py
 D Ship_Packages/plutus-vision/scripts/lqz_render.test.ts
 D Ship_Packages/plutus-vision/scripts/lqz_ship.test.ts
 D Ship_Packages/plutus-vision/scripts/lqz_vision_build.py
 D Ship_Packages/plutus-vision/scripts/lqz_vision_v2_build.py
 D Ship_Packages/plutus-vision/scripts/lqz_w6.test.ts
 D Ship_Packages/plutus-vision/scripts/make_verify_ladder.py
 D Ship_Packages/plutus-vision/scripts/make_verify_structure.py
 D Ship_Packages/plutus-vision/scripts/measure_density.py
 D Ship_Packages/plutus-vision/scripts/measure_ladder.py
 D Ship_Packages/plutus-vision/scripts/p5_adversarial.py
 D Ship_Packages/plutus-vision/scripts/parity_bisect.py
 D Ship_Packages/plutus-vision/scripts/parity_sweeps.py
 D Ship_Packages/plutus-vision/scripts/pine_emit.py
 D Ship_Packages/plutus-vision/scripts/pools_adjudicate.py
 D Ship_Packages/plutus-vision/scripts/pools_isolate.py
 D Ship_Packages/plutus-vision/scripts/probe_pools.py
 D Ship_Packages/plutus-vision/scripts/probe_reader.py
 D Ship_Packages/plutus-vision/scripts/pv-eval.mjs
 D Ship_Packages/plutus-vision/scripts/pv-ide-cdp.sh
 D Ship_Packages/plutus-vision/scripts/pv-ide.sh
 D Ship_Packages/plutus-vision/scripts/pv-load-dash.mjs
 D Ship_Packages/plutus-vision/scripts/pv-load.mjs
 D Ship_Packages/plutus-vision/scripts/pv-port-guard.sh
 D Ship_Packages/plutus-vision/scripts/pv-server.py
 D Ship_Packages/plutus-vision/scripts/pv-shot.sh
 D Ship_Packages/plutus-vision/scripts/pv_crossval.py
 D Ship_Packages/plutus-vision/scripts/rail-test.mjs
 D Ship_Packages/plutus-vision/scripts/rail-test2.mjs
 D Ship_Packages/plutus-vision/scripts/record_run.sh
 D Ship_Packages/plutus-vision/scripts/sandbox_up.py
 D Ship_Packages/plutus-vision/scripts/seal_checkpoint.py
 D Ship_Packages/plutus-vision/scripts/show_chart.sh
 D Ship_Packages/plutus-vision/scripts/show_ide.sh
 D Ship_Packages/plutus-vision/scripts/smoke_e1_payload.py
 D Ship_Packages/plutus-vision/scripts/starvation_probe.ts
 D Ship_Packages/plutus-vision/scripts/sweep.mjs
 D Ship_Packages/plutus-vision/scripts/test_5week_crossval.py
 D Ship_Packages/plutus-vision/scripts/test_delete_lock.mjs
 D Ship_Packages/plutus-vision/scripts/test_delete_lock2.mjs
 D Ship_Packages/plutus-vision/scripts/test_dialog_logic.mjs
 D Ship_Packages/plutus-vision/scripts/test_parser_v2.mjs
 D Ship_Packages/plutus-vision/scripts/test_payload_computed.py
 D Ship_Packages/plutus-vision/scripts/test_pillars.py
 D Ship_Packages/plutus-vision/scripts/test_render_computed.py
 D Ship_Packages/plutus-vision/scripts/test_tree_clean.py
 D Ship_Packages/plutus-vision/scripts/test_v1_seal_intact.py
 D Ship_Packages/plutus-vision/scripts/test_zfp_adversarial.py
 D Ship_Packages/plutus-vision/scripts/test_zfp_discriminates.py
 D Ship_Packages/plutus-vision/scripts/test_zone_assembly.py
 D Ship_Packages/plutus-vision/scripts/verify_four.py
 D Ship_Packages/plutus-vision/scripts/verify_ledger.py
 D Ship_Packages/plutus-vision/scripts/verify_served_pine.sh
 D Ship_Packages/plutus-vision/scripts/verify_server.py
 D Ship_Packages/plutus-vision/scripts/verify_v1_seal.py
 D Ship_Packages/plutus-vision/scripts/vil.py
 D Ship_Packages/plutus-vision/scripts/vision_proof.py
 D Ship_Packages/plutus-vision/scripts/w4_render_feasibility.py
 D Ship_Packages/plutus-vision/scripts/w4_render_parity.py
 D Ship_Packages/plutus-vision/scripts/wave_gates.py
 D Ship_Packages/plutus-vision/scripts/wire_e2.py
 M context_management/CANON_MANIFEST.md
 M scripts/pinebox/stages/verify.sh
?? .omp/wave-plan.md
?? CHARTER.md
?? MASTER_CONTEXT/11_Token_Reasoning_Chain_Design.md
?? MASTER_CONTEXT/CANON.md
?? MASTER_CONTEXT/EXECUTION_CONTEXT.md
?? MASTER_CONTEXT/FORENSIC_ANALYSIS_38_TRADES.md
?? MASTER_CONTEXT/Golden_Operator_Trade_Feedback_EU_GU.md
?? MASTER_CONTEXT/HANDOVER_37_FUNDAMENTAL_LAWS.md
?? MASTER_CONTEXT/NON-NEGOTIABLE-RELOAD/Golden_Operator_Trade_Feedback_EU_GU.md
?? MASTER_CONTEXT/NON-NEGOTIABLE-RELOAD/OHLC-Intelligence-Lexicon-v1.0/README.md
?? MASTER_CONTEXT/NON-NEGOTIABLE-RELOAD/OHLC-Intelligence-Lexicon-v1.0/src/lexicons/obvious-trades-lexicon.md
?? MASTER_CONTEXT/NON-NEGOTIABLE-RELOAD/OHLC-Intelligence-Lexicon-v1.0/src/lexicons/shape-chain-lexicon.md
?? MASTER_CONTEXT/NON-NEGOTIABLE-RELOAD/OHLC-Intelligence-Lexicon-v1.0/src/lexicons/zone-pressure-lexicon.md
?? MASTER_CONTEXT/NON-NEGOTIABLE-RELOAD/PLUTUS_ARCHITECTURE_BIBLE_4.0.md
?? MASTER_CONTEXT/NON-NEGOTIABLE-RELOAD/PLUTUS_ARCHITECTURE_BIBLE_v2.1.md
?? MASTER_CONTEXT/NON-NEGOTIABLE-RELOAD/PLUTUS_E1_E2_E3_MACRO_CONTEXT.md
?? MASTER_CONTEXT/NON-NEGOTIABLE-RELOAD/TTE_MACRO_SHAPES_COMPLETE_REFERENCE.md
?? MASTER_CONTEXT/NON-NEGOTIABLE-RELOAD/TTE_SHAPE_ZONE_MECHANICS_MILITARY_GRADE.md
?? MASTER_CONTEXT/NON-NEGOTIABLE-RELOAD/Trident_Fractal_Architecture_FirstPrinciples_v2.3.md
?? MASTER_CONTEXT/NON_NEGOTIABLE_ORCHESTRATOR_PRINCIPLES.md
?? MASTER_CONTEXT/OPERATOR-SESSION-2026-09-16.md
?? MASTER_CONTEXT/OPERATOR_MANUAL.md
?? MASTER_CONTEXT/OPERATOR_RULINGS_PV.md
?? MASTER_CONTEXT/PLUTUS_5.0_MIMOCODE_ARCHITECTURE_SPEC.md
?? MASTER_CONTEXT/PLUTUS_ANCHOR_DOCTRINE.md
?? MASTER_CONTEXT/PLUTUS_ARCHITECTURE_BIBLE_4.0.md
?? MASTER_CONTEXT/PLUTUS_ARCHITECTURE_BIBLE_v2.1.md
?? MASTER_CONTEXT/PLUTUS_E1_E2_E3_MACRO_CONTEXT.md
?? MASTER_CONTEXT/PLUTUS_GOLDEN_CASCADE_23.md
?? MASTER_CONTEXT/PLUTUS_PVE_DESIGN_SPEC.md
?? MASTER_CONTEXT/PLUTUS_TVI_DESIGN_SPEC.md
?? MASTER_CONTEXT/PLUTUS_V4.4_MDVE_SPEC.md
?? MASTER_CONTEXT/PLUTUS_V4.4_VEI_SPEC.md
?? MASTER_CONTEXT/PLUTUS_V4.5.2_E2_CASCADE_SPEC.md
?? MASTER_CONTEXT/README.md
?? MASTER_CONTEXT/SMC_Liquidity_Notes.md
?? MASTER_CONTEXT/SMC_Master_Notes.md
?? MASTER_CONTEXT/T1_HEADED_CHROME_DOCKER_REFERENCE.md
?? MASTER_CONTEXT/T1_MULTI_TOOL_CHAIN_PIPELINE.md
?? MASTER_CONTEXT/TTE_GOLDEN_STANDARD_COMPLETE_REFERENCE.md
?? MASTER_CONTEXT/TTE_MACRO_SHAPES_COMPLETE_REFERENCE.md
?? MASTER_CONTEXT/TTE_SHAPE_ZONE_MECHANICS_MILITARY_GRADE.md
?? MASTER_CONTEXT/Trident_Fractal_Architecture_FirstPrinciples_v2.3.md
?? MASTER_CONTEXT/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md
?? MASTER_CONTEXT/context_management/
?? MASTER_CONTEXT/lessons/
?? MASTER_CONTEXT/reports/Arsumbris_KG_Engineering_Report_v1.md
?? MASTER_CONTEXT/reports/Arsumbris_Semantica_Blueprints_v1.md
?? MASTER_CONTEXT/reports/PLANNING_SUITE_Kev_Limite_Fusion.md
?? MASTER_CONTEXT/reports/PLANNING_SUITE_Plutus_V6_Architecture.md
?? MASTER_CONTEXT/reports/PLANNING_SUITE_Plutus_V6_Build_Package.md
?? MASTER_CONTEXT/reports/PLUTUS_V6_BUILD_PACKAGE_SYNTHESIS.md
?? MASTER_CONTEXT/reports/PLUTUS_V6_GOAL_PIN.md
?? MASTER_CONTEXT/reports/Plutus_V6_Initial_Blueprint.md
?? MASTER_CONTEXT/reports/Plutus_V6_Master_Blueprint_v1.md
?? MASTER_CONTEXT_GRAPH_MAP.md
?? PRECONTACT_AND_TOOLSET_BIBLE.md
?? STEP_AGENT/CANON_MACRO_CONTEXT.md
?? cf/PSEUDOCODE_BASE.md
?? design/BUILD_WORKFLOW_v2.md
?? design/BUILD_WORKFLOW_v3.md
?? design/BUILD_WORKFLOW_v4.md
?? design/BUILD_WORKFLOW_v5.1_CLOUDFLARE.md
?? design/BUILD_WORKFLOW_v5_CLOUDFLARE.md
?? design/CLOUDFLARE_ARCHITECTURE.md
?? design/DESIGN_BLUEPRINT_v1.0_AS_DESIGNED.md
?? design/DESIGN_BLUEPRINT_v2.0_AUTHORITATIVE.md
?? design/DESIGN_BLUEPRINT_v3.0.md
?? design/DESIGN_BLUEPRINT_v4.0_CLOUDFLARE.md
?? design/DESIGN_BLUEPRINT_v4.1_CLOUDFLARE.md
?? design/HANDOFF_PROMPT_BLUEPRINT_v2.md
?? features/
?? forensic/BLIND_COMPREHENSION_AUDIT.md
?? forensic/INSTRUMENT_FAILURES.md
?? gates/image-attach-guard.sh
?? gates/markdown-width.sh
?? packages/plutus-vision-e1-automatic/evidence/W4_GATE.md
?? packages/plutus-vision-e1-automatic/evidence/W9_GATE.md
?? packages/plutus-vision-v0-liquidity/LIQUIDITY_BLUEPRINT.md
?? research/
?? sources/architecture.md
?? sources/e1-zones.md
?? sources/e2-shapes.md
?? sources/e3-trades.md
?? sources/fractal.md
?? sources/smc-fundamentals.md
?? sources/trading-laws.md
?? sources/zone-grammar.md
?? spec/
?? wave-audit/
```

## remote
Not echoed here on purpose: a remote URL can embed credentials. See the source repo's own config.
