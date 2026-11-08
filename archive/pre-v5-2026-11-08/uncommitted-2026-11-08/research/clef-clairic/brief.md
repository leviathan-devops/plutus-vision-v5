# RESEARCH BRIEF — Cloudflare Clairic + Clef family vs the local Imajev-4B lane
Date: 2026-10-24 · Depth: deep (5 angles + primary-doc reads) · Status: OPEN until the local bake-off runs

## The question this answers
Can PLUTUS VISION be built with **no LLM and no agent anywhere in its runtime** — deterministic code plus
"System One" typed models, hosting on Cloudflare Workers + Durable Objects (+ pi-durable where relevant) —
and if so, which model does which job?

Three sub-questions, each independently decidable:

Q1. **Clairic** (`@cf/cloudflare/clairic`, $0.10/M input, 65,536 ctx, vision): is it a *new class* of System One
model (extraction / computation / estimation / forecast with calibrated abstention and character spans), or is it
a re-skin of the decision primitive we already run (noul / choice / score)?

Q2. **Clef family** (`clef` 27B $0.24/M, `clef-flash` 9B $0.038/M, `clef-omni` 30B-A3B $0.15/M): is there a
*tangible* value add over the **free, local, already-installed Imajev-4B** lane — given that Clef is merely cheap
and Imajev is free?

Q3. **Architecture**: under the hard constraint *no LLM, no agents; only CF Workers + Durable Objects +
pi-durable where relevant + these System One models*, what does the PLUTUS VISION runtime look like, and what
does the "sidecar agent" become?

## Scope boundaries
IN: the two model contracts (request/response schemas), published evaluations, pricing/rate limits, the CF
durable-execution primitives, and the PLUTUS_VISION canon (cards/, MASTER_CONTEXT graph, design blueprint v1.2).
OUT: re-litigating the E1/E2/E3 doctrine; writing product code; any change to the 163-card canon corpus.

## Assumptions to validate or invalidate (stated so they can be killed)
A1. "Clairic can do everything we were going to use an LLM for." → test against the enumerated runtime jobs.
A2. "We do not need an LLM for anything if we have Clairic." → separate RUNTIME from BUILD TIME.
A3. "Clef is worth paying for only if tangibly better than Imajev." → requires a *measured* head-to-head on OUR
    questions, not a benchmark table from a different panel.
A4. "The sidecar agent disappears under the constraint." → test what the sidecar actually does today.

## Evidence standard (the law for this brief)
- A benchmark number is evidence about *that benchmark on that panel*, never about our questions.
- Two leaderboards that share no models cannot produce a head-to-head. Overlap must be stated, gaps admitted.
- A model replaces the incumbent only on a **measured** win on the question it will actually answer.
- Absence of published evals is a finding, not a gap to be filled with inference.

## Decision rule (pre-registered, so the answer cannot drift)
Adopt a paid model for a lane ONLY IF, on >= 40 labelled cases drawn from our own corpus:
  (a) it beats the incumbent on that lane's question by >= 10 points of separation, AND
  (b) its calibration error (ECE) is <= 0.05, AND
  (c) it is deployable on the target host (CF Worker, or the host runner) with a named cost.
Otherwise the incumbent stays and the paid model is recorded as "no measured value add".

## Depth / angles
F1 Clairic public surface (docs, blog, HF, evals, limits)
F2 Clef family (architecture, context, pricing, latency, benchmark wins/losses)
F3 Imajev + Jev/SystemOne contract (the incumbent)
F4 Cloudflare durable stack (DO/Workflows/Cron/Queues/Workers AI from DO+Workflow, Python Workers)
F5 Forecast validity (is a typed `forecast` defensible for prices?)
F0 (primary, done directly) model schemas, pricing page, leaderboard JSON, neuron economics, canon reabsorption
