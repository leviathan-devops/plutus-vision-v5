# PLUTUS VISION — Clairic / Clef / Imajev: the model decision and the no-LLM architecture

Status: **decision-ready on evidence; one measurement outstanding (the local bake-off)** · 2026-10-24
Author: director session · Method: primary-source reads (Cloudflare docs + raw schemas + pricing page +
HF model cards + the public Decision Index data file), then the local canon (163 cards, the knowledge-graph
map, design blueprint v1.2), then dispatch of 5 read-only research scouts on the angles I could not read
directly.

Everything below is either QUOTED from a primary source with its URL, MEASURED on this host, or COMPUTED
from the published pricing table with the arithmetic shown. Nothing is recalled from training.

---

## 0 · Provenance — every source this report rests on

| # | Source | What it establishes | Date |
|---|---|---|---|
| S1 | https://developers.cloudflare.com/workers-ai/models/clairic/index.md | Clairic's purpose, 65,536 ctx, $0.10/M, vision | read 2026-10-24 |
| S2 | https://developers.cloudflare.com/workers-ai/models/clairic/schema-input.json | the 9 field types, `estimate`/`forecast` params, `null_threshold` | read 2026-10-24 |
| S3 | https://developers.cloudflare.com/workers-ai/models/clairic/schema-output.json | `p_null`, `span`, `p10`/`p90`, `steps`, `usage.passes` | read 2026-10-24 |
| S4 | https://developers.cloudflare.com/workers-ai/models/clef-omni/index.md | omni: 64k ctx, $0.15/M, audio+video, token math per modality | read 2026-10-24 |
| S5 | https://developers.cloudflare.com/workers-ai/models/clef-omni/schema-input.json | noul/choice/score contract, 1–64 questions, 2–255 options, 2–10 levels | read 2026-10-24 |
| S6 | https://developers.cloudflare.com/workers-ai/models/clef/index.md | clef: 27B, 65,536 ctx, $0.24/M | read 2026-10-24 |
| S7 | https://developers.cloudflare.com/workers-ai/platform/pricing/index.md | per-model neuron rates, 10,000 neurons/day free, $0.011/1k neurons | read 2026-10-24 |
| S8 | https://huggingface.co/Cloudflare/clef-omni/raw/main/README.md | "The Clef-Omni API is fully compatible with Jev and SystemOne" · Qwen3-Omni-30B-A3B base · joint schema head · the Decision Index table | card, committed 2026-10-09 |
| S9 | https://blog.cloudflare.com/clef-faster-cheaper-multimodal/ | clef-flash cut to $0.038/M; flash ctx 24k hosted (256k trained); latency 130 ms text / 150 ms image / ~1.5 s for 21 s video; "Clef models are not Large Language Models" | news post |
| S10 | https://clef-evals.workers-ai-mle.workers.dev/data/leaderboard.json | the 38-benchmark Decision Index panel, 73 models, per-model areas/latency/ECE/Brier, `self_reported` flags | generated 2026-10-01 |
| S11 | https://huggingface.co/mohit67890/imajev-4b/raw/main/README.md | Imajev-4B: Apache-2.0, base Qwen3.5-4B, image-text-to-text, "Jev's contract, now with images" + `unknown_probability`/`abstained`, state limit 32 KB | card |
| S12 | https://developers.cloudflare.com/durable-objects/platform/{pricing,limits}/index.md | DO: 100k req/day free · SQLite storage 10 GB per object · 128 MB memory | read 2026-10-24 |
| S13 | https://developers.cloudflare.com/workflows/reference/limits/index.md | Workflows: 10,000 steps (25,000 max), 30 s CPU/step (5 min configurable), `step.sleep` 365 d, 100/50,000 concurrent | read 2026-10-24 |
| S14 | https://developers.cloudflare.com/workers/platform/limits/index.md | Workers: CPU 10 ms free / 5 min paid; **memory 128 MB on both**; cron CPU 30 s | read 2026-10-24 |
| S15 | https://developers.cloudflare.com/workers/languages/python/{index,packages}/index.md | Python Workers are first-class; pure + Pyodide packages; bindings to D1/DO/R2/Queues/Workflows/AI | read 2026-10-24 |
| S16 | PLUTUS_VISION/cards/ARCH-*.md + MASTER_CONTEXT/reports/Knowledge_Graph_Map_v2.md | the canon: 3 engines, firewall, invariants, 38 rulings, 16 hard limits, Iron Law 1, R32 | local |
| S17 | this host, live | Imajev-4B serving :8008 (vision) / :8090 (systemone) — verified by the identity predicate | 2026-10-24 |

---

## 1 · THE CORE DISTINCTION — two primitive families, and why it matters

The single most important finding of this research: **these are not competing versions of the same thing.
They are two different primitives, and Plutus needs both.**

```
┌──────────────────────────────┬───────────────────────────────────────────────┐
│  FAMILY A · DECISION         │  FAMILY B · TYPED EXTRACTION                  │
│  (Jev / SystemOne / Clef)    │  (Clairic)                                    │
├──────────────────────────────┼───────────────────────────────────────────────┤
│  INPUT   state + questions   │  INPUT  state (+ up to 4 images) + fields     │
│  OUTPUT  one distribution    │  OUTPUT  one TYPED VALUE per field            │
│          per question        │          + span + p_null + interval           │
│  TYPES   noul / choice /     │  TYPES  text / number / date / time /         │
│          score               │         datetime / duration / list /         │
│                              │         estimate / forecast                   │
│  QUESTION it answers         │  QUESTION it answers                          │
│   "which of these is true?"  │   "what IS it, and how sure am I?"            │
│  NOTHING GENERATED           │  NOTHING GENERATED                            │
└──────────────────────────────┴───────────────────────────────────────────────┘
```

Both families are **zero-generation**: Clef "returns a probability for every allowed option of every
question" (S5) and Clairic returns "one answer per field… `value` is null when the input does not
determine it" (S3). Neither writes prose. That is what makes an LLM-free runtime possible at all.

### 1.1 Clairic's field contract (verbatim from S2)

| field type | returns | params |
|---|---|---|
| `text` | the exact **span** of `state` (+ character offsets) | `instructions` |
| `number` | a value | `unit`, `integer`, `decimals` 0–6 |
| `date` / `time` / `datetime` | a normalised value | `instructions`, `reference_date` at request level |
| `duration` | a duration | `unit` ∈ seconds…years |
| `list` | list of `text`/`number`/`date` (+ `spans`) | `items` |
| `estimate` | `value`, `mean`, `median`, **`p10`, `p90`**, `p_below`, `p_above` | `min`, `max`, `step`, `scale` linear\|log |
| `forecast` | `steps: [estimate…]` | `horizon` 1–64, `interval` step\|minute…year, `scale` |

Plus, per field and per request: **`p_null`** (the probability the input does not determine the field — with
`null_threshold`, default 0.5, deciding abstention) and `options.include_quantiles` for 99 percentiles.
The engineering consequence: **a calibrated abstention and an uncertainty interval arrive as first-class
outputs, not as prompt instructions.**

### 1.2 Clef's contract (S5) — identical to our local lane

`{state, questions:{id:{type:noul|choice|score, instructions, criteria}}}` → `{answers:{id:{noul|choice+
probabilities+confidence|score+legend+probabilities+confidence}}, usage}`. Same 1–64 question cap, same
letter semantics. Cloudflare's own card says it plainly: **"The Clef-Omni API is fully compatible with Jev
and SystemOne"** (S8). Consequence: adding a Clef lane is a **base-URL change**, not a client rewrite.

---

## 2 · THE INCUMBENT — what is actually installed here

| | Imajev-4B (installed, FREE) |
|---|---|
| weights | `imajev-4b-Q6_K.gguf` (3.4 GB) + `imajev-4b-mmproj-f16.gguf` (672 MB) |
| base / licence | Qwen3.5-4B · Apache-2.0 (S11) |
| API | `POST :8090/v1/systemone` — JSON **and** `multipart/form-data` (image[] + request) |
| abstention | trained: carries `unknown_probability` + `abstained` (S11) |
| state limit | **32 KB** (S11) — and our adapter caps at 24,000 chars for the gate's latency budget |
| published scores | JevBench v1.4.2.2 **#1 of 91** (67.4, ahead of Jev 1.13.0 at 63.3) · Image JevBench v0.1.3 **#1 of 49** (76.39) · DecisionBench eng v1 **#3 of 56** (79.65) (S11) |
| cost | $0 · local · 95–285 ms text, 1.5–1.9 s image (measured this session) |
| failure mode | no vendor, no SLA; a bad GGUF or a broken adapter is ours to fix (one such defect was fixed today) |

**Measured on our own fixtures today (after wiring the image path):**

```
frame            has_chart  blank
W0.T1.clean        0.651    0.097
W0.T1.corrupt      0.214    0.733      ← polarity flips on both questions
choice on clean  = "candlestick chart" 0.830
choice on corrupt= "solid block"       0.911
```
That is the gate's core question answered with a real distribution, locally, for $0.

---

## 3 · THE MEASURED GAP — and exactly how strong the evidence is

The only public panel that scores **both** Cloudflare's family and Jev is the community Decision Index
(S10, generated 2026-10-01, 38 benchmarks, 5 weighted areas).

| model | knowledge | language | retrieval | tools | arts | INDEX | median latency | provenance |
|---|---|---|---|---|---|---|---|---|
| **Clef** (27B) | 0.51 | 0.61 | 0.63 | **0.81** | 0.48 | **61.21** | 209 ms | self-reported, 36/38 |
| Jev (TypeSafe) | 0.51 | 0.62 | 0.55 | 0.75 | 0.38 | 57.91 | 524 ms | community, 38/38 |
| **Clef-flash** (9B) | 0.50 | 0.53 | 0.52 | **0.82** | 0.50 | **57.07** | **39 ms** | self-reported, 36/38 |
| JevK5 (4B) | 0.23 | 0.43 | 0.46 | 0.52 | 0.28 | 38.81 | 22 ms | community, 38/38 |

**Three honesty constraints on that table, stated so nobody over-reads it:**

1. **Clef's rows are `self_reported: true`, 36/38 coverage, with `ece` and `brier` NULL.** Jev's and
   JevK5's are `self_reported: false`, 38/38, with calibration published (JevK5 ECE 0.0268).
2. **The panel does not contain Imajev.** The two leaderboards that do rank Imajev (JevBench, Image
   JevBench) do not contain Clef. **No published head-to-head exists.** Any claim that "Clef beats Imajev"
   is an inference across disjoint panels, not a measurement.
3. **The panel's own scoring is a composite**, so per-task rows matter more than the index.

### 3.1 Where each wins, per task family (S8/S10 rows)

| our use | benchmark | Clef | flash | Jev | JevK5 | winner |
|---|---|---|---|---|---|---|
| **claim contradiction** (anti-theatricality) | RAGTruth (F1, hallucinated class) | **79.4** | 35.6 | 76.5 | 64.5 | **Clef** |
| **defect classification** | BANKING77 macro-F1 | **94.2** | 90.9 | 79.7 | 69.2 | **Clef** |
| **defect classification** | CLINC150+OOS | **97.4** | 66.8 | 89.3 | 74.7 | **Clef** |
| **contract / mandate entailment** | ContractNLI | 81.4 | **84.3** | 71.7 | 66.9 | flash |
| **rubric score** (completeness) | Home-appliance simulator | 83.0 | **97.7** | 52.3 | 12.5 | **flash** |
| **quantitative** | CLadder | 94.0 | **97.7** | 72.6 | 59.4 | flash |
| **forecast calibration** | ForecastBench (Brier ↓) | 13.9 | **10.6** | 17.4 | 19.9 | flash |
| hard science | GPQA Diamond | 48.0 | 51.0 | **78.3** | 42.9 | Jev |
| deep reasoning | BBH | 73.7 | 68.9 | **92.9** | 59.8 | Jev |
| broad knowledge | MMLU-Pro | 65.9 | 65.3 | **82.7** | 49.1 | Jev |

**Read this carefully.** Clef wins the tasks our gate actually asks (claim contradiction, fine-grained
classification, contract satisfaction). Jev wins the tasks our gate does NOT ask (GPQA, BBH, MMLU-Pro —
knowledge-heavy reasoning). And **clef-flash is the worst of the four on claim contradiction (35.6)** while
being the best on rubric scoring. **The cheap model is not a drop-in for the claim gate.**

---

## 4 · ECONOMICS — the "is it worth paying" question is the wrong question

10,000 neurons/day are free; $0.011 per 1,000 neurons above that (S7). Per-model neuron rates: clairic
9,091/M, clef 21,818/M, clef-omni 13,636/M, clef-flash 3,455/M (S7). Computed:

| model | $/M input | free tokens/day | free calls/day @2.1k tok | cost of a 30-call week |
|---|---|---|---|---|
| clairic | $0.100 | 1,099,989 | **524** | **$0.0006** |
| clef | $0.240 | 458,337 | 218 | $0.0014 |
| clef-omni | $0.150 | 733,353 | 349 | $0.0009 |
| clef-flash | $0.038 | 2,894,356 | 1,378 | $0.0002 |

A full week — 4 pairs, one extraction pass per source, one gate per card, 10 verification calls — is
**~30 calls ≈ 63,000 tokens ≈ 1.4% of one day's free allowance.** At the operator's own estimate ($2/month
for a month of trading) the true figure at this volume is **under $0.07/month, and $0 because the free tier
covers it.**

> **Conclusion.** Paying is not the decision. The decision is *dependency surface*: a paid lane adds a
> network call, a vendor preview status, an account, and a failure mode that does not exist locally.
> That is the only thing worth weighing.

---

## 5 · THE FIVE CLAIMS, TESTED

| # | claim | verdict | evidence |
|---|---|---|---|
| A1 | "Clairic is a new class of System One model" | **TRUE** | §1: fields+spans+`p_null`+`estimate`/`forecast` vs noul/choice/score. Different primitive. |
| A2 | "Clairic can do everything we used an LLM for" | **TRUE for RUNTIME, FALSE for BUILD** | Runtime jobs are: read unstructured sources → typed values; judge a card; render pixels → typed measurements. All are Family-A/B primitives. Code authoring, spec writing and prose reports are NOT primitives — a model cannot write the engine. |
| A3 | "No LLM needed anywhere if we have Clairic" | **PARTLY FALSE** | Clairic has **no** `choice`/`score` type (S2 enum). Verdict-shaped questions need Clef or the local lane. Clairic alone cannot answer "which defect class is this?" with a distribution. |
| A4 | "Clef is worth money only if tangibly better than Imajev" | **UNPROVEN EITHER WAY — no head-to-head exists** | §3: disjoint panels. Clef wins the panel it is on; Imajev is #1 on the panels Clef is not on. Decide by bake-off (§9). |
| A5 | "Plutus can run with zero LLM and zero agents" | **TRUE — and the canon already demands it** | Iron Law 1: *"The model is just electricity. ALL intelligence is in the code."* R32: *"decision making machine that deterministically makes intelligent decisions. 95% deterministic."* Illusion 1 documents the exact failure of an LLM choosing entries. |

### 5.1 The one place an LLM is still load-bearing: BUILD TIME

Clairic cannot emit Pine Script, cannot author the E1/E2/E3 engine, cannot write a spec. The **runtime**
can be 100% deterministic; the **construction** of the runtime cannot be, unless a human writes all of it.
That is not a defeat — it is the correct boundary: *models do not build the machine; they inform it at
runtime.* The build-time LLM writes code that is then gated by the runtime's own mechanical checks.

---

## 6 · THE ARCHITECTURE — PLUTUS VISION under the hard constraint

Constraint: **no LLMs, no agents. Only deterministic code + System One models, hosted on Cloudflare
Workers / Durable Objects (+ pi-durable where relevant) + these two model families.**

### 6.1 What the canon already fixes (cannot be redesigned)

From S16: E1 = *where the walls are* (geography, confluence 0–14, BoM/MoM, ZFP); E2 = *what path the energy
takes* (shape chain + per-day decomposition, no prices); E3 = *where exactly to enter* (triple loop, 7 gates,
ONE TP); firewall AFTER setups; DXY first; per-pair independence (DXY→pair conversion FORBIDDEN); report
generated ONCE per week; a second TP or an eighth gate is a defect by construction.

**None of that is a model's job.** The engines are arithmetic over typed inputs. The architecture below
does not touch them — it changes *where they run* and *who reads the pixels*.

### 6.2 The layer map

```
L0 INGEST      Cron (Sun 22:00 UTC) → Workflow "pv-week"
                 ├─ bars   ← the ONE external leg (TradingView needs a logged-in browser; Iron Law 10)
                 ├─ pages  ← calendar / H.10 / option expiries / analyst consensus  (fetch → R2)
                 └─ extract← CLAIRIC per source: typed fields + span + p_null   → D1
L1 COMPUTE     Python Worker (Pyodide+numpy): E1 → E2 → E3 → firewall → cascade → caps
                 the SAME Python the canon calls authoritative (Iron Law 2) — no TS re-port
L2 CARD        one typed document per (week, pair); a Durable Object serialises emission exactly once
                 (Iron Law 4: the report is generated ONCE)
L3 GATE        G0 doctor · G1 pixel arithmetic · G2 structural · G3 semantic (stream A) ·
                 G4 vision (stream B: CLAIRIC fields over the frame) · G5 agreement + control
L4 RENDER      the card is COMPILED into Pine source and shipped to TradingView (the OUT external leg)
L5 LEARN       D1 journal + R2 evidence (frames, cards, shas) + the 163-card graph
```

### 6.3 Who answers which question (the routing law)

```
who            primitive            question it owns
─────────────  ───────────────────  ─────────────────────────────────────────────────
CODE (no model)  arithmetic         every E1/E2/E3 number, the 7 gates, caps, ZFP base+modifiers
CLAIRIC          typed fields       "what value is in this page/frame, and how sure?"  (ingest + G4)
CLEF (or local)  noul/choice/score  "does this claim contradict the evidence?" (G3) — a DECISION
IMAJEV (local)   noul/choice/score  the same decision class, free, when the state fits 32 KB
```

**The rule that keeps it honest:** a model may *supply a value* or *answer a verdict question*. A model may
never *compute a canon number*. ZFP is canon arithmetic (base band + six modifiers, S16) — Clairic's
`estimate` may supply a missing modifier's inputs, never the ZFP itself.

### 6.4 The two external legs (named, because the constraint cannot cover them)

| leg | why it is outside the constraint | contract |
|---|---|---|
| **IN · bars** | TradingView OHLC needs an authenticated headed browser (Iron Law 10: *never headless*). Workers cannot run Chrome. | the existing host rig POSTs bars to an authenticated Worker route → R2/D1. One signed payload, one schema. |
| **OUT · Pine** | Pine cannot make HTTP requests (canon). The card reaches the chart only by being compiled into the script. | the Workflow emits `card.pine` + its sha; a human or a script pastes/loads it. The IDE never fetches. |

If the operator later wants the IN leg removed, the only substitute is a paid market-data API — a *data*
contract, not an architecture change.

### 6.5 What the "sidecar agent" becomes

The blueprint already says it: *"① THE SIDECAR — code, not a prompt"*. Under this constraint the sidecar is
not an agent at all — it is a **Workflow**:

```
agent (old)                      workflow (new)
─────────────────────────────    ──────────────────────────────────────────────
a prompt + an LLM loop           cron → step sequence, each step named and retryable
"memory" as context              a Durable Object with SQLite (10 GB, S12)
"tools" as function calls        fetch / Clairic / Python engine / Clef — 4 named steps
judgement                        G0–G5, each a mechanical predicate that exits nonzero
stopping when it feels done      the gate's exit code; INCONCLUSIVE is not a pass
```

**pi-durable's role: none.** It is an agent harness — `Harness.open(storage, {models, registry})`,
`defineTool`, `CodingTools` — built to host an LLM agent loop with durable storage. Under "no agents" it has
no job that Workflows + DO SQLite do not already do natively on the platform where the rest of the pipeline
lives. If we ever need a *host-side* durable runner for the bar-shipper leg (because that leg is outside CF),
a plain Bun service + SQLite is the honest tool; importing an agent runtime for its storage layer is the
kind of dependency that later hides an LLM in the boot path.

### 6.6 Cost and limits of the platform, priced exactly (S12–S15)

```
Workers           CPU 10 ms free / 30 s default paid / 5 min max      memory 128 MB (both plans)
Cron              CPU 30 s per firing; 15 min when the interval >= 1 h
Durable Object    100k req/day free; SQLite 10 GB per object; 128 MB; alarms = the scheduler
Workflows         10,000 steps (25,000 max); 30 s CPU/step (5 min); sleep 365 d; 100 free / 50k paid
Workers AI        10,000 neurons/day free; ~1.1 M clairic tokens/day
Python Workers    pure + Pyodide packages (numpy available); bindings to D1/DO/R2/Queues/AI
```

**The binding constraint is the 128 MB Worker memory**, not CPU. E1 over 4 pairs × 3 timeframes is small
(three series of a few thousand bars), but this must be *measured* on the real engine in a Worker before
anyone claims it fits — that is a P0 gate, not an assumption.

---

## 7 · THE GATE, REDRAWN WITH THE NEW PRIMITIVES

```
G0 DOCTOR      the rig is up, it is the right build, the port is ours        (code)
G1 ARITHMETIC  20 pixel checks on the frame                                 (code — BUILT)
G2 STRUCTURAL  schema · receipts · ancestry · stubs · ZFP present            (code — BUILT)
G3 SEMANTIC    the card: mandate_met (noul) · claim_contradicted (noul) ·
               defect_class (choice) · completeness (score)                  (CLEF, or local)
G4 VISION      the frame as TYPED FIELDS, not as a story:
                 candles            number   {integer}
                 max_fill_pct       estimate {min:0,max:100,step:0.1}  → p90 vs the threshold
                 label_count        number   {integer}
                 distinct_families  list(text)
                 axis_labels_legible noul-equivalent via text+confidence
               abstention: p_null > null_threshold → INCONCLUSIVE, never PASS
                                                                            (CLAIRIC)
G5 AGREEMENT   all agree AND the known-BAD control is rejected; a control that
               passes VOIDS the run                                          (code)
```

**Why G4 belongs to Clairic and not to Clef:** the frame audit is *measurement*, not *classification*.
"max_fill_pct" is a number with an interval (`p10`/`p90`), which lets the gate threshold on the **lower
bound** — a strictly stronger predicate than "the model said the chart looks fine". The `p_null` channel
also gives the gate a first-class INCONCLUSIVE, which is exactly what the canon's four-verdict vocabulary
(`PASS|FAIL|INCONCLUSIVE|READY_FALSE`) expects.

---

## 8 · WHAT THIS DOES NOT SOLVE (the honest remainder)

1. **No head-to-head Imajev vs Clef exists.** §3 is a cross-panel inference. The bake-off (§9) is the only
   way to close it.
2. **Clairic is in preview with no published evals.** No HF card (401 / absent from `author=Cloudflare`), no
   benchmark table in its docs, and the Terms disclaim availability and integrity. Its `forecast` field has
   **zero** published accuracy evidence. Treat `forecast` as unproven until measured on our own series.
3. **A Worker's 128 MB is unproven for the Python engine.** Must be measured before the architecture is
   called viable.
4. **The IN leg is not Cloudflare.** Stated, not solved. Iron Law 10 is the reason.
5. **Build time still needs an author** (human or LLM). §5.1.

---

## 9 · THE BAKE-OFF (the measurement that closes the Clef question)

Pre-registered rule (from brief.md): a paid model replaces the incumbent on a lane only if, on ≥40 labelled
cases from our own corpus, it wins by ≥10 points of separation AND ECE ≤ 0.05 AND it is deployable.

```
corpus    the 89 clean/corrupt fixture pairs already in gates/fixtures (64 PNG frames) +
          40 cards from cards/ with a known verdict
lanes     1 · claim_contradicted   (noul)      ground truth: the gate's own G1/G2 verdict
          2 · defect_class         (choice)    ground truth: the defect class that was fixed
          3 · frame fields         (clairic)   ground truth: chart_validator.py's measured numbers
models    imajev-4b (local) · clef · clef-flash · clairic
metrics   separation (good_min − bad_max) · ECE · abstention rate · p50/p95 latency · $/1k calls
gate      a lane switches only on the pre-registered rule; otherwise the incumbent stays and the
          result is recorded as "no measured value add"
```

---

## 10 · VERDICT

- **Clairic: adopt, for ingest and for the pixel-field audit.** It is a genuinely different primitive, it is
  the only model of the two that can turn an unstructured page or a frame into a *typed value with an
  interval and an abstention*, and at our volume it costs nothing.
- **Clef: do not adopt yet.** It wins the panel it is on, but that panel does not contain Imajev, and the
  free local model is #1 on the two panels Clef is not on. It earns a lane only by winning the bake-off —
  most plausibly the claim-contradiction lane, where Clef's RAGTruth (79.4) is the best of the four and
  clef-flash's (35.6) is a trap.
- **No LLM, no agents in the runtime: correct, and already canon.** The engines were never models. What the
  two families replace is (a) the bespoke scrapers that feed E1's nine pillars and (b) the human eye that
  judged the render. Both are Family-B/B jobs, not generation.
- **pi-durable: out.** Workflows + DO SQLite are the native durable layer; an agent runtime under a
  no-agent constraint is a dependency waiting to become a landmine.

---

# ADDENDUM A · THE PRIMARY SOURCE I MISSED (found 2026-10-24, after the first draft)

My first pass probed `blog.cloudflare.com/clairic-typed-extraction/` (404) and concluded "no announcement".
Wrong. The real sources are:

- **S18** https://blog.cloudflare.com/clairic-extraction-model/ — *"Introducing Clairic, a new System One class
  of extraction models"*, published **2026-10-19T17:48Z** by Michelle Chen.
- **S19** https://developers.cloudflare.com/changelog/post/2026-10-19-clairic-workers-ai/ — the changelog,
  2026-10-19, containing the **Preview** section that qualifies every capability.
- **S20** https://developers.cloudflare.com/workers-ai/concepts/extraction-models/ — the concept page.

**This is a correction to §8 item 2 of the report** ("no published evals"). Clairic *does* publish one
evaluation, and the changelog publishes explicit capability limits. Both are load-bearing.

## A.1 · Cloudflare's own taxonomy — it confirms the two-family split

Verbatim table from S18:

| | System One: **Extract** | System One: **Decide** | System Two |
|---|---|---|---|
| Example models | **Clairic** | **Jev, Clef** | GPT, Claude, Gemini, DeepSeek |
| Sampling | One parallel pass | One parallel pass | One token at a time |
| Purpose | **Predict values** | **Make decisions** | Write and reason |
| ML framing | Regression and extraction | Classification | Generation |
| Output | Typed values: spans, numbers, dates, times, lists, distributions, with calibrated probabilities | Typed decisions: options with calibrated probabilities | Free-form strings |
| Output space | **Continuous, but typed and bounded by your schema** | **A finite set of options you list** | Anything |
| What it answers | *What's the amount? When does it happen? How much will it be?* | *Which category? Is it legitimate? Which action?* | *Why? How should we approach it? Can you fix it?* |
| Output always valid? | Yes — a value of the declared type (or null), inside your bounds | Yes — always one of your options | No — strings must be parsed and checked |

And the one sentence that settles the architecture question:

> *"Extraction models turn raw input into typed values, decision models turn values into decisions, and LLMs
> turn decisions into words."* (S18)

## A.2 · The only published Clairic evaluation — and it is a *forecast* evaluation

TSA daily checkpoint counts, 21 consecutive morning-ahead forecasts (S18):

```
Clairic forecast for 2026-10-14:  value 2,416,117 · median 2,419,283 · p10 2,270,774 · p90 2,556,769
TSA actual:                       2,419,474      → landed ~250 below the median
Across 21 days:  mean error 3.3% · 17 of 21 actuals inside the 80% interval
                 (an 80% interval should contain ~16.8 of 21 — i.e. calibrated almost exactly)
Misses:          3 of the 4 out-of-interval days were the Columbus Day weekend — an event the
                 series does not show.
```

**This is the strongest single piece of evidence in the whole report**: Clairic's forecast on a *daily,
weekly-seasonal* series is ~3.3% MAPE **with nominal interval coverage**. It also names the exact failure
mode: **it cannot see events the series does not contain** — holidays, red-folder news, interventions.

## A.3 · Cloudflare's own limits (verbatim, S19 "Preview" section) — these govern our design

| limit | verbatim | consequence for Plutus |
|---|---|---|
| multi-step arithmetic | *"One- and two-step calculations… are reliable. Long chains of dependent steps and aggregations across many table rows are not yet. **Extract the inputs with Clairic and do the math in code.**"* | confirms §6.3: Clairic supplies values, **code computes** E1/E2/E3 |
| estimates | *"Clairic estimates best when the input contains evidence such as comparables, history, or descriptive text. Without evidence, the interval is wide."* | only ask for an estimate when the state carries the evidence |
| **forecasts** | *"**Forecasting is basic.** Next-step forecasts follow recent patterns, but forecasts several steps out **flatten toward the average**, and Clairic **does not anticipate events** the series does not show, such as holidays. **It does not replace a time-series model trained on your data.**"* | **Clairic must NOT be the price forecaster.** E2 stays canon arithmetic |
| calibration | *"Intervals are trained to be calibrated… but they **can run narrow on unfamiliar data**."* | gate on `p10`/`p90` width as a *confidence* signal, never as truth |
| confidence | *"Every answer is **well formed, not necessarily correct**."* | `p_null` decides abstention; it does not certify correctness |

## A.4 · The cascade benchmark — measured, and it is the shape of our architecture

Clairic → Clef → GLM-5.3 vs GLM-5.3 for every step, same email/policy/prompts (S18):

| | Clairic → Clef → LLM | all-LLM |
|---|---|---|
| end-to-end latency | **19.3 s** | 61.7 s (**69% less / 3.2×**) |
| extract | Clairic **0.46 s** | GLM 16.1 s |
| decide | Clef **0.22 s** | GLM 21.9 s |
| reply | GLM 18.6 s | GLM 16.4 s |
| input tokens | 701 | 390 |
| cost per million claims | **$6,032** | $11,740 (**49% less**) |
| determinism of the estimate | **identical every run** | $250 / $250 / $220 with different ranges |

And the sentence that is an indictment of the current approach: *"under the all-LLM pipeline both Gemma 4 and
Qwen failed at this task, as they were unable to deduce values like `repair_cost` from the inputs, showing
how LLMs are not great at data extraction tasks"* (S18).

**Note what this pipeline does NOT contain: an LLM in the first two roles.** Our target architecture is
literally their step 1 + step 2, with step 3 (the words) replaced by a template — because a week card is
typed JSON, not prose.

## A.5 · What this changes in the verdict

| claim | before (first draft) | now, with S18/S19 |
|---|---|---|
| "Clairic has no published evals" | §8 item 2 | **WRONG** — one forecast eval published (3.3% MAPE, 17/21 in-interval) |
| "Clairic's `forecast` is unproven" | §8 item 2 | **partly resolved**: proven *next-step on a seasonal daily series*; explicitly **not** long-horizon, **not** event-aware |
| "Clairic can be the price forecaster" | untested | **REFUTED by the vendor itself**: *"does not replace a time-series model trained on your data"* |
| "Clairic replaces every LLM role" | A2 "true for runtime" | **needs the decision model too** — Clairic cannot choose among options (their own table) |
| "no head-to-head exists" | §3 | **unchanged** — still no Imajev-vs-Clef measurement anywhere |

## A.6 · The hybrid the evidence actually supports for Plutus

The TSA result is good *because* the series is seasonal and self-similar. FX is not: it is event-driven, and
Clairic explicitly cannot see events. But Plutus **has** the event input — the economic calendar is an E1
pillar and a red-folder gate. So the defensible shape is:

```
E2 shape chain          canon arithmetic                    ← authoritative, unchanged
Clairic `forecast`      a SOFT prior on the next day's range ← p10/p90 as a band, never a level
calendar (red-folder)   the event the series cannot see     ← supplied to the model AND to code
code                    computes the confluence, the ZFP, the gates, the entry/SL/TP
```

used exactly as Cloudflare scopes it: *"non-critical, general pattern matching"*, never as the target price.

---

# ADDENDUM B · INDEPENDENT HEAD-TO-HEADS (found 2026-10-24, after Addendum A)

§3 said "no published head-to-head exists". **That was also wrong.** Two independent evaluations ran
Clef and Jev on identical items and published their raw data:

- **S21** https://jevai.tools/blog/jev-vs-clef — 11 Oct 2026 · 2,000 Workers AI calls · raw JSONL published
  (`/data/benchmarks/2026-10/clef-raw.jsonl`, `.../summary.json`). Scored: probability on the chosen answer.
- **S22** https://www.softwareinsights.dev/posts/jev-vs-clef-vs-laya-decision-models-tested/ — 9 Oct 2026 ·
  600 real business decisions (300 support cases, 300 failed deployments, 7 genuine failures) + a
  confidence-abstention analysis.

These are the measurements the Decision Index could not give us.

## B.1 · Accuracy on the same items (S21)

| task | items | Jev | Clef | Clef-flash | note |
|---|---|---|---|---|---|
| Banking77 intent (77 options) | 100 | 79% (70–86) | **96%** (90–98) | **97%** (92–99) | non-overlapping CIs |
| AG News topic (4 options) | 98 | 84% (75–90) | 91% (84–95) | 91% (84–95) | CIs overlap → a lead, not proof |
| Emotion (6 options) | 49 | **65%** (51–77) | 55% (41–68) | 57% (43–70) | small n; Jev ahead |
| SST-2 yes/no | 200 | not run | 97% | 96% | — |

**The contamination caveat, in their words:** *"Banking77 has been public since 2020, and Cloudflare lists it
among Clef's benchmarks without saying what Clef was trained on… A model that has seen Banking77's training
split would do this. **We can't tell whether Clef saw these test items.** Your own intents won't have that
advantage."* (S21) — The headline 96-vs-79 gap is therefore **not** a clean generalisation estimate.

## B.2 · Calibration — the finding that actually matters for a gate (S21)

| task | Jev ECE | Clef ECE | Clef-flash ECE |
|---|---|---|---|
| Banking77 | 0.103 | 0.069 | 0.067 |
| AG News | **0.152** (97% confident, 84% right) | **0.021** | 0.041 |
| Emotion | 0.225 | 0.218 | 0.234 |

And a trap for our own code, verbatim: *"Clef's choice answers include a `confidence` field, as Jev's do,
but in our data it was **always lower than the probability of the chosen option** (0.79 vs 0.89 on average
for Clef)… If your code thresholds on `confidence`, **re-tune it after switching**."* (S21)

## B.3 · The abstention result — Clef's confidence is usable, Jev's is not (S22)

The question a *gate* actually cares about: when the model is unsure, is it wrong?

| model | cut-off | mistakes sent to a human | correct answers also reviewed | review rate | wrong-answer mean confidence |
|---|---|---|---|---|---|
| **Clef** | 0.5 | **15 of 15 (100%)** | 45 | 20% | 0.33 vs right 0.76 |
| Clef-flash | 0.5 | 16 of 20 (80%) | 57 | 24% | — |
| **Jev** | 0.7 | **4 of 17 (24%)** | 11 | 5% | 0.87 vs right ~0.9 |

*"Jev's wrong answers scored 0.87 on average, close to its right ones, so **no cut-off separates them
cleanly**."* (S22) — That is a direct, measured statement about the incumbent TypeSafe model, and it is the
single strongest argument that a **decision-model lane in the gate must be chosen on abstention quality, not
on accuracy.**

## B.4 · The cheap model is unsafe for a high-stakes check (S22)

*"**Clef-flash missed 24 of the 70 changes that touched permission sets, profiles, sharing rules or
credentials.** The full Clef caught all 70. If the whole point of the check is not to let a risky change
slip past, the small model is the wrong one."* (S22)

On 7 genuine failures all models got 6/7 — *"All of them were fooled by the same misleading Salesforce error…
The difference was how sure they were. **Jev was 99% sure of its wrong answer. Clef was 85% sure.**"* (S22)

## B.5 · The leaderboard ranking FLIPS with the index version (S21)

| board | Jev | Clef | Clef-flash |
|---|---|---|---|
| Decision Index **0.2.1** (S10, my §3) | 57.91 | **61.21** | 57.07 |
| Decision Index **0.3.1** (reported by S21, 11 Oct) | **60.11 (3rd)** | 53.08 (19th) | 47.61 (33rd) |
| JevBench capability (S21) | **77.1** | 75.3 | 63.8 |

**This is the most important methodological finding in the report.** The panel I used in §3 has been
superseded, and on the newer version **Jev outranks every Clef variant**. Any architecture decision that
rests on "Clef = 61.21 > Jev = 57.91" is resting on a superseded panel. My §3 table must be read as
*vendor-favourable snapshot*, not as a standing fact.

## B.6 · The threshold lesson, confirmed across three models (S22)

*"Asking 'was this caused by a temporary problem?' instead of 'would a rerun succeed?' took both Clef models
to 28 out of 28, with no false alarms."* (S22) — Jev: 0/15 → 15/15 on the reworded question. Same law as
our own measured noul failure today (the compound "legible chart with visible candles and axis labels" scored
0.302/0.098; the sharp "the image contains a price chart" scored 0.651/0.214). **Question shape dominates
model choice.**

## B.7 · The corrected verdict

| decision | verdict | basis |
|---|---|---|
| **Clairic → adopt for ingest + G4 frame fields** | **YES** | vendor's own taxonomy + a published 3.3% MAPE / 17-of-21-in-interval forecast + "have Clairic predict the value and let code do the math" |
| **Clairic → as the price forecaster** | **NO** | vendor: *"does not replace a time-series model trained on your data… non-critical, general pattern matching, not detailed long-horizon forecasting"* |
| **Clef → as the gate's semantic judge (G3)** | **CONDITIONAL — strongest candidate on abstention** | S22: 15/15 mistakes captured at cut-off 0.5; Jev 4/17 |
| **Clef-flash → any high-stakes check** | **BANNED** | S22: missed 24/70 security-sensitive changes; §3 RAGTruth 35.6 |
| **Ranking claims from Decision Index 0.2.1** | **WITHDRAWN** | 0.3.1 reverses the order (S21) |
| **Imajev (free, local) → incumbent** | **KEPT until the bake-off** | #1 JevBench / #1 Image JevBench; no published Clef-vs-Imajev comparison exists at all |

**What the bake-off must now measure, given B.3:** not "which is more accurate" (they tie) but **"which
model's unsure answers are actually wrong"** — i.e. per-model abstention curves on our own 64 labelled
frames and 40 canon cards. That is the only property a gate can act on, and it is the property where the
two vendors differ most.
