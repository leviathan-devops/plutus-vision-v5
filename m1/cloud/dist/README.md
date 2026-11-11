# m1/cloud/dist — the built Worker bundle (engineering record)

The compiled, deployable form of the E1 Cloudflare Worker surface: the
route table, the Durable Object task graph, the forward-only state
machine, and the immutable seal adapters over the real R2/D1 bindings.

NOTE: wrangler's --outdir cleaning removes this README on every deploy;
regenerate it after each build (this is the recorded copy).

## Contents

| File | Role | Provenance |
|---|---|---|
| worker.js | the esbuild bundle (89.55 KiB upload, gzip 24.64 KiB) | wrangler 4.160.0 from m1/cloud/worker.ts |
| README.md | this record | primary-authored |

Bundle sha256 (frozen by P8.TURN-01): 2fdeb310320080a6e6765458f12e33f4a2e0781a8d033c7bf6ef839f3fd00742

## The build command

```bash
export CLOUDFLARE_API_TOKEN=$(python3 -c "import json,os;print(json.load(open(os.path.expanduser('~/.omp/agent/mcp.json')))['mcpServers']['cloudflare']['headers']['Authorization'][7:])")
npx wrangler deploy --config m1/cloud/wrangler.jsonc --outdir m1/cloud/dist
```

## Source of record (read these, not the bundle)

- m1/cloud/worker.ts:1 — the route table: POST /e1/run -> DO run; GET
  /e1/card/:asset/:monday -> sealed R2; GET /e1/pine/:asset/:monday ->
  composed R2; GET /e1/status/:run_id -> D1 row; unknown -> 404
  ROUTE_UNKNOWN. Worker-style: no node: imports; bindings wrapped by
  RealD1/RealR2 at m1/cloud/worker.ts:63 (depsFromEnv always wraps: a
  raw R2Bucket ducks as a store but streams its body).
- m1/cloud/worker.ts:51 — mondayValid + assetValid gates: POST bodies
  refuse E1_IDENTITY_INVALID on bad asset/week shapes.
- m1/cloud/worker.ts:118 — the status route reads durable D1 directly
  (the per-request adapters cannot share cache across requests).
- m1/cloud/do.ts:124 — E1Run extends DurableObject; the dual-shape
  constructor accepts (ctx, env) at runtime and (d1, r2) shims in the
  local checks.
- m1/cloud/do.ts:180 — run(): idempotent COMPLETE short-circuit,
  runWindow identity, evidence/pillar/organ allSettled waves, named
  critical-failure BLOCKED rows, derive+validate chain, R2 seals
  (cards/derived/pine/raw), D1 rows, optional Bend certificate.
- m1/cloud/state.ts:18 — the forward-only state machine: terminal
  states never advance (E1_DERIVED_CHAIN_INVALID), backward refused.
- m1/cloud/state.ts:84 — RealD1: write-through sync contract (insertRun
  caches before the SQL fires; getRun reads the cache; SQL is
  fire-and-forget with terminal-state guards).
- m1/cloud/state.ts:230 — RealR2.get consumes the ReadableStream body
  via Response (the raw binding returns a stream, not bytes) and
  decodes UTF-8 (staging artifacts are text; binary seals are
  write-only).
- m1/cloud/card/seal.ts:18 — the R2 key grammar: cards/ derived/ pine/
  raw/ + latest pointers.
- m1/cloud/scripts/checkWorker.ts:1 — the 5-token route gate.
- m1/cloud/scripts/checkTaskGraph.ts:1 — idempotency, parallel waves,
  named critical failures, forward-only.
- m1/cloud/scripts/checkPersistence.ts:1 — immutable puts, D1 rows,
  duplicate idempotency.
- m1/cloud/scripts/e2e.ts:1 — the parity harness (CLOUD_LOCAL_PARITY_OK
  demands identical typed evidence both sides).
- m1/cloud/scripts/fixtures.ts:14 — the fixture pack ROOT (three levels
  up after the m1/ relocation).

## Deploy history

- plutus-e1-staging.cryptoforex36963.workers.dev
- version c4d039c8 (first upload), 02920c5b (nodejs_compat), c1c16567
  (idFromName), 5b6c8b20 (stream-body fix - the parity carrier), and
  the final relocation build from m1/cloud/wrangler.jsonc.
- Bindings: E1_RUN (DurableObject E1Run, sqlite), E1_R2
  (plutus-e1-staging bucket), E1_D1 (f5ed4679-5707-4922-b5d7-8b90ec322f87,
  4 tables).
- Parity record: m1/out/w4/e2e-parity.out - CLOUD_RUN_CREATED,
  CLOUD_CARD_SHA_RETURNED sha=acee9172b8255a43, CLOUD_PINE_SHA_RETURNED
  sha=f44503d79368aae2, CLOUD_CARD_VALID, CLOUD_LOCAL_PARITY_OK
  worker==local (base and pine identical both sides), exit 0 - re-proven
  from the relocated path this session.

## Why the dist is committed

P8.TURN-01 freezes sha256sum of this exact file as package evidence, so
the bytes that carried CLOUD_LOCAL_PARITY_OK are preserved. Rebuilds
overwrite; the frozen SHAs live in the execution ledger (P6.DEPLOY,
P6.TURN-04, P6.RELOCATION) and m1/out/w4/e2e-parity.out. The staging
R2/D1 state was purged between deploys so immutable seals stay honest
(recorded in the ledger P6.DEPLOY note).

## Integration fixes by the primary (the wrangler-vs-bun seam)

1. E1Run re-export from the entrypoint (m1/cloud/worker.ts:134) -
   wrangler requires the DO class exported from main.
2. nodejs_compat for the engine's node:crypto.
3. idFromName for the DO id (the raw namespace requires DurableObjectId).
4. DurableObject base class (RPC requires extends; bun resolves the
   shim via tsconfig paths, wrangler bundles the real module).
5. RealD1/RealR2 adapters over the raw bindings.
6. Stream-body consumption in RealR2.get.
7. The status route's direct D1 read.

Each fix is verifiable here: the bundle contains the compiled forms;
the checks re-run against the sources exit 0.

End of the dist record.
