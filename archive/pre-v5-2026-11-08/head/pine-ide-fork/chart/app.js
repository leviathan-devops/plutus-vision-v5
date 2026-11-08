/**
 * app.js — THE SELF-HOSTED TERMINAL (the TRADE tab's SELF backend).
 *
 * ZERO-TV LAW (SHELL_ANCHOR §8): every datum here comes from the shell's own
 * rails — the dashboard API's bar fixture (:9430), the PINE STATION (:9441) and
 * the BROKER RAIL (:9442). Unplug the network and this page is fully functional.
 *
 * AGPL ISOLATION (§2): this page NEVER imports PineTS. It POSTs the source to the
 * station and draws the JSON that comes back. Everything below is Apache-2.0
 * (Vela) + our own code.
 *
 * THE THREE WIRES:
 *   BARS     GET  :9430/api/v1/chart/bars?pair=&timeframe=      (the pipeline fixture)
 *   STUDIES  GET  :9441/catalog · POST :9441/run {script|canon, overlay}
 *   BROKER   GET  :9442/snapshot · /positions                   (broker-sdk, read-only)
 *
 * LOUD FAILURE: a dead station renders PINE_STATION_DOWN, a dead rail renders
 * BROKER_RAIL_DOWN, a missing broker shows BROKER_NOT_CONFIGURED, a bad script
 * shows its own named code + line. Never a blank panel, never a fake quote.
 *
 * STUDY LAYER: everything a study draws is tracked by drawing id, so re-running
 * a study clears ITS layer only and leaves the operator's manual drawings alone.
 */

import { Vela } from '@luxalgo/vela';

const API = new URLSearchParams(location.search);
const MAIN_API = API.get('api') || 'http://127.0.0.1:9430';
const PINE_API = API.get('pine') || 'http://127.0.0.1:9441';
const BROKER_API = API.get('broker') || 'http://127.0.0.1:9442';

const PAIR_CELL = { EURUSD: 'EUR/USD', GBPUSD: 'GBP/USD', DXY: 'DXY' };
const SYMBOL_OF = { EURUSD: 'OANDA:EURUSD', GBPUSD: 'OANDA:GBPUSD', DXY: 'TVC:DXY' };
const PAIR_OF_SYMBOL = { 'OANDA:EURUSD': 'EUR/USD', 'FX:EURUSD': 'EUR/USD', 'OANDA:GBPUSD': 'GBP/USD', 'FX:GBPUSD': 'GBP/USD', 'TVC:DXY': 'DXY', DXY: 'DXY' };
const WEEK_MS = 7 * 24 * 3600 * 1000;
const MAX_PLOT_ANCHORS = 900;   // a polyline longer than this is windowed (reported)
const MAX_LABELS = 60;          // canon labels drawn per run (reported when capped)

const THEME = {
  background: '#0B0B0C',
  textColor: '#9A958C',
  gridColor: 'rgba(255,255,255,0.045)',
  borderColor: 'rgba(255,255,255,0.07)',
  upColor: '#7E9C82',
  downColor: '#9C6B6B',
  fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
};

const state = {
  pair: (API.get('pair') || 'EURUSD').toUpperCase(),
  symbol: null,
  timeframe: API.get('tf') || '1H',
  anchorMs: null,
  meta: null,
  bars: [],
  drawings: [],
  weekFramed: true,
  ready: false,
  error: null,
  // the study layer
  study: { id: null, source: '', title: '—', run: null, status: 'IDLE', error: null, ms: null, capped: null },
  catalog: [],
  native: [],
  station: { up: false, canon: null, error: null },
  broker: { status: 'UNKNOWN', account: null, positions: null, error: null },
};

const el = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? '' : s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

function fail(code, message) {
  state.error = { code, message };
  const box = el('error');
  box.style.display = 'block';
  box.innerHTML = `<b>${esc(code)}</b><br><br>${esc(message)}`;
}

/* ─────────────────────────────── Vela ─────────────────────────────── */

const chart = new Vela(el('chart'), {
  theme: THEME,
  priceStyle: 'candles',
  volume: false,
  logScale: false,
  currentPriceLine: true,
  nativeBackend: API.get('backend') || 'canvas2d',
  animations: false,
  drawings: { toolbar: false },
  height: '100%',
});

/* ───────────────────── the study layer (drawing bookkeeping) ───────────────────── */

const LAYER = { ids: [], errors: [], capped: null };

function clearStudyLayer() {
  for (const id of LAYER.ids.slice()) { try { chart.drawings.remove(id); } catch (e) { /* gone */ } }
  LAYER.ids = [];
  LAYER.errors = [];
  LAYER.capped = null;
}

function addStudyDrawing(type, init) {
  try {
    const d = chart.drawings.add(type, init);
    if (d) { LAYER.ids.push(d.id); return d; }
    LAYER.errors.push(`${type}: unsupported`);
    return null;
  } catch (e) {
    LAYER.errors.push(`${type}: ${e.message}`);
    return null;
  }
}

/** Pine colour → the form Vela's style fields accept. Format only — never a re-skin
 *  of a canon colour (CANON IS LAW: the canon's own colours pass through). */
function cssColor(c, fallback) {
  if (!c || typeof c !== 'string') return fallback;
  const s = c.trim();
  if (/^#([0-9a-f]{8})$/i.test(s)) {
    const r = parseInt(s.slice(1, 3), 16), g = parseInt(s.slice(3, 5), 16), b = parseInt(s.slice(5, 7), 16);
    const a = parseInt(s.slice(7, 9), 16) / 255;
    return `rgba(${r},${g},${b},${a.toFixed(3)})`;
  }
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)) return s;
  if (/^rgba?\(/i.test(s)) return s;
  return fallback;
}

const DEFAULT_LINE = '#B99A5B';

/** A station plot → a Vela polyline over the bars it covers. */
function drawPlot(plot) {
  const vals = (plot.values || []).filter((v) => v && Number.isFinite(v.value));
  if (vals.length < 2) return 0;
  let capped = vals;
  if (vals.length > MAX_PLOT_ANCHORS) { capped = vals.slice(-MAX_PLOT_ANCHORS); LAYER.capped = `${plot.title}: ${vals.length}→${capped.length} anchors`; }
  const d = addStudyDrawing('polyline', {
    anchors: capped.map((v) => ({ time: v.time, price: v.value })),
    style: { lineColor: cssColor(plot.color, DEFAULT_LINE), lineWidth: Math.max(1, Math.min(4, Number(plot.width) || 1)), lineStyle: 'solid' },
  });
  return d ? 1 : 0;
}

/** plotshape/plotchar markers → an arrow (up/down) or a stamp at the bar. */
function drawMarker(m) {
  let n = 0;
  for (const p of (m.points || [])) {
    if (!Number.isFinite(p.time)) continue;
    const price = Number(p.price ?? m.price ?? NaN);
    if (!Number.isFinite(price)) continue;
    const loc = String(p.location || '').toLowerCase();
    const shape = String(p.shape || '').toLowerCase();
    const down = /below|triangle_down|triangledown|arrowdown|above/.test(shape + loc) && !/up/.test(shape);
    const type = down ? 'arrowmarkdown' : 'arrowmarkup';
    if (addStudyDrawing(type, {
      anchors: [{ time: p.time, price }],
      style: { lineColor: cssColor(p.color, down ? '#9C6B6B' : '#7E9C82'), lineWidth: 2, lineStyle: 'solid' },
      text: { content: String(p.text || m.title || '') },
    })) n++;
  }
  return n;
}

/** The canon's / Pine's own drawings, anchored in epoch-ms by the station. */
function drawPineDrawings(d) {
  const counts = { boxes: 0, labels: 0, lines: 0 };
  for (const b of (d.boxes || [])) {
    if (addStudyDrawing('box', {
      anchors: [{ time: b.a.time, price: b.a.price }, { time: b.b.time, price: b.b.price }],
      style: {
        lineColor: cssColor(b.borderColor, cssColor(b.color, DEFAULT_LINE)),
        fillColor: cssColor(b.color, 'rgba(185,154,91,0.10)'),
        lineWidth: 1,
        lineStyle: 'solid',
      },
      props: { extend: 'none' },
    })) counts.boxes++;
  }
  for (const l of (d.lines || [])) {
    if (addStudyDrawing('trendline', {
      anchors: [{ time: l.a.time, price: l.a.price }, { time: l.b.time, price: l.b.price }],
      style: { lineColor: cssColor(l.color, DEFAULT_LINE), lineWidth: Math.max(1, Math.min(4, Number(l.width) || 1)), lineStyle: 'solid' },
    })) counts.lines++;
  }
  const labels = (d.labels || []);
  const shown = labels.slice(0, MAX_LABELS);
  if (labels.length > shown.length) LAYER.capped = `labels ${labels.length}→${shown.length}`;
  for (const l of shown) {
    if (addStudyDrawing('pricelabel', {
      anchors: [{ time: l.time, price: l.price }],
      text: { content: String(l.text || '') },
      style: { lineColor: cssColor(l.textColor, '#E8E4DC'), lineWidth: 1, lineStyle: 'solid', fillColor: 'rgba(185,154,91,0.14)' },
    })) counts.labels++;
  }
  return counts;
}

/** A strategy's fills → an arrow at the entry, a stamp at the exit. */
function drawTrades(trades) {
  let n = 0;
  for (const t of (trades || [])) {
    if (Number.isFinite(t.entryTime) && Number.isFinite(t.entryPrice)) {
      const long = t.side === 'long';
      if (addStudyDrawing(long ? 'arrowmarkup' : 'arrowmarkdown', {
        anchors: [{ time: t.entryTime, price: t.entryPrice }],
        style: { lineColor: long ? '#7E9C82' : '#9C6B6B', lineWidth: 2, lineStyle: 'solid' },
        text: { content: `${long ? 'LONG' : 'SHORT'} ${t.entryId || ''}`.trim() },
      })) n++;
    }
    if (Number.isFinite(t.exitTime) && Number.isFinite(t.exitPrice)) {
      const p = Number(t.profit);
      const label = Number.isFinite(p) ? `${p >= 0 ? '+' : ''}${p.toFixed(5)}` : 'exit';
      if (addStudyDrawing('pricelabel', {
        anchors: [{ time: t.exitTime, price: t.exitPrice }],
        text: { content: label },
        style: {
          lineColor: Number.isFinite(p) && p >= 0 ? '#7E9C82' : '#9C6B6B',
          lineWidth: 1, lineStyle: 'solid', fillColor: 'rgba(255,255,255,0.06)',
        },
      })) n++;
    }
  }
  return n;
}

/** Paint one station run onto the chart. Returns the per-kind counts actually drawn. */
function paintRun(run) {
  clearStudyLayer();
  const drawn = { plots: 0, markers: 0, boxes: 0, labels: 0, lines: 0, trades: 0 };
  for (const p of (run.plots || [])) drawn.plots += drawPlot(p);
  for (const m of (run.markers || [])) drawn.markers += drawMarker(m);
  const d = drawPineDrawings(run.drawings || {});
  drawn.boxes += d.boxes; drawn.labels += d.labels; drawn.lines += d.lines;
  drawn.trades = drawTrades(run.trades || []);
  return drawn;
}

/* ─────────────────────────────── bars ─────────────────────────────── */

function windowForWeek() {
  // MON → FRI: the most recent COMPLETE trading week at or before the anchor.
  const anchor = state.anchorMs;
  const d = new Date(anchor);
  const intoDay = ((d.getUTCHours() * 60 + d.getUTCMinutes()) * 60 + d.getUTCSeconds()) * 1000;
  const sinceMonday = (((d.getUTCDay() + 6) % 7)) * 86400000 + intoDay;
  const mondayThisWeek = anchor - sinceMonday;
  const from = mondayThisWeek - 7 * 86400000;
  return { from, to: from + 5 * 86400000 };
}

async function loadBars(pair, tf) {
  const cell = PAIR_CELL[pair] || pair;
  const url = `${MAIN_API}/api/v1/chart/bars?pair=${encodeURIComponent(cell)}&timeframe=${encodeURIComponent(tf)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`bars HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'bars request failed');
  return json.data;
}

async function applyMarket({ frameWeek = false } = {}) {
  el('error').style.display = 'none';
  try {
    const data = await loadBars(state.pair, state.timeframe);
    state.bars = data.bars;
    state.anchorMs = data.anchorMs;
    state.meta = data;
    state.symbol = SYMBOL_OF[state.pair] || data.symbol || state.pair;
    await chart.setMarket({
      symbol: (PAIR_CELL[state.pair] || state.pair) + ' · ' + state.timeframe,
      timeframe: state.timeframe,
      data: data.bars,
    });
    if (frameWeek || state.weekFramed) {
      state.weekFramed = true;
      chart.setVisibleRange(windowForWeek());
      try { if (chart.historyComplete) await chart.historyComplete(); } catch (e) { /* never fatal */ }
      await new Promise((r) => setTimeout(r, 260));
      chart.setVisibleRange(windowForWeek());
    }
    state.ready = true;
    paintReadout();
    paintFurniture();
  } catch (e) {
    fail('CHART_DATA_ABSENT', e.message);
  }
}

/* ─────────────────────────────── the PINE STATION ─────────────────────────────── */

async function stationGet(route, timeoutMs = 5000) {
  const res = await fetch(`${PINE_API}${route}`, { signal: AbortSignal.timeout(timeoutMs) });
  const json = await res.json();
  if (!json.success) throw Object.assign(new Error(json.error || 'station error'), { code: json.code });
  return json.data;
}

async function stationHealth() {
  try {
    const h = await stationGet('/health', 3000);
    state.station = { up: true, canon: h.canon || null, error: null, engine: h.engine, pid: h.pid };
  } catch (e) {
    state.station = { up: false, canon: null, error: e.message, code: 'PINE_STATION_DOWN' };
  }
  paintStation();
}

async function stationCatalog() {
  try {
    const c = await stationGet('/catalog');
    state.catalog = c.studies || [];
    const sel = el('study-select');
    sel.innerHTML = '';
    const opt = (v, t) => { const o = document.createElement('option'); o.value = v; o.textContent = t; return o; };
    sel.appendChild(opt('', '— studies —'));
    const g1 = document.createElement('optgroup'); g1.label = 'PINE (the station)';
    for (const s of state.catalog) g1.appendChild(opt('pine:' + s.id, s.name));
    sel.appendChild(g1);
    if (state.native.length) {
      const g2 = document.createElement('optgroup'); g2.label = 'NATIVE (Vela, no engine)';
      for (const n of state.native) g2.appendChild(opt('native:' + n.type, `${n.title}${n.present ? ' ✓' : ''}`));
      sel.appendChild(g2);
    }
  } catch (e) {
    state.catalog = [];
    el('study-select').innerHTML = '<option value="">PINE_STATION_DOWN</option>';
  }
  paintStation();
}

async function loadNativeCatalog() {
  try {
    const list = await chart.availableNativeIndicators();
    state.native = (list || []).map((n) => ({ type: n.type, title: n.title, present: !!n.present, supported: n.supported !== false, multi: !!n.multiInstance }));
  } catch (e) { state.native = []; }
}

/** The chart's OWN bars, in the station's accepted candle shape.
 *  THE SAME BARS LAW: the study computes on exactly the bars being displayed —
 *  never a re-fetch that could differ (a different cell, a newer file). */
function barsForStation() {
  return state.bars.map((b) => ({ time: b.time, open: b.open, high: b.high, low: b.low, close: b.close, volume: b.volume || 0 }));
}

/** Run a source through the station and paint the result. THE one study entry point. */
async function runStudySource(source, { id = null, title = null, overlay = false } = {}) {
  if (!source || !String(source).trim()) { fail('PINE_SCRIPT_ABSENT', 'the source box is empty'); return { ok: false }; }
  state.study = Object.assign({}, state.study, { id, source, title: title || id || 'ad-hoc', status: 'RUNNING', error: null });
  paintStation();
  try {
    const res = await fetch(`${PINE_API}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        script: source,
        bars: barsForStation(),
        pair: PAIR_CELL[state.pair] || state.pair,
        timeframe: state.timeframe,
        symbol: state.symbol || SYMBOL_OF[state.pair] || state.pair,
      }),
      signal: AbortSignal.timeout(60000),
    });
    const json = await res.json();
    if (!json.success) {
      state.study.status = json.code || 'PINE_FAILED';
      state.study.error = json.error;
      state.study.line = json.line ?? null;
      fail(json.code || 'PINE_FAILED', json.error + (json.line ? `  (line ${json.line}${json.column ? ':' + json.column : ''})` : ''));
      paintStation();
      return { ok: false, code: json.code };
    }
    const run = json.data;
    const drawn = paintRun(run);
    state.study.run = run;
    state.study.status = 'COMPILED';
    state.study.ms = run.runMs;
    state.study.counts = run.counts;
    state.study.drawn = drawn;
    state.study.title = run.title;
    state.study.kind = run.kind;
    state.study.capped = LAYER.capped;
    state.study.drawErrors = LAYER.errors.slice(0, 6);
    state.study.canon = run.canon || null;
    state.study.sourceSha = run.sourceSha;
    el('error').style.display = 'none';
    paintStation();
    paintReadout();
    return { ok: true, run, drawn };
  } catch (e) {
    const down = /fetch|timeout|Failed to fetch|abort/i.test(e.message);
    state.study.status = down ? 'PINE_STATION_DOWN' : 'PINE_FAILED';
    state.study.error = e.message;
    fail(down ? 'PINE_STATION_DOWN' : 'PINE_FAILED', e.message);
    paintStation();
    return { ok: false, code: state.study.status };
  }
}

/** The canon lane (CANON IS LAW — SHELL_ANCHOR §16): run the file by path+sha. */
async function runCanon() {
  state.study = Object.assign({}, state.study, { id: 'canon', title: 'canon (trident v8)', status: 'RUNNING', error: null });
  paintStation();
  try {
    const res = await fetch(`${PINE_API}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canon: true, bars: barsForStation(), pair: PAIR_CELL[state.pair] || state.pair, timeframe: state.timeframe, symbol: state.symbol || 'TVC:DXY' }),
      signal: AbortSignal.timeout(120000),
    });
    const json = await res.json();
    if (!json.success) {
      state.study.status = json.code || 'CANON_FAILED';
      state.study.error = json.error;
      fail(json.code || 'CANON_FAILED', json.error);
      paintStation();
      return { ok: false, code: json.code };
    }
    const run = json.data;
    const drawn = paintRun(run);
    state.study.run = run;
    state.study.status = 'COMPILED';
    state.study.ms = run.runMs;
    state.study.counts = run.counts;
    state.study.drawn = drawn;
    state.study.title = run.title;
    state.study.kind = run.kind;
    state.study.capped = LAYER.capped;
    state.study.drawErrors = LAYER.errors.slice(0, 6);
    state.study.canon = run.canon || { sha256: run.canonSha, path: run.canonPath };
    state.study.sourceSha = run.sourceSha;
    el('error').style.display = 'none';
    paintStation();
    paintReadout();
    return { ok: true, run, drawn };
  } catch (e) {
    state.study.status = 'PINE_STATION_DOWN';
    state.study.error = e.message;
    fail('PINE_STATION_DOWN', e.message);
    paintStation();
    return { ok: false, code: 'PINE_STATION_DOWN' };
  }
}

/** Re-run whatever the chart is currently showing (the toggle's SELF refresh). */
function rerunActive() {
  const s = state.study;
  if (s.id === 'canon') return runCanon();
  if (s.source) return runStudySource(s.source, { id: s.id, title: s.title });
  return { ok: false, code: 'NO_ACTIVE_STUDY' };
}

async function applyStudy(id) {
  if (!id) return;
  if (id.startsWith('native:')) {
    const type = id.slice(7);
    try { chart.addNativeIndicator(type); } catch (e) { fail('NATIVE_INDICATOR_FAILED', `${type}: ${e.message}`); }
    state.study = Object.assign({}, state.study, { id, title: type, status: 'NATIVE', error: null });
    paintStation();
    return;
  }
  if (id === 'canon') { return runCanon(); }
  if (id.startsWith('pine:')) {
    const sid = id.slice(5);
    const s = state.catalog.find((c) => c.id === sid);
    if (!s) { fail('PINE_STUDY_ABSENT', `no catalog entry ${sid}`); return; }
    el('pine-source').value = s.script;
    return runStudySource(s.script, { id, title: s.name });
  }
}

/* ─────────────────────────────── the BROKER RAIL ─────────────────────────────── */

async function brokerSnapshot() {
  try {
    const res = await fetch(`${BROKER_API}/snapshot`, { signal: AbortSignal.timeout(5000) });
    const json = await res.json();
    if (!json.success) {
      state.broker = { status: json.code || 'BROKER_NOT_CONFIGURED', account: null, positions: null, error: json.error || null };
    } else {
      state.broker = { status: 'CONNECTED', account: json.data, positions: null, error: null };
    }
  } catch (e) {
    state.broker = { status: 'BROKER_RAIL_DOWN', account: null, positions: null, error: e.message };
  }
  try {
    const p = await fetch(`${BROKER_API}/positions`, { signal: AbortSignal.timeout(5000) });
    const pj = await p.json();
    if (pj.success) state.broker.positions = pj.data;
  } catch (e) { /* positions are optional */ }
  paintBroker();
}

/* ─────────────────────────────── readouts ─────────────────────────────── */

function paintReadout() {
  const b = state.bars[state.bars.length - 1];
  if (b) {
    el('q-o').textContent = b.open;
    el('q-h').textContent = b.high;
    el('q-l').textContent = b.low;
    el('q-c').textContent = b.close;
  }
  el('q-n').textContent = `${state.bars.length} bars`;
  const prov = state.meta?.provenance || {};
  const src = prov.source ? String(prov.source).split('(')[0].trim() : (state.meta?.source ? String(state.meta.source).split('/').pop() : '—');
  el('f-src').textContent = `bars ${src} · ${PAIR_CELL[state.pair]} ${state.timeframe}`;
  const r = state.anchorMs ? windowForWeek() : null;
  el('f-win').textContent = r
    ? `window ${new Date(r.from).toISOString().slice(0, 16)}Z → ${new Date(r.to).toISOString().slice(0, 16)}Z`
    : 'window —';
  el('f-engine').textContent = `vela ${el('f-engine').dataset.v || '0.8.0'} · ${API.get('backend') || 'canvas2d'}`;
  el('f-draws').textContent = `drawings ${state.drawings.length + LAYER.ids.length}`;
}

function paintStation() {
  const s = state.study;
  const st = state.station;
  const bits = [];
  if (!st.up) bits.push(`<span class="bad">PINE_STATION_DOWN</span>`);
  else bits.push(`<span class="ok">station ok</span>`);
  if (st.canon && st.canon.present) bits.push(`canon ${esc(String(st.canon.sha256).slice(0, 8))} · ${st.canon.lines}L ${esc(st.canon.version)}`);
  bits.push(`study <b>${esc(s.title || '—')}</b>`);
  bits.push(`<span class="${s.status === 'COMPILED' || s.status === 'NATIVE' ? 'ok' : s.status === 'RUNNING' ? 'warn' : 'bad'}">${esc(s.status)}</span>`);
  if (s.ms != null) bits.push(`${s.ms}ms`);
  if (s.counts) {
    const c = s.counts;
    bits.push(`plots ${c.plots} · boxes ${c.boxes} · labels ${c.labels} · lines ${c.lines} · trades ${c.trades}`);
  }
  if (s.capped) bits.push(`<span class="warn">capped ${esc(s.capped)}</span>`);
  if (s.error) bits.push(`<span class="bad">${esc(s.error).slice(0, 90)}</span>`);
  el('station-line').innerHTML = bits.join(' · ');
  el('study-counts').innerHTML = s.counts
    ? Object.entries(s.counts).filter(([, v]) => v).map(([k, v]) => `<span class="kpi-chip">${esc(k)} <b>${v}</b></span>`).join('')
    : '<span class="kpi-chip">no run yet</span>';
  if (s.drawErrors && s.drawErrors.length) {
    el('study-counts').innerHTML += `<span class="kpi-chip bad">draw errors: ${esc(s.drawErrors.join(' | ')).slice(0, 120)}</span>`;
  }
  const legend = el('legend');
  if (legend) {
    const rows = [];
    if (s.run) {
      for (const p of (s.run.plots || []).slice(0, 8)) {
        rows.push(`<div class="lg-row"><i style="background:${esc(cssColor(p.color, DEFAULT_LINE))}"></i><span>${esc(p.title)}</span><em>${(p.values || []).length}</em></div>`);
      }
      for (const m of (s.run.markers || []).slice(0, 4)) {
        rows.push(`<div class="lg-row"><i style="background:#7E9C82"></i><span>${esc(m.title)}</span><em>${(m.points || []).length}</em></div>`);
      }
      if ((s.run.trades || []).length) rows.push(`<div class="lg-row"><i style="background:#B99A5B"></i><span>fills</span><em>${s.run.trades.length}</em></div>`);
    }
    legend.innerHTML = rows.join('') || '<div class="lg-empty">no study drawn</div>';
  }
}

function paintBroker() {
  const b = state.broker;
  const strip = el('broker-strip');
  const rail = el('broker-panel');
  const token = b.status;
  const okState = token === 'CONNECTED';
  const cls = okState ? 'ok' : token === 'BROKER_NOT_CONFIGURED' ? 'warn' : 'bad';
  let head = `<span class="${cls}">${esc(token)}</span>`;
  if (okState && b.account) {
    const eq = b.account.equity ?? b.account.balance ?? b.account.cash;
    const cur = b.account.currency || '';
    head += ` · equity <b>${eq != null ? Number(eq).toLocaleString() : '—'}</b> ${esc(cur)}`;
    if (b.account.cash != null) head += ` · cash <b>${Number(b.account.cash).toLocaleString()}</b>`;
  }
  if (b.positions && Array.isArray(b.positions) && b.positions.length) head += ` · ${b.positions.length} open`;
  if (b.error && !okState) {
    // The NAMED code is the token the operator needs; a raw "Failed to fetch"
    // adds nothing when the rail is simply not running.
    const short = /fetch|timeout|abort|ECONNREFUSED/i.test(String(b.error)) ? 'not running' : String(b.error).slice(0, 70);
    head += ` · ${esc(short)}`;
  }
  strip.innerHTML = head;

  if (rail) {
    const rows = [];
    rows.push(`<div class="rail-k">STATE</div><div class="rail-v ${cls}">${esc(token)}</div>`);
    if (okState && b.account) {
      for (const [k, v] of Object.entries(b.account)) {
        if (v == null || typeof v === 'object') continue;
        rows.push(`<div class="rail-k">${esc(k.toUpperCase())}</div><div class="rail-v">${esc(typeof v === 'number' ? Number(v).toLocaleString() : v)}</div>`);
      }
    } else {
      rows.push('<div class="rail-note">the rail answers BROKER_NOT_CONFIGURED until a broker is connected from ~/.plutus-dashboard/brokers.&lt;id&gt;.env — keys are never inlined, never logged.</div>');
    }
    if (b.positions && Array.isArray(b.positions) && b.positions.length) {
      rows.push(`<div class="rail-k">POSITIONS</div><div class="rail-v">${b.positions.length}</div>`);
    }
    rail.innerHTML = rows.join('');
  }
}

/* ─────────────────────── T4 · THE FURNITURE (spectrum blocks, old money) ─────────────────────── */

const fmt = (n, d = 5) => (Number.isFinite(n) ? Number(n).toFixed(d) : '—');

/** SVG close-line with an area wash — the spectrum "Market Chart" block, old-money palette. */
function svgMarket(bars, w, h) {
  if (!bars.length) return '';
  const closes = bars.map((b) => b.close);
  const min = Math.min(...closes), max = Math.max(...closes);
  const span = max - min || 1;
  const x = (i) => (i / (closes.length - 1)) * w;
  const y = (v) => h - ((v - min) / span) * (h - 6) - 3;
  const line = closes.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(' ');
  const area = `${line} L${w},${h} L0,${h} Z`;
  const up = closes[closes.length - 1] >= closes[0];
  const stroke = up ? '#7E9C82' : '#9C6B6B';
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" class="fx-svg">
    <path d="${area}" fill="${up ? 'rgba(126,156,130,0.10)' : 'rgba(156,107,107,0.10)'}"></path>
    <path d="${line}" fill="none" stroke="${stroke}" stroke-width="1.2" vector-effect="non-scaling-stroke"></path>
    <line x1="0" y1="${y(max).toFixed(2)}" x2="${w}" y2="${y(max).toFixed(2)}" stroke="rgba(255,255,255,0.06)"></line>
    <line x1="0" y1="${y(min).toFixed(2)}" x2="${w}" y2="${y(min).toFixed(2)}" stroke="rgba(255,255,255,0.06)"></line>
  </svg>`;
}

function rsi14(closes) {
  const out = new Array(closes.length).fill(null);
  let gain = 0, loss = 0;
  for (let i = 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    const g = Math.max(0, d), l = Math.max(0, -d);
    if (i <= 14) { gain += g; loss += l; if (i === 14) { gain /= 14; loss /= 14; out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss); } continue; }
    gain = (gain * 13 + g) / 14; loss = (loss * 13 + l) / 14;
    out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  }
  return out;
}

function ema(vals, n) {
  const k = 2 / (n + 1);
  const out = new Array(vals.length).fill(null);
  let prev = null;
  for (let i = 0; i < vals.length; i++) {
    prev = prev === null ? vals[i] : vals[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

function macdOf(closes) {
  const f = ema(closes, 12), s = ema(closes, 26);
  const line = closes.map((_, i) => (f[i] != null && s[i] != null ? f[i] - s[i] : null));
  const sig = ema(line.map((v) => v ?? 0), 9);
  return { line, signal: sig, hist: line.map((v, i) => (v == null ? null : v - sig[i])) };
}

/** The spectrum "Indicator Chart" stack: price, RSI and MACD on one time axis. */
function svgIndicatorStack(bars, w, h) {
  if (bars.length < 30) return '';
  const closes = bars.map((b) => b.close);
  const n = closes.length;
  const rsi = rsi14(closes);
  const { line, signal, hist } = macdOf(closes);
  const x = (i) => (i / (n - 1)) * w;
  const band = (top, height, values, min, max, color) => {
    const span = max - min || 1;
    const y = (v) => top + height - ((v - min) / span) * (height - 4) - 2;
    const pts = values.map((v, i) => (v == null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`)).filter(Boolean);
    if (pts.length < 2) return '';
    return `<polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="1.1" vector-effect="non-scaling-stroke"></polyline>`;
  };
  const b1 = h * 0.42, b2 = h * 0.30, b3 = h * 0.28;
  const rsiVals = rsi.filter((v) => v != null);
  const macdVals = line.filter((v) => v != null).concat(signal.filter((v) => v != null));
  const macdMin = Math.min(0, ...macdVals), macdMax = Math.max(0, ...macdVals);
  const zeroY = b2 + b3 - ((0 - macdMin) / ((macdMax - macdMin) || 1)) * (b3 - 4) - 2;
  const histBars = hist.map((v, i) => {
    if (v == null) return '';
    const y0 = zeroY;
    const y1 = b2 + b3 - ((v - macdMin) / ((macdMax - macdMin) || 1)) * (b3 - 4) - 2;
    const bw = Math.max(1, w / n - 0.6);
    return `<rect x="${(x(i) - bw / 2).toFixed(1)}" y="${Math.min(y0, y1).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.abs(y1 - y0).toFixed(1)}" fill="${v >= 0 ? 'rgba(126,156,130,0.55)' : 'rgba(156,107,107,0.55)'}"></rect>`;
  }).join('');
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" class="fx-svg">
    ${band(0, b1, closes, Math.min(...closes), Math.max(...closes), '#E8E4DC')}
    <line x1="0" y1="${b1 + 1}" x2="${w}" y2="${b1 + 1}" stroke="rgba(255,255,255,0.08)"></line>
    ${band(b2 * 0 + b1 + 2, b2, rsi, 0, 100, '#B99A5B')}
    <line x1="0" y1="${b1 + 2 + b2 * 0.3}" x2="${w}" y2="${b1 + 2 + b2 * 0.3}" stroke="rgba(255,255,255,0.05)"></line>
    <line x1="0" y1="${b1 + 2 + b2 * 0.7}" x2="${w}" y2="${b1 + 2 + b2 * 0.7}" stroke="rgba(255,255,255,0.05)"></line>
    ${histBars}
    <line x1="0" y1="${zeroY.toFixed(1)}" x2="${w}" y2="${zeroY.toFixed(1)}" stroke="rgba(255,255,255,0.10)"></line>
    ${band(b2 + b3, 0, line, macdMin, macdMax, '#6E7E8F')}
  </svg>`;
}

/** The spectrum "Order Book" ladder — fed ONLY by the broker rail; else a NAMED state. */
function ladderHtml(broker) {
  const pos = broker.positions;
  if (broker.status !== 'CONNECTED') {
    return `<div class="rail-note">${esc(broker.status)} — the ladder needs a connected broker (read-only).</div>`;
  }
  if (Array.isArray(pos) && pos.length) {
    const rows = pos.slice(0, 8).map((p) => {
      const side = String(p.side || p.direction || '').toLowerCase();
      const cls = /sell|short/.test(side) ? 'bad' : 'ok';
      return `<div class="lad-row"><span class="${cls}">${esc(p.side || p.direction || '—')}</span><span>${esc(p.symbol || p.pair || '')}</span><span>${esc(p.volume ?? p.qty ?? '')}</span><span>${esc(p.pnl ?? p.profit ?? '')}</span></div>`;
    }).join('');
    return `<div class="lad-head"><span>SIDE</span><span>SYMBOL</span><span>SIZE</span><span>P&L</span></div>${rows}`;
  }
  return '<div class="rail-note">connected · no open positions</div>';
}

function paintFurniture() {
  const bars = state.bars;
  if (!bars.length) return;
  const last = bars[bars.length - 1];
  const week = state.anchorMs ? bars.filter((b) => b.time >= windowForWeek().from && b.time <= windowForWeek().to) : bars;
  const first = week[0] || bars[0];
  const hi = Math.max(...week.map((b) => b.high));
  const lo = Math.min(...week.map((b) => b.low));
  const delta = last.close - first.open;
  const pct = first.open ? (delta / first.open) * 100 : 0;
  const tr = week.slice(1).reduce((a, b, i) => a + Math.max(b.high - b.low, Math.abs(b.high - week[i].close), Math.abs(b.low - week[i].close)), 0) / Math.max(1, week.length - 1);

  el('kpi').innerHTML = [
    ['LAST', fmt(last.close, 5), delta >= 0 ? 'ok' : 'bad'],
    ['Δ WEEK', `${delta >= 0 ? '+' : ''}${fmt(delta, 5)}`, delta >= 0 ? 'ok' : 'bad'],
    ['Δ %', `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`, pct >= 0 ? 'ok' : 'bad'],
    ['WEEK H/L', `${fmt(hi, 5)} / ${fmt(lo, 5)}`, ''],
    ['ATR(week)', fmt(tr, 5), ''],
    ['BARS', `${bars.length}`, ''],
  ].map(([k, v, c]) => `<div class="kpi-card"><div class="kpi-k">${k}</div><div class="kpi-v ${c}">${v}</div></div>`).join('');

  el('fx-market').innerHTML = svgMarket(week.length > 2 ? week : bars, 320, 90);
  el('fx-stack').innerHTML = svgIndicatorStack(week.length > 30 ? week : bars, 320, 150);
  const closes = bars.map((b) => b.close);
  const rsi = rsi14(closes).filter((v) => v != null);
  const { line, signal } = macdOf(closes);
  el('fx-readout').innerHTML = `<span>RSI <b>${rsi.length ? rsi[rsi.length - 1].toFixed(1) : '—'}</b></span>
    <span>MACD <b>${line.filter((v) => v != null).length ? line[line.length - 1].toFixed(5) : '—'}</b></span>
    <span>SIGNAL <b>${signal.filter((v) => v != null).length ? signal[signal.length - 1].toFixed(5) : '—'}</b></span>`;
  el('ladder').innerHTML = ladderHtml(state.broker);
}

/* ─────────────────────────────── controls ─────────────────────────────── */

function bind() {
  el('pair').addEventListener('change', (e) => window.PlutusChart.setPair(e.target.value));
  el('tf').addEventListener('change', (e) => window.PlutusChart.setTimeframe(e.target.value));
  el('frame-week').addEventListener('click', () => window.PlutusChart.frameWeek());
  el('ct-trend').addEventListener('click', () => { chart.drawings.setTool('trendline'); el('ct-trend').dataset.on = '1'; });
  el('ct-box').addEventListener('click', () => { chart.drawings.setTool('box'); el('ct-box').dataset.on = '1'; });
  el('ct-clear').addEventListener('click', () => window.PlutusChart.clearDrawings());

  el('sym-go').addEventListener('click', () => {
    const v = el('sym-free').value.trim();
    if (v) window.PlutusChart.setFreeSymbol(v);
  });
  el('sym-free').addEventListener('keydown', (e) => { if (e.key === 'Enter') el('sym-go').click(); });

  el('study-select').addEventListener('change', (e) => { if (e.target.value) applyStudy(e.target.value); });
  el('pine-run').addEventListener('click', () => runStudySource(el('pine-source').value, { id: 'ad-hoc', title: 'ad-hoc' }));
  el('pine-canon').addEventListener('click', () => runCanon());
  el('pine-toggle').addEventListener('click', () => {
    const box = el('pine-box');
    const open = box.dataset.open === '1';
    box.dataset.open = open ? '0' : '1';
    box.style.display = open ? 'none' : 'flex';
    el('pine-toggle').dataset.on = open ? '0' : '1';
  });

  chart.on('drawing:tool', () => {
    el('ct-trend').dataset.on = chart.drawings.getTool() === 'trendline' ? '1' : '0';
    el('ct-box').dataset.on = chart.drawings.getTool() === 'box' ? '1' : '0';
  });
  chart.on('drawing:added', () => paintReadout());
  chart.on('drawing:removed', () => paintReadout());
}

/* ─────────────────────────────── the page API ─────────────────────────────── */

window.PlutusChart = {
  version: 'w-s1',
  setPair(pair) {
    state.pair = String(pair || '').toUpperCase();
    el('pair').value = state.pair;
    return applyMarket({ frameWeek: true }).then(() => rerunActive());
  },
  setTimeframe(tf) {
    state.timeframe = String(tf || '1H');
    el('tf').value = state.timeframe;
    return applyMarket({ frameWeek: true }).then(() => rerunActive());
  },
  /** A free-text symbol (TVC:DXY / OANDA:EURUSD / FX:GBPUSD / DXY). */
  setFreeSymbol(sym) {
    const s = String(sym || '').trim().toUpperCase();
    if (!s) return Promise.resolve(false);
    const pair = PAIR_OF_SYMBOL[s] || (s.includes(':') ? s.split(':').pop().replace(/^(.{3})(.{3})$/, '$1/$2') : s);
    state.symbol = s;
    state.pair = pair.replace('/', '');
    const sel = el('pair');
    if (![...sel.options].some((o) => o.value === state.pair)) {
      const o = document.createElement('option');
      o.value = state.pair; o.textContent = state.pair;
      sel.appendChild(o);
    }
    sel.value = state.pair;
    return applyMarket({ frameWeek: true }).then(() => rerunActive());
  },
  runStudySource(source, opts) { return runStudySource(source, opts || {}); },
  runCanon() { return runCanon(); },
  rerunActive() { return rerunActive(); },
  applyStudy(id) { return applyStudy(id); },
  catalog() { return state.catalog; },
  broker() { return state.broker; },
  brokerSnapshot() { return brokerSnapshot(); },
  frameWeek() { state.weekFramed = true; if (state.anchorMs) chart.setVisibleRange(windowForWeek()); return true; },
  drawBox(a, b, style) {
    return addDrawing('box', {
      anchors: [{ time: a.time, price: a.price }, { time: b.time, price: b.price }],
      style: Object.assign({ lineColor: '#B99A5B', lineWidth: 1, lineStyle: 'solid', fillColor: 'rgba(185,154,91,0.10)' }, style || {}),
      props: { extend: 'none' },
    });
  },
  drawLine(a, b, style) {
    return addDrawing('trendline', {
      anchors: [{ time: a.time, price: a.price }, { time: b.time, price: b.price }],
      style: Object.assign({ lineColor: '#B99A5B', lineWidth: 1, lineStyle: 'solid' }, style || {}),
    });
  },
  drawHLine(price, style) {
    return addDrawing('hline', {
      anchors: [{ time: state.anchorMs || Date.now(), price }],
      style: Object.assign({ lineColor: 'rgba(232,228,220,0.45)', lineWidth: 1, lineStyle: 'dashed' }, style || {}),
    });
  },
  drawLabel(at, text, style) {
    return addDrawing('pricelabel', {
      anchors: [{ time: at.time, price: at.price }],
      text: { content: String(text) },
      style: Object.assign({ lineColor: '#B99A5B', lineWidth: 1, lineStyle: 'solid', fillColor: 'rgba(185,154,91,0.14)' }, style || {}),
    });
  },
  drawMarker(at, glyph) {
    return addDrawing('iconstamp', {
      anchors: [{ time: at.time, price: at.price }],
      props: { glyph: glyph || 'circle' },
      style: { lineColor: '#B99A5B', lineWidth: 2, lineStyle: 'solid' },
    });
  },
  clearDrawings() {
    for (const d of state.drawings.slice()) { try { chart.drawings.remove(d.id); } catch (e) { /* gone */ } }
    state.drawings = [];
    clearStudyLayer();
    state.study = Object.assign({}, state.study, { run: null, counts: null, status: 'IDLE' });
    paintReadout(); paintStation();
    return { ok: true, cleared: true };
  },
  /** THE CHART TAB's contract: which backend is this page, and is it alive. */
  state() {
    const range = chart.getVisibleRange();
    const scene = (() => { try { return chart.inspect(); } catch (e) { return null; } })();
    const drawn = (() => { try { return chart.drawings.toJSON(); } catch (e) { return null; } })();
    return {
      ready: state.ready,
      backend: 'self',
      pair: state.pair,
      cell: PAIR_CELL[state.pair] || state.pair,
      symbol: state.symbol,
      timeframe: state.timeframe,
      bars: state.bars.length,
      firstBar: state.bars[0] ? state.bars[0].time : null,
      lastBar: state.bars[state.bars.length - 1] ? state.bars[state.bars.length - 1].time : null,
      anchorMs: state.anchorMs,
      visibleRange: range,
      drawings: Array.isArray(drawn?.drawings) ? drawn.drawings.length : state.drawings.length + LAYER.ids.length,
      sceneSeries: Array.isArray(scene?.series) ? scene.series.length : (scene ? Object.keys(scene).length : 0),
      study: {
        id: state.study.id,
        title: state.study.title,
        status: state.study.status,
        ms: state.study.ms,
        counts: state.study.counts,
        drawn: state.study.drawn,
        canon: state.study.canon,
        sourceSha: state.study.sourceSha,
        capped: state.study.capped,
        error: state.study.error,
      },
      station: state.station.up
        ? { up: true, engine: state.station.engine, pid: state.station.pid, canon: state.station.canon }
        : { up: false, code: 'PINE_STATION_DOWN', error: state.station.error },
      broker: { status: state.broker.status, account: state.broker.account },
      native: state.native.length,
      error: state.error,
      url: location.href,
      title: document.title,
    };
  },
  backend: 'self',
};

/* ─────────────────────────────── boot ─────────────────────────────── */

function addDrawing(type, init) {
  try {
    const d = chart.drawings.add(type, init);
    if (d) state.drawings.push({ id: d.id, type, init });
    paintReadout();
    return d ? { ok: true, id: d.id, type } : { ok: false, code: 'DRAWING_UNSUPPORTED', type };
  } catch (e) {
    return { ok: false, code: 'DRAWING_FAILED', error: e.message, type };
  }
}

/* ─────────────────────── D2 · THE CANVAS FILLS ITS SURFACE ───────────────────────
   Measured (2026-09-29, X-level capture of the TRADE tab): the surface window on
   the agent display is 1080x734 while the candle canvas occupied ~760px and the
   right ~320px was BLACK. Vela sizes itself at construction and does NOT track its
   container — so when the compositor is reparented/resized (embed, tab switch, the
   agent chat collapsing) the canvas kept its first-paint width. A ResizeObserver
   on the chart container re-fits it on EVERY geometry change, and re-applies the
   week frame so the new width shows the same window. */
function watchChartResize() {
  if (typeof ResizeObserver !== 'function') return;
  let timer = null;
  let lastW = 0;
  let lastH = 0;
  const ro = new ResizeObserver(function () {
    const box = el('chart');
    if (!box) return;
    const r = box.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return;
    if (Math.abs(r.width - lastW) < 2 && Math.abs(r.height - lastH) < 2) return;
    lastW = r.width; lastH = r.height;
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () {
      try { chart.resize(); } catch (e) { /* a renderer without resize is not fatal */ }
      if (state.anchorMs) { try { chart.setVisibleRange(windowForWeek()); } catch (e) { /* keep the range */ } }
      paintReadout();
    }, 120);
  });
  const box = el('chart');
  if (box) ro.observe(box);
}

bind();
watchChartResize();
el('pair').value = state.pair;
el('tf').value = state.timeframe;

await applyMarket({ frameWeek: true });
await loadNativeCatalog();
await stationHealth();
await stationCatalog();
await brokerSnapshot();
setInterval(stationHealth, 15000);
setInterval(brokerSnapshot, 15000);

// The default study: the station's first catalog entry (the EMA ribbon) — so a
// freshly opened terminal is never an empty canvas.
if (state.catalog.length) {
  const first = state.catalog[0];
  el('pine-source').value = first.script;
  const sel = el('study-select');
  if ([...sel.options].some((o) => o.value === 'pine:' + first.id)) sel.value = 'pine:' + first.id;
  await runStudySource(first.script, { id: 'pine:' + first.id, title: first.name });
}

window.__plutusChartReady = true;
