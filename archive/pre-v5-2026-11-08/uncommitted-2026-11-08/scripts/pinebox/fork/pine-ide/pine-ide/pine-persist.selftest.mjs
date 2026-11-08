/**
 * pine-persist.selftest.mjs — THE TAB-STATE PERSISTENCE PROOF (node, no browser).
 *
 * Runs the real pine-persist.mjs + the real microtabs.mjs against a minimal DOM shim and an
 * in-memory localStorage, and drives THE OPERATOR'S EXACT BUG as a sequence: write the state a
 * "leaving the tab" moment produces, then RE-MOUNT the micro-tab manager from the mirror and
 * assert the three items come back — NOT the PREFILL template, NOT the pinned EUR/USD.
 *
 *   node pine-persist.selftest.mjs      → exit 0 on all-pass, 1 on any failure
 *
 * It is a SELF-CONTAINED proof artifact (no test framework, no deps): every assertion prints
 * the value it read, so a failure names the property that broke.
 */

import assert from 'node:assert/strict';

// ── the shims MUST exist before microtabs.mjs is exercised ────────────────────────────────
function node() {
  const n = {
    className: '', type: '', title: '', textContent: '', value: '', hidden: false,
    style: {}, dataset: {}, children: [],
    appendChild(c) { this.children.push(c); return c; },
    addEventListener() {}, removeEventListener() {},
    setAttribute() {}, getAttribute() { return null; },
    querySelector() { return null; }, querySelectorAll() { return []; },
  };
  return n;
}
globalThis.document = {
  readyState: 'complete',
  createElement: () => node(),
  createTextNode: () => node(),
  addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; },
  body: node(),
};
const _kv = new Map();
globalThis.localStorage = {
  getItem: (k) => (_kv.has(k) ? _kv.get(k) : null),
  setItem: (k, v) => { _kv.set(k, String(v)); },
  removeItem: (k) => { _kv.delete(k); },
  clear: () => { _kv.clear(); },
};

const P = await import('./pine-persist.mjs');
const { createMicroTabs } = await import('./microtabs.mjs');

const results = [];
async function check(name, fn) {
  try {
    const note = await fn();
    results.push({ name, ok: true, note: note === undefined ? '' : String(note) });
  } catch (e) {
    results.push({ name, ok: false, note: (e && e.message) || String(e) });
  }
}

// ── T1 · a cold store is empty (never a phantom restore) ──────────────────────────────────
await check('T1 cold store reads empty (all four fields null)', () => {
  localStorage.clear();
  const w = P.readWorkspace();
  assert.equal(w.source, null);
  assert.equal(w.activeTab, null);
  assert.equal(w.market, null);
  assert.equal(w.tabs, null);
  return 'source/activeTab/market/tabs = null';
});

// ── T2 · all three items round-trip under the DOCUMENTED keys ─────────────────────────────
await check('T2 writeWorkspace round-trips source + activeTab + market under the documented keys', () => {
  localStorage.clear();
  P.writeWorkspace({
    tabs: [{ id: 't1', name: 'gate · buffer', lane: 'pine', ref: null, source: 'PLOT A' },
           { id: 't2', name: 'week 31', lane: 'station', ref: 'canon:v8', source: 'PLOT B' }],
    activeTab: 't2',
    source: 'PLOT B',
    market: { provider: 'fixture', ticker: 'GBPUSD', timeframe: '15' },
  });
  const w = P.readWorkspace();
  assert.equal(w.source, 'PLOT B');
  assert.equal(w.activeTab, 't2');
  assert.deepEqual(w.market, { provider: 'fixture', ticker: 'GBPUSD', timeframe: '15' });
  assert.equal(w.tabs.length, 2);
  assert.equal(w.tabs[1].source, 'PLOT B');
  assert.equal(localStorage.getItem(P.PINE_KEYS.source), 'PLOT B');
  assert.equal(localStorage.getItem(P.PINE_KEYS.activeTab), 't2');
  assert.ok(localStorage.getItem(P.PINE_KEYS.market).includes('GBPUSD'));
  assert.ok(localStorage.getItem(P.PINE_KEYS.tabs).includes('PLOT A'));
  return `keys = ${Object.values(P.PINE_KEYS).join(', ')}`;
});

// ── T3 · an unvalidatable market is DROPPED, never restored ───────────────────────────────
await check('T3 an invalid market clears the key (no stale symbol restores)', () => {
  localStorage.clear();
  P.writeMarket({ provider: 'fixture', ticker: 'EURUSD', timeframe: '5' });
  assert.ok(P.readMarket(), 'the valid market should persist');
  P.writeMarket({ provider: 'evil', ticker: 'x y', timeframe: 'nope' });
  assert.equal(P.readMarket(), null);
  assert.equal(localStorage.getItem(P.PINE_KEYS.market), null);
  return 'invalid market → key removed, readMarket() null';
});

// ── T4 · the tab sanitiser (agent-writable state) drops what microtabs.reset drops ───────
await check('T4 sanitizeTabs caps at 32 and drops malformed/duplicate entries', () => {
  const many = Array.from({ length: 40 }, (_, i) => ({ id: 'x' + i, source: 's' + i }));
  assert.equal(P.sanitizeTabs(many).length, 32, 'cap at 32 (input sliced first, like microtabs.reset)');
  const mixed = P.sanitizeTabs([null, 'str', { source: 5 }, { id: 'bad id!', source: 's' },
    { id: 'dup', source: 'a' }, { id: 'dup', source: 'b' }, { id: 'ok', source: 'z' }]);
  assert.deepEqual(mixed.map((t) => t.id), ['dup', 'ok'], 'non-objects + bad-id + the second dup dropped');
  assert.ok(mixed.every((t) => typeof t.source === 'string'));
  return 'cap=32; mixed list → [dup, ok]';
});

// ── T5 · microtabs.mjs PERSISTS the active id on activate / remove / reset ────────────────
await check('T5 microtabs persists the ACTIVE id on activate, remove and reset', () => {
  localStorage.clear();
  const m = createMicroTabs({ host: node(), persistKey: P.PINE_KEYS.activeTab });
  assert.equal(m.persistKey(), P.PINE_KEYS.activeTab);
  const a = m.add({ id: 't1', name: 'a', source: 'PLOT A' });
  const b = m.add({ id: 't2', name: 'b', source: 'PLOT B' });
  assert.equal(localStorage.getItem(P.PINE_KEYS.activeTab), null, 'add alone does not set active');
  m.activate(b.id);
  assert.equal(localStorage.getItem(P.PINE_KEYS.activeTab), 't2', 'activate persists');
  m.remove(b.id);
  assert.equal(localStorage.getItem(P.PINE_KEYS.activeTab), 't1', 'remove persists the survivor');
  assert.equal(m.persistedActiveId(), 't1');
  m.reset([a], 't1');
  assert.equal(localStorage.getItem(P.PINE_KEYS.activeTab), 't1', 'reset persists');
  return 'activate→t2, remove→t1, reset→t1, persistedActiveId()=t1';
});

// ── T6 · THE OPERATOR'S BUG, as a sequence: leave the tab, come back ──────────────────────
await check("T6 REMOUNT returns the operator's tabs + buffer + market (not PREFILL / not EUR/USD)", () => {
  localStorage.clear();
  const PREFILL = '//@version=5\nindicator("EMA Ribbon")';
  // (leaving the tab) — the kernel's persistNow() writes this snapshot
  P.writeWorkspace({
    tabs: [{ id: 'tab-1', name: 'gate · buffer', lane: 'pine', ref: null, source: PREFILL },
           { id: 'tab-2', name: 'MY WORK', lane: 'pine', ref: null, source: '// MY 5m SCALPER\nplot(close)' }],
    activeTab: 'tab-2',
    source: '// MY 5m SCALPER\nplot(close)',
    market: { provider: 'fixture', ticker: 'EURUSD', timeframe: '5' },
  });
  // (coming back) — the kernel reconstructs exactly as restoreLocalWorkspace() does
  const local = P.readWorkspace();
  const list = local.tabs && local.tabs.length ? local.tabs.map((t) => ({ ...t })) : [];
  if (local.source != null) {
    const idx = list.findIndex((t) => t.id === local.activeTab);
    const at = idx >= 0 ? idx : 0;
    list[at] = { ...list[at], source: local.source };
  }
  const m = createMicroTabs({ host: node(), persistKey: P.PINE_KEYS.activeTab });
  const t = m.reset(list, local.activeTab);
  const editorSource = t ? t.source : '';
  const market = local.market ? `${local.market.provider}:${local.market.ticker} ${local.market.timeframe}` : 'EUR/USD 60';

  assert.equal(m.count(), 2, 'both tabs came back');
  assert.equal(m.activeId(), 'tab-2');
  assert.equal(editorSource, '// MY 5m SCALPER\nplot(close)');
  assert.notEqual(editorSource, PREFILL, 'NOT the default template');
  assert.equal(market, 'fixture:EURUSD 5');
  assert.notEqual(market, 'EUR/USD 60', 'NOT the pinned default market');
  assert.equal(localStorage.getItem(P.PINE_KEYS.activeTab), 'tab-2', 'the restored active id was re-persisted');
  return `tabs=2 active=tab-2 source=${JSON.stringify(editorSource.slice(0, 22))}… market=${market}`;
});

// ── T7 · every save/restore point is WIRED into the kernel (a regression guard) ───────────
await check('T7 pine-ide.mjs wires all four save points + the restore path', async () => {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('./pine-ide.mjs', import.meta.url), 'utf8');
  const need = [
    ["import { PINE_KEYS, readWorkspace, writeWorkspace, isValidMarket } from './pine-persist.mjs'", 'the mirror import'],
    ['persistKey: PINE_KEYS.activeTab', '(1) active micro-tab id'],
    ['source: persisted.source || PREFILL', '(2) editor source restored'],
    ['onChange: () => { markDirty(); schedulePersist(); if (S.autoRun) scheduleRun(); }', '(2) editor source persisted on input'],
    ['market: isValidMarket(m) ? { provider: m.provider, ticker: m.ticker, timeframe: m.timeframe } : null', '(3) the market snapshot'],
    ['schedulePersist(); }', '(3) persist on market load'],
    ['const restored = restoreLocalWorkspace();', 'the face-DOWN restore'],
    ['persistNow(); /* flush the mirror BEFORE the teardown', 'flush on destroy'],
  ];
  const missing = need.filter(([s]) => !src.includes(s)).map(([, label]) => label);
  assert.deepEqual(missing, [], 'missing wiring: ' + missing.join(', '));
  assert.ok(!src.includes('source: PREFILL,'), "the blind 'source: PREFILL,' editor source must be gone");
  return `${need.length}/${need.length} wiring anchors present; blind 'source: PREFILL,' absent`;
});

// ── report ────────────────────────────────────────────────────────────────────────────────
let failed = 0;
for (const r of results) {
  if (!r.ok) failed++;
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.note ? '   — ' + r.note : ''}`);
}
console.log(`\n${results.length - failed}/${results.length} checks PASS`);
process.exit(failed ? 1 : 0);
