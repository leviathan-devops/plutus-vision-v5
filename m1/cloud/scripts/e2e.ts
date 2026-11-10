// cloud/scripts/e2e.ts - the cloud E2E harness (P6.TURN-04, script only).
//
// Against a DEPLOYED staging Worker: POST /e1/run, poll /e1/status, fetch the
// sealed card + composed pine, validate the card with the LOCAL engine
// validator, and compare the Worker SHAs against a LOCAL replay of the same
// DO code over the identical typed evidence. Tokens are emitted ONLY on real
// responses; a mismatch or missing deploy refuses by name, never a soft pass.
//
// Parity rule: CLOUD_LOCAL_PARITY_OK requires the Worker card SHA to equal
// the local deterministic card SHA for IDENTICAL typed evidence. Pass
// --with-fixtures to POST the local fixture pack (the staging Worker accepts
// injected evidence through the same body.contract the checks use), so both
// sides run the same bytes. Without it the staging Worker serves its own
// evidence and parity is reported as a named mismatch, never a pass.
//
// Without --url the deploy does not exist (the deploy is the primary's job):
// the harness REFUSES E2E_NO_URL with exit 1 naming the resume condition.
//
// Usage:
//   bun run cloud/scripts/e2e.ts --asset EURUSD --week 2026-07-06 --url https://e1-staging.workers.dev [--with-fixtures]
import { validateBaseCard } from '../../src/validateCard';
import { E1Run } from '../do';
import { InMemoryD1, InMemoryR2 } from '../state';
import { e1Fixtures } from './fixtures';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function sleep(ms: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, ms);
  return promise;
}

const asset = arg('--asset') ?? 'EURUSD';
const week = arg('--week') ?? '2026-07-06';
const url = arg('--url');
const withFixtures = process.argv.includes('--with-fixtures');

if (!url) {
  console.error('E2E_NO_URL: no staging Worker URL - pass --url https://<staging-worker> after the primary deploys it, then re-run this harness');
  process.exit(1);
}

const base = (url as string).replace(/\/$/, '');

async function mustOk(res: Response, what: string): Promise<Response> {
  if (res.status !== 200) throw new Error(`E2E_HTTP_FAIL: ${what} -> ${res.status} ${(await res.text()).slice(0, 200)}`);
  return res;
}

// 1. Create the run on the REAL staging Worker.
const runBody: Record<string, unknown> = { asset, monday: week };
if (withFixtures) runBody.fixtures = e1Fixtures(asset, week);
const runRes = await mustOk(
  await fetch(`${base}/e1/run`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(runBody),
  }),
  'POST /e1/run',
);
const runOut = (await runRes.json()) as { runId?: string; state?: string; baseSha?: string; derivedSha?: string; pineSha?: string };
const runId = runOut.runId ?? `${asset}-${week}`;
console.log(`CLOUD_RUN_CREATED runId=${runId}`);

// 2. Poll status until terminal.
let row: { state: string; base_sha: string; derived_sha: string; pine_sha: string } | undefined;
for (let i = 0; i < 30; i++) {
  const s = (await (await mustOk(await fetch(`${base}/e1/status/${encodeURIComponent(runId)}`), 'GET /e1/status')).json()) as {
    state: string; base_sha: string; derived_sha: string; pine_sha: string;
  };
  row = s;
  if (s.state === 'COMPLETE' || s.state === 'BLOCKED') break;
  await sleep(2000);
}
if (!row || row.state !== 'COMPLETE') throw new Error(`E2E_STATE_FAIL: run ${runId} ended in ${row?.state ?? 'unknown'}`);

// 3. Fetch the sealed card; its SHA is the parity anchor.
const cardRes = await mustOk(
  await fetch(`${base}/e1/card/${encodeURIComponent(asset)}/${encodeURIComponent(week)}`),
  'GET /e1/card',
);
const cardBody = (await cardRes.json()) as { sha256: string; card: unknown };
if (typeof cardBody.sha256 !== 'string' || cardBody.sha256.length !== 64) {
  throw new Error('E2E_CARD_SHA_FAIL: staging card carries no 64-hex seal');
}
console.log(`CLOUD_CARD_SHA_RETURNED sha=${cardBody.sha256.slice(0, 16)}`);

// 4. Fetch the composed pine.
const pineRes = await mustOk(
  await fetch(`${base}/e1/pine/${encodeURIComponent(asset)}/${encodeURIComponent(week)}`),
  'GET /e1/pine',
);
const pineText = await pineRes.text();
if (!pineText.includes('//@version=5')) throw new Error('E2E_PINE_SHAPE_FAIL: staged pine is not a Pine script');
console.log(`CLOUD_PINE_SHA_RETURNED sha=${String(row.pine_sha).slice(0, 16)} bytes=${pineText.length}`);

// 5. Validate the returned card with the LOCAL engine validator. The sealed body is the
// envelope {sha256, card}; the envelope sha seals the CARD - validate the card against it.
validateBaseCard({ ...(cardBody.card as object), sha256: cardBody.sha256 } as { sha256?: string; zones?: { id: string }[] });
console.log('CLOUD_CARD_VALID sealed base card validates locally');

// 6. Parity: replay the SAME DO code locally over the IDENTICAL typed evidence
// and require byte-equal SHAs. The local evidence is the fixture pack; the
// Worker side matches it exactly when --with-fixtures seeded the run.
{
  const local = await new E1Run(new InMemoryD1(), new InMemoryR2()).run({
    asset, monday: week, runId: `e2e-local-${asset}-${week}`, fixtures: e1Fixtures(asset, week),
  });
  const match = local.baseSha === cardBody.sha256 && local.baseSha === row.base_sha && local.pineSha === row.pine_sha;
  if (!match) {
    throw new Error(
      `E2E_PARITY_MISMATCH: worker base=${String(cardBody.sha256).slice(0, 16)} pine=${String(row.pine_sha).slice(0, 16)} ` +
      `!= local base=${local.baseSha.slice(0, 16)} pine=${local.pineSha.slice(0, 16)} ` +
      '- identical typed evidence on both sides is required (re-run with --with-fixtures against a fixture-seeded staging Worker)',
    );
  }
  console.log(`CLOUD_LOCAL_PARITY_OK worker==local base=${local.baseSha.slice(0, 16)} pine=${local.pineSha.slice(0, 16)}`);
}
