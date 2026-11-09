// compose.ts - R9: the generated v5 composition = the v1 baseline (sha-asserted from the sealed checkpoint) +
// the E1 layer generated from EVERY sealed card on disk (m1/out/e1-card-*.json).
//
// ACTIVE-WEEK LAW (operator 2026-11-08): the Pine layer detects the trading week from the MOST RECENT CANDLE and the
// asset from the ticker, then draws only the card for that (asset, week). A week/asset without a card prints a named
// refusal on the chart - never another week's zones. No week constant is written into the layer.
//
// LABEL ORDER (operator 2026-11-08, CP-002 verdict): the four LuxAlgo SMC structure-label inputs are forced OFF in the
// composition text (the sealed baseline file itself is untouched - its sha256 is asserted before the transform).
// The S/D-LQZ rendering (the operator's canon) and the internal order-block boxes keep their defaults.
//
// Usage: bun m1/src/compose.ts            -> m1/out/plutus-vision-v5-e1.pine
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { readCard, type CardZone } from './card';

const ROOT = new URL('../../', import.meta.url).pathname;
export const BASELINE = 'Checkpoints/v1-ship-approved-working-baseline/dist/plutus-vision-v1.pine';
export const BASELINE_SHA = '82da437af969a3157bd9454cbe70497ce01cf71fe4681b9e2401b754aa90cd43';
export const LABEL_INPUTS_OFF = ['showInternalsInput', 'showStructureInput', 'showHighLowSwingsInput', 'showEqualHighsLowsInput'];
const DEG = ['EXTREME', 'HEAVY', 'MODERATE-HEAVY', 'MODERATE', 'LIGHT', 'MINIMAL'];
const LADDER: Record<string, [number[], number[]]> = {
  resistance: [[200, 40, 40], [240, 150, 110]], equilibrium: [[255, 152, 0], [230, 170, 90]], support: [[0, 150, 140], [90, 200, 190]] };
const rgb = (role: string, degree: string) => { const t = Math.max(0, DEG.indexOf(degree)) / 3; const [a, b] = LADDER[role];
  return `color.rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * Math.min(1, t))).join(', ')})`; };
const q = (s: string) => '"' + s.replace(/\\/g, '\\\\').replace(/"/g, "'") + '"';
const f = (x: number) => x.toFixed(5);
const arr = (xs: string[], empty: string) => `array.from(${xs.length ? xs.join(', ') : empty})`;

export function compose() {
  const base = readFileSync(`${ROOT}${BASELINE}`);
  const baseSha = createHash('sha256').update(base).digest('hex');
  if (baseSha !== BASELINE_SHA) throw new Error(`COMPOSE_BASELINE_DRIFT: ${baseSha} - the sealed v1 baseline changed; restore it from the checkpoint (git show <tag>:...) before composing`);
  let baselineText = base.toString('utf8');
  for (const name of LABEL_INPUTS_OFF) {                                    // operator order: LuxAlgo structure labels off
    const re = new RegExp(`(${name}\\s*=\\s*input\\.bool\\()true`);
    const m = baselineText.match(re);
    if (!m) throw new Error(`COMPOSE_LABEL_INPUT_ABSENT: ${name} - the baseline no longer declares this input at its default; re-map LABEL_INPUTS_OFF in m1/src/compose.ts`);
    baselineText = baselineText.replace(re, '$1false');
  }
  const files = readdirSync(`${ROOT}m1/out`).filter(n => /^e1-card-.+-.+\.json$/.test(n)).sort();
  if (!files.length) throw new Error('COMPOSE_NO_CARD: no m1/out/e1-card-<asset>-<monday>.json - run m1/src/run.ts first');
  const cards = files.map(n => ({ path: `m1/out/${n}`, ...readCard(readFileSync(`${ROOT}m1/out/${n}`, 'utf8')) }));
  const label = (z: CardZone) => `${z.name} | ${z.degree} ${z.score} | ${Math.round(z.zfp)}% ZFP${z.zfpRules.springReleaseAt !== null ? ` (+${z.zfpRules.springRelease} after ${new Date(z.zfpRules.springReleaseAt).toISOString().slice(5, 10)} expiry)` : ''}${z.poiTier ? ` | T${z.poiTier}` : ''} | ${z.reactionState} ${z.reactionsPreCutoff}R${z.bom ? ` | ${z.bom.tf} ${z.bom.type} ${z.bom.mitigations}X` : ''}`;
  const Z: { k: number; z: CardZone }[] = [], Ls: { k: number; top: number; bot: number; t0: number; txt: string }[] = [];
  const O: { k: number; px: number; txt: string }[] = [], S: { k: number; top: number; bot: number; t0: number; dem: boolean; txt: string }[] = [];
  const I: { k: number; px: number }[] = [], T: { k: number; key: string; val: string }[] = [];
  cards.forEach(({ card, sha256 }, k) => {
    const band = card.render_policy.band; const inBand = (lo: number, hi: number) => hi >= band.lo && lo <= band.hi;
    const zones = card.zones.filter(z => z.score >= 6 && inBand(z.lo, z.hi)).sort((a, b) => b.hi - a.hi);
    zones.forEach(z => Z.push({ k, z }));
    card.pillars.P5.lsz.filter(l => l.priority === 'ACTIVE SL TRIGGER' && inBand(l.extLo, l.extHi))
      .forEach(l => Ls.push({ k, top: l.extHi, bot: l.extLo, t0: Date.parse(l.date), txt: `LSZ ${l.side} ${l.date} ACTIVE` }));
    zones.flatMap(z => z.members.filter(m => m.kind === 'option' && m.pillar === 'P8')).filter((v, i, a) => a.findIndex(x => x.id === v.id) === i)
      .forEach(o => O.push({ k, px: o.price, txt: `${o.label} -> ${o.price.toFixed(card.pip === 0.01 ? 3 : 5)}` }));
    card.pillars.P5.sd.filter(z => z.brokenAt === null && inBand(z.lo, z.hi) && Date.parse(card.window.cutoff) - z.t <= 21 * 86_400_000)
      .forEach(z => S.push({ k, top: z.hi, bot: z.lo, t0: z.t, dem: z.side === 'demand', txt: `${z.tf} (${z.mitigations === 0 ? 'Unmitigated' : z.mitigations + 'X'}) | ${z.type}` }));
    zones.forEach(z => [...z.intra.map(i => i.price), ...(z.core ? [z.core.lo] : []), ...(z.spike ? [z.spike.lo] : [])].forEach(px => I.push({ k, px })));
    const rows: [string, string][] = [['E1 card', `${sha256.slice(0, 16)} ${card.schema_version}`], ['Asset / week', `${card.asset} ${card.week_monday} (detected from the last candle)`],
      ['Cutoff / spot', `${card.window.cutoff.slice(0, 16)}Z  ${card.spot_at_cutoff}`], ['Regime (P9)', `${card.regime.state} ${card.regime.direction}`],
      ['Drawn', `${zones.length} zones (MODERATE+, in band) - ${card.zones.length - zones.length} in card only`], ['Display band', `${band.lo.toFixed(card.pip === 0.01 ? 3 : 5)} - ${band.hi.toFixed(card.pip === 0.01 ? 3 : 5)}`],
      ['K factor (P8)', card.pillars.P3P8.K == null ? 'n/a (native strike map)' : card.pillars.P3P8.K.toFixed(4)],
      ...card.missing_data.map(m => [`MISSING ${m.protocol}`, m.impact] as [string, string])];
    rows.forEach(([key, val]) => T.push({ k, key, val }));
  });
  const ks = (xs: { k: number }[]) => arr(xs.map(x => String(x.k)), '-1');
  const L: string[] = ['', '// =====================================================================================================',
    `// E1 LAYER v5 - GENERATED by m1/src/compose.ts from ${cards.length} card(s): ${cards.map(c => `${c.path} ${c.sha256.slice(0, 16)}`).join(', ')}`,
    `// baseline ${BASELINE} sha256 ${baseSha} | LuxAlgo structure labels forced OFF: ${LABEL_INPUTS_OFF.join(', ')}`,
    '// ACTIVE-WEEK LAW: the asset comes from the ticker, the week from the most recent candle; only that card draws.',
    '// Every value below is a card value. Do not edit: regenerate from the cards.',
    '// =====================================================================================================',
    'e1ShowIP    = input.bool(true, "E1 IP zones (pressure ladder)", group = "E1 - Trident 5.3.3")',
    'e1ShowLsz   = input.bool(true, "E1 liquidity sweep zones", group = "E1 - Trident 5.3.3")',
    'e1ShowOpt   = input.bool(true, "E1 option strikes (own pair)", group = "E1 - Trident 5.3.3")',
    'e1ShowSd    = input.bool(true, "E1 canonical 4H/1H S/D", group = "E1 - Trident 5.3.3")',
    'e1ShowIntra = input.bool(false, "E1 intra-zone levels", group = "E1 - Trident 5.3.3")',
    'e1ShowTbl   = input.bool(true, "E1 card table", group = "E1 - Trident 5.3.3")',
    'string e1Ticker = str.upper(str.replace(syminfo.ticker, "/", ""))',
    `var e1KeyA = ${arr(cards.map(c => q(c.card.asset)), '""')}`,
    `var e1KeyW = ${arr(cards.map(c => String(Date.parse(c.card.week_monday + 'T00:00:00Z'))), 'na')}`,
    `var e1Cut = ${arr(cards.map(c => String(Date.parse(c.card.window.cutoff))), 'na')}`,
    `var e1zK = ${ks(Z)}`, `var e1zTop = ${arr(Z.map(x => f(x.z.hi)), 'na')}`, `var e1zBot = ${arr(Z.map(x => f(x.z.lo)), 'na')}`,
    `var e1zT0 = ${arr(Z.map(x => String(x.z.origin)), '0')}`,
    `var e1zFill = ${arr(Z.map(x => `color.new(${rgb(x.z.role, x.z.degree)}, ${x.z.degree === 'EXTREME' || x.z.degree === 'HEAVY' ? 72 : 82})`), 'na')}`,
    `var e1zBord = ${arr(Z.map(x => rgb(x.z.role, x.z.degree)), 'na')}`, `var e1zTxt = ${arr(Z.map(x => q(label(x.z))), '""')}`,
    `var e1lK = ${ks(Ls)}`, `var e1lTop = ${arr(Ls.map(x => f(x.top)), 'na')}`, `var e1lBot = ${arr(Ls.map(x => f(x.bot)), 'na')}`,
    `var e1lT0 = ${arr(Ls.map(x => String(x.t0)), '0')}`, `var e1lTxt = ${arr(Ls.map(x => q(x.txt)), '""')}`,
    `var e1oK = ${ks(O)}`, `var e1oPx = ${arr(O.map(x => f(x.px)), 'na')}`, `var e1oTxt = ${arr(O.map(x => q(x.txt)), '""')}`,
    `var e1sK = ${ks(S)}`, `var e1sTop = ${arr(S.map(x => f(x.top)), 'na')}`, `var e1sBot = ${arr(S.map(x => f(x.bot)), 'na')}`, `var e1sT0 = ${arr(S.map(x => String(x.t0)), '0')}`,
    `var e1sDem = ${arr(S.map(x => x.dem ? 'true' : 'false'), 'false')}`, `var e1sTxt = ${arr(S.map(x => q(x.txt)), '""')}`,
    `var e1iK = ${ks(I)}`, `var e1iPx = ${arr(I.map(x => f(x.px)), 'na')}`,
    `var e1tK = ${ks(T)}`, `var e1tKey = ${arr(T.map(x => q(x.key)), '""')}`, `var e1tVal = ${arr(T.map(x => q(x.val)), '""')}`,
    '// the active week from the most recent candle: the FX week opens Sunday 21:00/22:00 UTC (17:00 New York); +3 h maps',
    '// both DST cases onto Monday, 345600000 ms is Monday 1970-01-05 00:00 UTC, 604800000 ms is one week',
    'var table e1Tbl = table.new(position.top_right, 2, 24, bgcolor = color.new(color.black, 20), border_width = 1)',
    'var bool e1Drawn = false',
    'if barstate.islast and not e1Drawn',
    '    e1Drawn := true',
    '    int e1Mon = int(math.floor((time + 10800000 - 345600000) / 604800000.0)) * 604800000 + 345600000',
    '    int e1Wk = -1',
    '    for k = 0 to array.size(e1KeyW) - 1',
    '        if array.get(e1KeyW, k) == e1Mon and str.contains(e1Ticker, array.get(e1KeyA, k))',
    '            e1Wk := k',
    '            break',
    '    int e1WkO = e1Mon - 7200000',
    '    int e1WkE = e1Mon + 4 * 86400000 + 75600000',
    '    int e1TsR = e1Mon + 25 * 86400000',
    '    if e1Wk < 0',
    '        table.cell(e1Tbl, 0, 0, "E1", text_color = color.silver, text_size = size.small)',
    '        table.cell(e1Tbl, 1, 0, "NO CARD for " + e1Ticker + " week of " + str.format_time(e1Mon, "yyyy-MM-dd", "UTC") + " (last candle " + str.format_time(time, "yyyy-MM-dd HH:mm", "UTC") + " UTC)", text_color = color.rgb(255, 120, 120), text_size = size.small)',
    '    else if time < array.get(e1Cut, e1Wk)',
    '        table.cell(e1Tbl, 0, 0, "E1", text_color = color.silver, text_size = size.small)',
    '        table.cell(e1Tbl, 1, 0, "card for the week of " + str.format_time(e1Mon, "yyyy-MM-dd", "UTC") + " exists from its cutoff " + str.format_time(array.get(e1Cut, e1Wk), "yyyy-MM-dd HH:mm", "UTC") + " UTC", text_color = color.orange, text_size = size.small)',
    '    else',
    '        if e1ShowIP and array.size(e1zK) > 0',
    '            for i = 0 to array.size(e1zK) - 1',
    '                if array.get(e1zK, i) == e1Wk',
    '                    box.new(array.get(e1zT0, i), array.get(e1zTop, i), e1TsR, array.get(e1zBot, i), xloc = xloc.bar_time, bgcolor = array.get(e1zFill, i), border_color = array.get(e1zBord, i), border_width = 1)',
    '                    label.new(e1WkO, array.get(e1zTop, i), array.get(e1zTxt, i), xloc = xloc.bar_time, style = label.style_label_lower_left, color = color.new(color.black, 100), textcolor = array.get(e1zBord, i), size = size.tiny)',
    '        if e1ShowLsz and array.size(e1lK) > 0',
    '            for i = 0 to array.size(e1lK) - 1',
    '                if array.get(e1lK, i) == e1Wk',
    '                    box.new(array.get(e1lT0, i), array.get(e1lTop, i), e1TsR, array.get(e1lBot, i), xloc = xloc.bar_time, bgcolor = color.new(color.rgb(80, 230, 100), 85), border_color = color.rgb(80, 230, 100), border_width = 1, border_style = line.style_dashed)',
    '                    label.new(e1WkE, array.get(e1lBot, i), array.get(e1lTxt, i), xloc = xloc.bar_time, style = label.style_label_upper_right, color = color.new(color.black, 100), textcolor = color.rgb(80, 230, 100), size = size.tiny)',
    '        if e1ShowOpt and array.size(e1oK) > 0',
    '            for i = 0 to array.size(e1oK) - 1',
    '                if array.get(e1oK, i) == e1Wk',
    '                    line.new(e1WkO, array.get(e1oPx, i), e1WkE, array.get(e1oPx, i), xloc = xloc.bar_time, color = color.rgb(255, 200, 60), width = 1, style = line.style_dashed)',
    '                    label.new(e1WkE, array.get(e1oPx, i), array.get(e1oTxt, i), xloc = xloc.bar_time, style = label.style_label_right, color = color.new(color.black, 100), textcolor = color.rgb(255, 200, 60), size = size.tiny)',
    '        if e1ShowSd and array.size(e1sK) > 0',
    '            for i = 0 to array.size(e1sK) - 1',
    '                if array.get(e1sK, i) == e1Wk',
    '                    color c = array.get(e1sDem, i) ? color.rgb(41, 98, 255) : color.rgb(242, 54, 69)',
    '                    box.new(array.get(e1sT0, i), array.get(e1sTop, i), e1WkE, array.get(e1sBot, i), xloc = xloc.bar_time, bgcolor = color.new(c, 78), border_color = c, border_width = 1, text = array.get(e1sTxt, i), text_size = size.small, text_color = color.white, text_halign = text.align_center)',
    '        if e1ShowIntra and array.size(e1iK) > 0',
    '            for i = 0 to array.size(e1iK) - 1',
    '                if array.get(e1iK, i) == e1Wk',
    '                    line.new(e1WkO, array.get(e1iPx, i), e1WkE, array.get(e1iPx, i), xloc = xloc.bar_time, color = color.new(color.silver, 40), width = 1, style = line.style_dotted)',
    '        if e1ShowTbl',
    '            int r = 0',
    '            for i = 0 to array.size(e1tK) - 1',
    '                if array.get(e1tK, i) == e1Wk',
    '                    table.cell(e1Tbl, 0, r, array.get(e1tKey, i), text_color = color.silver, text_size = size.tiny, text_halign = text.align_left)',
    '                    table.cell(e1Tbl, 1, r, array.get(e1tVal, i), text_color = color.white, text_size = size.tiny, text_halign = text.align_left)',
    '                    r += 1', ''];
  const out = Buffer.concat([Buffer.from(baselineText), Buffer.from(L.join('\n'))]);
  const path = 'm1/out/plutus-vision-v5-e1.pine';
  writeFileSync(`${ROOT}${path}`, out);
  return { path, sha: createHash('sha256').update(out).digest('hex'), cards: cards.map(c => c.path), assets: [...new Set(cards.map(c => c.card.asset))],
    zones: Z.length, lsz: Ls.length, opts: O.length, sd: S.length, labelsOff: LABEL_INPUTS_OFF };
}
if (import.meta.main) { console.log(JSON.stringify(compose())); }
