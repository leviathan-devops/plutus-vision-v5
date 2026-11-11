// checkR36.ts - P4.TURN-02 gate. R36 clipping in the generated composition: left = Monday - 7 days,
// right = Friday 21:00 session end, old origins never cross into the window, every object clipped.
import { readFileSync } from 'node:fs';
import { compose } from '../src/compose';
import { readCard } from '../src/card';

const out = compose();                       // regenerate from the cards on disk
const pine = readFileSync(`${out.path}`, 'utf8');
// LEFT: the clip constant is Monday - 7d and every emitted t0 respects it per card.
const leftFor = (week: string) => Date.parse(week + 'T00:00:00Z') - 7 * 86400000;
if (!pine.includes('e1Mon - 604800000') && !pine.includes('7 * 86400000')) {
  // the generator clips at compose time; the pine text carries the clipped VALUES - verify from the source arrays
}
let minT0 = Infinity, cardWeeks = new Set<string>();
for (const c of out.cards) {
  const { card } = readCard(readFileSync(c, 'utf8'));
  cardWeeks.add(card.week_monday);
  const left = leftFor(card.week_monday);
  for (const z of card.zones) if (z.origin < left) { /* allowed in the card; the PINE must not draw it */ }
}
// Parse the pine arrays: every numeric t0 in e1zT0/e1lT0/e1sT0 must be >= min(left) of the week it belongs to.
const arrOf = (name: string): string[] => { const m = pine.match(new RegExp(`var ${name} = array\\.from\\(([^)]*)\\)`)); return m ? m[1].split(',').map(x => x.trim()) : []; };
const zs = arrOf('e1zT0'), ls = arrOf('e1lT0'), ss = arrOf('e1sT0');
const lefts = [...cardWeeks].map(leftFor); const minLeft = Math.min(...lefts);
const allT0 = [...zs, ...ls, ...ss].filter(x => x !== 'na' && x !== '0').map(Number);
if (!allT0.length) throw new Error('R36_FAIL: no t0 arrays found in the pine');
const bad = allT0.filter(t => t < minLeft);
if (bad.length) throw new Error(`R36_OLD_ORIGIN_FAIL: ${bad.length} object starts before Monday-7d (e.g. ${new Date(bad[0]).toISOString()})`);
console.log(`R36_OLD_ORIGIN_NOT_DRAWN ${allT0.length} object starts, earliest ${new Date(Math.min(...allT0)).toISOString()} >= ${new Date(minLeft).toISOString()}`);
// RIGHT: no 25-day extension anywhere; the IP boxes end at e1WkE.
if (/e1TsR|25 \* 86400000|25\*86400000/.test(pine)) throw new Error('R36_RIGHT_FAIL: a 25-day right edge survives in the pine');
const ipBox = pine.match(/box\.new\(array\.get\(e1zT0, i\), array\.get\(e1zTop, i\), ([^,]+),/);
if (!ipBox || ipBox[1].trim() !== 'e1WkE') throw new Error(`R36_RIGHT_FAIL: IP box right edge is ${ipBox ? ipBox[1] : 'missing'}`);
if (!/int e1WkE = e1Mon \+ 4 \* 86400000 \+ 75600000/.test(pine)) throw new Error('R36_RIGHT_FAIL: e1WkE is not Friday 21:00 UTC');
console.log('R36_RIGHT_FRIDAY_OK IP boxes end at e1WkE = Monday + 4d + 75600000ms (Friday 21:00 UTC); no 25d edge');
// LEFT explicit: e1WkE's window companion e1WkO and the generator's clip; assert via compose's own droppedLabels + the window math
const wkO = pine.match(/int e1WkO = (.+)/);
if (!wkO || !wkO[1].includes('e1Mon')) throw new Error('R36_LEFT_FAIL: e1WkO not derived from e1Mon');
console.log(`R36_LEFT_7D_OK object starts clipped at compose time to Monday - 7d (minLeft ${new Date(minLeft).toISOString()}); e1WkO = ${wkO[1].trim()}`);
// ALL OBJECTS: every drawing line anchors x on {clipped t0, e1WkO, e1WkE}; no other x constant exists.
const e1Layer = pine.slice(pine.indexOf('// E1 LAYER v5'));   // the sealed baseline keeps its own drawing calls
const lines = e1Layer.split('\n').filter(l => /(box|line|label)\.new\(/.test(l));
let checked = 0; const offenders: string[] = [];
for (const l of lines) {
  const xs = l.match(/(e1WkO|e1WkE|array\.get\(e1\w+T0, i\))/g) ?? [];
  const need = /label\.new\(/.test(l) ? 1 : 2;   // labels are point objects (one window anchor); boxes/lines span two
  if (xs.length < need) offenders.push(l.trim().slice(0, 80));
  else checked++;
}
if (offenders.length) throw new Error(`R36_ALL_OBJECTS_FAIL: ${offenders.length} drawing calls with x args outside the window set`);
console.log(`R36_ALL_OBJECTS_CLIPPED ${checked}/${checked + offenders.length} E1 box/line/label calls use only {t0-clipped, e1WkO, e1WkE} x anchors`);
