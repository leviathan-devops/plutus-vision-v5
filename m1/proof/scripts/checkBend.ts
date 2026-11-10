// proof/scripts/checkBend.ts — P7.TURN-01 gate driver.
// Runs the full Bend battery on PROOF.bend and asserts every pass token in
// real tool-result output. Adversarial half: a NEGATIVE model (violating one
// law — WorkBudget=3, an evidence timestamp past the cutoff) MUST be refused
// (non-zero exit + PROOF_NEGATIVE_MODEL_REJECTED); the legitimate half passes
// with zero misfire. Negative invocation under test: `bend PROOF.bend -- negative`.

import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BEND_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'bend');
const BEND = join(process.env.HOME ?? '/root', '.bend', 'bin', 'bend');

function run(args: string[]): { status: number | null; out: string } {
  const r = spawnSync(BEND, args, { cwd: BEND_DIR, encoding: 'utf8', timeout: 180000 });
  return { status: r.status, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

function need(cond: boolean, token: string): void {
  console.log(`${cond ? 'OK' : 'FAIL'} ${token}`);
  if (!cond) { console.log(`CHECK_BEND_FAIL: ${token}`); process.exit(1); }
}

const check = run(['PROOF.bend', '--check-only']);
console.log('--- bend PROOF.bend --check-only (full stdout) ---');
console.log(check.out.trimEnd());
need(check.out.includes('ALL PROOFS CHECK'), 'ALL_PROOFS_CHECK(check-only)');

const runPos = run(['PROOF.bend']);
console.log('--- bend PROOF.bend (full stdout) ---');
console.log(runPos.out.trimEnd());
need(runPos.status === 0 && runPos.out.includes('PROOF_POSITIVE_PASS'), 'PROOF_POSITIVE_PASS(run)');

const verdict = run(['PROOF.bend', '--verdict']);
console.log('--- bend PROOF.bend --verdict (full stdout) ---');
console.log(verdict.out.trimEnd());
need(verdict.out.includes('ALL PROOFS CHECK'), 'ALL_PROOFS_CHECK(verdict)');

const neg = run(['PROOF.bend', '--', 'negative']);
console.log('--- bend PROOF.bend -- negative (full stdout) ---');
console.log(neg.out.trimEnd());
need(neg.status !== 0 && neg.out.includes('PROOF_NEGATIVE_MODEL_REJECTED'), 'PROOF_NEGATIVE_MODEL_REJECTED');

console.log('CHECK_BEND_PASS');
