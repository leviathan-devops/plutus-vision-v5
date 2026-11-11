// checkPresentation.ts - P4.TURN-03 gate. Presentation de-clutter: table OFF by default, intra-zone
// OFF by default, IP labels = family | degree | ZFP, label collisions zero via the staggered anchors,
// S/D text compact (tf (mitigations) | BoM/MoM).
import { readFileSync } from 'node:fs';
import { compose } from '../src/compose';
import { readCard } from '../src/card';

const out = compose();
const pine = readFileSync(out.path, 'utf8');
if (!/e1ShowTbl\s*=\s*input\.bool\(false/.test(pine)) throw new Error('TABLE_FAIL: e1ShowTbl is not false by default');
console.log('TABLE_OFF_BY_DEFAULT e1ShowTbl = input.bool(false)');
if (!/e1ShowIntra\s*=\s*input\.bool\(false/.test(pine)) throw new Error('INTRA_FAIL: e1ShowIntra is not false by default');
console.log('INTRA_OFF_BY_DEFAULT e1ShowIntra = input.bool(false)');
// Label text: family | degree | ZFP only.
const txts = (pine.match(/var e1zTxt = array\.from\(([^)]*)\)/)?.[1] ?? '').split(', ').filter(t => t.startsWith('"'));
for (const t of txts) {
  const v = t.replace(/^"|"$/g, '');
  if (!/^[^|]+ \| (EXTREME|HEAVY|MODERATE-HEAVY|MODERATE|LIGHT|MINIMAL) \| \d+% ZFP$/.test(v))
    throw new Error(`LABEL_TEXT_FAIL: "${v}" is not family | degree | ZFP`);
}
console.log(`SD_TEXT_COMPACT ${txts.length} IP labels, all "family | degree | ZFP"; S/D texts carry only tf (mitigations) | BoM/MoM`);
// Label collisions: adjacent staggered anchors per card have >= 3-pip separation; dropped labels recorded.
const anchors = (pine.match(/var e1zAnchor = array\.from\(([^)]*)\)/)?.[1] ?? '').split(', ').filter(x => x !== 'na').map(Number);
const ks = (pine.match(/var e1zK = array\.from\(([^)]*)\)/)?.[1] ?? '').split(', ').filter(x => x !== '-1').map(Number);
if (anchors.length !== ks.length) throw new Error(`ANCHOR_FAIL: ${anchors.length} anchors vs ${ks.length} keys`);
for (let k = 0; k <= Math.max(...ks); k++) {
  const a = anchors.filter((_, i) => ks[i] === k).sort((x, y) => y - x);
  for (let i = 1; i < a.length; i++) {
    const sep = a[i - 1] > 10 ? 0.03 : 0.0003;    // DXY vs 4-decimal scale, 3 pips
    if (a[i - 1] - a[i] < sep) throw new Error(`LABEL_COLLISION_FAIL: card ${k} anchors ${a[i - 1]} and ${a[i]} closer than ${sep}`);
  }
}
console.log(`LABEL_COLLISION_ZERO ${anchors.length} anchors across ${new Set(ks).size} card(s), min separation enforced; ${out.droppedLabels.length} dropped (${out.droppedLabels.join(',') || 'none'})`);
// S/D text compactness on the real cards: the emitted e1sTxt must match the compact grammar.
const sLine = pine.split('\n').find(l => l.includes('var e1sTxt = array.from(')) ?? '';
const sTxt = [...sLine.matchAll(/"([^"]*)"/g)].map(m => `"${m[1]}"`);
for (const t of sTxt) {
  const v = t.replace(/^"|"$/g, '');
  if (!/^(4H|1H) \((Unmitigated|\d+X)\) \| (BoM|MoM)$/.test(v)) throw new Error(`SD_TEXT_FAIL: "${v}"`);
}
console.log(`SD_TEXT_COMPACT ${sTxt.length} S/D texts match "tf (mitigations) | BoM/MoM"`);
void readCard;
