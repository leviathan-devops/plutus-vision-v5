// cloud/scripts/checkWorker.ts - P6.TURN-01 gate.
//
// Drives the REAL route table (handleRequest) with an in-process fetch stub
// for the DO runner and the REAL in-memory R2/D1 shims. Adversarial shapes:
// bad body (400), missing artifacts (404), unknown route (404 ROUTE_UNKNOWN).
// Legitimate shapes: seeded card/pine/status rows return 200. Pass tokens:
// ROUTE_RUN_OK, ROUTE_CARD_OK, ROUTE_PINE_OK, ROUTE_STATUS_OK, ROUTE_UNKNOWN_404.
import { handleRequest } from '../worker';
import type { RouteDeps } from '../worker';
import { InMemoryD1, InMemoryR2 } from '../state';
import { E1Run } from '../do';
import { e1Fixtures } from './fixtures';

const fx = e1Fixtures('EURUSD', '2026-07-06');
const d1 = new InMemoryD1();
const r2 = new InMemoryR2();
const runner = new E1Run(d1, r2);

const deps: RouteDeps = { runner, r2, d1 };

function req(method: string, path: string, body?: unknown): Request {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
    init.headers = { 'content-type': 'application/json' };
  }
  return new Request(`https://e1.local${path}`, init);
}

// Legitimate: POST /e1/run validates the body and runs the REAL DO graph.
{
  const res = await handleRequest(req('POST', '/e1/run', { asset: 'EURUSD', monday: '2026-07-06', fixtures: fx }), deps);
  if (res.status !== 200) throw new Error(`RUN_ROUTE_FAIL: POST /e1/run -> ${res.status} ${await res.text()}`);
  const out = (await res.json()) as { state: string; baseSha: string; derivedSha: string; pineSha: string };
  if (out.state !== 'COMPLETE' || !out.baseSha || !out.derivedSha || !out.pineSha) {
    throw new Error(`RUN_RESULT_FAIL: ${JSON.stringify(out).slice(0, 200)}`);
  }
  console.log(`ROUTE_RUN_OK state=${out.state} base=${out.baseSha.slice(0, 16)} pine=${out.pineSha.slice(0, 16)}`);
}

// Adversarial: a malformed body refuses with a named 400, never a run.
{
  const res = await handleRequest(req('POST', '/e1/run', { asset: 'NOPE', monday: 'not-a-monday' }), deps);
  if (res.status !== 400) throw new Error(`RUN_BODY_ADVERSARIAL_FAIL: bad body -> ${res.status}`);
  const err = (await res.json()) as { error: string };
  if (!err.error.includes('E1_IDENTITY_INVALID')) throw new Error(`RUN_BODY_TOKEN_FAIL: ${JSON.stringify(err)}`);
  console.log(`RUN_BODY_REJECTED ${err.error}`);
}
{
  const res = await handleRequest(req('POST', '/e1/run', 'not-json{{{'), deps);
  if (res.status !== 400) throw new Error(`RUN_UNPARSEABLE_FAIL: -> ${res.status}`);
  console.log('RUN_UNPARSEABLE_REJECTED');
}

// Legitimate: GET /e1/card/:asset/:monday reads the sealed R2 object.
{
  const res = await handleRequest(req('GET', '/e1/card/EURUSD/2026-07-06'), deps);
  if (res.status !== 200) throw new Error(`CARD_ROUTE_FAIL: -> ${res.status} ${await res.text()}`);
  const card = JSON.parse(await res.text()) as { sha256: string };
  if (typeof card.sha256 !== 'string' || card.sha256.length !== 64) throw new Error('CARD_SHAPE_FAIL');
  console.log(`ROUTE_CARD_OK sha=${card.sha256.slice(0, 16)}`);
}

// Adversarial: a week with no sealed card 404s by name, never an empty card.
{
  const res = await handleRequest(req('GET', '/e1/card/EURUSD/2026-07-13'), deps);
  if (res.status !== 404) throw new Error(`CARD_ABSENT_FAIL: -> ${res.status}`);
  console.log('CARD_ABSENT_404');
}

// Legitimate: GET /e1/pine/:asset/:monday reads the composed R2 object.
{
  const res = await handleRequest(req('GET', '/e1/pine/EURUSD/2026-07-06'), deps);
  if (res.status !== 200) throw new Error(`PINE_ROUTE_FAIL: -> ${res.status} ${await res.text()}`);
  const pine = await res.text();
  if (!pine.includes('//@version=5') || !pine.includes('2026-07-06')) throw new Error('PINE_SHAPE_FAIL');
  console.log(`ROUTE_PINE_OK bytes=${pine.length}`);
}

// Legitimate: GET /e1/status/:run_id reads the D1 row.
{
  const res = await handleRequest(req('GET', '/e1/status/EURUSD-2026-07-06'), deps);
  if (res.status !== 200) throw new Error(`STATUS_ROUTE_FAIL: -> ${res.status} ${await res.text()}`);
  const row = (await res.json()) as { state: string; base_sha: string; pine_sha: string };
  if (row.state !== 'COMPLETE') throw new Error(`STATUS_STATE_FAIL: ${JSON.stringify(row)}`);
  console.log(`ROUTE_STATUS_OK state=${row.state} base=${row.base_sha.slice(0, 16)}`);
}

// Adversarial: unknown route 404s with ROUTE_UNKNOWN.
{
  const res = await handleRequest(req('GET', '/nope'), deps);
  if (res.status !== 404) throw new Error(`UNKNOWN_ROUTE_FAIL: -> ${res.status}`);
  const err = (await res.json()) as { error: string };
  if (err.error !== 'ROUTE_UNKNOWN') throw new Error(`UNKNOWN_TOKEN_FAIL: ${JSON.stringify(err)}`);
  console.log('ROUTE_UNKNOWN_404');
}
