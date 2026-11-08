/**
 * canon.mjs — THE CANON BRIDGE  (W-S3 T1 · operator ruling 2026-09-29)
 * ---------------------------------------------------------------------------
 * "Every surface that touches a canon artifact renders it through the CANON path …
 *  the canon constants and formats are read from the canon, never re-derived."
 *
 * What this module does — nothing else:
 *
 * 1 · READS THE CANON INSTRUMENT CONSTANTS (never hardcodes them):
 *      · PIP_SIZES                    ← plutus-backtest.hand/log-trade.js  (cross-checked
 *                                       against plutus-backtest.hand/close-trade.js)
 *      · PIP_VALUE_USD_PER_LOT        ← the same canon file
 *     Each read records the SOURCE PATH + SHA-256 of the canon file it was parsed from,
 *     so a provenance line can be printed (`specFor()` → specSource).
 *
 * 2 · WRITES THE CANON SESSION COLUMNS THROUGH THE CANON ROUTE:
 *      · POST  /api/v1/backtest-sessions       (BacktestSessionSchema, api.js:299)
 *      · PATCH /api/v1/backtest-sessions/:uid  (BacktestUpdateSchema, api.js:309)
 *     with the canon's own token (`~/.plutus-dashboard/config.json` → tokens['plutus-backtest'],
 *     else `~/.plutus-dashboard/config/dashboard-token.json`, else the dev default the canon's
 *     own scripts fall back to). The canon's canonical columns are NEVER written by direct
 *     SQLite: only the room's ADDITIVE extension columns are (store.mjs).
 *     A canon-route failure is a NAMED state — `CANON_API_UNAVAILABLE` — recorded in
 *     backtest_events, and only then does the room fall back to a direct write of the same
 *     canon columns so a fill is never lost. Never silent.
 *
 * 3 · EMITS THE CANON UNITS: win_rate as a FRACTION (the canon's unit), pips via the canon
 *     pipSize. See stats.mjs for the envelope + the §11 summary shape.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const API = process.env.PLUTUS_API || 'http://127.0.0.1:9430';

export const CANON_HAND_CANDIDATES = [
  process.env.PLUTUS_CANON_HAND,
  path.resolve(HERE, '..', '..', 'plutus-backtest.hand'),   // SELF-CONTAINED: vendored into the fork (log-trade.js, close-trade.js)
].filter(Boolean);

let _cache = null;

function sha256(p) {
  try { return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').slice(0, 16); }
  catch { return null; }
}

/** Extract a `const NAME = { … };` (or `= <number>;`) literal from canon JS text.
 *  The extracted literal is a plain numeric/string map, so evaluating it is safe. */
function extractLiteral(src, name) {
  const re = new RegExp(`^\\s*(?:const|let|var)\\s+${name}\\s*=\\s*`, 'm');
  const m = re.exec(src);
  if (!m) return null;
  const i = m.index + m[0].length;
  const first = src[i];
  if (first === '{' || first === '[') {
    const close = first === '{' ? '}' : ']';
    let depth = 0;
    for (let j = i; j < src.length; j++) {
      if (src[j] === first) depth++;
      else if (src[j] === close) {
        depth--;
        if (depth === 0) return src.slice(i, j + 1);
      }
    }
    return null;
  }
  const end = src.indexOf(';', i);
  return end < 0 ? null : src.slice(i, end).trim();
}

function evalLiteral(lit) {
  return new Function('"use strict"; return (' + lit + ');')();
}

/**
 * THE CANON INSTRUMENT CONSTANTS, read from the canon's own backtest hand.
 * @returns {{pipSizes:Object, pipValueUsdPerLot:number, source:string, sha:string,
 *            crossCheck:{path:string,sha:string,agree:boolean}, readAt:string}}
 */
export function canonSpec(opts = {}) {
  if (_cache && !opts.force) return _cache;
  let dir = null;
  for (const c of CANON_HAND_CANDIDATES) {
    try { if (fs.existsSync(path.join(c, 'log-trade.js'))) { dir = c; break; } } catch { /* keep walking */ }
  }
  if (!dir) {
    throw Object.assign(new Error(`the canon backtest hand was not found (tried ${CANON_HAND_CANDIDATES.join(', ')})`), {
      code: 'CANON_HAND_ABSENT', tried: CANON_HAND_CANDIDATES,
    });
  }
  const logTrade = path.join(dir, 'log-trade.js');
  const closeTrade = path.join(dir, 'close-trade.js');
  const srcLog = fs.readFileSync(logTrade, 'utf8');
  const srcClose = (() => { try { return fs.readFileSync(closeTrade, 'utf8'); } catch { return ''; } })();

  // each constant is read from the canon file that DECLARES it (measured: PIP_SIZES lives
  // in both, PIP_VALUE_USD_PER_LOT only in close-trade.js), and the two PIP_SIZES copies
  // are cross-checked so a drift between the canon's own scripts is LOUD, not silent.
  const pipFromLog = extractLiteral(srcLog, 'PIP_SIZES');
  const pipFromClose = extractLiteral(srcClose, 'PIP_SIZES');
  if (!pipFromLog && !pipFromClose) {
    throw Object.assign(new Error(`PIP_SIZES was not found in ${logTrade} or ${closeTrade}`), { code: 'CANON_CONSTANT_ABSENT', tried: [logTrade, closeTrade] });
  }
  const pipSizes = evalLiteral(pipFromLog || pipFromClose);
  const pipSizesSource = pipFromLog ? logTrade : closeTrade;

  const pvFromClose = extractLiteral(srcClose, 'PIP_VALUE_USD_PER_LOT');
  const pvFromLog = extractLiteral(srcLog, 'PIP_VALUE_USD_PER_LOT');
  const pipValueUsdPerLot = evalLiteral(pvFromClose || pvFromLog);
  const pipValueSource = pvFromClose ? closeTrade : logTrade;

  const cross = { path: closeTrade, sha: sha256(closeTrade), agree: null };
  if (pipFromLog && pipFromClose) cross.agree = evalLiteral(pipFromLog).EURUSD === evalLiteral(pipFromClose).EURUSD;

  _cache = {
    pipSizes, pipValueUsdPerLot,
    source: pipSizesSource, sha: sha256(pipSizesSource),
    pipValueSource, pipValueSha: sha256(pipValueSource),
    crossCheck: cross,
    readAt: new Date().toISOString(),
  };
  return _cache;
}

/** Parsed pair key from the room's symbol form ('EUR/USD' → 'EURUSD'). */
export function canonPairKey(symbol) {
  return String(symbol || '').replace(/[^A-Za-z]/g, '').toUpperCase();
}

/**
 * The room's instrument spec for a symbol, built FROM the canon constants.
 * `pipSize` is the canon's; `tickSize` is the room's own replay granularity
 * (one tenth of a pip where the canon defines one, else 0.00001) and is
 * declared as the room's constant, not presented as a canon value.
 */
export function specFor(symbol, opts = {}) {
  const cs = canonSpec(opts);
  const key = canonPairKey(symbol);
  const pipSize = cs.pipSizes[key] ?? null;
  return {
    pipSize,
    pipValueUsdPerLot: cs.pipValueUsdPerLot,
    tickSize: pipSize ? pipSize / 10 : 0.00001,
    qtyStep: opts.qtyStep ?? 1,
    minQty: opts.minQty ?? 1,
    valuePerUnit: opts.valuePerUnit ?? 1,
    specSource: `${cs.source} (sha256:${cs.sha}) pip=${pipSize ?? 'ABSENT_IN_CANON'} pipValueUsdPerLot=${cs.pipValueUsdPerLot}`,
  };
}

/** the canon's own token resolution order (config.json → dashboard-token.json → dev default) */
export function canonToken() {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.plutus-dashboard', 'config.json'), 'utf8'));
    const t = cfg && cfg.tokens && cfg.tokens['plutus-backtest'];
    if (t) return { token: t, from: '~/.plutus-dashboard/config.json tokens["plutus-backtest"]' };
  } catch { /* next */ }
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.plutus-dashboard', 'config', 'dashboard-token.json'), 'utf8'));
    if (cfg && cfg.token) return { token: cfg.token, from: '~/.plutus-dashboard/config/dashboard-token.json' };
  } catch { /* next */ }
  return { token: 'rw_dev_plutus_backtest', from: "the canon scripts' own dev fallback (log-trade.js loadToken)" };
}

async function call(method, p, body) {
  const { token, from } = canonToken();
  const url = API + p;
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 6000);
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctl.signal,
    });
    clearTimeout(t);
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { json = null; }
    return { ok: res.ok, status: res.status, json: json, text: text, tokenFrom: from, url: url };
  } catch (err) {
    return { ok: false, status: 0, json: null, text: String(err), error: String(err), tokenFrom: from, url: url };
  }
}

/**
 * CREATE the canon session row through the canon route (BacktestSessionSchema).
 * @returns {Promise<{ok:boolean, canon:'ROUTE'|'UNAVAILABLE', status:number, error?:string}>}
 */
export async function canonCreateSession(row) {
  const body = {
    session_uid: row.session_uid,
    agent_id: row.agent_id || 'plutus-backtest',     // the canon's own agent id (api.js token map)
    agent_version: row.agent_version || 'shell-backtest/1',
    started_at: row.started_at,
    status: row.status || 'RUNNING',
  };
  if (row.trading_week) body.trading_week = row.trading_week;
  if (row.pairs_traded) body.pairs_traded = row.pairs_traded;   // the canon's ≤5-symbol field
  const r = await call('POST', '/api/v1/backtest-sessions', body);
  if (r.ok) return { ok: true, canon: 'ROUTE', status: r.status, tokenFrom: r.tokenFrom };
  return {
    ok: false, canon: 'UNAVAILABLE', status: r.status,
    error: r.error || (r.json && r.json.error) || ('HTTP ' + r.status), tokenFrom: r.tokenFrom,
  };
}

/** PATCH the canon's aggregate columns through the canon route (BacktestUpdateSchema). */
export async function canonPatchSession(uid, agg) {
  const body = {};
  for (const k of ['trading_week', 'completed_at', 'status', 'total_trades', 'win_rate', 'profit_factor', 'total_pnl_pips', 'max_drawdown_pips', 'sharpe_ratio']) {
    if (agg[k] !== undefined && agg[k] !== null) body[k] = agg[k];
  }
  if (!Object.keys(body).length) return { ok: true, canon: 'ROUTE', status: 204, note: 'nothing to update' };
  const r = await call('PATCH', '/api/v1/backtest-sessions/' + encodeURIComponent(uid), body);
  if (r.ok) return { ok: true, canon: 'ROUTE', status: r.status, sent: Object.keys(body) };
  return {
    ok: false, canon: 'UNAVAILABLE', status: r.status,
    error: r.error || (r.json && r.json.error) || ('HTTP ' + r.status), sent: Object.keys(body),
  };
}

/** the canon aggregate projection of a room status (canon units: win_rate is a FRACTION) */
export function canonAggregates(st, status = 'RUNNING') {
  const s = st.stats;
  return {
    status: status,
    total_trades: s.trades_total,
    win_rate: s.winRate.estimate,                 // FRACTION or null below the canon N guard
    profit_factor: s.profitFactor.value,
    total_pnl_pips: s.total_pips,
    max_drawdown_pips: s.max_drawdown ? s.max_drawdown.pct : null,
  };
}

export default { canonSpec, specFor, canonToken, canonCreateSession, canonPatchSession, canonAggregates, canonPairKey };
