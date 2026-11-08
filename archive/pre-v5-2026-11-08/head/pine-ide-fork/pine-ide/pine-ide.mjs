/**
 * pine-ide.mjs — THE PINE SHELL KERNEL (the tab's brain).
 *
 * THE OPERATOR'S DESIGN, RE-SCOPED BY THE ORCHESTRATOR (SHELL_ANCHOR §15/§16, binding):
 *   "THE PINE IDE IS NOT A TS/JS CODING ENVIRONMENT. It is the FINAL SUCCESS GATE
 *    COMPILER."  pipeline output → the canon .pine emitter → (loaded here) → RUN →
 *    rendered as the Plutus vision indicator on the chart → CAPTURE (sha'd PNG) →
 *    LOOK (the reader + the orchestrator) → a verdict row.
 *
 * TWO LANES, ONE CHART (both Run-button paths):
 *   LANE B — THE CANON LANE (mandatory): the canon Part X indicator (trident_v8.pine,
 *     by PATH+SHA, never copied) or the week's emitted Pine → the PINE STATION (:9441,
 *     PineTS, AGPL-isolated) → {plots, drawings, trades, stats} → vision.mjs draws it.
 *   LANE A (the addition, subordinate): a hand-written Pine study / the station's own
 *     catalog, same station path — for building and testing. It is NEVER a substitute
 *     for the canon render (Main's ruling), and it re-derives no canon number.
 *
 * THE REAL-TIME KERNEL: the editor's keystroke → 120ms debounce → station run (~37ms
 * measured) → re-render. A compile/runtime error renders INLINE AT ITS LINE and the
 * chart KEEPS THE LAST GOOD FRAME (never blank) — enforced by never clearing on error.
 *
 * MICRO-TABS: each = one artifact's gate run (its Pine + its chart frame + its verdict
 * row). Activating a tab REPLAYS its own frame; editing one never disturbs another.
 *
 * NO FILE WRITES HAPPEN HERE (a file:// renderer cannot write): the VIL RAIL (:9444)
 * owns the ledger rows and the PNGs; this module only speaks to it.
 *
 * Consumers this module mirrors (measured: ripwire callers of setMarket → chart/app.js:77
 * `applyMarket`, and of addDrawing → chart/app.js:149-186 drawBox/drawLine/drawHLine/
 * drawLabel/drawMarker): the same Vela 0.8.0 calls the trade chart already proves.
 */

import { createGate, DEFAULT_RAIL_BASES } from './gate.mjs';
import { createPineEditor } from './pine-editor.mjs';
import { createMicroTabs } from './microtabs.mjs';
import { createAgentFace } from './agent-face.mjs';
import { renderVision, clearDrawings, frameStats, compositeCanvases, compositeCanvasesSettled, captureViaRenderer, VISION_VERSION } from './vision.mjs';
import { renderLive, LIVE_INDICATOR_TITLE } from './live-render.mjs';

export const PINE_IDE_VERSION = '1.0.0';

const THEME = {
  background: '#0B0B0C',
  textColor: '#9A958C',
  gridColor: 'rgba(255,255,255,0.045)',
  borderColor: 'rgba(255,255,255,0.07)',
  upColor: '#7E9C82',
  downColor: '#9C6B6B',
  fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
};

const PREFILL = `//@version=5
// THE PINE SHELL — a study smoke case (the station's own catalog script).
// THE GATE LANE is ⚑ GATE: it loads the canon Part X indicator by PATH+SHA
// (canon:v8 → trident_v8.pine) and renders the E1/E2/E3 vision indicator.
indicator("EMA Ribbon", overlay=true)
e = ta.ema(close, 20)
plot(e, "EMA 20", color=color.new(color.yellow, 0), linewidth=2)
plot(ta.ema(close, 50), "EMA 50", color=color.new(color.blue, 0), linewidth=1)
plotshape(ta.crossover(e, ta.ema(close, 50)), title="Cross up", style=shape.triangleup, location=location.belowbar, color=color.new(color.lime, 0))
`;

/** The vendored GLOBAL build assigns the whole namespace to `var Vela`; the class is
 *  `Vela.Vela` (measured: dist/vela.global.min.js tail `exports.Vela=gm`). Resolve
 *  either shape so the caller never has to know which build it got. */
export function resolveVelaCtor(g) {
  if (!g) return null;
  if (typeof g === 'function') return g;
  if (typeof g.Vela === 'function') return g.Vela;
  if (typeof g.default === 'function') return g.default;
  return null;
}

/** Load the vendored Vela GLOBAL build (classic script — no CORS needed from file://). */
export function loadVela(apiBase = 'http://127.0.0.1:9430', timeoutMs = 12000) {
  const already = resolveVelaCtor(window.Vela);
  if (already) return Promise.resolve(already);
  return new Promise((resolve, reject) => {
    const url = `${apiBase}/chart/vendor/vela/vela.global.min.js`;
    const s = document.createElement('script');
    s.src = url;
    s.async = true;
    const t = setTimeout(() => reject(Object.assign(new Error(`VELA_LOAD_TIMEOUT ${url}`), { code: 'VELA_ABSENT' })), timeoutMs);
    s.onload = () => {
      clearTimeout(t);
      const ctor = resolveVelaCtor(window.Vela);
      ctor ? resolve(ctor) : reject(Object.assign(new Error('VELA_GLOBAL_ABSENT (window.Vela has no constructor)'), { code: 'VELA_ABSENT' }));
    };
    s.onerror = () => { clearTimeout(t); reject(Object.assign(new Error(`VELA_LOAD_FAILED ${url}`), { code: 'VELA_ABSENT' })); };
    document.head.appendChild(s);
  });
}

/** Dashboard pair/timeframe labels ↔ workbench market codes. The fixture carries EUR/USD, GBP/USD
 *  and DXY (15m/30m/1H/4H); every other market comes from the tv: feed. */
const FIXTURE_PAIRS = { 'EUR/USD': 'EURUSD', 'GBP/USD': 'GBPUSD', DXY: 'DXY' };
const TF_CODE = { '1m': '1', '5m': '5', '15m': '15', '30m': '30', '1H': '60', '4H': '240', '1D': '1D', '1W': '1W' };
export function tfCode(label) { return TF_CODE[label] || String(label); }
export function tfLabel(code) { const e = Object.entries(TF_CODE).find(([, c]) => c === String(code)); return e ? e[0] : String(code); }
export function marketSymbol(pair) {
  if (FIXTURE_PAIRS[pair]) return 'fixture:' + FIXTURE_PAIRS[pair];
  return 'tv:' + String(pair).replace(/\//g, '').toUpperCase();
}
export function pairLabel(ticker) { const t = String(ticker).toUpperCase(); return /^[A-Z]{6}$/.test(t) && t !== 'BTCUSD' && t !== 'ETHUSD' ? `${t.slice(0, 3)}/${t.slice(3)}` : t; }

export async function mount(container, opts = {}) {
  const apiBase = opts.apiBase || (window.dashboardConfig && window.dashboardConfig.apiBase) || 'http://127.0.0.1:9430';
  const wsUrl = opts.wsUrl || (window.dashboardConfig && window.dashboardConfig.wsUrl) || 'ws://127.0.0.1:9431';
  const railBases = opts.railBases || DEFAULT_RAIL_BASES;
  const cfg = Object.assign({ autoDebounceMs: 120, limit: 400, pair: 'EUR/USD', timeframe: '1H' }, opts.config || {});

  const q = (sel) => container.querySelector(sel);
  const slot = (name) => q(`[data-slot="${name}"]`);
  const shell = q('[data-pine-shell]') || container;

  const S = {
    version: PINE_IDE_VERSION, vision: VISION_VERSION, container, shell,
    chart: null, chartError: null, bars: [], barsMeta: null,
    lastGood: null, lastCapture: null, lastRun: null, lastVision: null, lastGate: null,
    live: { ok: null, code: null, updated: null, objects: 0, at: null }, // the auto-rendered PLUTUS IDE indicator
    rail: { up: false, health: null },
    running: false, pendingRun: false,
    autoRun: true, activeTabId: null,
  };

  function stationSymbol() {
    const id = S.wb ? S.wb.marketId() : null;
    if (!id) return null;
    const t = String(id.ticker).toUpperCase();
    return t === 'DXY' ? 'TVC:DXY' : (t.includes('_') ? t.replace('_', ':') : 'FX:' + t);
  }
  let face = null;
  const markDirty = () => { if (face) face.markDirty(); };
  function status(text, state = '') {
    const el = slot('status');
    if (el) { el.textContent = text; el.dataset.state = state; }
  }
  function strip(extra = '') {
    const v = S.lastVision;
    const r = S.lastRun;
    const bits = [];
    if (r && r.ok) bits.push(`COMPILED ${r.elapsedMs}ms`);
    if (r && r.ok) bits.push(`${(r.run.plots || []).length} plots`);
    if (v) {
      bits.push(`${v.boxes} boxes`, `${v.lines} lines`, `${v.labels} labels`, `${v.markers} markers`, `${v.plotSegments} segs`);
      if (v.tables) bits.push(`${v.tables} tables (geometry absent)`);
      if (v.droppedAnchors) bits.push(`${v.droppedAnchors} anchors dropped`);
    }
    bits.push(`bars ${S.bars.length}`);
    if (extra) bits.push(extra);
    return bits.join(' · ');
  }
  function railState(text, state) {
    const el = slot('rail-state');
    if (el) { el.textContent = text; el.dataset.state = state || ''; }
  }
  function verdictLine(k, text, state) {
    const el = slot(k);
    if (el) { el.textContent = text; el.dataset.state = state || ''; }
  }

  const gate = createGate({
    railBases,
    get chart() { return S.chart; },
    render: (chart, run, o) => renderVision(chart, run, o),
    captureCanvas: () => { const r = captureViaRenderer(S.chart, chartHost); S.captureVia = r ? r.via : null; return r ? r.png : null; },
    // THE GATE'S FRAME = ONE canon render. When the live indicator is showing THIS source (same sourceSha) it is the
    // complete render (its table included - the belt cannot draw tables), so the belt drawings stay in the chart's
    // drawing set (the mechanical veto counts them) but are HIDDEN. Any other source: the live indicator steps aside.
    beforeCapture: async (runPayload) => {
      const p = await prepareVision(runPayload); S.lastVision = p.vision;
      const same = !!(S.live && S.live.ok && S.live.sourceSha && runPayload && S.live.sourceSha === runPayload.sourceSha);
      if (same && setLiveVisible(true)) {
        const ch = S.wb && S.wb.chart;
        try { for (const d of ch.drawings.toJSON().drawings || []) ch.drawings.update(d.id, { visible: false }); } catch (e) { /* the belt stays visible */ }
        if (p.vision) p.vision.tablesViaLive = S.live.tableCells > 0;
      } else setLiveVisible(false);
      return p.vision;
    },
    getBars: () => S.bars,
    getSource: () => editor.getSource(),
    getMeta: () => {
      const t = tabs.active();
      return { pair: cfg.pair, timeframe: cfg.timeframe, ref: (q('[data-act="artifact"]') || {}).value || (t && t.ref) || null, week: (q('[data-act="week"]') || {}).value || null };
    },
    reader: typeof opts.reader === 'function' ? opts.reader : null,
  });

  // ── the chart: THE WORKBENCH — a full navigable Vela workspace (symbol search, timeframes,
  // drawing tools, indicators, replay) over the tv: feed and the fixture: bars. The study always
  // computes on EXACTLY the bars this chart shows (the same-bars law): whatever the operator or an
  // agent navigates to becomes the run's input, and AUTO re-runs on it.
  const chartHost = slot('chart');
  S.wb = null;
  S.loadingMarket = false;
  Object.defineProperty(S, 'chart', { configurable: true, enumerable: true, get: () => (S.wb ? S.wb.chart : null), set: () => {} });
  try {
    // the bundle is loaded ONLY from this machine's loopback API (never a configured remote origin)
    const apiUrl = new URL(apiBase);
    // the configured API origin, which must be LOOPBACK (never a remote host serving code into the IDE)
    if ((!['127.0.0.1', 'localhost', '[::1]'].includes(apiUrl.hostname) || !/^https?:$/.test(apiUrl.protocol)) && !opts.workbench) {
      throw Object.assign(new Error(`workbench origin refused: ${apiUrl.origin} is not a loopback API origin`), { code: 'WORKBENCH_ORIGIN_REFUSED' });
    }
    const mod = opts.workbench || await import(`${apiUrl.origin}/charts/workbench.bundle.js`);
    S.wb = mod.mountWorkbench(chartHost, {
      symbol: marketSymbol(cfg.pair), timeframe: tfCode(cfg.timeframe), layout: false,
      storage: opts.chartStorage || null, persistKey: 'pine-shell', watermark: false,
      onError: (e) => { if (e) status(`${e.code}: ${String(e.message).slice(0, 180)}`, 'error'); },
    });
    S.wb.chart.on('load:end', (ev) => onMarketLoaded(ev));
  } catch (e) {
    S.chartError = e;
    const box = document.createElement('div'); box.className = 'pine-chart-error';
    const b = document.createElement('b'); b.textContent = e.code || 'WORKBENCH_ABSENT';
    box.append(b, document.createElement('br'), document.createTextNode(String(e.message)));
    chartHost.replaceChildren(box);
  }

  /** The workbench finished loading a market (the operator's topbar, an agent, or loadBars). */
  function onMarketLoaded(ev) {
    const id = S.wb ? S.wb.marketId() : null;
    if (!id) return;
    S.bars = S.wb.getBars() || [];
    if (S.bars.length) S.goodMarket = id; // the persisted market is the last one that LOADED
    S.barsMeta = { source: `${id.provider}:${id.ticker} ${id.timeframe}`, provider: id.provider };
    cfg.pair = pairLabel(id.ticker); cfg.timeframe = tfLabel(id.timeframe);
    const ml = slot('market');
    if (ml) { ml.textContent = `${id.provider.toUpperCase()} · ${cfg.pair} · ${cfg.timeframe} · ${S.bars.length} bars`; ml.dataset.provider = id.provider; }
    if (S.onMarket) { try { S.onMarket(id); } catch { /* the face's own handler */ } }
    // the operator navigated with the chart's own topbar: the market is part of the workspace
    if (!S.loadingMarket && !S.commandActive && S.bars.length) markDirty();
    if (!S.loadingMarket && S.autoRun && S.bars.length) scheduleRun();
  }

  /** Loads are SERIALIZED: a second loadBars waits for the first (one market switch at a time). */
  let loadChain = Promise.resolve();
  function loadBars(o) { const p = loadChain.then(() => loadBarsInner(o || {})); loadChain = p.catch(() => {}); return p; }
  /** Point the workbench at a market and resolve when ITS bars are in (or the load is named failed). */
  async function loadBarsInner({ pair = cfg.pair, timeframe = cfg.timeframe, symbol = null, limit = cfg.limit, rerun = true } = {}) {
    cfg.limit = limit;
    if (!S.wb || !S.wb.chart) return { ok: false, code: 'WORKBENCH_ABSENT', error: S.chartError ? S.chartError.message : 'no workbench chart' };
    const sym = symbol || marketSymbol(pair);
    const tf = tfCode(timeframe);
    const cur = S.wb.marketId();
    const same = cur && `${cur.provider}:${cur.ticker}`.toUpperCase() === sym.toUpperCase() && String(cur.timeframe) === tf;
    S.loadingMarket = true;
    try {
      if (!same || !(S.wb.getBars() || []).length) {
        await new Promise((resolve) => {
          let off = null; let t = null;
          const done = () => { if (t) clearTimeout(t); if (typeof off === 'function') off(); resolve(); };
          t = setTimeout(done, 20000);
          // only the load:end of THE requested market ends the wait (not an operator's concurrent navigation)
          off = S.wb.chart.on('load:end', (ev) => { if (!ev || !ev.symbol || (String(ev.symbol).toUpperCase() === sym.toUpperCase() && String(ev.timeframe) === tf)) done(); });
          S.wb.setMarket({ symbol: sym, timeframe: tf });
        });
      }
      const err = S.wb.lastError();
      const id = S.wb.marketId();
      S.bars = S.wb.getBars() || [];
      // the load is good ONLY when the chart is ON the requested market, with bars, and no load error:
      // old bars under a failed switch are never reported as the new market's
      const onTarget = id && `${id.provider}:${id.ticker}`.toUpperCase() === sym.toUpperCase() && String(id.timeframe) === tf;
      if (err || !onTarget || !S.bars.length) {
        return { ok: false, code: (err && err.code) || (onTarget ? 'BARS_ABSENT' : 'MARKET_NOT_LOADED'), error: (err && err.message) || `${sym} ${tf}: ${onTarget ? 'no bars' : 'the chart did not switch (on ' + (id ? id.provider + ':' + id.ticker + ' ' + id.timeframe : 'nothing') + ')'}` };
      }
      S.goodMarket = id;
      cfg.pair = pairLabel(id.ticker); cfg.timeframe = tfLabel(id.timeframe);
      S.barsMeta = { source: `${id.provider}:${id.ticker} ${id.timeframe}`, provider: id.provider };
      const from = S.bars[Math.max(0, S.bars.length - 160)].time;
      const to = S.bars[S.bars.length - 1].time;
      try { S.chart.setVisibleRange({ from, to }); } catch { /* frame optional */ }
      // a NEW market clears the old study's drawings (Vela resets the pane) — AUTO re-draws it on these bars
      if (!same && S.autoRun && rerun) scheduleRun();
      return { ok: true, count: S.bars.length, source: S.barsMeta.source };
    } finally { S.loadingMarket = false; }
  }

  const editor = createPineEditor({
    host: slot('editor'),
    source: PREFILL,
    debounceMs: cfg.autoDebounceMs,
    onChange: () => { markDirty(); if (S.autoRun) scheduleRun(); },
  });

  const tabs = createMicroTabs({
    host: slot('microtabs'),
    onActivate: (tab) => { activateTab(tab); markDirty(); },
    onMutate: () => markDirty(),
    onAdd: () => { const t = tabs.add({ name: 'tab ' + (tabs.count() + 1), lane: 'pine', source: PREFILL }); tabs.activate(t.id); },
  });

  function activateTab(tab) {
    if (!tab) return null;
    const prev = S.activeTabId ? tabs.get(S.activeTabId) : null;
    if (prev && prev.id !== tab.id) prev.source = editor.getSource();
    S.activeTabId = tab.id;
    editor.setSource(tab.source || '');
    S.lastVision = null;
    if (tab.frame && S.chart) {
      S.lastRun = tab.frame.run ? { ok: true, run: tab.frame.run, pineSha: tab.frame.pineSha, elapsedMs: tab.frame.elapsedMs ?? null } : S.lastRun;
      S.lastVision = tab.frame.vision;
      S.lastCapture = tab.frame.capture || null;
      renderVision(S.chart, tab.frame.run, { bars: tab.frame.bars });
      const fm = tab.frame.market;
      // an agent command owns the market while it runs — a tab activation inside it never replays one
      if (fm && S.wb && !S.commandActive) {
        const tabAt = tab.id, genAt = S.wsGen; // a later tab / workspace switch owns the chart — no stale paint
        void loadBars({ symbol: `${fm.provider}:${fm.ticker}`, timeframe: fm.timeframe, rerun: false }).then(() => { if (S.activeTabId === tabAt && S.wsGen === genAt && tab.frame) renderVision(S.chart, tab.frame.run, { bars: S.bars }); });
      }
      status(`${tab.name} · frame replayed · ${strip()}`, 'ok');
      paintCapture(tab.frame.capture || S.lastCapture);
    } else if (tab.verdictRow) {
      status(`${tab.name} · verdict row loaded · press RUN`, 'idle');
    } else {
      status(`${tab.name} · no frame yet — press ▶ RUN`, 'idle');
    }
    if (tab.ref) { const sel = q('[data-act="artifact"]'); if (sel) sel.value = tab.ref; }
    return tab;
  }

  let runTimer = null;
  function scheduleRun() {
    if (runTimer) clearTimeout(runTimer);
    runTimer = setTimeout(() => { runTimer = null; void run(); }, cfg.autoDebounceMs);
  }

  /**
   * FRAME THE CHART TO THE GEOMETRY WINDOW — and VERIFY the frame was not clamped.
   *
   * MEASURED (2026-09-29): the canon Part X indicator anchors every drawing to ITS OWN
   * hardcoded window — tsL = timestamp(2026,4,6), tsR = timestamp(2026,5,15) — while the
   * shell's bars are the fixture week (Jun 11 → Jul 6). The drawing set was real (30
   * drawings, 48 anchors) and the artifact was EMPTY: "verified: 30 drawings" said
   * nothing about whether the operator could SEE them. Worse, asking Vela for the April
   * range was CLAMPED to a one-hour window at the data's left edge (measured: requested
   * 2026-04-06→2026-05-15, got 2026-06-11T15:00→16:00) — so the frame is re-read and,
   * when clamped, the bars frame is restored and the clamp is NAMED. The mismatch is real
   * and belongs to the emitter (Part X: the tsL/tsR literals are regenerated per week);
   * the tab must not paper over it with a PASS.
   */
  function frameToGeometry(vision) {
    const e = vision && vision.extent;
    if (!e || !S.chart || !Number.isFinite(e.minTime) || !Number.isFinite(e.maxTime)) return { framed: false, clamped: false };
    if (!e.offscreen) return { framed: false, clamped: false };
    const span = Math.max(1, e.maxTime - e.minTime);
    const pad = Math.max(3600000, Math.round(span * 0.03));
    const want = { from: e.minTime - pad, to: e.maxTime + pad };
    let got = null;
    try { S.chart.setVisibleRange(want); got = S.chart.getVisibleRange ? S.chart.getVisibleRange() : null; } catch { got = null; }
    const clamped = !got || (got.to - got.from) < (want.to - want.from) * 0.5
      || got.to < e.minTime || got.from > e.maxTime;
    if (clamped) {
      if (S.bars.length) {                       // restore the bars frame: keep it usable
        const from = S.bars[Math.max(0, S.bars.length - 160)].time;
        const to = S.bars[S.bars.length - 1].time;
        try { S.chart.setVisibleRange({ from, to }); } catch { /* keep */ }
      }
      if (vision) { vision.frameClamped = true; vision.frameWant = want; vision.frameGot = got; }
      return { framed: false, clamped: true, want, got };
    }
    // The frame now shows the geometry: the extent snapshot's `offscreen` is recomputed
    // against the NEW range so the status strip and the gate's deltas cannot disagree.
    if (vision && vision.extent) {
      const vr = S.chart.getVisibleRange ? S.chart.getVisibleRange() : null;
      if (vr) {
        vision.extent.visibleFrom = vr.from; vision.extent.visibleTo = vr.to;
        vision.extent.offscreen = !(vision.extent.maxTime >= vr.from && vision.extent.minTime <= vr.to);
        if (!vision.extent.offscreen && vision.errors) {
          vision.errors = vision.errors.filter((e) => e.code !== 'GEOMETRY_OFFSCREEN');
        }
      }
    }
    return { framed: true, clamped: false, want, got };
  }
  /**
   * RENDER + WIDEN + FRAME — one preparation path for BOTH the Run button and the gate,
   * so a gated capture is as seeable as an interactive one. Widening the bar HISTORY is
   * canon-safe (same fixture bars; the indicator computes nothing — Part X C-RENDER-3),
   * and it is what lets the canon's own hardcoded window (Apr 6 → May 15) intersect the
   * chart at all. One widen only.
   */
  async function prepareVision(runPayload) {
    if (!S.chart || !runPayload) return { vision: null, framed: { framed: false, clamped: false } };
    let vision = renderVision(S.chart, runPayload, { bars: S.bars });
    let framed = frameToGeometry(vision);
    if (vision && vision.extent && vision.extent.offscreen && cfg.limit < 1600) {
      const w = await loadBars({ limit: 1600 });
      if (w.ok) {
        vision = renderVision(S.chart, runPayload, { bars: S.bars });
        framed = frameToGeometry(vision);
      }
    }
    return { vision, framed };
  }

  async function run({ silent = false } = {}) {
    if (S.running) { S.pendingRun = true; return S.lastRun; }
    S.running = true;
    const wsGen = S.wsGen; // a workspace swap during the await makes this run's result someone else's
    const src = editor.getSource();
    const t = tabs.active();
    if (t) t.source = src;
    if (!silent) status('running…', 'busy');
    tabs.setStatus(S.activeTabId, { state: 'busy', text: 'running' });
    let result;
    try {
      // THE SAME-BARS LAW: with the workbench up, a study runs ONLY on the chart's bars — never on bars
      // the station would fetch for itself because the chart has not loaded
      if (S.wb && !S.bars.length) throw Object.assign(new Error('the chart has no bars loaded yet — the study would run on bars the operator cannot see'), { code: 'CHART_NOT_LOADED' });
      result = await gate.run({ script: src, pair: cfg.pair, timeframe: cfg.timeframe, limit: cfg.limit, bars: S.bars.length ? S.bars : null, symbol: stationSymbol() });
    } catch (e) {
      result = { ok: false, code: e.code || 'VIL_RAIL_DOWN', error: e.message, line: null };
    }
    S.running = false;
    if (wsGen !== S.wsGen) { S.pendingRun = false; return { ok: false, code: 'WORKSPACE_SWITCHED', error: 'the workspace changed while this run was in flight — result discarded' }; }
    S.lastRun = result;

    if (!result.ok) {
      // LAST GOOD FRAME RETENTION: the chart is never cleared on error (ADV-a / ADV-b).
      const kept = S.lastGood ? ` · frame retained (${new Date(S.lastGood.at).toISOString().slice(11, 19)}Z)` : ' · no frame yet';
      editor.setError({ code: result.code, message: result.error, line: result.line });
      status(`${result.code}${result.line ? ' line ' + result.line : ''} — ${String(result.error).slice(0, 160)}${kept}`, 'error');
      tabs.setStatus(S.activeTabId, { state: 'error', text: result.code });
      void refreshRail();                       // the rail badge must not lie about the station
    } else {
      editor.clearError();
      const prep = await prepareVision(result.run);
      const vision = prep.vision;
      const framed = prep.framed;
      S.lastVision = vision;
      // THE AUTO-RENDER: the compiled geometry becomes the ONE live "PLUTUS IDE" indicator on the VISIBLE
      // chart (updated in place — never a second row, never a manual Indicators pick). A failed render is
      // NAMED in S.live; the drawings below still land (the belt), so the chart is never empty.
      try {
        // the workbench owns the engine loader (loopback origin + AGPL isolation); pine-ide only calls it
        const lr = await renderLive({ chart: S.wb && S.wb.chart, run: Object.assign({ ok: true }, result.run), ensureEngine: async () => { if (!S.wb || typeof S.wb.ensurePineEngine !== 'function') throw new Error('the workbench predates ensurePineEngine'); await S.wb.ensurePineEngine(); } });
        S.live = { ok: lr.ok, code: lr.code || null, error: lr.error ? String(lr.error).slice(0, 200) : null, updated: !!lr.updated, objects: lr.objects || 0, at: Date.now(),
          sourceSha: (result.run && result.run.sourceSha) || null, tableCells: (lr.counts && lr.counts.tableCells) || 0 };
        if (!lr.ok) status(`live render ${lr.code}: ${String(lr.error || '').slice(0, 120)}`, 'error');
        // ONE RENDER ON SCREEN: the belt drawings exist only for a failed live render. With both, every canon label
        // was drawn TWICE, offset (measured 2026-10-01 capture) - the canon has one set. Counts stay in S.lastVision.
        else if (S.chart) clearDrawings(S.chart);
      } catch (e) { S.live = { ok: false, code: 'LIVE_RENDER_FAILED', error: String((e && e.message) || e).slice(0, 200), updated: false, objects: 0, at: Date.now() }; }
      S.lastGood = { run: result.run, vision, bars: S.bars.slice(), pineSha: result.pineSha, at: Date.now(), market: S.wb ? S.wb.marketId() : null };
      if (t) { t.frame = Object.assign({}, S.lastGood, { capture: S.lastCapture }); t.ref = result.artifact ? result.artifact.ref : t.ref; }
      tabs.setStatus(S.activeTabId, { state: 'ok', text: `ok ${result.elapsedMs}ms` });
      const warn = (result.run.warnings || []).length ? ` · ${result.run.warnings.length} warnings` : '';
      const off = vision && vision.extent && vision.extent.offscreen;
      const frameNote = framed.framed ? ' · framed to the geometry window'
        : (framed.clamped ? ' · GEOMETRY_OFFSCREEN (Vela clamped the frame to the data range — the artifact window does not intersect the bars)'
          : (off ? ' · GEOMETRY_OFFSCREEN' : ''));
      status(`${strip()}${warn}${frameNote}`, off ? 'error' : 'ok');
    }
    if (S.pendingRun) { S.pendingRun = false; scheduleRun(); }
    return result;
  }

  function paintCapture(cap) {
    if (!cap) { verdictLine('verdict-capture', '—'); return; }
    const stats = cap.stats ? `nonBg ${cap.stats.nonBackground}${cap.stats.blank ? ' BLANK' : ''}` : 'stats absent';
    verdictLine('verdict-capture', `${cap.sha256 ? cap.sha256.slice(0, 16) + '…' : 'no sha'} · ${cap.path ? cap.path.split('/').slice(-1)[0] : (cap.writeCode || 'not written')} · ${stats}`, cap.stats && cap.stats.blank ? 'error' : 'ok');
    verdictLine('verdict-look', cap.sha256 ? 'captured — LOOK it (reader + orchestrator)' : '—');
  }
  async function capture({ name = null } = {}) {
    if (!S.chart) { status('capture refused: no chart (VELA_ABSENT)', 'error'); return { ok: false, code: 'VELA_ABSENT' }; }
    status('capturing…', 'busy');
    try {
      const cap = await gate.capture({ name: name || `pineshell-${((q('[data-act="week"]') || {}).value) || 'unweeked'}-${Date.now()}` });
      S.lastCapture = cap;
      const t = tabs.active();
      if (t && t.frame) t.frame.capture = cap;
      paintCapture(cap);
      status(`${strip()} · captured ${cap.sha256.slice(0, 12)}… → ${cap.path || cap.writeCode}`, cap.stats && cap.stats.blank ? 'error' : 'ok');
      return { ok: true, capture: cap };
    } catch (e) {
      status(`CAPTURE_FAILED ${e.message}`, 'error');
      return { ok: false, code: e.code || 'CAPTURE_FAILED', error: e.message };
    }
  }

  async function refreshRows() {
    const week = (q('[data-act="week"]') || {}).value;
    const host = slot('rows');
    if (!week) { if (host) host.innerHTML = '<div class="pine-row pine-row-muted">set a week to read the VIL ledger</div>'; verdictLine('verdict-state', 'NO WEEK'); return null; }
    const st = await gate.state(week);
    verdictLine('verdict-state', st.state + (st.deltas && st.deltas.length ? ' · ' + st.deltas.join(' ') : ''), /PASS/.test(st.state) ? 'ok' : (/FAIL|INCONCLUSIVE/.test(st.state) ? 'error' : 'idle'));
    if (host) {
      host.innerHTML = (st.rows || []).length
        ? st.rows.map((r) => `<div class="pine-row"><span class="pine-row-w">${r.week}</span><span class="pine-row-v" data-v="${r.orchestratorVerdict || r.readerVerdict}">${r.orchestratorVerdict || r.readerVerdict || '—'}</span><span class="pine-row-sha">${String(r.pngSha || '').slice(0, 10)}</span><span class="pine-row-d">${(r.deltas || []).join(' ') || 'no deltas'}</span><span class="pine-row-t">${String(r.createdAt || '').slice(11, 19)}</span></div>`).join('')
        : `<div class="pine-row pine-row-muted">VIL_UNLOOKED — no verdict row for ${week} (NOT PASSED)</div>`;
    }
    return st;
  }

  async function look(verdict) {
    const week = (q('[data-act="week"]') || {}).value;
    if (!week) { status('look refused: set the week (the row key)', 'error'); return { ok: false, code: 'VIL_WEEK_INVALID' }; }
    if (!S.lastCapture) { status('look refused: capture first', 'error'); return { ok: false, code: 'CAPTURE_ABSENT' }; }
    const t = tabs.active();
    const r = await gate.verdict({
      week, pineSha: (S.lastGood && S.lastGood.pineSha) || (S.lastRun && S.lastRun.pineSha),
      pngSha: S.lastCapture.sha256, orchestratorVerdict: verdict,
      deltas: (S.lastGate && S.lastGate.deltas) || [], ref: t ? t.ref : null,
      pair: cfg.pair, timeframe: cfg.timeframe,
    });
    if (!r.ok) { status(`row refused: ${r.code} — ${r.error}`, 'error'); return r; }
    status(`row written: ${week} · ${verdict} → ${r.rowPath}`, /PASS/.test(verdict) ? 'ok' : 'idle');
    if (t) t.verdictRow = r.row;
    await refreshRows();
    return r;
  }

  /** show/hide the ONE live "PLUTUS IDE" indicator; true when a live indicator exists (and was set) */
  function setLiveVisible(v) {
    const h = S.wb && S.wb.chart && S.wb.chart.__plutusLiveHandle;
    if (!h || typeof h.setVisible !== 'function') return false;
    try { h.setVisible(!!v); return true; } catch (e) { return false; }
  }
  async function runGate() {
    const week = (q('[data-act="week"]') || {}).value;
    const ref = (q('[data-act="artifact"]') || {}).value;
    if (!week) { status('gate refused: set the week (YYYY-Www)', 'error'); return { ok: false, code: 'VIL_WEEK_INVALID' }; }
    status(`gate ${ref || 'buffer'} …`, 'busy');
    // the gate's render IS its drawings (the mechanical veto counts them), so the live indicator steps aside for the
    // capture and returns after it - the captured frame holds exactly one canon render
    let res;
    try { res = await gate.gate({ ref: ref && ref !== 'buffer' ? ref : null, week, pair: cfg.pair, timeframe: cfg.timeframe, limit: cfg.limit, bars: S.bars }); }
    finally { if (setLiveVisible(true) && S.chart) clearDrawings(S.chart); }
    S.lastGate = res;
    if (!res.ok) {
      if (res.run && res.run.ok && S.chart) { const p = await prepareVision(res.run.run); S.lastVision = p.vision; }
      status(`GATE ${res.code}: ${String(res.error || '').slice(0, 180)}`, 'error');
      tabs.setStatus(S.activeTabId, { state: 'error', text: res.code });
      if (res.deltas) verdictLine('verdict-state', 'INCONCLUSIVE · ' + res.deltas.join(' '), 'error');
      return res;
    }
    S.lastVision = res.vision || S.lastVision;
    S.lastCapture = res.capture || S.lastCapture;
    if (res.run && res.run.ok) {
      S.lastRun = res.run;
      S.lastGood = { run: res.run.run, vision: res.vision, bars: S.bars.slice(), pineSha: res.run.pineSha, at: Date.now() };
    }
    const t = tabs.active();
    if (t) { t.verdictRow = res.row; t.frame = Object.assign({}, S.lastGood, { capture: res.capture }); }
    paintCapture(res.capture);
    status(`GATE row written · ${res.row.week} · reader ${res.row.readerVerdict} · ${(res.deltas || []).join(' ') || 'no deltas'}`, res.row.readerVerdict === 'INCONCLUSIVE' ? 'error' : 'ok');
    verdictLine('verdict-state', res.row.readerVerdict + ' · awaiting orchestrator', res.row.readerVerdict === 'INCONCLUSIVE' ? 'error' : 'idle');
    await refreshRows();
    return res;
  }

  // THE BACKEND IS FIXED: this tab is SELF-HOSTED (the LuxAlgo workbench) — the operator's ruling after the
  // TV sign-in wall bricked a chart. The TV/SH switch lives on the TRADE tab only.
  if (chartHost) chartHost.dataset.backend = 'self';
  const setText = (slotName, text) => { const n = slot(slotName); if (n) n.textContent = text; };

  shell.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === 'run') { editor.flush(); void run(); }
    else if (act === 'capture') void capture({});
    else if (act === 'gate') void runGate();
    else if (act === 'look-pass') void look('PASS');
    else if (act === 'look-fail') void look('FAIL');
    else if (act === 'look-inconclusive') void look('INCONCLUSIVE');
    else if (act === 'rows-refresh') void refreshRows();
  });
  shell.addEventListener('change', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    if (act === 'auto') { S.autoRun = !!el.checked; status(S.autoRun ? 'AUTO on (120ms debounce)' : 'AUTO off — press RUN', 'idle'); }
    else if (act === 'week') { markDirty(); void refreshRows(); }
    else if (act === 'artifact') { void (async () => {
      const ref = el.value;
      if (!ref || ref === 'buffer') return;
      const t = tabs.active();
      if (t) { t.ref = ref; t.lane = /^canon:/.test(ref) ? 'canon' : 'station'; tabs.setStatus(t.id, { state: 'idle', text: 'artifact ' + ref }); }
      markDirty();
      try {
        const a = await gate.load(ref);
        editor.setSource(a.source);
        if (t) { t.source = a.source; t.name = ref; t.lane = /^canon:/.test(ref) ? 'canon' : 'week'; }
        status(`${ref} loaded · sha ${a.sha256.slice(0, 12)}… · ${a.lines} lines${a.canon ? ' · CANON (by path+sha)' : ''}`, 'ok');
      } catch (err) { status(`artifact ${ref}: ${err.code || ''} ${err.message}`, 'error'); }
    })(); }
  });
  const weekInput = q('[data-act="week"]');
  if (weekInput) weekInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') void refreshRows(); });

  // the old chat surface now lives in the AGENT'S FACE (agent-face.mjs); kept as a thin alias
  const chat = {
    send: (t) => (face ? face.submit(t) : { ok: false, code: 'FACE_DOWN' }),
    isConnected: () => (face ? face.isConnected() : false),
    seen: () => (face ? face.seen() : []),
  };

  // ── THE WORKSPACE HOOKS (the AGENT'S FACE drives the code + chart panels through these) ──
  function lastRunLite(r) {
    if (!r) return null;
    const v = S.lastVision;
    return { ok: !!r.ok, code: r.code || null, error: r.ok ? null : String(r.error || '').slice(0, 400), line: r.line || null, elapsedMs: r.elapsedMs ?? null, pineSha: r.pineSha || null,
      market: S.wb ? S.wb.marketId() : null, bars: S.bars.length, at: Date.now(),
      vision: v ? { boxes: v.boxes, lines: v.lines, labels: v.labels, markers: v.markers, plotSegments: v.plotSegments, errors: (v.errors || []).map((e) => e.code) } : null };
  }
  /** The workspace as persisted: tabs (source), the active tab, the chart market, the gate inputs. */
  function exportWorkspace() {
    const at = tabs.active();
    if (at) at.source = editor.getSource();
    return {
      v: 1,
      tabs: tabs.list().map((t) => ({ id: t.id, name: t.name, lane: t.lane, ref: t.ref || null, source: t.source || '' })),
      activeTab: S.activeTabId,
      market: S.goodMarket || (S.wb ? S.wb.marketId() : null),
      week: (q('[data-act="week"]') || {}).value || null,
      artifact: (q('[data-act="artifact"]') || {}).value || null,
      autoRun: S.autoRun,
      lastRun: lastRunLite(S.lastRun),
    };
  }
  /** Swap the code + chart panels to a workspace: its tabs, its source, its market — then re-run. */
  async function importWorkspace(state, meta) {
    const st = state || {};
    const list = Array.isArray(st.tabs) && st.tabs.length ? st.tabs : [{ id: 'tab-1', name: 'gate · buffer', lane: 'pine', source: PREFILL }];
    S.wsGen = (S.wsGen || 0) + 1;
    let t = tabs.reset(list, st.activeTab);
    if (!t) t = tabs.reset([{ id: 'tab-1', name: 'gate · buffer', lane: 'pine', source: PREFILL }], 'tab-1'); // nothing valid survived
    S.activeTabId = t ? t.id : null;
    S.lastGood = null; S.lastVision = null; S.lastCapture = null; S.lastGate = null;
    editor.clearError();
    editor.setSource(t ? t.source : '');
    const wk = q('[data-act="week"]'); if (wk) wk.value = st.week || '';
    const sel = q('[data-act="artifact"]'); if (sel && st.artifact && [...sel.options].some((o) => o.value === st.artifact)) sel.value = st.artifact;
    if (typeof st.autoRun === 'boolean') { S.autoRun = st.autoRun; const a = q('[data-act="auto"]'); if (a) a.checked = st.autoRun; }
    paintCapture(null);
    // a persisted market passes the SAME validation as an agent's load command
    const m = st.market && /^(tv|fixture)$/.test(String(st.market.provider)) && /^[A-Za-z0-9_.!-]{1,40}$/.test(String(st.market.ticker)) && /^[0-9]{1,4}$|^1[DW]$/.test(String(st.market.timeframe)) ? st.market : null;
    if (st.market && !m) status('the workspace market was malformed — loaded EUR/USD 1H instead (named, not silent)', 'error');
    const r = await loadBars({ symbol: m ? `${m.provider}:${m.ticker}` : marketSymbol('EUR/USD'), timeframe: m ? m.timeframe : '60', rerun: false });
    if (!r.ok) { status(`${meta && meta.label ? meta.label + ' · ' : ''}${r.code}: ${String(r.error).slice(0, 160)}`, 'error'); return r; }
    if (S.autoRun) await runFresh();
    else status(`${meta && meta.label ? meta.label + ' · ' : ''}workspace loaded · AUTO off — press ▶ RUN`, 'idle');
    void refreshRows();
    return r;
  }
  /** Run on the CURRENT buffer + bars — waiting out an in-flight AUTO run, never returning its stale result. */
  async function runFresh() {
    if (runTimer) { clearTimeout(runTimer); runTimer = null; }
    for (let i = 0; S.running && i < 400; i++) await new Promise((res) => setTimeout(res, 50));
    // still running after 20s: a BUSY refusal — never the previous (possibly other workspace's) result
    if (S.running) return { ok: false, code: 'RUNNER_BUSY', error: 'a study run is still in flight after 20s' };
    S.pendingRun = false;
    return run();
  }
  /** Execute ONE queued agent command on this chart; the result goes back to the agent's CLI. */
  async function runCommand(cmd) {
    if (!cmd || typeof cmd !== 'object' || typeof cmd.cmd !== 'string') return { ok: false, result: { code: 'BAD_COMMAND', error: 'malformed command' }, summary: 'BAD_COMMAND' };
    S.commandActive = true;
    try { return await runCommandInner(cmd); } finally { S.commandActive = false; }
  }
  async function runCommandInner(cmd) {
    const a = cmd.args && typeof cmd.args === 'object' ? cmd.args : {};
    if (a.tab) {
      const t = tabs.list().find((x) => x.name === a.tab || x.id === a.tab);
      if (!t) return { ok: false, result: { code: 'TAB_ABSENT', error: `no micro-tab ${a.tab}` }, summary: `no micro-tab ${a.tab}` };
      if (t.id !== S.activeTabId) tabs.activate(t.id);
    }
    if (cmd.cmd === 'focus') return { ok: true, result: { activeTab: S.activeTabId, market: S.wb ? S.wb.marketId() : null }, summary: 'focused' };
    if (cmd.cmd === 'load') {
      if (!a.symbol || !/^(tv|fixture):[A-Za-z0-9_.!-]{1,40}$/.test(a.symbol)) return { ok: false, result: { code: 'BAD_SYMBOL', error: 'symbol must be tv:TICKER or fixture:TICKER' }, summary: 'BAD_SYMBOL' };
      if (a.timeframe != null && !/^([0-9]{1,4}|1[DW])$/.test(String(a.timeframe))) return { ok: false, result: { code: 'BAD_TIMEFRAME', error: 'timeframe: 1 5 15 30 60 240 1D 1W' }, summary: 'BAD_TIMEFRAME' };
      const r = await loadBars({ symbol: a.symbol, timeframe: String(a.timeframe || '60'), rerun: false });
      if (!r.ok) return { ok: false, result: r, summary: `${r.code}: ${String(r.error).slice(0, 160)}` };
      const rr = S.autoRun ? await runFresh() : null;
      return { ok: true, result: { load: r, run: lastRunLite(rr) }, summary: `${r.source} · ${r.count} bars` };
    }
    if (cmd.cmd === 'run') {
      const r = await runFresh();
      return { ok: !!r.ok, result: lastRunLite(r), summary: r.ok ? strip() : `${r.code}${r.line ? ' line ' + r.line : ''}: ${String(r.error).slice(0, 200)}` };
    }
    if (cmd.cmd === 'capture') {
      const r = await capture({});
      return r.ok
        ? { ok: true, result: { sha256: r.capture.sha256, path: r.capture.path || null, blank: !!(r.capture.stats && r.capture.stats.blank), via: S.captureVia || null }, summary: `captured ${r.capture.sha256.slice(0, 12)}…` }
        : { ok: false, result: r, summary: r.code };
    }
    if (cmd.cmd === 'gate') {
      if (a.week != null && !/^\d{4}-W\d{2}$|^\d{4}-\d{2}-\d{2}$/.test(String(a.week))) return { ok: false, result: { code: 'BAD_WEEK', error: 'week: YYYY-Www or YYYY-MM-DD' }, summary: 'BAD_WEEK' };
      const wk = q('[data-act="week"]'); if (a.week && wk) wk.value = a.week;
      const sel = q('[data-act="artifact"]');
      if (a.artifact && sel) {
        if (![...sel.options].some((o) => o.value === a.artifact)) return { ok: false, result: { code: 'ARTIFACT_ABSENT', error: `no artifact ${a.artifact}` }, summary: 'ARTIFACT_ABSENT' };
        sel.value = a.artifact;
      }
      const r = await runGate();
      return r.ok
        ? { ok: true, result: { row: r.row, deltas: r.deltas || [], capture: r.capture ? { sha256: r.capture.sha256, path: r.capture.path || null } : null }, summary: `row ${r.row.week} · reader ${r.row.readerVerdict}` }
        : { ok: false, result: { code: r.code, error: r.error || null, deltas: r.deltas || [] }, summary: `GATE ${r.code}` };
    }
    return { ok: false, result: { code: 'BAD_COMMAND', error: cmd.cmd }, summary: 'BAD_COMMAND' };
  }

  async function refreshArtifacts() {
    const sel = q('[data-act="artifact"]');
    if (!sel) return [];
    try {
      const list = await gate.artifacts();
      const items = list.items || [];
      const opts = ['<option value="buffer">buffer (the editor)</option>'];
      for (const it of items) opts.push(`<option value="${it.ref}">${it.ref}${it.kind === 'canon' ? ' · CANON' : ''} · ${it.lines}L · ${it.sha256.slice(0, 8)}</option>`);
      sel.innerHTML = opts.join('');
      const t = tabs.active();
      if (t && t.ref) sel.value = t.ref;
      return items;
    } catch (e) {
      sel.innerHTML = `<option value="buffer">buffer (rail down: ${e.code || e.message})</option>`;
      return [];
    }
  }
  async function refreshRail() {
    const h = await gate.health();
    S.rail = { up: h.service === 'vil-rail', health: h };
    if (h.service !== 'vil-rail') { railState(`VIL_RAIL_DOWN — ${h.code || h.error || 'no rail'}`, 'error'); return h; }
    const st = h.station || {};
    railState(`rail :${h.port} · station ${st.up ? 'UP' : 'DOWN'}${st.up ? '' : ' (' + (st.code || '') + ')'}`, st.up ? 'ok' : 'error');
    return h;
  }

  // ── initial state ──
  status('booting — rail + station + workspaces …', 'busy');
  await refreshRail();
  await refreshArtifacts();
  const faceRoot = slot('chat') || shell;
  const token = opts.token || (window.dashboardConfig && window.dashboardConfig.authToken) || '';
  face = createAgentFace({ root: faceRoot, apiBase, wsUrl, token, ide: { exportWorkspace, importWorkspace, runCommand } });
  const booted = await face.boot();
  if (!booted) {
    // AGENT_WORKSPACES_DOWN is named in the face; the IDE itself still runs on a local buffer.
    const t0 = tabs.add({ id: 'tab-1', name: 'gate · buffer', lane: 'pine', source: PREFILL });
    tabs.activate(t0.id);
    const barsRes = await loadBars({ rerun: false });
    if (barsRes.ok) await run({ silent: true });
    status(barsRes.ok ? `${strip()} · WORKSPACES DOWN (local buffer)` : `${barsRes.code}: ${String(barsRes.error).slice(0, 160)}`, 'error');
  }
  await refreshRows();

  const handle = {
    version: PINE_IDE_VERSION,
    mount: container, shell, get chart() { return S.chart; }, get workbench() { return S.wb; }, chartError: S.chartError,
    editor, tabs, gate, chat, get face() { return face; }, exportWorkspace, importWorkspace, runCommand,
    state: () => ({
      version: PINE_IDE_VERSION, vision: VISION_VERSION,
      rail: S.rail, chart: !!S.chart, chartError: S.chartError ? String(S.chartError.message) : null,
      bars: S.bars.length, barsSource: S.barsMeta ? S.barsMeta.source : null,
      autoRun: S.autoRun, activeTab: S.activeTabId, tabCount: tabs.count(),
      lastRun: S.lastRun ? { ok: S.lastRun.ok, code: S.lastRun.code || null, elapsedMs: S.lastRun.elapsedMs || null, pineSha: S.lastRun.pineSha || null } : null,
      lastVision: S.lastVision, lastCapture: S.lastCapture ? { sha256: S.lastCapture.sha256, path: S.lastCapture.path, blank: !!(S.lastCapture.stats && S.lastCapture.stats.blank) } : null,
      lastGate: S.lastGate ? { ok: S.lastGate.ok, code: S.lastGate.code || null, week: S.lastGate.row ? S.lastGate.row.week : null, deltas: S.lastGate.deltas || [] } : null,
      live: S.live,
      status: (slot('status') || {}).textContent,
      railState: (slot('rail-state') || {}).textContent,
      frames: tabs.list().map((t) => ({ id: t.id, name: t.name, lane: t.lane, ref: t.ref, hasFrame: !!t.frame, boxes: t.frame && t.frame.vision ? t.frame.vision.boxes : null, sourceChars: t.source ? t.source.length : 0, status: t.status })),
      drawings: (() => { try { const j = S.chart && S.chart.drawings.toJSON(); return (j && j.drawings) ? j.drawings.length : 0; } catch { return null; } })(),
      chat: { connected: chat.isConnected(), lines: chat.seen().length },
    }),
    run, capture, runGate, look, refreshRows, refreshArtifacts, refreshRail, loadBars,
    clearDrawings: () => (S.chart ? clearDrawings(S.chart) : 0),
    frameStats,
    destroy() { if (runTimer) { clearTimeout(runTimer); runTimer = null; } try { if (face) face.destroy(); } catch { /* gone */ } try { if (S.wb) S.wb.destroy(); } catch { /* gone */ } container.innerHTML = ''; if (window.PlutusPineShell === handle) window.PlutusPineShell = null; },
  };
  window.PlutusPineShell = handle;
  return handle;
}
