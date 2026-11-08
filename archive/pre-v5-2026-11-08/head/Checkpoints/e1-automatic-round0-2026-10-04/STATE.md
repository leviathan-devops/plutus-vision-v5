# E1-AUTOMATIC ROUND-0 CHECKPOINT — 2026-10-04

**Purpose:** the pre-build baseline. The package is minted + dispatch-ready (spec APPROVED
0/8). This checkpoint captures the tree state BEFORE W1 dispatches, so a failed build rolls
back cleanly.

## THE FINGERPRINT
```
0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1 v1
3c3f1a76ee54b60d94d30343d72302d87d01d41768e8582e71d14c83d94155ec v2
db24a18cc8cdd2349ce2419b1a1439c089ce32d634cdb85d1953f3855a54f985 the frozen split arm
v1 lines: 1270
v2 lines: 1694
e1-render lines: 236
```

## GIT
```
branch: main
HEAD:   4044e97cca441daa49b2dd4d1b440ec8b212fc57
```

## WHAT IS IN THIS CHECKPOINT
- package/ — the complete E1-AUTOMATIC build package (2794 lines)
  (00-INDEX, 00-MISSION, 01-DISCOVERY, the DPL1 spec, the MASTER_BLUEPRINT,
   the CONTEXT_BIBLE, 06-WAVES, 07-GOALS, 08-SPLIT-TEST, reference/trident_v8_lsz.pine)
- STATE.md — this file

## THE PACKAGE MANIFEST (the line counts)
```
     142 00-INDEX.md
     111 00-MISSION.md
     170 01-DISCOVERY.md
     154 06-WAVES.md
     127 07-GOALS.md
      67 08-SPLIT-TEST.md
     324 CONTEXT_BIBLE.md
    1032 MASTER_BLUEPRINT.md
     609 plutus-vision-e1-automatic_DPL1_SPEC.md
      26 reference/trident_v8_lsz.pine
    2762 total
```

## THE NEXT ACTION
1. mint the /goal pin (the create flow)
2. dispatch W1 (e1_week.py + ST-18)
3. the gate: every wave advances only on its ST exit 0 + the audit

## THE PIN (added 2026-10-04)
```
GOAL_PIN.txt     124 lines   validate-goal-prompt.py -> PASS (7/7 slots, no placeholders)
MASTER_PROMPT.md 157 lines   the expanded on-disk depth
```

## THE COMPLETE MANIFEST (12 files, 3043 lines)
```
   142 00-INDEX.md
   111 00-MISSION.md
   170 01-DISCOVERY.md
   154 06-WAVES.md
   127 07-GOALS.md
    67 08-SPLIT-TEST.md
   324 CONTEXT_BIBLE.md
  1032 MASTER_BLUEPRINT.md
   157 MASTER_PROMPT.md
   609 plutus-vision-e1-automatic_DPL1_SPEC.md
   124 GOAL_PIN.txt
    26 reference/trident_v8_lsz.pine
```

## THE VALIDATION RECORD
```
spec-audit plutus-vision-e1-automatic_DPL1_SPEC.md  ->  APPROVED (0/8 gates)
validate-goal-prompt.py GOAL_PIN.txt                ->  PASS (124 lines, 7/7 slots)
```
