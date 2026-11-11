// cloud/worker.ts - the E1 Cloudflare Worker route table (P6.TURN-01).
//
// Routes:
//   POST /e1/run            -> validate body -> env.E1_RUN.get(id).run(input)
//   GET  /e1/card/:asset/:monday -> read sealed R2 object (latest card)
//   GET  /e1/pine/:asset/:monday -> read composed R2 object (latest pine)
//   GET  /e1/status/:run_id     -> read D1 runs row
//   anything else               -> 404 ROUTE_UNKNOWN
//
// Worker-style: no `node:` imports. No crypto/persistence of its own: hashing
// lives in the engine via the DO, artifacts live in R2, state lives in D1.
import { keys } from './card/seal';
import type { D1Store, R2Store } from './state';
import { RealD1, RealR2 } from './state';
import type { E1Fixtures } from './do';

export interface E1Bindings {
  E1_RUN: { idFromName(name: string): { name: string }; get(id: { name: string }): { run(input: unknown): Promise<unknown> } };
  E1_R2: R2Store;
  E1_D1: D1Store;
}

export interface RouteDeps {
  runner: { run(input: { asset: string; monday: string; runId?: string; fixtures?: Partial<E1Fixtures> }): Promise<unknown> };
  r2: R2Store;
  d1: D1Store;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function text(status: number, body: string, contentType: string): Response {
  return new Response(body, { status, headers: { 'content-type': contentType } });
}

function mondayValid(monday: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(monday);
  if (!m) return false;
  const d = new Date(`${monday}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.getUTCDay() === 1;
}

function assetValid(asset: string): boolean {
  return asset === 'DXY' || asset === 'EURUSD' || asset === 'GBPUSD';
}

export function depsFromEnv(env: E1Bindings, runId: string): RouteDeps {
  const stub = env.E1_RUN.get(env.E1_RUN.idFromName(runId));   // the real namespace requires a DurableObjectId (idFromName)
  // the route table speaks the D1Store/R2Store contracts. A raw R2Bucket ALSO has .put (its .get
  // returns a stream body), so duck-typing cannot tell them apart - ALWAYS wrap the raw bindings.
  // The local checks never call depsFromEnv; they build RouteDeps with the in-memory stores directly.
  const deps: RouteDeps & { __rawD1?: unknown } = {
    runner: { run: (input) => stub.run(input) },
    r2: new RealR2(env.E1_R2 as never),
    d1: new RealD1(env.E1_D1 as never),
  };
  deps.__rawD1 = env.E1_D1;
  return deps;
}

export async function handleRequest(req: Request, deps: RouteDeps): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  if (req.method === 'POST' && path === '/e1/run') {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json(400, { error: 'E1_IDENTITY_INVALID', detail: 'RUN_BODY_UNPARSEABLE: POST /e1/run needs a JSON body' });
    }
    const b = body as { asset?: unknown; monday?: unknown; runId?: unknown; fixtures?: Partial<E1Fixtures> };
    if (typeof b.asset !== 'string' || !assetValid(b.asset)) {
      return json(400, { error: 'E1_IDENTITY_INVALID', detail: `RUN_ASSET_INVALID: asset must be DXY|EURUSD|GBPUSD (got ${JSON.stringify(b.asset)})` });
    }
    if (typeof b.monday !== 'string' || !mondayValid(b.monday)) {
      return json(400, { error: 'E1_IDENTITY_INVALID', detail: `RUN_MONDAY_INVALID: monday must be a YYYY-MM-DD Monday (got ${JSON.stringify(b.monday)})` });
    }
    if (b.runId !== undefined && typeof b.runId !== 'string') {
      return json(400, { error: 'E1_IDENTITY_INVALID', detail: 'RUN_ID_INVALID: runId must be a string when present' });
    }
    const out = await deps.runner.run({ asset: b.asset, monday: b.monday, ...(b.runId ? { runId: b.runId } : {}), ...(b.fixtures ? { fixtures: b.fixtures } : {}) });
    return json(200, out);
  }

  const cardMatch = /^\/e1\/card\/([^/]+)\/([^/]+)$/.exec(path);
  if (req.method === 'GET' && cardMatch) {
    const asset = decodeURIComponent(cardMatch[1] as string);
    const monday = decodeURIComponent(cardMatch[2] as string);
    if (!assetValid(asset) || !mondayValid(monday)) {
      return json(400, { error: 'E1_IDENTITY_INVALID', detail: `CARD_IDENTITY_INVALID: /e1/card needs asset + Monday monday (got ${asset}/${monday})` });
    }
    const latest = await deps.r2.get(keys.latestCard(asset, monday));
    if (latest === null) return json(404, { error: 'E1_CARD_INVALID', detail: `CARD_ABSENT: no sealed card for ${asset} ${monday}` });
    const sha = String(latest);
    const body = await deps.r2.get(keys.card(asset, monday, sha));
    if (body === null) return json(404, { error: 'E1_CARD_INVALID', detail: `CARD_OBJECT_ABSENT: latest sha ${sha} has no object` });
    if (typeof body === 'string') return text(200, body, 'application/json');
    return new Response(body as Uint8Array, { status: 200, headers: { 'content-type': 'application/json' } });
  }

  const pineMatch = /^\/e1\/pine\/([^/]+)\/([^/]+)$/.exec(path);
  if (req.method === 'GET' && pineMatch) {
    const asset = decodeURIComponent(pineMatch[1] as string);
    const monday = decodeURIComponent(pineMatch[2] as string);
    if (!assetValid(asset) || !mondayValid(monday)) {
      return json(400, { error: 'E1_IDENTITY_INVALID', detail: `PINE_IDENTITY_INVALID: /e1/pine needs asset + Monday monday (got ${asset}/${monday})` });
    }
    const latest = await deps.r2.get(keys.latestPine(asset, monday));
    if (latest === null) return json(404, { error: 'E1_CARD_INVALID', detail: `PINE_ABSENT: no composed pine for ${asset} ${monday}` });
    const sha = String(latest);
    const body = await deps.r2.get(keys.pine(asset, monday, sha));
    if (body === null) return json(404, { error: 'E1_CARD_INVALID', detail: `PINE_OBJECT_ABSENT: latest sha ${sha} has no object` });
    if (typeof body === 'string') return text(200, body, 'text/plain');
    return new Response(body as Uint8Array, { status: 200, headers: { 'content-type': 'text/plain' } });
  }

  const statusMatch = /^\/e1\/status\/([^/]+)$/.exec(path);
  if (req.method === 'GET' && statusMatch) {
    const runId = decodeURIComponent(statusMatch[1] as string);
    // cross-request read: query the durable D1 table directly (the in-memory adapters are per-request)
    const cached = (() => { try { return deps.d1.getRun(runId); } catch { return null; } })();
    if (cached) return json(200, cached);
    const raw = (deps as { __rawD1?: { prepare(sql: string): { bind(...a: unknown[]): { all<T>(): Promise<{ results: T[] }> } } } }).__rawD1;
    if (raw) {
      const r = await raw.prepare('SELECT * FROM runs WHERE id = ?').bind(runId).all<Record<string, unknown>>();
      if (r.results.length) return json(200, r.results[0]);
    }
    return json(404, { error: 'E1_IDENTITY_INVALID', detail: `STATUS_UNKNOWN_RUN: ${runId}` });
  }

  return json(404, { error: 'ROUTE_UNKNOWN', detail: `no route ${req.method} ${path}` });
}

const worker = {
  async fetch(request: Request, env: E1Bindings): Promise<Response> {
    return handleRequest(request, depsFromEnv(env, 'e1'));
  },
};

export default worker;
export { E1Run } from './do';   // the DO must be exported from the entrypoint (wrangler requirement)
