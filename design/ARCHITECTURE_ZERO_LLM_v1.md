# PLUTUS VISION — THE ZERO-LLM RUNTIME
## v1 · design · 2026-10-24 · grounded in the canon read this session

**The constraint (operator, verbatim):** *no LLMs, no agents. Deterministic mechanical code only,
plus System One models, on Cloudflare Workers + Durable Objects (+ pi-durable where relevant).*

**The verdict before the design:** the canon already demanded this. Iron Law 1 — *"The model is just
electricity. ALL intelligence is in the code."* R32 — *"decision making machine that deterministically
makes intelligent decisions. 95% deterministic."* Illusion 1 documents the exact failure of doing
otherwise: *"You give the model chart data and ask it to pick entries. It hallucinates prices, invents
zones, and produces confidently wrong setups."*

So this is not a new architecture. It is the canon's own architecture with the last two LLM-shaped
holes closed: **data ingestion** and **render verification**.

---

# §1 · WHAT THE CANON FIXES (cannot be redesigned)

From `cards/ARCH-*.md` and `design/DESIGN_BLUEPRINT_v1.2_AUTHORITATIVE.md`:

| invariant | source | consequence for any model |
|---|---|---|
| three engines, three questions | ARCH-LAYER-STACK (`:14`) | E1 geography · E2 timing · E3 action. A model may not answer another engine's question. |
| firewall AFTER setups | ARCH-LAYER-STACK (`:15`) | post-processing only; a firewall fed a zone cannot evaluate |
| one TP, exactly 7 gates | ARCH-INVARIANTS (`:15`) | an eighth gate or a TP ladder is a defect by construction |
| per-pair independence, DXY first | ARCH-INVARIANTS (`:16`) | DXY→pair level conversion FORBIDDEN |
| report generated ONCE | ARCH-INVARIANTS (`:17`) | the week is sealed; daily re-analysis flags, never overwrites |
| **the card carries NO classification** | blueprint §7 (`:399`) | *"Every shape, span and setup is computed by the kernel from bars."* A card carrying a shape is a **BAKED PAYLOAD** |
| card = Class B only | blueprint §7 | expiry walls · strike notionals · open interest · NY cut times · E1 IP zone assignment |
| confidence composite | blueprint §5 (`:211`) | (confluence/12)×40 + (notional/3.5B)×20 + 20 shape + 10 redfolder + (1−ZFP%)×10 ± 10, cap 100, gate ≥65 |
| tiers | blueprint §5 | GOD ≥90/RRR≥3.0 · HIGH ≥80/RRR≥2.5 · STANDARD 65-79 calibration-only · below 65 DELETED |
| count | blueprint §5 | 3/day · 12/week · evict weakest, never reject a stronger newcomer |
| Pine has no HTTP | blueprint §8 (`:409`) | delivery is `input.string` paste; the script is written ONCE and parses the card |

**These are the rails. The design below moves nothing on them.**

---

# §2 · THE TWO HOLES THIS CLOSES — and why they were holes

```
HOLE 1 · INGESTION
  S2 needs Protocol A option walls: strike · notional (BILLIONS) · open interest · NY cut.
  S3 needs red-folder calendar days.
  Today those arrive by eye (the old prompt→PDF loop) or by bespoke scrapers written per source.
  Nothing in the canon says HOW; it says the numbers must be exact and never divided by 1000.

HOLE 2 · RENDER VERIFICATION
  G1 has 20 arithmetic checks (C01-C20) over pixels: candle geometry, largest-fill %, band coverage,
  label bands, magenta. It cannot read a LABEL'S TEXT and it cannot say WHAT is wrong when a check fails.
  Today a human looks. The last build proved a human can be absent and the chart still ships.
```

Clairic closes hole 1 outright and hole 2 partially. **Clef closes neither at runtime** — see §6.

---

# §3 · THE PRIMITIVE MAP — who computes what, per stage

Every stage's owner, with the reason. `CODE` = deterministic, no model, ever.

| stage | what it produces | owner | why |
|---|---|---|---|
| S1 HARVEST | 4H/1H/30m bars + DXY | **CODE + external leg** | TradingView is the sole OHLC source (Iron Law 10). Workers cannot run the browser. |
| S2 INSTITUTIONAL | Protocol A walls: `[strike, notional_b, oi, cut, expiry]` | **CLAIRIC** (`list` of typed rows) + CODE validation | the page is unstructured; the BILLIONS convention is a code check, not a model instruction |
| S3 CALENDAR | red-folder dates + session notes | **CLAIRIC** (`list(date)` + `text`) | dates with years omitted; Clairic resolves them from `reference_date` |
| S4 E1 FACE B | OB/S/D/LQZ zones, sweeps, 9 pillars, confluence | CODE | arithmetic over bars |
| S5 E1 FACE A | 5 IP roles, degree, tier, ZFP + receipt | CODE | ZFP is base-band + modifiers (E1-ZFP-BASE), never a model estimate |
| S6 ZONE MAP | zoneId · family · role · tf · top/bottom · confluence · zfp · receipt | CODE | assembly |
| S7 E2 CASCADE | 10 shapes, first-match-stops, spans | CODE | **the card may not carry this** |
| S8 E3 SETUPS | entry · SL · TP · RRR · confidence | CODE | the triple loop |
| S9 GATE | conf ≥65 · RRR ≥2.5 · tier · eviction | CODE | 7 gates exactly |
| S10 EMIT CARD | `trident-workflow-v1` JSON | CODE + DO seal | one write per week |

**Cloudflare's own guidance agrees, in their words:** *"Extract the inputs with Clairic and do the math
in code"* (changelog 2026-10-19). That is S2/S3 in one sentence.

---

# §4 · THE DEPLOYMENT TOPOLOGY

```
                    ┌──────────────────────────────────────────────┐
   Mon 04:00 UTC    │  CRON TRIGGER  (weekly: options+calendar)     │
   daily 06:00 UTC  │  CRON TRIGGER  (daily: bars refresh)          │
                    └───────────────────┬──────────────────────────┘
                                        ▼
                    ┌──────────────────────────────────────────────┐
                    │  WORKFLOW  pv-week   (durable steps, retries) │
                    │                                              │
                    │  1 fetch pages ──────────────► R2 (raw)       │
                    │  2 CLAIRIC extract ──────────► typed + spans  │
                    │  3 validate in code ─────────► BILLIONS check │
                    │  4 bars ingest ──────────────► R2 + D1        │
                    │  5 E1/E2/E3 (Python Worker) ─► card nodes     │
                    │  6 gate S9 ──────────────────► emit/refuse    │
                    │  7 seal card ────────────────► DO + sha256    │
                    └───────────────────┬──────────────────────────┘
                                        ▼
        ┌───────────────────────────────┼────────────────────────────────┐
        ▼                               ▼                                ▼
┌──────────────────┐        ┌───────────────────────┐        ┌──────────────────────┐
│ DURABLE OBJECT   │        │ D1 · JOURNAL          │        │ R2 · EVIDENCE        │
│ week:<week>      │        │ one row per cast:     │        │ raw pages · frames · │
│ seals Class-B +  │        │ run · node · verdict  │        │ cards · shas         │
│ the card; 1 write│        │ · evidence            │        │                      │
│ 10 GB SQLite     │        └───────────────────────┘        └──────────────────────┘
└──────────────────┘
                                        ▼
                    ┌──────────────────────────────────────────────┐
                    │  DELIVERY  · the card JSON is pasted into     │
                    │  the indicator's `input.string` field; the    │
                    │  .pine is written ONCE and parses it          │
                    └──────────────────────────────────────────────┘
```

**Why a Durable Object and not D1 alone:** the one-write law. Iron Law 4 — *the report is generated
once*. A DO keyed `week:<week>` gives a single serialisation point and 10 GB of SQLite per object, so a
year of weekly cards for four pairs (~208 cards, ~10 MB) fits with three orders of magnitude to spare.

**Why Workflows and not an agent loop:** each step is named, retryable, and independently observable;
`step.sleep` up to 365 days; 10,000 steps; 30 s CPU per step (5 min configurable). The workflow IS the
"sidecar agent" — it has no judgement, only order.

---

# §5 · THE CARD — one change, and it is a provenance change

The schema stays `trident-workflow-v1` (blueprint §6 `:246`). Nodes, edges, suppressed, journal_seed: unchanged.

**The one addition:** every Class-B value carries the evidence that produced it.

```json
"w-otc-13500": {
  "kind": "zone.wall",
  "spec": {
    "wall": "OTC 1.3500",
    "notional_b": 1.24,
    "open_interest": 8120,
    "cut": "NY 10:00",
    "expiry_ms": 1783735200000,
    "provenance": {
      "source": "protocol-A/2026-07-06/p3.png",
      "fields": {
        "notional_b":     { "value": 1.24, "confidence": 0.98, "p_null": 2e-04, "span": [812, 818] },
        "open_interest":  { "value": 8120, "confidence": 0.94, "p_null": 1e-03, "span": [840, 848] },
        "cut":            { "value": "NY 10:00", "confidence": 0.99, "p_null": 1e-05, "span": [860, 869] }
      },
      "model": "clairic",
      "passes": 2
    }
  }
}
```

Consequences:
- `p_null > null_threshold` → the field is **INCONCLUSIVE**, and an INCONCLUSIVE zone draws NOTHING
  (blueprint §7 drawing order). The gate gets its fourth verdict for free.
- Every number is traceable to a span in the source page, so a wrong wall is auditable to a character
  offset — the exact property the old PDF loop lacked.
- **A shape, a span or a setup may never appear in `provenance`.** If it does, the card is a BAKED
  PAYLOAD and the kernel's no-card degradation becomes impossible.

---

# §6 · THE GATE — five layers, and where a model is allowed

```
G0  DOCTOR        rig up · right build · port ours                       CODE
G1  ARITHMETIC    C01-C20 over pixels (BUILT, 1,061 lines)               CODE
G2  STRUCTURAL    schema · ancestry · receipt present · no baked payload CODE
G3  SEMANTIC      mandate_met · claim_contradicted                        CLEF or IMAJEV  (build-time)
G4  PIXEL FIELDS  label texts · distinct families · zone count            CLAIRIC
G5  AGREEMENT     all agree AND the known-BAD control fails               CODE
```

**G4 is narrower than "vision judge", and that is deliberate.** C01-C20 already measure geometry, fill
ratios, band coverage and hue families. What they cannot do is read a **label's text** — so the honest
Clairic fields are:

```
fields: {
  label_texts:      { type: "list", items: "text",  instructions: "every zone label string, verbatim" },
  tier_labels:      { type: "list", items: "text",  instructions: "GOD_TIER / HIGH / STANDARD / none" },
  zfp_labels:       { type: "list", items: "text",  instructions: "each ZFP string as drawn, incl 'n/a'" },
  distinct_families:{ type: "list", items: "text",  instructions: "distinct zone colours by role name" },
  zone_count:       { type: "number", integer: true, min: 0, max: 40 }
}
```

Then **code** compares `zfp_labels` to the card's `zfp` values, and `zone_count` to `len(zone nodes)`.
The model reads; the code decides. This is the same law as S2.

**Why G3 is build-time, not runtime.** At runtime no agent exists, so nothing makes a claim to
contradict. `claim_contradicted` is the gate for the *builder* — the thing that writes the card — and
that is exactly where the last build failed.

---

# §7 · COST, MEASURED — the whole runtime is free at our volume

| work | calls/week | tokens/call | tokens/week | neurons/week |
|---|---|---|---|---|
| Protocol A extraction | 1-4 | 1,200-2,000 | ~6,000 | ~55 |
| calendar | 1 | 600 | 600 | ~5 |
| G4 pixel fields (per verified render) | 10-20 | 1,400 | ~25,000 | ~230 |
| G3 semantic (build-time only) | 0-20 | 2,100 | ~42,000 | ~900 (if Clef) |

Free allowance: **10,000 neurons/day = 70,000/week**. The worst case above is ~1,200/week. **~2% of the
free tier.** At paid rates this is under **$0.30/month**.

---

# §8 · WHAT IS VALIDATED vs UNPROVEN (do not paper over this)

**Validated this session**
- the two primitive families and their exact contracts (schemas read byte-for-byte)
- Clairic's forecast on a seasonal daily series: 3.3% MAPE, 17/21 inside the 80% interval
- Clairic's limits, from the vendor: multi-step arithmetic unreliable → extract and compute in code;
  forecasts flatten; no event awareness; intervals can run narrow on unfamiliar data
- the existing gate separates good from bad frames (self-test rc=0) with 20 arithmetic checks
- the local lane (Imajev) serves text + image through `/v1/systemone`, probabilities verified flipping
  on labelled frames (0.651/0.214 and 0.097/0.733)

**Unproven — each is a P0 gate, not an assumption**
1. **128 MB Worker memory** for the Python E1/E2/E3 engine (Pyodide + numpy). Measure or the whole CF
   compute plane is unvalidated.
2. **Clairic's accuracy on OUR Protocol A pages** — no one has run it on option-chain screenshots.
3. **Whether G4 needs a model at all** beyond label OCR; C01-C20 may already cover the rest.
4. **Clairic's `estimate` on ZFP modifiers** — tempting, but ZFP is canon arithmetic; a model estimate
   would be a doctrine violation, not an optimisation.

---

# §9 · TWO EXTERNAL LEGS THE CONSTRAINT CANNOT COVER (named, not solved)

| leg | why | contract |
|---|---|---|
| **IN · bars** | Iron Law 10: *"NEVER use headless browsers. Headed Chrome port 9228."* Workers cannot run Chrome; TradingView is the sole OHLC source. | the existing rig POSTs bars to an authenticated Worker route → R2 + D1. One signed payload, one schema, replayable. |
| **OUT · Pine** | blueprint §8: Pine has no HTTP. Delivery is `input.string`. | the Workflow emits card JSON + sha; a human pastes it, or a script drives the paste. The IDE never fetches. |

If the operator wants the IN leg inside Cloudflare, the only substitute is a paid market-data API — a
**data contract**, and it contradicts "TradingView is the sole OHLC source". That is a ruling, not an
engineering choice.

---

# §10 · THE SIX DECISIONS THE OPERATOR MUST RULE BEFORE P0

| id | decision | options | cost of each |
|---|---|---|---|
| **A** | bars leg | (a) keep the host TV rig (canon) · (b) paid data API inside CF | (a) one host dependency · (b) breaks Iron Law 10, needs a new source contract |
| **B** | compute host | (a) Python Worker · (b) CF Container · (c) host | (a) 128 MB unproven · (b) not in the allowed list · (c) leaves the constraint |
| **C** | card delivery | (a) `input.string` paste now · (b) dashboard tab later | (a) one paste/week · (b) a second surface to verify |
| **D** | runtime judge | (a) none (pure code) · (b) Imajev (free, local) · (c) Clef (paid, calibrated abstention) | (a) no semantic layer at runtime · (b) a host dependency · (c) a vendor dependency for a layer with no runtime claim to judge |
| **E** | Clairic scope | (a) ingest + G4 fields · (b) also `estimate` for modifiers · (c) also `forecast` as a soft prior | (b) violates ZFP-is-arithmetic · (c) vendor says not designed for it |
| **F** | blueprint D1/D2 | LuxAlgo purge vs keep vs relabel · strip 15m now vs at P1 | still open from v1.2 §16 — **blocking P0** |

**Recommendation, stated once:** A(a) · B(a) with a measured fallback to B(c) · C(a) · D(a) at runtime
with D(b) as the build-time judge · E(a) · F = purge + strip now (the blueprint's own recommendation).

---

# §11 · P0 — the first six artifacts, in order

```
1  MEASURE the Python engine in a Worker            memory + CPU + wall on a real week
     -> go/no-go for decision B. Nothing else starts before this number exists.
2  CLAIRIC SCHEMA for Protocol A                    fields, types, bounds, null_threshold
     -> run it on 3 real option pages; score against the existing scraper
3  CARD PROVENANCE PATCH                            add {value,confidence,p_null,span} to Class B
     -> schema v1 -> v1.1; the kernel ignores unknown keys (verify that first)
4  G4 FIELD SCHEMA                                  the five fields in §6 + the code-side comparator
5  G3/G4 INTO gates/GATE.sh                          with the calibration sweep + positive/negative controls
6  THE PRE-COMMIT HOOK                              no PASS row -> the commit cannot land
```

Items 3-6 are the same gate machinery the last build lacked. Item 1 is the only one that can invalidate
the entire platform choice, which is why it is first.

---

# §12 · CORRECTIONS AND THE CONFLICT REGISTER (four-reader audit, 2026-10-24)

Four readers covered the corpus in full: 163 cards (39 LAW · 47 ENGINE · 48 MECHANIC · 14 REF · 4 INFRA ·
11 RULING), the three workflow authorities (871 + 1,211 + 233 lines), the five binding-law docs plus the KG
map's R01-R38 and HL-01..HL-16, and the four live Cloudflare model pages. They returned **29 conflicts**.
Below are the ones that change the design or block the build.

## 12.1 · The canon basis for "no LLM" — stated precisely

**There is no verbatim no-LLM ruling in the corpus.** My §2 implied otherwise. What exists:

| source | verbatim | what it establishes |
|---|---|---|
| `OPERATOR_RULINGS_PV.md:10` (R-01) | *"the explicit fucking requirement for this build is that this PDF report as a step is removed. And this is done **entirely by code in real time**."* | the report step is code, not a model |
| `Knowledge_Graph_Map_v2.md:1017` (R32) | *"decision making machine that deterministically makes intelligent decisions. **95% deterministic**"* | determinism target |
| `cards/ARCH-BUILD-DOCTRINE.md:14` (Iron Law 1) | *"**The model is just electricity. ALL intelligence is in the code.**"* | the model carries no intelligence |
| `cards/ARCH-BUILD-DOCTRINE.md:20` | *"MUST keep the LLM out of trading decisions — no chart reading, no invented zones, no chosen entry prices."* | LLM excluded from decisions, not from all software |

**So the absolute "no LLM anywhere" rule is the operator's live instruction of 2026-10-24, not a written
canon ruling.** The canon points the same way on every axis it addresses, which is why the architecture
below satisfies both. But the record should not pretend the stronger rule was always written.

## 12.2 · TWO BUILD BLOCKERS found by the audit (fix before any Pn turn)

```
BLOCKER 1 · THE SEAL IS STALE                          BP:611-612 vs WF:580/588/1110
  BP names the P1 baseline: Checkpoints/.../plutus-vision-v2.pine, 1,834 lines, 70 inputs,
  33 draw calls, sha ecc7976c…
  WF's P1.T1 gate requires "the seal is 0d20e831" (a different file, 1,270 lines).
  WF:588 is a GATE, not a note -> every P1 turn hard-REFUSES until the seal is re-derived
  from the checkpoint BP names.

BLOCKER 2 · THE KERNEL REFUSAL CONTRADICTION            BP:484-485,343 vs WF:676-677,680-681
  BP: an UNKNOWN KIND refuses THE WHOLE CARD (draw the standalone layer only).
  WF: an unknown-kind node is NODE-LOCAL (draw N-1 bands).
  BP wins by the precedence chain -> WF's P2.T1 gate as written FAILS a kernel that obeys
  the higher authority.
```

Both are the same defect class: **a gate whose constant was recorded from a different artifact than the
authority names.** They must be reconciled before P1/P2 dispatches, or the build refuses itself.

## 12.3 · THE VOID CITATION (a P2 exit that cannot be satisfied)

`BP:591` and `BP:721` make "§4.7 ZFP calibration" a P2 exit. **There is no §4.7** — BP §4 is the data
plane, and no ZFP-calibration spec exists anywhere in the three authorities. P2's stated exit is therefore
unsatisfiable until a ZFP-calibration document is authored. This is a GAP, not a choice.

## 12.4 · THE REST OF THE REGISTER — what each one changes

| # | conflict | winner | effect on THIS design |
|---|---|---|---|
| C-1 | P0 = THE WIRE (BP:584) vs P0 = THE INSTRUMENT (WF:494) | **BP** (authority #2 > #3) | my §11 "P0 = measure first" is the *precondition set*, not P0's content. P0 is the wire; the instrument is what makes the wire judgeable. §11 stands as a sequencing note, retitled. |
| C-3 | BP's own example card has zfp 12.0 but receipt base+mods = 50 | **the rule (A4)** | the specimen card is invalid under its own gate → regenerate it as the schema fixture. |
| C-4 | "eight metrics" vs F1..F9 | **F9** (the gates name F9) | my §6 G1 inherits NINE metrics, not eight. |
| C-5 | "four laws make a gate" vs G1..G5 | **five** | G5 (producer ≠ grader) is mandatory — it is exactly the separation my §6 relies on. |
| C-7 | RRR ≥2.5 (BP:202) vs ≥2.0 (BP:230) | **both, scoped** | 2.5 for anything EMITTED; 2.0 describes the non-emitted calibration band. Any drawn setup: 2.5. |
| C-8 | replay "a random past Tuesday" (BP:491) vs Monday 09:00 London (WF:78, operator verbatim) | **Monday 09:00** | the replay gate in my §6 must anchor Monday→Friday, not a random day. |
| C-9 | "each phase exits on three pairs" vs the per-phase blocks | **per-phase blocks** | P0/P6/P7 are NOT judged on three pairs. |
| C-10 | §4.7 ZFP calibration | **void** | see §12.3 — P2 cannot exit yet. |
| C-12 | agent display hardcoded `:4` vs derive-from-`up` | **derive** | any rig code in the runtime reads the display from `up`, never a literal. |
| C-14 | absent receipt → INCONCLUSIVE (BP:488) vs not drawn (BP:535) | **layered, all hold** | cast=INCONCLUSIVE → zero pixels → table row. My §5 provenance rule is consistent. |
| C-16 | 13 anti-patterns (BP) vs 14 (WF) | **14** (WF extends, not contradicts) | A14 is live; the anti-pattern gate runs 14 rows. |
| Canon-1 | RRR floor 1.0 / 2.0 / 2.5 across docs | depends on doc | the runtime must read the floor from ONE constant with a cited ruling, not from prose. |
| Canon-2 | SL buffer "inside" vs "outside" the next rung | unresolved | **operator ruling required** — it changes every SL by a buffer width. |
| Canon-3 | R15 "no DXY correlation" vs LAW 20 hard DXY filter + R12 "1:1 EXACT inverse" | unresolved | **operator ruling required** — DXY is an E1 pillar AND a forbidden correlation. |
| Canon-4 | R17 "spot irrelevant" vs LAW 6 + AD §4 spot-relative entries | unresolved | **operator ruling required** — it decides whether entry prices are spot-relative. |
| Canon-5 | D17's 36-pip hard ceiling rejects 16% of the 38-winner forensic | unresolved | **operator ruling required** — the ceiling and the winners disagree by 16%. |

## 12.5 · THE DANGLING ANCHOR (a corpus-integrity defect)

All 38 rulings' enforcement lines and all 16 hard limits' source anchors point at
`PLUTUS_MASTER_CONTEXT_INJECTOR.md §1.1/§1.11`. **It does not exist under PLUTUS_VISION**, while **59 documents in this tree cite it.** The path named in
the ruling text is `PLUTUS/agent/MASTER_CONTEXT/…`, and it **does resolve there** — verified this session:
`/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/agent/MASTER_CONTEXT/PLUTUS_MASTER_CONTEXT_INJECTOR.md`,
1,324 lines (plus a checkpoint copy under `PLUTUS/agent/Checkpoints/pre-v5-baseline-4.5.3/`).

So the defect is **cross-tree, not dangling**: every one of the 59 references inside PLUTUS_VISION points
out of the project. A reader confined to this tree cannot follow a single enforcement anchor. The
consequence stands — no gate this build adds cites that file as its proof; each cites its own script, its
own exit code and its own ledger row.

**Consequence for the architecture:** no gate may cite that file as its enforcement proof. Any gate this
build adds cites its own script and its own exit code — which is the rule anyway.

## 12.6 · WHAT THE CARD AUDIT ADDS

163 cards, and the three-engine split is confirmed at every level: E1 (geography, 9 pillars, ZFP with a
mandatory receipt), E2 (forward chain, transitions conditioned on the TARGET zone's ZFP), E3 (triple loop,
one TP, 7 gates). Two card-level rules bind the architecture directly:

- **`E1-ZFP-RECEIPT`** — *no ZFP without base + each modifier cited; no setup without a cited ZFP.* My §5
  provenance block is the mechanisation of this card, extended to the Class-B inputs.
- **`E2-ZFP-TARGET-TRANSITIONS`** — the next shape is decided by the target zone's ZFP band
  (<15 SS · <20 RWL · 20-40 R · >45 BS · >60/>80 PBS) and **overrides momentum**. That is E2's core
  arithmetic and it is exactly what a Clairic `forecast` must never touch.

## 12.7 · REVISED P0 SEQUENCE (per C-1: P0 is the wire; these are its preconditions)

```
PRE-P0  (must exist before the wire can be judged)
  a  reconcile BLOCKER 1 (the seal) and BLOCKER 2 (kernel refusal)  -> one constant, one ruling
  b  author the ZFP-calibration spec that BP §4.7 cites but never wrote
  c  MEASURE the Python engine in a Worker (128 MB)                  -> go/no-go for decision B
P0      THE WIRE: sidecar skeleton + card schema + pine shell, gate rc=0 on a real week
```

Six operator rulings are now outstanding before P0's first line of code: **Canon-2 (SL buffer), Canon-3
(DXY), Canon-4 (spot), Canon-5 (36-pip ceiling)**, plus blueprint **D1 (LuxAlgo purge)** and **D2 (15m
strip)**. Those are not engineering choices; each one silently changes every emitted setup.
