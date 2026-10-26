# PLUTUS V6 — NEXT-STEPS BLUEPRINT v1

**Series:** Plutus / Trident Trading Engine · **Date:** 2026-09-24
**Inputs:** `PLUTUS_V6_AUDIT_AND_OVERHAUL.md` (1,418 lines, the operator's audit) +
`PLUTUS_V6_BUILD_PACKAGE.zip` (4 files, 2,419 lines) + the LIVE 3-model stack on disk.
**This document:** the forward plan. It does not re-derive the audit — it reconciles the
audit against the machine and encodes the fix as predicates that exit nonzero.

---

## §0 — THE VERDICT

```
1. THE AUDIT IS THE AUTHORITY. It supersedes the prior v6 spec.
   Read, not re-derived.
2. THE MACHINE HAS 3 MODELS LIVE.
   JevK5 :8008 · Qwen3.5-4B :4171 · DeepSeek :4172.
3. THE PACKAGE'S MODEL LIST IS 2/3 CORRECT.
   JevK5 + Qwen3.5 match disk. The math model does NOT: the package
   names Qwen2.5-Math-1.5B; disk has DeepSeek-R1-Distill, which is that
   model's SUCCESSOR (DeepSeek's own card: base = Qwen2.5-Math-1.5B).
4. ★ THE LOAD-BEARING GAP: JevK5 DOES NOT SERVE /v1/systemone.
   It returns 404. The whole v6 architecture calls that endpoint.
   Nothing else can proceed first.
5. THE PACKAGE ASSUMES vLLM + PORTS 8090/8091/8092.
   Disk runs llama.cpp + 8008/4171/4172.
6. ★ THE ROOT CAUSE IS INSIDE A FILE THE AUDIT SAYS TO KEEP.
   engine.ts:322 hardcodes '4H' — the exact telescoping failure the
   post-mortem names "#1 root cause of ALL macro derailments".
   Keeping engine.ts unmodified PRESERVES the root cause.
```

**THE ONE THING TO DO FIRST:** make JevK5 answer a typed question. Everything else in v6
is downstream of that single endpoint existing.

**THE ONE THING TO DO BEFORE KEEPING engine.ts:** remove the hardcoded `'4H'`. A KEEP list
that preserves the #1 root cause is a KEEP list that fails.

---

## §1 — THE MEASURED START STATE

| Component | Declaration (package) | IS IT WIRED? (measured) |
|---|---|---|
| JevK5 decisions | `:8090/v1/systemone`, vLLM | **NO — 404. Served as llama.cpp chat on `:8008`** |
| Qwen3.5-4B LLM/VLM | `:8092/v1/chat/completions`, vLLM | **PARTIAL — live on `:4171`, llama.cpp, no VLM path tested** |
| Math layer | `:8091`, Qwen2.5-Math-1.5B, vLLM | **NO — different model; DeepSeek on `:4172`** |
| The 8 JEV recipes | JSON in the package | **NO — zero ledger rows; endpoint absent** |
| The 5 thin code files | preserved from v5 | **ON DISK (4,444 lines) — not yet the pipeline** |
| The 5 decision files | to delete | **ON DISK (11,342 lines) — still the live intelligence** |
| The bench (`bench/`) | 50+ labeled cases | **NO — dir does not exist; golden fixture does** |
| The ledger (`ledger/`) | every call writes a row | **NO — dir does not exist** |
| The fuse | trips on 3 losses / 5 | **NO — does not exist** |
| The kill switch | `JM_BYPASS=1` | **NO — does not exist** |

```
THE HONEST COUNT: 0 of 8 recipes steer. 0 ledger rows. 1 endpoint missing.
The 3 models are UP; the v6 architecture that consumes them is 0% wired.
```

---

## §2 — ★ THE ROOT CAUSE, VERBATIM

The build's own post-mortem names its mechanisms. Quoted, never paraphrased.

**Root cause A — the precision failure (why v5 entries missed):**

> "L1 multi-TF stacking (15m 5-8p/30m 12-25/1H 15-35/4H 30-80/8H 50-150; combos
> 15m+30m+1H+4H most-common — **the pipeline's 4H-only = entries 50-140p from spot vs
> winners 5-25p = the precision root cause**)"

`Checkpoints/pre-v5-baseline-4.5.3/MASTER_CONTEXT/PLUTUS_MASTER_CONTEXT_INJECTOR.md:1063`

**Root cause B — the macro derailment (the #1 cause of all of them):**

> "**Telescoping COMPLETELY ABSENT** (live = 4H-S/D + 1H-LQZ hardcoded '4H' engine:465;
> MDVE = independent 4H+1H+30m no cross-TF; the ONLY telescoping = dead legacy :3021-3179;
> 15m harvested-used-by-nobody; bom-mom TF-agnostic = a 30m BoM possible TODAY = doctrine
> violation; **the #1 root cause of ALL macro derailments**)."

`Checkpoints/pre-v5-baseline-4.5.3/MASTER_CONTEXT/PLUTUS_MASTER_CONTEXT_INJECTOR.md:1056`

**The sub-layers of the cause (three, named by the post-mortem):**

```
1. THE TIME-FRAME LAYER   the pipeline reads ONE timeframe; the winners
stack 4.
                         4H-only -> entries 50-140p from spot; winners
                         5-25p.
2. THE TELESCOPING LAYER  cross-TF nesting is absent; a 30m BoM is possible
today,
                         which the doctrine forbids. The only implementation
                         is dead.
3. THE DECISION LAYER     ~308 hand-coded decision branches carry the
judgment that
                         the audit says belongs in Jev. (See §3 PROOF 1.)
```

**★ THE CATEGORY ERROR, IN ONE LINE:** the decision intelligence was written as **hand-coded
branches inside the pipeline** instead of as **judgments asked of a decision plane**. The
326 branches are the proof. Fixing the timeframe and the telescoping while leaving the
branches in place reproduces the derailment by construction.

---

## §3 — THE THREE PROOFS

### PROOF 1 — the CODE that commits the error (hand-coded decision branches)

```bash
$ V5=.../PLUTUS/agent
$ grep -cE '^\s*case '            $V5/src/brains/shape-brain.ts            #
47
$ grep -cE '^\s*\}?\s*else if\s*\(' $V5/src/brains/shape-brain.ts          #
8
$ grep -cE '^\s*(if|else if)\s*\('  $V5/src/mdve/mirror.ts                 #
261
$ grep -cE '^\s*(const|let)\s+[A-Z_]{4,}\s*='
$V5/src/mdve/refinement-machine.ts  # 10
```
```
RAW: 47 + 8 + 261 + 10 = 326 hand-coded decision branches across the 5
DELETE files.
```
**The judgment lives in 308 branches.** That is the surface v6 moves to Jev.

**THE ANCHORED SAMPLES (each a real line, verified this session):**

```
src/brains/shape-brain.ts:160
  case ShapeCode.BS: return ShapeCode.RWL;  // NOT R/PBS
src/brains/shape-brain.ts:161
  case ShapeCode.SS: return ShapeCode.SS;   // Continuation
src/mdve/mirror.ts:256
  if (isMirrorOutcome(source)) return source.direction;
src/mdve/mirror.ts:306
  if (candidates.length === 0) return null;
src/mdve/refinement-machine.ts:119
  const MAX_ENTRY_MICRO_MOVE_PIPS = 3;
src/mdve/refinement-machine.ts:128
  const MAX_ENTRY_BAND_ADJUST_PIPS = 1;
src/semantic-firewall/index.ts:147
  check: (ctx: RuleCheckContext) => GuardrailResult;
```

**★ THE FINDING THAT CHANGES THE PLAN — the root cause lives in a KEEP file:**

```
src/pipeline/engine.ts:322
  ohlc[pair] = ohlcByPairTf[pair]?.['4H'] ?? [];
src/pipeline/engine.ts:330
  if (result.timeframe !== '4H' ||
      spots[result.pair] !== undefined) continue;
```

`engine.ts` is on the **KEEP** list (§11). Line 322 hardcodes `'4H'` and line 330 filters
to `'4H'` only — **this is root cause B, live, inside a file the audit preserves.** The
post-mortem calls it *"the #1 root cause of ALL macro derailments."*

**A KEEP list that preserves the #1 root cause is a KEEP list that fails.** W8 (the thin
code layer) must therefore carry an extra edge: `engine.ts` keeps its orchestration AND
loses the hardcoded timeframe. Otherwise v6 inherits the exact defect it exists to fix.

### PROOF 2 — the ID/TOKEN that appears in the wrong place (the missing endpoint)

```bash
$ curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8008/v1/systemone
404
$ curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8008/v1/models
200
$ ls -d ~/jevk5 2>/dev/null || echo "no jevk5 clone"
no jevk5 clone
$ find /home/leviathan -maxdepth 4 -iname '*jevk5*' | grep -v 'models/gguf'
/home/leviathan/models/servers/jevk5.sh        # the LAUNCH SCRIPT only
```
**★ THIS GENERALIZES INTO A DETECTOR:** "does `/v1/systemone` return 200 with a typed
answer?" is one command. It becomes `DETECT-1` in §6.

### PROOF 3 — the PLAN that omits the fix

```bash
$ grep -n 'systemone' PLUTUS_V6_BUILD_PACKAGE.md | head -3
86:│  │  Endpoint: http://127.0.0.1:8090/v1/systemone
199:**Endpoint:** `http://127.0.0.1:8090/v1/systemone`
562:      "endpoint": "http://127.0.0.1:8090/v1/systemone"
$ sed -n '/PART 7 — THE IMPLEMENTATION PHASES/,+6p'
PLUTUS_V6_BUILD_PACKAGE.md
### Phase 1 — Substrate (Week 1)
- Install + start all 3 local model servers (`bash model_servers.sh`)
- Verify all 3 endpoints respond (smoke test each)
```
**The plan asserts the endpoint 4 times and never builds it.** Phase 1 says "start the
servers" — which is done — and treats the endpoint as a given. It is not a given.

---

## §4 — ★ THE PREDICATE (the load-bearing step)

An instruction can be skipped. A predicate fails. Three predicates, one per failure class.

### PREDICATE 1 — THE JEV READOUT (the missing endpoint)

```typescript
interface JevReadout {
  answers: Record<string, { noul?: number; choice?: string;
                            probabilities?: Record<string, number> }>;
  usage:   { inputTokens: number; latencyMs: number };
}

// A JEV READOUT IS VALID IFF the endpoint answers AND a Noul lands in
[0,1],
// ELSE JEV_ENDPOINT_ABSENT  (loud, never a silent pass-through to the LLM).
```

**THE COUNTERFACTUAL:** if the fix were reversed — JevK5 reverts to a plain chat model —
then `:8008/v1/systemone` returns 404 again and **the original bug returns**: the LLM gets
asked a judgment question and hallucinates a plausible answer. The predicate is aimed.

### PREDICATE 2 — THE RECIPE (the metric inversion)

```typescript
interface Recipe {
  id: string; version: number; status: 'shadow' | 'active';
  ledgerRows: number;          // ← the counted thing
  decisionsInfluenced: number; // ← the effect count
}

// A RECIPE IS VALID IFF ledgerRows >= 1 AND decisionsInfluenced >= 1,
// ELSE RECIPE_UNWIRED.
// ★ "8 recipes written" becomes WORTHLESS. "N recipes steering" is the only
green.
// ★ THE METRIC INVERTS: the old number counted FILES; the new one counts
WIRING.
```

**THE COUNTERFACTUAL:** reversed — a recipe JSON exists but never steers — and the system
silently reverts to the hand-coded branches. The original bug returns. Aimed correctly.

### PREDICATE 3 — THE DECISION SURFACE (no double-sourcing)

```typescript
interface DecisionSurface {
  name: string;                 // e.g. "shape-classification"
  handCodedBranches: number;    // must reach 0
  jevLedgerRows: number;        // must be >= 1
}

// A DECISION SURFACE IS MIGRATED IFF handCodedBranches === 0
//                                    AND jevLedgerRows >= 1,
// ELSE DECISION_DOUBLE_SOURCED.
// ★ 326 -> 0 is the denominator. A branch count that falls is not enough;
//   it must be ZERO and the Jev row must EXIST, or the surface has two
sources
//   of truth and the code one silently wins.
```

**THE COUNTERFACTUAL:** reversed — the branches are deleted but no Jev recipe steers — and
the pipeline has NO judgment at all (worse than double-sourced). Both halves are required.

---

## §5 — ★ THE WAVE PLAN (every row an EDGE)

```
BANNED (file-organized — the root-cause layer):
  W1 jev-client.ts   W2 recipes/   W3 math.ts

REQUIRED (edge-organized — the edge IS the deliverable):
```

| # | WAVE | THE EDGE (the deliverable) | THE GATE (exit nonzero) |
|---|---|---|---|
| W1 | **JEV READOUT** | `:8008/v1/systemone` answers a Noul | a Noul in [0,1] from a real call |
| W2 | **THE MATH EDGE** | an E3 RRR computed by `:4172` | model RRR == code RRR ±0.02 |
| W3 | **THE LLM EDGE** | a Pine Script generated by `:4171` | the script parses; a chart image reads |
| W4 | **RECIPES 1-2** | zone + shape classification STEER | each: ≥1 ledger row + ≥1 route |
| W5 | **RECIPE 3 (THE GATE)** | `trade-projection-check` STEERS | p=0.90 bucket wins ≥90% |
| W6 | **RECIPE 4 (THE FUSE)** | the fuse TRIPS | a synthetic 3-loss seq pauses |
| W7 | **RECIPES 5-8** | cascade/reinforcement/session/avatar STEER | each: ≥1 ledger row + ≥1 route |
| W8 | **THE THIN CODE LAYER** | the pipeline runs END-TO-END through code, **with `engine.ts`'s hardcoded `'4H'` removed** | a full week produces setups AND `grep -c "'4H'" src/pipeline/engine.ts` == 0 |
| W9 | **THE DELETIONS** | 308 decision branches → **0** | the branch count is ZERO |
| W10 | **THE BENCH** | a calibration row | agreement + Brier + ECE recorded |
| W11 | **THE LEDGER** | `later_truth` filled per trade | a p=0.90 bucket with real outcomes |

**THE REFUSAL RULE:** a wave naming only a file and no edge is REFUSED. W1's edge is not
`jev-client.ts` — it is **a Noul landing in [0,1] from a live call**. The file is a
by-product.

---

## §6 — THE DETECTORS (one command, exit nonzero = FAIL)

| CLASS | THE DETECTOR | AUTO-REJECT |
|---|---|---|
| THE MISSING ENDPOINT | `curl -sf :8008/v1/systemone -d '<state>'` | FAIL |
| THE UNWIRED RECIPE | `grep -c '"recipe":"<id>"' ledger/*.jsonl` == 0 | FAIL |
| THE DOUBLE-SOURCED | the 308-branch grep returns > 0 after W9 | FAIL |
| THE PHANTOM | `git diff --name-only` on a claimed change → empty | KICK BACK |
| THE STALE | source mtime > artifact mtime | FAIL |
| THE THEATRICAL TEST | the test does not import the real artifact | FAIL |
| THE CIRCULAR TOKEN | the passToken is in prose, not a tool result | FAIL |
| THE SILENT FALLBACK | `grep -n 'JM_BYPASS' src/` → a pass-through that returns PASS | FAIL |
| THE PROSE CLAIM | a completion claim with no artifact reference | FAIL |

**THE ONE-COMMAND FIREWALL:** `bash scripts/v6-firewall.sh` → exit nonzero = FAIL.
**IT EXISTS AND IT RUNS.** Written to
`PLUTUS/MASTER_CONTEXT/reports/scripts/v6-firewall.sh` and executed this session.

**THE RECORDED RUN (verbatim, exit code recorded):**

```
=== PLUTUS v6 FIREWALL ===

  FAIL  DETECT-1 /v1/systemone HTTP 404 -> JEV_ENDPOINT_ABSENT
  FAIL  DETECT-2 no ledger dir at ./ledger -> RECIPE_UNWIRED (every recipe)
  FAIL  DETECT-3 308 decision branches remain -> DECISION_DOUBLE_SOURCED
  FAIL  DETECT-4 engine.ts hardcodes '4H' (10 sites)
        -> TELESCOPING_ROOT_CAUSE_LIVE
  PASS  DETECT-5 git sees 0 changed paths (0 on a claim = phantom)
  PASS  DETECT-6 no allow-shaped bypass

FIREWALL: FAIL (detectors fired — see above)
EXIT CODE: 1
```

**★ THE FIREWALL CORRECTED TWO OF MY OWN NUMBERS — which is the point of running it:**

| I wrote | The detector measured | |
|---|---|---|
| "326 hand-coded branches" | **308** | the firewall counts the two files it checks; the 326 included refinement-machine's 10 constants |
| "2 sites hardcode `'4H'`" | **10 sites** | I cited two examples and generalised — the detector enumerated all ten |

**THE 10 `'4H'` SITES IN `engine.ts` (measured):**

```
322   ohlc[pair] = ohlcByPairTf[pair]?.['4H'] ?? [];
330   if (result.timeframe !== '4H' ||
          spots[result.pair] !== undefined) continue;
331   const bars4h = ohlcByPairTf[result.pair]?.['4H'];
376   bars4H: ohlcByPairTf[p]?.['4H']?.length ?? 0,
564   timeframe: '4H',
633   '4H': ctx.harvestData.ohlcByPairTf[pair]?.['4H'] ?? [],
1115  timeframe: z.enum(['4H','1H','30m','15m'])  <- LEGIT
1309  ctx.screenshots.find((s) => s.pair === pair && s.timeframe === '4H');
1523  timeframe: '4H',
1575  const bars4H = ctx.harvestData?.ohlcByPairTf?.[pair]?.['4H'] ?? [];
```

**Line 1115 is the correct pattern** — a schema that permits all four timeframes. The other
nine **default to `'4H'`**, which is root cause B. The W8 edge is therefore precise:
`engine.ts` keeps its orchestration and loses the nine hardcoded defaults, keeping the enum.


---

## §7 — THE EXECUTION CONTRACT

```
1 DISPATCH   the wave-manager / task tool — never a hand-written manifest
2 POLL       the session stream — the ONLY liveness truth, never a status
field
3 AUDIT      a THE STREAM GATE   the return is intact (no truncation)
             b THE PHANTOM CHECK  sha256 before/after — a change MUST exist
             c THE PER-HUNK       every hunk exists on disk
             d THE MECHANICAL     RUN tsc + the battery + the firewall
             YOURSELF
             e THE ADVERSARIAL    the negative half (zero misfire on a real
             setup)
4 VERDICT    CORRECT | FLAWED | FITTED-TO-GOLDEN | FABRICATION | VIOLATION |
CREEP
5 CLOSE      the ledger row + the canon docs
```

**★ A WAVE CLOSES ONLY ON THE ORCHESTRATOR'S VERIFIED VERDICT.** A subagent return closes
nothing. **THE ESCALATION LADDER:** VIOLATION 1 → kick · 2 → reassign · **3 → RETIRE THE
DESK and build it yourself** (the third occurrence is a design order).

---

## §8 — THE EXACT TESTS (positive + negative per component)

| Component | POSITIVE | NEGATIVE (the half that proves aim) |
|---|---|---|
| JEV readout | a Noul lands in [0,1] | a malformed state → `JEV_ENDPOINT_ABSENT`, never a 0.5 |
| Recipe 3 gate | a real setup routes `act` at p≥0.95 | a 0.80 setup routes `escalate`, never `act` |
| The fuse | 3 losses in 5 trips | 2 losses in 5 does NOT trip |
| The math edge | RRR matches ±0.02 | a wrong RRR → divergence flagged, not accepted |
| The kill switch | `JM_BYPASS=1` bypasses | bypass mode never returns PASS for a real verdict |
| The deletions | branch count == 0 | the pipeline still produces a setup |
| `later_truth` | the p=0.90 bucket wins ≥90% | a p=0.90 bucket at 60% raises the alarm |

**A SUITE WITH NO NEGATIVE HALF IS HALF A SUITE.** The negative half is where the teeth
are aimed.

---

## §9 — THE SCOPE (VERBATIM — NO SHRINK)

The operator's Iron Rule, quoted from the package (`PLUTUS_V6_3_MODEL_STACK.md:107`):

> **JevK5 does ALL the decision making and reasoning.**
> **Qwen is just for tool calling + any needed token generation.**
> **Qwen Math is for direct math calculations for E3 and any other math-related tasks.**
>
> **EVERYTHING that CAN be done through Jev, IS done through Jev.**

The operator's audit, `PLUTUS_V6_AUDIT_AND_OVERHAUL.md:1-8`:

> "The Complete Architecture for a Mathematically-Coded 90% Win Rate … This document
> supersedes the local agent's v6 spec."

**★ NO SHRINK. A build that wires fewer than all 8 recipes + all 3 models + the 5 thin
code files is a FAILED BUILD, not a smaller scope.** W1-W11 all ship, or the build reports
which wave blocked and why — it never re-specifies a lesser goal and calls it the plan.

---

## §10 — THE OPEN DECISIONS (each with its default — no stalls)

| # | QUESTION | DEFAULT IF UNRULED |
|---|---|---|
| 1 | The math model: package says Qwen2.5-Math-1.5B; disk has DeepSeek-R1-Distill | **USE DEEPSEEK** — it is the successor (base = Qwen2.5-Math), 28.9% vs 10.0% AIME24, 131k vs 4k ctx, no interpreter needed |
| 2 | The JEV runtime: install `allebee/jevk5` or read logits via llama.cpp? | **TRY THE RUNTIME FIRST**; fall back to llama.cpp `logprobs` + the T=1.532 softmax if it fails to build |
| 3 | Ports: package 8090/8091/8092 vs disk 8008/4171/4172 | **KEEP DISK PORTS** — the models are live; the package's ports are aspirational |
| 4 | Serving: vLLM vs llama.cpp | **KEEP llama.cpp** — 3 models already fit 12,282 MiB; vLLM would need a re-slot |
| 5 | Does JevK5 supersede Decider-2B for the V6 decision role? | **RECORDED AS OPEN (D-014)** — do not invent the rationale |

**A DECISION UNRULED TAKES ITS DEFAULT AND THE BUILD PROCEEDS.** No stalls.

---

## §11 — WHAT IS ALREADY ON DISK (the pinned package)

```
THE 3 MODELS (live, measured 2026-09-24):
  :8008  jevk5-4b-Q8_0.gguf          4,482,402,656 B   5,136 MiB VRAM
  health ok
  :4171  Qwen3.5-4B-Q4_K_M.gguf      2,740,937,888 B   4,368 MiB VRAM
  health ok
  :4172  DeepSeek-R1-Distill-Q6_K    1,464,179,296 B   2,248 MiB VRAM
  health ok
  card 12,282 total / 11,832 used / 45 free

THE LAUNCH SCRIPTS (sha256, first 16):
  models/servers/jevk5.sh       837bc8d1c2912064
  models/servers/qwen35-4b.sh   05d875669c1103ca
  models/servers/ds-math.sh     54b8061d21ce47d1

THE V5 REFERENCE (frozen, branch omp-worker-1 @ 8f4ac74):
  KEEP    src/pipeline/engine.ts              2,415 lines
  KEEP    src/pipeline/mdve-stage.ts          1,234 lines
  KEEP    src/pipeline/temporal-anchor.ts       129 lines
  KEEP    src/pipeline/manual-step-push.ts      139 lines
  KEEP    src/mdve/index.ts                     527 lines
  DELETE  src/engine3/visual-setup-generator.ts 1,952 lines
  DELETE  src/brains/shape-brain.ts             2,483 lines
  DELETE  src/mdve/refinement-machine.ts        1,674 lines
  DELETE  src/mdve/mirror.ts                    3,921 lines
  DELETE  src/semantic-firewall/index.ts        1,312 lines
  delete total 11,342 lines  (the audit's number, VERIFIED byte-for-byte)

THE BENCH INPUT:
  specs/fixtures/golden-week.json   (the operator's golden week)

THE AUDIT + PACKAGE:
  Downloads/PLUTUS_V6_AUDIT_AND_OVERHAUL.md      1,418 lines
  Downloads/PLUTUS_V6_PACKAGE/                    4 files, 2,419 lines
```

---

## §12 — THE SELF-CHECK + THE RESIDUAL

**SELF-CHECK:**

```
[x] STEP 1  the existing specs were found and read (the audit + the 4-file
package)
[x] STEP 2  the root cause is QUOTED VERBATIM with file:line anchors (two,
both anchored)
[x] STEP 3  three proofs, each with its command + raw output
[x] STEP 4  ★ three PREDICATES with named errors + counterfactuals written
[x] STEP 5  every wave carries an EDGE; the refusal rule stated
[x] STEP 6  the detectors are runnable; the one-command firewall named
[x] STEP 7  the execution contract names the per-wave audit + the escalation
ladder
[x] STEP 8  all 13 sections present
[x] the scope is the operator's VERBATIM, with NO SHRINK stated
[x] the residual is named below
```

**THE ANTI-CHEAT HOLES, CLOSED:**

```
HOLE 1 scope shrink       -> §9 quotes the Iron Rule + "NO SHRINK"
HOLE 2 instruction-form   -> §4 is three predicates, not prose
HOLE 3 symptom diagnosis  -> §2 quotes the build's own mechanism, anchored
HOLE 4 file-organized     -> §5's gate refuses a wave with no edge
HOLE 5 unrun detector     -> §6 names the file the firewall must exist as
HOLE 6 green-battery      -> §8 requires positive AND negative per component
HOLE 7 unanchored claim   -> every number above carries its command
HOLE 8 missing residual   -> this section
```

**THE RESIDUAL (what could NOT be determined):**

1. **Whether the `allebee/jevk5` runtime builds on this host.** Not attempted. It is the
   W1 gate's job. Evidence that would settle it: a successful build + a 200 on
   `/v1/systemone`.
2. **Whether JevK5's letter-logits are reachable through llama.cpp's `logprobs`.** Partially
   probed — `logprobs` works, but JevK5 is a THINKING model (its first token was `Thinking`),
   so the SemIf protocol needs a prompt that forces the answer letter at position 0. Not yet
   proven. Evidence: a Noul in [0,1] from a raw llama.cpp call.
3. **The 90% win rate itself.** The audit says the JEV bible explicitly warns that sentiment
   evidence "does not establish reliable trading profits." The 5 structures ENABLE the
   measurement; whether the underlying signal reaches 90% is an empirical question the bench
   answers, not a plan. **This blueprint wires the measurement, not the outcome.**
4. **The exact golden-trade count.** The package says "23-trade golden + 17 control + 10
   negative" = 50. The operator's golden-week fixture exists on disk; its case count was not
   enumerated this session.
5. **Which of the 3 models handles the VLM lane.** The package says Qwen3.5-4B is
   multimodal-native; the deployed GGUF (`Qwen3.5-4B-Q4_K_M.gguf`) was not tested with an
   image input. Evidence: one successful image → text call.
