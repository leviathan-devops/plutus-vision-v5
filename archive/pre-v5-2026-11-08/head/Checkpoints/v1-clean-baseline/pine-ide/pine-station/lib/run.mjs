/**
 * run.mjs — THE PINE RUNNER. PineTS transpile + execute, normalized to JSON.
 *
 * AGPL ISOLATION (SHELL_ANCHOR §2): `pinets` is AGPL-3.0. It is imported HERE,
 * inside the station process, and NOWHERE ELSE. The dashboard bundle never sees
 * it — the chart receives the output of this module as plain JSON over
 * 127.0.0.1:9741.
 *
 * The output shape was derived from the RUNNING engine (probe.mjs/probe2.mjs/
 * probe4.mjs against the golden fixture), not from the type files:
 *
 *   ctx.plots[title]        = { data: [{ title, time, value, options? }], options? }
 *   ctx.plots.__labels__    = { data: [{ time, value: [ {x: barIndex, y, text, …} ] }] }
 *   ctx.plots.__lines__     = { data: [{ time, value: [ {x1,y1,x2,y2, …} ] }] }
 *   ctx.strategy.closedtrades[i] = { id, entry_id, entry_price, entry_bar_index,
 *                                    entry_time, size, exit_price, exit_bar_index,
 *                                    exit_time, exit_id, profit, status }
 *   ctx.strategy.{equity,netprofit,wintrades,losstrades,max_drawdown,initial_capital}
 *
 * BAR-INDEX → TIME: Pine labels/lines/boxes anchor on `bar_index` (xloc 'bi').
 * The chart draws in epoch-ms, so every bar-index anchor is converted here,
 * where the bar array is in hand. An index outside the array is dropped and
 * counted (`droppedAnchors`) — never silently drawn at 0.
 *
 * LOUD FAILURE: a script that does not compile, or that throws at runtime,
 * returns { success:false, code, error, line, column }. Never an empty success.
 */

import { PineTS } from 'pinets';
import { makeProvider } from './bars.mjs';
import { sourceSha } from './canon.mjs';

export const ENGINE = { name: 'pinets', version: '0.10.0' };

/** '15m' | '1H' | '1D' → the interval key PineTS/provider vocabulary expects. */
export function toInterval(tf) {
  const s = String(tf || '1h').trim();
  const m = s.match(/^(\d+)\s*([mMhHdDwW])/);
  if (!m) return s.toLowerCase();
  const unit = { m: 'm', h: 'h', d: 'd', w: 'w' }[m[2].toLowerCase()] || 'h';
  return `${m[1]}${unit}`;
}

/** Pull the script's declaration: title / overlay / kind. Defensive by design. */
function parseDeclaration(src) {
  const call = src.match(/\b(indicator|strategy)\s*\(([^)]*)\)/i);
  const title = call ? (call[2].match(/["']([^"']*)["']/) || [, ''])[1] : '';
  const overlay = call ? /\boverlay\s*=\s*true\b/i.test(call[2]) : false;
  return { kind: call ? call[1].toLowerCase() : 'unknown', title, overlay: !!overlay };
}

/** Transpile errors carry "at L:C" inside the message. Extract it, never invent it. */
function parsePosition(message) {
  const m = String(message || '').match(/\bat\s+(\d+):(\d+)\b/);
  return m ? { line: Number(m[1]), column: Number(m[2]) } : { line: null, column: null };
}

const isFiniteNum = (v) => typeof v === 'number' && Number.isFinite(v);

/** One plot channel → line | markers | passthrough. */
function classifyPlot(title, entry) {
  const data = Array.isArray(entry?.data) ? entry.data : [];
  const opt0 = (data.find((d) => d && d.options) || {}).options || entry?.options || {};
  const boolish = data.some((d) => typeof d.value === 'boolean');
  const shaped = opt0.shape !== undefined || opt0.char !== undefined || opt0.location !== undefined
    || opt0.style !== undefined;
  const numeric = data.some((d) => isFiniteNum(d.value));

  if (boolish || (shaped && !numeric)) {
    return {
      kind: 'markers',
      points: data.filter((d) => d.value === true || d.value === 1)
        .map((d) => ({
          time: d.time,
          shape: opt0.shape || undefined,
          char: opt0.char || undefined,
          location: opt0.location || undefined,
          color: opt0.color || undefined,
          text: opt0.text || d.title || title,
        })),
    };
  }
  if (numeric || shaped) {
    return {
      kind: 'line',
      color: opt0.color || undefined,
      width: opt0.linewidth || opt0.width || undefined,
      values: data.filter((d) => d.value === null || d.value === undefined || typeof d.value === 'number')
        .map((d) => ({ time: d.time, value: isFiniteNum(d.value) ? d.value : null })),
    };
  }
  return { kind: 'other', count: data.length };
}

/**
 * A Pine drawing's x → epoch-ms.
 *
 * TWO ANCHOR SPACES, and confusing them silently loses the drawing:
 *   xloc = 'bt' / 'bar_time'   → `x` IS epoch-ms (Pine's `xloc.bar_time`).
 *   xloc = 'bi' / 'bar_index'  → `x` is a bar index into the loaded bars.
 *
 * MEASURED (PineShell's probe against this station, 2026-09-29): the CANON v8
 * anchors every box/line/label with `xloc.bar_time` (canon Part X C-WIN-2
 * forbids bar_index). A bar-index lookup on a bar_time anchor drops every
 * drawing (`droppedAnchors: 50, boxes: 0`) — i.e. the canon does not render.
 * So the two spaces are gated on xloc, never assumed.
 */
function anchorTime(bars, x, xloc) {
  const v = Number(x);
  if (!Number.isFinite(v)) return null;
  const loc = String(xloc ?? '').toLowerCase();
  if (loc === 'bt' || loc === 'bar_time' || loc === 'time') return v;
  if (loc === 'bi' || loc === 'bar_index' || loc === '') {
    const i = v;
    if (!Number.isInteger(i) || i < 0 || !bars.length) return null;
    if (i < bars.length) return bars[i].openTime;
    // Pine draws up to 500 bars into the FUTURE (`bar_index + 10` zones, extend-right
    // markers). TradingView places them at last bar + n·interval — extrapolate the same way
    // instead of dropping them (measured: 7 drawings of the merged bundle were lost here).
    const n = bars.length;
    if (n < 2 || i - (n - 1) > 500) return null;
    const step = bars[n - 1].openTime - bars[n - 2].openTime;
    return bars[n - 1].openTime + (i - (n - 1)) * step;
  }
  // An unknown xloc is a defect, not a guess: refuse it loudly via the counter.
  return null;
}

/** Pine drawings (__labels__ / __lines__ / __boxes__ / …) → time-anchored items. */
function normalizeDrawings(plots, bars) {
  const out = { labels: [], lines: [], boxes: [], other: {} };
  let dropped = 0;
  const seriesOf = (key) => (Array.isArray(plots[key]?.data) ? plots[key].data : []);

  for (const bucket of seriesOf('__labels__')) {
    for (const it of (bucket.value || [])) {
      if (it._deleted) continue;
      const time = anchorTime(bars, it.x, it.xloc);
      if (time === null) { dropped++; continue; }
      out.labels.push({ time, price: Number(it.y), text: it.text || '', yloc: it.yloc || 'pr', xloc: it.xloc || null, style: it.style || undefined, color: it.color || undefined, textColor: it.textcolor || undefined });
    }
  }
  for (const bucket of seriesOf('__lines__')) {
    for (const it of (bucket.value || [])) {
      if (it._deleted) continue;
      const t1 = anchorTime(bars, it.x1, it.xloc);
      const t2 = anchorTime(bars, it.x2, it.xloc);
      if (t1 === null || t2 === null) { dropped++; continue; }
      out.lines.push({ a: { time: t1, price: Number(it.y1) }, b: { time: t2, price: Number(it.y2) }, xloc: it.xloc || null, color: it.color || undefined, width: it.width || 1, style: it.style || undefined });
    }
  }
  for (const bucket of seriesOf('__boxes__')) {
    for (const it of (bucket.value || [])) {
      if (it._deleted) continue;
      const t1 = anchorTime(bars, it.left ?? it.x1 ?? it.x, it.xloc);
      const t2 = anchorTime(bars, it.right ?? it.x2 ?? it.x, it.xloc);
      if (t1 === null || t2 === null) { dropped++; continue; }
      out.boxes.push({ a: { time: t1, price: Number(it.top ?? it.y1) }, b: { time: t2, price: Number(it.bottom ?? it.y2) }, xloc: it.xloc || null, color: it.bgcolor || it.color || undefined, borderColor: it.border_color || undefined });
    }
  }
  for (const key of Object.keys(plots)) {
    if (!key.startsWith('__')) continue;
    if (['__labels__', '__lines__', '__boxes__', '__polylines__', '__linefills__', '__tables__'].includes(key)) {
      out.other[key] = (plots[key].data || []).filter((d) => Array.isArray(d.value)).reduce((n, d) => n + d.value.filter((v) => !v._deleted).length, 0);
      continue;
    }
    out.other[key] = Array.isArray(plots[key]?.data) ? plots[key].data.length : 0;
  }
  return { drawings: out, dropped };
}

/** The strategy ledger → on-chart markers + summary stats. */
function normalizeStrategy(strategy) {
  if (!strategy || typeof strategy !== 'object') return { trades: [], stats: null };
  const closed = Array.isArray(strategy.closedtrades) ? strategy.closedtrades : [];
  const open = Array.isArray(strategy.opentrades) ? strategy.opentrades : [];
  const sideOf = (t) => (Number(t.size ?? t.qty ?? 0) < 0 ? 'short' : 'long');
  const trades = [];
  for (const t of closed) {
    trades.push({
      id: String(t.id ?? ''),
      entryId: t.entry_id ?? null,
      side: sideOf(t),
      qty: Math.abs(Number(t.size ?? t.qty ?? 0)) || 1,
      entryTime: Number(t.entry_time ?? t.entryTime ?? 0) || null,
      entryPrice: Number(t.entry_price ?? 0),
      entryBar: t.entry_bar_index ?? null,
      exitTime: Number(t.exit_time ?? t.exitTime ?? 0) || null,
      exitPrice: Number.isFinite(Number(t.exit_price)) ? Number(t.exit_price) : null,
      exitBar: t.exit_bar_index ?? null,
      exitId: t.exit_id ?? null,
      profit: Number.isFinite(Number(t.profit)) ? Number(t.profit) : null,
      open: false,
    });
  }
  for (const t of open) {
    trades.push({
      id: String(t.id ?? ''),
      entryId: t.entry_id ?? null,
      side: sideOf(t),
      qty: Math.abs(Number(t.size ?? t.qty ?? 0)) || 1,
      entryTime: Number(t.entry_time ?? t.entryTime ?? 0) || null,
      entryPrice: Number(t.entry_price ?? 0),
      entryBar: t.entry_bar_index ?? null,
      exitTime: null, exitPrice: null, exitBar: null, exitId: null, profit: null,
      open: true,
    });
  }
  const stats = {
    initialCapital: Number(strategy.initial_capital ?? 0) || null,
    equity: Number.isFinite(Number(strategy.equity)) ? Number(strategy.equity) : null,
    netProfit: Number.isFinite(Number(strategy.netprofit)) ? Number(strategy.netprofit) : null,
    grossProfit: Number.isFinite(Number(strategy.grossprofit)) ? Number(strategy.grossprofit) : null,
    grossLoss: Number.isFinite(Number(strategy.grossloss)) ? Number(strategy.grossloss) : null,
    wins: strategy.wintrades ?? null,
    losses: strategy.losstrades ?? null,
    maxDrawdown: Number.isFinite(Number(strategy.max_drawdown)) ? Number(strategy.max_drawdown) : null,
    maxRunup: Number.isFinite(Number(strategy.max_runup)) ? Number(strategy.max_runup) : null,
    closed: closed.length,
    open: open.length,
  };
  return { trades, stats };
}

/**
 * Run one Pine script over one bar set.
 *
 * THE PROVIDER IS MANDATORY (measured): PineTS sets `context.pine.syminfo` only
 * from `provider.getSymbolInfo()`. A raw bar array leaves it undefined and any
 * `syminfo.*` read throws — the canon v8 reads `syminfo.ticker`. So bars are
 * always wrapped in a provider, and the tick facts are DERIVED from the feed.
 *
 * @param {{script:string, bars:Array, symbol?:string, timeframe?:string,
 *          maxPoints?:number, mintick?:number, pricescale?:number}} req
 * @returns {Promise<object>} the normalized run (throws with .code on failure)
 */
export async function runPine({ script, bars, symbol = 'EUR/USD', timeframe = '1h', maxPoints = 1500, mintick, pricescale }) {
  if (!script || typeof script !== 'string' || !script.trim()) {
    throw Object.assign(new Error('script is empty'), { code: 'PINE_SCRIPT_ABSENT', line: null, column: null });
  }
  if (!Array.isArray(bars) || bars.length < 2) {
    throw Object.assign(new Error(`bars absent (${Array.isArray(bars) ? bars.length : typeof bars})`), { code: 'PINE_BARS_ABSENT', line: null, column: null });
  }

  const interval = toInterval(timeframe);
  const provider = makeProvider({
    bars, symbol,
    mintick: Number.isFinite(mintick) ? mintick : 0.00001,
    pricescale: Number.isFinite(pricescale) ? pricescale : 100000,
  });
  const t0 = Date.now();
  let ctx;
  try {
    ctx = await new PineTS(provider, symbol, interval).run(script);
  } catch (e) {
    const pos = parsePosition(e.message);
    const compile = /transpile|Unexpected token|Parse error|no declaration/i.test(String(e.message))
      || /Failed to transpile/i.test(String(e.message));
    throw Object.assign(new Error(e.message), {
      code: compile ? 'PINE_COMPILE_ERROR' : 'PINE_RUNTIME_ERROR',
      line: pos.line,
      column: pos.column,
    });
  }
  const runMs = Date.now() - t0;

  const decl = parseDeclaration(script);
  const plots = (ctx && ctx.plots && typeof ctx.plots === 'object') ? ctx.plots : {};
  const idxByTime = new Map(bars.map((b, i) => [b.openTime, i]));
  const lines = [];
  const markers = [];
  const other = {};
  let plotPoints = 0;
  let trimmed = 0;

  for (const key of Object.keys(plots)) {
    if (key.startsWith('__')) continue;
    const c = classifyPlot(key, plots[key]);
    if (c.kind === 'line') {
      let values = c.values;
      if (values.length > maxPoints) { trimmed += values.length - maxPoints; values = values.slice(-maxPoints); }
      plotPoints += values.length;
      lines.push({ title: key, color: c.color, width: c.width, values });
    } else if (c.kind === 'markers') {
      // A plotshape/plotchar value is a BOOLEAN — the bar carries the price. Resolve
      // it here, where the bars are: belowbar → the bar's low, abovebar → its high,
      // anything else → the close. A point whose price cannot be resolved is dropped
      // and counted, never drawn at 0.
      const points = [];
      for (const p of c.points) {
        const i = idxByTime.get(p.time);
        if (i === undefined) continue;
        const loc = String(p.location || '').toLowerCase();
        const price = /below/.test(loc) ? bars[i].low : /above/.test(loc) ? bars[i].high : bars[i].close;
        points.push(Object.assign({}, p, { price }));
      }
      markers.push({ title: key, points, dropped: c.points.length - points.length });
    } else {
      other[key] = c.count;
    }
  }

  const { drawings, dropped } = normalizeDrawings(plots, bars);
  const { trades, stats } = normalizeStrategy(ctx?.strategy);
  const strategyConfig = ctx?.strategy?.config || null;
  const title = (strategyConfig && strategyConfig.title) || decl.title || (decl.kind === 'strategy' ? 'Strategy' : 'Indicator');
  const overlay = strategyConfig ? !!strategyConfig.overlay : decl.overlay;

  return {
    kind: strategyConfig || stats ? 'strategy' : 'indicator',
    title,
    overlay,
    symbol,
    timeframe,
    bars: bars.length,
    firstTime: bars[0].openTime,
    lastTime: bars[bars.length - 1].openTime,
    plots: lines,
    markers,
    otherPlots: other,
    drawings,
    trades,
    stats,
    counts: {
      plots: lines.length,
      plotPoints,
      markers: markers.reduce((n, m) => n + m.points.length, 0),
      boxes: drawings.boxes.length,
      labels: drawings.labels.length,
      lines: drawings.lines.length,
      tables: drawings.other.__tables__ || 0,
      polylines: drawings.other.__polylines__ || 0,
      linefills: drawings.other.__linefills__ || 0,
      trades: trades.length,
    },
    runMs,
    sourceSha: sourceSha(script),
    warnings: Array.isArray(ctx?.warnings) ? ctx.warnings.slice(0, 50) : [],
    alerts: Array.isArray(ctx?.alerts) ? ctx.alerts.slice(0, 200) : [],
    plotPoints,
    trimmed,
    droppedAnchors: dropped,
    engine: ENGINE,
  };
}
