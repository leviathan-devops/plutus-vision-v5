/**
 * backtest-persist.selftest.mjs — THE BACKTEST TAB'S TAB-STATE PERSISTENCE PROOF (node, no browser).
 *
 * Runs the real backtest-persist.mjs against an in-memory localStorage and drives THE OPERATOR'S
 * EXACT BUG as a sequence: WRITE the state a "leaving the tab" moment produces, then RE-READ it
 * the way backtest.js restores on the next mount, and assert the operator's SYMBOL + TIMEFRAME come
 * back — NOT the pinned EUR/USD 5m. A final check greps backtest.js so the save/restore wiring
 * cannot silently regress.
 *
 *   node backtest-persist.selftest.mjs      → exit 0 on all-pass, 1 on any failure
 *
 * Self-contained proof artifact (no test framework, no deps): every assertion prints the value it
 * read, so a failure names the property that broke.
 */

import assert from 'node:assert/strict';

// ── the in-memory localStorage the module guards on ───────────────────────────────────────
const _kv = new Map();
globalThis.localStorage = {
  getItem: (k) => (_kv.has(k) ? _kv.get(k) : null),
  setItem: (k, v) => { _kv.set(k, String(v)); },
  removeItem: (k) => { _kv.delete(k); },
  clear: () => { _kv.clear(); },
};

const P = await import('./backtest-persist.mjs');

const results = [];
async function check(name, fn) {
  try {
    const note = await fn();
    results.push({ name, ok: true, note: note === undefined ? '' : String(note) });
  } catch (e) {
    results.push({ name, ok: false, note: (e && e.message) || String(e) });
  }
}

// the create-form <select> the restore reads (the bundled fixture cells the operator sees)
const OPTIONS = ['EURUSD', 'GBPUSD', 'XAUUSD'];
const TF_OPTIONS = { EURUSD: ['5', '15', '60'], GBPUSD: ['5', '15', '60'], XAUUSD: ['5', '15', '60'] };
const hasOption = (list, v) => list.indexOf(v) >= 0;
/** backtest.js restoreMarketSelection(), reproduced against a plain option list. */
function restore(m) {
  const sym = m && hasOption(OPTIONS, m.symbol) ? m.symbol : OPTIONS[0];
  const tf = m && m.symbol === sym && hasOption(TF_OPTIONS[sym] || [], m.timeframe) ? m.timeframe : (TF_OPTIONS[sym] || [])[0];
  return { symbol: sym, timeframe: tf };
}

// ── T1 · a cold store is empty (never a phantom restore) ──────────────────────────────────
await check('T1 cold store reads empty (all four fields null)', () => {
  localStorage.clear();
  const s = P.readState();
  assert.equal(s.market, null);
  assert.equal(s.source, null);
  assert.equal(s.side, null);
  assert.equal(s.session, null);
  return 'market/source/side/session = null';
});

// ── T2 · the four items round-trip under the DOCUMENTED keys ──────────────────────────────
await check('T2 writeState round-trips market + source + side + session under the documented keys', () => {
  localStorage.clear();
  P.writeState({ market: { symbol: 'GBPUSD', timeframe: '15' }, source: 'tv', side: 'sell', session: 'bt-7f3a-2026' });
  const s = P.readState();
  assert.deepEqual(s.market, { symbol: 'GBPUSD', timeframe: '15' });
  assert.equal(s.source, 'tv');
  assert.equal(s.side, 'sell');
  assert.equal(s.session, 'bt-7f3a-2026');
  assert.ok(localStorage.getItem(P.BT_KEYS.market).includes('GBPUSD'));
  assert.equal(localStorage.getItem(P.BT_KEYS.source), 'tv');
  assert.equal(localStorage.getItem(P.BT_KEYS.side), 'sell');
  assert.equal(localStorage.getItem(P.BT_KEYS.session), 'bt-7f3a-2026');
  return `keys = ${Object.values(P.BT_KEYS).join(', ')}`;
});

// ── T3 · an unvalidatable market is DROPPED, never restored (the acceptance's "invalid clears") ──
await check('T3 an invalid market clears the key (no stale symbol restores)', () => {
  localStorage.clear();
  P.writeMarket({ symbol: 'EURUSD', timeframe: '5' });
  assert.deepEqual(P.readMarket(), { symbol: 'EURUSD', timeframe: '5' }, 'the valid market should persist');
  P.writeMarket({ symbol: 'bad symbol!', timeframe: 'nope' }); // space + '!' + a non-timeframe
  assert.equal(P.readMarket(), null);
  assert.equal(localStorage.getItem(P.BT_KEYS.market), null, 'the key must be REMOVED, not left stale');
  return 'invalid market → key removed, readMarket() null';
});

// ── T4 · every other persisted field has its own gate (an out-of-vocabulary value clears) ──
await check('T4 invalid source/side/session are dropped, never restored', () => {
  localStorage.clear();
  P.writeSource('tv'); P.writeSide('sell'); P.writeSession('bt-1');
  assert.equal(P.readSource(), 'tv'); assert.equal(P.readSide(), 'sell'); assert.equal(P.readSession(), 'bt-1');
  P.writeSource('ftp'); P.writeSide('long'); P.writeSession('has space');
  assert.equal(P.readSource(), null); assert.equal(P.readSide(), null); assert.equal(P.readSession(), null);
  assert.equal(localStorage.getItem(P.BT_KEYS.source), null);
  assert.equal(localStorage.getItem(P.BT_KEYS.side), null);
  assert.equal(localStorage.getItem(P.BT_KEYS.session), null);
  return 'source=null side=null session=null after an out-of-vocabulary write';
});

// ── T5 · THE OPERATOR'S BUG, as a sequence: leave the tab, come back ──────────────────────
await check('T5 REMOUNT returns the operator\'s SYMBOL + TIMEFRAME (not the pinned EURUSD 5m)', () => {
  localStorage.clear();
  // (leaving the tab) — the save points write this snapshot (persistMarket / persistSource / persistSide / persistSession)
  P.writeState({ market: { symbol: 'XAUUSD', timeframe: '60' }, source: 'fixture', side: 'sell', session: 'bt-week27' });
  // (coming back) — mount() → refreshAll() → renderCreateForm() → restoreMarketSelection()
  const ask = restore(P.readMarket());
  assert.deepEqual(ask, { symbol: 'XAUUSD', timeframe: '60' }, 'the operator\'s pick came back');
  assert.notDeepEqual(ask, { symbol: 'EURUSD', timeframe: '5' }, 'NOT the pinned default');
  assert.equal(P.readSource(), 'fixture');
  assert.equal(P.readSide(), 'sell');   // the BUY/SELL toggle came back too
  assert.equal(P.readSession(), 'bt-week27'); // the session-list selection (its replay window) came back
  return `market=${ask.symbol} ${ask.timeframe} · source=fixture · side=sell · session=bt-week27`;
});

// ── T6 · a value the operator deleted from the list is ignored (never forced) ──────────────
await check('T6 a stored symbol no longer offered is ignored (the form keeps a valid pick)', () => {
  localStorage.clear();
  P.writeState({ market: { symbol: 'ZZZUSD', timeframe: '15' } }); // valid shape, absent from OPTIONS
  assert.deepEqual(P.readMarket(), { symbol: 'ZZZUSD', timeframe: '15' }, 'the module still stores a valid-shaped pair');
  const ask = restore(P.readMarket());
  assert.deepEqual(ask, { symbol: 'EURUSD', timeframe: '5' }, 'a symbol not in the list falls back to the first option, never forced');
  return 'stored ZZZUSD → form keeps EURUSD (not forced, not fabricated)';
});

// ── T7 · the save/restore points are WIRED into the tab (a regression guard) ──────────────
await check('T7 backtest.js wires the save points + the restore path', async () => {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('./backtest.js', import.meta.url), 'utf8');
  const need = [
    ["import(/* @vite-ignore */ bases[i] + 'backtest-persist.mjs')", 'the mirror dynamic-import loader'],
    ['PS.writeMarket({ symbol: sym.value, timeframe: tf.value })', '(1)(2) SAVE symbol + timeframe on change'],
    ['sym.onchange = function () { fillTimeframes(); persistMarket(); renderCellInfo(); };', '(1) show: symbol change saves'],
    ['tf.onchange = function () { persistMarket(); renderCellInfo(); };', '(2) timeframe change saves'],
    ['restoreMarketSelection(); // the operator', '(1)(2) restore market on the create form render (mount)'],
    ['PS.writeSource(', '(3) DATA source saved'],
    ['PS.writeSide(S.side)', '(3) BUY/SELL side saved'],
    ['persistSession(uid);', '(3) attached session (session-list selection) saved'],
    ['var prefer = PS ? PS.readSession() : null;', '(3) the saved session is preferred on re-attach'],
    ['if (!PS) { try { await loadPersist(); }', 'refreshAll awaits the mirror before restoring'],
    ['S.marketRestored = false;', 'the restore is re-armed on every mount'],
  ];
  const missing = need.filter(([s]) => !src.includes(s)).map(([, label]) => label);
  assert.deepEqual(missing, [], 'missing wiring: ' + missing.join(', '));
  return `${need.length}/${need.length} wiring anchors present`;
});

// ── report ────────────────────────────────────────────────────────────────────────────────
let failed = 0;
for (const r of results) {
  if (!r.ok) failed++;
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.note ? '   — ' + r.note : ''}`);
}
console.log(`\n${results.length - failed}/${results.length} checks PASS`);
process.exit(failed ? 1 : 0);
