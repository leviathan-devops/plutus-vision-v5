// verifyFrozenShas.ts - P8.TURN-01: freeze the artifact SHAs (the workflow's exact action).
// No fabrication: each SHA is measured from the on-disk artifact this run, printed, and
// compared against the frozen record in m1/out/frozen-shas.json (created on first run,
// refusing FROZEN_SHA_DRIFT on any later mismatch - the freeze is the evidence, and P8.TURN-02
// packaging consumes exactly these bytes).
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex');
const ARTIFACTS = [
  'm1/out/e1-card-EURUSD-2026-07-06.json',
  'm1/out/e1-derived-EURUSD-2026-07-06.json',
  'm1/out/plutus-vision-v5-e1.pine',
  'm1/cloud/dist/worker.js',
];
const MEASURED = 'm1/out/frozen-shas.json';

const measured: Record<string, string> = {};
for (const a of ARTIFACTS) {
  if (!existsSync(a)) { console.error(`FROZEN_SHA_ABSENT: ${a} - run the generator first (never freeze a missing artifact)`); process.exit(1); }
  measured[a] = sha(a);
  console.log(`${measured[a]}  ${a}`);
}
if (!existsSync(MEASURED)) {
  writeFileSync(MEASURED, JSON.stringify({ schema: 1, frozenAt: new Date().toISOString(), shas: measured }, null, 1) + '\n');
  console.log('FROZEN_SHAS_OK (first freeze; the record is now m1/out/frozen-shas.json)');
  process.exit(0);
}
const prior = JSON.parse(readFileSync(MEASURED, 'utf8')).shas as Record<string, string>;
let drift = 0;
for (const a of ARTIFACTS) {
  if (prior[a] !== measured[a]) { console.error(`FROZEN_SHA_DRIFT: ${a} was ${prior[a]?.slice(0, 16)} now ${measured[a].slice(0, 16)} - the freeze is immutable; regenerate the record only by operator order`); drift++; }
}
if (drift === 0) console.log('FROZEN_SHAS_OK (all four artifact SHAs match the frozen record)');
process.exit(drift === 0 ? 0 : 1);
