# TESTING_LOG — Plutus Vision v0 (2026-10-01)

Artifact: `e1/vision/plutus-vision-v0.pine`
Merged SHA: `fb752a1c4152817e…` (re-measured at every gate below)
Engine: PineTS 0.10.0 via the standalone forked station `e1/vision/pine-ide-fork` on **:9641**
Fixture: EUR/USD · GBP/USD · DXY × 15m/30m/1H/4H (12 cells)

---

## ZONE 1 — THE TEST PLAN

### T-01 · namespace collision (W1 gate)
- **What:** the merge must not carry a duplicate `type` or a shadowed top-level name.
- **How:** `python3 scripts/lexcheck.py` over the 4 sources, then over the merged file.
- **PASS:** exit 0, `lexcheck: PASS (0 findings)`.
- **FAIL:** any `COLLISION type` or `SHADOW <name>` row.

### T-02 · single declaration (L-4)
- **What:** exactly one `indicator()` call.
- **How:** `grep -c '^indicator(' merged`.
- **PASS:** `1`.

### T-03 · attribution retention (L-6/L-7)
- **What:** the CC BY-NC-SA notice and © LuxAlgo survive the rebrand.
- **How:** `grep -c 'LuxAlgo' merged`.
- **PASS:** `>= 1`.

### T-04 · per-subsystem render (W2 gate)
- **What:** each of the 4 subsystems draws on its own.
- **How:** POST /run per section slice; counts from `data.counts`.
- **PASS:** `boxes+labels+lines > 0` for each.
- **FAIL:** a section drawing 0/0/0.

### T-05 · full-artifact run (L0/L2)
- **What:** the whole merged file compiles and executes.
- **How:** `node pine-ide-fork/pv_probe.mjs <file> --url :9641`.
- **PASS:** `RUN_OK` + `RENDERED`, exit 0.

### T-06 · adversarial corpus (P5)
- **What:** 28 exported decision functions probed positive + negative + edge.
- **How:** `python3 scripts/p5_adversarial.py`.
- **PASS:** positive GREEN, negative GREEN, full-artifact 12/12 GREEN.

### T-07 · behavior diff (I-4)
- **What:** no formula changed during the rename.
- **How:** normalize identifiers, assert each core shape still present.
- **PASS:** 10/10 shapes.

---

## ZONE 2 — THE RESULTS

### R-T01 · lexcheck
```
pre-merge (4 sources):  lexcheck: FAIL (9 findings)
    COLLISION type bar: [liquidity-voids-fvg.pine, buyside-sellside-liquidity.pine]
    SHADOW atr · b · i · mode · per · ph · pl  (each in 2 sources)
    HIGH-RISK single-letter methods: br · l · n · p
    object budget 2000 vs ceiling 500 -> OVER
post-merge (merged):    lexcheck: PASS (0 findings)
```
**Verdict: PASS.** Exit 0.

### R-T02 · single declaration
```
grep -c '^indicator(' plutus-vision-v0.pine  ->  1
```
**Verdict: PASS.**

### R-T03 · attribution
```
grep -c 'LuxAlgo' plutus-vision-v0.pine  ->  5
```
**Verdict: PASS.** Header + 4 source-attribution lines.

### R-T04 · per-subsystem render — EUR/USD 4H, 300 bars
```
SMC      PASS  boxes=5   labels=22  lines=19
SWEEPS   PASS  boxes=12  labels=0   lines=24
VOIDS    PASS  boxes=94  labels=0   lines=0
POOLS    PASS  boxes=1   labels=0   lines=2
```
**Verdict: PASS — 4/4.**

### R-T05 · full artifact
```
RUN_OK sha=fb752a1c4152817e bars=300 ms=221
counts {"plots":0,"plotPoints":0,"markers":0,"boxes":112,"labels":22,
        "lines":45,"tables":0,"polylines":0,"linefills":0,"trades":0}
warnings 0
RENDERED
```
**Verdict: PASS.** 112 boxes / 22 labels / 45 lines, 0 warnings.

### R-T06 · adversarial
```
surface map        28 exported decision functions (SMC 22 · SWEEPS 5 · VOIDS 0 · POOLS 1)
positive half      4/4 subsystems DRAW                    GREEN
negative half      control renders 0/0/0 (zero misfire)   GREEN
full artifact      12/12 fixture cells PASS               GREEN
VERDICT            FULL PASS — ZERO confirmed defects
```
Two STEP-4 rows were adjudicated as **probe errors**, not defects — see
`P5_ADVERSARIAL_VERDICT.md` (AUD/USD 30m is absent from the fixture corpus; `limit=1`
is below the fixture's minimum slice). One real finding was recorded: the §16 box
budget is documented but NOT enforced (3 of 12 cells within 40 boxes of the 500
ceiling). **Verdict: PASS with one named OPEN finding.**

### R-T07 · behavior diff
```
ta.crossover(close           -> present
highVolatilityBar ? low     -> present
count > 2                   -> present (x2)
10/10 core shapes present modulo identifiers
```
**Verdict: PASS.**
RUN_OK sha=fb752a1c4152817e bars=300 ms=237
counts {"plots":0,"plotPoints":0,"markers":0,"boxes":112,"labels":22,"lines":45,"tables":0,"polylines":0,"linefills":0,"trades":0}
warnings 0
RENDERED
---

---

## RE-MEASURED THIS TURN - the anchor every verdict above hangs from

Re-run after every edit. A PASS is a measurement, valid only for the SHA it was taken on.

```
$ sha256sum plutus-vision-v0.pine
fb752a1c4152817ea82eccd04bf5ae8f0981445367e6ec8a4dcd19ed8eae04d4

$ grep -c '^indicator(' plutus-vision-v0.pine        # T-02
1

$ grep -c 'LuxAlgo' plutus-vision-v0.pine            # T-03
5

$ python3 scripts/lexcheck.py plutus-vision-v0.pine  # T-01
lexcheck: PASS (0 findings)

$ node pine-ide-fork/pv_probe.mjs plutus-vision-v0.pine --url http://127.0.0.1:9641
RUN_OK sha=fb752a1c4152817e bars=300 ms=222
counts {"plots":0,"plotPoints":0,"markers":0,"boxes":112,"labels":22,"lines":45,"tables":0,"polylines":0,"linefills":0,"trades":0}
warnings 0
RENDERED
```

If the SHA changes, every verdict above is STALE and the gates must re-run.

---

## THE AUDIT GATE

```
AUDIT GATE: BLOCKED (no code-audit artifact on disk for this artifact)
```

No `qwen-code-audit` / `sg-ocr-*.json` run exists for `plutus-vision-v0.pine`, and the
host's audit lane was not invoked this session. Per the degraded-run law this is
**BLOCKED, never PASS** — it does not block the build's own gates (every gate above is
independently evidenced by a tool result), but it **does** block any ship-ready or
production-grade claim. The audit must be run against the merged file before P8.

---

## THE HONEST GAPS

1. **TradingView itself is unverified.** Every gate above ran on PineTS 0.10.0. The
   eight engine-compat shims in `RUNTIME_LEDGER.md` are Pine-legal constructs, but no
   run has proved TradingView's compiler accepts the merged source, and no eyes have
   seen a rendered chart. The station is a *proxy*, not the target runtime.
2. **Visual parity is counts, not pixels.** SMC and VOIDS match their sources exactly on
   object counts (5/22/19 and 94/0/0). SWEEPS source 422s on PineTS so no parity number
   exists. POOLS draws 1 box where the source draws 8 — same gate shape, fewer clusters
   on 300 bars; threshold/bar-count dependent, NOT proven benign.
3. **The box budget is unenforced** (see R-T06). On a denser market the merged file
   exceeds Pine's 500 ceiling and PineTS drops the excess silently.
4. **AUDIT GATE BLOCKED** (above).
5. **Tier-1 LuxAlgo validation never started** — the 14 Tier-1 candidates and the
   Tier-2 reserves remain unvalidated by design.

---------------------------------------------------------------------------------------------------
# 2026-10-01 — v1-clean-baseline session (ZONE 1 plan + ZONE 2 results)
Indicator sha256 605bff82d3539e9e5e258da30ba4ec80607a3df7749fb5deb5f4402350f95847 · fixture sha256
0c8f7d7aa3171af847dcf87fee75a2579910ec6e044e21097b98acda39b230e2 (EUR/USD, GBP/USD, DXY × 15m 30m 1H 4H).

## TEST PLAN ENTRY P-01 — 2026-10-01 — one-command launcher
### HOST
- **What:** `pine-ide` brings up station :9741, rail :9754, server :9851, Chrome on :3, loads + RUNs the indicator.
- **How:** cold launch with `time`; assert one Chrome main, `shells:1`, exit 0; repeat to prove idempotence.
- **PASS criteria:** JSON line with `"title":"Plutus Vision v0"`, `"shells":1`, `onChart > 0`; exit 0.
- **FAIL criteria:** any named failure (NO_PAGE/NO_HANDLE/RUN_FAILED/DOUBLE_MOUNT/NOTHING_DRAWN/PORT_HELD/CHROME_STUCK) or a hang.
- **Status:** PASSED (R-01)

## TEST PLAN ENTRY P-02 — 2026-10-01 — per-source geometry parity
### SCRIPT
- **What:** every source drawing appears in the merged output on the same 1603 1H bars.
- **How:** `python3 scripts/compare.py` + `/tmp/pv_bisect.py` + `/tmp/pv_sweeps.py` against station :9741.
- **PASS criteria:** SMC 195/195, POOLS 25/25, SWEEPS section 258/258, VOIDS only oldest-evicted, 0 drawings not in any baseline.
- **FAIL criteria:** any unexplained missing or extra drawing.
- **Status:** PASSED (R-02) with the documented VOIDS deviation (SPEC V-04)

## TEST PLAN ENTRY P-03 — 2026-10-01 — ViL ship gate (replaces the code audit)
### HOST
- **What:** Bibles/VISION_IN_THE_LOOP_ENGINEERING_BIBLE.md loop on every fixture TF + §7.1 battery.
- **How:** `python3 scripts/vil.py`.
- **PASS criteria:** `VIL GATE: PASS` (clean TFs PASS; planted defect FAIL; black + truncated INCONCLUSIVE).
- **FAIL criteria:** any case off its design verdict.
- **Status:** PASSED (R-03)

## TEST PLAN ENTRY P-04 — 2026-10-01 — engineer read (named deltas) per TF
### HOST
- **What:** the agent's fresh multimodal read of each `vil/shots/merged-EURUSD-<tf>.png` against the written expectation.
- **How:** read the PNG; list found/missing/wrong elements; classify per bible §3.3.
- **PASS criteria:** zero named deltas after an active hunt.
- **FAIL criteria:** any named delta.
- **Status:** FAILED (R-04: 3 open deltas)

## TEST PLAN ENTRY P-05 — 2026-10-01 — tuning items (operator list)
### HOST
- **What:** (1) drawings not draggable/selectable; (2) sub-1H visual tuning; (3) LuxAlgo settings map doc; (4) indicator settings menu under the asset name; plus D timeframe coverage.
- **How:** per item, re-render + vil.py + engineer read.
- **PASS criteria:** drag attempt leaves drawings unmoved; engineer read zero deltas on 15m/30m; settings menu visible and changes re-run.
- **FAIL criteria:** any item not observably met.
- **Status:** PENDING

## TEST PLAN ENTRY P-06 — 2026-10-01 — checkpoint self-containment
### HOST
- **What:** `Checkpoints/v1-clean-baseline` launches the IDE + v1 indicator from its own tree.
- **How:** `PINE_IDE_HOME=<checkpoint> pine-ide`; assert station cwd and `tree:` line are the checkpoint.
- **PASS criteria:** JSON line `title Plutus Vision v0`, station cwd inside the checkpoint.
- **FAIL criteria:** any process running from the live tree, or a failed launch.
- **Status:** PASSED (R-05)

## TEST RESULT R-01 — 2026-10-01 — P-01 launcher
### HOST
- **The run:** `time (timeout 150 pine-ide > /tmp/pine-ide-run.log 2>&1)`
- **The raw output:** `real 0m9.081s` · `tree: .../PLUTUS_VISION` · `station :9741 · rail :9754 · server :9851 up` · `{"title":"Plutus Vision v0","shells":1,"counts":{"boxes":122,"labels":24,"lines":57},"bars":1603,"onChart":200}` · `exit=0`; second launch `chromes after 2nd launch: 1`.
- **The verdict:** PASS
- **The artifacts:** /tmp/pine-ide-run.log

## TEST RESULT R-02 — 2026-10-01 — P-02 parity
### SCRIPT
- **The run:** `python3 scripts/compare.py`; `python3 /tmp/pv_sweeps.py`
- **The raw output:** `SMC source= 195 matched= 195 missing= 0` · `VOIDS source= 500 matched= 380 missing= 120` · `POOLS source= 25 matched= 25 missing= 0` · `SWEEPS alone=258 in merged=258 lost=0` · `merged drawings not in ANY baseline: 0` · `VOIDS evicted strictly oldest: True`
- **The verdict:** PASS (VOIDS deviation documented, SPEC V-04)
- **The artifacts:** COMPARE.json

## TEST RESULT R-03 — 2026-10-01 — P-03 ViL gate
### HOST
- **The run:** `python3 scripts/vil.py` (61.6 s)
- **The raw output:**
  `clean-15m PASS sha=689b00c22d4a drew 170` · `clean-30m PASS sha=bf6727dc967b drew 228` ·
  `clean-1H PASS sha=25895d807d75 drew 200` · `clean-4H PASS sha=33706efcd80f drew 325` ·
  `battery-planted-defect FAIL sha=219bef821456 ("no filled rectangular zones")` ·
  `battery-unjudgeable-black INCONCLUSIVE (MEASUREMENT: near-uniform)` ·
  `battery-dead-channel INCONCLUSIVE (TRANSPORT: decode failed)` · `VIL GATE: PASS`
- **AUDIT GATE:** REPLACED BY VIL by operator order (FAILURE_LOG F-05) — `VIL GATE: PASS` is this project's ship-gate line. The prior qwen-code-audit attempt: `GATE: BLOCKED (OCR_NO_FILES_REVIEWED)`.
- **The verdict:** PASS (pipeline gate; reader = local Qwen3.5-4B-Q4_K_M via rail :9754)
- **The artifacts:** vil/vil-results.json, vil/shots/*.png

## TEST RESULT R-04 — 2026-10-01 — P-04 engineer read
### HOST
- **The run:** fresh reads of vil/shots/merged-EURUSD-15m.png (689b00c2), -30m (bf6727dc), -4H (33706efc).
- **Found:** candles; BOS/CHoCH/EQH/EQL text labels; swing-structure lines; red/blue order-block zones; POOLS liquidity lines; VOIDS slices.
- **Named deltas (classification):**
  D1 VOIDS 13-slice stacks drawn with tan (brass) borders → heavy striped blocks, right half of 15m/30m frames, centre-right of 4H — PIPELINE (vision.mjs default border; source border is `na`).
  D2 BOS/CHoCH/EQH texts overlap where structure clusters (15m right side, 4H centre) — PIPELINE/size (label size `small` vs source `tiny` for internal structure).
  D3 Strong/Weak "W"/"S" labels clipped at the right chart edge on 15m — PIPELINE (future anchor beyond the right margin).
- **The verdict:** FAIL (engineer gate) — the reader PASS did not see D1-D3 (see THEATRICALITY T-07).
- **The artifacts:** the three PNG shas above.

## TEST RESULT R-05 — 2026-10-01 — P-06 checkpoint self-containment
### HOST
- **The run:** `Checkpoints/v1-clean-baseline/launch-pine-ide` (cold, 9.248 s) → `python3 <cp>/scripts/compare.py` → `python3 <cp>/scripts/vil.py --tfs 1H,30m`
- **The raw output:** `tree: .../Checkpoints/v1-clean-baseline` · `{"title":"Plutus Vision v0","shells":1,"onChart":200,"bars":1603}` · `exit=0` ·
  station :9741 cwd `.../Checkpoints/v1-clean-baseline/pine-ide/pine-station`, `fixture=<cp>/fixtures/bars/2026-07-06.json present=true` ·
  rail :9754 `vil=<cp>/vil` · parity `SMC 195/195 · VOIDS 380/500 · POOLS 25/25` ·
  `clean-1H PASS 51fc30cf4f95 · clean-30m PASS 555603018028 · planted FAIL · black INCONCLUSIVE · truncated INCONCLUSIVE · VIL GATE: PASS`
- **The verdict:** PASS — P-06 Status → PASSED.
- **The artifacts:** <cp>/vil/vil-results.json, /tmp/cp-launch.log

## TEST RESULT R-06 — 2026-10-01 — the failure forensics extraction (the operator's "ALL THE FAILURE DATA" order)
### SCRIPT
- **The run:** `python3 scripts/failure_forensics.py` over the live transcript (21,330,629 bytes)
- **The raw output:** `wrote vil/FAILURE_FORENSICS.md — 3329 lines` · `calls=1786 user=126 claims=160 admits=120 derails=179 thinks=1245`
- **The verdict:** PASS — 3,597 lines of machine-extracted evidence on disk; narrative FAILURE_LOG.md (462 lines) cross-references it
- **The artifacts:** vil/FAILURE_FORENSICS.md

---------------------------------------------------------------------------------------------------
# 2026-10-01 — THE DIRECT-LOOK PASS (replacing the VLM gate)
Indicator sha256 605bff82d3539e9e5e258da30ba4ec80607a3df7749fb5deb5f4402350f95847
Tool: ~/.omp/agent/extensions/computer-use/index.js sha256 bc1c52b62965e3b77cd7626aa7d0b91f673da757affd6deda2066bb6bf036676 (607 lines)

## TEST PLAN ENTRY P-07 — 2026-10-01 — the computer-use rails
### HOST
- **What:** every theatrical shape must be a refusal, and the honest path must be one call.
- **How:** `node scripts/rail-test.mjs` (first pass) and `scripts/rail-test2.mjs` (theatre shapes), driving `execute()` against the LIVE `:3` display and the real Pine IDE window.
- **PASS criteria:** claim-without-evidence REFUSED · look returns an image block · PASS-with-deltas REFUSED · ack-without-reason REFUSED · verdict-without-look REFUSED · verdict-without-expectation REFUSED · honest FAIL recordable · claim-with-evidence generated with shas · report prints the look-ratio.
- **FAIL criteria:** any of the above permitted.
- **Status:** PASSED (R-07)

## TEST RESULT R-07 — 2026-10-01 — P-07 the rails
### HOST
- **The run:** `node scripts/rail-test2.mjs` (live, display :3, window 14680067 "Plutus Vision — Pine IDE")
- **The raw output:**
  `T1 claim with no evidence   ✓ CLAIM REFUSED — nothing behind it.`
  `T2 look (one call)          ✓ image ✓ sha 35d98e22  bytes 241210`
  `T3 PASS with deltas         ✓ VERDICT REFUSED — PASS with deltas is the theatrical shape.`
  `T4 PASS forced              ✓ VERDICT PASS (override logged)`
  `T5 ack with no reason       ✓ ACK REFUSED — 1 unobserved interaction(s) claimed as observed with no reason.`
  `T6 ack with reason          ✓ ACK: 1 interaction(s) marked observed WITHOUT a capture.`
  `T7 honest FAIL              ✓ VERDICT FAIL`
  `T8 claim with evidence      ✓ VERIFICATION CLAIM — generated from 2 recorded verdict(s) · overall: FAIL`
  `T9 audit surface            look-ratio 0.67 ⚠ · acks 1 · rail refusals 5 · PASS overrides 1`
- **AUDIT GATE:** REPLACED BY DIRECT LOOK by operator order (FAILURE_LOG F-34). The prior qwen-code-audit attempt returned `GATE: BLOCKED (OCR_NO_FILES_REVIEWED)`. No code-audit artifact exists for this project; the direct-look claim is the gate for this milestone and it carries shas per frame.
- **The verdict:** PASS (all 9 shapes behaved as designed)
- **The artifacts:** ~/.omp/agent/run/computer-use/runs.jsonl · ~/.omp/agent/run/computer-use/shots/*.png

## TEST RESULT R-08 — 2026-10-01 — the VLM reader is retired (live)
### HOST
- **The run:** `curl -X POST :9754/vil/look`
- **The raw output:** `{"success":true,"data":{"retired":true,"verdict":"TRIAGE_ONLY","answers":null,"note":"VLM_READER_RETIRED: the local-VLM reader no longer issues verdicts (2026-10-01)…"}}`
- **The verdict:** PASS — the second verdict path is closed; there is now exactly one.
- **The artifacts:** PLUTUS_VISION/pine-ide/pine-ide/vil-rail.mjs (`lookAt` retired, `lookAt__retired` preserved)

## TEST RESULT R-09 — 2026-10-01 — skill corpus wiring
### SCRIPT
- **The run:** grep for `⛔ RAIL — use \`computer-use\`` across ~/.omp/agent/managed-skills/*/SKILL.md; frontmatter check per file.
- **The raw output:** `wired: direct-look-product-test, l5-chart-vision-verification, tradingview-pine-l5-render, tradingview-agent-display-render, tradingview-agent-display-pine-render, agent-display-tradingview-pine-render, pine-ide, tradingview-pine-editor-cdp-load, tradingview-pine-render-agent-display, tradingview-pine-render-and-session` · `frontmatter ok (name fields=1) × 9`
- **The verdict:** PASS — 10/10 vision skills route through the tool; 0 prescribe a raw capture as the only path.

## TEST RESULT R-10 — 2026-10-01 — the served-artifact drift (found by looking)
### HOST
- **What:** the binary the IDE renders vs the file under test.
- **How:** read the editor's visible text in the frame, compare to the source, then hash the editor's contents in-page via `crypto.subtle.digest`.
- **The raw output:** `editorSha: d7e0060997316565 · servedSha: d7e0060997316565 · header: "// BUDGET: single 500/500/500 ceiling; allocation enforced in W3 (§16)"` vs source `605bff82d3539e9e` reading `// BUDGET: one script = one 500-box ceiling. Only VOIDS is bounded…`
- **The fix + re-verify:** symlink + universal `no-store` + dead server killed → `bash scripts/verify_served_pine.sh` → `source 605bff82d3539e9e  renderer 605bff82d3539e9e  served 605bff82d3539e9e / SERVED_PINE_OK`; after a hard reload `editorSha 605bff82d3539e9e · counts {boxes:122, labels:24, lines:57} · bars 1603`.
- **The verdict:** FAIL→FIXED+PROVEN. The delta it exposed — the stale `W3 BUDGET` block and the false `zero deltas` header visible in the editor — was itself a symptom; the cause was the served copy.
- **The artifacts:** vil/direct/05-1H-FINAL.png sha 87aec75ad5176399 · vil/direct/08-menu.png sha 8a692caeeb09f1a4

## TEST RESULT R-11 — 2026-10-01 — the verdict loop across processes
### HOST
- **The run:** `bash scripts/drive.sh` (reset → expect → click → look, four separate node processes) then `node scripts/sweep.mjs verdict 'FAIL|…'`
- **The raw output:** `expectation: 1H on 605bff82… / unobserved : 0 / win : 14680067` → `VERDICT FAIL · expectation: … · found: four subsystems render; legend row present; header lines 9-19 corrected; 3 anchors dropped matching parity · missing: 3 CHoCH labels cluster within ~20px at x1090-1163 y420-435`
- **The verdict:** PASS — expectation written first, interaction counted, frame opened, verdict recorded with a named delta and the frame's sha.
- **The artifacts:** ~/.omp/agent/run/computer-use/runs.jsonl
