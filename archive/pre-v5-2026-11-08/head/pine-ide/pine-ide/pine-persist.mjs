/**
 * pine-persist.mjs — THE PINE IDE'S LOCAL STATE SAVER (the operator's tab persistence).
 *
 * WHY THIS EXISTS (measured 2026-10-07, the operator's report): leaving the PINE SHELL tab
 * and coming back RESET the Pine editor to the DEFAULT TEMPLATE (PREFILL) and the chart to
 * the pinned EUR/USD. The IDE persisted NOTHING locally — its only persistence was the
 * agent-face's SERVER workspace (`PATCH /api/v1/workspaces/<id>/state`, agent-face.mjs:177).
 * With AGENT WORKSPACES DOWN (the face's own "workspaces offline", agent-face.mjs:412) every
 * re-entry — the rail's lazy re-mount (`tabs/_rail.js` `t.mount(host)`), the host re-render
 * guard (`tabs/_shell.js` `watchHost`), or a plain page reload — rebuilt the tab from PREFILL
 * on `cfg.pair='EUR/USD'` (pine-ide.mjs:110).
 *
 * This module is the DURABLE LOCAL MIRROR. It is DOM-FREE and localStorage-guarded, so it is
 * unit-testable in plain node (no browser) and can never throw into the IDE (a browser with
 * storage disabled degrades to "nothing persisted", never to a broken mount).
 *
 * THE STATE IT HOLDS (localStorage keys — the exact strings the acceptance check reads):
 *   plutus.pine.editorSource    the ACTIVE micro-tab's Pine source (the editor buffer)
 *   plutus.pine.activeMicrotab  the ACTIVE micro-tab id
 *   plutus.pine.market          JSON {provider,ticker,timeframe} — the chart symbol + timeframe
 *   plutus.pine.tabs            JSON [{id,name,lane,ref,source}] — every micro-tab's buffer,
 *                               which is what makes a persisted ACTIVE id mean anything
 *
 * AUTHORITY: the face's server workspace, when the face is UP, stays authoritative —
 * pine-ide.importWorkspace() overwrites this mirror. The mirror is what restores when the
 * face is DOWN and what a remount lands on when the server workspace is empty.
 *
 * The validators below are the SAME predicates importWorkspace()/microtabs.reset() already
 * enforce on agent-writable state (pine-ide.mjs:632, microtabs.mjs:126-131): a persisted
 * market/tab list must pass the same gate as an agent's load command, or it is dropped.
 */

export const PINE_PERSIST_VERSION = '1.0.0';

export const PINE_KEYS = Object.freeze({
  source: 'plutus.pine.editorSource',
  activeTab: 'plutus.pine.activeMicrotab',
  market: 'plutus.pine.market',
  tabs: 'plutus.pine.tabs',
});

/** The tab-list cap + source cap the CLI/microtabs already enforce (agent-writable state). */
export const MAX_TABS = 32;
export const MAX_SOURCE = 400000;

/** The market shape pine-ide.importWorkspace validates before it will load one (pine-ide.mjs:632). */
export const MARKET_RE = Object.freeze({
  provider: /^(tv|fixture)$/,
  ticker: /^[A-Za-z0-9_.!-]{1,40}$/,
  timeframe: /^[0-9]{1,4}$|^1[DW]$/,
});

// ── the storage layer: every access guarded, so storage-off is a no-op, never a throw ──
function storage() {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null; // a browser policy that throws on ACCESS (not on use)
  }
}

function getItem(key) {
  const s = storage();
  if (!s) return null;
  try {
    return s.getItem(key);
  } catch {
    return null;
  }
}

function setItem(key, value) {
  const s = storage();
  if (!s) return false;
  try {
    s.setItem(key, String(value));
    return true;
  } catch {
    return false; // quota / storage off — the IDE keeps running on memory
  }
}

function removeItem(key) {
  const s = storage();
  if (!s) return;
  try {
    s.removeItem(key);
  } catch {
    /* storage off — nothing to remove */
  }
}

function readJson(key) {
  const raw = getItem(key);
  if (raw == null || raw === '') return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null; // corrupt state is dropped, never trusted
  }
}

// ── validators (shared with the IDE's own gates) ────────────────────────────────────────
export function isValidMarket(m) {
  if (!m || typeof m !== 'object') return false;
  return MARKET_RE.provider.test(String(m.provider))
    && MARKET_RE.ticker.test(String(m.ticker))
    && MARKET_RE.timeframe.test(String(m.timeframe));
}

/** A market reduced to exactly the three fields the loader reads (`provider:ticker` + timeframe). */
export function marketToKey(m) {
  return isValidMarket(m) ? { provider: String(m.provider), ticker: String(m.ticker), timeframe: String(m.timeframe) } : null;
}

/** The tab-list sanitiser — mirrors microtabs.reset()'s own guard on agent-writable state. */
export function sanitizeTabs(list) {
  const out = [];
  const seen = new Set();
  for (const spec of Array.isArray(list) ? list.slice(0, MAX_TABS) : []) {
    if (!spec || typeof spec !== 'object') continue;
    if (typeof spec.source !== 'string' || spec.source.length > MAX_SOURCE) continue;
    const id = typeof spec.id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(spec.id) ? spec.id : null;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      name: typeof spec.name === 'string' ? spec.name.slice(0, 80) : id,
      lane: ['pine', 'canon', 'station', 'week'].includes(spec.lane) ? spec.lane : 'pine',
      ref: typeof spec.ref === 'string' ? spec.ref.slice(0, 200) : null,
      source: spec.source,
    });
  }
  return out;
}

// ── the three state items ──────────────────────────────────────────────────────────────
export function readSource() {
  const raw = getItem(PINE_KEYS.source);
  return typeof raw === 'string' && raw.length ? raw : null;
}

export function writeSource(source) {
  if (typeof source !== 'string') return false;
  return setItem(PINE_KEYS.source, source.slice(0, MAX_SOURCE));
}

export function readActiveTab() {
  const raw = getItem(PINE_KEYS.activeTab);
  return typeof raw === 'string' && raw.length ? raw : null;
}

export function writeActiveTab(id) {
  if (typeof id !== 'string' || !id.length) {
    removeItem(PINE_KEYS.activeTab);
    return false;
  }
  return setItem(PINE_KEYS.activeTab, id);
}

export function readMarket() {
  return marketToKey(readJson(PINE_KEYS.market));
}

export function writeMarket(m) {
  const key = marketToKey(m);
  if (!key) {
    removeItem(PINE_KEYS.market); // never leave a stale/unvalidatable market to restore into
    return false;
  }
  return setItem(PINE_KEYS.market, JSON.stringify(key));
}

export function readTabs() {
  const list = sanitizeTabs(readJson(PINE_KEYS.tabs));
  return list.length ? list : null;
}

export function writeTabs(list) {
  const clean = sanitizeTabs(list);
  if (!clean.length) {
    removeItem(PINE_KEYS.tabs);
    return false;
  }
  return setItem(PINE_KEYS.tabs, JSON.stringify(clean));
}

// ── the whole mirror, in one read / one write ──────────────────────────────────────────
/** Everything the IDE can restore from local storage. Any field may be null. */
export function readWorkspace() {
  return {
    source: readSource(),
    activeTab: readActiveTab(),
    market: readMarket(),
    tabs: readTabs(),
  };
}

/** Persist the full mirror. A null/absent field CLEARS its key (never restores a stale one). */
export function writeWorkspace({ tabs = null, activeTab = null, source = null, market = null } = {}) {
  const ok = { source: writeSource(source), activeTab: writeActiveTab(activeTab), market: writeMarket(market), tabs: writeTabs(tabs) };
  return ok;
}

export function clearWorkspace() {
  for (const k of Object.values(PINE_KEYS)) removeItem(k);
}
