# ARCHIVED 2026-11-06 — the cf/ draft (operator ruling R-25)

> "sure archive it we are building authoritative v5 right now"

This is the prior agent's Cloudflare draft (imported 2026-10-26 in ea8c45a, repaired once in fc82ac4).
It is REFERENCE ONLY. Nothing is built from it and nothing is ported from it (R-02).

## Why it was archived (the ruling conflicts)

| Ruling | What the draft does | What the ruling requires |
|---|---|---|
| R-19 (pi-durable sidecar) | Uses a Cloudflare Workflow | pi-durable harness in a Durable Object |
| R-21 (no agent loops) | N/A (mechanical, but the wrong orchestration) | pi-durable Tasks |
| R-22 (everything on Cloudflare) | Bars come from the operator host | Bars fetched in Cloudflare from TradingView |
| R-14 (every token of the 5.3.3 prompt) | Covers 2 of 19 Part III sources | All 19 sources |
| R-16 (E3 authority = the corrected prompt) | E3 is a v8 parity port | TRIDENT_v5.3.3_CORRECTED_E3_ENGINE.md |
| R-23 (TradingView via tvDatafeed) | Bars from the host uploader | TradingView data in Cloudflare |

## What it contains (for reference)

| File | Lines | What it is |
|---|---|---|
| src/index.ts | 70 | The Worker front door: /run, /card, /ledger, /health |
| src/workflow/pv-week.ts | 224 | The 12-step pipeline |
| src/do/WeekSeal.ts | — | One card per pair-week |
| src/do/Ledger.ts | — | The decision log |
| src/steps/capture.ts | — | Browser screenshot |
| src/steps/clairic.ts | 158 | Image reader |
| src/steps/clef.ts | 228 | Judge calls |
| src/e1/ | 242+ | E1 draft |
| src/e2/ | 258+ | E2 draft |
| src/e3/ | 168 | E3 draft (v8 port, now archived) |
| cf/PSEUDOCODE_BASE.md | 827 | The pseudocode the draft was built from |

## ANCHOR INDEX

package.json:1 — the draft's dependencies.
src/index.ts:1 — the Worker entry point.
src/workflow/pv-week.ts:1 — the 12-step workflow.
upstream/PROVENANCE.md:1 — the plutus-browser provenance (for comparison).
docs/BUILD_REPORT.md:1 — the plutus-browser build record.
Each line above was verified during the 2026-11-06 archive cycle.

## It was never deployed

Cloudflare API (2026-11-06): 0 Workers, 0 Durable Objects, 0 Workflows on the account.
The commit fc82ac4's "live Worker /health" was a local wrangler dev check, not a deployment.
