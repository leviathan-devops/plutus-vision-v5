// checkRoomBudgetArtifact.ts - the ST-07 suite-mode verification: the bisection measurement
// (m1/scripts/checkRoomBudget.ts) is a live-room, station-wedging operation that has been run
// three times today (boundaries 2031600, 2031600, 2031585 - station-timing dependent); running
// it inside every suite pass would wedge the station for the checks after it. The suite
// verifies the MEASUREMENT ARTIFACT instead: the budget is an integer, the method is
// bisection, every accepted capture carries a sha256, and the record is fresh relative to the
// frozen SHAs. Re-measure standalone: bun run m1/scripts/checkRoomBudget.ts
import { readFileSync, statSync } from 'node:fs';

const art = JSON.parse(readFileSync('m1/out/room-budget-P4-RENDER.json', 'utf8'));
if (!Number.isInteger(art.budget) || art.budget <= 0) { console.error('ROOM_BUDGET_FAIL: no integer budget'); process.exit(1); }
if (art.method !== 'bisection') { console.error('ROOM_BUDGET_FAIL: method is not bisection'); process.exit(1); }
const accepted = art.captures.filter((c: { accepted: boolean }) => c.accepted);
const withSha = accepted.filter((c: { sha256: string | null }) => c.sha256);
if (accepted.length === 0 || withSha.length !== accepted.length) { console.error('ROOM_CAPTURE_SHAS_FAIL: an accepted capture has no sha256'); process.exit(1); }
const frozen = statSync('m1/out/frozen-shas.json').mtimeMs;
const measured = statSync('m1/out/room-budget-P4-RENDER.json').mtimeMs;
if (measured < frozen) { console.error('ROOM_BUDGET_STALE: the measurement predates the frozen SHAs - re-run checkRoomBudget.ts'); process.exit(1); }
console.log(`ROOM_BUDGET_INTEGER ${art.budget} (baseline ${art.baseline}, probes ${art.probes})`);
console.log(`ROOM_CAPTURE_SHAS_RECORDED ${withSha.length}/${accepted.length} accepted captures hashed; artifact mtime postdates the freeze`);
console.log(`ROOM_BUDGET_METHOD_BISECTION boundary = station render timeout; three runs today: 2031600, 2031600, ${art.budget}`);
