// station-engine.js — Vela's 'pine' ScriptingEngine as a PASS-THROUGH to the Pine Station (127.0.0.1:9441).
//
// AGPL ISOLATION (SHELL_ANCHOR §2 / the pin's law): PineTS + Vela-pinets run ONLY in the station process.
// This file imports NOTHING from them: prepare() and execute() POST the source + the chart's own bars to
// the station's /prepare and /model, and Vela draws the returned model JSON natively (boxes, lines, labels,
// tables, plots, fills). It replaces charts/pinets-adapter, which loaded the AGPL engine INTO the renderer
// (2026-09-30, 6e76d00) — a breach of the law, and every compile ran on the Pine tab's main thread.
//
// Contract (Vela ScriptingEngine, contributions-*.d.ts): language, capabilities, prepare(source, instanceId)
// -> PreparedScript (token opaque to Vela), execute(req, handlers) -> ExecutionSession. Live bar ticks are
// coalesced: one request in flight, the latest state runs next, ticks throttled to TICK_MS — a busy chart
// never queues a backlog of station runs.
export const STATION_ENGINE_VERSION = '1.0.0';
const TICK_MS = 2000;
const TIMEOUT_MS = 90000;

const coded = (code, message, extra = {}) => Object.assign(new Error(message), { code }, extra);

/** loopback http(s) only — the station is a 127.0.0.1 service; anything else is refused by name */
export function stationBase(base) {
  const u = new URL(String(base || 'http://127.0.0.1:9441'));
  if (['127.0.0.1', 'localhost', '[::1]'].indexOf(u.hostname) < 0 || !/^https?:$/.test(u.protocol)) {
    throw coded('PINE_STATION_ORIGIN_REFUSED', `${u.origin} is not a loopback station origin`);
  }
  return u.origin;
}

/** only the OHLCV fields cross the wire (Vela bars may carry more) */
export function wireBars(bars) {
  const src = Array.isArray(bars) ? bars : [];
  const out = new Array(src.length);
  for (let i = 0; i < src.length; i++) {
    const b = src[i] || {};
    out[i] = { time: b.time, open: b.open, high: b.high, low: b.low, close: b.close, volume: b.volume ?? 0 };
  }
  return out;
}

export class StationPineEngine {
  constructor({ base = 'http://127.0.0.1:9441', fetchImpl = null, tickMs = TICK_MS } = {}) {
    this.language = 'pine';
    // static runs only: no in-renderer incremental context (that would need the engine HERE)
    this.capabilities = { streaming: false, visibleRange: false, inputs: true, props: true };
    this.base = stationBase(base);
    this.fetch = fetchImpl || ((...a) => globalThis.fetch(...a));
    this.tickMs = tickMs;
  }

  async post(path, body) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
    let res, json = null;
    try {
      res = await this.fetch(this.base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ac.signal });
      json = await res.json().catch(() => null);
    } catch (e) {
      throw coded(e && e.name === 'AbortError' ? 'PINE_STATION_TIMEOUT' : 'PINE_STATION_DOWN',
        `${this.base}${path} - ${e && e.name === 'AbortError' ? `no answer in ${TIMEOUT_MS / 1000}s` : String((e && e.message) || e)}`);
    } finally { clearTimeout(timer); }
    if (!json || json.success !== true) {
      const code = (json && json.code) || `PINE_STATION_HTTP_${res ? res.status : 0}`;
      throw coded(code, (json && json.error) || `station answered HTTP ${res ? res.status : 0}`, { line: json && json.line, column: json && json.column });
    }
    return json.data;
  }

  async prepare(source, instanceId) {
    const d = await this.post('/prepare', { source, instanceId });
    const p = d.prepared || {};
    return { language: 'pine', inputs: p.inputs || [], props: p.props || [], meta: p.meta || { title: 'Pine', overlay: true },
      reactsToViewport: false, token: { source, instanceId } };
  }

  execute(req, handlers) {
    const token = (req.prepared && req.prepared.token) || {};
    const getBars = typeof req.getBars === 'function' ? req.getBars : () => req.bars;
    let inputs = Object.assign({}, req.inputs || {});
    let props = Object.assign({}, req.props || {});
    let stopped = false, deferred = req.historyState === 'backfill';
    let inflight = null, again = false, tick = null;

    const run = () => {
      if (stopped || deferred) return;
      if (inflight) { again = true; return; } // the latest state runs after the current one, once
      inflight = this.post('/model', { source: token.source, instanceId: token.instanceId, bars: wireBars(getBars()),
        market: { symbol: req.market && req.market.symbol, timeframe: req.market && req.market.timeframe }, inputs, props })
        .then((d) => {
          if (stopped) return;
          for (const w of d.warnings || []) { try { handlers.onWarning && handlers.onWarning({ message: String(w) }); } catch { /* host handler */ } }
          for (const a of d.alerts || []) { try { handlers.onAlert && handlers.onAlert(a); } catch { /* host handler */ } }
          handlers.onModel(d.model);
          if (handlers.onDone) handlers.onDone();
        })
        .catch((e) => { if (!stopped && handlers.onError) handlers.onError(e instanceof Error ? e : new Error(String(e))); })
        .finally(() => { inflight = null; if (again && !stopped) { again = false; run(); } });
    };
    run();

    return {
      stop: () => { stopped = true; clearTimeout(tick); tick = null; },
      update: (next, nextProps) => {
        inputs = Object.assign({}, inputs, next || {});
        if (nextProps) props = Object.assign({}, props, nextProps);
        run();
      },
      setVisibleRange: () => { /* capabilities.visibleRange false: not viewport-dependent */ },
      notifyBars: (reason) => {
        if (reason === 'backfill') return;
        if (reason === 'complete') { deferred = false; run(); return; }
        if (deferred || tick) return; // a live tick: at most one run per tickMs
        tick = setTimeout(() => { tick = null; run(); }, this.tickMs);
      },
    };
  }
}
