# PLUTUS VISION — THE DESIGN BLUEPRINT v2.0
## Deterministic shell + Cloudflare System One · no LLM · no agent · 60/40 by clause count

**Class:** BLUEPRINT (manufacturing design). **Status:** AUTHORITATIVE for the v2.0 build.
**Supersedes:** v1.2 (card + sidecar-as-code), and every design that assumed an LLM anywhere.
**Authority chain:** operator rulings (master spec §0, `MASTER_CONTEXT/OPERATOR_RULINGS_PV.md`)
> master spec §2 canon > cards/ > this document. This document may not contradict a higher tier;
where it extends one, it says so with an anchor.

---

## REVISION TABLE — what the operator corrected, and what it changed

| # | the correction | what changed in this design |
|---|---|---|
| 1 | "nothing works, ever, in six months" | §0.2 states the current state as UNBUILT. No section describes existing behaviour as working. |
| 2 | "hallucination is not allowed whatsoever" | §0.1. The architecture forbids an LLM at every layer; the two model classes generate no text. |
| 3 | "the sidecar is not an agent — a dynamic workflow" | §2. The orchestrator is a Cloudflare Workflow. No agent loop, no tool-calling model, no prose. |
| 4 | "run it entirely inside Cloudflare" | §2. Workers + Durable Objects + Workflows + Browser Rendering + R2 + D1. |
| 5 | "E1 is entirely code plus Clairic" | §5. Clairic supplies Class-B values only; every number in E1 is arithmetic. |
| 6 | "E2 needs Clef and Clairic together" | §6. Clef judges the semantic residue; Clairic reads the rendered frame later (§8). |
| 7 | "E3's code rejects everything; the models must decide" | §7. Code owns the geometry and the kill clauses; Clef owns the seven semantic clauses. |
| 8 | "60 code, 40 System One" | §11. Counted clause by clause: 33 code / 22 model = 60.0 / 40.0, gate-enforced. |
| 9 | "read the three bibles, then the release cards" | §6/§7/§10 apply the primitives, the chain law, the weakest-clause law, the calibration law verbatim. |

---

# §0 · THE CONSTRAINT, AND THE SPLIT IT FORCES

## §0.1 · Three physical laws, not one

```
┌────────────────────────────────────────────────────────────────────────────┐
│ L-A  PINE SCRIPT CANNOT MAKE AN HTTP REQUEST.                              │
│      Its whole external surface: request.security/economical/financial     │
│      and input.*. No fetch, no file read, no socket.                       │
├────────────────────────────────────────────────────────────────────────────┤
│ L-B  A SYSTEM ONE MODEL CANNOT REASON, COUNT, COMPUTE, OR WRITE.           │
│      It answers in one forward pass with typed values or probabilities.    │
│      It never emits prose, so it cannot hallucinate text — and it also     │
│      cannot be asked to "figure out" anything.                             │
├────────────────────────────────────────────────────────────────────────────┤
│ L-C  THE OPERATOR FORBIDS AN LLM AND FORBIDS AN AGENT AT RUNTIME.          │
│      Therefore no component may be "smart" in the LLM sense. Every         │
│      adaptive decision must be a typed question with a calibrated answer.  │
└────────────────────────────────────────────────────────────────────────────┘
```

## §0.2 · The split the three laws force

```
      ┌──────────────────────────────────────────────────────────────────┐
      │  CODE = THE MACRO SHELL                                          │
      │  every number · every bound · every branch · every side effect   │
      │  every gate · every retry · every persistence write              │
      └───────────────┬──────────────────────────────┬───────────────────┘
                      │                              │
        ┌─────────────▼─────────────┐  ┌─────────────▼─────────────────┐
        │ CLAIRIC = THE READER      │  │ CLEF = THE JUDGE              │
        │ unstructured -> typed     │  │ evidence -> probability       │
        │ value + span + p_null     │  │ over a fixed option set       │
        │ + confidence              │  │ (noul / choice / score)       │
        └───────────────────────────┘  └───────────────────────────────┘
                      │                              │
      ┌───────────────▼──────────────────────────────▼───────────────────┐
      │  CODE AGAIN: compose, threshold, veto, route, draw, journal      │
      └──────────────────────────────────────────────────────────────────┘
```

**The one-sentence architecture:** *code computes the world, Clairic reads what is not computable,
Clef judges what is not decidable, and code decides what to draw.*

## §0.3 · THE CURRENT STATE — stated as fact

```
RIG                 the Pine IDE on the agent display is the only part confirmed running.
ENGINES             e1_zfp.py (270 L), e2_engine.py (783 L), e1_fetch.py (784 L) are
                    CANDIDATES. Existence is not working. Master spec §8.2.
RENDER              the last observed frame showed a sorted price ladder, a 2-vertex line,
                    and no face B. Master spec §8.4.
CALIBRATION         never run. Master spec §15.5.
ACCEPTANCE          never run. No held-out set exists.
=> NOTHING IN THIS SYSTEM IS PROVEN. This document is a design, not a status report.
```

---

# §1 · THE STACK

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ L4  VERIFY     pixel gate (C01-C20) · Clairic label read · Clef judge ·      │
│                the known-bad control · the 10-week replay                    │
├──────────────────────────────────────────────────────────────────────────────┤
│ L3  RENDER     the Pine kernel: standalone engine + card caster + draw order │
├──────────────────────────────────────────────────────────────────────────────┤
│ L2  CARD       one JSON document per pair per week; the only thing that      │
│                crosses the boundary into Pine                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│ L1  COMPUTE    E1 · E2 · E3 · gate · compose — a Cloudflare Workflow         │
├──────────────────────────────────────────────────────────────────────────────┤
│ L0  DATA       bars 4H/1H/30m · FX options expiry (image) · red-folder       │
│                calendar · DXY                                                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Dependency direction: one way.** L0 feeds L1, L1 emits L2, L2 feeds L3, L3 is judged by L4.
Nothing reads upward. E1 never reads E2; E2 never reads E3 (master spec §7.4).

---

# §2 · THE MACRO ARCHITECTURE — the Cloudflare workflow

## §2.1 · Why a Workflow and not an agent

An agent decides what to do next. This pipeline never does: every step is fixed, typed, and
retried by the platform. The only adaptivity is inside a Clef question, and a question cannot
call a tool, write a file, or choose a step.

## §2.2 · The step contract — every step, typed, keyed, retried

| # | step | consumes | produces | idempotency key | on failure |
|---|---|---|---|---|---|
| S0 | `arm` | `{pair, week}` | run row (D1), anchor ms, freeze check | `run:{pair}:{week}:S0` | fail closed; no run |
| S1 | `harvest` | bars source | `bars/{pair}/{tf}/{week}.json` (R2) | sha256(payload) | retry ×3, then HALT |
| S2 | `capture.options` | the Investing Live URL | `captures/{week}/options.png` (R2) | sha256(png) | retry ×3, then FATAL `W2_CAPTURE_EMPTY` |
| S3 | `extract.options` | the PNG + field schema | `walls.json` (+p_null, spans) | sha(png)+schema_v | retry ×2, then FATAL `W2_*` |
| S4 | `capture.calendar` | calendar URL | `captures/{week}/calendar.png` | sha256(png) | retry ×2, then FATAL `W3_CAPTURE_EMPTY` |
| S5 | `extract.calendar` | the PNG + field schema | `events.json` | sha(png)+schema_v | retry ×2, then FATAL `W3_*` |
| S6 | `e1.compute` | bars + walls + events | `zone_map.json` (every number) | sha(inputs)+engine_v | HALT (no zone map) |
| S7 | `e2.chain` | zone_map + bars | `chain.json` (7 Clef answers composed) | sha(zone_map)+chain_v | HALT (no chain) |
| S8 | `e3.setups` | chain + zone_map | `setups.json` (geometry + 7 answers) | sha(chain)+setup_v | HALT (no setups) |
| S9 | `gate` | setups + zone_map | `gated.json` (survivors + refusals) | sha(setups)+gate_v | HALT |
| S10 | `seal` | the card | one write at `week:{pair}:{week}` | DO key | refuse a second write |
| S11 | `emit` | sealed card | `cards/{week}/{pair}.json` (R2) + ledger row (D1) | sha(card) | retry ×3 |

**The seal is the exactly-once point.** A Durable Object named `week:{pair}:{week}` holds the
card; `blockConcurrencyWhile` serialises the write; a second attempt returns the existing sha
rather than overwriting. This is the "one report per week" invariant (ARCH-INVARIANTS #6),
implemented as storage rather than as discipline.

**Why not a DO for the whole run:** a workflow step can run for minutes and needs retries and
observability; a DO is for the one thing that must be serialised. Each component does its job.

**pi-durable:** the escape hatch for the capture leg only, if Browser Rendering is blocked by a
login or an anti-bot wall. It runs the SAME step contract and writes to the SAME R2 keys. It is
not a second architecture, and it may not be used for E1/E2/E3.

## §2.3 · The model lanes

```
E1   Clairic  @cf/cloudflare/clairic     4 calls   $0.10/M input   images yes
E2   Clef     @cf/cloudflare/clef        1 call    $0.24/M input   27B, 64 questions
E3   Clef     @cf/cloudflare/clef        1 call    $0.24/M input
L4   Clef-flash + Clairic                4-8 calls $0.038/M       38.8 ms median
```

**Measured facts the design depends on** (model cards, this turn):

```
clairic    65,536 ctx · 4 images (4 MiB each, 8 MiB total, body 16 MiB) · no remote URLs
            per-pass field packing 8,192 tokens; extra fields split into parallel passes
            every scalar: value + p_null + confidence (+ span for text) · estimate: p10/p50/p90
            preview: 1-2 step arithmetic reliable; long chains NOT · confidence != correctness
clef       65,536 ctx · 64 questions max · 4 images · 1,024 tokens per image cap
            noul -> one probability · choice -> distribution + confidence · score -> weighted
            median 209.3 ms, p95 238.6 ms
clef-flash 24,576 ctx · same schema · median 38.8 ms · $0.038/M
```

**Two consequences that shape the design:**

1. **64 questions is the batching ceiling, and the trade-count rule is 8 per week per pair.**
   8 setups × 7 questions = 56 ≤ 64. The operator's cap and the model's cap align: one E3
   request, no loop. The design does not fight the limit; it uses it as the candidate cap.
2. **Clairic's 8,192-token per-pass packing means fields split across passes.** The option
   ladder is asked as parallel lists (strikes, notionals, OI), not as a repeated object per
   strike. A per-strike object with 8 fields would split awkwardly and lose index alignment.

---

# §3 · THE PROCESS IT PRESERVES — the same three steps, none of them manual

```
   v1 (manual)                    v2.0 (this design)
   ────────────────────────       ─────────────────────────────────────────────
   ① a prompt to an agent         ① a Cloudflare Workflow: fixed steps, typed I/O
   ② a PDF read by eye            ② a card: schema-validated JSON per week
   ③ hand-transcribed to Pine     ③ a Pine kernel that parses and casts the card

   SAME THREE STEPS. Step ① is no longer prose, ② is no longer a PDF, ③ is no
   longer a transcription.
```

**What the PDF had to get right is now a field the card must carry** — the zone table, the
confluence arithmetic, the ZFP receipt, the setup geometry — checked by schema and by gate
rather than by eye (R-01: the PDF step is removed; the prompt becomes code).

---

# §4 · L0 — THE DATA PLANE, AND THE CLAIRIC CONTRACT

## §4.1 · What comes from bars, and what cannot

```
FROM BARS (code, deterministic)
  4H/1H/30m OHLC · swings · EMAs · round numbers · order blocks · FVG · BOS
  · equal highs/lows · session extremes · ATR · ROC · the ladder

NOT FROM BARS (Clairic, typed, with provenance)
  the FX options expiry ladder · the expiry dates and cut times
  · the red-folder calendar · analyst/prose levels
```

**One-write law:** the option ladder is captured and extracted ONCE per week, before the London
open, and never again. Re-reading mid-week lets the value drift under the analysis (v1.2 §4).

## §4.2 · The option-ladder field schema — exact

```jsonc
{
  "state": "FX options expiry ladder for <PAIR>, week of <DATE>. Read the printed strikes, the
            notional in BILLIONS, open interest, the expiry date and the NY cut time.",
  "images": ["<png bytes, embedded>"],
  "reference_date": "<week start, ISO>",
  "fields": {
    "pair":         { "type": "text" },
    "expiry_date":  { "type": "date",   "instructions": "the expiry this ladder belongs to" },
    "cut_time":     { "type": "time",   "instructions": "the NY cut time printed on the page" },
    "strikes":      { "type": "list", "items": "number", "decimals": 4,
                      "instructions": "every strike printed, ascending" },
    "notionals_b":  { "type": "list", "items": "number", "decimals": 2,
                      "instructions": "notional in BILLIONS, same order as strikes" },
    "open_interest":{ "type": "list", "items": "number", "integer": true,
                      "instructions": "OI per strike if printed, else null" },
    "printed_total_b": { "type": "estimate", "min": 0, "max": 500, "step": 0.1,
                      "instructions": "the printed total for the week, if present" }
  }
}
```

## §4.3 · The five code invariants — what makes a wrong read inadmissible

```
I1  ALIGNMENT      len(strikes) == len(notionals_b) == len(open_interest)
                   mismatch -> the whole extraction is INCONCLUSIVE. Never zip by guess.
I2  UNITS          every notional in (0, 500). The ladder is already in BILLIONS.
                   A value / 1000 is the documented Illusion 6 — rejected by predicate.
I3  DOMAIN         every strike within +/-15% of spot. Outside -> that strike is DROPPED
                   and logged. The value is never clipped into range.
I4  WINDOW         expiry_date inside the target week AND cut_time <= Friday 16:00 NY.
                   Outside -> the wall exists but applies NO modifier this week.
I5  CONSISTENCY    printed_total_b, when present, equals sum(notionals_b) within 2%.
                   Outside -> every wall from this capture is DROPPED.
```

**The abstention rule (the anti-fabrication core):**

```
p_null > 0.05 on a strike        -> that wall is dropped and journaled
p_null > 0.50 on any field       -> the field is INCONCLUSIVE
any INVARIANT failure            -> the extraction is INCONCLUSIVE
INCONCLUSIVE is a first-class outcome. It never becomes a zero, a default, or a guess.
```

**Why `value: null` matters:** Clairic returns null when the input does not determine the value,
with `guess` showing what it would otherwise have picked. Code must never read `guess`. The
`guess` field exists so a human can audit the model; it is not a fallback.

## §4.4 · The calendar schema

```jsonc
{ "fields": {
    "events":      { "type": "list", "items": "text",
                     "instructions": "each event name, in date order" },
    "event_dates": { "type": "list", "items": "date", "instructions": "same order as events" },
    "importance":  { "type": "list", "items": "text",
                     "instructions": "high / medium / low as printed, same order" },
    "currency":    { "type": "list", "items": "text",
                     "instructions": "currency code, same order" } } }
```

Invariants: equal lengths; dates parse; only `importance == high` and
`currency in {USD, EUR, GBP, AUD}` produce a red-folder modifier; the event must fall inside the
target week. A red-folder event on a day E2 assigns a continuation becomes E2-M4's subject.

## §4.5 · Prose levels (analyst calls, desk notes)

A `list` of numbers with a `text` field for the source phrase. Every level carries its span, so
it can be highlighted in the source image. A level with `p_null > 0.05` is dropped; a level
outside ±15% of spot is dropped.

## §4.6 · THE FAILURE CONTRACT — NO FALLBACK, EVER

**There is no degradation path. An absent input is a named, fatal error.** The run does not
substitute a weaker object, a default tier, a proxy value, or a partial card. It stops, writes
the error code and the missing key into the ledger, and exits non-zero.

```
ABSENT / MALFORMED INPUT          -> FATAL. The workflow stops. No card is written.
INVARIANT VIOLATED                -> FATAL. No card.
JUDGE UNREACHABLE                 -> FATAL. No chain. No card.
JUDGE ANSWER MALFORMED            -> FATAL. No chain. No card.
CLAMP FIRED                       -> WARNING. Raw and clamped recorded; the run continues.
ZFP CROSS-CHECK CONFLICT          -> FINDING. Both numbers printed; a human adjudicates.
ZERO VALID SETUPS                 -> RESULT. The card records count 0 and the token.
SETUP KILLED BY A KILL CLAUSE     -> RESULT. The ledger records the clause; nothing emitted.
```

```
options capture fails            -> W2_CAPTURE_EMPTY / W2_I1..I5          STOP
calendar fails                   -> W3_*                                   STOP
4H bars short                    -> W1_4H_SHORT                           STOP
Clairic returns null on a field  -> W2_INCONCLUSIVE:<field>                STOP
Clef unreachable                 -> E2_JUDGE_DOWN / E3_JUDGE_DOWN          STOP
zone has no receipt              -> E1_NO_RECEIPT                         STOP
ZFP cannot be computed           -> ZFP_INPUT_MISSING:<key>                STOP
chain empty after vetoes         -> E2_ALL_FALSIFIED                       STOP
Pine card absent                 -> CARD: ABSENT — FACE A OMITTED          RENDER, no face A
```

The last row is not a fallback: the indicator is a standalone engine by design (v1.2 §0), and an
absent card means face A does not exist. It prints the absence. It never invents a zone.

**The distinction that matters:** a *legitimate empty result* (a week with no valid setup) is
reported as a result. A *missing input* is never converted into a result. That is the whole law.

# §5 · L1 · E1 — THE ZONES (code + Clairic only)

## §5.1 · What E1 answers

*Where are the walls, how strong is each one, which are real, and how likely is each to fail?*
It answers with a zone table. It never answers when price arrives (E2) or what to trade (E3).

## §5.2 · The pipeline, clause by clause

```
E1-C1  ANCHOR        Monday 09:00 London from the prior Friday's freeze; left edge -7 days;
                     right edge = anchor; no forward extension.
E1-C2  PILLARS       the 9-pillar harvest (round, EMA200, weekly swing, 4H OB, daily liquidity,
                     cluster, intraday swing, minor, institutional pressure) + 5 auxiliaries.
E1-C3  CLUSTER       levels within 0.004 (DXY) merge; each cluster records mid/top/bottom/width
                     and the pillars it absorbed.
E1-C4  CONFLUENCE    the 0-14 score: 1 per pillar in-zone + 0.5 per auxiliary (cap 1.0)
                     + extreme bonus (+2 weekly / +1 daily) - 1 if mitigated.
E1-C5  DEGREE        the Pillar-9 table: 12-14 EXTREME, 10-11 HEAVY, 8-9 MODERATE-HEAVY,
                     6-7 MODERATE, 4-5 LIGHT, 0-3 MINIMAL.
E1-C6  ZFP BASE      Appendix B.1 base point by tier: Hard 10, Standard 22.5, Ghost 30,
                     Soft 40, One-Touch 60, LSZ SPECIAL.
E1-C7  MODIFIERS     six boolean gates at fixed points: expiry +25, macro +20, momentum +15,
                     cross-pair +20, cascade +25, regime +20.
E1-C8  CLAMP+RECEIPT clamp(base + sum, 0, 99); emit base, applied[], declined[] with each
                     failed gate, raw, clamped, pillar9_bucket, cross_check.
E1-C9  ROLES         the five IP roles assigned by POSITION in the operating range, never by
                     price order: ceiling, upper resistance, equilibrium, mid-range support,
                     key support band.
E1-C10 RANGE         the operating range and the window; the left extension is the only look-back.
E1-C11 FACE B        order blocks (4H->1H), FVG double boxes, BOS, equal highs/lows.
E1-C12 LQZ           the rails (#3E8A46 demand below, #7F3613 supply above) + the mitigation
                     counter Unmitigated -> 1x -> 2x -> 3x.
E1-C13 BOM/MOM       each zone classified origin or continuation.
E1-C14 POI TIER      tier 1/2/3 by 4H overlap; a zone with no 4H overlap is not tier 1.
E1-C15 ISOLATION     every pair runs on its own data. DXY->pair mathematical conversion is
                     forbidden (ARCH-INVARIANTS #3).
```

## §5.3 · What Clairic may source inside E1 — and nothing else

```
E1-M1  the option ladder        -> strikes, notionals_b, open_interest   (schema §4.2)
E1-M2  the expiry timing        -> expiry_date, cut_time
E1-M3  the red-folder calendar  -> events, dates, importance, currency
E1-M4  analyst/prose levels     -> levels with spans
```

**Clairic never assigns a role, never scores confluence, never computes a ZFP, never picks a
zone.** Those are arithmetic. A Clairic answer that looks like a judgement is a schema error.

## §5.4 · The ZFP receipt is the anti-fabrication artifact

```jsonc
{ "zfp": 28, "tier": "Standard Wall", "base": 22.5,
  "modifiers_applied":  [{"name":"momentum","value":15,
                          "gate":"abs(ROC5)=0.42 > 0.5*ATR20=0.31, directed at zone"}],
  "modifiers_declined": [{"name":"expiry","gate":"no expiry this week"}, ...],
  "raw": 37.5, "clamped": 37.5,
  "pillar9_bucket": "MODERATE-HEAVY 20-35%", "cross_check": "consistency" }
```

**Both halves are mandatory.** Declined modifiers carry the gate that declined them. A ZFP
printed without its receipt is invalid regardless of how plausible it looks (master spec §4.6).

## §5.5 · ZFP calibration is a precondition, not a follow-up

```
dataset      84 fixture weeks · 41,546 1H bars (2025-03 -> 2026-07)
procedure    per week: derive zones from bars BEFORE the lock -> compute ZFP with the receipt
             -> did price close through the zone during the week?
report       bucket | predicted | observed | n   (n < 8 = UNREPORTABLE, never dropped)
tolerance    +/-15 percentage points per bucket, decided BEFORE the run
failure      flat / inverse / bimodal / identical buckets -> P1 does not open
```

**Why it gates everything:** §6's matrix is a ZFP-threshold matrix. A miscalibrated ZFP puts a
zone on the wrong side of every threshold, and nothing downstream can see it (master spec §4.8).

---

# §6 · L2 · E2 — THE SHAPE CHAIN (Clef + Clairic + code)

## §6.1 · E2's answer

*What path will price take through those walls, and on which day?* Derived from E1. Never
free-written.

## §6.2 · Code narrows before Clef sees anything (the state law)

```
STEP 1  segment the prior week's 1H bars into candidate spans (structure-based, not fitted)
STEP 2  attach each candidate's anatomy: candle count, body fraction, range ratio,
        wick profile, colour sequence, start/end zone ids
STEP 3  attach the TARGET zone's ZFP and the band it falls in
STEP 4  rank candidates by the ZFP-conditioned priority table; KEEP AT MOST 8
STEP 5  freeze the state (below) and send ONE Clef request with 7 questions per candidate
```

**Why 8:** a chain is capped at 5 shapes and keeps at least one alternative; 8 candidates ×
7 questions = 56 ≤ 64 questions, so the whole E2 judgement is ONE request. Batching is not an
optimization here; it is the contract (bible §6.5.1).

## §6.3 · The E2 state — evidence only, no instructions

```jsonc
{ "week":"2026-07-06", "pair":"DXY",
  "zone_map":[{"id":"z-eq","role":"EQUILIBRIUM ZONE","top":...,"bottom":...,
               "confluence":9,"degree":"MODERATE-HEAVY","zfp":20,"reaction_count":2,
               "bom_mom":"MoM","poi_tier":2,"tested":true}],
  "candidates":[{"id":"c1","claimed_shape":"BS","start":"...","end":"...",
                 "direction":"UP","target_zone":"z-ur",
                 "anatomy":{"candles":6,"body_frac":0.72,"range_ratio":3.4,
                            "wick_thrust":0.11,"colour":"dominant-up"},
                 "prev_shape":"c0"}],
  "shape_definitions":{"SS":{...},"BS":{...},"R":{...},"WL":{...},"WLS":{...},
                       "PBS":{...},"RS":{...},"RWL":{...},"PWL":{...},"PRWL":{...}},
  "zf_bands":[{"band":"<20","meaning":"Hard Wall"},{"band":"20-40","meaning":"mid-range"},
              {"band":">45","meaning":"fails"},{"band":">60","meaning":"cascade"},
              {"band":">80","meaning":"strong cascade"}],
  "generated_chain":["c0","c1","c2"],
  "energy_budget":{"weekly_range":...,"atr20":...,"leg_budget":...},
  "calendar_days":{"Mon":"continuation","Tue":"new_shape", "..." : "..."} }
```

## §6.4 · The seven questions — verbatim, with criteria

Each is one snap judgment, ≤60 words, observable in the state, and blind to the others.

| id | type | instruction (verbatim) | criteria |
|---|---|---|---|
| E2-A1 | noul | "Does `candidate.anatomy` satisfy every candle clause of `shape_definitions[candidate.claimed_shape]` — candle count, body fraction, range ratio, wick profile, colour sequence?" | true = every clause sits inside its stated bounds; false = at least one clause is outside |
| E2-A3 | noul | "Does `candidate.direction` agree with the side of `zone_map[candidate.target_zone].role` — long into support, short into resistance?" | true = the role opposes the direction; false = same-side or neutral |
| E2-A4 | noul | "Does `candidate` continue from `candidate.prev_shape` with no time gap, no overlap, and no re-entry into a zone this chain already traversed?" | true = contiguous and non-repeating; false = otherwise |
| E2-A5 | noul | "Do the 1H closes inside `candidate.span` stay inside that span's high and low for at least 80% of its bars?" | true = the closes stay inside; false = the span is drawn around price rather than through it |
| E2-A6 | noul | "Does `candidate` represent new structure rather than a failed attempt at `candidate.prev_shape` — that is, did price fail to break the previous shape's origin zone?" | true = the origin held and the structure is new; false = the previous origin broke |
| E2-B1 | noul | "Is `alternative.decision_zone` the zone whose failure or hold would most change the week's path, given every zone's confluence, degree and ZFP in `zone_map`?" | true = this is the zone the week hinges on; false = another zone matters more |
| E2-B2 | score | "How completely does the proposed chain conserve its energy budget?" | 0 broken — a leg exceeds the weekly range budget · 1 significant leak — two legs overshoot their measured move · 2 minor leak — one leg overshoots by under 20% · 3 on-contract — every leg lands inside its measured move |

**What code does with each candidate** (the composition law):

```
per candidate:  anatomy_ok = E2-A1   direction_ok = E2-A3   contiguity_ok = E2-A4
                traces_ok  = E2-A5   new_structure_ok = E2-A6
                viable = min(all five) >= act_candidate
chain:          overall = min(viable candidates)
alternative:    B1 (decision-zone adequacy) gates the ALTERNATIVE, not the chain:
                below the flag -> the alternative is recomputed on the next-nearest
                boundary zone; a second failure -> RAISE E2_ALTERNATIVE_INVALID
veto:           E2-B2 <= 1  -> the last leg is dropped and the chain is re-scored once
route:          overall >= act_e2   -> ACCEPT
                flag_e2 <= x < act  -> SHADOW (logged, not drawn)
                x < flag_e2         -> DISCARD the leg
```

**The weakest-clause law:** a chain is never an average. One failing clause kills the leg
(RE-6, bible §6.15).

## §6.5 · The phase boundary — why the chain is not one big question

Clef questions are evaluated in parallel and are blind to each other (bible IL-06). So a question
whose answer depends on another answer must be a second request. The design has exactly two:
**E2 request → code composes → E3 request.** There is no third, and no question may reference
another question's id.

## §6.6 · Code's seven clauses in E2 (the deterministic constraints)

```
E2-C1  candidate span segmentation (structure, not least-squares)
E2-C2  the priority + transition tables (one lookup procedure, two tables)
E2-C3  the chain walk: max 5, terminate below 25% cumulative confidence,
       NEVER extend past a Hard Wall
E2-C4  the ORDERING invariant: strictly increasing starts, no repeats, no past-wall link
       (this is code's, NOT a model question — see the note below)
E2-C5  the day skeleton: five days, each with shape/direction/key zone/trigger
E2-C6  confidence composition: min(), never mean; the weakest link is printed
E2-C7  the alternative chain: one decision zone + the ZFP threshold that flips the path
```

**WHY B1 CHANGED (v2.0 → v2.1, from the adversarial audit).** v2.0 asked the model to confirm
that the chain it received was ordered by the ZFP table. Code had just ordered it with that table,
so the question could only be answered yes — a check that cannot fail. It was replaced with a
question code genuinely cannot answer (which zone the week hinges on), and the ordering check
became the code invariant E2-C4 with a mutation that must fire on a swapped pair.

**E2-C7 is what makes the chain falsifiable.** A prediction with no stated alternative cannot be
wrong, and a prediction that cannot be wrong is not a prediction (master spec §5.5 Step 4).

---

# §7 · L3 · E3 — THE TRADE SETUPS (Clef + Clairic + code)

## §7.1 · The division of authority — stated once

```
E3 is NOT a trade generator. It is a classification + precision-alignment engine.
It consumes E1's zones and E2's day designations and resolves EXACTLY FOUR NUMBERS:
entry, SL, TP, RRR. Everything else is CITED, never invented.  (cards/E3-CONTRACT.md)
```

## §7.2 · Code's nine clauses — geometry and kill

```
E3-C1  SETUP UNIVERSE  the 12-row matrix licenses which setup types and which TF stack a
                       shape day admits (SS -> scalp stack, BS -> swing stack, ...)
E3-C2  ENTRY           at the EDGE of a 1H/30m/15m LQZ or S/D zone.
                       NEVER a 4H edge. NEVER a shape vertex. NEVER a 4H edge.
E3-C3  SL              the OPPOSITE edge of that zone +/- a 2-5 pip buffer
E3-C4  TP              the nearest opposing zone on the entry side (Law-14 walk)
E3-C5  RRR             |TP-entry| / |entry-SL|; hard reject < 2.5; 3.0 is the gauge
E3-C6  CONFIDENCE      the 0-100 composite (below) + tier
E3-C7  COUNT           8 per week per pair; 1-3 per day; evict the weakest, never reject a
                       stronger newcomer
E3-C8  DEDUPE          identity = (anchor zone id, direction, day); a second setup on the same
                       identity is a duplicate unless its RRR differs by >30%
E3-C9  HIT TEST        walk the week forward; first touch decides; a bar touching both = LOSS;
                       post-Friday = UNRESOLVED, reported separately
```

**The confidence composite (operator-ruled 2026-10-22, authoritative as written):**

```
confidence = Base (confluence/12) x 40
           + Option (notional_b / 3.5) x 20
           + Shape 20
           + RedFolder 10
           + ZFP (1 - ZFP%) x 10
           + BoM/MoM +/- 10
           ---------------------------------
             max 110, capped 100, inclusion gate 65

GOD_TIER   conf >= 90  AND rrr >= 3.0  -> YES, full position
HIGH       conf >= 80  AND rrr >= 2.5  -> YES, standard position
STANDARD   conf 65-79  AND rrr >= 2.0  -> calibration visibility only, never emitted
CONDITIONAL / REJECTED                 -> DELETED
```

**The RRR ruling, reconciled (cards/E3-RRR-RULING.md):** 3.0 is the gauge, 2.5 is the hard
floor. Anything under 2.5 is rejected outright, including 2.4. A 2.5-2.9 setup is accepted only
when its probability is high; a 2.7 high-probability setup is never rejected for being under 3.0.

## §7.3 · The seven questions — verbatim

| id | type | instruction (verbatim) | criteria |
|---|---|---|---|
| E3-1 | noul | "Is `setup.entry_anchor` the same structural element as `setup.e2_day_anchor` — same zone id, same edge, same 1H or 30m or 15m timeframe?" | true = identical zone, edge and timeframe; false = any of the three differs |
| E3-2 | noul | "Would `setup.sl` be taken out by the structure that created this setup before the entry fills — that is, is the SL inside that zone's noise band?" | true = the structure sits beyond the SL; false = the SL is inside the noise |
| E3-3 | noul | "Is `setup.tp` the nearest opposing zone that `e2_chain.path` must traverse before Friday close?" | true = nearest opposing on the path; false = a farther zone or one off the path |
| E3-4 | noul | "Does `setup.direction` agree with `e2_chain.day[setup.day].direction`?" | true = agree; false = disagree |
| E3-5 | noul | "Is this setup materially the same as any setup in `existing_setups` — same anchor family, same direction, and a target within 30% of the same RRR?" | true = duplicate; false = distinct |
| E3-6 | noul | "Does `zone_map[setup.entry_zone].role` make this a valid reaction point for `setup.category` — support for a long in consolidation, resistance for a short in a reversal?" | true = valid for the category; false = not |
| E3-7 | score | "How high-probability is this setup given its confluence, degree, ZFP and the E2 path?" | 0 rejected — a kill clause would fire · 1 weak — geometry passes but the path is ambiguous · 2 standard — geometry and path both hold · 3 high — geometry, path and zone quality align · 4 god — all of the above plus an untested opposing zone as TP |

## §7.4 · Composition — code owns every branch

```
noul_fail(i) = p_i < 0.5                      (a clause is a vote, not a weight)
p_setup      = min(p_i for every required noul)  <- the weakest clause
veto         = (p_E3-2 < 0.8)  the SL would be taken out
             or (p_E3-5 > 0.8)  a duplicate
             or (E3-7 < 2)      weak probability
route        = EMIT     if p_setup >= act_e3 and not veto
               HOLD     if flag_e3 <= p_setup < act_e3   (logged, never drawn)
               DISCARD  otherwise
```

**The score primitive is read as a level, not multiplied into the probability.** E3-7 is a
rubric; its `score` is the probability-weighted level. Multiplying it by a noul would produce a
number with no meaning.

## §7.5 · The count rule and the universe

```
per week per pair   maximum 8 setups on 1H (operator R-07: "maximum of eight trades per pair")
per day             1-3, usually 1-2
12-row universe     SS 4-8 scalps · SS(DWL) 4-8+1-2 · BS 1+2-3 · PBS 1+2-3 · R 2-4
                    · RS 1 · WL 1 · RWL 1 · PWL 1 · PRWL 1+1-2 · WLS 4-8+1-2
                    · SS->BS 1+reinforcements
```

**A week with 27 setups is not a productive week; it is a fabricated one.** The cap is code, and
the confidence gate removes the weak tail before the cap is even consulted.

---

# §8 · L4 · COMPOSE, VERIFY, AND THE CONTROL

## §8.1 · The ladder and eviction

```
p >= act       ACT      -> drawn
flag<=p<act    HOLD     -> in the card as CONDITIONAL_LOGGED, never drawn
p < flag       NO-OP    -> discarded; the weakest clause is named in the ledger
new setup outranks an emitted one -> the weaker is EVICTED (card records evicted_by)
```

## §8.2 · The six verification gates

| gate | subject | decides |
|---|---|---|
| G0 DOCTOR | the rig | is this the right build, on a port we own, serving the right fixture? |
| G1 ARITHMETIC | the frame | 20 pixel checks: candle geometry, largest fill %, band coverage, hue families (BUILT: `scripts/chart_validator.py`) |
| G2 STRUCTURAL | the card + the .pine | ZFP receipts present; ancestry resolves; no stub; no literal price in a draw call |
| G3 SEMANTIC | the card | `mandate_met` and `claim_contradicted` (Clef noul) — did the turn do what it claimed? |
| G4 PERCEPTION | the frame | Clairic reads the labels/values; code compares to the card. The model reads; the code decides. |
| G5 AGREEMENT+CONTROL | all verdicts | disagreement = INCONCLUSIVE; a known-bad subject that passes = VOID |

**G4 is the answer to "pixels cannot be compared to a card."** Clairic extracts
`zfp_labels[]`, `tier_labels[]`, `zone_count`, `box_count`, `line_count`, `entry_labels[]` from
the frame as typed values with `p_null`; code does the string and count comparison. The model
never decides pass/fail; it reports what it read.

## §8.3 · The control — the gate that proves the gate can see

```
every run pushes TWO subjects:
   the frame under test
   a GENERATED known-bad frame (no candles, one solid slab)
G4 must answer zone_count 0 / no bands on the slab.
G3 must answer claim_contradicted HIGH when the claim says "delivered".
if either says the slab is a chart:
   VOID — every verdict in the run is discarded, and the GATE is repaired before a re-run.
```

**A judge that cannot see agrees with everything.** This is the failure that made six weeks of
"verified" meaningless (BUILD_WORKFLOW_v2 §3.3).

## §8.4 · The verdict algebra

```
any G1/G2 critical ................. FAIL
p(claim_contradicted) >= act ....... FAIL
p(mandate_met) < act ............... FAIL
G1..G4 disagree .................... INCONCLUSIVE (never a pass)
the control passes ................. VOID
all agree, all above act ........... PASS
```

---

# §9 · THE CARD, AND THE TWO DELIVERY PATHS

## §9.1 · The card — `trident-workflow-v2`

```jsonc
{ "schema":"trident-workflow-v2",
  "meta":{"week":"2026-07-06","pair":"DXY","anchor_ms":...,
          "sources":{"bars_4h":"sha:...","bars_1h":"sha:...","options":"sha:...",
                     "calendar":"sha:...","ledger_run":"..."},
          "absent":["OPTIONS:ABSENT"], "engine":"e1@2.0/e2@2.0/e3@2.0"},
  "nodes":[
    {"id":"z-eq","kind":"zone.ip","spec":{"role":"EQUILIBRIUM ZONE","tf":"1H",
      "top":...,"bottom":...,"confluence":9,"degree":"MODERATE-HEAVY","tier":2,
      "zfp":20,"receipt":{"base":22.5,"applied":[...],"declined":[...],"clamped":42.5,
                          "pillar9_bucket":"MODERATE-HEAVY 20-35%"}}},
    {"id":"s-1","kind":"shape.span","spec":{"shape":"BS","from":"z-eq","to":"z-ur",
      "start":"...","end":"...","zfp_band":"<20","confidence":0.71,
      "clef":{"E2-A1":0.93,"E2-A3":0.88,"E2-A4":0.97,"E2-A5":0.91,"E2-A6":0.84,
              "E2-B1":0.90,"E2-B2":3}}},
    {"id":"t-1","kind":"setup.trade","spec":{"dir":"LONG","entry":...,"sl":...,"tp":...,
      "rrr":3.07,"tier":"HIGH","confidence":86,"category":"RWL","day":"Mon",
      "session":"London","entry_zone":"z-ksb","shape_from":"s-1",
      "clef":{"E3-1":0.97,"E3-2":0.06,"E3-3":0.91,"E3-4":0.95,"E3-5":0.08,
              "E3-6":0.93,"E3-7":3}}}],
  "edges":[{"from":"t-1","to":"z-ksb","kind":"enters_at"},
           {"from":"t-1","to":"s-1","kind":"derived_from"}],
  "refusals":[{"setup":"t-9","token":"[PV RRR-BELOW-FLOOR]","detail":"2.31 < 2.5"}],
  "count":{"emitted":6,"ceiling":8,"evicted":1},
  "journal_seed":{"run":"pv-2026-07-06-DXY"}}
```

## §9.2 · The provenance rule — the anti-fabrication mechanism

```
EVERY Class-B VALUE CARRIES:
  value · confidence · p_null · and a span (text) or bounds (number/estimate)
EVERY MODEL ANSWER CARRIES:
  the question id · the probability (or score) · the model id · the chain version
NOTHING CARRIES:
  a shape, a span, or a setup inside `provenance`  -> that is a baked payload
```

**Why:** a shape or a setup supplied by the card would mean the indicator displays a
classification of bars it can classify itself; the no-card degradation would become impossible,
and a wrong card would be indistinguishable from a wrong engine.

## §9.3 · Delivery A — the paste (ships first)

```
1  TradingView -> the indicator -> Settings
2  ONE field: "Week Card"
3  paste the card (one JSON document)
4  the chart re-renders. No code edit, no recompile, no script swap.

the script is written ONCE. The card is data; Pine parses it at runtime.
a card that fails to parse draws the standalone layer and prints CARD: ABSENT — PARSE FAILED.
```

## §9.4 · Delivery B — the dashboard tab (phase 2)

The existing Plutus shell registers a tab; `control.mjs` serves `GET /card`, `GET /render`,
`POST /cast`. **The tab draws; the control surface computes.** One engine, one truth, so a human
clicking and a workflow writing cannot diverge. The card does not change when delivery does.

---

# §10 · THE CALIBRATION PROTOCOL (thresholds are derived, never chosen)

```
1  LABEL       the golden week (8 signed EU setups) + the 84 fixture weeks (ZFP breaks)
               + 20 G4 frame pairs (clean / corrupt)
2  RUN         every chain over every labelled item; record per-question probabilities
3  SWEEP       act over 0.50 / 0.60 / 0.70 / 0.80 / 0.90; precision and recall at each
4  READ        maximum and spread.  max < 0.5 -> THE QUESTION is broken, rewrite it.
                                   spread < 0.25 -> the question does not discriminate.
5  CONTROL     positive >= 0.85, negative <= 0.15 on every arm. Near 0.5 on both = dead judge.
6  COST MATRIX false-allow is the expensive cell. Choose the bar with false-allow = 0,
               then maximise recall.
7  RECORD      the bar, the control set, the sweep table, the date, the model id, in
               `calibration/e2.json` / `e3.json` / `g4.json`
8  SHADOW      one full week in shadow: routes nothing, logs "would have routed X"
9  ARM         only after 8, and only if the shadow rows agree with the labels
```

**Never arm a chain whose thresholds are not in a calibration file.** A threshold with no
control set behind it is a copied number (bible IL-07).

---

# §11 · THE 60/40 ACCOUNTING — counted, not asserted

**A clause is one decision that can change the emitted content or refuse it.** Pure I/O is not a
clause. The registry is `clauses.json`; the gate counts it and fails outside 60±2 / 40±2.

```
CODE — 33 clauses
  E1  15  T1 anchor · T2 pillars · T3 clustering · T4 confluence · T5 degree
          T6 ZFP base · T7 modifier gates · T8 clamp+receipt · T9 roles · T10 range
          T11 OB/FVG/BOS · T12 LQZ+mitigation · T13 BoM/MoM · T14 POI tier · T15 isolation
  E2   7  C1 spans · C2 priority+transitions · C3 chain walk · C4 ordering invariant
          C5 day skeleton · C6 confidence compose · C7 alternative chain
  E3   9  C1 universe · C2 entry · C3 SL · C4 TP · C5 RRR+floor · C6 confidence+tier
          C7 count+eviction · C8 dedupe · C9 hit test
  L4   2  V1 gate algebra+control · V2 replay scoring

MODEL — 22 clauses
  E1   4  Clairic M1 option ladder · M2 expiry/cut · M3 calendar · M4 prose levels
  E2   7  Clef A1 anatomy · A3 role/direction · A4 contiguity · A5 traces price
          A6 new structure · B1 decision-zone adequacy · B2 energy score
  E3   7  Clef 1 anchor identity · 2 SL survivability · 3 TP path · 4 day agreement
          5 duplicate · 6 reaction validity · 7 probability score
  L4   4  Clef/Clairic band read · box read · line read · claim_contradicted

TOTAL 55 clauses · code 33 (60.0%) · model 22 (40.0%)
```

**The graduation rule:** if E2-A5 or E3-5 prove computable in code after calibration, they move
to code and the ratio moves to 64/36. The registry records the move; the design does not pretend
the ratio is permanent. **What the ratio prevents is a build that drifts to 90% model because a
model was easier to ask than to compute.**

---

# §12 · ANTI-PATTERNS, EACH WITH A MECHANICAL DETECTOR

| # | the failure | the detector (exits nonzero) |
|---|---|---|
| A1 | a model produces a number | every numeric field in the card must exist in the E1/E2/E3 computed set; a number with no computed ancestor -> FAIL |
| A2 | a compound question | lint: one `?`, ≤60 words, no `and/or` joining two judgments -> FAIL |
| A3 | a question referencing another answer | grep the question text for another question id -> FAIL |
| A4 | threshold theft | every `act`/`flag`/`floor` must exist in a calibration file with a sweep -> FAIL |
| A5 | baked payload | `provenance` containing shape/span/setup keys -> FAIL |
| A6 | unprovenanced value | a Clairic value without `p_null` and (span or bounds) -> FAIL |
| A7 | units drift | `notional_b` outside (0,500) or a value that is a /1000 of a plausible ladder -> FAIL |
| A8 | silent fallback | an absent source that did not print its token -> FAIL |
| A9 | count inflation | emitted > 8/week or > 3/day -> FAIL |
| A10 | hardcoded levels | `grep -nE '^\s*(box\|line\|label)\.new\([^)]*[0-9]+\.[0-9]{3,}'` -> must be 0 |
| A11 | 15m creep | `grep -rn '15m' sidecar/ pine/` -> only execution context, never classification |
| A12 | non-canon vocabulary | a term not in the card set (e.g. CHoCH, FVG, premium) -> FAIL |
| A13 | stub wearing done | a function returning a constant, an empty array, or `{stubbed:true}` -> FAIL |
| A14 | unvalidated price to a draw call | any `na`/0 price reaching `box.new` -> FAIL (the measured defect) |
| A15 | self-graded success | the verdict written by the executor rather than the gate -> VOID |
| A16 | card overflow | rendered card > 3,500 tokens -> REFUSE, never truncate |
| A17 | shipped without replay | a PASS with no held-out row -> VOID |
| A18 | LLM reintroduced | any dependency named `openai/anthropic/gemini/*-instruct` in the runtime tree -> FAIL |
| A19 | agent loop reintroduced | any runtime component that calls a tool by model output -> FAIL |
| A20 | forward extension | any drawn object with `x2 > anchor_ts` -> FAIL |

---

# §13 · THE BUILD SEQUENCE — every exit can fail

```
P0  INSTRUMENT
    G0 rig · generate verify skill · the six gates · generate frame.good/frame.bad (NOT borrowed)
    · calibrate G4 positive/negative · the control void test
    EXIT  the gate separates good from slab (positive >= 0.85, negative <= 0.15) AND
          the slab run returns VOID. FAIL = no build starts.

P1  L0 DATA
    Browser Rendering capture -> Clairic fields -> the five invariants -> abstention
    EXIT  3 real weeks extract; a planted occluded strike returns p_null high and is DROPPED;
          a planted /1000 ladder is rejected by I2; a missing image prints OPTIONS: ABSENT.
          FAIL = E1 cannot start.

P2  E1
    pillars -> clustering -> confluence -> degree -> ZFP + receipt -> roles -> face B -> LQZ
    EXIT  the golden week shows 5 IP roles, each with a receipt; 10 held-out weeks vary in
          price AND degree; a ZFP tier mutation moves its label. FAIL = P3 cannot start.

P3  E2
    spans -> priority -> the 7 questions -> compose -> chain boxes -> one line
    EXIT  the golden-week sequence is one of the twelve observed chains; the mutation "move one
          ZFP across a threshold" changes the adjacent shape; line ratio >= 0.900.
          FAIL = no E3.

P4  E3
    universe -> entry/SL/TP/RRR -> the 7 questions -> compose -> count -> dedupe -> hit test
    EXIT  the 8 golden setups reproduce (direction, entry, SL, TP, category, day); no week emits
          > 8; a 2.4 RRR setup is refused; the mutation "invert SL/TP" inverts the hit test.

P5  REPLAY
    freeze the code; 10 operator-drawn weeks; no change between golden and held-out
    EXIT  >= 90% golden AND >= 90% held-out. Golden PASS + held-out FAIL = HARDCODED, REJECT.

P6  VERIFY LAYER
    G3 mandate/claim · G4 Clairic label read · G5 agreement + control
    EXIT  the control returns VOID on the slab; a corrupted card fails G2; a wrong label read
          fails G4 with the delta named.

P7  DELIVERY
    A: the paste renders the card; B: the dashboard tab parity (byte-identical card)
    EXIT  the same card produces the same drawing in both paths.
```

---

# §14 · WHAT IT INHERITS, AND WHAT IT REPLACES

```
INHERITS — non-negotiable
  the 10 laws (master spec §0)                       the one-way derivation
  the 9-pillar / 0-14 confluence / Pillar-9 degree   Appendix B ZFP with the receipt
  the 10-shape taxonomy and the 12 observed chains    the two-phase E2 (boxes then line)
  E3's four owned numbers and the anchor doctrine     the temporal boundary
  GATE A + GATE B inside every phase                  the anti-hardcode structural test
  the 8-trades-per-week reality                       the 2.5 hard floor / 3.0 gauge

REPLACES — explicitly
  the PDF step                     -> the card (R-01)
  the agent sidecar                -> the Cloudflare Workflow (no agent at runtime)
  the LLM's semantic judgement     -> Clef's seven clauses per engine + code composition
  the LLM's reading of the options page -> Clairic's typed extraction with p_null and spans
  the 15m timeframe                -> 4H/1H/30m, 1H authoritative (R-09)
  the LuxAlgo SMC dialect          -> canon vocabulary (R-05)
  the width-derived ZFP            -> Appendix B base + modifiers (L7)
  the code-only E3 rejection       -> geometry in code, semantics in Clef
  hand-transcription               -> schema-validated card + kernel casts
```

---

# §15 · FILE LAYOUT

```
PLUTUS_VISION/
  design/          DESIGN_BLUEPRINT_v2.0_AUTHORITATIVE.md (this) · v1.2 · v1.0
  MASTER_CONTEXT/  the canon + OPERATOR_RULINGS_PV.md
  cards/           163 typed facts (the graph)
  spec/            PLUTUS_VISION_MASTER_SPEC.md (authority) · RENDER_LOOP_WORKFLOW.md

  cf/                                  THE WORKFLOW
    wrangler.toml                      AI · BROWSER · R2 · D1 · WORKFLOW · DO bindings
    src/workflow/pv-week.ts            S0..S11, the retry and idempotency keys
    src/do/week-seal.ts                the one-write seal, blockConcurrencyWhile
    src/steps/harvest.ts
    src/steps/capture.ts               Browser Rendering -> PNG -> R2
    src/steps/clairic.ts               the field schemas + the five invariants + abstention
    src/e1/*.ts                        pillars · cluster · confluence · degree · zfp · roles · faceB
    src/e2/*.ts                        spans · priority · transitions · chain · day · compose
    src/e3/*.ts                        universe · geometry · kill · rrr · count · dedupe · hit
    src/gate/*.ts                      confidence · tier · eviction · refusal tokens
    src/card/schema.ts                 trident-workflow-v2 + provenance + refusals
    src/ledger/d1.ts                   one row per decision: state hash · answers · thresholds
    clauses.json                       the 33/22 registry, gate-counted
    calibration/e2.json e3.json g4.json

  pine/                                THE RENDER
    plutus-vision.pine                 written ONCE
    engine/                            standalone layer (face B + bars-only chain)
    kernel/                            parse -> cast -> draw
    schema/trident-workflow-v2.subset.json

  gates/                               one check per anti-pattern (A1..A20)
  proofs/                              every capture, every verdict, every opened frame
  mand/                                P0..P7, <= 2,000 tokens each (the judge's input)
  vcards/                              the verification cards
```

---

# §16 · THE RISK REGISTER

| sev | risk | mitigation | what would falsify the mitigation |
|---|---|---|---|
| CRIT | Clairic misreads a strike or a notional | I1-I5 + p_null abstention + a planted-null control; any failure is FATAL (W2_*) | the control passes a planted wrong strike |
| CRIT | the options page changes layout | capture sha + a weekly spot-check against the printed total (I5) | two weeks' totals disagree with the page |
| CRIT | E2/E3 chains underperform (the six-month failure) | 7 sharp clauses + false-allow = 0 before arming + shadow week | shadow rows disagree with labels |
| CRIT | the build is hardcoded to the golden week | GATE B inside every phase + a frozen replay | held-out gap > 10 points |
| HIGH | Clef unavailable at run time | fail closed: no chain, no setups, a printed token | a run emits setups with JUDGE: DOWN |
| HIGH | 64-question ceiling forces per-candidate splitting | candidate cap 8; 8x7 = 56 | a week needs > 8 candidates |
| HIGH | clef-flash's 24k window truncates a state | route E2/E3 to clef (65k); flash only for G3/G4 | a state > 20k tokens |
| HIGH | the ZFP is never calibrated | P1 exit is the calibration run | a ZFP label without a bucket row |
| MED | the card becomes a config blob | every node casts; A2/A5 detectors | a node read with no verdict |
| MED | the paste is skipped and the chart looks fine | CARD: ABSENT token + the standalone layer | a render with no token and no card |
| MED | the confidence composite is gamed | the composite is code; the model only answers the 7 clauses | a tier with no composite trace |
| LOW | Workflows/DO plan limits | verify the limits page before P0; the step contract does not depend on an unmeasured number | a step exceeding the run ceiling |

---

# SUMMARY — the design in one breath

**Bars and two rendered sources come in.** Clairic reads the options ladder and the calendar out
of images into typed values, and five code invariants plus a `p_null` abstention rule decide
whether any of it is admissible. Code then computes the entire E1 zone map — nine pillars,
clustering, the 0-14 confluence, the degree, and the ZFP with its base-plus-modifiers receipt —
and draws face B from the bars. E2 segments the prior week into candidate spans, narrows them to
eight, and sends **seven typed Clef questions per candidate in one request**; code composes the
answers with the weakest-clause law, walks the chain by the target zone's ZFP band, and emits a
day skeleton and a falsifiable alternative. E3 resolves exactly four numbers from the zone edges,
applies nine code kill clauses, and asks **seven Clef questions per setup in one request**; code
composes, vetoes, counts to eight, dedupes, and hit-tests. The survivors become one card whose
every Class-B value carries a span and a `p_null`, sealed exactly once by a Durable Object, pasted
into one Pine field. The Pine kernel is a standalone engine that also casts the card, and it
prints a named token when the card is absent. A gate reads the frame through Clairic, compares
what it read to the card in code, and voids the run when a known-bad slab passes. **Nothing
generates a number. Nothing generates text. Nothing decides but code. The models read and judge;
the shell computes, enforces, and draws; and the chain is armed only after its false-allow rate is
zero on weeks it has never seen.**

---

# APPENDIX A · THE READING TABLE (this session)

```
source                                              extent read                    elided
PLUTUS_VISION_MASTER_SPEC.md (3,031)                §0-§16, windows 1-3031        4 windows *
design/DESIGN_BLUEPRINT_v1.2 (871)                  all                             none
design/BUILD_WORKFLOW_v2 (537)                      all                             none
MASTER_CONTEXT/OPERATOR_RULINGS_PV.md (53)          all                             none
cards/ ARCH-*, E1-*, E2-*, E3-* (read verbatim)     ARCH-LAYER-STACK · ARCH-DATA-FLOW
                                                    · ARCH-INVARIANTS · ARCH-FAILURE-MODES
                                                    · E1-ENGINE-CONTRACT · E2-ENGINE
                                                    · E3-CONTRACT · E3-RRR-RULING
                                                    · E3-CONFIDENCE-RULING
                                                    · E3-SETUP-UNIVERSE · E3-RRR-FLOOR
Bibles/JEV_CHOICE_BIBLE (3,008)                     §6.1-6.5 primitives + §10 iron laws
Bibles/JEV_ENGINEERING_BIBLE (3,006)                §6.1 primitives · §6.2 state · §6.3
                                                    questions · §6.4 calibration · §10 laws
Bibles/ALGORITHMIC_REASONING_BIBLE (3,231)          §6.6 engine · §6.7 authoring · §6.9
                                                    zero-token · §6.14 calibration · §6.15 FMs
cloudflare clairic model card + schema fields       all                             none
cloudflare clairic launch post + changelog          all (incl. Preview limits)      none
cloudflare clef + clef-flash model cards            all                             none
cloudflare clef launch post                         all (benchmarks, latency, training) none

* the reader elided middles in four windows; every elided region was recovered from
  adjacent ranges and from the cards that carry the same facts (E3-*, ARCH-*, E1-*).
  No number in this document rests on an elided line: every threshold is anchored to
  master spec §4/§5/§6, OP-RULINGS R-07/R-09, or a card read verbatim.
```

# APPENDIX B · WHAT THE OPERATOR MUST RULE BEFORE P0

| # | fork | why it blocks | recommendation |
|---|---|---|---|
| D1 | ZFP point selection | Appendix B gives ranges, no point | midpoint — reproduces the Pillar-9 buckets |
| D2 | the momentum constant | `0.5 x ATR20` is the only unsourced number | accept or supply one |
| D3 | ZFP clamp | six modifiers sum to 125% | clamp 0..99 |
| D4 | calibration tolerance | chosen after seeing data is not a tolerance | ±15 pp, n >= 8 reportable |
| D5 | golden-week instrument | feedback is EU/GU; fixtures are DXY | confirm the P1-P6 render target |
| D6 | E2 box vertical span | rung-to-rung vs shape high/low | rung-to-rung (every edge traceable to E1) |
| D7 | the held-out set | must be drawn after the freeze | operator draws ten |
| D8 | RRR floor vs the 8 recorded setups | row 4 is 2.00, below every floor | the record is the acceptance; the floor governs derived setups — confirm |
| D9 | `vlmSourced` in the GOD tier | does a Clairic receipt satisfy it, or must a vision model read the frame? | treat GOD as requiring the L4 frame read (G4), not just a receipt |
| D10 | the card field count | one field (atomic) vs several | one field |

**Nothing before D1-D4 is buildable.** The spec layer completes here; the build begins when the
four ZFP rulings exist.

---
---

# PART III · THE PRODUCTION PSEUDOCODE
## Every stage is the same machine: Score → Noul chain → Choice → Verdict. Code decides. The judge informs.

**The shape is not invented here.** It is the JEV engineering bible's layered engine (§6.6) and the
algorithmic reasoning bible's chain law (§6.3, L-3) applied to E1/E2/E3:

```
LAYER 0  FREE CODE FILTER      invariants · geometry · kill clauses      0 ms, no model
LAYER 1  SCORE (coarse gate)   "is this even a candidate?"               only for the ranking
LAYER 2  NOUL CHAIN            the reasoning, batched, blind questions   ONE request per stage
LAYER 3  CHOICE                the decision among LICENSED options       only when |options| >= 2
LAYER 4  VERDICT               the weakest clause, in code               0 ms, no model
```

**Four laws govern every function below.**

```
L-A  EVIDENCE IN STATE, STANDARD IN INSTRUCTIONS.   Every question names a state field.
     A question referencing an absent field is refused BEFORE the call (E*_STATE_INCOMPLETE).
L-B  THE PROGRESSIVE LAW.  state(i) = state(i-1) + answers(i-1).  A question that DEPENDS on
     another answer is a SECOND REQUEST, never a hoped-for visibility (questions are blind).
L-C  THE WEAKEST CLAUSE.  composition is min(), never mean.  Overall accuracy never hides a
     failing clause.
L-D  NO FALLBACK.  every absence is a named fatal.  A judge that cannot answer cannot authorize.
```

---

## §P0 · THE ENGINE — one function every stage calls

```ts
type Primitive = "noul" | "choice" | "score";

interface Question {
  id: string; type: Primitive;
  instructions: string;                       // <= 60 words, one snap judgment
  criteria?: Record<string, string> | string[];  // options (noul/choice) or levels (score)
  requires: string[];                         // the state paths this question reads
  bar?: number;                               // per-question bar (noul), from the policy
}

interface Policy {                            // a NAMED object, never inline numbers
  act: number; flag: number;                  // the ladder
  fail: "closed" | "open";                    // polarity for THIS surface
  perQuestion: Record<string, number>;        // per-clause bars (critical clauses higher)
  source: string; rows: number;               // the calibration record
}

// ── THE ONLY DOOR TO THE MODEL ────────────────────────────────────────────────
async function ask(
  stage: string, version: string, state: object,
  questions: Question[], policy: Policy, surface: Surface,
): Promise<{ answers: Answers; cached: boolean; usage: Usage }> {

  // 1 · THE STATE GATE — every path a question reads must exist (L-A)
  for (const q of questions) for (const p of q.requires)
    if (!resolvePath(state, p)) throw new Fatal("E_STATE_INCOMPLETE", { stage, q: q.id, path: p });
  if (tokens(state) > STATE_CAP) throw new Fatal("E_CONTEXT_OVERFLOW", { stage, tokens: tokens(state) });

  // 2 · THE SCHEMA GATE — the primitive limits, before the call
  assert(questions.length <= 64,          "E_TOO_MANY_QUESTIONS");
  for (const q of questions) {
    if (q.type === "choice") assert(Object.keys(q.criteria!).length <= 255, "E_CHOICE_CAP");
    if (q.type === "score")  assert((q.criteria as string[]).length <= 10,  "E_SCORE_CAP");
    assert(words(q.instructions) <= 60,   "E_QUESTION_TOO_LONG");
  }

  // 3 · THE CACHE — model ⊕ schema ⊕ canonical(redact(state))
  const fp = sha256([MODEL, stage + "@" + version, JSON.stringify(questions),
                     canonicalize(redact(state))].join("\u0000"));
  const hit = cache.get(fp);
  if (hit) { ledger.append({ ...rowOf(stage, state, fp, hit), cache_hit: true }); return hit; }

  // 4 · THE CALL — the ONLY non-deterministic line in the system
  let raw;
  try { raw = await transport.systemOne({ model: MODEL, state, questions }); }
  catch (e) {
    ledger.append(refusalRow(stage, state, fp, "JUDGE_UNAVAILABLE", e));
    if (policy.fail === "closed") throw new Fatal("E_JUDGE_DOWN", { stage, cause: String(e) });
    return { answers: {}, cached: false, usage: ZERO };      // advisory surface: logged miss
  }

  // 5 · THE ANSWER GATE — a malformed answer is a PROVIDER failure, not a judgment
  const answers = validateAnswers(raw, questions);           // ids both ways · ranges · bools · sums

  // 6 · THE CONSTANT-JUDGE CONTROL — a judge that answers one value to everything is blind
  assert(distinctValues(answers) > 1, "E_JUDGE_CONSTANT");

  // 7 · THE LEDGER — written by the engine, never by the caller (IL-15)
  const row = rowOf(stage, state, fp, raw);
  ledger.append(row); cache.put(fp, { answers, usage: raw.usage });
  return { answers, cached: false, usage: raw.usage };
}

// ── THE VERDICT — the weakest clause, in code ────────────────────────────────
function decide(clauses: Record<string, number>, policy: Policy): Verdict {
  const failing = Object.entries(clauses)
    .filter(([id, p]) => p < (policy.perQuestion[id] ?? policy.act))
    .sort((a, b) => a[1] - b[1]);                   // the worst first
  const weakest = failing[0]?.[0] ?? null;
  const overall = Math.min(...Object.values(clauses));   // ★ MIN, NEVER MEAN
  if (!failing.length)              return { kind: "ALLOW", overall, weakest: null };
  if (overall >= policy.flag)       return { kind: "ESCALATE", overall, weakest };
  return { kind: "DENY", overall, weakest, remedy: REMEDY[weakest] };
}
```

---

## §P1 · L0 — the capture stage

```ts
async function captureOptions(pair, week): Promise<Walls> {
  const png = await browser.render(OPTIONS_URL(week), { waitFor: ".ladder" });
  if (!png.bytes) throw new Fatal("W2_CAPTURE_EMPTY", { pair, week });
  if (KNOWN_BAD.has(sha256(png))) throw new Fatal("W2_CAPTURE_KNOWN_BAD", { sha: sha256(png) });
  r2.put(captureKey(pair, week), png);

  const ans = await clairic(OPTIONS_FIELDS, png, { reference_date: week.start });
  if (ans.truncated) throw new Fatal("W2_EXTRACT_TRUNCATED", {});

  // THE FIVE INVARIANTS — each fatal, each named
  I1: assert(len(ans.strikes) === len(ans.notionals_b), "W2_I1_ALIGNMENT");
  I2: assert(ans.notionals_b.every(n => n > 0 && n < 500), "W2_I2_UNITS");
  I3: assert(ans.strikes.every(s => Math.abs(s - spot(pair)) <= spot(pair) * 0.15), "W2_I3_DOMAIN");
  I4: assert(week.start <= ans.expiry && ans.expiry <= week.end, "W2_I4_WINDOW");
  I5: assert(ans.printed_total == null ||
             Math.abs(ans.printed_total - sum(ans.notionals_b)) <= 0.02 * sum(ans.notionals_b),
             "W2_I5_TOTAL");

  // THE ABSTENTION — a field the input does not determine is INCONCLUSIVE, never zero
  for (const f of Object.keys(ans.answers)) {
    if (ans.answers[f].p_null > 0.50) throw new Fatal("W2_INCONCLUSIVE", { field: f, p_null: ans.answers[f].p_null });
  }
  const kept = ans.strikes.map((s, i) => ({ ...s, i })).filter(s => ans.answers.strikes[s.i].p_null <= 0.05);
  if (!kept.length) throw new Fatal("W2_NO_STRIKES", {});
  return { strikes: kept, notionals_b: kept.map(s => ans.notionals_b[s.i]),
           oi: kept.map(s => ans.open_interest[s.i]), expiry: ans.expiry, cut: ans.cut_time };
}
```

---

## §P2 · E1 — the zones, computed in code, audited by a chain

### §P2.1 · The computation (code only — no model inside this function)

```ts
function e1Build(pair, week, bars, walls, cal): ZoneMap {
  const spot = bars["1H"].at(-1).close;
  const levels = [];                        // 9 pillars + 5 auxiliaries, per timeframe
  for (const tf of ["4H", "1H", "30m"]) {
    levels.push(...pivots(bars[tf]).map(l => ({ ...l, type: "weekly_swing", tf })));
    levels.push(...roundsIn(range(bars[tf]), GRID[pair]).map(l => ({ ...l, type: "round", tf })));
    levels.push({ ...ema200(bars[tf]), type: "ema200", tf });
    levels.push(...priorDayLevels(bars[tf]).map(l => ({ ...l, type: "prior_day", tf })));
    levels.push(...orderBlocks(bars[tf]).map(l => ({ ...l, type: "ob_4h", tf })));
  }
  if (!levels.length) throw new Fatal("E1_NO_LEVELS", { pair, week });

  const zones = cluster(levels, TOL[pair]).map((c, i) => {
    const pillars = distinctByType(c.members);
    const confluence = scoreConfluence(c, pillars);            // 0..14, may be x.5
    const degree = DEGREE[Math.floor(confluence)];             // bucket by integer part
    const notional = nearestWall(walls, c.mid);                // 0.0 when no wall — a real value
    const z = { id: `z${i}`, top: c.top, bottom: c.bottom, mid: c.mid, width: c.width,
                pillars, confluence, degree, confluent: confluence >= 8,
                direction: c.mid > spot ? "up" : "down",
                structural_memory: pillars.some(p => STRUCTURAL.has(p.type)),
                reaction_count: mitigations(c, bars), bom_mom: classifyBom(c, bars),
                levels_in_band: c.members.map(m => m.price) };
    const ctx = e1Context(pair, spot, walls, cal, bars, c, zonesSoFar);  // every key REQUIRED
    z.receipt = zfp.compute(z, ctx, week);      // throws on ANY missing/invalid input
    const gap = zfp.crosscheck(z.receipt, z.degree);   // the Pillar-9 cross-check, in code
    if (gap !== "consistency") ledger.finding("ZFP_CROSSCHECK_CONFLICT", { zone: z.id, gap });
    z.zfp = z.receipt.zfp;                      // ★ THE INTEGER. Consumers never see the dict.
    z.poi_tier = poiTier(z, bars["4H"]);
    return z;
  });
  if (!zones.length) throw new Fatal("E1_NO_ZONES", {});
  verifyZoneInvariants(zones);                  // INV-E1-1..6, all fatal except the finding
  return { zones, roles: assignIpRoles(zones, spot), faceB: faceB(bars, zones), ladder: buildLadder(zones) };
}
```

### §P2.2 · The attestation chain — the judge reads the RECEIPT as evidence

**Stage A · 4 independent Nouls per zone, ONE request (8 zones × 4 = 32 ≤ 64).**

| id | type | instructions (verbatim) | criteria |
|---|---|---|---|
| Z1 | noul | "For every entry in `zone.pillars`, does `evidence` contain at least one level of that `type` inside [zone.bottom, zone.top]?" | true = every claimed pillar is backed in-range; false = at least one is not |
| Z2 | noul | "For every modifier with `fired: true`, does its `gate` string state evidence that satisfies that modifier's rule in `canon.b2`?" | true = every fired gate is satisfied by the evidence it names; false = at least one is not |
| Z3 | noul | "For every modifier with `fired: false`, does its `gate` string name a condition that is absent from `zone` and `bars_summary`?" | true = every declined gate names a real absence; false = a declined condition was present |
| Z4 | noul | "Does `zone.tier` satisfy every conjunct in `canon.b1[tier]` on the evidence shown — notional band, pillar count, and, for HARD_WALL, a confluent floor or ceiling in `levels_in_band`?" | true = every conjunct holds; false = at least one does not |

**Stage B · 2 per zone, a SECOND request (the progressive law: state includes stage A's answers).**

| id | type | instructions | levels / criteria |
|---|---|---|---|
| Z5 | noul | "Given the attested pillars in `zone.attested_pillars`, is every level in `zone.levels_in_band` attributable to one of them, or listed in `unattributed_levels` with a reason?" | true = no level is silently ignored; false = at least one is |
| Z6 | score | "How completely does this receipt account for the structural evidence in the band?" | 0 one or more levels unexplained · 1 a level is explained only by a pillar of a different type · 2 all attributed, but two pillar types share one level · 3 every level attributed to a distinct attested pillar |

```ts
async function attestZones(map: ZoneMap, bars, canon, policy: Policy): Promise<ZoneMap> {
  const zones = map.zones.slice(0, 8);                       // the 64-question budget
  const stateA = { week: map.week, pair: map.pair, spot: map.spot, canon,
                   zones: zones.map(freezeReceipt) };        // the RECEIPT is the evidence
  const A = await ask("E1-ATTEST-A", "1.0.0", stateA, Q_E1A(zones), policy, "critical");

  const stateB = { ...stateA, answers: A.answers };           // ★ L-B: answers join the state
  const B = await ask("E1-ATTEST-B", "1.0.0", stateB, Q_E1B(zones), policy, "critical");

  const kept = [];
  for (const z of zones) {
    const clauses = { Z1: A.answers[z.id].Z1, Z2: A.answers[z.id].Z2,
                      Z3: A.answers[z.id].Z3, Z4: A.answers[z.id].Z4, Z5: B.answers[z.id].Z5 };
    const v = decide(clauses, policy);                        // weakest clause
    z.attest = { vector: clauses, score: B.answers[z.id].Z6, verdict: v.kind };
    if (v.kind === "DENY") { ledger.refuse(z.id, "E1_ATTESTATION_FAILED", v); continue; }
    if (v.kind === "ESCALATE") { ledger.hold(z.id, v); continue; }   // not emitted, not dropped
    if (B.answers[z.id].Z6 < 2) { ledger.refuse(z.id, "E1_RECEIPT_INCOMPLETE", B.answers[z.id].Z6); continue; }
    kept.push(z);
  }
  const refused = zones.length - kept.length;
  if (refused / zones.length > 0.20) throw new Fatal("E1_ATTESTATION_DRIFT", { refused, of: zones.length });
  if (kept.length < 5) throw new Fatal("E1_TOO_FEW_ZONES", { kept: kept.length });
  return { ...map, zones: kept };
}
```

**The control (every run).** One planted-bad zone rides in the same request: a fabricated pillar
plus a modifier fired on evidence that does not exist. It MUST be refused.

```ts
const PLANT = { id: "__plant__", ..., pillars: [{ type: "ob_4h", price: OUT_OF_BAND }],
                modifiers: [..., { name: "cross_pair", fired: true, gate: "no pair matched" }] };
if (attest(PLANT, A.answers.__plant__) !== "DENY") throw new Fatal("E1_CONTROL_VOID", {});
```

---

## §P3 · E2 — the chain, built by code, decided by a chain

### §P3.1 · The candidate set (code — the free filter, ≥100× narrowing)

```ts
function e2Candidates(map: ZoneMap, bars1h): Candidate[] {
  const spans = segment(bars1h, map.ladder);               // structure-based, deterministic
  if (!spans.length) throw new Fatal("E2_NO_SPANS", {});
  const out = [];
  for (const s of spans) {
    const a = anatomy(s, bars1h);                          // candles, body_frac, range_ratio, wicks, colour
    const tz = targetZone(s, map);                         // the zone the leg approaches
    if (!tz) continue;                                     // not shapable — not an error
    const licensed = LICENSED(a, band(tz.zfp));            // every shape the canon licenses here
    if (!licensed.length) continue;                        // no row -> not a candidate
    out.push({ id: `c${out.length}`, span: s, anatomy: a, target: tz.id,
               target_zfp: tz.zfp, target_role: tz.role, direction: s.dir,
               prev: out.length ? out.at(-1).id : null, licensed, priority: licensed.length });
  }
  if (!out.length) throw new Fatal("E2_NO_CANDIDATES", {});
  return out.sort((x, y) => x.priority - y.priority || x.target_zfp - y.target_zfp).slice(0, 8);
}
```

### §P3.2 · Stage A — 4 independent Nouls per candidate, ONE request (8 × 4 = 32)

| id | instructions (verbatim) | criteria |
|---|---|---|
| A1 | "Does `candidate.anatomy` satisfy every candle clause of `shape_definitions[candidate.licensed[*]]` — count, body fraction, range ratio, wick profile, colour sequence?" | true = at least one licensed shape's clauses all hold; false = none holds |
| A2 | "Does `candidate.direction` agree with the side of `zone_map[candidate.target].role` — long into support, short into resistance?" | true = the role opposes the direction; false = same-side or neutral |
| A3 | "Does `candidate` continue from `candidate.prev` with no time gap, no overlap, and no re-entry into a zone this chain already traversed?" | true = contiguous and non-repeating; false = otherwise |
| A4 | "Do the 1H closes inside `candidate.span` stay inside the span's high and low for at least 80% of its bars?" | true = the closes stay inside; false = the span is drawn around price |

### §P3.3 · Stage B — the progressive stage: new-structure + the licensed Choice

```ts
async function e2StageB(keep, A, map, policy) {
  const state = { week, pair, anchor, zone_map: map.zones, shape_definitions: DEFS,
                  candidates: keep.map(c => ({ ...freeze(c), a1: A.answers[c.id].A1 })),
                  answers_a: A.answers };                       // ★ L-B
  const questions = [];
  for (const c of keep) {
    questions.push({ id: `${c.id}.B1`, type: "noul", requires: ["candidates", "answers_a"],
      instructions: "Given that `candidate.prev`'s origin is `prev_origin`, did price fail to break `prev_origin` before this span began?",
      criteria: { true: "the origin held and the structure is new",
                  false: "the previous origin broke, so this is a failed attempt" } });
    if (c.licensed.length >= 2)                              // ★ the Choice ONLY when |licensed| >= 2
      questions.push({ id: `${c.id}.B2`, type: "choice", requires: ["candidates", "shape_definitions"],
        instructions: "Which shape follows, given the attested anatomy and the licensed set?",
        criteria: Object.fromEntries(c.licensed.map(s => [s, DEFS[s].oneLine])) });
  }
  return ask("E2-STAGE-B", "1.0.0", state, questions, policy, "critical");
}
```

**When `|licensed| == 1`, no Choice is issued** — the code takes the single licensed shape and
records `licensed_singleton: true`. A Choice with one option is a question that cannot fail.

**When the Choice returns `NONE`** the chain terminates at that leg — a legitimate result, recorded.

### §P3.4 · Stage C — chain-level, 2 questions (depends on B)

| id | type | instructions | levels |
|---|---|---|---|
| C1 | score | "How completely does the chain conserve its energy budget?" | 0 a leg exceeds the weekly range · 1 two legs overshoot their measured move · 2 one leg overshoots by under 20% · 3 every leg lands inside its measured move |
| C2 | noul | "Is `alternative.decision_zone` the zone whose failure or hold would most change the week's path, given every zone's confluence, degree and ZFP?" | true = this is the hinge zone; false = another matters more |

### §P3.5 · The verdict (code)

```ts
function e2Verdict(keep, A, B, C, policy): Chain {
  const links = [];
  for (const c of keep) {
    const clauses = { A1: A.answers[c.id].A1, A2: A.answers[c.id].A2,
                      A3: A.answers[c.id].A3, A4: A.answers[c.id].A4,
                      B1: B.answers[c.id].B1 };
    const v = decide(clauses, policy);
    if (v.kind === "DENY")     { ledger.refuse(c.id, "E2_CANDIDATE_FALSIFIED", v); continue; }
    if (v.kind === "ESCALATE") { ledger.hold(c.id, v); continue; }
    const next = c.licensed.length >= 2 ? B.answers[c.id].B2.choice : c.licensed[0];
    if (next === "NONE") break;
    links.push({ ...c, shape: next, confidence: v.overall, clauses });
  }
  if (!links.length) throw new Fatal("E2_ALL_FALSIFIED", {});
  if (links.length > 5) links.length = 5;
  links[0].day = null;                                     // assigned below
  if (C.answers.C1 < 2) {                                  // energy: a significant leak
    const pre = Math.min(...links.map(l => l.confidence));
    links.pop();
    if (!links.length) throw new Fatal("E2_ENERGY_VETO", {});
    if (Math.min(...links.map(l => l.confidence)) < pre)
      throw new Fatal("E2_CONFIDENCE_INVERSION", {});       // a trim may never raise it
  }
  verifyChainOrder(links);                                  // strictly increasing starts, no repeats
  const days = assignDays(links, calendar);                 // shape/day budget + red-folder
  const alt = alternative(links, keep);                     // full re-walk with the hinge zone flipped
  if (!alt) throw new Fatal("E2_ALTERNATIVE_INVALID", {});
  return { links, days, alternative: alt, confidence: Math.min(...links.map(l => l.confidence)) };
}
```

---

## §P4 · E3 — the setups, geometry in code, semantics in the chain

### §P4.1 · Geometry + the ten kill clauses (free, before any model)

```ts
function e3Geometry(chain, map, cal): Setup[] {
  const setups = [];
  for (const day of chain.days) {
    for (const anchor of anchors(day, UNIVERSE[day.shape], map)) {   // 1H/30m/15m edges ONLY
      if (!["1H", "30m", "15m"].includes(anchor.tf)) throw new Fatal("E3_ANCHOR_TF_INVALID", { tf: anchor.tf });
      const z = map.zone(anchor.zone_id);
      const entry = anchor.edge(z);
      const sl = oppositeEdge(z) + (anchor.dir === "LONG" ? -1 : 1) * buffer(pair);   // 2..5 pips
      const tp = nearestOpposing(map, entry, day.direction, day.path);
      if (!tp) throw new Fatal("E3_TP_NULL", { anchor: anchor.id });
      const rrr = Math.abs(tp - entry) / Math.abs(entry - sl);
      const s = { entry, sl, tp, rrr, anchor_zone: z.id, direction: day.direction, day: day.name,
                  session: day.session, category: day.shape };
      const kill = killClauses(s, map, chain, cal);       // K1..K10, pure code
      if (kill) { ledger.refuse(s, kill.code, kill); continue; }
      s.confidence = composite(s, map);                    // the operator's 0-100 formula
      s.tier = tierOf(s);                                  // GOD / HIGH / STANDARD / REJECT
      setups.push(s);
    }
  }
  return dedupe(capDaily(setups, 3)).sort((a, b) => b.confidence - a.confidence).slice(0, 8);
}
```

```
K1  rrr < 2.5                                  E3_RRR_BELOW_FLOOR
K2  confidence < 65                            E3_CONFIDENCE_BELOW_GATE
K3  tier not in {GOD_TIER, HIGH}               E3_TIER_NOT_EMITTABLE
K4  that day already has 3 setups              E3_DAILY_CAP
K5  that week already has 8 setups             E3_WEEKLY_CAP
K6  setup.day != chain.day_of(anchor.shape)    E3_DAY_MISMATCH
K7  anchor edge type invalid for the category  E3_ANCHOR_TYPE
K8  sl buffer outside 2..5 pips                E3_SL_BUFFER
K9  tp is not an opposing zone on the path     E3_TP_NOT_ON_PATH
K10 identity (zone, direction, day) already used  E3_DUPLICATE
```

### §P4.2 · Stage A — 5 per setup, ONE request (8 × 5 = 40 ≤ 64)

| id | type | instructions | criteria |
|---|---|---|---|
| D1 | noul | "Is `setup.entry_anchor` the same structural element as `setup.e2_day_anchor` — same zone id, same edge, same 1H/30m/15m timeframe?" | true = identical; false = any of the three differs |
| D2 | noul | "Would `setup.sl` be taken out by the structure that created this setup before the entry fills — that is, is the SL inside that zone's noise band?" | true = the structure sits beyond the SL; false = the SL is inside the noise |
| D3 | noul | "Is `setup.tp` the nearest opposing zone that `e2_chain.path` must traverse before Friday close?" | true = nearest opposing on the path; false = farther, or off the path |
| D4 | noul | "Does `setup.direction` agree with `e2_chain.day[setup.day].direction`?" | true = agree; false = disagree |
| D5 | score | "How high-probability is this setup given its confluence, degree, ZFP and the E2 path?" | 0 rejected · 1 weak · 2 standard · 3 high · 4 god |

### §P4.3 · Stage B — 2 per survivor (depends on A: the survivors are the state)

| id | type | instructions | criteria |
|---|---|---|---|
| D6 | noul | "Is this setup materially the same as any setup in `existing` — same anchor family, same direction, and a target within 30% of the same RRR?" | true = duplicate; false = distinct |
| D7 | noul | "Does `zone_map[setup.entry_zone].role` make this a valid reaction point for `setup.category` — support for a long in consolidation, resistance for a short in a reversal?" | true = valid; false = not |

### §P4.4 · The verdict (code)

```ts
function e3Verdict(cands, A, B, policy): Setup[] {
  const emitted = [];
  for (const s of cands) {
    const clauses = { D1: A[s.id].D1, D2: A[s.id].D2, D3: A[s.id].D3, D4: A[s.id].D4 };
    const veto = A[s.id].D2 < 0.80 || A[s.id].D3 < 0.80 || A[s.id].D5 < 2;
    const v = decide(clauses, policy);
    if (veto)                     { ledger.refuse(s.id, "E3_VETO", { D2: A[s.id].D2, D3: A[s.id].D3, D5: A[s.id].D5 }); continue; }
    if (v.kind === "DENY")        { ledger.refuse(s.id, "E3_CLAUSE_FAILED", v); continue; }
    if (v.kind === "ESCALATE")    { ledger.hold(s.id, v); continue; }
    const dup = B[s.id].D6, react = B[s.id].D7;
    if (dup > 0.80)               { ledger.refuse(s.id, "E3_DUPLICATE", { D6: dup }); continue; }
    if (react < 0.80)             { ledger.refuse(s.id, "E3_REACTION_INVALID", { D7: react }); continue; }
    emitted.push({ ...s, p: v.overall, evidence: { ...clauses, D5: A[s.id].D5, D6: dup, D7: react } });
  }
  const capped = evict(emitted, 8, 3);            // evict the weakest, never reject a stronger
  return capped;
}
```

---

## §P5 · L4 — the gates

```ts
async function l4Verify(card, policy) {
  if (sha256(frameOfThisTurn()) !== card.frame_sha) throw new Fatal("G_STALE_SUBJECT", {});
  const g1 = chartValidator(frame());                     // 20 pixel checks, built
  const g2 = structural(card, pineSource());              // receipts · ancestry · stubs · literals
  const g3 = await ask("G3", "1.0.0", cardDigest(card), Q_G3, policy, "critical");
  const g4 = await clairic(FRAME_FIELDS, frame());         // the labels, as typed values
  const ctl = await controlRun();                          // the planted-bad frame
  if (ctl.bands > 0) throw new Fatal("G_CONTROL_VOID", {});
  if (g1.critical || g2.critical) throw new Fatal("G_CRITICAL", { g1: g1.failed, g2: g2.failed });
  if (g3.answers.claim_contradicted >= policy.act) throw new Fatal("G_CLAIM_CONTRADICTION", {});
  if (g3.answers.mandate_met < policy.act)         throw new Fatal("G_MANDATE_FAILED", {});
  if (disagree([g1, g2, g3, g4]))                  throw new Fatal("G_DISAGREE", {});
  return PASS;
}
```

---

## §P6 · THE LEDGER ROW (written by the engine, one per model call)

```jsonc
{ "ts": "2026-07-06T21:47:03Z", "run": "pv-2026-07-06-DXY",
  "stage": "E2-STAGE-A", "stage_version": "1.0.0",
  "surface": "critical", "recipe": { "id": "e2.stage_a", "version": 1 },
  "state_hash": "sha256:…", "state_bytes": 2611, "redaction": "default-v1",
  "model": "clef", "provider": "cloudflare",
  "cache": { "hit": false, "fingerprint": "sha256:…" },
  "answers": { "c0.A1": 0.93, "c0.A2": 0.88, "c0.A3": 0.97, "c0.A4": 0.91, "…": 0 },
  "policy": { "act": 0.78, "flag": 0.60, "perQuestion": { "A4": 0.85 }, "source": "calibration/e2.json", "rows": 240 },
  "route": "allow", "route_reason": "min=A2 0.88 >= act 0.78",
  "cost_usd": 0.0021, "latency_ms": 214, "later_truth": null }
```

**Six field rules that carry the weight.** `state_hash` + `fingerprint` reproduce the decision
without storing evidence. `model` records the concrete version, never an alias. `policy` records
the bars in force, so a later calibration separates model drift from policy drift. `route_reason`
names the weakest clause. `later_truth` is the only calibration feedstock. `cost_usd` is computed
at write time so the row is self-contained.

---

## §P7 · THE CALIBRATION (derived bars, adversarial pass, false-allow reported separately)

```ts
function calibrate(engine: Engine, control: Labeled[], adversarial: Labeled[]): Policy {
  const rows = control.map(runEngine);                     // every probability recorded
  let best = null;
  for (let act = 0.50; act <= 0.95 + 1e-9; act += 0.05) {
    const m = confusion(rows, act);                        // TP FP TN FN at this bar
    const adv = confusion(adversarial.map(runEngine), act); // near-miss · bait · paraphrase · boundary · empty
    const report = { act, precision: m.precision, recall: m.recall,
                     false_allow: m.fp / (m.fp + m.tn), adv_recall: adv.recall, adv_false_allow: adv.fp / (adv.fp + adv.tn) };
    if (report.false_allow === 0 && report.adv_false_allow === 0) {
      if (!best || report.recall > best.recall) best = report;
    }
  }
  if (!best) throw new Fatal("CALIBRATION_INFEASIBLE", { engine: engine.id });
  const policy = { act: best.act, flag: Math.max(0.30, best.act - 0.15), fail: engine.fail,
                   perQuestion: engine.questions.filter(q => q.critical).reduce((o, q) => ({ ...o, [q.id]: best.act + 0.07 }), {}),
                   source: `calibration/${engine.id}.json`, rows: rows.length, report: best };
  writeJson(policy.source, { ...best, rows: rows.length, at: now(), model: MODEL });
  return policy;
}
```

**A policy whose `source` file is absent is `E_UNCALIBRATED` — the engine refuses to run.**
The bar is never a literal in the code.

---

## §P8 · THE FAILURE CONTRACT (complete error surface)

```
E_STATE_INCOMPLETE · E_CONTEXT_OVERFLOW · E_TOO_MANY_QUESTIONS · E_CHOICE_CAP · E_SCORE_CAP
E_QUESTION_TOO_LONG · E_JUDGE_DOWN · E_JUDGE_MALFORMED · E_JUDGE_CONSTANT · E_UNCALIBRATED
W2_CAPTURE_EMPTY · W2_CAPTURE_KNOWN_BAD · W2_EXTRACT_TRUNCATED · W2_INCONCLUSIVE
W2_NO_STRIKES · W2_I1_ALIGNMENT · W2_I2_UNITS · W2_I3_DOMAIN · W2_I4_WINDOW · W2_I5_TOTAL
E1_NO_LEVELS · E1_NO_ZONES · E1_ATTESTATION_DRIFT · E1_TOO_FEW_ZONES · E1_CONTROL_VOID
E1_ATTESTATION_FAILED (refusal) · E1_RECEIPT_INCOMPLETE (refusal) · ZFP_CROSSCHECK_CONFLICT (finding)
ZFP_INPUT_MISSING · ZFP_INPUT_INVALID · ZFP_PILLAR_UNKNOWN · ZFP_TIER_UNCLASSIFIED
ZFP_MODIFIER_VALUE · ZFP_RAW_MISMATCH · ZFP_CLAMP_MISMATCH · ZFP_VALUE_MISMATCH · ZFP_OUT_OF_RANGE
E2_NO_SPANS · E2_NO_CANDIDATES · E2_ALL_FALSIFIED · E2_ENERGY_VETO · E2_CONFIDENCE_INVERSION
E2_CHAIN_ORDER · E2_CHAIN_CYCLE · E2_DAY_ASSIGNMENT_FAILED · E2_ALTERNATIVE_INVALID
E3_ANCHOR_TF_INVALID · E3_TP_NULL · E3_RRR_BELOW_FLOOR · E3_CONFIDENCE_BELOW_GATE
E3_TIER_NOT_EMITTABLE · E3_DAILY_CAP · E3_WEEKLY_CAP · E3_DAY_MISMATCH · E3_ANCHOR_TYPE
E3_SL_BUFFER · E3_TP_NOT_ON_PATH · E3_DUPLICATE · E3_VETO · E3_REACTION_INVALID
G_STALE_SUBJECT · G_CONTROL_VOID · G_CRITICAL · G_CLAIM_CONTRADICTION · G_MANDATE_FAILED · G_DISAGREE
CARD_BAKED_PAYLOAD · CARD_OVERFLOW · CARD_SEAL_CONFLICT · CALIBRATION_INFEASIBLE
E3_NO_SETUPS (a RESULT, not an error)
```

---

## §P9 · WHAT THIS PSEUDOCODE CHANGED, AGAINST THE BIBLES

| the law | where it lands in this pseudocode |
|---|---|
| IL-03 evidence in state, standard in instructions | every `Question.requires` path is resolved before the call; the receipt IS the E1 evidence |
| IL-01 one snap judgment | every question ≤60 words, one observable, one answer |
| IL-17 never count/compute/dates | every number (ZFP, RRR, composite, pips, counts) is computed in code |
| IL-02 primitive by shape | noul for attestation, score for completeness/energy/probability, choice only when ≥2 licensed shapes |
| IL-06 questions are blind | stage A / B / C are separate requests; answers join the next state |
| IL-05 bounded state | ≤8 zones × 4 questions; ≤8 candidates × 5; the 64-question cap is the binding limit |
| IL-07 derived thresholds | `calibrate()` writes the policy; a missing source is `E_UNCALIBRATED` |
| IL-09 the ladder | `decide()` returns ALLOW / ESCALATE / DENY; ESCALATE holds, never emits |
| IL-10 code owns the branch | every verdict, veto, cap, eviction and dedupe is code |
| IL-11 cache-first | the fingerprint covers model ⊕ schema ⊕ canonical(redact(state)) |
| IL-15 ledger | one row per model call, written inside `ask()` |
| IL-16 completion is a fact | L4 compares the frame by sha; G3/G4 are gates, not verdicts |
| L-6 weakest clause | `decide()` returns `Math.min(...clauses)` |
| L-9 cheapest-first | invariants → kill clauses → geometry all run before any model call |
| L-10 coarse filter | the code candidate filter is the coarse gate; the Score gates rank within it |
| L-22 context limit | `tokens(state) > STATE_CAP` is a fatal, never a truncation |
| L-15/L-16 control + adversarial | `calibrate()` reports false-allow separately on both sets |
| L-21 named gaps | the engine registry lists what E1/E2/E3 do NOT decide |
