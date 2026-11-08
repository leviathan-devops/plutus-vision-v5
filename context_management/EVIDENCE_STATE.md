# EVIDENCE_STATE — clean v5/M1

**PROJECT FINGERPRINT:** `7301cec3e57aacb06b4af22faa2383897567f8fb2f5cd2b2e4ad20355667cea2`
**Fingerprint subject:** `gates/policy.json` — the mechanically enforced M1 gate policy.
**Git HEAD when generated:** `cf5da640586a22e044978c148981f7bfb67b038f`
**Generated:** `2026-11-08T13:36:43.905831+00:00`


## 0. Summary
Current evidence proves the clean substrate, git enforcement, external grader, and fresh knowledge graph. It does not prove any E1 trading result.

## 1. Evidence rows
| ID | Claim | Evidence | Verdict |
|---|---|---|---|
| E-001 | clean root after archive | commit `9b061e0`; dirty paths 0 | PROVEN |
| E-002 | baseline preserved | sha `82da437af969a3157bd9454cbe70497ce01cf71fe4681b9e2401b754aa90cd43` | PROVEN |
| E-003 | gate syntax valid | py_compile PASS and bash -n PASS | PROVEN |
| E-004 | non-bypass surface works | no-trailer commit rejected `PV-TRAILER`, branch unmoved | PROVEN |
| E-005 | work claim rejected | `PV-WORK_CLAIM`, branch unmoved | PROVEN |
| E-006 | Mimo sees images | red control returned RED | PROVEN |
| E-007 | gate commits graded | Mimo PASS scores 7-8 in ledger | PROVEN |
| E-008 | fresh graph live | L1 30/78; L2 35/78; own diagnostics 0 | PROVEN |
| E-009 | graph anchors resolve | 19/19 cards | PROVEN |
| E-010 | E1 works | no implementation or chart run | NOT STARTED |

## 2. Gate control transcript
```
no PV trailer, --no-verify:
REJECT(PV-TRAILER): commits after gate installation must carry PV-Gate
branch before == branch after

work completion claim, --no-verify:
REJECT(PV-WORK_CLAIM): work commit claims success without a visual checkpoint
branch before == branch after
```

## 3. Grader ledger
`~/.local/state/plutus-vision-gate/verdicts.jsonl` records strict JSON verdicts. Latest gate commits scored 7 or 8 and were accepted.

## 4. Knowledge-graph record
`KNOWLEDGE_GRAPHS/PLUTUS_VISION_M1/RECORD.md:1` records: 30 L1 entities, 78 L1 relationships, 35 L2 nodes, 78 L2 edges, own diagnostics 0, and 19/19 anchors resolved.

## 5. Remote enforcement preview
`upper attach --dry` reached a green remote plan using an in-process GitHub credential. No apply, push, or ruleset arm was performed.

## 6. Unverified / absent
- golden-week evidence manifest
- Protocol A image chain
- nine-pillar card
- Pine composition
- Pinebox M1 render
- oracle comparison
- operator acceptance

## MEASURED APPENDIX — EVIDENCE_STATE.md
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

## MEASURED APPENDIX — EVIDENCE_STATE.md
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
