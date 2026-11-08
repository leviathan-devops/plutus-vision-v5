# CURRENT STATE — PLUTUS VISION

---

## ⚡ CURRENT STATE — 2026-10-26 (this block supersedes any state below it)

**THE DEPLOYED ARTEFACT (measured this session, `sha256sum`)**
```
pine-ide/ide/renderer/plutus-vision-v2.pine   653eea1a5fc4c01a744a7097c79a27e173d860402da494a05f205e2b77e80406
                                              1,863 L · the renderer bytes the IDE serves
plutus-vision-v1.pine (THE V1 SEAL, HARD STOP) 0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1
```
⚠ The v2 file CHANGED since the 2026-10-22 manifest refresh (`668e89d7…` → `653eea1a…`). The manifest row is
stale and the file on disk wins; the change is recorded in RUNNING_BUILD_LOG (2026-10-26).

**WHAT IS LIVE ON THIS HOST, and how it is proven**
- `computer` (~/.omp/agent/extensions/computer-use-v2/, 48 files, commit `5263655`) — a headed
  computer per instance id. Surface `weston-x11` by default, `weston-vnc` only where no display exists.
  C3 (no focus theft) is a PER-RUN BEHAVIOURAL REFUSAL, not a table cell: `core/govern.sh:125`
  `c3_check` compares the WM's `_NET_ACTIVE_WINDOW` and the top of `_NET_CLIENT_LIST_STACKING` by
  identity across EVERY 30 ms sample of the verb, and `up` tears the instance down on a breach.
- `pinebox` (scripts/pinebox/, 17 files, commit `4de2be2`) — the Pine IDE as an app layer. Ports derive
  from `--id` (`scripts/pinebox/ports.sh:21` `pb_ports_json`); the served page is rewritten at request
  time for BOTH config globals it reads (`scripts/pinebox/inject.py:38`), so `git diff HEAD -- pine-ide/`
  stays EMPTY; inputs are validated before any process starts
  (`scripts/pinebox/stages/services.sh:34` `pb_preflight`).
- The two compiled helpers: `nofocus.so` sha16 `ccc1f778d2bd`, `hostwin` sha16 `88579d713640`
  (built into `~/.cache/computer-use/lib`, keyed by source sha; a stale helper is REFUSED
  `HELPER_STALE`, never used).
- Deploy proof: `deploy.sh verify` → `DEPLOY: OK  sealed=61 files  mcp=2/2 answer
  probe=native/weston-x11`.

**THE EVIDENCE, this cycle**
- release-order rate: 0 failures in 60 `up`s with a 30 ms sampler (was 3/24, 5/45, 1/40 ≈ 11%).
- real desktop: 26/26 checks, `active=0x0 top=0xa0000a` identical before/after every step.
- pinebox seven concurrent instances: 35 distinct ports / 35 assignments, 7 slots, 7 compositors,
  0 operator-focus changes, `up --id 0` correctly REFUSED `PORT_TAKEN` against the operator's own server.
- gate chains: tool 9 gates / 0 failed; app layer 7 gates / 0 failed (both with behavioural mutants that
  make their gates FAIL).
- **AUDIT GATE: BLOCKED** (`OCR_MISSING` — no executable `ocr` on this host). No ship-ready claim is
  made for this build; the independent reviewer subagent (12 defects, all fixed) is a substitute, not
  the gate.

**WHAT IS NOT DONE** (unchanged, and named rather than implied): the E2 polyline/linefill geometry is
counted and discarded at `pine-ide/pine-station/run.mjs:163`; the guest runtime (V11) is unproven
without an image; agentOS (V12) is not built; 88 authored docs are untracked because the repo's own W-9
floor refuses them (none padded, no gate weakened).

**As of 2026-10-22** · overwrite semantics · this describes NOW, not history

---

## 1 · THE ONE-PARAGRAPH STATE

The **design layer is complete and is now authority**: two documents — `design/DESIGN_BLUEPRINT_v1.2_AUTHORITATIVE.md`
(857 L) and `design/BUILD_WORKFLOW_v2.md` (2,916 L) — govern the build, and the knowledge graph behind them
(163 cards, diagnostics 0) is the substrate both cite. **The build itself has not started.** No sidecar exists.
The card schema is specified, not implemented. The cast layer is specified, not implemented. The V1 seal
(`0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1`, 1,270 L) is the P1 baseline and it is **reproducible from its five modules**, which is the single
most important mechanical fact for the work ahead. **W0 — the rig and the gate harness — is the first move**, and
its second turn requires every one of the 30 gates to be watched refusing a corrupted input before any feature
work begins.

---

## 2 · THE TWO AUTHORITY DOCUMENTS

| path | lines | what it IS | line anchors |
|---|---|---|---|
| `design/DESIGN_BLUEPRINT_v1.2_AUTHORITATIVE.md` | 857 | WHAT the machine is: the constraint, the five planes, the card contract, the Pine kernel, the six decisions | `:1` header · `:30` §0 the constraint · `:180` §3 the sidecar · `:400` §6 the card |
| `design/BUILD_WORKFLOW_v2.md` | 2,916 | HOW it gets built: 7 workers, 42 turns, 30 gates, 30 oracles, the vision contract | `:40` §0 laws · `:200` §1 worker plan · `:900` §5 turns · `:2100` §9 vision contract |
| `design/DESIGN_BLUEPRINT_v1.0_AS_DESIGNED.md` | 449 | the design of record BEFORE operator feedback — retained for provenance | — |

**Everything else is a reference.** When a spec, a wave plan, or a prior workflow conflicts with these two, they win.

---

## 3 · THE KNOWLEDGE GRAPH — the substrate both documents cite

```
cards/          163 typed cards · 8 hubs · 8 types
sources/        8 hub files, every card's back-link derived (never hand-listed)
type/           8 schemas: pv-engine · pv-law · pv-shape · pv-zone · pv-mechanic ·
                pv-term · pv-ruling · pv-doc
CHARTER.md      the operator-authored scope: the 13 authoritative sources and nothing else
MASTER_CONTEXT/OPERATOR_RULINGS_PV.md   R-01 … R-11, the operator's words verbatim
```

**Gate state:** `pv-kg-gate` rc=0 across 8 conditions — diagnostics 0 · 163/163 anchors verified ·
0 non-canon titles · 10/10 shapes present · 145,626 tokens (ceiling 200,000) · L1 178 entities / 170 edges.

**The canonical cards a builder must read first:**
```
cards/FRAC-THREE-ENGINES.md:1          the E1/E2/E3 decomposition and why the direction is one-way
cards/E1-NINE-PILLARS.md:1             the nine confluence dimensions
cards/E1-CONFLUENCE-SCORE.md:1         the /12 base + the capped +2 bonus = 0..14
cards/E1-ZFP-BASE.md:1                 the six zone classes and their base failure probabilities
cards/E1-ZFP-RECEIPT.md:1              the receipt is MANDATORY; no receipt, no render
cards/E2-CLASSIFICATION-MATRIX.md:1    the six-row CASCADE — first match stops (a cascade, NOT a lookup)
cards/SHAPE-SS.md:1 … SHAPE-PRWL.md:1  the ten shapes, each with candle anatomy and the IP signature
cards/E3-CONTRACT.md:1                 the mandatory setup field set
cards/E3-RRR-FLOOR.md:1                the hard 2.5 floor vs the 3.0 gauge
cards/MECH-ROCKETS-VS-TRADES.md:1      rockets are reinforcement, NEVER trades
cards/LAW-TRADE-COUNT-CAP.md:1         eviction, never rejection
cards/REF-WTL-WEEK-ANATOMY.md:1        the trade grammar: red=SL, green=TP, shared edge=ENTRY
cards/REF-VLM-TRADE-CORPUS.md:1        43 entries; 4 carry fabricated levels — never cite a level from it
```

---

## 4 · THE BASELINE — what EXISTS, measured

### 4.1 · The V1 seal is the P1 base, and it is reproducible

```
plutus-vision-v1.pine        1,270 L    sha256 0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1
GENERATED by  scripts/lqz_vision_build.py  from 5 modules:
   plutus-vision-lqz/lqz-core.pine     305 L   ← the liquidity detection (A-minus / A grade)
   plutus-vision-lqz/lqz-render.pine   125 L   ← the liquidity render (A-minus / A grade)
   plutus-vision-lqz/e1-render.pine    314 L   ← the E1 render
   plutus-vision-lqz/e2-render.pine    102 L   ← the E2 path render
   plutus-vision-lqz/f17probe.pine      51 L   ← a probe
   + the SMC section, extracted VERBATIM from plutus-vision-v0.pine
```

**PROVEN: `python3 scripts/lqz_vision_build.py` emits 1,270 lines and the EXACT seal sha.** Any module
change is therefore provable, and any edit to the GENERATED file is erased by the next build (its own
line 3 says so: *"edit plutus-vision-lqz/*.pine, not this file"*).

### 4.2 · The seal's internal composition

```
lines    1 -   12    header + the LQZ v1 stubs
lines   13 -  864    THE SMC BLOCK — extracted verbatim from v0 (852 L)
                       4  box.new    ← the supply/demand ZONE DRAWS          KEEP
                       7  line.new   ← BOS/CHoCH structure lines            PURGE
                       9  label.new  ← the label trash                       PURGE
                       8  inputs     ← showInternals/showSwing/…             PURGE
lines  865 - 1270    THE LQZ CORE + FULL-WIDTH RENDER (406 L)              KEEP UNTOUCHED
```

### 4.3 · What the baseline FAILS today — the 13 anti-pattern gates, rc=1

```
$ python3 gates/anti/anti_patterns.py . pine=plutus-vision-v1.pine tree=.
  PASS A1   baked levels                no decimal literals in draw calls
  FAIL A3   silent fallback             no CARD:ABSENT / [JESL …] token
  FAIL A9   15m creep                   15m in 27 build files
  FAIL A10  market-standard vocab       choch 488 · fvg 102 · fair value gap 141 ·
                                        premium 182 · discount 183 · liquidity void 23
  PASS A11  stub wearing done           no stubs detected
  FAIL A12  docs as progress            progress-prose/code 5.9 (graph 583 KB excluded)
  → FAIL (4 classes, 6/13 evaluated), rc=1
```

**THE INVOCATION IS PART OF THE RESULT.** The CLI is `<root> pine=… card=… tree=…`; invoking it with
the pine as the root supplies no subjects and it will report PASS with 13 SKIPs. That was fixed —
`live==0` now returns INCONCLUSIVE, rc=2 — and the four behaviours are mutation-proven.

**A12's 5.9 is a TRUE POSITIVE:** two authority documents at 3,773 lines against a build at zero. It
clears as W0-W7 land code. It is the gate saying the design is done and the build has not started.

**The mechanism:** the baseline is a fork of a generic Smart-Money-Concepts indicator (© LuxAlgo, line 16),
so its internal-structure module speaks the market-standard dialect the operator's canon does not use.

---

## 5 · WHAT DOES NOT EXIST — stated plainly

```
sidecar/                     no code. W3 builds it from scratch.
the card schema in Pine      specified in the blueprint; W2 implements it.
the cast layer               specified; W4 implements it.
the E2 two-phase render      specified; W5 implements it.
the 30 gate files            specified with their corrupted subjects; W0 writes them.
the ten held-out weeks       NOT NAMED — the operator supplies them; blocks W6.T2 only.
the Protocol A source        NOT NAMED — the operator supplies it into sidecar/config.yml.
the golden week at W5.T7     named in session as Jul 6-10 2026; must be written into
                             .trident/goals/w5.md before W5.T7 runs.
```

**THAT IS THE CORRECT STATE BEFORE A BUILD.** The design layer is done; the execution layer is at zero.

---

## 6 · THE OPERATOR RULINGS IN FORCE — R-01 … R-11

Every one is verbatim in `MASTER_CONTEXT/OPERATOR_RULINGS_PV.md`. The ones a builder will hit first:

```
R-01  the PDF report step is REMOVED — done entirely by code in real time (the sidecar)
R-02  ONE JSON per week · the sidecar agent is vision-capable · do not port anything in
R-03  E2 is TWO PHASES: the BOXES, then the LINE
R-04  E1 → E2 → E3, one direction, each building on the last
R-05  canon-only vocabulary: "do not loop in any random terms that are market standard"
R-06  the graph's purpose: full context in under a minute, compaction-proof
R-07  the trade count reality + the confidence gate at 65
R-08  the target state: "I just open my computer, see the trades, and yeet 50 million"
R-09  the annotation grammar: red=SL, green=TP, the shared edge=ENTRY; zones are full-width
R-10  rockets (SL/E/T freehand) are NOT trades
R-11  the VLM corpus is the trade inventory (15 WT + 26 OBS + 2 TP)
```

**And the specific numeric rulings, which supersede anything in the canon that disagrees:**
```
RRR            hard floor 2.5 · soft gauge 3.0 · a 2.7-2.8 high-probability setup is NEVER
               rejected for being under 3.0
TP             ONE per trade · no partials · the 70/30 split + BoM re-entry are DEAD TEXT
confidence     gate 65 · GOD_TIER ≥90 · HIGH ≥80 · STANDARD 65-79 calibration-only ·
               CONDITIONAL and REJECTED DELETED
ZFP            strength only — NEVER width. A width-derived failure probability is a defect.
SL             BOTH, context-driven: E2 predicts PIERCE+SWEEP → beyond the liquidity, next zone;
               E2 predicts SOFT MITIGATION → 2 pips outside the entry zone
timeframes     4H / 1H / 30m · 1H AUTHORITATIVE · 15m dead
count          an outcome, never a quota · evict the weakest, never reject a stronger newcomer ·
               3/day · 12/week provisional · baseline UNMEASURED
```

---

## 7 · THE TRADE LIBRARY — what it actually contains, measured

```
15 winning trades + 26 chart observations + 2 trade plans   (vlm_all_results.json, 43 entries)
14 unique trades found by eye across 38 panels              (five counters, reconciled)
2 to 3 trades per week                                      (per week, not per page)
6 position pairs in the operator's reference image          (a rect-pair detector validated 6/6)
```

**THE STRUCTURAL FACT a counter must know:** every library page carries TWO panels of the SAME week —
a **TradeZella** panel with the real position tools (the trades) and a **TradingView** panel with that
week's analysis. Counting the TradingView panel reads zero and is wrong for the WEEK.

**THE VLM CORPUS HAS TWO DEFECTS, both recorded:**
```
· 4 entries carry IMPOSSIBLE levels (OBS_21 EURUSD at 1.73; OBS_37/40 GBPUSD at 1.78; WT_11 at 1.618)
· its risk:reward is a GENERIC GUESS — WT_01 says "1:1" where the position tools read 9.47, 11.43,
  11.06, 3.9. RULE: RRR comes from the tool label OR NOWHERE.
```

---

## 8 · THE INSTRUMENTS THAT EXIST (and the ones that lied)

```
gates/anti/anti_patterns.py    13 checks · PROVEN · rc=1 on the baseline
pv-kg-gate                     8 conditions on the graph · rc=0
pv-verify-anchors              163/163 · every quote at its cited line
pv-canon-terms                 0 non-canon titles
pv-gen-hubs                    hubs DERIVED from the cards
pv-l1-ingest                   the semantica layer
au-health.sh                   AU_WORKSPACE_MISMATCH / AU_ENGINE_DOWN / AU_MCP_DOWN
au-layout.sh                   AU_SIBLING_MISSING / AU_SIBLING_FOREIGN / AU_ENGINE_UNBUILT
```

**The ones that returned false answers, recorded rather than deleted** (`forensic/INSTRUMENT_FAILURES.md`):
```
tesseract OCR    0 hits on visible labels
colour-blob      8 boxes on a page with 2 (bearish candles are the same red)
column-occupancy 21 bands on p10 (zone stripes)
tall-green-box   0 on every page (the fill colour differs between renderers)
```

---

## 9 · THE PLATFORM CONSTRAINT THAT SHAPES EVERYTHING

```
PINE SCRIPT CANNOT MAKE AN HTTP REQUEST.
  request.security()   another symbol / timeframe on TradingView
  request.economic()   TradingView's economic calendar
  request.financial()  fundamentals, equities only
  input.*              whatever the user typed
```

**THEREFORE the build splits along one line:**
```
CLASS A — DERIVABLE FROM BARS         CLASS B — NOT DERIVABLE
  supply/demand · liquidity            OTC option expiry walls
  order blocks 4H→1H                   strike notionals
  sweeps · closes-through              open interest · NY cut times
  the 10-shape chain                   the red-folder calendar (partly)
  E3 entry/SL/TP/RRR
  → the INDICATOR computes, live       → the SIDECAR supplies, one card per week
```

**AND the indicator is NOT dependent on the sidecar:** with no card it renders a complete analysis at
80 of the 100 confidence points and prints `CARD: ABSENT — FACE A OMITTED`. It never invents an IP zone.

---

## 10 · THE HONEST GAPS — what a resumed session must not assume

```
1  THE BUILD HAS NOT STARTED. No worker has run. W0 is the first move.
2  THE 30 GATE FILES DO NOT EXIST. Only the 13 anti-pattern checks exist.
3  THE TEN HELD-OUT WEEKS ARE NOT NAMED — blocks W6.T2 only.
4  THE PROTOCOL A SOURCE IS NOT NAMED — blocks W3.T3 onward.
5  THE GOLDEN WEEK IS NAMED IN SESSION BUT NOT ON DISK — write it into .trident/goals/w5.md.
6  SEVEN CANON CONTRADICTIONS remain recorded as pv-ruling cards; four are now RESOLVED by the
   operator's rulings (RRR, TP, SL, confidence). Three remain open: the 6-vs-7 confluence floor,
   the 6-shapes-vs-10 taxonomy, and the SL offset ladder.
7  THE BLIND-AGENT TEST HAS NEVER RUN in any form. It is W6.T4, and it is the only test that
   measures whether the graph can be USED rather than merely read.
8  THE GRAPH IS A HUB-AND-SPOKE: 155 of 163 cards are reachable only from their hub. Lateral
   cross-links are an open improvement.
```
