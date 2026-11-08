/**
 * backtest-persist.mjs — THE BACKTEST ROOM'S LOCAL STATE SAVER (the operator's tab persistence).
 *
 * WHY THIS EXISTS (measured 2026-10-07, the operator's report): leaving the BACKTEST tab and
 * coming back RESET the room — the create form's SYMBOL/TIMEFRAME fell back to the first cell in
 * the bundled canon set (a "pinned EURUSD 5m"), the DATA source reset to `fixture`, the BUY/SELL
 * toggle reset to BUY, and the attached session was re-picked as "the first RUNNING row" instead
 * of the one the operator was using. The ONLY persistence the tab had was PANE VISIBILITY
 * (`plutus.bt.layout`, backtest.js:997-1012). tabs/backtest.js is a CLASSIC script that rebuilds
 * its whole fragment on every mount (the shell re-mounts lazily via tabs/_rail.js `t.mount`, and
 * app.js wipes #main-content on a 30 s refresh), so every operator-set control was rebuilt from
 * markup defaults.
 *
 * This module is the DURABLE LOCAL MIRROR, the same shape as the sibling `pine-persist.mjs` that
 * fixed the PINE SHELL tab: DOM-FREE, localStorage-guarded, so it is unit-testable in plain node
 * (no browser) and can NEVER throw into the tab (a browser with storage disabled degrades to
 * "nothing persisted", never to a broken mount).
 *
 * THE STATE IT HOLDS (localStorage keys — the exact strings the acceptance check reads):
 *   plutus.bt.market    JSON {symbol,timeframe} — the create form's SYMBOL + TIMEFRAME (the operator's pick)
 *   plutus.bt.source    'fixture' | 'tv'        — the DATA source select
 *   plutus.bt.side      'buy' | 'sell'          — the ORDER TICKET's side toggle
 *   plutus.bt.session   <session_uid>           — the ATTACHED session (the session-list selection)
 *   plutus.bt.layout    ARRAY/OBJ of pane bits  — NOT owned here: the tab already persists pane
 *                                                visibility inline (backtest.js LAYOUT_KEY); this
 *                                                module never touches it.
 *
 * THE REPLAY POSITION is deliberately NOT mirrored client-side: the cursor/visibleBars live in the
 * ROOM's session (server-side, one truth). Restoring the SESSION selection re-attaches the room's
 * own replay window — a client copy would be a second, divergent truth.
 *
 * AUTHORITY: validators below are the predicate the room's own loader already enforces on
 * agent-writable state (a symbol/timeframe must look like a market, not free text); a persisted
 * value that fails the gate is DROPPED, never restored.
 */

export const BT_PERSIST_VERSION = '1.0.0';

export const BT_KEYS = Object.freeze({
  market: 'plutus.bt.market',
  source: 'plutus.bt.source',
  side: 'plutus.bt.side',
  session: 'plutus.bt.session',
});

/** The control vocabulary the create form + ticket actually offer (backtest.html). */
export const BT_SOURCES = Object.freeze(['fixture', 'tv']);
export const BT_SIDES = Object.freeze(['buy', 'sell']);

/** A market reduced to the two fields the form reads — the same ticker shape pine-persist uses. */
export const SYMBOL_RE = /^[A-Za-z0-9_.!-]{1,40}$/;
/** Timeframes the tab offers: the fixture cells ('5','15','1H') AND the TV feed ('5m','1m','4H','1D'). */
export const TIMEFRAME_RE = /^[0-9]{1,4}[mMHhDdWw]?$/;
/** A room session uid: bounded, no whitespace/slash (never a URL fragment). */
export const SESSION_RE = /^[A-Za-z0-9_.:-]{1,96}$/;

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
    return false; // quota / storage off — the tab keeps running on memory
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

// ── validators (the gate a persisted value must pass to be restored) ────────────────────
export function isValidMarket(m) {
  if (!m || typeof m !== 'object') return false;
  return SYMBOL_RE.test(String(m.symbol)) && TIMEFRAME_RE.test(String(m.timeframe));
}

/** A market reduced to exactly the two fields the form reads. */
export function marketToKey(m) {
  return isValidMarket(m)
    ? { symbol: String(m.symbol), timeframe: String(m.timeframe) }
    : null;
}

export function isValidSource(s) {
  return typeof s === 'string' && BT_SOURCES.includes(s);
}

export function isValidSide(s) {
  return typeof s === 'string' && BT_SIDES.includes(s);
}

export function isValidSession(id) {
  return typeof id === 'string' && SESSION_RE.test(id);
}

// ── the four state items ───────────────────────────────────────────────────────────────
export function readMarket() {
  return marketToKey(readJson(BT_KEYS.market));
}

export function writeMarket(m) {
  const key = marketToKey(m);
  if (!key) {
    removeItem(BT_KEYS.market); // never leave a stale/unvalidatable market to restore into
    return false;
  }
  return setItem(BT_KEYS.market, JSON.stringify(key));
}

export function readSource() {
  const raw = getItem(BT_KEYS.source);
  return isValidSource(raw) ? raw : null;
}

export function writeSource(s) {
  if (!isValidSource(s)) {
    removeItem(BT_KEYS.source);
    return false;
  }
  return setItem(BT_KEYS.source, s);
}

export function readSide() {
  const raw = getItem(BT_KEYS.side);
  return isValidSide(raw) ? raw : null;
}

export function writeSide(s) {
  if (!isValidSide(s)) {
    removeItem(BT_KEYS.side);
    return false;
  }
  return setItem(BT_KEYS.side, s);
}

export function readSession() {
  const raw = getItem(BT_KEYS.session);
  return isValidSession(raw) ? raw : null;
}

export function writeSession(id) {
  if (!isValidSession(id)) {
    removeItem(BT_KEYS.session);
    return false;
  }
  return setItem(BT_KEYS.session, id);
}

// ── the whole mirror, in one read / one write ──────────────────────────────────────────
/** Everything the tab can restore from local storage. Any field may be null. */
export function readState() {
  return {
    market: readMarket(),
    source: readSource(),
    side: readSide(),
    session: readSession(),
  };
}

/** Persist the mirror. A null/absent field CLEARS its key (never restores a stale one). */
export function writeState({ market = null, source = null, side = null, session = null } = {}) {
  return {
    market: writeMarket(market),
    source: writeSource(source),
    side: writeSide(side),
    session: writeSession(session),
  };
}

export function clearState() {
  for (const k of Object.values(BT_KEYS)) removeItem(k);
}
