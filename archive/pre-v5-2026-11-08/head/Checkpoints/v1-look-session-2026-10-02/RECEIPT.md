# SEAL — v1-look-session — 2026-10-02 (rev 2: docs at floor)

Parent commit: 0a4f9fcc8fe3af3a924e5911c4b22ad8e1fec953
Branch: main

## WHAT THIS SEAL PRESERVES
The state in which all three deliverables were LOOK-verified on the live display and
the 4-panel judgment grid was written for the operator's APPROVED. Every visual verdict
BEFORE this session was read off stacked layers and is void; these are the first.

## FILE RECEIPTS

### pine/ (the three deliverables)
  b6dda2dae4416ec8ab526bc10f393e193afc6660730a5e42d2c1c291218e5f85  lqz-luxalgo.pine
  946f4ca21b3ddc0ad4ae98e7b57e5ab8060358dc030b736c14012876224cb9ed  lqz-plutus.pine
  d41c6d9ccb1c5f8ee3523a7db6b72aa1be61c294b50e3a57e8f7f9b5052f2ea2  plutus-vision-v1.pine

### scripts/ (the machinery that renders and tests)
  0f8f116267684780031f243a9cf7da21475e457cedee70c311cc351be755204d  lqz-panel.mjs
  3099ce76d55016283449665cecef3b198b191cbbc732bd22beddca5898650df5  lqz_adversarial.py
  ccff1418e6a819232121f71df4f7cbbacdb1dc23e4d09df3c2a8b63382575f7e  lqz_assemble.py
  6d7bbd54b0fe661cfe9d7084158e909968b6d06e8cfb05261387ada2758f9147  lqz_luxalgo_build.py
  b3ded962209f5d5c509b59cbdf9ed3f4028930631d4f032dc6535bd2cdfe2a15  lqz_vision_build.py
  56e9a3eb1d83e43dc1bdabb403408dca76bb4c7413796de719151d529c778259  vision.mjs

### reports/
  fdb5c469dcc5baebe75ec9d2d7af96d4c9b6eb97f0d65bb9b3003481ac5b6abb  lqz_visual_ledger.md
  07a4e3bcf4c73dcc0f2c80764795ac04f60a5973d75c920016c6447f8c88dbd1  panel-grid-1H.png

### docs/
  42d56f7015176c254036b9048a064b1bfbd452c4420ad2296a4b15bb6b9608f6  BUILD_REPORT.md
  9b48af3fee056d23e68e4d3509ff52b9481ca2aa978e35b158ce53fc1b4ce852  CHANGELOG.md
  7b464801b8d8fdf849b88a3d2842bdd4521b8996838a79c53bc94176a8ac3046  CURRENT_STATE.md
  27024869c035d8407e16f33f13ec4bd4080e2909c5e15bbec634758604108c37  DEBUG_LOG.md
  d9db7cc35126f240f6d8ff4afff0ed770fa4116e14e91ff848d9110d0d50f2f5  EVIDENCE_STATE.md
  4ced933afc5ae285b52da62fee89fabcf8602baeb0e2e9ec4a887d56f3ccb431  NEXT_STEPS.md
  f68f4833e3473f8b91037c40f68f503932818aa663fb88d948b9767759f6c9f7  RUNNING_BUILD_LOG.md
  6929eb5053723324115ccc02e006f710fd30f5b3ac09b8bae1e62ee1dc94f705  RUNNING_DEBUG_LOG.md
  8f282d56ebd44c1977836c8207206cc58594ddc0b250ba164469472a0b16e847  SPEC.md
  cb2a0507b1c155f660f5599188a2b81b5ad6224d5fe612c718dc380a3fc142bb  TESTING_LOG.md

## DOC FLOOR AUDIT (this revision)
  BUILD_REPORT.md  2003 lines  (class floor 2000)  PASS
  DEBUG_LOG.md     1014 lines  (class floor 1000)  PASS
  FAILURE_LOG.md   754 lines  (class floor  500)  PASS

## THE COMMITS THIS SEAL COVERS
```
  0a4f9fc chore(seal): v1-look-session checkpoint + canon/ship doc updates
  554a42f test(lqz): the adversarial battery — 6/6, every guard bit its mutant
  af3a6e6 feat(lqz): W6 panel grid — 4 panels [library|D1|D2|D3], look-verified
  d6c633d fix(lqz): D1 — silence the detectors' paint, keep their detection (look-verified)
  c6a681a docs(lqz): the visual ledger — three panels looked at, D1 FAILS the look
  4530933 chore: sync served renderer copies
  122eb16 fix(vision): the frame swap must actually clear — every visual verdict was on stacked layers
  9cfab07 chore: sync the served renderer copies of the deliverables
```

## VERIFICATION STATE AT SEAL TIME
- adversarial battery: 6/6 PASS, ZERO confirmed defects (scripts/lqz_adversarial.py)
- the grid: reports/panel-grid-1H.png 2002x1340, panels distinct (3 distinct shas)
- the looks: D2 PASS / D3 PASS / D1 PASS after two fix rounds, all cited by frame sha
- tree: clean at 0a4f9fcc8fe3af3a924e5911c4b22ad8e1fec953

## OPEN AT SEAL TIME (not defects, not hidden)
1. the operator has NOT yet recorded APPROVED on the panel grid (SPEC step-4 gate)
2. fidelity deltas awaiting the operator's call: D2 denser than the library, D3 fills
   heavier, grid footer overlaps the bottom-left panel a few pixels
3. the other three timeframes (15m/30m/4H) were MEASURED, never looked at
4. no crash test has ever been run (operator directive 12, still not started)
5. no container round this session - every verdict is display-live, not container-grade
6. the object-budget allocator remains a policy, not a predicate

## HOW TO RESUME
1. read docs/CURRENT_STATE.md then docs/NEXT_STEPS.md
2. open reports/panel-grid-1H.png - that image is the operator's judgment surface
3. bash launch-pine-ide lqz-plutus.pine EUR/USD 1H   # the proven load path
4. bun scripts/lqz-panel.mjs 1H                      # regenerate the grid
5. python3 scripts/lqz_adversarial.py                # the guards must still bite
6. read docs/DEBUG_LOG.md EN-17..EN-21 and the five earlier entries at density
