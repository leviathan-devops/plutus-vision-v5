# HANDOFF PROMPT — PLUTUS VISION DESIGN BLUEPRINT v2
## Read everything. Then design. Do not restate. Do not compress.

---

## 0 · WHAT YOU ARE, AND THE ONE THING THAT WILL GET YOU FIRED

You are the design engineer for PLUTUS VISION. Your deliverable is **one document**: a
CAD-grade DESIGN BLUEPRINT for a runtime built from deterministic code plus two System One
model families, under a hard no-LLM constraint.

**The previous agent was fired for two specific failures. Do not repeat them:**

1. **It restated the architecture the operator already built** (the v1 three-step loop, the
   plane stack, "Pine cannot fetch") and presented that as design. That is not design. That is
   a book report. **Design = the artifact that does not exist yet.** The existing design is the
   *input*; your blueprint must state what CHANGES and why, in enough mechanical detail that an
   engineer who has never seen the project can build it.
2. **It delivered a partial framework and stopped.** No chains with criteria, no topology with
   step contracts, no clause accounting, no calibration protocol, no failing exits. A blueprint
   with sections missing is not a blueprint.

**Success is judged by one test:** hand your document to a competent stranger who has never
seen PLUTUS. They must be able to (a) name every component, (b) state every contract between
them, (c) predict what happens when each dependency is missing, (d) point at what kills the
build, and (e) **write the E1/E2/E3 question sets and the Cloudflare workflow from your
document alone.** If any of those requires asking you, the document failed.

---

## 1 · THE READING CONTRACT (non-negotiable, mechanically checked)

**Budget: 850,000 tokens for reading + authoring. There is no efficiency target. Density is
the only metric. Do not compress, do not summarize, do not delegate.**

```
RULE R1  YOU read. Do not dispatch subagents to read for you. Do not use a scout.
RULE R2  Read every file end to end. Use ranged reads of <=250 lines:
             read(path, ":1-250"), read(path, ":251-500"), ...
RULE R3  AFTER EVERY READ, check the tool's footer. If it says ANY lines were elided or
         skipped ("… N middle lines elided", "Showing lines X-Y of Z"), RE-READ THE MISSING
         RANGE IMMEDIATELY. A read that dropped lines did not happen.
RULE R4  Do not write the blueprint until the READING TABLE (section 8) is complete and
         shows ZERO elisions.
RULE R5  Every claim you make about the project carries `path:line`. Every claim about a
         model carries the URL. Every number carries its source.
RULE R6  If a document contradicts another, quote BOTH with anchors and state which wins
         under the precedence chain you find in BUILD_WORKFLOW_v2 §0 and the master spec §2.
```

---

## 2 · READ LIST — PROJECT (read 100%, in this order)

Root: `/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION`

### 2.1 The authority (read FIRST, and these govern everything else)

| file | lines | why |
|---|---|---|
| `spec/PLUTUS_VISION_MASTER_SPEC.md` | 3,031 | **THE authority.** Its §2 canon map ranks every other doc; `design/` is NOT on that map, so the v1.2 blueprint is a CANDIDATE, not law. Contains the 10 laws, E1/E2/E3 contracts, the 10 shapes, ZFP, the 7 gates, P0–P6, and the acceptance bar (≥90% golden week + ≥90% on 10 held-out weeks, scored on opened frames). |
| `MASTER_CONTEXT/OPERATOR_RULINGS_PV.md` | ~55 | R-01..R-11, the newest operator rulings: no PDF step, the sidecar contract, E2 two-phase, canon-only vocabulary, the trade-count reality. |
| `MASTER_CONTEXT/NON_NEGOTIABLE_ORCHESTRATOR_PRINCIPLES.md` | 501 | PART 13 is the operative TP/SL compute spec (E2 projection FIRST, E1 pressure SECOND, candle mechanics THIRD; shallow LQZ = pass-through). |
| `MASTER_CONTEXT/PLUTUS_ANCHOR_DOCTRINE.md` | 236 | the 3-anchor system, SL/TP doctrine, LQZ candle types, retry/dedup/provenance doctrine. |
| `MASTER_CONTEXT/HANDOVER_37_FUNDAMENTAL_LAWS.md` | 497 | the 37 laws, operative sentence each. |
| `MASTER_CONTEXT/reports/Knowledge_Graph_Map_v2.md` | **7,795** | R01–R38 verbatim + HL-01..HL-16 + 583 extracted mechanisms. Read ALL of it. R32 is "95% deterministic". |
| `MASTER_CONTEXT/CANON.md` | ~20 | the hub; it carries links, no law text. Note what is ABSENT from the tree. |

### 2.2 The design + workflow authorities

| file | lines | why |
|---|---|---|
| `design/DESIGN_BLUEPRINT_v1.2_AUTHORITATIVE.md` | 871 | the L0–L5 stack, S1–S10, the confidence composite, tiers, count rule, card JSON, Pine drawing order, Option A/B delivery, L4 five gates. **A candidate under the master spec's canon map — read it as evidence of intent, not as law.** |
| `design/BUILD_WORKFLOW_v2.md` | 1,211 | the precedence chain (cards+MASTER_CONTEXT > blueprint > workflow), replay acceptance R0–R8, the 12-law table, gate laws G1–G5, 14 anti-patterns, P0–P7 with 19 Pn.Tm turns. |
| `spec/RENDER_LOOP_WORKFLOW.md` | 233 | the rig, failure modes F1–F7, the seven pixel tests T1–T7 with negative controls and mutations. |

### 2.3 The card corpus (all 163 files, no sampling)

`cards/*.md` — 163 files. Read every one. They carry YAML frontmatter (`id`, `type`, `tier`,
`tldr`, `statement`) plus body sections `**Mechanism**`, `**Discriminator**`, `**Failure mode**`.
The load-bearing ones for this design: `ARCH-*` (8 files), `E1-ZFP-*` (4), `E2-*`, `E3-*`,
`LAW-*`, `RULING-*`.

### 2.4 The rest of the tree (read what exists; report what does not)

- `spec/*.md` — every file listed by `wc -l spec/*.md` (MASTER_SPEC, ZFP_SPEC, E2_TWOPHASE_SPEC,
  EW_A_BACKEND_SPEC, EW_B1_ENGINE_SPEC, EW_B2_ENGINE_SPEC, BLUEPRINT, DPL1, WAVE_PLAN).
- `design/FULL_BUILD_CONTEXT.md`, `BUILD_REPORT.md`, `DEBUG_LOG.md` (2,286 lines) — the last
  build's record; read it to learn what actually failed.
- `scripts/chart_validator.py` (1,061 lines) — 20 pixel checks C01–C20. This is G1 and it is BUILT.
  Read the checks: your blueprint must not duplicate them.
- `gates/VALIDATE.sh`, `gates/VALIDATOR.sha`, `gates/fixtures/` (89 clean/corrupt pairs, 64 PNGs).
- `research/clef-clairic/REPORT.md` + `brief.md` — the model research already done; read it, then
  VERIFY its claims yourself against the links in §3.

---

## 3 · READ LIST — MODELS (read 100%, every page, every schema)

**Cloudflare Clairic (extraction family):**
- https://developers.cloudflare.com/workers-ai/models/clairic/index.md
- https://developers.cloudflare.com/workers-ai/models/clairic/schema-input.json
- https://developers.cloudflare.com/workers-ai/models/clairic/schema-output.json
- https://developers.cloudflare.com/workers-ai/concepts/extraction-models/index.md
- https://blog.cloudflare.com/clairic-extraction-model/   (all of it — the TSA forecast eval is in it)
- https://developers.cloudflare.com/changelog/post/2026-10-19-clairic-workers-ai/index.md  (**the Preview limits section is mandatory**)

**Cloudflare Clef (decision family):**
- https://developers.cloudflare.com/workers-ai/models/clef/index.md
- https://developers.cloudflare.com/workers-ai/models/clef/schema-input.json
- https://developers.cloudflare.com/workers-ai/models/clef/schema-output.json
- https://developers.cloudflare.com/workers-ai/models/clef-flash/index.md
- https://developers.cloudflare.com/workers-ai/models/clef-omni/index.md
- https://developers.cloudflare.com/workers-ai/models/clef-omni/schema-input.json
- https://blog.cloudflare.com/clef-decision-models/   (the launch post + the training section)
- https://huggingface.co/Cloudflare/clef/raw/main/README.md
- https://huggingface.co/Cloudflare/clef-flash/raw/main/README.md
- https://huggingface.co/Cloudflare/clef-omni/raw/main/README.md

**The incumbent (free, local) — read the card, then verify the live lane:**
- https://huggingface.co/mohit67890/imajev-4b/raw/main/README.md
- https://huggingface.co/mindchain/imajev-4b-GGUF/raw/main/README.md
- `/home/leviathan/.omp/agent/DECISION_LANE.md` (the live identity: model, ports, units, image contract)
- `curl -s http://127.0.0.1:8090/health` and one live `/v1/systemone` call

**The platform you must design on:**
- https://developers.cloudflare.com/workers-ai/platform/pricing/index.md
- https://developers.cloudflare.com/workers-ai/platform/limits/index.md
- https://developers.cloudflare.com/durable-objects/platform/pricing/index.md
- https://developers.cloudflare.com/durable-objects/platform/limits/index.md
- https://developers.cloudflare.com/workflows/reference/limits/index.md
- https://developers.cloudflare.com/workers/platform/limits/index.md
- https://developers.cloudflare.com/workers/languages/python/index.md
- https://developers.cloudflare.com/workers/languages/python/packages/index.md
- https://developers.cloudflare.com/browser-rendering/  (the capture leg)

**The three bibles — read every line, they are 9,245 lines total:**
- `/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/Bibles/JEV_CHOICE_BIBLE_AND_OPERATOR_MANUAL_v1.md` (3,008)
- `/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/Bibles/JEV_ENGINEERING_BIBLE.md` (3,006)
- `/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/Bibles/ALGORITHMIC_REASONING_BIBLE.md` (3,231)

From these you must be able to state, without looking: the three primitives and their caps
(noul 0..1 · choice ≤255 options · score 2–10 levels); the layer engine (Score gate → Noul
chain → Choice → code verdict); the progressive law; the weakest-clause rule; the six
anti-patterns of questions; the 22 failure codes; the 24 iron laws; the calibration protocol
(control set → sweep → false-allow = 0 → record); the ledger row schema; the derived-threshold
law; and the zero-token property.

---

## 4 · THE OPERATOR'S ARCHITECTURE CONSTRAINTS (verbatim intent — these are LAW)

1. **Nothing works yet.** There is no authoritative working version. The best artifact that
   exists is the 36-hour GLM 5.1 prompt. Everything else is theoretical. **Do not claim
   anything works. Do not describe the current system as if it functions.**
2. **The v1 workflow is the BASELINE, not the answer.** Read it fully, then *improve it and
   rebuild it from scratch.* Restating it is failure.
3. **No LLM. No agent. Anywhere.** Hallucination is forbidden. Deterministic mechanical code
   plus System One models only.
4. **Hosting:** Cloudflare Workers + Durable Objects (+ Cloudflare Workflows). pi-durable only
   where it genuinely fits. The sidecar is no longer an agent — it is a **dynamic workflow**.
5. **E1 = code + Clairic ONLY.** No Clef/Jev inside E1.
6. **E2 = Clef/Jev + Clairic + code.** Forward-map the shape chain from E1's data.
7. **E3 = Clef/Jev + Clairic + code.** Decide which setups are valid, where entry/TP/SL go, and
   whether a setup is high or low probability. Today's E3 rejects nearly everything and the
   code is why.
8. **The target ratio is 60% code / 40% System One models** — code is the macro shell that
   provides the deterministic constraints inside which the models act as adaptive algorithms.
   Define this ratio **measurably** (clauses, not vibes) and show your count.
9. **Clairic's capture job:** read the FX options expiry data directly from the Investing Live
   image via computer use, with no LLM in the loop. That leg can run entirely inside
   Cloudflare.
10. **Nothing may invent a value.** Every rendered object is `f(bars, weekStart)`.

---

## 5 · WHAT THE DELIVERABLE MUST CONTAIN (all 15 sections, none optional)

```
§0  THE CONSTRAINT and the exact split it forces (three lanes: code / extract / decide)
§1  THE CLOUDFLARE TOPOLOGY — every Workflow step: input, output, idempotency key, retry,
    fail polarity. The DO seal. D1/R2 usage. The cron. The bindings. The measured limits.
§2  L0 DATA — the Clairic capture pipeline: capture → fields schema → the FOUR code invariants
    → abstention policy (p_null) → degradation when absent. Exact JSON.
§3  L1 E1 — code + Clairic only. The 9 pillars, clustering, confluence, the 5 IP roles, the
    ZFP base+modifiers WITH the receipt rule. Say precisely which modifier Clairic may source.
§4  L2 E2 — the authored chain IN FULL: every question, verbatim, with criteria, ≤60 words,
    one snap judgment each. The composition rule. The phase boundary. The vetoes.
§5  L3 E3 — code's geometry, code's kill clauses, the authored chain IN FULL, the 60/40 clause
    table with the count, the dedupe that stops twenty near-identical setups.
§6  L4 COMPOSE — the ladder (act / review / no-op), eviction, the count rule, fail polarity.
§7  L5 CARD — the schema, and the provenance block per Class-B value (span, p_null, confidence).
    The rule that a shape/span/setup may never appear in provenance.
§8  L6 DELIVERY — card → input.string, the script written once, the parse, CARD: ABSENT.
§9  L7 VERIFY — the pixel gate (C01–C20 already built), plus the ONE thing pixels cannot do:
    read a label string. Specify the Clairic fields for that, and the code-side comparison.
§10 THE CALIBRATION PROTOCOL — control set, sweep, false-allow rate, recording, shadow-first.
    Thresholds are DERIVED. An invented threshold is a defect.
§11 ANTI-PATTERNS — each with a MECHANICAL detector that exits nonzero. Not a warning. A check.
§12 BUILD SEQUENCE — phases, each with an exit that CAN FAIL.
§13 WHAT IT INHERITS — the v1 laws it preserves, and the exact list of what it replaces.
§14 FILE LAYOUT — every artifact, with its path.
§15 RISK REGISTER — severity, mitigation, and what would falsify each mitigation.
SUMMARY — the whole design in one paragraph a stranger can hold.
```

---

## 6 · THE QUESTIONS YOU MUST BE ABLE TO ANSWER AT THE END

If you cannot answer all of these from your own document, it is not finished:

1. What exactly does Clairic read, in what schema, and what four code checks make a wrong read
   inadmissible? What happens to a field whose `p_null` is above threshold?
2. Which ZFP modifiers may Clairic source, and which are arithmetic over bars?
3. What are E2's questions, verbatim, and why can code not answer each one?
4. What are E3's questions, verbatim, and how many kill clauses does code own versus the model?
5. Where do the thresholds come from, and what evidence must exist before the chain is armed?
6. What happens to the card when the options image is missing? Name the token it prints.
7. What stops a model from producing a number that reaches the chart?
8. What stops twenty near-identical setups from being emitted?
9. What is the exact Cloudflare step sequence, with the idempotency key of each step?
10. What is the exit condition of each build phase, and how can it fail?

---

## 7 · FORBIDDEN

- Forbidden: "the current system does X" as if it works. It does not.
- Forbidden: restating v1.2's L0–L5 vocabulary as if it were your design.
- Forbidden: an LLM anywhere, including "just for parsing" or "just for the report prose".
- Forbidden: an agent loop at runtime.
- Forbidden: a model producing, computing, or counting a number.
- Forbidden: a threshold with no calibration row behind it.
- Forbidden: a section that says "to be determined".
- Forbidden: compressing the reading. If a read elided lines, re-read them.

---

## 8 · THE READING TABLE (paste this, filled, in your final answer)

```
file / url                                      lines   windows read    elided?
------------------------------------------------------------------------------------
spec/PLUTUS_VISION_MASTER_SPEC.md                3031   1-250,251-500…   none
MASTER_CONTEXT/reports/Knowledge_Graph_Map_v2.md 7795   …                none
cards/*.md (163 files)                           163     all              none
Bibles/JEV_CHOICE_BIBLE…                         3008   …                none
Bibles/JEV_ENGINEERING_BIBLE.md                  3006   …                none
Bibles/ALGORITHMIC_REASONING_BIBLE.md            3231   …                none
clairic index.md / schema-in / schema-out         —      full             none
clairic blog + changelog                          —      full             none
clef + clef-flash + clef-omni pages + schemas     —      full             none
clef launch post + 3 HF cards                     —      full             none
platform pricing / limits / DO / Workflows        —      full             none
python workers + browser rendering                —      full             none
```

**If any row says anything other than "none", you are not done reading.**
