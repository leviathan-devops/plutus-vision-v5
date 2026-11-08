# TASK_QUEUE — PLUTUS VISION v5 / M1

**PROJECT FINGERPRINT:** `1b26afc522a26531421b5398e020671ddd8cc6697b09e9457582fd8c234f9a4e`
**Fingerprint subject:** `gates/policy.json` (the M1 gate policy; changed by admin repair e5d2465)
**Git HEAD when generated:** `faebc8c2783b1f4d0f13c535a81746a4325a8c45`
**Generated:** `2026-11-08T19:21:01+00:00` · semantics per context_management/CANON_MANIFEST.md:1


## THE ACTIVE-WEEK LAW (operator ruling 2026-11-08, repeated "300+ times" — read before any render)

1. **The indicator detects the trading week from the MOST RECENT CANDLE** and renders the zones for that week. Nothing
   in the composition may hardcode a week (no week timestamps, no week-specific arrays selected by hand). The v1
   baseline already behaves this way; the E1 layer must too.
2. **To render the golden week, REWIND THE CANDLES** in Pinebox so the golden week holds the last candle on the chart —
   nothing after it exists. Scrolling/panning the view is NOT rewinding (CP-001/CP-002 were framed by panning while the
   data ran to Nov 6: v1 drew on Nov, E1 on Jul 6 — F-08, operator-caught).
3. **Both layers render together** on the active week: v1 baseline + full E1 on the same candles.
4. Mechanism (in progress): E1 cards are keyed by week Monday; the Pine layer computes the active week from the last
   bar (week opens Sunday 22:00 UTC, 17:00 New York roll) and draws the card for that week; a week with no card prints
   a named refusal on the chart ("E1: no card for week <Monday>"), never another week's zones.
5. Rewind tool: the Pinebox Backtest room replay (EXPORT TO BACKTEST from the Pine IDE; session window ending at the
   golden week's Friday 21:00 UTC; `backtest op=date`/`step` to the week's last bar) — verify in the opened picture that
   the last candle is in 2026-07-06..10 before judging any zone.

Operator, verbatim: "In case you haven't noticed, both of the zones are rendered in two completely different places. Why is that? We have the V1 baseline from the checkpoint. It's rendered on the most recent candles, and then we have the other side of the coin, which is the prompt version of the E1 zones, and that's rendered on the Golden Week ... They all need to be rendered together, not in two completely different fucking places."
"you need to on the Pine IDE rewind the candles to the golden week so that anything past the golden week doesn't yet exist on the chart because it's not rendered ... the indicator needs to not be hard-coded to a specific week ... The indicator needs to Detect based on the most recent candle what is the trading week and render the zones for that trading week's relevance. The V1 baseline is already doing this correctly. And right now your other E1 zones for the prompt based Canon, you have it hard coded to the golden week ... Write this into the Canon docs so you don't forget."

## 1. Done (with evidence)

| Task | Evidence |
|---|---|
| delete the previous M1 attempt (operator order) | branch reset to 3b69f65; objects pruned (m1/docs/BUILD_REPORT.md:1) |
| Protocol A for 2026-07-06 via plutus-browser | m1/evidence/protocol-a/extraction.json:1 |
| E1 engine P1, P2, P3/P8, P5, P6, P7, P9, assembly | m1/src/*.ts (CURRENT_STATE §2) |
| v1+E1 composition generator | m1/src/compose.ts:22 |
| legibility pass | CP-001, commit 8ae7388, tag vc/CP-001 |
| gate repairs (image budget; parse + once-per-transaction) | e5d2465, 378153a; bypass control refused |
| visual rolodex + restore proof | m1/VISUAL_CHECKPOINTS_LOG.md:1; restore sha identical |
| ship-docs-update skill: rolodex contract added | ~/.omp/agent/skills/ship-docs-update/SKILL.md:74 |

## 2. Active

| Task | Target | State |
|---|---|---|
| ACTIVE-WEEK LAW: E1 detects the week from the last candle; candles rewound via replay | v1 + E1 on the same week (F-08) | **next** |
| CP-002 ZFP strength | outcome 42.9% -> 83.3% | done (faebc8c) |
| BoM/MoM 100.61-100.68 | family BoM/MoM MATCHED | next |
| LSZ for the Jul 10 sweep | family LSZ MATCHED | queued |
| resistance ladder above the week | family IP resistance MATCHED | queued |
| reaction / intra / core-spike / table visible | 4 families MATCHED/observable | queued |
| 4H S/D coverage (Jul 2 origin) | family S/D MATCHED | queued |

## 3. Blocked (by ruling, not by defect)

| Task | Blocked until |
|---|---|
| random weeks, EUR/USD, GBP/USD | operator review after M1 |
| E2, E3 | operator review after M1 |
| push | explicit operator order |

## 4. Queue laws

- one defect at a time, re-rendered and looked at after each change;
- at most 2 work commits, then a visual checkpoint;
- an operator screenshot is stored with the commit it shows;
- the opened picture decides; evaluate.ts measures.

## 4b. Session ledger (2026-11-08)

| Time (UTC) | Event | Artifact |
|---|---|---|
| ~17:50 | previous M1 attempt deleted on order | branch at 3b69f65 |
| ~18:20 | VC-000 first render (unreadable) | m1/visual-log/VC-000/ |
| ~18:37 | CP-001 composition loaded; operator: improvement | composition c9261fb3 |
| 18:52 | gate repair 1 (image budget) | e5d2465 |
| 18:57 | gate repair 2 (parse, prepared-only, once per transaction) | 378153a |
| 19:00 | CP-001 committed + tagged; restore proven | 8ae7388, vc/CP-001 |
| 19:10 | rolodex hash back-fill | a76e450 |

## 5. Operator-only actions

- approve M1 (unlock token) after the independent verification;
- decide whether to move the branch to an older checkpoint (restore into a scratch dir needs no decision).

## 6. Open defects behind the active tasks

| # | Open defect (CP-002) | Evidence | Next move |
|---|---|---|---|
| 0 | **E1 week hardcoded; v1 and E1 on different weeks** (F-08) | CP-002 comparison WRONG row | active-week detection in the Pine layer + rewind candles via replay |
| 1 | Z16 100.911-100.985 predicted HOLD, BROKE (5/6 = 83.3%) | m1/checkpoints/CP-002/outcome.txt | canon only — no zone-specific tuning |
| 2 | oracle 1H BoM demand 100.654-100.748 (Jul 3 07:00) not drawn | comparison S/D, BoM/MoM rows | 1H precision anchors (0g) nested in the support band |
| 3 | no LSZ for the Jul 10 sweep to 100.598 | comparison LSZ row | LSZ from 1H/4H swing extremes near spot |
| 4 | resistance bands above the week high (EXTRA) | comparison EXTRA row | thin by pressure |
| 5 | intra-zone, core/spike not on the chart | comparison MISSING rows | short in-week ticks for the zones nearest spot |
| 6 | E1 identity table not visible; option labels cut at the right edge | comparison rows | place inside the chart capture |

## 7. What is moving the build in the right direction

1. **Drive Pinebox only with the `pinebox` tool** (load / chart view|zoom|pan / shot). It frames any week in seconds.
   Never CDP scripts, never the IDE source. Operator ruling: "There are no issues with the tool at all. If there's a
   problem, you are the problem. Period."
2. **Every chart number comes from the card; the card comes from disk bars + Protocol A evidence.** Nothing about the
   golden week is typed in m1/src (grep record in m1/docs/TESTING_LOG.md:1).
3. **Legibility rules (CP-001, operator: "Much less clutter, much more legible"):** draw only MODERATE+ zones, only
   inside the measured weekly band (spot +/- max(prior-week range, mean 4-week range)), each box from its origin
   candle, one label per zone, P8 EUR/USD strike lines only. Full output stays in the card.
4. **Measure every change twice:** the opened capture against the oracle (the verdict) and evaluate.ts (the numbers).
5. **Every picture is committed with its code** — the rolodex m1/VISUAL_CHECKPOINTS_LOG.md:1, tag vc/<id>, restore
   proven by archive + regenerate (CP-001: identical sha).

## 8. The loop

```text
bun m1/src/run.ts DXY 2026-07-06        -> m1/out/e1-card-DXY-2026-07-06.json (sealed sha inside)
bun m1/src/compose.ts DXY 2026-07-06    -> m1/out/plutus-vision-v5-e1-DXY-2026-07-06.pine
pinebox tool: verb=load id=3 pine=<that file> pair=DXY tf=1H
pinebox tool: verb=chart id=3 op=view | op=zoom dir=IN (x n) | op=pan dx=<fraction, -1 = one screen back>
pinebox tool: verb=shot id=3 section=chart out=/tmp/<name>.png   -> OPEN it, compare to the oracle
bun m1/src/evaluate.ts DXY 2026-07-06   -> hold/break table (instrument, not the verdict)
checkpoint commit (code + card + composition + PNGs + checkpoint.json + comparison.json + state) -> tag vc/CP-<n>
```

## MEASURED APPENDIX (generated 2026-11-08T19:21:01+00:00 from the live tree; HEAD faebc8c)

### Tracked M1 + gate inventory (path | lines or bytes | sha256[:16])
| Path | Lines | sha16 |
|---|---|---|
| .githooks/commit-msg | 66 | 49aa8c536a31ac94 |
| .githooks/lib/pattern-header.sh | 84 | ae0cc586df3aec09 |
| .githooks/lib/scan-phantom.sh | 113 | 9b4e80cbfd2ba24d |
| .githooks/lib/scan-silent.sh | 225 | 5aef733ca08de9bd |
| .githooks/lib/scan-stub.sh | 126 | 4cb5d4afec6d6709 |
| .githooks/pre-commit | 324 | 970464c489aa1d93 |
| .githooks/pre-push | 176 | eac81eec9c447500 |
| .githooks/prepare-commit-msg | 101 | 3d784b510c45f8cd |
| .githooks/reference-transaction | 13 | b3f645711daca411 |
| gates/commit_gate.py | 578 | a4114015faed9fc4 |
| gates/controls/mimo-vision-control.json | 14 | ebc85f2af93c8cb3 |
| gates/controls/mimo-vision-control.png | binary 804 B | e042c61e84e4c8bc |
| gates/policy.json | 98 | 1b26afc522a26531 |
| m1/EXECUTION_CONTRACT.md | 311 | a496716880f8fe6f |
| m1/VISUAL_CHECKPOINTS_LOG.md | 133 | ac7a30131ae72ac2 |
| m1/checkpoints/CP-001/checkpoint.json | 109 | 74854757cb555d55 |
| m1/checkpoints/CP-001/comparison.json | 86 | bc519c86f0a7e328 |
| m1/checkpoints/CP-001/outcome.txt | 10 | 1d7539c56f91aedc |
| m1/checkpoints/CP-001/visual/operator-orca-2026-11-08-2137.png | binary 3083126 B | e618b512908794b5 |
| m1/checkpoints/CP-001/visual/runtime-state.png | binary 142712 B | 3ae1a18d0983329e |
| m1/checkpoints/CP-002/checkpoint.json | 104 | e94113cf383ffca4 |
| m1/checkpoints/CP-002/comparison.json | 95 | 34523792834a7572 |
| m1/checkpoints/CP-002/outcome.txt | 10 | e900a11ef04d6a6a |
| m1/checkpoints/CP-002/visual/runtime-state.png | binary 159315 B | 11cdb8ed7e4d5ebe |
| m1/docs/BUILD_REPORT.md | 114 | 9e0cebecd6677867 |
| m1/docs/DEBUG_LOG.md | 179 | a5859575daea4bbe |
| m1/docs/FAILURE_LOG.md | 112 | ebbcea3ede5f475f |
| m1/docs/SHIP_DOCS_MANIFEST.yml | 11 | 91ea8d8358ca0a90 |
| m1/docs/SPEC_VIOLATION_LOG.md | 105 | 49610df1755f82db |
| m1/docs/TESTING_LOG.md | 141 | ec1ae480caf220b9 |
| m1/docs/THEATRICALITY_LOG.md | 114 | accaec3052531e20 |
| m1/evidence/.gitkeep | 0 | e3b0c44298fc1c14 |
| m1/evidence/protocol-a/extraction.json | 267 | 6a19ef94732bd44b |
| m1/evidence/protocol-a/investinglive-fxo-2026-07-06.jpg | binary 102419 B | 10d594f6491d5b12 |
| m1/evidence/protocol-a/pass2-eurusd-usdjpy-monday.png | binary 296761 B | 71769468798e7f07 |
| m1/evidence/protocol-a/pass3-eurusd-usdjpy-tuesday.png | binary 246309 B | 57c2a80bec2fac2b |
| m1/out/.gitkeep | 0 | e3b0c44298fc1c14 |
| m1/out/e1-card-DXY-2026-07-06.json | 6399 | 567f3fb80d942ba7 |
| m1/out/plutus-vision-v5-e1-DXY-2026-07-06.pine | 1245 | 5f1c4641a4777780 |
| m1/src/.gitkeep | 0 | e3b0c44298fc1c14 |
| m1/src/assemble.ts | 226 | 64c3a9477507581e |
| m1/src/bars.ts | 52 | b655f8c47196969e |
| m1/src/card.ts | 23 | 3d8801eff9a8adfb |
| m1/src/compose.ts | 103 | bfe450c046d058a0 |
| m1/src/evaluate.ts | 49 | 873b7218d519575c |
| m1/src/fs-source.ts | 11 | 379c5cae8b7d31ac |
| m1/src/levels.ts | 14 | eb309c81846da757 |
| m1/src/options.ts | 53 | d1f498cc69698b1f |
| m1/src/p1.ts | 65 | b9b3bad105f92c53 |
| m1/src/p2.ts | 42 | cbac0b3935daa870 |
| m1/src/p5.ts | 193 | 9f6439fc05b4af50 |
| m1/src/p6p7.ts | 45 | 50d13af5862ed943 |
| m1/src/run.ts | 94 | e2f018a05c55a7c3 |
| m1/src/window.ts | 56 | 62a00b76fbae91f4 |
| m1/state.json | 11 | 98d823d27a033bdc |
| m1/visual-log/VC-000/operator-orca-2026-11-08-2132.png | binary 2747685 B | 974c30a8c1816b83 |
| m1/visual-log/VC-000/runtime-r1.png | binary 110840 B | d35dbb34cb419bae |

### Commit chain (newest first)
| Commit | Subject |
|---|---|
| faebc8c | feat(m1): CP-002 canon S/D origin, reaction counter and time-dependent ZFP (visual checkpoint) |
| ed2751f | docs(canon): refresh the M1 context after CP-001 (operator-ordered canon-doc-update) |
| a76e450 | docs(m1): back-fill the CP-001 commit in the visual rolodex and record its restore run |
| 8ae7388 | feat(m1): CP-001 legible E1 pressure map on the golden week (visual checkpoint) |
| 378153a | fix(gates): grade once per transaction on the prepared state; keep unparseable grader answers |
| e5d2465 | fix(gates): grade real screenshots - separate text and image budgets |
| 3b69f65 | docs(handover): package the self-contained M1 build context |
| 3db3666 | docs(canon): seed the clean v5 M1 context |
| cf5da64 | fix(gates): stream the grader body over stdin |
| 1ebeaf4 | build(gates): size the grader prompt to the canon set |
| 62e2e9f | docs(workflow): bind M1 execution to the git gate |
| aa35d7e | fix(gates): name an absent PV trailer refusal |

### Required family state at the latest checkpoint (m1/checkpoints/CP-002/comparison.json:1)
| Family | Status |
|---|---|
| IP resistance zones | MATCHED |
| resistance bands above the week high | EXTRA |
| IP equilibrium zone | MATCHED |
| IP support zones | WRONG |
| Liquidity Sweep Zones | WRONG |
| canonical 4H/D1 supply/demand zones beyond the v1 baseline | WRONG |
| option-strike targets | WRONG |
| POI tier and pressure-degree data | MATCHED |
| strength-based ZFP data | WRONG |
| BoM/MoM classification | WRONG |
| mitigation and reaction counts | MATCHED |
| intra-zone precision levels | MISSING |
| core/spike boundaries where applicable | MISSING |
| card/run identity and missing-data status | UNOBSERVABLE |
| v1 baseline and E1 rendered on the same active trading week | WRONG |

### Golden-week outcome at the latest checkpoint (m1/checkpoints/CP-002/outcome.txt)
```
week 2026-07-06 range 100.598-101.275 | zones in range 9 | tested 6 | correct 5 (83.3%)
Z12  101.316-101.461 resistance  HEAVY          11.5 ZFP 5     pred HOLD  -> UNTESTED   card 5
Z13  101.309-101.309 resistance  MODERATE-HEAVY 9.5  ZFP 5     pred HOLD  -> UNTESTED   card 5
Z14  101.160-101.287 resistance  HEAVY          10   ZFP 40    pred HOLD  -> HELD     OK   07-07T23:00 card 40
Z15  100.997-101.129 equilibrium MODERATE-HEAVY 9    ZFP 22.5  pred HOLD  -> HELD     OK   07-06T08:00 card 22.5
Z16  100.911-100.985 support     MODERATE-HEAVY 9    ZFP 40    pred HOLD  -> BROKE    MISS 07-06T16:00 card 40
Z17  100.850-100.893 support     MODERATE       7    ZFP 72.5  pred BREAK -> BROKE    OK   07-06T18:00 card 22.5 +25 Spring Release (expired 07-06T14:00) +25 Cascade (Z16 broke)
Z18  100.746-100.842 support     MODERATE-HEAVY 8    ZFP 40    pred HOLD  -> HELD     OK   07-06T18:00 card 40
Z19  100.593-100.695 support     MODERATE-HEAVY 8.5  ZFP 47.5  pred HOLD  -> HELD     OK   07-10T02:00 card 22.5 +25 Spring Release (expired 07-06T14:00)
Z20  100.500-100.584 support     MODERATE-HEAVY 8.5  ZFP 40    pred HOLD  -> UNTESTED   card 40
```
