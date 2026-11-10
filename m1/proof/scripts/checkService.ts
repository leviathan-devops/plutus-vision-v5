// proof/scripts/checkService.ts — P7.TURN-02 gate driver (loopback only).
// Spawns the proof service on a random 127.0.0.1 port (the server prints
// PROOF_SERVICE_UP port=N; this script kills the server it started), then
// drives the full control battery: health, positive prove -> PASS verdict,
// negative prove (timestamp past cutoff + WorkBudget=3) -> FAIL verdict.
// Every pass token is asserted in real tool-result output. Exit non-zero is
// a loud fail naming the missing token.

import { spawn, type ChildProcess } from 'node:child_process';
import { request as httpRequest } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SERVER = join(HERE, '..', 'service', 'server.ts');
const CUTOFF = Date.UTC(2026, 6, 6, 8, 0, 0);
const DAY = 86_400_000;
const H = 3_600_000;
const SHA = 'ab'.repeat(32);

function call(port: number, method: string, path: string, body?: unknown): Promise<{ status: number; json: unknown }> {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? '' : JSON.stringify(body);
    const req = httpRequest(
      { host: '127.0.0.1', port, path, method, headers: { 'content-type': 'application/json', 'content-length': String(Buffer.byteLength(data)) } },
      (res) => {
        let buf = '';
        res.on('data', (c: Buffer) => { buf += c.toString('utf8'); });
        res.on('end', () => {
          let json: unknown = null;
          try { json = buf ? JSON.parse(buf) as unknown : null; } catch { json = null; }
          resolve({ status: res.statusCode ?? 0, json });
        });
      },
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function str(o: unknown, k: string): string | null {
  if (typeof o === 'object' && o !== null && k in o) {
    const v = (o as Record<string, unknown>)[k];
    return typeof v === 'string' ? v : null;
  }
  return null;
}

function need(cond: boolean, token: string, extra?: unknown): void {
  console.log(`${cond ? 'OK' : 'FAIL'} ${token}${extra === undefined ? '' : ` ${JSON.stringify(extra)}`}`);
  if (!cond) { console.log(`CHECK_SERVICE_FAIL: ${token}`); process.exit(1); }
}

async function main(): Promise<void> {
  const child: ChildProcess = spawn('bun', [SERVER], { stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  const port: number = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('SERVER_START_TIMEOUT')), 20000);
    child.stdout?.on('data', (c: Buffer) => {
      out += c.toString('utf8');
      const m = /PROOF_SERVICE_UP port=(\d+)/.exec(out);
      if (m) { clearTimeout(timer); resolve(Number(m[1])); }
    });
    child.on('error', reject);
    child.on('exit', (code) => reject(new Error(`SERVER_EXITED code=${code} out=${out.slice(0, 500)}`)));
  }).catch((e: unknown) => {
    console.log(`CHECK_SERVICE_FAIL: server did not start: ${String(e)}`);
    try { child.kill('SIGKILL'); } catch { /* already gone */ }
    process.exit(1);
  }) as number;
  console.log(`server up on 127.0.0.1:${port}`);
  const stop = async (): Promise<void> => {
    try { child.kill('SIGTERM'); } catch { /* already gone */ }
    await new Promise<void>((r) => {
      const t = setTimeout(() => { try { child.kill('SIGKILL'); } catch { /* already gone */ } r(); }, 5000);
      child.on('close', () => { clearTimeout(t); r(); });
    });
  };

  try {
    const health = await call(port, 'GET', '/health');
    console.log('--- GET /health ---');
    console.log(JSON.stringify(health.json));
    need(health.status === 200 && str(health.json, 'status') === 'PROOF_HEALTH_OK', 'PROOF_HEALTH_OK');

    const pos = {
      sha256: SHA,
      card: {
        cutoff: CUTOFF,
        workBudget: 0,
        levels: [
          { ts: CUTOFF - 20 * DAY, price: 100.5, score: 12, seq: 1, id: 7 },
          { ts: CUTOFF - H, price: 101.2, score: 10, seq: 2, id: 9 },
        ],
      },
    };
    const created = await call(port, 'POST', '/prove', pos);
    console.log('--- POST /prove (positive) ---');
    console.log(JSON.stringify(created.json));
    const jobId = str(created.json, 'job_id');
    need(created.status === 200 && str(created.json, 'status') === 'PROOF_JOB_CREATED' && jobId !== null, 'PROOF_JOB_CREATED');

    const verdict = await call(port, 'GET', `/verdict/${jobId as string}`);
    console.log('--- GET /verdict/:id (positive) ---');
    console.log(JSON.stringify(verdict.json));
    const v = verdict.json as { verdict?: unknown; obligations?: unknown[]; tokens?: unknown } | null;
    need(verdict.status === 200 && v?.verdict === 'PASS' && Array.isArray(v?.obligations) && (v?.obligations as unknown[]).length >= 6,
      'PROOF_PASS_VERDICT', { verdict: v?.verdict, obligations: Array.isArray(v?.obligations) ? (v?.obligations as unknown[]).length : 0 });

    const neg = {
      sha256: SHA,
      card: {
        cutoff: CUTOFF,
        workBudget: 3,
        levels: [{ ts: CUTOFF + H, price: 100.5, score: 12, seq: 1, id: 7 }],
      },
    };
    const createdNeg = await call(port, 'POST', '/prove', neg);
    console.log('--- POST /prove (negative: ts past cutoff, budget 3) ---');
    console.log(JSON.stringify(createdNeg.json));
    const negId = str(createdNeg.json, 'job_id');
    need(createdNeg.status === 200 && negId !== null, 'PROOF_JOB_CREATED(negative)');
    const verdictNeg = await call(port, 'GET', `/verdict/${negId as string}`);
    console.log('--- GET /verdict/:id (negative) ---');
    console.log(JSON.stringify(verdictNeg.json));
    const vn = verdictNeg.json as { verdict?: unknown; tokens?: unknown } | null;
    need(verdictNeg.status === 200 && vn?.verdict === 'FAIL' &&
      Array.isArray(vn?.tokens) && (vn?.tokens as unknown[]).includes('PROOF_NEGATIVE_MODEL_REJECTED'),
      'PROOF_NEGATIVE_MODEL_REJECTED');

    console.log('CHECK_SERVICE_PASS');
  } finally {
    await stop();
  }
}

void main().catch((e: unknown) => {
  console.log(`CHECK_SERVICE_FAIL: crash ${String(e)}`);
  process.exit(1);
});
