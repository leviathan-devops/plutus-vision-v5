# PLUTUS VISION — THE DESIGN BLUEPRINT
## v1.0 · as designed in session, before operator feedback

**Status:** superseded by v1.1 (operator feedback applied). Retained verbatim as the design of record
for the reasoning that produced it — see `design/DESIGN_BLUEPRINT_v1.1_AUTHORITATIVE.md`.
**Derived from:** the 163-card knowledge graph, the 13-source canon, five blind counters, the VLM corpus.

---

# §0 · THE CONSTRAINT THAT SHAPES EVERYTHING

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  PINE SCRIPT CANNOT MAKE AN HTTP REQUEST.                                    │
│                                                                              │
│  Its entire external surface is:                                             │
│    request.security()   another symbol / timeframe on TradingView            │
│    request.economic()   TradingView's economic calendar                      │
│    request.financial()  fundamentals, equities only                          │
│    input.*              whatever the user typed                              │
│                                                                              │
│  There is no fetch. No URL. No socket. No file read.                         │
└──────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼  THEREFORE the build splits along ONE line
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   CLASS A — DERIVABLE FROM BARS ALONE          CLASS B — NOT DERIVABLE       │
│   ───────────────────────────────────          ────────────────────────      │
│   supply / demand zones                        OTC option expiry walls       │
│   liquidity zones                              strike notionals              │
│   order blocks (4H→1H)                         open interest by expiry        │
│   sweeps, closes-through                       NY cut times                   │
│   the 10 shape chain                           red-folder calendar (partly)  │
│   E3 entry / SL / TP / RRR                                                  │
│                                                                              │
│   PINE COMPUTES THIS LIVE.                     THE SIDECAR SUPPLIES THIS.    │
│   Zero manual step.                            One small payload per week.   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**This is the load-bearing design decision.** The sidecar does not "run the strategy" — it supplies the
**institutional dimension the chart cannot see**, and nothing else. Everything the bars can prove, the
indicator proves by itself, live, on every tick.

```
   IF THE SIDECAR DIED, THE INDICATOR STILL RENDERS A COMPLETE E1/E2/E3 ANALYSIS
   AT REDUCED CONVICTION — because only 20 of the 100 confidence points are
   option-derived. That is the anti-fragility requirement.
```

---

# §1 · THE STACK — five planes, one direction

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  L4  VERIFY        vision-in-the-loop · replay gates · the blind-week test          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  L3  RENDER        PINE INDICATOR — geometry only. Never a number, never a colour.  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  L2  DELIVERY      one JSON per week · pub/sub · the injection contract             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  L1  COMPUTE       THE SIDECAR — E1 face A · confidence · the weekly envelope       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  L0  DATA          bars 4H/1H/15m · option expiry · economic calendar               │
└─────────────────────────────────────────────────────────────────────────────────────┘
        ▲                                                        │
        │                                                        ▼
┌───────────────────┐                              ┌──────────────────────────────┐
│  L5  LEARN        │◄────── every decision ───────│  THE GRAPH (163 cards)       │
│  promotion gate   │        logged to the ledger  │  arsumbris L2 + semantica L1 │
└───────────────────┘                              └──────────────────────────────┘
```

---

# §2 · L0 — THE DATA PLANE

```
┌──────────────┬──────────┬──────────────┬───────────────────────────────────────┐
│ SOURCE       │ CADENCE  │ SHAPE        │ WHY IT IS THIS CADENCE                │
├──────────────┼──────────┼──────────────┼───────────────────────────────────────┤
│ 4H bars      │ once/wk  │ 500 bars/pair│ order blocks need 4H (R21). Never 1H. │
│              │ + daily  │              │                                       │
│ 1H bars      │ daily    │ 2000 bars    │ THE AUTHORITATIVE TIMEFRAME. All       │
│              │          │              │ analysis happens here.                │
│ 15m bars     │ on demand│ 500 bars     │ execution refinement only. Never the   │
│              │          │              │ analysis.                             │
│ option expiry│ once/wk  │ Protocol A   │ the ONLY Class-B input. strikes,      │
│              │ (Mon)    │ table        │ notionals, NY cut, in BILLIONS.       │
│ OI / gamma   │ once/wk  │ per strike   │ tiering: ≥$1.5B = critical, ≥$850M    │
│              │          │              │ = significant.                        │
│ calendar     │ daily    │ red-folder   │ the 10-point RedFolder term.          │
│ DXY          │ daily    │ 1H           │ cross-pair confirmation (R18 mirror). │
└──────────────┴──────────┴──────────────┴───────────────────────────────────────┘
```

**THE ONE-WRITE LAW:** option data is fetched **once per week, on Monday, before the London open**, and never again. It is a weekly constant. Re-fetching mid-week is a defect — the walls do not move, and re-fetching invites the value to drift under the analysis.

---

# §3 · L1 — THE COMPUTE PLANE (the sidecar)

```
                        ┌─────────────────────────────┐
                        │   ORCHESTRATOR (one entry)  │
                        │   sidecar run --week 2026-07-06
                        └──────────────┬──────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        ▼                              ▼                              ▼
┌───────────────┐            ┌─────────────────┐            ┌────────────────┐
│ S1 · HARVEST  │            │ S2 · INSTITUTION│            │ S3 · CALENDAR  │
│ bars 4H/1H/15m│            │ Protocol A parse│            │ red-folder days│
│ + DXY         │            │ strikes→walls   │            │ + session map  │
│               │            │ in BILLIONS     │            │                │
└───────┬───────┘            └────────┬────────┘            └───────┬────────┘
        │                             │                             │
        └──────────────┬──────────────┴──────────────┬──────────────┘
                       ▼                             ▼
          ┌────────────────────────┐    ┌────────────────────────────┐
          │ S4 · E1 FACE B         │    │ S5 · E1 FACE A             │
          │ (bar-derivable)        │    │ (institution-derived)      │
          │                        │    │                            │
          │ order blocks  4H→1H    │    │ 5 IP roles by POSITION     │
          │ supply / demand 4H/1H  │    │ confluence 0-14 (/12 base  │
          │ LQZ 1H→30m→15m         │    │   + 2 extreme bonus)       │
          │ sweeps, closes-through │    │ ZFP strength: base + mods  │
          │ 9-pillar scan          │    │ tier: 1 / 2 / 3 POI        │
          └───────────┬────────────┘    └─────────────┬──────────────┘
                      │                               │
                      └───────────────┬───────────────┘
                                      ▼
                          ┌───────────────────────┐
                          │ S6 · THE ZONE MAP     │
                          │ one record per zone   │
                          │ zoneId · family ·     │
                          │ top · bottom · tf ·   │
                          │ confluence · degree · │
                          │ zfp · receipt · tier  │
                          └───────────┬───────────┘
                                      ▼
                          ┌───────────────────────┐
                          │ S7 · E2 CASCADE       │
                          │ 10 shapes · priority  │
                          │ first-match-stops     │
                          │ + transitions         │
                          └───────────┬───────────┘
                                      ▼
                          ┌───────────────────────┐
                          │ S8 · E3 SETUPS        │
                          │ entry at zone edge    │
                          │ SL per E2 prediction  │
                          │ TP opposing zone      │
                          │ RRR · confidence      │
                          └───────────┬───────────┘
                                      ▼
                          ┌───────────────────────┐
                          │ S9 · GATE             │
                          │ conf ≥ 65             │
                          │ RRR ≥ 2.5 hard        │
                          │ GOD_TIER / HIGH only  │
                          │ count: eviction       │
                          └───────────┬───────────┘
                                      ▼
                          ┌───────────────────────┐
                          │ S10 · EMIT            │
                          │ one JSON per week     │
                          └───────────────────────┘
```

## The confidence composite

```
   confidence =  Base   (confluence / 12) × 40
               + Option  (notional / 3.5B)  × 20
               + Shape   20
               + RedFolder 10
               + ZFP     (1 − ZFP%) × 10
               + BoM/MoM ± 10
                                                         ─────
                                              max 110, capped 100
                                              GATE: ≥ 65
```

```
   ┌────────────┬──────────────┬──────────┬──────────────────────────────────┐
   │ TIER       │ confidence   │ RRR      │ EMITTED?                         │
   ├────────────┼──────────────┼──────────┼──────────────────────────────────┤
   │ GOD_TIER   │ ≥ 90 + VLM   │ ≥ 3.0    │ YES — full position              │
   │ HIGH       │ ≥ 80         │ ≥ 2.5    │ YES — standard position          │
   │ STANDARD   │ 65-79        │ ≥ 2.0    │ CALIBRATION ONLY, never shown    │
   │ CONDITIONAL│ —            │ —        │ DELETED                          │
   │ REJECTED   │ —            │ —        │ DELETED — nothing below 65 exists│
   └────────────┴──────────────┴──────────┴──────────────────────────────────┘
```

## The count rule — eviction, never rejection

```
   ceiling: 3 per day · 12 per week          tier: EVOLVING (provisional)

   ceiling reached + a HIGHER-confidence setup arrives
        └─> EVICT the weakest, admit the new one
   ceiling reached + a LOWER-confidence setup arrives
        └─> reject the newcomer — it is the weakest of the set
   wildly exceeded (27 in a day)
        └─> HALT: the engine is fabricating, not the market being busy

   THE STRING "rejected — daily cap reached" DOES NOT EXIST IN THE CODE.
   The only legal report names the confidence ordering that decided.
```

---

# §4 · L2 — THE DELIVERY PLANE (the JSON contract)

**One document per week.** Every consumer reads the same artifact.

```json
{
  "schema": "pv-week/v1",
  "week": "2026-07-06",
  "anchor_ms": 1783328400000,
  "pair": "DXY",
  "generated_ms": 1783400000000,
  "source": { "bars": "4H/1H/15m", "options": "protocol-A/2026-07-06", "calendar": "red-folder/2026-W28" },
  "zones": [
    { "id": "IP-CEILING",  "family": "IP", "role": "RESISTANCE CEILING",
      "top": 1.3492, "bottom": 1.3478, "tf": "4H",
      "confluence": 9, "degree": "MODERATE-HEAVY", "tier": 2,
      "zfp": 12.0, "receipt": { "base": 5, "mods": [["spring",20],["cascade",25]] } },
    { "id": "LQZ-1H-03",  "family": "LIQ", "top": 1.3410, "bottom": 1.3402, "tf": "1H" }
  ],
  "chain": {
    "current": "SWING_SCALP", "terminal": "BREAKOUT_SURGE",
    "links": [ { "to": "BREAKOUT_SURGE", "zone": "IP-CEILING", "zoneZfp": 12, "confidence": 78 } ],
    "spans": [ { "shape": "SWING_SCALP", "start_ms": 1783328400000, "end_ms": 1783512000000 } ]
  },
  "setups": [
    { "id": 1, "dir": "LONG", "tier": "GOD_TIER", "confidence": 91,
      "entry": 1.3481, "sl": 1.3469, "tp": 1.3521, "rrr": 3.33,
      "entry_zone": "IP-CEILING", "shape_from": "BREAKOUT_SURGE",
      "day": "Tue", "session": "London",
      "stop_branch": "SOFT_MITIGATION", "trace": { "e1": "IP-CEILING", "e2": "BREAKOUT_SURGE" } }
  ],
  "suppressed": [ { "id": 2, "reason": "CONFIDENCE_BELOW_GATE", "confidence": 61 } ],
  "count": { "emitted": 1, "ceiling": 12, "evicted": [] }
}
```

## How the payload reaches Pine — three options, one recommendation

```
  ┌───┬──────────────────────────────┬──────────┬─────────────────────────────┐
  │   │ MECHANISM                    │ MANUAL?  │ VERDICT                     │
  ├───┼──────────────────────────────┼──────────┼─────────────────────────────┤
  │ A │ ONE `input.string` holding   │ 1 paste  │ ✅ RECOMMENDED (phase 1)    │
  │   │ the week JSON, pasted once   │ per week │ the only mechanism Pine     │
  │   │ per week                     │          │ actually supports           │
  ├───┼──────────────────────────────┼──────────┼─────────────────────────────┤
  │ B │ Companion web app renders    │ none     │ ✅ PRODUCTION TARGET (P2)   │
  │   │ the same JSON with a chart   │          │ the Plutus dashboard:       │
  │   │ library — not Pine at all    │          │ chart tab + Pine IDE +      │
  │   │                              │          │ backtest + agent + MT       │
  ├───┼──────────────────────────────┼──────────┼─────────────────────────────┤
  │ C │ Pine fetches from a server   │ —        │ ❌ IMPOSSIBLE               │
  │   │                              │          │ Pine has no HTTP            │
  └───┴──────────────────────────────┴──────────┴─────────────────────────────┘
```

**Build A first, then B.** Same JSON both ways. The compute plane is identical.

---

# §5 · L3 — THE RENDER PLANE (the Pine indicator)

```
  ┌─ MODULE ────────────┬─ RESPONSIBILITY ─────────────────────────────────────┐
  │ 00 · inputs         │ the week JSON, the pair, display toggles              │
  │ 01 · anchor         │ derive the trading week from `time`, 1-week lookback  │
  │ 02 · week-json      │ parse + validate; REFUSE on schema mismatch            │
  │ 03 · zones-native   │ compute Class-A zones from bars: OB, S/D, LQZ, sweeps  │
  │ 04 · zones-ip       │ draw the 5 IP roles from the payload                   │
  │ 05 · zfp            │ render the ZFP number + its receipt on the zone        │
  │ 06 · chain          │ phase 1: chained BOXES per shape span                  │
  │ 07 · chain-line     │ phase 2: the ONE LINE that traces the week             │
  │ 08 · setups         │ entry / SL / TP boxes + the RRR label                  │
  │ 09 · table          │ the week's decision table: tier, conf, RRR, day, sess  │
  │ 10 · lookback       │ the previous week drawn dimmed, for reaction context   │
  └─────────────────────┴───────────────────────────────────────────────────────┘
```

## The drawing order — non-negotiable, back to front

```
   1  ZONES        translucent bands, 5 IP roles + S/D + LQZ
   2  ZFP LABELS   number + degree on each zone
   3  CHAIN BOXES  phase 1 — one box per shape span
   4  CHAIN LINE   phase 2 — the single path line
   5  SETUPS       entry/SL/TP boxes, RRR + tier label
   6  TABLE        bottom-right, the week's decisions

   RULE: a zone NEVER draws over a setup; a setup never draws over the table.
   RULE: if the payload is absent or invalid, the indicator draws zones only and
         prints "IP: NO PAYLOAD" — it never invents an IP zone.
```

## The two E2 phases (R-03, verbatim)

```
   PHASE 1  BOXES       each shape gets a box spanning its bar range, so the
                        STRUCTURE is legible without the path
   PHASE 2  THE LINE    one line traces where price actually went through them
```

---

# §6 · L4 — THE VERIFY PLANE (five gates, each mechanical)

```
┌──┬─────────────────────┬──────────────────────────────────────────────────────┐
│  │ GATE                │ THE CHECK THAT CAN FAIL                              │
├──┼─────────────────────┼──────────────────────────────────────────────────────┤
│ 1│ PAYLOAD VALID       │ the JSON parses against pv-week/v1; a schema miss =   │
│  │                     │ refuse, draw zones only, print the token              │
│ 2│ ZONE PROVENANCE     │ every zone carries zoneId + a receipt; no receipt =   │
│  │                     │ no render                                            │
│ 3│ SETUP ANCESTRY      │ every setup traces to an E1 zoneId AND an E2 shape;   │
│  │                     │ an untraceable setup is dropped, never drawn          │
│ 4│ THE PIXEL GATE      │ the rendered chart is captured and READ against a     │
│  │                     │ written expectation — counts, labels, overlaps        │
│ 5│ THE REPLAY GATE     │ rewind to a random past Tuesday, render, compare to   │
│  │                     │ what the engine said then                             │
└──┴─────────────────────┴──────────────────────────────────────────────────────┘
```

**Gate 4 is the only one that proves the chart.** **And the acceptance test that has never run:** hand a blind agent one week of bars and grade its output.

---

# §7 · L5 — THE LEARN PLANE

```
   every decision, every payload, every render verdict, every gate result
                    │
                    ▼
        ┌───────────────────────────────┐
        │  THE LEDGER (append-only)     │
        └───────────────┬───────────────┘
                        ▼
        ┌───────────────────────────────┐
        │  PROPOSALS (agent, invoked)   │  "the graph said X, reality was Y"
        │  card diffs, never writes     │
        └───────────────┬───────────────┘
                        ▼
                ═══ USER GATE ═══
                        ▼
        ┌───────────────────────────────┐
        │  APPLY (stamper) → pv-kg-gate │
        └───────────────────────────────┘
```

---

# §8 · THE BUILD SEQUENCE — six phases

```
┌─────┬──────────────────────────────┬───────────────────────────────────────┐
│ P0  │ THE WIRE                     │ every producer runs; GATE rc=0        │
├─────┼──────────────────────────────┼───────────────────────────────────────┤
│ P1  │ E1 FACE B (bar-derivable)    │ 5+ zones from 4H/1H/30m               │
├─────┼──────────────────────────────┼───────────────────────────────────────┤
│ P2  │ E1 FACE A (institution)      │ the 5 IP roles, confluence, ZFP receipt│
├─────┼──────────────────────────────┼───────────────────────────────────────┤
│ P3  │ E2 PHASE 1 — THE BOXES       │ 10 shapes classified; chain as boxes  │
├─────┼──────────────────────────────┼───────────────────────────────────────┤
│ P4  │ E2 PHASE 2 — THE LINE        │ the line traces price; ratio measured │
├─────┼──────────────────────────────┼───────────────────────────────────────┤
│ P5  │ E3 + THE GATE                │ ≥2 setups/week · conf ≥65 · RRR ≥2.5  │
├─────┼──────────────────────────────┼───────────────────────────────────────┤
│ P6  │ REPLAY + BLIND               │ 10 unseen weeks; a blind agent graded │
└─────┴──────────────────────────────┴───────────────────────────────────────┘
```

**The freeze rule:** at P6 the code is frozen and the ten held-out weeks are rendered with it unchanged.

---

# §9 · THE FILE LAYOUT

```
PLUTUS_VISION/
├── MASTER_CONTEXT/              the canon (13 sources) + OPERATOR_RULINGS_PV.md
├── cards/  sources/  type/      THE GRAPH — 163 cards, 8 hubs, 8 types
├── sidecar/                     L1 · python
│   ├── run.py                   the one entry: run --week --pair
│   ├── harvest/                 bars_4h.py · bars_1h.py · bars_30m.py · dxy.py
│   ├── institution/             protocol_a.py · walls.py · notionals.py
│   ├── calendar/                red_folder.py
│   ├── e1/                      ob.py · sd.py · lqz.py · pillars.py · confluence.py · zfp.py
│   ├── e2/                      cascade.py · transitions.py · spans.py
│   ├── e3/                      entry.py · stop.py · target.py · rrr.py
│   ├── gate/                    confidence.py · tiers.py · eviction.py
│   ├── emit/                    envelope.py · validate.py
│   └── tests/                   one test per module + the golden week
├── pine/                        L3 · the indicator
│   ├── plutus-vision.pine       the assembled script
│   ├── modules/                 00-inputs … 10-lookback
│   └── schema/                  pv-week.v1.json
├── proofs/                      L4 · every capture, every verdict, every gate
├── forensic/                    INSTRUMENT_FAILURES.md · BLIND_COMPREHENSION_AUDIT.md
└── .omp/graph-intelligence/     the semantica L1 layer
```

---

# §10 · THE RISK REGISTER

```
┌───┬────────────────────────────────────┬──────────┬────────────────────────────┐
│   │ RISK                               │ SEVERITY │ THE MITIGATION             │
├───┼────────────────────────────────────┼──────────┼────────────────────────────┤
│ 1 │ option data is unobtainable        │ CRITICAL │ composite degrades to 80;  │
│   │                                    │          │ the indicator still works  │
│ 2 │ the payload is pasted wrong/stale  │ HIGH     │ schema validate + REFUSE   │
│ 3 │ ZFP is calibrated wrong            │ HIGH     │ §4.7 calibration is a P2   │
│   │                                    │          │ exit condition             │
│ 4 │ the builder bakes levels           │ CRITICAL │ freeze at P6, render 10    │
│   │                                    │          │ unseen weeks unchanged    │
│ 5 │ 4H data missing → confluence ≤3    │ HIGH     │ 4H is a hard L0 requirement│
│ 6 │ rockets counted as trades          │ MEDIUM   │ MECH-ROCKETS-VS-TRADES     │
└───┴────────────────────────────────────┴──────────┴────────────────────────────┘
```

---

# SUMMARY

**The sidecar answers the one question the chart cannot: where is the institutional money.** It
fetches 4H/1H bars and the weekly option expiry table, derives the five IP zones with their
confluence, degree, tier and ZFP receipt, then runs the shape cascade and the trade gate, and emits
one payload per week. **The indicator is a renderer.** It computes every zone the bars can prove
natively on the chart, live, with no manual step, and draws the institutional layer and the derived
decisions from the payload. **One paste per week is the entire manual surface.** Everything is
derived, every claim traces to a zone ID or a bar, and the last thing built is the test that hands a
blind agent a week of bars to prove the machine works.
