/**
 * model.mjs — Vela's indicator MODEL, computed HERE in the station process (AGPL isolation: PineTS +
 * Vela-pinets run in this process only; the renderer receives the model as JSON and Vela draws it).
 *
 * The renderer registers a pass-through 'pine' engine (charts/station-engine.js, no AGPL code) whose
 * prepare/execute call POST /prepare and POST /model. Before 2026-10-01 the renderer imported the AGPL
 * engine bundle itself (charts/pinets-adapter) — a breach of the isolation law, and every compile ran on
 * the Pine tab's main thread.
 *
 * Measured 2026-10-01: the canon over 1603 bars → prepare 62ms, execute 524ms, model 19.9KB of plain
 * JSON (no Map / typed array / function at any depth); a plot series over 1000 Vela bars → 1000 points.
 * Bars MUST be Vela OHLCV ({ time(ms), open, high, low, close, volume }) — raw klines (openTime) yield a
 * one-point series, so they are converted or refused by name here.
 */
import { createHash } from 'node:crypto';
import { PineEngine } from '@luxalgo/vela-pinets';

export const MAX_MODEL_BARS = 20000;
const PREPARED_CACHE_MAX = 64;
const prepared = new Map(); // sha(source)|instanceId -> Promise<PreparedScript>

const coded = (code, message, extra = {}) => Object.assign(new Error(message), { code }, extra);
const shaOf = (s) => createHash('sha256').update(String(s)).digest('hex');

/** one engine for the process: PineEngine holds no per-run state outside its sessions */
const engine = new PineEngine();

function checkSource(source) {
  if (typeof source !== 'string' || !source.trim()) throw coded('PINE_SCRIPT_ABSENT', 'a non-empty Pine source is required');
  if (source.length > 2 * 1024 * 1024) throw coded('PINE_SCRIPT_TOO_LARGE', `source is ${source.length} chars (max 2MB)`);
}
function checkInstance(instanceId) {
  const id = String(instanceId || '');
  if (!/^[A-Za-z0-9_.:\-]{1,120}$/.test(id)) throw coded('PINE_INSTANCE_ID_INVALID', `instanceId must be 1-120 chars of [A-Za-z0-9_.:-] (got ${JSON.stringify(id).slice(0, 60)})`);
  return id;
}

/** Vela OHLCV, oldest -> newest, finite. Raw klines (openTime) are converted; anything else is refused by name. */
export function toVelaBars(input) {
  if (!Array.isArray(input) || !input.length) throw coded('PINE_BARS_ABSENT', 'bars must be a non-empty array of {time,open,high,low,close,volume}');
  if (input.length > MAX_MODEL_BARS) throw coded('PINE_BARS_TOO_MANY', `${input.length} bars (max ${MAX_MODEL_BARS})`);
  const out = new Array(input.length);
  let prev = -Infinity;
  for (let i = 0; i < input.length; i++) {
    const b = input[i] || {};
    const time = Number(b.time ?? b.openTime);
    const o = Number(b.open), h = Number(b.high), l = Number(b.low), c = Number(b.close), v = Number(b.volume ?? 0);
    if (![time, o, h, l, c].every(Number.isFinite)) throw coded('PINE_BAR_MALFORMED', `bar ${i} is not finite OHLC with a time`, { index: i });
    if (time < 1e11) throw coded('PINE_BAR_TIME_UNIT', `bar ${i} time ${time} is not epoch MILLISECONDS`, { index: i });
    if (time <= prev) throw coded('PINE_BARS_UNORDERED', `bar ${i} time ${time} is not after ${prev} (oldest -> newest, unique)`, { index: i });
    prev = time;
    out[i] = { time, open: o, high: h, low: l, close: c, volume: Number.isFinite(v) ? v : 0 };
  }
  return out;
}

async function preparedFor(source, instanceId) {
  const key = shaOf(source) + '|' + instanceId;
  let p = prepared.get(key);
  if (!p) {
    p = engine.prepare(source, instanceId).catch((e) => { prepared.delete(key); throw e; });
    prepared.set(key, p);
    if (prepared.size > PREPARED_CACHE_MAX) prepared.delete(prepared.keys().next().value);
  }
  return p;
}

/** the JSON half of a PreparedScript (the token stays in this process) */
function publicPrepared(p) {
  return { language: p.language, inputs: p.inputs, props: p.props, meta: p.meta, reactsToViewport: !!p.reactsToViewport };
}

function wrapCompile(e) {
  if (e && e.code) return e;
  const m = /line\s*(\d+)(?:[^\d]+(\d+))?/i.exec(String(e && e.message));
  return coded('PINE_COMPILE_ERROR', String((e && e.message) || e), { line: m ? Number(m[1]) : null, column: m && m[2] ? Number(m[2]) : null });
}

export async function prepareScript({ source, instanceId }) {
  checkSource(source);
  const id = checkInstance(instanceId);
  const t0 = Date.now();
  let p;
  try { p = await preparedFor(source, id); } catch (e) { throw wrapCompile(e); }
  return { prepared: publicPrepared(p), sourceSha: shaOf(source), elapsedMs: Date.now() - t0 };
}

/**
 * One STATIC run → the model. `market` = { symbol, timeframe } (Vela codes, e.g. '60'). A run that does not
 * finish in `timeoutMs` is a named PINE_MODEL_TIMEOUT, never a hang.
 */
export async function computeModel({ source, instanceId, bars, market, inputs, props, timeoutMs = 60000 }) {
  checkSource(source);
  const id = checkInstance(instanceId);
  const velaBars = toVelaBars(bars);
  const mk = market && typeof market === 'object' ? market : {};
  const symbol = String(mk.symbol || 'EURUSD').slice(0, 64);
  const timeframe = String(mk.timeframe || '60').slice(0, 16);
  const t0 = Date.now();
  let p;
  try { p = await preparedFor(source, id); } catch (e) { throw wrapCompile(e); }
  const tPrep = Date.now();
  const warnings = [], alerts = [];
  const model = await new Promise((resolve, reject) => {
    let last = null, done = false, session = null;
    const finish = (fn, v) => { if (done) return; done = true; clearTimeout(timer); try { if (session) session.stop(); } catch { /* stopped */ } fn(v); };
    const timer = setTimeout(() => finish(reject, coded('PINE_MODEL_TIMEOUT', `no model within ${timeoutMs}ms`)), timeoutMs);
    session = engine.execute(
      { prepared: p, market: { symbol, timeframe }, bars: velaBars, mode: 'static',
        inputs: inputs && typeof inputs === 'object' ? inputs : undefined, props: props && typeof props === 'object' ? props : undefined },
      {
        onModel: (m) => { last = m; },
        onDone: () => finish(resolve, last),
        onError: (e) => finish(reject, coded('PINE_RUNTIME_ERROR', String((e && e.message) || e))),
        onWarning: (w) => { if (warnings.length < 50) warnings.push(String((w && w.message) || w).slice(0, 300)); },
        onAlert: (a) => { if (alerts.length < 200) alerts.push(a); },
      },
    );
  });
  if (!model) throw coded('PINE_MODEL_EMPTY', 'the run finished without a model (the script declared nothing drawable)');
  return { prepared: publicPrepared(p), model, warnings, alerts, bars: velaBars.length, sourceSha: shaOf(source),
    prepareMs: tPrep - t0, executeMs: Date.now() - tPrep };
}
