# BUILD_STATE — PLUTUS VISION v5 / M1

**PROJECT FINGERPRINT:** `1b26afc522a26531421b5398e020671ddd8cc6697b09e9457582fd8c234f9a4e`
**Fingerprint subject:** `gates/policy.json` (the M1 gate policy; changed by admin repair e5d2465)
**Git HEAD when generated:** `a76e450325212875353fdb04b5577b7f14e2cef8`
**Generated:** `2026-11-08T19:00:28+00:00` · semantics per context_management/CANON_MANIFEST.md:1

## 1. Build identity

| Field | Value |
|---|---|
| Milestone | M1_GOLDEN_WEEK (DXY, 2026-07-06) |
| Branch / HEAD | step_agent / a76e450325212875353fdb04b5577b7f14e2cef8 |
| Latest checkpoint | CP-001 — 8ae7388d421703d97d98187e9d260d903d1b3573 — tag vc/CP-001 |
| Composition (dist) | m1/out/plutus-vision-v5-e1-DXY-2026-07-06.pine sha256 c9261fb3f5a0fb9b480aa08b3f870d0dddf54746b30b342bd75788545a1c3684 |
| Card | m1/out/e1-card-DXY-2026-07-06.json, sealed sha256 07bce57fe2a937ffb19bb81256bff0ffe542a5bb5eb27c3dc0d6f1fad3a23af1 |
| v1 baseline | Checkpoints/v1-ship-approved-working-baseline/dist/plutus-vision-v1.pine sha256 82da437af969a3157bd9454cbe70497ce01cf71fe4681b9e2401b754aa90cd43 |
| Gate policy | gates/policy.json sha256 1b26afc522a26531421b5398e020671ddd8cc6697b09e9457582fd8c234f9a4e |
| m1/state.json | checkpoint_seq 1, work_commits_since_checkpoint 1, m1_status IN_PROGRESS |

## 2. SHA chain (append; newest last)

| When | Artifact | sha256 |
|---|---|---|
| 2026-11-08 CP-001 | composition | c9261fb3f5a0fb9b480aa08b3f870d0dddf54746b30b342bd75788545a1c3684 |
| 2026-11-08 CP-001 | runtime-state.png | 3ae1a18d0983329edae6b40db936724b446e97f193d811782a5d505fb1e19287 |
| 2026-11-08 e5d2465 | gates/policy.json | 1b26afc522a26531421b5398e020671ddd8cc6697b09e9457582fd8c234f9a4e |

## 3. Engine modules

| Module | Role | Anchor |
|---|---|---|
| m1/src/window.ts | run identity; Sun 22:00 UTC open; Mon 09:00 London cutoff; Fri 21:00 UTC end; 17:00 NY session roll | m1/src/window.ts:33 |
| m1/src/bars.ts, fs-source.ts | TradingView bars from the Pinebox store; named refusal on a missing month | m1/src/bars.ts:14 |
| m1/src/p1.ts | P1 Classic/Fib/Camarilla, week + last 3 sessions + overlapping weeks, 4 checks or throw | m1/src/p1.ts:45 |
| m1/src/p2.ts | P2 EMA/SMA 9..200 grid, clusters, recaptures | m1/src/p2.ts:15 |
| m1/src/options.ts | P3/P8 strike -> DXY conversion, tiers (EUR/USD on EUR notional), bands, K | m1/src/options.ts:25 |
| m1/src/p5.ts | P5 swings, OBs, LSZ, magnets, 4H/1H singular-candle S/D, BoM/MoM, mitigation, anchors | m1/src/p5.ts:82 |
| m1/src/p6p7.ts | P6 fib + round grid; P7 arena (fallback) | m1/src/p6p7.ts:17 |
| m1/src/assemble.ts | scoring (6 dims), zones, POI tiers, ZFP (App. B), reactions, intra, core/spike, gaps, 9.8 | m1/src/assemble.ts:72 |
| m1/src/run.ts | one sealed card per (asset, week) + render_policy band | m1/src/run.ts:18 |
| m1/src/compose.ts | v1 baseline bytes + generated E1 layer (synthesis only) | m1/src/compose.ts:22 |
| m1/src/evaluate.ts | week-outcome instrument: card zones vs week 1H bars vs ZFP | m1/src/evaluate.ts:1 |
| m1/src/card.ts | the typed card boundary | m1/src/card.ts:17 |

## 4. Enforcement machinery

| Surface | File | Behaviour |
|---|---|---|
| pre-commit | .githooks/pre-commit:323 | W-9 doc floor (100 lines, 3 anchors); M1 path checks |
| commit-msg | .githooks/commit-msg | PV-Gate trailer; work commits may not claim success |
| reference-transaction | .githooks/reference-transaction:11 | non-bypassable; prepared state only; one grade per transaction |
| commit gate | gates/commit_gate.py:199 | checkpoint shape, PNG hashes, state machine, external grader |
| grader budgets | gates/commit_gate.py:366 | text <= 220000 chars; images <= 1500000 chars (PNG/JPEG smaller) |

## 5. External grader

mimo-v2.6-flash over http://127.0.0.1:4097/zen/go/v1/responses; PASS and score >= 7. Positive control on real
checkpoint pictures (2026-11-08): named symbol, timeframe, date range and price range of both CP-001 images correctly.

## 6. Runtime dependency state

- Pinebox Cloud instance 3 (Orca Linux tab) — used unchanged.
- plutus-browser instance 13 — headed acquisition.
- Bars: ~/.local/share/pinebox/data/tv-bars/TVC_DXY (48 month files hashed in CP-001 checkpoint.json).

## 7. Not built

- 13/13 families; 95% outcome; independent verification; M1-complete commit.
- P4 analyst evidence (MISSING by search); P7 ICE/CME (fallback arena); H.10 pre-cutoff release (does not exist).

## 8. Open defects

| # | Open defect (CP-001) | Evidence | Next move |
|---|---|---|---|
| 1 | ZFP predicts BREAK at zones the week rejected (Z13, Z14 ZFP 60 -> HELD); 3/7 correct | m1/checkpoints/CP-001/outcome.txt | B.2 modifiers fire on regime direction alone; weigh strength (zone type, POI tier, reactions) per App. B |
| 2 | 100.61-100.68 1H origin labelled MoM 2X; oracle: 1H BoM | comparison row BoM/MoM | the leg it starts must classify BoM (m1/src/p5.ts:57) |
| 3 | no LSZ for the Jul 10 sweep to 100.598 | comparison row LSZ | LSZ from 1H/4H swing lows near spot, not only D1 swings |
| 4 | 4 resistance bands above the week high (101.275) | runtime-state.png | thin the ladder by pressure; the band keeps them |
| 5 | reaction counts, intra-zone, core/spike not on the chart | comparison rows MISSING | show them without re-cluttering (in-week ticks near the zone) |
| 6 | E1 identity table not visible | comparison row UNOBSERVABLE | position/size so the chart capture shows it |
| 7 | 4H BoM supply 101.33-101.40 drawn only as a 1H box | comparison row S/D | 4H scan coverage of the Jul 2 origin |

## 9. Loop

```text
bun m1/src/run.ts DXY 2026-07-06        -> m1/out/e1-card-DXY-2026-07-06.json (sealed sha inside)
bun m1/src/compose.ts DXY 2026-07-06    -> m1/out/plutus-vision-v5-e1-DXY-2026-07-06.pine
pinebox tool: verb=load id=3 pine=<that file> pair=DXY tf=1H
pinebox tool: verb=chart id=3 op=view | op=zoom dir=IN (x n) | op=pan dx=<fraction, -1 = one screen back>
pinebox tool: verb=shot id=3 section=chart out=/tmp/<name>.png   -> OPEN it, compare to the oracle
bun m1/src/evaluate.ts DXY 2026-07-06   -> hold/break table (instrument, not the verdict)
checkpoint commit (code + card + composition + PNGs + checkpoint.json + comparison.json + state) -> tag vc/CP-<n>
```

## MEASURED APPENDIX (generated 2026-11-08T19:00:28+00:00 from the live tree; HEAD a76e45032521)

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
| m1/VISUAL_CHECKPOINTS_LOG.md | 117 | a7581bb594c1e8d2 |
| m1/checkpoints/CP-001/checkpoint.json | 109 | 74854757cb555d55 |
| m1/checkpoints/CP-001/comparison.json | 86 | bc519c86f0a7e328 |
| m1/checkpoints/CP-001/outcome.txt | 10 | 1d7539c56f91aedc |
| m1/checkpoints/CP-001/visual/operator-orca-2026-11-08-2137.png | binary 3083126 B | e618b512908794b5 |
| m1/checkpoints/CP-001/visual/runtime-state.png | binary 142712 B | 3ae1a18d0983329e |
| m1/docs/BUILD_REPORT.md | 106 | c3c4352f474d5a5d |
| m1/docs/DEBUG_LOG.md | 135 | 756cfc25772015b8 |
| m1/docs/FAILURE_LOG.md | 102 | a00b451dbf3a8336 |
| m1/docs/SHIP_DOCS_MANIFEST.yml | 11 | 0b3b6bf848086c3b |
| m1/docs/SPEC_VIOLATION_LOG.md | 105 | 49610df1755f82db |
| m1/docs/TESTING_LOG.md | 122 | fe8cf08b9d16afcf |
| m1/docs/THEATRICALITY_LOG.md | 107 | 9ca17f533cc9a999 |
| m1/evidence/.gitkeep | 0 | e3b0c44298fc1c14 |
| m1/evidence/protocol-a/extraction.json | 267 | 6a19ef94732bd44b |
| m1/evidence/protocol-a/investinglive-fxo-2026-07-06.jpg | binary 102419 B | 10d594f6491d5b12 |
| m1/evidence/protocol-a/pass2-eurusd-usdjpy-monday.png | binary 296761 B | 71769468798e7f07 |
| m1/evidence/protocol-a/pass3-eurusd-usdjpy-tuesday.png | binary 246309 B | 57c2a80bec2fac2b |
| m1/out/.gitkeep | 0 | e3b0c44298fc1c14 |
| m1/out/e1-card-DXY-2026-07-06.json | 6174 | 2cf424d6a2e1966e |
| m1/out/plutus-vision-v5-e1-DXY-2026-07-06.pine | 1245 | c9261fb3f5a0fb9b |
| m1/src/.gitkeep | 0 | e3b0c44298fc1c14 |
| m1/src/assemble.ts | 191 | fbcbc582fc64acf4 |
| m1/src/bars.ts | 52 | b655f8c47196969e |
| m1/src/card.ts | 23 | 3d8801eff9a8adfb |
| m1/src/compose.ts | 103 | 6f466652b455737b |
| m1/src/evaluate.ts | 35 | e3daba958f9fd739 |
| m1/src/fs-source.ts | 11 | 379c5cae8b7d31ac |
| m1/src/levels.ts | 14 | eb309c81846da757 |
| m1/src/options.ts | 53 | d1f498cc69698b1f |
| m1/src/p1.ts | 65 | b9b3bad105f92c53 |
| m1/src/p2.ts | 42 | cbac0b3935daa870 |
| m1/src/p5.ts | 180 | c4fe66c7a504a317 |
| m1/src/p6p7.ts | 45 | 50d13af5862ed943 |
| m1/src/run.ts | 95 | d8acc8d895dd11a6 |
| m1/src/window.ts | 56 | 62a00b76fbae91f4 |
| m1/state.json | 11 | 833e3f90e4421866 |
| m1/visual-log/VC-000/operator-orca-2026-11-08-2132.png | binary 2747685 B | 974c30a8c1816b83 |
| m1/visual-log/VC-000/runtime-r1.png | binary 110840 B | d35dbb34cb419bae |

### Commit chain (newest first)
| Commit | Subject |
|---|---|
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
| 3b28cca | build(gates): install the M1 mechanical commit gate |
| 9b061e0 | chore(archive): freeze the pre-v5 tree beyond the v1 baseline floor |

### Required family state at the latest checkpoint (m1/checkpoints/CP-001/comparison.json:1)
| Family | Status |
|---|---|
| IP resistance zones | WRONG |
| IP equilibrium zone | MATCHED |
| IP support zones | WRONG |
| Liquidity Sweep Zones | WRONG |
| canonical 4H/D1 supply/demand zones beyond the v1 baseline | WRONG |
| option-strike targets | WRONG |
| POI tier and pressure-degree data | MATCHED |
| strength-based ZFP data | WRONG |
| BoM/MoM classification | WRONG |
| mitigation and reaction counts | MISSING |
| intra-zone precision levels | MISSING |
| core/spike boundaries where applicable | MISSING |
| card/run identity and missing-data status | UNOBSERVABLE |

### Golden-week outcome at the latest checkpoint (m1/checkpoints/CP-001/outcome.txt)
```
{"path":"m1/out/plutus-vision-v5-e1-DXY-2026-07-06.pine","sha":"c9261fb3f5a0fb9b480aa08b3f870d0dddf54746b30b342bd75788545a1c3684","cardSha":"07bce57fe2a937ffb19bb81256bff0ffe542a5bb5eb27c3dc0d6f1fad3a23af1","drawn":16,"cardZones":43,"lsz":1,"opts":5,"sd":5,"band":{"lo":99.869,"hi":102.143}}
week 2026-07-06 range 100.598-101.275 | zones in range 8 | tested 7 | correct 3 (42.9%)
Z13  101.236-101.309 resistance  MODERATE-HEAVY 8.5  ZFP 60   pred BREAK -> HELD     MISS
Z14  101.16-101.223 resistance  MODERATE-HEAVY 8.5  ZFP 60   pred BREAK -> HELD     MISS
Z15  100.997-101.129 equilibrium MODERATE-HEAVY 9    ZFP 42.5 pred HOLD  -> HELD     OK
Z16  100.911-100.985 support     MODERATE-HEAVY 9    ZFP 60   pred BREAK -> BROKE    OK
Z17  100.85-100.893 support     MODERATE       7    ZFP 22.5 pred HOLD  -> BROKE    MISS
Z18  100.746-100.842 support     MODERATE-HEAVY 8    ZFP 60   pred BREAK -> HELD     MISS
Z19  100.593-100.695 support     MODERATE-HEAVY 8.5  ZFP 42.5 pred HOLD  -> HELD     OK
Z20  100.5-100.584 support     MODERATE-HEAVY 8.5  ZFP 40   pred HOLD  -> UNTESTED
```
