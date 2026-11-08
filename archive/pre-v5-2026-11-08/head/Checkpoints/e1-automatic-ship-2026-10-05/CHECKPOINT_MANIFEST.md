# CHECKPOINT MANIFEST — e1-automatic-ship-2026-10-05

**Sealed:** 2026-10-05 · **git:** 4044e97 · **seal mode:** NO-LOCK
(the tree is large; the lock is the v1 SHA, checked by every build — the H1 guard is the seal)

## THE FINGERPRINT (assert on restore)
```
v1 seal       0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1  (1270 lines)
v2 built      7115b73488bdc0eb98bbad14de65e294641bd22327f89af7c8bbab2935d49ac9  (1671 lines)
served        7115b73488bdc0eb98bbad14de65e294641bd22327f89af7c8bbab2935d49ac9
e1-render     04d22f44dcebc7cb2f06d2a5d243264acf5ccecf1b9e13ed219a168185ff76de
evidence/w4   11767ea6e742d7541ac4821b913761c2bb06370d3a07d0dee581a7a773b4c7a8
evidence/w9   b2e0e36c7a1c3eb86f5af87b33a3e217cdf920c381b76cba58d23bf76966ff7c
```

## WHAT SHIPPED (the E1 automatic layer)
- W1 anchor (e1_week.py) · W2 gap (e1_category.py) · W3 data (e1_extract.py + payload)
- W4 render (e1-render.pine — the v8 ladder VERBATIM) · W5 build+make e1 (the seal bites)
- W6 harvest (e1_sources.py) · W7 arms (e1_vlm_options.py + e1_judge.py) · W9 the rig
- the suites: ST-18 8/0 · ST-19 10/0 · ST-20 7/0 · ST-21 4/0 · ST-26 4/0 · ST-22 7/0 (6/6)

## THE VISUAL PROOF (the operator's metric)
- evidence/w4-e1-zones.png  — the v8 ladder on the live IDE (red RESISTANCE + teal SUPPORT)
- evidence/w9-final-render.png — the final state, two readers (CDP + the opened PNG)

## HONEST GAPS (the residual — named, not hidden)
- C9/C10: 2 anchors dropped (a stale-last-bar marker from E2/v1, NOT the E1 zones)
- C11: the render is chart-anchored (bar_index) AND the SHELL now re-runs the indicator on replay
  step — FIXED in-repo + visually proven (`evidence/c11-replay-rewind.png`, bars 1614→41)
- C16: the operator has not yet said 'this is right'
- AUDIT GATE: PASS (the full verboo-lane scan — 1 critical + the confirmed highs FIXED,
  `reports/ocr-e1-automatic*.json`); the earlier BLOCKED was the muse-free lane's 429
- W6: 1/8 sources wired (ohlc live; S3-S9 honest [NO DATA])
- W8 (four pairs) + W10 (split test): deferred per the pin
- the E1 zones cluster near spot (the 6 highest-confluence levels)

## THE RESTORE
```bash
cp -r Checkpoints/e1-automatic-ship-2026-10-05/scripts/*  scripts/                 # the source
cp Checkpoints/e1-automatic-ship-2026-10-05/render/plutus-vision-v2.pine plutus-vision-v2.pine
cp Checkpoints/e1-automatic-ship-2026-10-05/render/plutus-vision-v2.pine pine-ide/ide/renderer/
cp Checkpoints/e1-automatic-ship-2026-10-05/Makefile .
sha256sum plutus-vision-v1.pine   # MUST be 0d20e8314ce992fc...
make e1-test && make e1
```


## RE-SEALED 2026-10-05 (post-audit fixes)
```
v2 built   7115b73488bdc0eb98bbad14de65e294641bd22327f89af7c8bbab2935d49ac9
served     7115b73488bdc0eb98bbad14de65e294641bd22327f89af7c8bbab2935d49ac9
e1-render  04d22f44dcebc7cb2f06d2a5d243264acf5ccecf1b9e13ed219a168185ff76de
e2-render  6e2a608115e51eb2b623e4d8c5ce913900832a660a407187c6c5c06695200462
```
(the audit fixes are folded in: 15 findings across rounds 1-2)

## FINAL RE-SEAL 2026-10-05 (C11 + doc consolidation)
```
v1 seal    0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1
v2 built   7115b73488bdc0eb98bbad14de65e294641bd22327f89af7c8bbab2935d49ac9
v2 served  7115b73488bdc0eb98bbad14de65e294641bd22327f89af7c8bbab2935d49ac9
e1-render  04d22f44dcebc7cb2f06d2a5d243264acf5ccecf1b9e13ed219a168185ff76de
pine-ide   f53daecc22a28052047647160d65a6d9efb19f2d8d9c297b10243d847d1ca279
```
SEAL MODE: NO-LOCK (the v1 SHA is the seal, checked on every build — the H1 guard).
58 files: scripts (13) + render (4) + pine-ide (1) + Makefile + docs/canon (11) + docs/ship (6) + package + evidence (3).

## THE VISUAL PROOF (the operator's metric)
- evidence/w4-e1-zones.png     — the v8 ladder on the live IDE (red RESISTANCE + teal SUPPORT)
- evidence/w9-final-render.png — the final state, two readers
- evidence/c11-replay-rewind.png — the chart rewound to Mar 29→Apr 3, bars 1614→41
