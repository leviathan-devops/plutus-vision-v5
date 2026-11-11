// runAllChecks.ts - THE SCRIPT TESTING SUITE RUNNER (workflow §THE SCRIPT TESTING SUITE).
// Exit 0 only when every named check prints its positive tokens AND its adversarial shape
// refuses with the named token. The ST-00..ST-08 mapping is the workflow's PROOF CONTRACT:
//   ST-00 preflight  : checkWindow (the window is the preflight identity)
//   ST-01 evidence   : checkBars, checkProtocolA, checkP4, checkP7, checkManifest
//   ST-02 organs     : checkDonors, checkCandlePressure, checkLmv, checkObcv,
//                      checkObcvReconcile, checkFreshness, checkPressure
//   ST-03 engine     : checkP1, checkP2, checkOptions, checkP5, checkP6P7, checkAssembly
//   ST-04 renderer   : checkDerivedCard, checkR36, checkPresentation
//   ST-05 cloud      : m1/cloud/scripts/checkWorker, checkTaskGraph, checkPersistence
//   ST-06 proof      : m1/proof/scripts/checkBend, checkService
//   ST-07 visual     : checkRoomBudget (the capture-SHA surface; the family comparison lives
//                      in the checkpoint comparisons - P5-REPAIR 13/13 MATCHED)
//   ST-08 runtime    : verifyFrozenShas (the frozen-artifact identities)
// Each check's own adversarial+legitimate halves run INSIDE the check script (the attacker
// throws on a missing refusal and the runner treats a non-zero exit as a failed check).
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

type Check = { st: string; name: string; argv: string[]; tokens: string[]; env?: Record<string, string> };

const CHECKS: Check[] = [
  { st: 'ST-00', name: 'preflight-window', argv: ['run', 'm1/scripts/checkWindow.ts'], tokens: ['WINDOW_MONDAY_OK', 'WINDOW_NON_MONDAY_REJECTED'] },
  { st: 'ST-01', name: 'evidence-bars', argv: ['run', 'm1/scripts/checkBars.ts'], tokens: ['BAR_ORDER_OK', 'POST_CUTOFF_BAR_REJECTED'] },
  { st: 'ST-01', name: 'evidence-protocol-a', argv: ['run', 'm1/scripts/checkProtocolA.ts'], tokens: ['PROTOCOL_A_VALID', 'PROTOCOL_A_AFTER_CUTOFF_REJECTED'] },
  { st: 'ST-01', name: 'evidence-p4', argv: ['run', 'm1/scripts/checkP4.ts'], tokens: ['P4_CONSENSUS_2', 'P4_NO_PROXY'] },
  { st: 'ST-01', name: 'evidence-p7', argv: ['run', 'm1/scripts/checkP7.ts'], tokens: ['P7_EXCHANGE_ARENA_OK', 'P7_NO_TIER1_WALL_NAMED'] },
  { st: 'ST-01', name: 'evidence-manifest', argv: ['run', 'm1/scripts/checkManifest.ts'], tokens: ['MANIFEST_CUTOFF_OK', 'MANIFEST_FUTURE_REJECTED'] },
  { st: 'ST-02', name: 'organs-donors', argv: ['run', 'm1/scripts/checkDonors.ts'], tokens: ['DONOR_SHA_OK', 'DONOR_NO_RUNTIME_IMPORT'] },
  { st: 'ST-02', name: 'organs-candle-pressure', argv: ['run', 'm1/scripts/checkCandlePressure.ts'], tokens: ['TOUCH_SWEEP_OK', 'TOUCH_POST_CUTOFF_REJECTED'] },
  { st: 'ST-02', name: 'organs-lmv', argv: ['run', 'm1/scripts/checkLmv.ts'], tokens: ['LMV_DEFENDED_EDGE_OK', 'LMV_TRUNCATION_NAMED'] },
  { st: 'ST-02', name: 'organs-obcv', argv: ['run', 'm1/scripts/checkObcv.ts'], tokens: ['OBCV_4H_FLOOR_50', 'OBCV_30M_MISSING_NAMED'] },
  { st: 'ST-02', name: 'organs-obcv-reconcile', argv: ['run', 'm1/scripts/checkObcvReconcile.ts'], tokens: ['OBCV_AGREED_OK', 'OBCV_NO_CANONICAL_SCORE_REJECTED'] },
  { st: 'ST-02', name: 'organs-freshness', argv: ['run', 'm1/scripts/checkFreshness.ts'], tokens: ['FRESHNESS_STATE_MAP_OK', 'FRESHNESS_GAP_NOT_DEPLETED'] },
  { st: 'ST-02', name: 'organs-pressure', argv: ['run', 'm1/scripts/checkPressure.ts'], tokens: ['PRESSURE_FORTRESS_OK', 'PRESSURE_GAP_NOT_BATTLE'] },
  { st: 'ST-03', name: 'engine-p1', argv: ['run', 'm1/scripts/checkP1.ts'], tokens: ['P1_FORMULA_OK', 'P1_NO_SPOT_FILTER'] },
  { st: 'ST-03', name: 'engine-p2', argv: ['run', 'm1/scripts/checkP2.ts'], tokens: ['P2_CLUSTER_3_PLUS', 'P2_HISTORY_REJECT'] },
  { st: 'ST-03', name: 'engine-options', argv: ['run', 'm1/scripts/checkOptions.ts'], tokens: ['P3_TIER_ORDER_OK', 'P3_TIER3_AUDIT_ONLY'] },
  { st: 'ST-03', name: 'engine-p5', argv: ['run', 'm1/scripts/checkP5.ts'], tokens: ['P5_LSZ_BAND_OK', 'P5_SD_WIDTH_REJECT'] },
  { st: 'ST-03', name: 'engine-p6p7', argv: ['run', 'm1/scripts/checkP6P7.ts'], tokens: ['P7_EXCHANGE_PREFERRED', 'P7_FALLBACK_NAMED'] },
  { st: 'ST-03', name: 'engine-assembly', argv: ['run', 'm1/scripts/checkAssembly.ts'], tokens: ['ZFP_NO_WIDTH_OK', 'DEGREE_MAP_OK'] },
  { st: 'ST-04', name: 'renderer-derived-card', argv: ['run', 'm1/scripts/checkDerivedCard.ts'], tokens: ['DERIVED_BASE_IMMUTABLE', 'DERIVED_SUPERSEDES_OK'] },
  { st: 'ST-04', name: 'renderer-r36', argv: ['run', 'm1/scripts/checkR36.ts'], tokens: ['R36_ALL_OBJECTS_CLIPPED', 'R36_OLD_ORIGIN_NOT_DRAWN'] },
  { st: 'ST-04', name: 'renderer-presentation', argv: ['run', 'm1/scripts/checkPresentation.ts'], tokens: ['LABEL_COLLISION_ZERO', 'TABLE_OFF_BY_DEFAULT'] },
  { st: 'ST-05', name: 'cloud-worker-routes', argv: ['run', 'm1/cloud/scripts/checkWorker.ts'], tokens: ['ROUTE_RUN_OK', 'ROUTE_UNKNOWN_404'] },
  { st: 'ST-05', name: 'cloud-do-task-graph', argv: ['run', 'm1/cloud/scripts/checkTaskGraph.ts'], tokens: ['DO_IDEMPOTENT_OK', 'DO_CRITICAL_FAILURE_NAMED'] },
  { st: 'ST-05', name: 'cloud-persistence', argv: ['run', 'm1/cloud/scripts/checkPersistence.ts'], tokens: ['R2_IMMUTABLE_PUT_OK', 'DUPLICATE_RUN_IDEMPOTENT'] },
  { st: 'ST-06', name: 'proof-bend', argv: ['run', 'm1/proof/scripts/checkBend.ts'], tokens: ['ALL_PROOFS_CHECK', 'PROOF_NEGATIVE_MODEL_REJECTED'], env: { PATH: `${process.env.HOME}/.bend/bin:${process.env.PATH}` } },
  { st: 'ST-06', name: 'proof-service', argv: ['run', 'm1/proof/scripts/checkService.ts'], tokens: ['PROOF_HEALTH_OK', 'PROOF_NEGATIVE_MODEL_REJECTED'] },
  { st: 'ST-07', name: 'visual-room-budget', argv: ['run', 'm1/scripts/checkRoomBudgetArtifact.ts'], tokens: ['ROOM_BUDGET_INTEGER', 'ROOM_CAPTURE_SHAS_RECORDED'] },
  { st: 'ST-08', name: 'runtime-frozen-shas', argv: ['run', 'm1/scripts/verifyFrozenShas.ts'], tokens: ['FROZEN_SHAS_OK'] },
];

interface Result { scenario: string; st: string; gate: string; specificToken: string; passTokenMatch: boolean; failTokenAbsent: boolean; toolResultContext: string; timedOut: boolean; verdict: string; evidence: string }

async function main(): Promise<number> {
  const results: Result[] = [];
  let failed = 0;
  for (const c of CHECKS) {
    const gate = `bun ${c.argv.join(' ')}`;
    let out = ''; let code = 0; let timedOut = false;
    try {
      out = execFileSync('bun', c.argv.slice(1), { encoding: 'utf8', timeout: 240_000, env: { ...process.env, ...(c.env ?? {}) } });
    } catch (e: unknown) {
      const err = e as { status?: number; stdout?: string; killed?: boolean };
      code = err.status ?? 1; out = err.stdout ?? ''; timedOut = err.killed ?? false;
    }
    const passTokenMatch = c.tokens.every((t) => out.includes(t));
    // the adversarial half's refusal tokens are the check's own second tokens (each check's
    // negative shape prints them; a misfire would show a generic error instead)
    const failTokenAbsent = !/EXPECTED_REFUSAL|_FAIL:/.test(out);
    const verdict = code === 0 && passTokenMatch && failTokenAbsent ? 'PASS' : 'FAIL';
    if (verdict === 'FAIL') failed++;
    results.push({ scenario: c.name, st: c.st, gate, specificToken: c.tokens.join('+'), passTokenMatch, failTokenAbsent, toolResultContext: out.slice(0, 400), timedOut, verdict, evidence: out.split('\n').filter((l) => c.tokens.some((t) => l.includes(t))).join(' | ').slice(0, 300) });
    console.log(`${verdict === 'PASS' ? 'OK ' : 'FAIL'} ${c.st} ${c.name} (${c.tokens.join(', ')})`);
  }
  mkdirSync('.trident', { recursive: true });
  writeFileSync('.trident/container-test-results.json', JSON.stringify({ schema: 1, ranAt: new Date().toISOString(), checks: results.length, failed, results }, null, 1) + '\n');
  console.log(`\n${results.length - failed}/${results.length} checks PASS; results in .trident/container-test-results.json`);
  return failed === 0 ? 0 : 1;
}
process.exit(await main());
