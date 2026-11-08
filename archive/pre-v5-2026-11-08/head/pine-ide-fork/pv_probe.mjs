#!/usr/bin/env node
/** pv_probe.mjs — the standalone compile+run probe.
 *  USAGE: node pv_probe.mjs <file.pine> [--pair EUR/USD] [--tf 4H] [--limit 300] [--url http://127.0.0.1:9441]
 *  EXIT  0 = the station RAN it (bars/boxes/labels/lines in the payload)
 *        1 = COMPILE error  2 = RUNTIME error  3 = station unreachable
 *  This is the L0/L2 artifact the build's PROOF CONTRACT binds to.
 */
import { readFileSync } from 'node:fs';
import { argv } from 'node:process';

const a = argv.slice(2);
const file = a[0];
if (!file) { console.error('usage: pv_probe.mjs <file.pine>'); process.exit(3); }
const arg = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const url = arg('--url', 'http://127.0.0.1:9441');
const pair = arg('--pair', 'EUR/USD');
const tf = arg('--tf', '4H');
const limit = Number(arg('--limit', '300'));

const script = readFileSync(file, 'utf8');
const sha = (await import('node:crypto')).createHash('sha256').update(script).digest('hex');

try {
  const r = await fetch(`${url}/run`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ script, pair, timeframe: tf, limit }),
  });
  const j = await r.json();
  if (!j.success) {
    const code = j.error?.code || j.code || 'UNKNOWN';
    console.log(`FAIL ${code}`);
    console.log(j.error || j.message || '');
    process.exit(code === 'PINE_COMPILE_ERROR' ? 1 : 2);
  }
  const d = j.data || j;
  const c = d.counts || {};
  console.log(`RUN_OK sha=${sha.slice(0, 16)} bars=${d.bars} ms=${d.runMs ?? d.ms ?? '?'}`);
  console.log(`counts ${JSON.stringify(c)}`);
  console.log(`warnings ${(d.warnings || []).length}`);
  const drew = (c.boxes | 0) + (c.labels | 0) + (c.lines | 0) + (c.plots | 0) + (c.markers | 0);
  console.log(drew > 0 ? 'RENDERED' : 'NO_DRAWINGS');
  process.exit(drew > 0 ? 0 : 2);
} catch (e) {
  console.log('STATION_UNREACHABLE', url, String(e).slice(0, 120));
  process.exit(3);
}
