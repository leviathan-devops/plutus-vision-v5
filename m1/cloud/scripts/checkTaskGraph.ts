// cloud/scripts/checkTaskGraph.ts - P6.TURN-02 gate.
//
// Drives the REAL Durable Object (E1Run) through the REAL engine modules with
// the fixture pack from fixtures.ts. Shapes:
//   legitimate: full run -> COMPLETE + parallel maxima + idempotent retry
//   adversarial: forced pillar failure -> NAMED critical refusal + BLOCKED row
//   adversarial: post-cutoff prediction source -> E1_CUTOFF_VIOLATION + BLOCKED
//   unit: forward-only machine (backward step refuses E1_DERIVED_CHAIN_INVALID)
// Pass tokens: DO_IDEMPOTENT_OK, DO_PARALLEL_TASKS_OK, DO_CRITICAL_FAILURE_NAMED, DO_STATE_FORWARD_ONLY.
import { E1Run } from '../do';
import { InMemoryD1, InMemoryR2, transition } from '../state';
import { e1Fixtures } from './fixtures';

const fx = e1Fixtures('EURUSD', '2026-07-06');

// Legitimate + idempotent: run twice, same SHAs, no recompute.
{
  const d1 = new InMemoryD1();
  const r2 = new InMemoryR2();
  const do_ = new E1Run(d1, r2);
  const first = await do_.run({ asset: 'EURUSD', monday: '2026-07-06', fixtures: fx });
  if (first.state !== 'COMPLETE' || first.idempotent) throw new Error(`DO_RUN_FAIL: ${JSON.stringify(first).slice(0, 200)}`);
  if (!first.baseSha || !first.derivedSha || !first.pineSha) throw new Error('DO_SHA_FAIL');
  const second = await do_.run({ asset: 'EURUSD', monday: '2026-07-06', fixtures: fx });
  if (!second.idempotent || second.baseSha !== first.baseSha || second.derivedSha !== first.derivedSha || second.pineSha !== first.pineSha) {
    throw new Error(`DO_IDEMPOTENT_SHAPE_FAIL: ${JSON.stringify(second).slice(0, 200)}`);
  }
  console.log(`DO_IDEMPOTENT_OK base=${first.baseSha.slice(0, 16)} derived=${first.derivedSha.slice(0, 16)} pine=${first.pineSha.slice(0, 16)}`);
}

// Parallel: every phase fans out (max concurrency > 1 in at least one phase,
// and every task in the phase settled - evidence 3-4, pillars 5, organs 4).
{
  const d1 = new InMemoryD1();
  const r2 = new InMemoryR2();
  const out = await new E1Run(d1, r2).run({ asset: 'EURUSD', monday: '2026-07-06', runId: 'PAR-1', fixtures: fx });
  const p = out.parallel;
  if (!(p.evidenceMax > 1 && p.pillarMax > 1 && p.organMax > 1)) {
    throw new Error(`DO_PARALLEL_FAIL: ${JSON.stringify(p)} - phases must fan out`);
  }
  console.log(`DO_PARALLEL_TASKS_OK evidenceMax=${p.evidenceMax} pillarMax=${p.pillarMax} organMax=${p.organMax}`);
}

// Adversarial: forced pillar failure -> NAMED refusal, D1 row BLOCKED.
{
  const d1 = new InMemoryD1();
  const r2 = new InMemoryR2();
  try {
    await new E1Run(d1, r2).run({ asset: 'EURUSD', monday: '2026-07-06', runId: 'CRIT-1', fixtures: fx, failPillar: 'P1' });
    throw new Error('DO_CRITICAL_SHAPE_FAIL: forced pillar failure did not refuse');
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes('DO_CRITICAL_SHAPE_FAIL')) throw e;
    if (!msg.includes('E1_PILLAR_FAILED')) throw new Error(`DO_CRITICAL_TOKEN_FAIL: ${msg.slice(0, 160)}`);
    const row = d1.getRun('CRIT-1');
    if (!row || row.state !== 'BLOCKED') throw new Error(`DO_CRITICAL_STATE_FAIL: row=${JSON.stringify(row)}`);
    console.log(`DO_CRITICAL_FAILURE_NAMED ${(e as { token?: string }).token ?? 'E1_PILLAR_FAILED'} row=BLOCKED`);
  }
}

// Adversarial: post-cutoff prediction source -> E1_CUTOFF_VIOLATION + BLOCKED.
{
  const d1 = new InMemoryD1();
  const r2 = new InMemoryR2();
  try {
    await new E1Run(d1, r2).run({ asset: 'EURUSD', monday: '2026-07-06', runId: 'CRIT-2', fixtures: fx, failEvidenceCritical: true });
    throw new Error('DO_CUTOFF_SHAPE_FAIL: post-cutoff source did not refuse');
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes('DO_CUTOFF_SHAPE_FAIL')) throw e;
    if (!msg.includes('E1_CUTOFF_VIOLATION')) throw new Error(`DO_CUTOFF_TOKEN_FAIL: ${msg.slice(0, 160)}`);
    const row = d1.getRun('CRIT-2');
    if (!row || row.state !== 'BLOCKED') throw new Error('DO_CUTOFF_STATE_FAIL');
    console.log('DO_CUTOFF_REFUSED E1_CUTOFF_VIOLATION row=BLOCKED');
  }
}

// Unit: the state machine moves forward only.
{
  const fwd = transition('RESOLVED', 'EVIDENCE');
  if (fwd !== 'EVIDENCE') throw new Error('DO_STATE_UNIT_FAIL');
  let refused = false;
  try {
    transition('PILLARS', 'EVIDENCE');
  } catch (e) {
    refused = (e as Error).message.includes('E1_DERIVED_CHAIN_INVALID');
  }
  if (!refused) throw new Error('DO_STATE_BACKWARD_FAIL: PILLARS -> EVIDENCE did not refuse');
  console.log('DO_STATE_FORWARD_ONLY PILLARS->EVIDENCE refused E1_DERIVED_CHAIN_INVALID');
}
