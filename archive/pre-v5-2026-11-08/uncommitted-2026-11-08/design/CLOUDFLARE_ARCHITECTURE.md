# PLUTUS VISION — THE CLOUDFLARE ARCHITECTURE
## Workers · Durable Objects · Workflows · Clef · Clairic · R2 · D1 · Browser Rendering · pi-durable

---

# §0 · THE CONSTRAINT

```
┌──────────────────────────────────────────────────────────────────────┐
│  PINE SCRIPT CANNOT FETCH.                                           │
│  A SYSTEM ONE MODEL CANNOT REASON, COUNT, OR WRITE.                  │
│  THE OPERATOR FORBIDS AN LLM AND AN AGENT AT RUNTIME.                │
│                                                                      │
│  => code computes · Clairic reads · Clef judges · code decides       │
│  => every step is a Cloudflare primitive, not a process              │
└──────────────────────────────────────────────────────────────────────┘
```

---

# §1 · THE TOPOLOGY

```
                    ┌─────────────────────────────┐
                    │  POST /run  {pair, week}    │
                    │  Workers · src/index.ts     │
                    └──────────────┬──────────────┘
                                   │ PV_WEEK.create()
                                   ▼
        ┌──────────────────────────────────────────────────┐
        │  WORKFLOW  pv-week   (Workflows)                 │
        │  S0 arm → S1 harvest → S2 capture → S3 extract   │
        │  → S4 e1.compute → S5 e1.attest → S6 e2.chain    │
        │  → S7 e3.setups → S8 seal                        │
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
                                   ▼
                    ┌──────────────────────────────┐
                    │  DO  Ledger                  │
                    │  one row per model call      │
                    │  (SQLite, per run)           │
                    └──────────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │  DO  WeekSeal                │
                    │  ONE WRITE per (pair, week)  │
                    │  returns the existing sha    │
                    └──────────────┬───────────────┘
                                   │ GET /card
                                   ▼
                    ┌──────────────────────────────┐
                    │  PINE  one input field       │
                    │  parse → cast → draw         │
                    └──────────────────────────────┘
```

---

# §2 · EVERY BINDING, ITS JOB, ITS FAILURE

| binding | class | job | on failure |
|---|---|---|---|
| `PV_WEEK` | Workflow | the orchestrator; fixed steps, retries, durable state | a step throws a named `Fatal`; the run stops |
| `WEEK_SEAL` | Durable Object (SQLite) | exactly-once card per (pair, week) | second write returns the existing sha, never overwrites |
| `LEDGER` | Durable Object (SQLite) | one row per model call, written by the engine | a call with no row is a bug, not a result |
| `AI` | Workers AI | Clairic extraction + Clef judgement | `E_JUDGE_DOWN`; critical surfaces fail closed |
| `BROWSER` | Browser Rendering | render the options-expiry page to PNG | `W2_CAPTURE_EMPTY`; no card |
| `R2` | object store | bars, captures, sealed cards | `W1_BARS_ABSENT`; no card |
| `D1` | SQL | the queryable run index (pair, week, status, sha) | the run still seals; the index row is missing → `D1_INDEX_FAILED` |

**No binding is optional.** `wrangler.jsonc` declares all seven; the `Env` interface names all
seven; `grep -rho "env\.[A-Z_]*" src | sort -u` returns exactly those seven.

---

# §3 · THE WORKFLOW — every step typed, keyed, retried

| # | step | consumes | produces | retry |
|---|---|---|---|---|
| S0 | `arm` | `{pair, week}` | D1 run row, anchor, weekEnd | none (idempotent by `runs.id`) |
| S1 | `harvest` | `R2 barsR2Key` | `Record<tf, Bars>` | 3 × linear 5 s |
| S2 | `capture.options` | `BROWSER` + url | PNG bytes + `captures/…/options.png` | 3 × linear 10 s |
| S3 | `extract.options` | PNG + `OPTIONS_FIELDS` | `Walls` (5 invariants) | 2 × constant 5 s |
| S4 | `e1.compute` | bars + walls | `Zone[]` with receipts | none |
| S5 | `e1.attest` | zones | attested `Zone[]` | none (judge call inside) |
| S6 | `e2.chain` | zones + prior-week bars | `ShapeLink[]` + alternative | none |
| S7 | `e3.setups` | chain + zones | `Setup[]` + refusals | none |
| S8 | `seal` | the card | `{sha, created}` + R2 + D1 | none (the DO is the exactly-once point) |

**A retry never re-runs a completed step** — Workflows persists each step's result, so a failure at
S6 resumes there with S1–S5's outputs intact.

---

# §4 · THE TWO DURABLE OBJECTS

```
┌──────────────────────────────────────────────────────────────────────┐
│ WeekSeal  ·  name = `${pair}:${week}`                                │
│   writeOnce(card) -> { sha, created }                                │
│     existing row ? return its sha (created:false) : insert, true     │
│   read() -> { sha, card } | null                                     │
│   WHY A DO: two concurrent workflow runs must not both write a card. │
├──────────────────────────────────────────────────────────────────────┤
│ Ledger  ·  name = runId                                              │
│   append(row)   ts·stage·model·state_hash·fingerprint·answers·       │
│                 policy·route·route_reason·cost·latency·cache_hit     │
│   rows(run) -> every decision, in order                              │
│   WHY A DO: the ledger is written by the ENGINE (inside ask()), so    │
│   a caller cannot forget it; a DO gives one writer per run.           │
└──────────────────────────────────────────────────────────────────────┘
```

---

# §5 · THE MODEL LANES

```
┌──────────────────────────────────────────────────────────────────────┐
│ CLAIRIC  @cf/cloudflare/clairic        the READER                    │
│   in : { state, images[1], fields{7} }                               │
│   out: { answers: { field: {value, p_null, confidence, span} } }      │
│   used: S3 only.                                                     │
│   gate: 5 invariants + p_null abstention. Never a guess.              │
├──────────────────────────────────────────────────────────────────────┤
│ CLEF     @cf/cloudflare/clef           the JUDGE                     │
│   in : { state, questions[] }   <= 64 questions, <= 60 words each    │
│   out: { answers: { qid: {noul|score|choice} } }                     │
│   used: S5 (Z1–Z4), S6 (A1–A4, B1, C1–C2), S7 (D1–D5, D6–D7)        │
│   gate: state completeness · schema caps · answer ranges ·           │
│         constant-judge control · ledger row.                         │
└──────────────────────────────────────────────────────────────────────┘
```

**Both are Workers AI models behind one binding.** No API key, no external HTTP, no vendor SDK.

---

# §6 · PI-DURABLE — where Cloudflare is NOT the best option

| leg | Cloudflare is best? | why | the pi-durable role |
|---|---|---|---|
| workflow orchestration | **YES** | durable steps, retries, observability | — |
| exactly-once seal | **YES** | a DO is the primitive for it | — |
| the ledger | **YES** | SQLite per run, one writer | — |
| Clairic / Clef calls | **YES** | same-region binding, no egress | — |
| rendering a public page | **YES** | Browser Rendering | — |
| **rendering a page behind a login or an anti-bot wall** | **NO** | Browser Rendering cannot hold a human session | **pi-durable runs the capture step**, writes the same R2 key, returns the same PNG |
| **driving the local Pine IDE for pixel verification** | **NO** | it is a desktop app on this host | **pi-durable runs the rig driver**; the verdict is still written by the gate |
| **local dev without a Cloudflare account** | **NO** | no account, no bindings | **pi-durable runs the parity harness** (`bun test/zfp-parity.ts`) |

**The contract for every pi-durable leg:** same input type, same output type, same R2 key, same
error codes. It is a substitute *executor*, never a substitute *architecture* — and it is used only
where the table above says Cloudflare cannot do the job.

---

# §7 · WHAT IS BUILT — measured this session

```
cf/wrangler.jsonc          22 L   seven bindings, one workflow, one migration
cf/migrations/0001_runs.sql 12 L  the D1 run index
cf/src/index.ts            65 L   5 routes: /health /run /card /runs /ledger
cf/src/workflow/pv-week.ts 233 L  S0..S8, typed, retried
cf/src/do/WeekSeal.ts      38 L   the exactly-once seal (SQLite)
cf/src/do/Ledger.ts        45 L   one row per model call
cf/src/steps/clef.ts       163 L  state gate · schema caps · answer gate · constant control · ledger
cf/src/steps/clairic.ts    107 L  the 7-field schema + I1..I5 + abstention
cf/src/steps/guards.ts     32 L   runtime narrowing, no any
cf/src/e1/zfp.ts           191 L  fail-closed ZFP (port of the 24/24-mutation Python)
cf/src/e1/build.ts         229 L  pillars → cluster → confluence → degree → ZFP → roles → attest
cf/src/e2/chain.ts         255 L  stages A/B/C, licensed sets, walk, days, alternative
cf/src/e3/setups.ts        163 L  geometry, composite, 10 kill clauses, stages A/B
cf/src/gate/policy.ts       27 L  calibration-sourced bars (E_UNCALIBRATED if absent)
cf/src/card/schema.ts      110 L  trident-workflow-v2 + token ceiling
cf/src/cloudflare.d.ts      97 L  the exact binding surface, declared locally
cf/test/zfp-parity.ts       97 L  the Python mutation matrix, re-run in TS
```

```
typecheck     tsc --noEmit -p cf/tsconfig.json          rc=0
parity        bun cf/test/zfp-parity.ts                 23 passed, 0 failed, rc=0
firewall      bash gates/firewall.sh                    rc=0
must-fail     tamper gates/G1.sh -> FIREWALL:PIN_MISMATCH:G1   rc=1
              restore             -> rc=0
```

---

# §8 · WHAT IS BLOCKED — named, one action each

```
BLOCKED: deploy            — no Cloudflare credential in this environment
        unblock:        CLOUDFLARE_API_TOKEN=… npx wrangler deploy   (or `cf auth login`)

BLOCKED: D1 database_id    — wrangler.jsonc carries REPLACE_AT_CREATE
        unblock:        npx wrangler d1 create plutus-vision  -> paste the id

BLOCKED: R2 bucket         — `plutus-vision` must exist
        unblock:        npx wrangler r2 bucket create plutus-vision

BLOCKED: calibration       — calibration/{e1,e2,e3,g3,g4}.json do not exist
        unblock:        run the sweeps; policy.ts refuses to construct a Policy without them
```

**The code is complete and typechecks. The four items above are account-side facts, not code.**

---

# §9 · THE RISK REGISTER

| sev | risk | mitigation | what would falsify it |
|---|---|---|---|
| CRIT | a model returns a plausible number for an absent field | state-completeness gate resolves every path before the call | a planted hollow state raises `E_STATE_INCOMPLETE` |
| CRIT | a judge answers 0.99 to everything | constant-judge control voids the call | the control fires on a stubbed judge |
| CRIT | two runs write two cards | the DO returns the existing sha | a second `writeOnce` returns `created:false` |
| HIGH | a step retries and double-charges | Workflows persists step results | a re-run resumes at the failed step |
| HIGH | the ZFP drifts from the Python | parity test re-runs the same 23 cases | a changed constant fails parity |
| HIGH | a policy with no sweep is used | `policy()` throws `E_UNCALIBRATED` | deleting a calibration file breaks boot |
| MED | the ledger row is skipped | written inside `ask()`, not by the caller | no row → no call |
| MED | the card overflows Pine's input | `assertCardBudget` at 3,500 tokens | a card > ceiling throws `CARD_OVERFLOW` |
