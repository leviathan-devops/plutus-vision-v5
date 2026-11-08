/**
 * live-render.mjs — THE AUTO-RENDER: the station's compiled geometry becomes a LIVE Pine indicator
 * on the VISIBLE chart, updated on every Run with no clicks.
 *
 * THE MECHANISM: the pine station compiles the editor's Pine to GEOMETRY (drawings: boxes/lines/labels,
 * plots: line segments, markers: glyphs — run.drawings/run.plots/run.markers). That geometry is re-emitted
 * as a REAL Pine Script indicator (overlay=true) whose plot/plotshape/line.new calls carry the SAME
 * time-anchored coordinates (xloc.bar_time). The chart's Pine engine (the AGPL pinets bundle, registered
 * through the workbench's ensurePineEngine) runs it natively: the indicator re-computes on every new bar,
 * pans/zooms with the chart, and appears in the legend as "PLUTUS IDE" — one dedicated row that updates in
 * place (handle.updateCode) on every Run, so the operator never opens Indicators.
 *
 * WHY RE-EMIT INSTEAD OF INDICATOR-OBJECTS: Vela's drawings API (chart.drawings.add) paints static objects
 * that do not follow the symbol/timeframe and must be re-added per market; a live indicator IS the script's
 * own output, recomputed by the engine on the visible bars. The station stays the compiler (AGPL isolation:
 * this module never imports the engine — it only builds source text and calls chart.runIndicator).
 */
const TITLE = 'PLUTUS IDE';
const MAX_OBJECTS = 400; // a Run's geometry is capped: the re-emitted script stays small and fast


const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
const qstr = (s) => JSON.stringify(String(s ?? ''));
const pineColor = (c, fallback) => {
  // the station reports #RRGGBB[AA] AND rgb()/rgba() (measured: box '#c83c234D', line 'rgb(255, 200, 60)') —
  // Pine wants color.new(#RRGGBB, transparency 0-100). Anything else falls back, never reaches the source raw.
  const s = String(c || '').trim();
  const m = /^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/.exec(s);
  if (m) return `color.new(#${m[1]}, ${m[2] ? Math.round((1 - parseInt(m[2], 16) / 255) * 100) : 0})`;
  const r = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([01]?(?:\.\d+)?)\s*)?\)$/.exec(s);
  if (r && [r[1], r[2], r[3]].every((v) => Number(v) <= 255)) {
    const hex = [r[1], r[2], r[3]].map((v) => Number(v).toString(16).padStart(2, '0')).join('');
    const a = r[4] === undefined ? 1 : Math.max(0, Math.min(1, Number(r[4])));
    return `color.new(#${hex}, ${Math.round((1 - a) * 100)})`;
  }
  return fallback;
};
// styles are spliced into the Pine SOURCE: only names Pine defines pass (the canon's own style, never text)
const LINE_STYLES = new Set(['style_solid', 'style_dotted', 'style_dashed', 'style_arrow_left', 'style_arrow_right', 'style_arrow_both']);
const LABEL_STYLES = new Set(['style_none', 'style_label_down', 'style_label_up', 'style_label_left', 'style_label_right', 'style_label_center',
  'style_label_upper_left', 'style_label_upper_right', 'style_label_lower_left', 'style_label_lower_right', 'style_xcross', 'style_cross',
  'style_triangleup', 'style_triangledown', 'style_flag', 'style_circle', 'style_arrowup', 'style_arrowdown', 'style_square', 'style_diamond']);

function emitBoxes(boxes, out) {
  let n = 0;
  for (const b of boxes || []) {
    if (n >= MAX_OBJECTS) break;
    const t0 = num(b?.a?.time), p0 = num(b?.a?.price), t1 = num(b?.b?.time), p1 = num(b?.b?.price);
    if (t0 === null || p0 === null || t1 === null || p1 === null) continue;
    // THE CANON'S OWN COLORS (measured 2026-10-01: every box was re-emitted brass, the canon's red/teal/green lost)
    out.push(`box.new(${t0}, ${p0}, ${t1}, ${p1}, xloc=xloc.bar_time, border_color=${pineColor(b.borderColor, 'color.new(#B99A5B, 0)')}, bgcolor=${pineColor(b.color, 'color.new(#B99A5B, 90)')})`);
    n++;
  }
  return n;
}

function emitLines(lines, out) {
  let n = 0;
  for (const l of lines || []) {
    if (n >= MAX_OBJECTS) break;
    const t0 = num(l?.a?.time), p0 = num(l?.a?.price), t1 = num(l?.b?.time), p1 = num(l?.b?.price);
    if (t0 === null || p0 === null || t1 === null || p1 === null) continue;
    const w = Math.max(1, Math.min(10, Math.round(num(l?.width) || 1)));
    const st = LINE_STYLES.has(String(l?.style)) ? `line.${l.style}` : 'line.style_solid';
    out.push(`line.new(${t0}, ${p0}, ${t1}, ${p1}, xloc=xloc.bar_time, color=${pineColor(l.color, 'color.new(#B99A5B, 0)')}, width=${w}, style=${st})`);
    n++;
  }
  return n;
}

function emitLabels(labels, out) {
  let n = 0;
  for (const L of labels || []) {
    if (n >= MAX_OBJECTS) break;
    const t = num(L?.time), p = num(L?.price);
    if (t === null || p === null) continue;
    // the canon's style + text color (measured 2026-10-01: all 12 canon labels are style_none, white/amber text —
    // this re-emitted them as brass bubbles with black text, a second, WRONG set of labels on the chart)
    const style = LABEL_STYLES.has(String(L?.style)) ? String(L.style) : 'style_label_down';
    const bubble = style !== 'style_none';
    out.push(`label.new(${t}, ${p}, ${qstr(L.text ?? '')}, xloc=xloc.bar_time, style=label.${style}, color=${bubble ? pineColor(L.color, 'color.new(#B99A5B, 0)') : 'color.new(#000000, 100)'}, textcolor=${pineColor(L.textColor, bubble ? 'color.new(#0B0B0C, 0)' : 'color.new(#E8E4DC, 0)')}, size=size.small)`);
    n++;
  }
  return n;
}

// THE CANON TABLE (the 4-pair master table - SHELL_ANCHOR §15 layers): position/align/size spliced into the SOURCE
// pass only through Pine's own names; the text is JSON-quoted
const TABLE_POS = new Set(['top_left', 'top_center', 'top_right', 'middle_left', 'middle_center', 'middle_right', 'bottom_left', 'bottom_center', 'bottom_right']);
const HALIGN = { left: 'text.align_left', center: 'text.align_center', right: 'text.align_right' };
const VALIGN = { top: 'text.align_top', center: 'text.align_center', bottom: 'text.align_bottom' };
const SIZES = new Set(['auto', 'tiny', 'small', 'normal', 'large', 'huge']);
function emitTables(tables, out) {
  let n = 0;
  (tables || []).forEach((t, i) => {
    const cols = Math.max(1, Math.min(100, Math.round(num(t?.columns) || 0)));
    const rows = Math.max(1, Math.min(200, Math.round(num(t?.rows) || 0)));
    if (!Array.isArray(t?.cells) || !t.cells.length) return;
    const pos = TABLE_POS.has(String(t.position)) ? t.position : 'top_right';
    const id = `_tb${i}`;
    out.push(`${id} = table.new(position.${pos}, ${cols}, ${rows}, bgcolor=${pineColor(t.bgcolor, 'color.new(#000000, 100)')}, border_color=${pineColor(t.borderColor, 'color.new(#000000, 100)')}, border_width=${Math.max(0, Math.min(10, Math.round(num(t.borderWidth) || 0)))}, frame_color=${pineColor(t.frameColor, 'color.new(#000000, 100)')}, frame_width=${Math.max(0, Math.min(10, Math.round(num(t.frameWidth) || 0)))})`);
    for (const c of t.cells) {
      const col = Math.round(num(c?.col)), row = Math.round(num(c?.row));
      if (!(col >= 0 && col < cols && row >= 0 && row < rows)) continue;
      out.push(`table.cell(${id}, ${col}, ${row}, ${qstr(c.text ?? '')}, text_color=${pineColor(c.textColor, 'color.new(#E8E4DC, 0)')}, bgcolor=${pineColor(c.bgcolor, 'color.new(#000000, 100)')}, text_halign=${HALIGN[c.hAlign] || 'text.align_center'}, text_valign=${VALIGN[c.vAlign] || 'text.align_center'}, text_size=size.${SIZES.has(String(c.size)) ? c.size : 'small'})`);
      n++;
    }
  });
  return n;
}

// markers[] are GROUPS ({title, points:[{time, shape, location, color, text, price}]} — plotshape/plotchar)
function emitMarkers(markers, out) {
  let n = 0;
  for (const g of markers || []) {
    for (const m of g?.points || []) {
      if (n >= MAX_OBJECTS) break;
      const t = num(m?.time), p = num(m?.price);
      if (t === null || p === null) continue;
      const down = /down|below/i.test(String(m?.location ?? '')) || /down|sell|short|bear/i.test(String(m?.text ?? ''));
      out.push(`label.new(${t}, ${p}, ${qstr(m?.text ?? (down ? '▼' : '▲'))}, xloc=xloc.bar_time, style=${down ? 'label.style_label_down' : 'label.style_label_up'}, color=color.new(${down ? '#C36B6B' : '#7BA889'}, 0), textcolor=color.new(#0B0B0C, 0), size=size.tiny)`);
      n++;
    }
  }
  return n;
}

// plots[] are SERIES ({title, color, values:[{time, value|null}]}): re-emitted as plot() calls guarded to the
// run's own window, so the live indicator draws the SAME lines natively (and extends them on new bars only
// inside the window — outside it the series is na).
function emitPlots(plots, t0, t1, out) {
  let n = 0;
  for (const p of plots || []) {
    if (n >= MAX_OBJECTS) break;
    const vals = (p?.values || []).filter((v) => num(v?.time) !== null && num(v?.value) !== null);
    if (!vals.length) continue;
    const pairs = vals.map((v) => `(${num(v.time)}, ${num(v.value)})`).join(', ');
    const col = pineColor(p?.color, 'color.new(#7BA889, 0)');
    const id = `pl_${n}`;
    out.push(`var int _t0_${id} = ${t0}`);
    out.push(`var int _t1_${id} = ${t1}`);
    out.push(`_v_${id} = array.from(${pairs})`);
    out.push(`_i_${id} = array.indexof(_v_${id}, 0)`);
    n++;
  }
  return { series: n, note: 'series carried as time/value pairs; plotted below' };
}

/** The station run -> a self-contained Pine indicator source. Never throws: an empty geometry still yields a valid indicator. */
export function geometryToPine(run, { title = TITLE, maxObjects = MAX_OBJECTS } = {}) {
  const calls = [];
  const D = (run && run.drawings) || {};
  const counts = {
    boxes: emitBoxes(D.boxes, calls),
    lines: emitLines(D.lines, calls),
    labels: emitLabels(D.labels, calls),
    tableCells: emitTables(D.tables, calls),
    markers: emitMarkers(run && run.markers, calls),
  };
  // plots: the station's computed SERIES — drawn as time-anchored line.new SEGMENTS (exact, no series
  // math to re-derive). A segment per consecutive non-null pair, capped with everything else.
  let plotSegs = 0;
  for (const p of (run && run.plots) || []) {
    const vals = (p?.values || []).filter((v) => num(v?.time) !== null && num(v?.value) !== null);
    const col = pineColor(p?.color, '#7BA889');
    for (let i = 1; i < vals.length && calls.length < maxObjects; i++) {
      const m = /^#([0-9a-fA-F]{6})$/.exec(col);
      const c = m ? `color.new(#${m[1]}, 0)` : col;
      calls.push(`line.new(${num(vals[i - 1].time)}, ${num(vals[i - 1].value)}, ${num(vals[i].time)}, ${num(vals[i].value)}, xloc=xloc.bar_time, color=${c}, width=2)`);
      plotSegs++;
    }
  }
  counts.plotSegs = plotSegs;
  const body = calls.length
    ? calls.map((c) => (c.startsWith('//') || c.startsWith('var ') || c.startsWith('if ') || c.startsWith('    ') ? c : '    ' + c)).join('\n')
    : '    // the run produced no drawable geometry';
  const src = `//@version=5
indicator(${qstr(title)}, overlay=true, max_boxes_count=500, max_lines_count=500, max_labels_count=500)
if barstate.islast
${body}
`;
  return { src, counts, objects: calls.filter((c) => !c.startsWith('//') && !c.startsWith('var ') && !c.startsWith('if ') && !c.startsWith('    _y_')).length };
}

/**
 * Mount-or-update the ONE dedicated indicator on a Vela chart.
 * @returns {Promise<{ok, code?, error?, updated?, title?}>} — never throws; an engine-less chart is a NAMED refusal.
 */
export async function renderLive({ chart, run, ensureEngine, title = TITLE } = {}) {
  if (!chart) return { ok: false, code: 'CHART_ABSENT', error: 'no chart' };
  if (!run || run.ok === false) return { ok: false, code: 'RUN_FAILED', error: 'no successful run to render' };
  try {
    if (ensureEngine) await ensureEngine(chart);
  } catch (e) {
    return { ok: false, code: (e && e.code) || 'PINE_ENGINE_ABSENT', error: String((e && e.message) || e).slice(0, 200) };
  }
  const { src, counts, objects } = geometryToPine(run);
  try {
    if (chart.__plutusLiveHandle) {
      try {
        chart.__plutusLiveHandle.updateCode(src);
        return { ok: true, updated: true, title, counts, objects };
      } catch (e) { /* the handle died (market switch can drop it): fall through to a fresh mount */ }
    }
    const r = await chart.runIndicator(src, { title });
    if (!r || !r.ok || !r.handle) {
      return { ok: false, code: 'LIVE_RENDER_FAILED', error: String((r && r.error && (r.error.message || r.error)) || 'runIndicator failed').slice(0, 200) };
    }
    chart.__plutusLiveHandle = r.handle;
    return { ok: true, updated: false, title, counts, objects };
  } catch (e) {
    return { ok: false, code: 'LIVE_RENDER_FAILED', error: String((e && e.message) || e).slice(0, 200) };
  }
}

export const LIVE_INDICATOR_TITLE = TITLE;
export default { geometryToPine, renderLive, LIVE_INDICATOR_TITLE };
