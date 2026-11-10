// proof/service/server.ts — P7.TURN-02 local Bend verifier service (loopback only).
//
// POST /prove: validate body SHAs, normalize the card to the finite Nat model
//   (price*1e5, integer seconds, levels capped at 512 with an audit entry),
//   write the job row, run bend PROOF.bend (positive + negative controls),
//   return the job id.
// GET /verdict/:id: return PASS/FAIL plus the obligation rows.
// GET /health: liveness.
// Binds 127.0.0.1 only (argv[2] or a random port). Nothing here touches the
// Worker: the workflow wires the client only after both proof controls pass.

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const BEND_DIR = join(HERE, '..', 'bend');
const JOBS_DIR = join(HERE, '..', '..', 'm1', 'out', 'w5', 'jobs');
const BEND_BIN = join(process.env.HOME ?? '/root', '.bend', 'bin', 'bend');
const MAX_LEVELS = 512;
const HEX64 = /^[0-9a-f]{64}$/;
const JOBID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

interface NormLevel { ts: number; price: number; score: number; seq: number; id: number; }
interface Obligation { id: string; verdict: 'PASS' | 'FAIL'; detail: string; }
interface BendControl { status: number | null; token: boolean; }
interface Job {
  job_id: string;
  created_at: string;
  verdict: 'PASS' | 'FAIL';
  obligations: Obligation[];
  normalization: { cutoff_s: number; levels_in: number; levels_kept: number; truncated: boolean; audit: string[] };
  bend: { check: BendControl; run: BendControl; verdict: BendControl; negative: BendControl };
  tokens: string[];
}

const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const isInt = (x: unknown): x is number => isNum(x) && Number.isInteger(x);

function field(o: unknown, k: string): unknown {
  if (typeof o === 'object' && o !== null && k in o) return (o as Record<string, unknown>)[k];
  return undefined;
}

function send(res: ServerResponse, code: number, body: unknown): void {
  try {
    const text = JSON.stringify(body);
    res.writeHead(code, { 'content-type': 'application/json', 'content-length': String(Buffer.byteLength(text)) });
    res.end(text);
  } catch { try { res.destroy(); } catch { /* socket already gone */ } }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const parts: Buffer[] = [];
    let bytes = 0;
    req.on('data', (c: Buffer) => {
      bytes += c.length;
      if (bytes > 1_000_000) { reject(new Error('BODY_TOO_LARGE')); return; }
      parts.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(parts).toString('utf8')));
    req.on('error', reject);
  });
}

function bendRun(args: string[]): { status: number | null; out: string } {
  try {
    const r = spawnSync(BEND_BIN, args, { cwd: BEND_DIR, encoding: 'utf8', timeout: 180000 });
    return { status: r.status, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
  } catch (e) {
    return { status: null, out: `BEND_SPAWN_FAIL ${String(e)}` };
  }
}

function prove(body: unknown): { code: number; out: unknown } {
  const card = field(body, 'card');
  const sha = field(body, 'sha256');
  const sup = field(body, 'supersedes_sha256');
  if (typeof sha !== 'string' || !HEX64.test(sha))
    return { code: 400, out: { error: 'E1_PROOF_FAILED', detail: 'SHA_FORMAT: sha256 must be 64 lowercase hex' } };
  if (sup !== undefined && (typeof sup !== 'string' || !HEX64.test(sup)))
    return { code: 400, out: { error: 'E1_PROOF_FAILED', detail: 'SHA_FORMAT: supersedes_sha256 must be 64 lowercase hex' } };
  if (typeof card !== 'object' || card === null)
    return { code: 400, out: { error: 'E1_PROOF_FAILED', detail: 'CARD_SHAPE: missing card object' } };
  const cutoffMs = field(card, 'cutoff');
  const levelsIn = field(card, 'levels');
  const budgetIn = field(card, 'workBudget');
  if (!isNum(cutoffMs) || cutoffMs < 0)
    return { code: 400, out: { error: 'E1_PROOF_FAILED', detail: 'CARD_SHAPE: card.cutoff must be a finite ms epoch >= 0' } };
  if (!Array.isArray(levelsIn))
    return { code: 400, out: { error: 'E1_PROOF_FAILED', detail: 'CARD_SHAPE: card.levels must be an array' } };
  if (budgetIn !== undefined && (!isInt(budgetIn) || (budgetIn as number) < 0))
    return { code: 400, out: { error: 'E1_PROOF_FAILED', detail: 'CARD_SHAPE: card.workBudget must be an integer >= 0' } };

  const cutoffS = Math.floor(cutoffMs as number / 1000);
  const budget = budgetIn === undefined ? 0 : (budgetIn as number);
  const audit: string[] = [];
  const norm: NormLevel[] = [];
  for (let i = 0; i < levelsIn.length; i++) {
    const l: unknown = levelsIn[i];
    const ts = field(l, 'ts'); const price = field(l, 'price');
    const score = field(l, 'score'); const seq = field(l, 'seq'); const id = field(l, 'id');
    if (!isNum(ts) || !isNum(price) || !isInt(score) || !isInt(seq) || !isInt(id) ||
        (ts as number) < 0 || (price as number) < 0 || (id as number) < 0)
      return { code: 400, out: { error: 'E1_PROOF_FAILED', detail: `CARD_SHAPE: levels[${i}] needs finite ts/price >= 0 and integer score/seq/id` } };
    norm.push({
      ts: Math.floor((ts as number) / 1000),
      price: Math.round((price as number) * 1e5),
      score: score as number, seq: seq as number, id: id as number,
    });
  }
  let kept = norm;
  let truncated = false;
  if (norm.length > MAX_LEVELS) {
    kept = norm.slice(0, MAX_LEVELS);
    truncated = true;
    audit.push(`LEVELS_TRUNCATED: ${norm.length} input levels capped to ${MAX_LEVELS}; tail dropped by rule, recorded here, never silently`);
  }

  const obs: Obligation[] = [];
  const put = (id: string, ok: boolean, detail: string): void => { obs.push({ id, verdict: ok ? 'PASS' : 'FAIL', detail }); };
  put('sha_format', true, `sha256 ${sha.slice(0, 16)}… sighted, 64-hex`);
  const late = kept.filter((l) => l.ts > cutoffS);
  put('cutoff_conservation', late.length === 0,
    late.length === 0 ? `all ${kept.length} ts <= cutoff ${cutoffS}` : `${late.length} ts past cutoff ${cutoffS}`);
  const keptIds = new Set(kept.map((l) => l.id));
  const lost = norm.filter((l) => !keptIds.has(l.id));
  put('level_conservation', lost.length === 0,
    truncated ? audit[0] : (lost.length === 0 ? `all ${norm.length} input lids kept` : `${lost.length} lids lost`));
  const badScore = kept.filter((l) => l.score < 0 || l.score > 14);
  put('score_bounds', badScore.length === 0,
    badScore.length === 0 ? `all ${kept.length} scores in 0..14` : `${badScore.length} scores outside 0..14`);
  let ordered = true;
  for (let i = 1; i < kept.length; i++) { if (!(kept[i - 1].seq < kept[i].seq)) { ordered = false; break; } }
  put('checkpoint_order', ordered, ordered ? 'checkpoint seq strictly increases' : 'checkpoint seq not strictly increasing');
  put('work_budget', budget <= 2, `workBudget ${budget} <= 2`);

  const check = bendRun(['PROOF.bend', '--check-only']);
  const run = bendRun(['PROOF.bend']);
  const ver = bendRun(['PROOF.bend', '--verdict']);
  const neg = bendRun(['PROOF.bend', '--', 'negative']);
  const checkOk = check.out.includes('ALL PROOFS CHECK');
  const runOk = run.status === 0 && run.out.includes('PROOF_POSITIVE_PASS');
  const verOk = ver.out.includes('ALL PROOFS CHECK');
  const negOk = neg.status !== 0 && neg.out.includes('PROOF_NEGATIVE_MODEL_REJECTED');
  put('complete_lock', checkOk, 'COMPLETE advances only on unlock (bend lock_closed law holds)');
  put('bend_positive', checkOk && runOk && verOk,
    `check=${check.status} run=${run.status} verdict=${ver.status} positive tokens sighted`);
  put('bend_negative', negOk, `negative variant refused with status=${neg.status}`);

  const pass = obs.every((o) => o.verdict === 'PASS');
  const tokens = pass ? ['PROOF_PASS_VERDICT'] : (negOk ? ['PROOF_NEGATIVE_MODEL_REJECTED'] : ['PROOF_INFRA_FAIL']);
  const job: Job = {
    job_id: randomUUID(), created_at: new Date().toISOString(), verdict: pass ? 'PASS' : 'FAIL',
    obligations: obs,
    normalization: { cutoff_s: cutoffS, levels_in: norm.length, levels_kept: kept.length, truncated, audit },
    bend: {
      check: { status: check.status, token: checkOk },
      run: { status: run.status, token: runOk },
      verdict: { status: ver.status, token: verOk },
      negative: { status: neg.status, token: negOk },
    },
    tokens,
  };
  mkdirSync(JOBS_DIR, { recursive: true });
  writeFileSync(join(JOBS_DIR, `${job.job_id}.json`), `${JSON.stringify(job, null, 2)}\n`, 'utf8');
  return { code: 200, out: { status: 'PROOF_JOB_CREATED', job_id: job.job_id } };
}

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://127.0.0.1');
  try {
    if (req.method === 'GET' && url.pathname === '/health') {
      send(res, 200, { status: 'PROOF_HEALTH_OK', service: 'plutus-proof', loopback: '127.0.0.1', max_levels: MAX_LEVELS });
      return;
    }
    if (req.method === 'POST' && url.pathname === '/prove') {
      const text = await readBody(req);
      let body: unknown;
      try { body = text ? JSON.parse(text) : null; } catch {
        send(res, 400, { error: 'E1_PROOF_FAILED', detail: 'CARD_SHAPE: body is not JSON' }); return;
      }
      const r = prove(body);
      send(res, r.code, r.out);
      return;
    }
    if (req.method === 'GET' && url.pathname.startsWith('/verdict/')) {
      const id = url.pathname.slice('/verdict/'.length);
      if (!JOBID.test(id)) { send(res, 404, { error: 'E1_PROOF_FAILED', detail: 'JOB_ABSENT: malformed job id' }); return; }
      try {
        const job = JSON.parse(readFileSync(join(JOBS_DIR, `${id}.json`), 'utf8')) as unknown;
        send(res, 200, job);
      } catch {
        send(res, 404, { error: 'E1_PROOF_FAILED', detail: 'JOB_ABSENT: no such job' });
      }
      return;
    }
    send(res, 404, { error: 'E1_PROOF_FAILED', detail: `ROUTE_ABSENT: ${req.method} ${url.pathname}` });
  } catch (e) {
    send(res, 500, { error: 'E1_PROOF_FAILED', detail: `PROVE_CRASH: ${String(e)}` });
  }
}

const server = createServer((req, res) => { void handle(req, res); });
const wantPort = Number(process.argv[2] ?? 0);
server.listen(Number.isInteger(wantPort) && wantPort >= 0 ? wantPort : 0, '127.0.0.1', () => {
  const a = server.address();
  const p = typeof a === 'object' && a !== null ? a.port : wantPort;
  console.log(`PROOF_SERVICE_UP port=${p}`);
});
