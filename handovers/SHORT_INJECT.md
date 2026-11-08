# PLUTUS VISION M1 SHORT INJECT

Generated: 2026-11-08T15:29:17.193081+00:00
Freeze HEAD: 3db3666b4e7cb78062feb7a5c2a8b7e1db9319a4

## Non-negotiables
- M1 = DXY, week 2026-07-06, full E1 on preserved v1 baseline.
- Pinebox runtime is verified and read-only.
- plutus-browser is separate headed acquisition.
- Two work commits maximum between visual checkpoints.
- Every checkpoint has committed PNG evidence and matching hashes.
- Mimo v2.6 flash must return PASS and score >=7.
- M1-complete stops for operator review.

## First commands
```bash
cd /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION
git status --short
python3 -m py_compile gates/commit_gate.py
bash -n .githooks/pre-commit .githooks/commit-msg .githooks/reference-transaction
```

## Read next
| Order | Path |
|---|---|
| 1 | m1/EXECUTION_CONTRACT.md |
| 2 | design/BUILD_WORKFLOW_v5.0_CLOUDFLARE.md |
| 3 | design/DESIGN_BLUEPRINT_v5.0_CLOUDFLARE.md |
| 4 | gates/policy.json |
| 5 | MASTER_CONTEXT/OPERATOR_RULINGS_PV.md |

## First task
- Create m1/evidence/manifest.json from evidence already on disk.
- Record source path, SHA-256, pillar, publication timestamp, provenance, cutoff status.
- Name each missing source and impact.
- Commit as PV-Gate: work and increment work_commits_since_checkpoint.
- Reply with manifest path, counts, and HEAD only.

## Forbidden now
- Pinebox modification
- archive/baseline/canon/design/gate edits
- E2/E3
- random weeks
- other assets
- push
- success claim in a work commit

## Acceptance memory
| Family count | 13 |
|---|---|
| Minimum images at M1-complete | 2 |
| Model threshold | 7/10 |
| Operator unlock path | ~/.config/plutus-vision-gate/operator-unlock.token |
| Current E1 status | NOT STARTED |

## Required families at final checkpoint
| # | Family |
|---|---|
| 1 | IP resistance zones |
| 2 | IP equilibrium zone |
| 3 | IP support zones |
| 4 | Liquidity Sweep Zones |
| 5 | canonical 4H/D1 supply/demand zones beyond the v1 baseline |
| 6 | option-strike targets |
| 7 | POI tier and pressure-degree data |
| 8 | strength-based ZFP data |
| 9 | BoM/MoM classification |
| 10 | mitigation and reaction counts |
| 11 | intra-zone precision levels |
| 12 | core/spike boundaries where applicable |
| 13 | card/run identity and missing-data status |

## Refusal memory
| Token | Meaning |
|---|---|
| PV-TRAILER | no valid PV-Gate trailer |
| PV-WORK_CLAIM | work commit claims success |
| PV-CHECKPOINT_REQUIRED | visual checkpoint due |
| PV-PROTECTED_PATH | immutable path edited |
| PV-M1_SCOPE | phase or asset expansion |
| PV-VISUAL | missing/invalid PNG |
| PV-VISUAL_HASH | image hash mismatch |
| PV-M1_COMPLETE | family coverage incomplete |
| PV-M1_STOP | operator unlock required |
| PV-ADMIN | operator token absent |
| PV-MODEL_REJECT | score below 7 or REJECT |

## Immutable anchors
- m1/EXECUTION_CONTRACT.md:1
- design/BUILD_WORKFLOW_v5.0_CLOUDFLARE.md:325
- design/DESIGN_BLUEPRINT_v5.0_CLOUDFLARE.md:151
- gates/policy.json:1
- MASTER_CONTEXT/OPERATOR_RULINGS_PV.md:132
- Checkpoints/v1-ship-approved-working-baseline/dist/plutus-vision-v1.pine:1

## First hour
| Minute | Action | Output |
|---|---|---|
| 00-05 | read contract and workflow | authority loaded |
| 05-10 | run clean-tree and gate checks | command outputs |
| 10-20 | enumerate disk evidence candidates | source list |
| 20-35 | hash and classify available sources | manifest rows |
| 35-45 | name missing sources and impact | missing rows |
| 45-55 | write m1/evidence/manifest.json | typed JSON |
| 55-60 | commit PV-Gate: work and update state | commit hash |
| after 60 | stop and report counts; do not invent next phase | operator-visible receipt |
