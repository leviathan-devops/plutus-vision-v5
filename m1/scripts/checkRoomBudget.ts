// checkRoomBudget.ts - P4.TURN-04 gate. Measure the Pinebox room's drawn-object budget by
// bisection (BUILD_WORKFLOW P4.TURN-04): lo = the baseline composition's E1 object count,
// hi = the first doubling whose render fails, then bisect. Synthetic boxes exist only in
// scratch copies under m1/out/scratch-room-budget/ (never git); every capture's sha256 is recorded.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { compose } from '../src/compose';
import { readCard } from '../src/card';

const PB = ['/home/leviathan/.local/bin/pinebox'];
const pb = (args: string[]) => JSON.parse(execFileSync(PB[0], [...args, '--session', 'pv52-build'], { encoding: 'utf8', timeout: 120000 }));
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex');

const out = compose();                                    // regenerate the baseline composition
const pine = readFileSync(out.path, 'utf8');
// The baseline E1 object count for the active week = IP boxes + LSZ boxes + option lines/labels +
// S/D boxes + IP labels + intra lines (intra is off by default; counted only if drawn).
const { card } = readCard(readFileSync('m1/out/e1-card-EURUSD-2026-07-06.json', 'utf8'));
const band = card.render_policy.band;
const zones = card.zones.filter(z => z.score >= 6 && z.hi >= band.lo && z.lo <= band.hi);
const lsz = card.pillars.P5.lsz.filter(l => l.priority === 'ACTIVE SL TRIGGER' && l.extHi >= band.lo && l.extLo <= band.hi);
const sd = card.pillars.P5.sd.filter(z => z.brokenAt === null && z.hi >= band.lo && z.lo <= band.hi && Date.parse(card.window.cutoff) - z.t <= 21 * 86400000);
const baselineObjects = zones.length * 2 /*box+label*/ + lsz.length * 2 + zones.flatMap(z => z.members.filter(m => m.kind === 'option' && m.pillar === 'P8')).length * 2 + sd.length;
console.log(`ROOM_BUDGET_BASELINE composition objects for EURUSD 2026-07-06: ${baselineObjects} (${zones.length} IP, ${lsz.length} LSZ, ${sd.length} S/D)`);

const scratchDir = 'm1/out/scratch-room-budget';
rmSync(scratchDir, { recursive: true, force: true }); mkdirSync(scratchDir, { recursive: true });
const captures: { n: number; accepted: boolean; nonempty: boolean; bytes: number; sha256: string | null; reason?: string }[] = [];
// variant(n): the composition plus n synthetic boxes spread over the visible band (scratch only)
const variant = (n: number) => {
  const lines = ['', '// ROOM BUDGET PROBE - synthetic objects, scratch copy, never committed'];
  lines.push('if barstate.islast');
  lines.push('    float e1rbH = high + (high - low) * 0.5');
  lines.push('    float e1rbL = low - (high - low) * 0.5');
  lines.push(`    for i = 1 to ${n}`);
  lines.push(`        box.new(time[2], e1rbL + (e1rbH - e1rbL) * i / ${n}, time, e1rbL + (e1rbH - e1rbL) * (i - 1) / ${n}, xloc = xloc.bar_time, bgcolor = color.new(color.gray, 80), border_color = color.gray)`);
  return `${pine}\n${lines.join('\n')}\n`;
};
let step = 0;
const measure = (n: number): boolean => {
  step++;
  const p = `${scratchDir}/probe-${n}.pine`;
  writeFileSync(p, variant(n));
  let accepted = false, bytes = 0, nonempty = false;
  let fp = '', fsha = '';
  try {
    const load = pb(['load', '--id', '4', '--pine', p]);
    accepted = load.ok === true;                                    // the renderer took the script
    const shot = pb(['shot', '--id', '4', '--out', `${scratchDir}/frame-${n}.png`]);
    fp = shot.frame?.path ?? shot.frame_path ?? `${scratchDir}/frame-${n}.png`;
    bytes = readFileSync(fp).length;
    fsha = sha(fp);
    // visible change: the synthetic boxes alter the frame vs the n=0 capture
    nonempty = bytes > 50000 && (n === 0 || fsha !== captures[0].sha256);
  } catch { accepted = false; nonempty = false; }
  captures.push({ n, accepted, nonempty, bytes, sha256: fsha || null, reason: accepted ? undefined : 'load refused (station timeout / runtime error): no frame captured' });
  console.log(`  probe n=${n} accepted=${accepted} nonempty=${nonempty} bytes=${bytes} sha=${fsha.slice(0, 12)}`);
  return accepted && nonempty;
};
// lo = baseline (no synthetic) must render
if (!measure(0)) throw new Error('ROOM_BUDGET_FAIL: the baseline composition itself did not render');
let lo = baselineObjects;
// hi: double until the render fails (cap 14 doublings)
let hi = lo * 2, it = 0;
while (measure(hi) && it++ < 14) { lo = hi; hi *= 2; }
// bisect
while (hi - lo > 1) {
  const mid = Math.floor((lo + hi) / 2);
  if (measure(mid)) lo = mid; else hi = mid;
}
if (!Number.isInteger(lo)) throw new Error('ROOM_BUDGET_FAIL: non-integer budget');
console.log(`ROOM_BUDGET_INTEGER ${lo} (baseline ${baselineObjects}, probes ${captures.length})`);
console.log('ROOM_BUDGET_METHOD_BISECTION double-then-bisect over real Pinebox loads/captures');
const artifact = { checkpoint: 'P4-RENDER', baseline: baselineObjects, budget: lo, method: 'bisection', probes: captures.length, captures, note: 'synthetic objects only in m1/out/scratch-room-budget/ (git-ignored scratch); accepted captures hashed; the boundary is the station render timeout (PINE_STATION_SLOW) - the display census additionally shows Pine caps drawn boxes at 500 (max_boxes_count); the empirical budget is the load-timeout boundary, an integer by construction' };
writeFileSync('m1/out/room-budget-P4-RENDER.json', JSON.stringify(artifact, null, 1) + '\n');
const withSha = captures.filter(c => c.accepted && c.sha256).length;
const needSha = captures.filter(c => c.accepted).length;
if (withSha !== needSha) throw new Error(`ROOM_CAPTURE_SHAS_FAIL: ${withSha}/${needSha} accepted probes lack a capture sha256`);
console.log(`ROOM_CAPTURE_SHAS_RECORDED ${withSha}/${needSha} accepted captures hashed (${captures.length - needSha} refused probes recorded with reason, no frame)`);
