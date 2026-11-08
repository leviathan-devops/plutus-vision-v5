# CHANGELOG — clean v5/M1 history

**PROJECT FINGERPRINT:** `7301cec3e57aacb06b4af22faa2383897567f8fb2f5cd2b2e4ad20355667cea2`
**Fingerprint subject:** `gates/policy.json` — the mechanically enforced M1 gate policy.
**Git HEAD when generated:** `cf5da640586a22e044978c148981f7bfb67b038f`
**Generated:** `2026-11-08T13:36:43.905831+00:00`


## 2026-11-08 — clean-room rebuild established

## Accomplished
- Archived the entire pre-v5 tracked tree beyond the baseline checkpoint.
- Restored a clean root containing only live authorities, baseline, design, M1 contract, hooks, gate, and archive.
- Installed non-bypassable reference-transaction git enforcement.
- Added a checkpoint/state machine and visual evidence requirements.
- Configured external Mimo v2.6-flash commit grading.
- Bound the v5 workflow to a golden-week-only M1 phase.
- Built a fresh self-contained PLUTUS_VISION_M1 knowledge graph.
- Generated this fresh 11-doc canon set.

## Evidence
| Claim | Evidence |
|---|---|
| archive commit | `9b061e0` |
| gate commit | `3b28cca` |
| repair commit | `aa35d7e` |
| workflow commit | `62e2e9f` |
| vision control | `gates/controls/mimo-vision-control.json:1` |
| negative control | `PV-TRAILER` rejected with branch unmoved |
| graph gates | `KNOWLEDGE_GRAPHS/PLUTUS_VISION_M1/RECORD.md:1` |

## Decisions
- Pre-v5 tree is frozen history.
- M1 is DXY golden week only.
- Pinebox is used unchanged as the runtime IDE.
- plutus-browser remains separate headed acquisition.
- Every commit requires a PV gate trailer.
- Every checkpoint requires committed PNG evidence.
- Mimo threshold is 7/10 fail-closed.
- M1-complete hard-stops for operator review.

## Failures and root causes
| Failure | Root cause | Resolution |
|---|---|---|
| archive script removed .githooks contents | keep-root pruning treated the hook dir as a normal directory | restored from git archive before commit |
| gate absent trailer raised UnboundLocalError | trailer helper returned an unmatched loop variable | return empty map; named PV-TRAILER refusal |
| first gate repair rejected by grader | grader could not see commit message or validated admin fact | supply commit message and validated-admin context |
| old PLUTUS_VISION graph stale | built over pre-v5 tree and then archived | new central clean-scope graph built |

## Honest disclosure
No E1 implementation exists yet. The clean build has substrate, contract, enforcement, graph, and canon; it does not have an engine, card, composition, or rendered M1 chart.

## MEASURED APPENDIX — CHANGELOG.md
| Authority anchor | Meaning |
|---|---|
| M1 outcome | m1/EXECUTION_CONTRACT.md:17 |
| source laws | m1/EXECUTION_CONTRACT.md:35 |
| commit protocol | m1/EXECUTION_CONTRACT.md:75 |
| loop law | m1/EXECUTION_CONTRACT.md:241 |
| stop condition | m1/EXECUTION_CONTRACT.md:301 |
| M1 gate amendment | design/BUILD_WORKFLOW_v5.0_CLOUDFLARE.md:325 |
| nine pillars | design/DESIGN_BLUEPRINT_v5.0_CLOUDFLARE.md:151 |
| E1 scoring | design/DESIGN_BLUEPRINT_v5.0_CLOUDFLARE.md:165 |
| pair law | design/DESIGN_BLUEPRINT_v5.0_CLOUDFLARE.md:347 |
| gate parser | gates/commit_gate.py:137 |
| external grader | gates/commit_gate.py:316 |
| reference machine | gates/commit_gate.py:454 |
| R-30 | MASTER_CONTEXT/OPERATOR_RULINGS_PV.md:132 |
| R-32 | MASTER_CONTEXT/OPERATOR_RULINGS_PV.md:140 |
| R-33 | MASTER_CONTEXT/OPERATOR_RULINGS_PV.md:145 |
| Engine 1 canon | Original_Canon_Data/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:347 |
| Protocol A | Original_Canon_Data/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:808 |
| confluence scoring | Original_Canon_Data/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:1465 |
| v1 floor | Checkpoints/v1-ship-approved-working-baseline/dist/plutus-vision-v1.pine:1 |
| Pinebox router | /home/leviathan/JARVIS_WORKSPACE/SHIP_PACKAGES/pinebox/src/pinebox-cloud/src/worker.ts:210 |

## Live file inventory (excluding archive and this canon set)
| Path | Bytes | SHA-16 |
|---|---|---|
| .githooks/commit-msg | 3361 | 49aa8c536a31ac94 |
| .githooks/lib/pattern-header.sh | 4193 | ae0cc586df3aec09 |
| .githooks/lib/scan-phantom.sh | 5872 | 9b4e80cbfd2ba24d |
| .githooks/lib/scan-silent.sh | 11285 | 5aef733ca08de9bd |
| .githooks/lib/scan-stub.sh | 6407 | 4cb5d4afec6d6709 |
| .githooks/pre-commit | 16862 | 970464c489aa1d93 |
| .githooks/pre-push | 8076 | eac81eec9c447500 |
| .githooks/prepare-commit-msg | 5470 | 3d784b510c45f8cd |
| .githooks/reference-transaction | 564 | 5c48829c3246f4c7 |
| .gitignore | 121 | 28e1f221a223e65f |
| Checkpoints/v1-ship-approved-working-baseline/dist/lqz-luxalgo.pine | 44743 | db06b60574125039 |
| Checkpoints/v1-ship-approved-working-baseline/dist/lqz-plutus.pine | 19238 | 68881deaca0c66a1 |
| Checkpoints/v1-ship-approved-working-baseline/dist/plutus-vision-v0.pine | 83089 | 605bff82d3539e9e |
| Checkpoints/v1-ship-approved-working-baseline/dist/plutus-vision-v1.pine | 69520 | 82da437af969a315 |
| MASTER_CONTEXT/OPERATOR_RULINGS_PV.md | 17405 | c9725e52a4196fd2 |
| Original_Canon_Data/TRIDENT_v5.3.3_CORRECTED_E3_ENGINE.md | 79739 | d3fc65e406023c2e |
| Original_Canon_Data/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md | 328319 | db9f3bdd3717080d |
| design/BUILD_WORKFLOW_v5.0_CLOUDFLARE.md | 17833 | 92020269cb45e451 |
| design/DESIGN_BLUEPRINT_v5.0_CLOUDFLARE.md | 42558 | ec6c6dd9a38dce60 |
| gates/__pycache__/commit_gate.cpython-312.pyc | 39697 | 0a0f9276b9c5fe0c |
| gates/commit_gate.py | 27436 | a4ba37e911ef69a2 |
| gates/controls/mimo-vision-control.json | 579 | ebc85f2af93c8cb3 |
| gates/controls/mimo-vision-control.png | 804 | e042c61e84e4c8bc |
| gates/policy.json | 2631 | 7301cec3e57aacb0 |
| m1/EXECUTION_CONTRACT.md | 10289 | a496716880f8fe6f |
| m1/evidence/.gitkeep | 0 | e3b0c44298fc1c14 |
| m1/out/.gitkeep | 0 | e3b0c44298fc1c14 |
| m1/src/.gitkeep | 0 | e3b0c44298fc1c14 |
| m1/state.json | 264 | ead5db53cca681be |

## Fresh graph card index
| Card | Claim | Anchor |
|---|---|---|
| archive-freeze | The pre-v5 tree is frozen history | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/MASTER_CONTEXT/OPERATOR_RULINGS_PV.md:145 |
| baseline-floor | The v1 checkpoint is the preserved floor | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/Checkpoints/v1-ship-approved-working-baseline/dist/plutus-vision-v1.pine:2 |
| bom-mom-reactions | BoM/MoM and reaction state are required E1 metadata | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/design/DESIGN_BLUEPRINT_v5.0_CLOUDFLARE.md:151 |
| checkpoint-evidence | Every checkpoint carries committed visual evidence | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/m1/EXECUTION_CONTRACT.md:75 |
| e1-scoring | Six dimensions plus structural bonus score every level | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/Original_Canon_Data/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:1461 |
| e3-deferred | Corrected E3 is authority but deferred | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/Original_Canon_Data/TRIDENT_v5.3.3_CORRECTED_E3_ENGINE.md:1 |
| evidence-cutoff | Golden-week evidence stops at the Monday cutoff | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/m1/EXECUTION_CONTRACT.md:35 |
| external-commit-grader | Mimo v2.6 flash sanity-grades every commit | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/gates/commit_gate.py:317 |
| full-e1-required | Full E1 means every canonical family | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/design/DESIGN_BLUEPRINT_v5.0_CLOUDFLARE.md:151 |
| git-gate-surfaces | Created commits pass the non-bypassable reference gate | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/gates/commit_gate.py:455 |
| m1-scope | M1 is the golden week only | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/m1/EXECUTION_CONTRACT.md:17 |
| m1-stop-unlock | M1 complete stops for operator review | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/m1/EXECUTION_CONTRACT.md:301 |
| nine-pillars | Engine 1 is the nine-pillar 6D hybrid system | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/Original_Canon_Data/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:347 |
| no-width-zfp | ZFP is strength-based, never width-based | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/design/DESIGN_BLUEPRINT_v5.0_CLOUDFLARE.md:165 |
| operator-responsibility | Operator remains the acceptance authority | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/MASTER_CONTEXT/OPERATOR_RULINGS_PV.md:140 |
| pair-translation-law | DXY gives direction and each pair gives its own prices | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/design/DESIGN_BLUEPRINT_v5.0_CLOUDFLARE.md:347 |
| pinebox-runtime-authority | Pinebox is used exactly as designed | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/MASTER_CONTEXT/OPERATOR_RULINGS_PV.md:145 |
| plutus-browser-headed-source | plutus-browser is the headed acquisition tool | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/MASTER_CONTEXT/OPERATOR_RULINGS_PV.md:132 |
| protocol-a-image | investinglive evidence is the headed image path | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/Original_Canon_Data/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:808 |

## Required family state
| # | Family | Current state |
|---|---|---|
| 1 | IP resistance zones | NOT STARTED |
| 2 | IP equilibrium zone | NOT STARTED |
| 3 | IP support zones | NOT STARTED |
| 4 | Liquidity Sweep Zones | NOT STARTED |
| 5 | canonical 4H/D1 S/D beyond v1 | NOT STARTED |
| 6 | option-strike targets | NOT STARTED |
| 7 | POI tier and pressure data | NOT STARTED |
| 8 | strength-based ZFP | NOT STARTED |
| 9 | BoM/MoM classification | NOT STARTED |
| 10 | mitigation and reactions | NOT STARTED |
| 11 | intra-zone precision | NOT STARTED |
| 12 | core/spike boundaries | NOT STARTED |
| 13 | card identity and missing data | NOT STARTED |

## Operating question matrix
| Question | Answer |
|---|---|
| What phase is active? | M1 only: DXY, week 2026-07-06. |
| What is the build floor? | The preserved v1 checkpoint baseline. |
| What is full E1? | All nine pillars, six scoring dimensions, and every required family. |
| Can a work commit claim done? | No; use a visual checkpoint. |
| How many work commits between checkpoints? | Two. |
| What image count does M1-complete need? | Two. |
| What score accepts a commit? | Mimo PASS and score at least 7. |
| What happens if Mimo is down? | Commit rejects; no fallback. |
| Can Pinebox be edited? | No; use it unchanged. |
| Can plutus-browser merge into Pinebox? | No; it remains separate acquisition. |
| Can archive content be build input? | No. |
| Can current pages replace golden-week evidence? | No. |
| What is the information cutoff? | Monday 2026-07-06 09:00 London. |
| What bars are authoritative? | TradingView through Pinebox. |
| What source needs a headed browser? | investinglive Protocol A. |
| Is ZFP width-based? | No; strength/type/modifier based. |
| Can DXY arithmetic make pair prices? | No. |
| What follows M1-complete? | Operator review only. |
| What unlocks post-M1? | Operator unlock token. |
| Can a builder supply admin token? | No; operator only. |
| Is remote GitHub enforcement armed? | No; local reference gate is armed. |
| Is there an E1 card now? | No. |
| Is there a composition now? | No. |
| Is there an M1 chart now? | No. |
| What is clean build fingerprint? | 7301cec3e57aacb06b4af22faa2383897567f8fb2f5cd2b2e4ad20355667cea2 |
| What graph is current? | PLUTUS_VISION_M1 central graph. |
| What graph is obsolete? | The archived pre-v5 in-project graph. |
| Where is old history? | archive/pre-v5-2026-11-08. |
| What is the branch? | step_agent. |
| What is push policy? | Explicit operator order only. |

## Risk-to-refusal matrix
| Risk | Named refusal |
|---|---|
| archive edit | PV-PROTECTED_PATH |
| baseline edit | PV-PROTECTED_PATH |
| canon edit | PV-PROTECTED_PATH |
| gate tampering | PV-ADMIN |
| E2/E3 early | PV-M1_SCOPE |
| multi-asset early | PV-M1_SCOPE |
| random week early | PV-M1_SCOPE |
| missing image | PV-VISUAL |
| hash mismatch | PV-VISUAL_HASH |
| model malformed | PV-MODEL_VERDICT |
| model low score | PV-MODEL_REJECT |
| model down | PV-MODEL_UNAVAILABLE |
| empty work | PV-EMPTY_WORK |
| too many work commits | PV-CHECKPOINT_REQUIRED |
| post-M1 without unlock | PV-M1_STOP |

## Appendix interpretation
- This appendix is measured from the live clean tree and fresh graph; it is not historical narrative.
- A `NOT STARTED` family state is the current truth, not a defect in the substrate.
- External Pinebox and graph paths are dependencies, not editable project files.

## MEASURED APPENDIX — CHANGELOG.md
| Authority anchor | Meaning |
|---|---|
| M1 outcome | m1/EXECUTION_CONTRACT.md:17 |
| source laws | m1/EXECUTION_CONTRACT.md:35 |
| commit protocol | m1/EXECUTION_CONTRACT.md:75 |
| loop law | m1/EXECUTION_CONTRACT.md:241 |
| stop condition | m1/EXECUTION_CONTRACT.md:301 |
| M1 gate amendment | design/BUILD_WORKFLOW_v5.0_CLOUDFLARE.md:325 |
| nine pillars | design/DESIGN_BLUEPRINT_v5.0_CLOUDFLARE.md:151 |
| E1 scoring | design/DESIGN_BLUEPRINT_v5.0_CLOUDFLARE.md:165 |
| pair law | design/DESIGN_BLUEPRINT_v5.0_CLOUDFLARE.md:347 |
| gate parser | gates/commit_gate.py:137 |
| external grader | gates/commit_gate.py:316 |
| reference machine | gates/commit_gate.py:454 |
| R-30 | MASTER_CONTEXT/OPERATOR_RULINGS_PV.md:132 |
| R-32 | MASTER_CONTEXT/OPERATOR_RULINGS_PV.md:140 |
| R-33 | MASTER_CONTEXT/OPERATOR_RULINGS_PV.md:145 |
| Engine 1 canon | Original_Canon_Data/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:347 |
| Protocol A | Original_Canon_Data/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:808 |
| confluence scoring | Original_Canon_Data/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:1465 |
| v1 floor | Checkpoints/v1-ship-approved-working-baseline/dist/plutus-vision-v1.pine:1 |
| Pinebox router | /home/leviathan/JARVIS_WORKSPACE/SHIP_PACKAGES/pinebox/src/pinebox-cloud/src/worker.ts:210 |

## Live file inventory (excluding archive and this canon set)
| Path | Bytes | SHA-16 |
|---|---|---|
| .githooks/commit-msg | 3361 | 49aa8c536a31ac94 |
| .githooks/lib/pattern-header.sh | 4193 | ae0cc586df3aec09 |
| .githooks/lib/scan-phantom.sh | 5872 | 9b4e80cbfd2ba24d |
| .githooks/lib/scan-silent.sh | 11285 | 5aef733ca08de9bd |
| .githooks/lib/scan-stub.sh | 6407 | 4cb5d4afec6d6709 |
| .githooks/pre-commit | 16862 | 970464c489aa1d93 |
| .githooks/pre-push | 8076 | eac81eec9c447500 |
| .githooks/prepare-commit-msg | 5470 | 3d784b510c45f8cd |
| .githooks/reference-transaction | 564 | 5c48829c3246f4c7 |
| .gitignore | 121 | 28e1f221a223e65f |
| Checkpoints/v1-ship-approved-working-baseline/dist/lqz-luxalgo.pine | 44743 | db06b60574125039 |
| Checkpoints/v1-ship-approved-working-baseline/dist/lqz-plutus.pine | 19238 | 68881deaca0c66a1 |
| Checkpoints/v1-ship-approved-working-baseline/dist/plutus-vision-v0.pine | 83089 | 605bff82d3539e9e |
| Checkpoints/v1-ship-approved-working-baseline/dist/plutus-vision-v1.pine | 69520 | 82da437af969a315 |
| MASTER_CONTEXT/OPERATOR_RULINGS_PV.md | 17405 | c9725e52a4196fd2 |
| Original_Canon_Data/TRIDENT_v5.3.3_CORRECTED_E3_ENGINE.md | 79739 | d3fc65e406023c2e |
| Original_Canon_Data/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md | 328319 | db9f3bdd3717080d |
| design/BUILD_WORKFLOW_v5.0_CLOUDFLARE.md | 17833 | 92020269cb45e451 |
| design/DESIGN_BLUEPRINT_v5.0_CLOUDFLARE.md | 42558 | ec6c6dd9a38dce60 |
| gates/__pycache__/commit_gate.cpython-312.pyc | 39697 | 0a0f9276b9c5fe0c |
| gates/commit_gate.py | 27436 | a4ba37e911ef69a2 |
| gates/controls/mimo-vision-control.json | 579 | ebc85f2af93c8cb3 |
| gates/controls/mimo-vision-control.png | 804 | e042c61e84e4c8bc |
| gates/policy.json | 2631 | 7301cec3e57aacb0 |
| m1/EXECUTION_CONTRACT.md | 10289 | a496716880f8fe6f |
| m1/evidence/.gitkeep | 0 | e3b0c44298fc1c14 |
| m1/out/.gitkeep | 0 | e3b0c44298fc1c14 |
| m1/src/.gitkeep | 0 | e3b0c44298fc1c14 |
| m1/state.json | 264 | ead5db53cca681be |

## Fresh graph card index
| Card | Claim | Anchor |
|---|---|---|
| archive-freeze | The pre-v5 tree is frozen history | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/MASTER_CONTEXT/OPERATOR_RULINGS_PV.md:145 |
| baseline-floor | The v1 checkpoint is the preserved floor | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/Checkpoints/v1-ship-approved-working-baseline/dist/plutus-vision-v1.pine:2 |
| bom-mom-reactions | BoM/MoM and reaction state are required E1 metadata | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/design/DESIGN_BLUEPRINT_v5.0_CLOUDFLARE.md:151 |
| checkpoint-evidence | Every checkpoint carries committed visual evidence | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/m1/EXECUTION_CONTRACT.md:75 |
| e1-scoring | Six dimensions plus structural bonus score every level | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/Original_Canon_Data/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:1461 |
| e3-deferred | Corrected E3 is authority but deferred | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/Original_Canon_Data/TRIDENT_v5.3.3_CORRECTED_E3_ENGINE.md:1 |
| evidence-cutoff | Golden-week evidence stops at the Monday cutoff | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/m1/EXECUTION_CONTRACT.md:35 |
| external-commit-grader | Mimo v2.6 flash sanity-grades every commit | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/gates/commit_gate.py:317 |
| full-e1-required | Full E1 means every canonical family | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/design/DESIGN_BLUEPRINT_v5.0_CLOUDFLARE.md:151 |
| git-gate-surfaces | Created commits pass the non-bypassable reference gate | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/gates/commit_gate.py:455 |
| m1-scope | M1 is the golden week only | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/m1/EXECUTION_CONTRACT.md:17 |
| m1-stop-unlock | M1 complete stops for operator review | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/m1/EXECUTION_CONTRACT.md:301 |
| nine-pillars | Engine 1 is the nine-pillar 6D hybrid system | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/Original_Canon_Data/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:347 |
| no-width-zfp | ZFP is strength-based, never width-based | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/design/DESIGN_BLUEPRINT_v5.0_CLOUDFLARE.md:165 |
| operator-responsibility | Operator remains the acceptance authority | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/MASTER_CONTEXT/OPERATOR_RULINGS_PV.md:140 |
| pair-translation-law | DXY gives direction and each pair gives its own prices | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/design/DESIGN_BLUEPRINT_v5.0_CLOUDFLARE.md:347 |
| pinebox-runtime-authority | Pinebox is used exactly as designed | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/MASTER_CONTEXT/OPERATOR_RULINGS_PV.md:145 |
| plutus-browser-headed-source | plutus-browser is the headed acquisition tool | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/MASTER_CONTEXT/OPERATOR_RULINGS_PV.md:132 |
| protocol-a-image | investinglive evidence is the headed image path | /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/Original_Canon_Data/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:808 |

## Required family state
| # | Family | Current state |
|---|---|---|
| 1 | IP resistance zones | NOT STARTED |
| 2 | IP equilibrium zone | NOT STARTED |
| 3 | IP support zones | NOT STARTED |
| 4 | Liquidity Sweep Zones | NOT STARTED |
| 5 | canonical 4H/D1 S/D beyond v1 | NOT STARTED |
| 6 | option-strike targets | NOT STARTED |
| 7 | POI tier and pressure data | NOT STARTED |
| 8 | strength-based ZFP | NOT STARTED |
| 9 | BoM/MoM classification | NOT STARTED |
| 10 | mitigation and reactions | NOT STARTED |
| 11 | intra-zone precision | NOT STARTED |
| 12 | core/spike boundaries | NOT STARTED |
| 13 | card identity and missing data | NOT STARTED |

## Operating question matrix
| Question | Answer |
|---|---|
| What phase is active? | M1 only: DXY, week 2026-07-06. |
| What is the build floor? | The preserved v1 checkpoint baseline. |
| What is full E1? | All nine pillars, six scoring dimensions, and every required family. |
| Can a work commit claim done? | No; use a visual checkpoint. |
| How many work commits between checkpoints? | Two. |
| What image count does M1-complete need? | Two. |
| What score accepts a commit? | Mimo PASS and score at least 7. |
| What happens if Mimo is down? | Commit rejects; no fallback. |
| Can Pinebox be edited? | No; use it unchanged. |
| Can plutus-browser merge into Pinebox? | No; it remains separate acquisition. |
| Can archive content be build input? | No. |
| Can current pages replace golden-week evidence? | No. |
| What is the information cutoff? | Monday 2026-07-06 09:00 London. |
| What bars are authoritative? | TradingView through Pinebox. |
| What source needs a headed browser? | investinglive Protocol A. |
| Is ZFP width-based? | No; strength/type/modifier based. |
| Can DXY arithmetic make pair prices? | No. |
| What follows M1-complete? | Operator review only. |
| What unlocks post-M1? | Operator unlock token. |
| Can a builder supply admin token? | No; operator only. |
| Is remote GitHub enforcement armed? | No; local reference gate is armed. |
| Is there an E1 card now? | No. |
| Is there a composition now? | No. |
| Is there an M1 chart now? | No. |
| What is clean build fingerprint? | 7301cec3e57aacb06b4af22faa2383897567f8fb2f5cd2b2e4ad20355667cea2 |
| What graph is current? | PLUTUS_VISION_M1 central graph. |
| What graph is obsolete? | The archived pre-v5 in-project graph. |
| Where is old history? | archive/pre-v5-2026-11-08. |
| What is the branch? | step_agent. |
| What is push policy? | Explicit operator order only. |

## Risk-to-refusal matrix
| Risk | Named refusal |
|---|---|
| archive edit | PV-PROTECTED_PATH |
| baseline edit | PV-PROTECTED_PATH |
| canon edit | PV-PROTECTED_PATH |
| gate tampering | PV-ADMIN |
| E2/E3 early | PV-M1_SCOPE |
| multi-asset early | PV-M1_SCOPE |
| random week early | PV-M1_SCOPE |
| missing image | PV-VISUAL |
| hash mismatch | PV-VISUAL_HASH |
| model malformed | PV-MODEL_VERDICT |
| model low score | PV-MODEL_REJECT |
| model down | PV-MODEL_UNAVAILABLE |
| empty work | PV-EMPTY_WORK |
| too many work commits | PV-CHECKPOINT_REQUIRED |
| post-M1 without unlock | PV-M1_STOP |

## Appendix interpretation
- This appendix is measured from the live clean tree and fresh graph; it is not historical narrative.
- A `NOT STARTED` family state is the current truth, not a defect in the substrate.
- External Pinebox and graph paths are dependencies, not editable project files.

## 2026-11-08 — M1 engine and the first visual checkpoint

### Accomplished
- E1 engine m1/src (12 modules); Protocol A 2026-07-06; card + composition; CP-001 (8ae7388, vc/CP-001); rolodex
  m1/VISUAL_CHECKPOINTS_LOG.md with VC-000 (not restorable) and VC-001 (restore proven); M1 ship docs m1/docs/;
  gate repairs e5d2465, 378153a; ship-docs-update skill now defines the picture+commit+restore rolodex.
### Evidence
- composition c9261fb3...; outcome 42.9% (3/7); families 2/13 MATCHED; grader PASS 8 on CP-001.
### Decisions
- legibility rules (synthesis only, measured band, origin-anchored boxes); ship docs under m1/docs because the root
  docs belong to the Pinebox agent; tag vc/<id> per checkpoint.
### Failures and root causes
- F-02/F-03 (operator-caught): fabricated limitation, CDP detour. F-06: VC-000 code not committed. F-04: two skills
  deleted by time window.
### Honest disclosure
- M1 target not met. P4 and P7 supplementary evidence missing (recorded on the card).
- Anchors: m1/src/compose.ts:31, m1/src/run.ts:72, gates/commit_gate.py:366.
