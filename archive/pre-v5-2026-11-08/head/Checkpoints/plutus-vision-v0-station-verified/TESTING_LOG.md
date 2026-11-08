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
