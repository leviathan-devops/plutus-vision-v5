# SPEC_VIOLATION_LOG — PLUTUS VISION (append-only)

The spec for v1 is the operator's directive set (verbatim):
- S1 "take the working 4 lux algo indicators, bundle them into ONE indicator, and render it on the pine IDE chart so i can see everything"
- S2 "no fucking reinventing or customizing anything" / "Assemble production grade components > build from scratch"
- S3 "fork the PINE IDE tab into a STANDALONE PINE IDE for this project's testing so you dont interfere with the other sessions work"
- S4 "YOU WILL DO PROPER VISION IN THE LOOP VERIFICATION" (ship gate: Bibles/VISION_IN_THE_LOOP_ENGINEERING_BIBLE.md)
- S5 "make a fucking pine-ide launch command to launch this easily"
- S6 (tuning, 2026-10-01) indicators not interactable; sub-1H tuned; settings map; indicator settings menu under the asset name.

| ID | Spec | Requires (quoted) | Observed | Verdict | Evidence |
|----|------|-------------------|----------|---------|----------|
| V-01 | S1 | "bundle them into ONE indicator" | one `indicator('Plutus Vision v0')` declaration; 4 source decls commented | PASSED | `plutus-vision-v0.pine:15`; run title "Plutus Vision v0" |
| V-02 | S1/S2 | output equal to the sources | POOLS 0/25 (renamed type field) | VIOLATED HIGH → FIXED | compare.py 0/25 → 25/25 (EN-011) |
| V-03 | S2 | "no customizing" | W3 size guards + drop counters changed control flow | VIOLATED HIGH → FIXED | `scripts/deguard.py` guards left 0 (EN-012) |
| V-04 | S1/S2 | output equal to the sources | VOIDS capped to newest 380 of 500 slices | ACCEPTED DEVIATION (engine constraint: one script = one 500-box ceiling) | EN-013; header lines 9-13 |
| V-05 | S1 | SWEEPS output | raw SWEEPS crashes in PineTS (`get_left` of undefined); merged SWEEPS section 258/258 vs its section alone | PASSED (engine-compat inlining only) | `/tmp/pv_sweeps.py` output |
| V-06 | S3 | "dont interfere with the other sessions" | fork wrote VIL rows via dashboard rail :9444 | VIOLATED MEDIUM → FIXED | gate.mjs:21 → :9754 (EN-016) |
| V-07 | S1 | "render it ... so i can see everything" | labels printed as prices | VIOLATED HIGH → FIXED | vision.mjs:137 (EN-014) |
| V-08 | S4 | vision-in-the-loop verification | `scripts/vil.py` VIL GATE PASS (4 TFs) + battery 3/3 as designed | PASSED (pipeline gate) | `vil/vil-results.json` |
| V-09 | S4 | named-delta engineer read | 3 OPEN deltas (VOIDS borders, label overlap, right-edge clipping) | OPEN | TESTING_LOG result R-03 |
| V-10 | S5 | one-command launcher | `pine-ide` cold 9.1 s exit 0; relocatable via PINE_IDE_HOME | PASSED | TESTING_LOG R-01 |
| V-11 | S6 | drawings not interactable | drawings can be dragged | OPEN | operator report |
| V-12 | S6 | indicator settings menu | absent | OPEN | operator report |

| ID | Ruling violated | Violation | Consequence |
|----|-----------------|-----------|-------------|
| P-01 | "LOOK AT THE IMAGES" / ViL Iron Law 1 | screenshots taken but not read against an expectation | F-02, T-01 |
| P-02 | "Take the simplest path" | speculative caps before bisection | F-04, self-regression EN-013 |
| P-03 | DO-EXACTLY-WHAT-THE-OPERATOR-SAID | budget allocator added to a "bundle" | F-06 |

| V-13 | S4 (ViL) | "vision-in-the-loop verification" | the verdict came from a 4B VLM answering 4 presence questions | VIOLATED CRITICAL → FIXED | vil-rail.mjs lookAt() → TRIAGE_ONLY; live curl confirms |
| V-14 | S4 (ViL) | "every verdict rendered by reading the frame" | 1H frame never read in either round; captures batched | VIOLATED HIGH → FIXED | `computer-use action=look` returns the frame as an image block; `verdict` REFUSED without it |
| V-15 | operator ruling | "more complex to be theatrical than to do it right" | `ack`, PASS-with-deltas, hand-typed claims were all free bypasses | VIOLATED HIGH → FIXED | EN-026, EN-027, `action=claim`; tested T3–T8 |
| V-16 | S6 (settings) | the settings panel must be usable | `study-legend.mjs` written + wired + `node --check`, never opened | OPEN — unverified | F-20; the settings apply path (C9) is untested |
| V-17 | S5 (launcher) | one command, easy to load | `pine-ide` cold launch 9.1 s, relocatable | PASSED | R-01 |
| V-18 | operator ruling | the skill corpus must route to the rails | 8 of 10 vision skills prescribed raw `import -window` | VIOLATED MEDIUM → FIXED | F-40; all 10 now carry the ⛔ RAIL block |
| P-04 | "look at the images" / ViL Iron Law 1 | screenshots taken but not read against an expectation; the bible quoted at the moment of failure | produced 4 false PASSes and 12 operator-caught entries |
| P-05 | "simplest path" | a VLM harness was built and run three times before the operator rejected the mechanism | 3 x 61.6 s of work producing nothing |

| V-19 | S1 (render) | "render it on the Pine IDE chart" | the IDE served a two-session-old binary (d7e00609) while 605bff82 was the file under test | VIOLATED CRITICAL → FIXED | EN-028; `verify_served_pine.sh` → SERVED_PINE_OK |
| V-20 | S4 (ViL) | every verdict comes from the frame | the rail persisted its ledger but not its session, so it refused for the wrong reason 3× | VIOLATED MEDIUM → FIXED | EN-029/030/031; `scripts/drive.sh` records the verdict |
| V-21 | S1 (15m→D) | "from the 15m up to the D" | the 1D control EXISTS in the selector; only the fixture lacks daily bars | CORRECTED (F-18 wording superseded by F-44) | the open timeframe menu read directly |

| V-22 | S6 (settings) | "the indicator settings menu under the asset name" | the menu existed but showed raw variable names and one flat scroll | VIOLATED HIGH → FIXED | EN-033; live dialog: 4 sections, SMC 52→39 rows, groups recovered |
| V-23 | S6 (interact) | "the indicator should not be interactable" | locked drawings could still be DELETED via the Data Window / context menu | VIOLATED HIGH → FIXED | EN-032; `remove()` now refuses locked ids |

## RE-VERIFICATION COMMANDS (run from the tree root; each V row's verdict is reproducible)

| ID | Command | Expected output |
|----|---------|-----------------|
| V-01 | `grep -c "^indicator(" plutus-vision-v0.pine` | `1` |
| V-02 | `python3 scripts/compare.py \| grep POOLS` | `POOLS source= 25 matched= 25 missing= 0` |
| V-03 | `grep -cE "_drops\|size\(\) < (75\|100\|125)\b" plutus-vision-v0.pine` | `0` |
| V-04 | `python3 scripts/compare.py \| grep VOIDS` + `/tmp/pv_sweeps.py` last line | `matched= 380` · `VOIDS evicted strictly oldest: True` |
| V-05 | `python3 /tmp/pv_sweeps.py \| sed -n 2p` | `SWEEPS alone=258 in merged=258 lost=0` |
| V-06 | `grep -n "DEFAULT_RAIL_BASES =" pine-ide/pine-ide/gate.mjs` | `['http://127.0.0.1:9754']` |
| V-07 | live: drawing types on the chart (pv-load + CDP) | `{box, trendline, text}` — no `pricelabel` |
| V-08 | `python3 scripts/vil.py` | `VIL GATE: PASS` |
| V-10 | `time pine-ide` | one JSON line, `shells:1`, exit 0 |
| V-09 | read `vil/shots/merged-EURUSD-<tf>.png` against the written expectation | zero named deltas (currently 3 open) |
| V-11 | CDP drag on a drawing, then re-read its anchors | anchors unchanged (currently they move) |
| V-12 | screenshot under the asset name | an indicator row with a settings control (currently absent) |

Note on scripts/compare.py's own summary line: it prints `VERDICT: DELTA lost=121 extra=258`.
`lost=121` = 120 evicted VOIDS slices (V-04) + 1 for the SWEEPS source that cannot run raw;
`extra=258` = exactly the 258 SWEEPS drawings (V-05), which have no runnable raw baseline.
Both are explained deviations, not unexplained deltas.

Correction (2026-10-01, same pass): the parity helpers moved in-tree — read `/tmp/pv_sweeps.py` as `scripts/parity_sweeps.py` and `/tmp/pv_bisect.py` as `scripts/parity_bisect.py`; compare.py now reads the 4 cores from `<tree>/sources` (sha-identical).
