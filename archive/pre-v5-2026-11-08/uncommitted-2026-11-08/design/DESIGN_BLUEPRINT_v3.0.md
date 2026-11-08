# PLUTUS VISION — DESIGN BLUEPRINT v3.0
## A Cloudflare-native manufacturing design: Workers · Durable Objects · Workflows · Clef · Clairic

**Class:** BLUEPRINT. **Status:** authoritative for v3.0. **Supersedes:** v2.0 (which described a
pipeline but hosted it nowhere).
**Test:** a stranger must name every component, state every contract, predict every absence, and
point at what kills the build — from this document alone.

---

## REVISION TABLE

| # | the correction | what it changed |
|---|---|---|
| 1 | "nothing works, ever" | §0.3 states the build as UNPROVEN. No section describes existing behaviour as working. |
| 2 | "no LLM, no agent, no hallucination" | §0.1. Both model classes emit typed values only; no component generates prose. |
| 3 | "build it on Cloudflare — Workers, DO, Workflows" | §2. Every step is a Cloudflare primitive. There is no process, no container, no server. |
| 4 | "Clef and Clairic" | §4.1 (Clairic extraction) and §5.5 (Clef judgement). One binding, `env.AI`. |
| 5 | "pi-durable only where Cloudflare is NOT best" | §2.6. Three named legs, each with the reason Cloudflare loses. |
| 6 | "no fallbacks" | §4.4, §5.7, §15. Every absence is a named fatal. |
| 7 | "60 code / 40 System One" | §5.8. Counted clause by clause: 33 / 22. |

---

# §0 · THE CONSTRAINT, AND THE SPLIT IT FORCES

## §0.1 · The three physical laws

```
┌────────────────────────────────────────────────────────────────────────────┐
│ L-A  PINE SCRIPT CANNOT MAKE AN HTTP REQUEST.                              │
│      Its entire external surface is request.security/economical/financial   │
│      and input.*. No fetch, no socket, no file read.                       │
├────────────────────────────────────────────────────────────────────────────┤
│ L-B  A SYSTEM ONE MODEL CANNOT REASON, COUNT, COMPUTE, OR WRITE PROSE.      │
│      One forward pass, typed values or probabilities. It cannot hallucinate │
│      text — and it cannot be asked to "figure out" anything.                │
├────────────────────────────────────────────────────────────────────────────┤
│ L-C  WORKERS HAVE NO LONG-LIVED PROCESS, AND A DO IS SINGLE-THREADED        │
│      PER OBJECT. There is no place to keep a loop alive, no shared memory,  │
│      no background thread. Durable state must be a Workflow step or a DO.   │
└────────────────────────────────────────────────────────────────────────────┘
```

## §0.2 · The split the three laws force

```
        ┌──────────────────────────────────────────────────────────────┐
        │ CODE — the macro shell                                       │
        │ every number · every bound · every branch · every gate       │
        │ every retry · every write                                    │
        └──────────┬───────────────────────────────────┬───────────────┘
                   │                                   │
     ┌─────────────▼─────────────┐     ┌───────────────▼───────────────┐
     │ CLAIRIC — the READER      │     │ CLEF — the JUDGE              │
     │ image/prose -> typed      │     │ evidence -> probability over  │
     │ value + p_null + span     │     │ a fixed option set            │
     └───────────────────────────┘     └───────────────────────────────┘
                   │                                   │
        ┌──────────▼───────────────────────────────────▼───────────────┐
        │ CODE AGAIN — compose, threshold, veto, route, seal, draw      │
        └───────────────────────────────────────────────────────────────┘
```

**One sentence:** code computes the world, Clairic reads what is not computable, Clef judges what is
not decidable, code decides what to draw — and every step runs on a Cloudflare primitive because
there is nowhere else to run it.

## §0.3 · THE MEASURED START STATE

```
PROVEN     cf/ typechecks (tsc rc=0) · 23/23 ZFP parity cases · firewall rc=0
           gates/gate.sh: 5 exit paths, _dead refused (GATE_DEFECT)
UNPROVEN   no deploy · no D1 id · no R2 bucket · no calibration sweeps
ABSENT     G0 G2 G3 G4 G5 · verify-plutus driver · Pine kernel · held-out set
=> NOTHING IN THIS SYSTEM HAS RUN END TO END. This is a design, not a status.
```

---

# §1 · THE STACK — five planes, one direction

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ L4 VERIFY    G0 doctor · G1 pixels · G2 structural · G3 claim · G4 labels ·  │
│              G5 agreement + the known-bad control · the 10-week replay       │
├──────────────────────────────────────────────────────────────────────────────┤
│ L3 RENDER    the Pine kernel: standalone engine + card caster + draw order   │
├──────────────────────────────────────────────────────────────────────────────┤
│ L2 CARD      trident-workflow-v2 · sealed exactly once · 3,500-token ceiling │
├──────────────────────────────────────────────────────────────────────────────┤
│ L1 COMPUTE   Workflow pv-week: E1 · E2 · E3 · gate · compose                 │
├──────────────────────────────────────────────────────────────────────────────┤
│ L0 DATA      bars (R2) · options ladder (Browser+Clairic) · calendar         │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Dependency direction is one-way.** E1 never reads E2. E2 never reads E3. L3 never reads L1. The
card is the only artifact that crosses from L2 into L3, and the frame is the only artifact that
crosses into L4.

| plane | consumes | produces | owner | when absent |
|---|---|---|---|---|
| L0 | R2 keys, a URL | `Bars`, `Walls`, `Event[]` | the Workflow steps | named fatal; no card |
| L1 | L0 outputs | `Zone[]`, `ShapeLink[]`, `Setup[]` | `src/e1,e2,e3` | named fatal; no card |
| L2 | L1 outputs | one sealed `Card` | `WeekSeal` DO | no card; renderer prints CARD: ABSENT |
| L3 | the card | a rendered chart | the Pine kernel | face B only + the token |
| L4 | the frame + the card | a verdict | the gates | no PASS row; no commit |

---

# §2 · THE MACRO ARCHITECTURE

## §2.1 · Topology

```
                    ┌─────────────────────────────┐
                    │  POST /run  {pair, week}    │
                    │  Workers · src/index.ts     │
                    └──────────────┬──────────────┘
                                   │ PV_WEEK.create()
                                   ▼
        ┌──────────────────────────────────────────────────┐
        │  WORKFLOW pv-week · S0..S8 · durable steps       │
        └───┬───────────┬───────────┬───────────┬──────────┘
            │           │           │           │
            ▼           ▼           ▼           ▼
     ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌──────────────┐
     │ R2       │ │ BROWSER  │ │ AI      │ │ D1           │
     │ bars     │ │ render   │ │ Clairic │ │ runs index   │
     │ captures │ │ options  │ │ Clef    │ │ (queryable)  │
     │ cards    │ │ page     │ │         │ │              │
     └──────────┘ └──────────┘ └─────────┘ └──────────────┘
                                   │
                          ┌────────┴─────────┐
                          ▼                  ▼
                   ┌──────────────┐  ┌──────────────┐
                   │ DO Ledger    │  │ DO WeekSeal  │
                   │ row per call │  │ one write    │
                   └──────────────┘  └──────┬───────┘
                                            │ GET /card
                                            ▼
                                   ┌──────────────────┐
                                   │ PINE one field   │
                                   └──────────────────┘
```

## §2.2 · The step contract — typed, keyed, retried

| # | step | consumes | produces | idempotency | retry | on failure |
|---|---|---|---|---|---|---|
| S0 | `arm` | `{pair, week}` | D1 row `status=armed` | `runs.id` PK | none | `W0_*` |
| S1 | `harvest` | `R2 barsR2Key` | `Record<tf,Bars>` | step result persisted | 3 × linear 5 s | `W1_*` |
| S2 | `capture.options` | `BROWSER` + url | PNG + `captures/…` | content sha | 3 × linear 10 s | `W2_CAPTURE_*` |
| S3 | `extract.options` | PNG + 7 fields | `Walls` | `sha(png)` | 2 × constant 5 s | `W2_I1..I5` |
| S4 | `e1.compute` | bars + walls | `Zone[]` | engine version | none | `E1_*` |
| S5 | `e1.attest` | zones | attested `Zone[]` | judge fingerprint | none | `E1_ATTESTATION_*` |
| S6 | `e2.chain` | zones + bars | `ShapeLink[]` + alt | chain version | none | `E2_*` |
| S7 | `e3.setups` | chain + zones | `Setup[]` + refusals | setup version | none | `E3_*` |
| S8 | `seal` | the card | `{sha, created}` + R2 + D1 | DO key `pair:week` | none | `CARD_SEAL_*` |

**A retry never re-runs a completed step.** Workflows persists each step's result, so a failure at S6
resumes there with S1–S5 intact.

## §2.3 · Why a Workflow and not an agent

An agent chooses the next step. This pipeline never does: S0→S8 is a fixed graph, and the only
adaptivity is inside a Clef question, which cannot call a tool, write a file, or choose a step.

## §2.4 · Why a Durable Object for the seal

Two concurrent workflow runs for the same `(pair, week)` would otherwise both write a card.
`WeekSeal.writeOnce` returns the existing sha on the second call (`created:false`); it never
overwrites. That is the exactly-once point, implemented as storage rather than as discipline.

## §2.5 · Why a Durable Object for the ledger

`ask()` writes the row before returning, so a caller cannot forget it. One object per run gives one
writer, and SQLite gives the ordering.

## §2.6 · pi-durable — the three legs where Cloudflare is NOT best

| leg | why Cloudflare loses | the pi-durable contract |
|---|---|---|
| capture behind a login / anti-bot wall | Browser Rendering cannot hold a human session | same input, same PNG, same R2 key, same codes |
| drive the local Pine IDE for pixel verification | it is a desktop app on this host | same verdict shape; the GATE still writes it |
| local dev with no Cloudflare account | no account, no bindings | runs `bun cf/test/zfp-parity.ts` |

Every other leg is Cloudflare. pi-durable substitutes an **executor**, never the architecture.

---

# §3 · THE PROCESS IT PRESERVES

```
   v1 (manual)                     v3.0 (this design)
   ────────────────────────        ──────────────────────────────────────────
   ① a prompt to an agent          ① a Workflow: S0..S8, typed, retried
   ② a PDF read by eye             ② a card: schema-validated, sealed once
   ③ hand-transcribed to Pine      ③ a kernel that parses and casts the card

   SAME THREE STEPS. ① is no longer prose, ② is no longer a PDF, ③ is no
   longer a transcription.
```

What the PDF had to get right is now a field the card must carry — the zone table, the confluence
arithmetic, the ZFP receipt, the setup geometry — checked by schema and by gate rather than by eye.

---

# §4 · L0 — THE DATA PLANE

## §4.1 · Clairic: the option ladder

| field | type | invariant it feeds |
|---|---|---|
| `strikes` | list<number, 4dp> | I1 alignment, I3 domain |
| `notionals_b` | list<number, 2dp> | I2 units (0,500) |
| `open_interest` | list<number\|null> | I1 alignment |
| `expiry_date` | date | I4 window |
| `cut_time` | time | I4 window |
| `printed_total_b` | estimate | I5 consistency |
| `pair` | text | I1 identity |

**Contract:** consumes one PNG (≤4 MiB, embedded bytes) and seven field specs; produces seven typed
values each carrying `p_null`, `confidence`, and a `span`.
**Invariant:** the five checks below hold.
**Failure:** any check fails → a named `W2_*` code → no card.

```
I1  len(strikes) == len(notionals_b) == len(open_interest)
I2  0 < notional < 500            (the ladder is already in BILLIONS)
I3  |strike - spot| <= 15% spot
I4  week.start <= expiry <= week.end
I5  |printed_total - sum(notionals)| <= 2% sum
```

## §4.2 · The abstention rule

```
p_null > 0.05 on a strike   -> that strike is dropped and journaled
p_null > 0.50 on a field    -> W2_INCONCLUSIVE (fatal)
`guess` is never read       -> it exists for a human, not for code
```

## §4.3 · Bars

`R2 barsR2Key` → `{ "4H": Bars, "1H": Bars, "30m": Bars }`, each `{ts[],open[],high[],low[],close[]}`.
**Invariant:** monotonic ts, finite OHLC, `last.ts <= anchor`, `4H.length >= 200`.
**Failure:** `W1_BARS_ABSENT`, `W1_LOOKAHEAD`, `W1_BARS_INVALID`, `W1_4H_SHORT` — all fatal.

## §4.4 · The absence contract (no fallback)

```
options capture fails      -> W2_CAPTURE_EMPTY / W2_I1..I5        STOP
calendar fails             -> W3_*                                STOP
4H bars short              -> W1_4H_SHORT                         STOP
Clairic returns null       -> W2_INCONCLUSIVE:<field>             STOP
Clef unreachable           -> E_JUDGE_DOWN                        STOP
Pine card absent           -> CARD: ABSENT — FACE A OMITTED       RENDER face B only
```

The last row is not a fallback: the indicator is a standalone engine by design, and an absent card
means face A does not exist. It prints the absence; it never invents a zone.

---

# §5 · L1 — THE COMPUTE PLANE

## §5.1 · E1 — zones

| stage | consumes | produces | invariant | failure |
|---|---|---|---|---|
| pillars | 4H/1H/30m bars | `Level[]` (9 types) | every level carries a type | `E1_NO_LEVELS` |
| cluster | levels, tol = spot·4e-5 | `Cluster[]` | members sorted by price | `E1_NO_ZONES` |
| confluence | cluster | 0..14 | `0 <= s <= 14` else raise | `E1_CONFLUENCE_OUT_OF_RANGE` |
| degree | confluence | bucket | `DEGREE[floor(conf)]` is total | — |
| ZFP | zone + ctx | `Receipt` | receipt re-adds; clamp 0..99 | `ZFP_*` (18 codes) |
| roles | zones, spot | 5 roles | exactly 5 distinct ids | `E1_ROLE_COUNT` |
| variance | zone ZFPs | sd | `sd >= 1.0` over ≥3 zones | `E1_ZFP_FLAT` |

## §5.2 · The ZFP receipt — the anti-fabrication artifact

```
base   = midpoint of the tier band           (Hard 10, Standard 22.5, Ghost 30, Soft 40, Touch 60)
mods   = six BOOLEANS at fixed points        (+25 +20 +15 +20 +25 +20)
raw    = base + sum(fired)                   bounded [0,185]
zfp    = half_up(clamp(raw, 0, 99))
```

Every modifier carries `{name, fired, value, gate}`. A declined modifier carries the gate that
declined it. A ZFP without its receipt is invalid regardless of how plausible it looks.

## §5.3 · E1 attestation — the judge reads the receipt

| id | question | can fail on |
|---|---|---|
| Z1 | every claimed pillar has an in-range level of that type | a detector that mislabels |
| Z2 | every fired modifier's gate string satisfies its canon rule | a predicate with the wrong sign |
| Z3 | every declined modifier names a genuinely absent condition | a silently disabled +20 |
| Z4 | the tier satisfies every conjunct on the evidence shown | tier promotion from a typo |

**Composition:** `p = min(Z1..Z4)`; `DENY` drops the zone; `>20%` dropped → `E1_ATTESTATION_DRIFT`;
`<5` kept → `E1_TOO_FEW_ZONES`. A planted-bad zone rides every request; if it is attested, the run
is void.

## §5.4 · E2 — the chain

```
spans -> anatomy -> target zone ZFP -> licensed set -> rank -> keep 8
      -> ONE Clef request (A1..A4) -> vetoes
      -> ONE Clef request (B1)     -> new-structure
      -> walk (transition table)   -> days -> alternative
      -> ONE Clef request (C1,C2)  -> energy + hinge
```

**The model's only power is subtraction.** It cannot add a candidate, reorder the chain, or name a
shape outside the licensed set. `E2_CHAIN_ORDER` verifies strictly increasing starts; a trim that
raises confidence is `E2_CONFIDENCE_INVERSION`.

## §5.5 · E3 — the setups

E3 owns exactly four numbers: `entry`, `sl`, `tp`, `rrr`. Everything else is cited.

```
entry = the edge of a 1H/30m/15m zone   (never 4H, never a shape vertex)
sl    = the opposite edge +/- 2..5 pips
tp    = the nearest opposing zone on the path
rrr   = |tp-entry| / |entry-sl|          hard reject < 2.5
```

Ten kill clauses run before any model: RRR floor, confidence gate, tier, daily cap, weekly cap, day
mismatch, anchor type, SL buffer, TP off-path, duplicate. Then five nouls, then two more.

## §5.6 · The Clef engine — one door

| gate | check | failure |
|---|---|---|
| state | every `requires` path resolves (all items) | `E_STATE_INCOMPLETE` |
| size | `tokens(state) <= 120k` | `E_CONTEXT_OVERFLOW` |
| schema | ≤64 questions, ≤60 words, choice ≤255, score ≤10 | `E_TOO_MANY_QUESTIONS` etc. |
| answer | ids match, values in range, booleans rejected | `E_JUDGE_MALFORMED` |
| control | ≥10 answers with one distinct value | `E_JUDGE_CONSTANT` |
| ledger | one row per call, written inside `ask()` | (no row → no call) |

## §5.7 · Fail polarity

Critical surfaces fail **closed**: E1 attestation, E2 chain, E3 setups, G3, G4. An advisory surface
fails open and logs a miss. A refused item is never reported as handled.

## §5.8 · The 60/40 count

```
CODE  33   E1 15 · E2 7 · E3 9 · verify 2
MODEL 22   Clairic 4 (ladder, expiry, calendar, prose levels) · Clef 7 (E2) · Clef 7 (E3)
           · verify 4 (bands, boxes, line, claim)
TOTAL 55 · code 60.0% · model 40.0%
```

`clauses.json` is the registry; the gate counts it and fails outside 60±2 / 40±2.

---

# §6 · L2 — THE CARD

```jsonc
{ "schema":"trident-workflow-v2",
  "meta":{ "week","pair","anchor_ms","sources":{"bars","options"},"absent":[],"engine" },
  "zones":[ { "id","top","bottom","mid","confluence","degree","role","pillars",
              "zfp","receipt{base,modifiers[],raw,clamped,was_clamped,tier,band,
                            pillar9_bucket,cross_check,tier_inputs}","attest" } ],
  "chain":[ { "id","shape","target","target_zfp","direction","start_ts","end_ts",
              "confidence","day","clauses" } ],
  "days":["Mon",…], "alternative":{ "decision_zone","flip_at","chain":[] } | null,
  "setups":[ { "id","direction","entry","sl","tp","rrr","confidence","tier",
               "anchor_zone","day","session","category","clauses" } ],
  "refusals":[ { "id","code","detail" } ],
  "count":{ "emitted","ceiling":8,"evicted" },
  "journal_seed":{ "run" } }
```

**Invariants:** every zone carries a receipt; every `Class-B` value carries `p_null`; no shape, span,
or setup appears inside `provenance`; `tokens(card) <= 3500` or `CARD_OVERFLOW`.
**Seal:** `WeekSeal.writeOnce` — one write per `(pair, week)`; a second returns the existing sha.

---

# §7 · L3 — THE RENDER

```
//@version=6
indicator("PLUTUS VISION", overlay=true, max_boxes_count=500, max_lines_count=500)
raw  = input.string("", "Week Card")
card = parse(raw)
if card == null
    draw_standalone()                       // face B + bars-only chain
    label.new(bar_index, high, "CARD: ABSENT — FACE A OMITTED")
else
    for node in card.nodes
        if cast(node) == FAIL
            continue                        // nothing renders for that node
        draw(node)
```

**The cast:** a setup resolves iff `entry_zone` and `shape_from` exist in this card, the zone carries
a receipt, and the named shape exists in the kernel's computed chain. Unresolved → FAIL → nothing
renders for that node → the refusal is printed.

---

# §8 · L4 — VERIFY

| gate | subject | predicate | absent |
|---|---|---|---|
| G0 | the rig | pid alive ∧ port ours ∧ build sha matches | `G_DOCTOR` |
| G1 | the frame | 20 pixel checks C01–C20 | `G_ARITHMETIC` |
| G2 | card + .pine | receipts re-add ∧ no stub ∧ no literal price | `G_STRUCTURAL` |
| G3 | the card + the claim | `mandate_met ≥ act` ∧ `claim_contradicted < act` | `G_CLAIM` |
| G4 | the frame | labels read ∧ compared to the card | `G_PERCEPTION` |
| G5 | all verdicts | agree ∧ the known-bad control REFUSED | `G_VOID` |

```
EXIT  0 PASS · 1 FAIL · 2 INCONCLUSIVE · 3 VOID/STALE · 4 GATE_DEFECT
```

**Measured today:** the harness refuses a gate that always passes
(`GATE_DEFECT:_dead:negative_rc=0`, rc=4), refuses a tampered gate
(`VOID:GATE_TAMPERED:G1`, rc=3), and refuses a stale subject (`VOID:STALE_SUBJECT`, rc=3).

---

# §9 · DELIVERY

| option | mechanism | why it exists | impossible variant |
|---|---|---|---|
| A · paste | one `input.string`, card pasted, kernel parses | ships first; no recompile per week | Pine fetching the card — banned by L-A |
| B · tab | dashboard reads `GET /card`, renders the same JSON | parity check | two engines — banned: one card, one truth |

Both consume the **same bytes**. `sha(card)` must be identical on both paths.

---

# §10 · THE LEARN LOOP

```
ledger row (answers + policy + route)
   -> later_truth is filled by the replay
   -> calibration sweep (act 0.50..0.95, precision/recall per point)
   -> policy file rewritten with the sweep beside it
   -> the next run reads the file; a policy without a file is E_UNCALIBRATED
```

The loop never tunes a question by taste. A question whose max probability is below 0.5 is broken
and is rewritten, not re-thresholded.

---

# §11 · ANTI-PATTERNS, EACH WITH A MECHANICAL DETECTOR

| # | the failure | the detector (exits nonzero) |
|---|---|---|
| A1 | a model produces a number | every numeric card field must exist in the computed set |
| A2 | a compound question | one `?`, ≤60 words, no `and/or` joining two judgments |
| A3 | a question referencing another answer | a stage boundary; `requires` names state, never an answer id |
| A4 | threshold theft | `policy()` throws `E_UNCALIBRATED` without a source file |
| A5 | baked payload | `provenance` containing shape/span/setup keys |
| A6 | unprovenanced value | a Clairic value without `p_null` and a span |
| A7 | units drift | `notional_b` outside (0,500) → `W2_I2_UNITS` |
| A8 | silent fallback | every absence has a named code; no `catch {}` (firewall D8) |
| A9 | count inflation | emitted > 8/week or > 3/day → `E3_*_CAP` |
| A10 | hardcoded levels | `gates/firewall.sh` D4 over `pine/` |
| A11 | 15m creep | `15m` only in execution context, never classification |
| A12 | non-canon vocabulary | a term not in the card set |
| A13 | stub wearing done | `return {stubbed:true}` (firewall D5) |
| A14 | unvalidated price to a draw | any `na`/0 price reaching `box.new` |
| A15 | self-graded success | the verdict is written by the gate, never the executor |
| A16 | card overflow | `assertCardBudget` at 3,500 tokens |
| A17 | shipped without replay | a PASS with no held-out row → VOID |
| A18 | LLM reintroduced | any `openai/anthropic/gemini/*-instruct` in the tree |
| A19 | agent loop reintroduced | a component that calls a tool on model output |
| A20 | forward extension | any drawn object with `x2 > anchor_ts` |

---

# §12 · THE BUILD SEQUENCE

| phase | exit criterion (must be able to fail) | blocked by |
|---|---|---|
| P0 INSTRUMENT | `verify-plutus` ran once · G0–G5 exist with fixture pairs · `_dead` refused · firewall rc=0 | nothing |
| P1 L0 DATA | 3 real weeks extract · a planted null returns null · a `/1000` ladder refused | the options feed |
| P2 E1 | golden week: 5 roles each with a receipt · the planted-bad zone refused | P1 |
| P3 E2 | the chain reproduces an observed sequence · a swapped pair trips `E2_CHAIN_ORDER` | P2 |
| P4 E3 | the 8 golden setups reproduce · a 2.4 RRR refused · an inverted SL/TP inverts the hit test | P3 |
| P5 REPLAY | ≥90% golden ∧ ≥90% held-out on a frozen artifact | P4 |
| P6 VERIFY | the slab → VOID · a corrupted card → G2 FAIL naming the field | P5 |
| P7 DELIVERY | the same card draws identically through paste and tab | P6 |

---

# §13 · WHAT IT INHERITS, AND WHAT IT REPLACES

```
INHERITS   the 10 laws · the 9-pillar harvest · 0-14 confluence · Pillar-9 degree
           Appendix B ZFP with the receipt · the 10-shape taxonomy · the 12 observed chains
           E3's four numbers · the anchor doctrine · the temporal boundary
           GATE A + GATE B · the 8-trades-per-week reality · 2.5 floor / 3.0 gauge

REPLACES   the PDF step            -> the card
           the agent sidecar       -> the Workflow
           the LLM's judgement     -> Clef's clauses + code composition
           the LLM reading options -> Clairic extraction with p_null
           the 15m timeframe       -> 4H/1H/30m, 1H authoritative
           the LuxAlgo dialect     -> canon vocabulary
           the width-derived ZFP   -> Appendix B base + modifiers
           the code-only E3        -> geometry in code, semantics in Clef
           hand-transcription      -> schema-validated card + kernel casts
```

---

# §14 · FILE LAYOUT (measured)

```
cf/wrangler.jsonc            22 L   7 bindings · 1 workflow · 1 DO migration
cf/migrations/0001_runs.sql  12 L   the D1 run index
cf/src/index.ts              66 L   /health /run /card /runs /ledger
cf/src/workflow/pv-week.ts  227 L   S0..S8
cf/src/do/WeekSeal.ts        38 L   exactly-once seal
cf/src/do/Ledger.ts          45 L   one row per call
cf/src/steps/clef.ts        163 L   the one door
cf/src/steps/clairic.ts     107 L   7 fields + I1..I5 + abstention
cf/src/steps/guards.ts       32 L   narrowing, no any
cf/src/e1/zfp.ts            191 L   fail-closed ZFP
cf/src/e1/build.ts          229 L   pillars → roles → attest
cf/src/e2/chain.ts          255 L   A/B/C · licensed · walk · days · alt
cf/src/e3/setups.ts         163 L   geometry · composite · 10 kills · A/B
cf/src/gate/policy.ts        27 L   calibration-sourced bars
cf/src/card/schema.ts       110 L   trident-workflow-v2 + ceiling
cf/src/cloudflare.d.ts      100 L   the binding surface, declared
cf/test/zfp-parity.ts        92 L   23 cases from the Python matrix
gates/                        9 scripts · 5 fixture pairs · 5 pins
features/F1..F5               the coverage denominator
vcards/_schema.json           budget 3,500 · cap 6,000
runtime/record.json           resumable
```

---

# §15 · RISK REGISTER

| sev | risk | mitigation | falsifier |
|---|---|---|---|
| CRIT | a model answers about an absent field | state gate resolves every path, all items | a hollow state raises `E_STATE_INCOMPLETE` |
| CRIT | a judge answers one value to everything | constant-judge control voids the call | the control fires on a stubbed judge |
| CRIT | two runs write two cards | the DO returns the existing sha | a 2nd `writeOnce` returns `created:false` |
| CRIT | the ZFP drifts from the verified Python | 23-case parity test | a changed constant fails parity |
| HIGH | a step retries and double-charges | Workflows persists step results | a re-run resumes at the failed step |
| HIGH | a policy with no sweep is used | `policy()` throws `E_UNCALIBRATED` | deleting a calibration file breaks boot |
| HIGH | a wrong label passes | G4 compares the read to the card | a corrupted card fails G2 first |
| MED | the ledger row is skipped | written inside `ask()` | no row → no call |
| MED | the card overflows the Pine field | `assertCardBudget` | a card > 3,500 throws `CARD_OVERFLOW` |
| LOW | D1 index lags the seal | the seal is the authority; the index is queryable | a sealed card with no row → `D1_INDEX_FAILED` |

---

# SUMMARY

**Bars and two rendered sources come in.** Clairic reads the options ladder out of an image into
seven typed values, and five code invariants plus a `p_null` abstention rule decide whether any of it
is admissible. Code computes the entire E1 zone map — nine pillars, clustering, 0–14 confluence, the
degree, and a ZFP whose base and six boolean modifiers are recorded in a receipt — then a Clef chain
attests that the receipt is faithful to the canon, with a planted-bad zone in the same request. E2
segments the prior week, licenses the shapes code will accept, and asks four independent clauses per
candidate plus one for new structure; code walks the transition table, assigns days, and builds the
alternative the model must endorse. E3 resolves exactly four numbers from zone edges, applies ten kill
clauses, then asks five clauses and two more. The survivors become one card, sealed exactly once by a
Durable Object, pasted into one Pine field. **Every step is a Cloudflare primitive — a Workflow
orchestrates, two Durable Objects provide exactly-once and the ledger, `env.AI` carries Clairic and
Clef, R2 holds the bytes, D1 indexes the runs, Browser Rendering does the capture — and pi-durable is
confined to the three legs Cloudflare genuinely cannot do. Nothing generates a number. Nothing
generates text. Nothing decides but code.**
