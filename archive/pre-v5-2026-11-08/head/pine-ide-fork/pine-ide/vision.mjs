/**
 * vision.mjs — THE VISION INDICATOR RENDERER (the drawing shim).
 *
 * INPUT:  the pine station's run JSON (pine-station/lib/run.mjs output shape) + the bars.
 * OUTPUT: drawings on a Vela chart instance — the SAME instance the tab owns.
 *
 * THE CANON LAW (SHELL_ANCHOR §15/§16, operator ruling): this module renders WHAT
 * THE STATION RETURNED, verbatim. It re-derives NO number, recomputes no level, and
 * re-implements no canon render semantics. The canon's E1 zone boxes / E2 shape-chain
 * line / E3 geometry arrive as `run.drawings.{boxes,lines,labels}` + `run.plots`; the
 * mapping below is geometry translation only (station field → Vela drawing field):
 *
 *   run.drawings.boxes[]   → 'box'        (canon E1 IP zones / LSZ / E3 position boxes)
 *   run.drawings.lines[]   → 'trendline'  (canon E2 shape chain / option strike lines)
 *   run.drawings.labels[]  → 'text' (style_none) / 'callout' (bubble styles) with the canon's text
 *   run.markers[]          → 'iconstamp'  (plotshape/plotchar crossover marks)
 *   run.plots[]            → 'polyline'   (one drawing per plot line; falls back to
 *                                          segment trendlines when polyline is unsupported)
 *   run.drawings.other     → COUNTED and surfaced, never silently dropped
 *                            (the canon 2×17 table has no geometry in the payload —
 *                             that absence is named in the status strip, not hidden).
 *   run.trades[]           → OFF by default: canon Part X C-RENDER-5 is explicit that
 *                            trade geometry is TABLE-ONLY, never chart drawings. The
 *                            overlay is opt-in (`trades:true`) and labelled non-canon.
 *
 * A drawing that Vela refuses is COUNTED (`errors[]`) — never a silent miss.
 */

export const VISION_VERSION = '1.1.0';

const BRASS = '#B99A5B';
const PAPER = '#E8E4DC';
const UP = '#7E9C82';
const DOWN = '#9C6B6B';

/** Pine color() names → hex, for the few scripts that pass names through. */
const NAMED = {
  red: '#E05252', green: '#7E9C82', lime: '#9BE15D', blue: '#6E8ED0', yellow: '#D9C36A',
  orange: '#E09A4A', purple: '#9B8AC4', teal: '#5FB8B0', gray: '#8A8A8A', grey: '#8A8A8A',
  white: '#E8E4DC', black: '#0B0B0C', aqua: '#5FB8B0', fuchsia: '#C47AC4', maroon: '#8A3A3A',
  navy: '#2E4A7A', olive: '#7A8A3A', silver: '#C0C0C0',
};

export function normColor(c, fallback) {
  if (typeof c !== 'string' || !c) return fallback;
  const s = c.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(s)) return s;
  if (/^rgba?\(/i.test(s)) return s;
  const low = s.toLowerCase();
  if (NAMED[low]) return NAMED[low];
  // Pine's color.new(color, transparency) arrives already resolved by the station when
  // possible; an unresolved name is passed through so Vela can try — never invented.
  return s;
}

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/**
 * Render a station run onto a Vela chart.
 * @param {object} chart  a live Vela instance
 * @param {object} run    the station's run payload
 * @param {object} opts   { bars, maxSegments=420, trades=false, keepDrawings=false, maxDrawings=2200 }
 */
export function renderVision(chart, run, opts = {}) {
  const bars = Array.isArray(opts.bars) ? opts.bars : [];
  const maxSegments = Number.isFinite(opts.maxSegments) ? opts.maxSegments : 420;
  const maxDrawings = Number.isFinite(opts.maxDrawings) ? opts.maxDrawings : 2200;
  const out = {
    version: VISION_VERSION,
    cleared: 0,
    boxes: 0, lines: 0, labels: 0, markers: 0, plotSegments: 0, plotLines: 0, trades: 0,
    polylineSupported: null,
    errors: [],
    unanchoredMarkers: 0,
    capped: { segments: 0, drawings: 0 },
    otherPlots: run?.otherPlots || {},
    tables: null,
    droppedAnchors: num(run?.droppedAnchors) ?? 0,
  };

  if (!chart || !chart.drawings) { out.errors.push({ code: 'CHART_ABSENT', message: 'no chart instance' }); return out; }

  // ── the frame swap: clear whatever the previous micro-tab drew ──
  if (!opts.keepDrawings) out.cleared = clearDrawings(chart);

  const ids = [];
  const add = (type, init, tag) => {
    if (ids.length >= maxDrawings) { out.capped.drawings++; return null; }
    try {
      const d = chart.drawings.add(type, init);
      if (!d) { out.errors.push({ code: 'DRAWING_UNSUPPORTED', type, tag }); return null; }
      ids.push({ id: d.id, type, tag });
      return d;
    } catch (e) {
      out.errors.push({ code: 'DRAWING_FAILED', type, tag, message: String(e && e.message || e) });
      return null;
    }
  };

  const D = run?.drawings || {};

  // ── E1/E3: boxes (the IP zones, LSZ, position boxes) ──
  for (const b of (D.boxes || [])) {
    const a = b?.a, bb = b?.b;
    if (!a || !bb || num(a.time) === null || num(bb.time) === null) continue;
    const fill = normColor(b.color, 'rgba(185,154,91,0.10)');
    const d = add('box', {
      anchors: [{ time: a.time, price: Number(a.price) }, { time: bb.time, price: Number(bb.price) }],
      style: {
        lineColor: normColor(b.borderColor, BRASS), lineWidth: 1, lineStyle: 'solid',
        fillColor: fill,
      },
      props: { extend: 'none' },
    }, 'box');
    if (d) out.boxes++;
  }

  // ── E2: lines (the shape chain, option strikes) ──
  for (const l of (D.lines || [])) {
    const a = l?.a, b = l?.b;
    if (!a || !b || num(a.time) === null || num(b.time) === null) continue;
    const d = add('trendline', {
      anchors: [{ time: a.time, price: Number(a.price) }, { time: b.time, price: Number(b.price) }],
      style: { lineColor: normColor(l.color, BRASS), lineWidth: Number(l.width) || 1, lineStyle: l.style || 'solid' },
    }, 'line');
    if (d) out.lines++;
  }

  // ── labels (zone names, strike prices) — THE CANON'S OWN TEXT, in the canon's own style ──
  // MEASURED 2026-10-01: Vela's DrawingText field is `value`; this passed `text.content`, so every label's
  // text was dropped and the 'pricelabel' tool drew its PRICE instead ("1.17" where the canon says
  // "Upper IP Resistance | Moderate-Heavy | 13% ZFP"). Pine label.style_none = text with no bubble ->
  // Vela 'text'; any bubble style -> a single-point 'callout' filled with the label's color.
  for (const L of (D.labels || [])) {
    if (num(L?.time) === null) continue;
    const content = String(L.text ?? '');
    const bare = !L.style || String(L.style) === 'style_none';
    const at = { time: L.time, price: Number(L.price) };
    const d = add(bare ? 'text' : 'callout', {
      anchors: bare ? [at] : [at, at],
      text: { value: content, color: normColor(L.textColor, '#E8E4DC'), size: 'small', hAlign: 'center', vAlign: 'center' },
      style: {
        lineColor: normColor(L.color, BRASS), lineWidth: 1, lineStyle: 'solid',
        fillColor: bare ? 'rgba(0,0,0,0)' : normColor(L.color, 'rgba(185,154,91,0.85)'),
      },
    }, 'label');
    if (d) out.labels++;
  }

  // ── plotshape/plotchar markers (anchored to the bar's high/low by `location`) ──
  // THE GLYPH (RT-9): the station reports Pine's shape as a NAME ("shape_triangle_up"); Vela's
  // iconstamp paints `props.glyph` with fillText, so a name was drawn as the literal word
  // ("circle"). Map every Pine shape to a glyph from Vela's own GLYPH_OPTIONS; plotchar keeps
  // its char. An unknown shape falls back to the dot, never to its name.
  const barAt = (t) => bars.find((b) => b.time === t);
  for (const m of (run?.markers || [])) {
    for (const p of (m.points || [])) {
      const bar = barAt(p.time);
      if (!bar) { out.unanchoredMarkers++; continue; }
      const loc = String(p.location || 'belowbar').toLowerCase();
      const price = loc.includes('above') ? bar.high : bar.low;
      const glyph = markerGlyph(p);
      const d = add('iconstamp', {
        anchors: [{ time: p.time, price }],
        props: { glyph },
        style: { lineColor: normColor(p.color, UP), lineWidth: 2, lineStyle: 'solid' },
      }, 'marker:' + (m.title || ''));
      if (d) out.markers++;
    }
  }

  // ── plot LINES: one polyline per plot, else segment trendlines ──
  for (const p of (run?.plots || [])) {
    const pts = (p.values || []).filter((v) => num(v.value) !== null).map((v) => ({ time: v.time, price: v.value }));
    if (pts.length < 2) continue;
    const color = normColor(p.color, PAPER);
    const width = Number(p.width) || 1;

    if (out.polylineSupported !== false) {
      const d = add('polyline', {
        anchors: pts.map((v) => ({ time: v.time, price: v.price })),
        style: { lineColor: color, lineWidth: width, lineStyle: 'solid' },
        props: { kind: 'plot', title: p.title },
      }, 'plot:' + (p.title || ''));
      if (d) { out.polylineSupported = true; out.plotLines++; out.plotSegments += pts.length - 1; continue; }
      out.polylineSupported = false;   // measured: this Vela build refuses the polyline drawing
      out.errors = out.errors.filter((e) => !(e.tag === ('plot:' + (p.title || '')) && e.code === 'DRAWING_UNSUPPORTED'));
    }
    let seg = 0;
    for (let i = 1; i < pts.length; i++) {
      if (seg >= maxSegments) { out.capped.segments += pts.length - 1 - seg; break; }
      const d = add('trendline', {
        anchors: [{ time: pts[i - 1].time, price: pts[i - 1].price }, { time: pts[i].time, price: pts[i].price }],
        style: { lineColor: color, lineWidth: width, lineStyle: 'solid' },
      }, 'plotseg:' + (p.title || ''));
      if (d) { seg++; }
    }
    out.plotSegments += seg;
    if (seg) out.plotLines++;
  }

  // ── the optional NON-CANON trade overlay (off by default: canon C-RENDER-5) ──
  if (opts.trades && Array.isArray(run?.trades)) {
    for (const t of run.trades) {
      const isLong = t.side !== 'short';
      const entry = { time: t.entryTime, price: Number(t.entryPrice) };
      if (num(entry.time) !== null) {
        const d = add('iconstamp', {
          anchors: [entry], props: { glyph: markerGlyph({ shape: isLong ? 'triangleup' : 'triangledown' }) },
          style: { lineColor: isLong ? UP : DOWN, lineWidth: 2, lineStyle: 'solid' },
        }, 'trade:entry');
        if (d) out.trades++;
      }
      if (t.exitTime && t.exitPrice != null) {
        const d = add('iconstamp', {
          anchors: [{ time: t.exitTime, price: Number(t.exitPrice) }], props: { glyph: markerGlyph({ shape: 'circle' }) },
          style: { lineColor: BRASS, lineWidth: 2, lineStyle: 'solid' },
        }, 'trade:exit');
        if (d) out.trades++;
      }
    }
  }

  out.otherPlots = Object.assign({}, (D && D.other) || {}, run?.otherPlots || {});
  out.tables = out.otherPlots.__tables__ != null ? out.otherPlots.__tables__ : null;
  out.drawingIds = ids;

  // ── THE ARTIFACT CHECK (instrument validity): the counts above come from the CALLS;
  //    these come from the DRAWING SET the chart actually holds. A drawing with no
  //    geometry renders nothing while the call reported success (measured: a polyline
  //    created with `points` instead of `anchors` → `anchors: []`, invisible). Any such
  //    drawing is counted as EMPTY and named — the status strip can never over-report.
  out.verified = null;
  try {
    const json = chart.drawings.toJSON();
    const list = (json && json.drawings) || [];
    const byId = new Map(list.map((d) => [d.id, d]));
    let empty = 0; const emptyTypes = {}; let labelTextAbsent = 0;
    let boxes = 0, lines = 0, labels = 0, markers = 0, polylinePts = 0;
    for (const rec of ids) {
      const d = byId.get(rec.id);
      const anchors = d && Array.isArray(d.anchors) ? d.anchors.length : 0;
      if (!anchors) { empty++; emptyTypes[rec.type] = (emptyTypes[rec.type] || 0) + 1; continue; }
      if (rec.type === 'box') boxes++;
      else if (rec.type === 'trendline') lines++;
      else if (rec.tag === 'label') {
        // a label the chart holds WITHOUT its text renders nothing readable - the instrument that would have
        // caught the dropped-text defect (text.content vs text.value)
        if (!(d.text && String(d.text.value || '').trim())) labelTextAbsent++; else labels++;
      }
      else if (rec.type === 'iconstamp') markers++;
      else if (rec.type === 'polyline') polylinePts += anchors;
    }
    out.verified = { drawings: list.length, mine: ids.length, empty, emptyTypes, boxes, lines, labels, markers, polylinePts };
    if (empty) out.errors.push({ code: 'DRAWING_EMPTY_GEOMETRY', count: empty, byType: emptyTypes });
    if (labelTextAbsent) out.errors.push({ code: 'LABEL_TEXT_ABSENT', count: labelTextAbsent });
    // The counts are replaced by the ARTIFACT counts — the call-based ones were a proxy.
    out.boxes = boxes; out.lines = lines; out.labels = labels; out.markers = markers;
    if (polylinePts) out.plotSegments = polylinePts - out.plotLines;

    // ── THE VISIBILITY CHECK (a false green this tab actually hit): the canon Part X
    //    render is anchored to ITS OWN hardcoded window (tsL/tsR = 2026-04-06 →
    //    2026-05-15), while the chart's bars are the fixture week (Jun 26 → Jul 4).
    //    A drawing set of 30 real drawings at April timestamps renders NOTHING on a July
    //    chart — "verified: 30 drawings" was true and the artifact was empty. So the
    //    extent is measured against the visible range and OFFSCREEN is named.
    let minTime = Infinity, maxTime = -Infinity;
    for (const rec of ids) {
      const d = byId.get(rec.id);
      for (const a of (d && d.anchors) || []) {
        if (a && Number.isFinite(a.time)) { minTime = Math.min(minTime, a.time); maxTime = Math.max(maxTime, a.time); }
      }
    }
    const hasExtent = Number.isFinite(minTime) && Number.isFinite(maxTime);
    let vr = null;
    try { vr = chart.getVisibleRange ? chart.getVisibleRange() : null; } catch { vr = null; }
    out.extent = hasExtent ? {
      minTime, maxTime, anchors: ids.length,
      visibleFrom: vr ? vr.from : null, visibleTo: vr ? vr.to : null,
      offscreen: !!(vr && (maxTime < vr.from || minTime > vr.to)),
      overlaps: !!(vr && maxTime >= vr.from && minTime <= vr.to),
    } : null;
    if (out.extent && out.extent.offscreen) out.errors.push({ code: 'GEOMETRY_OFFSCREEN', minTime, maxTime, visibleFrom: vr && vr.from, visibleTo: vr && vr.to });
  } catch (e) {
    out.errors.push({ code: 'VERIFY_FAILED', message: String(e && e.message || e) });
  }
  return out;
}

/**
 * COMPOSITE THE CHART CANVASES → a PNG data URL.
 *
 * MEASURED (2026-09-29, the vendored 0.8.0 GLOBAL build): a bare `new Vela(...)`
 * chart instance has NO `screenshot()` / `screenshotCanvas()` — those live on the
 * widget/UI entry (dist index.d.ts, chart/app.bundle.js:35586), not on the chart class
 * the trade chart and this tab instantiate (`c.screenshot is not a function`). The
 * chart paints into a STACK of canvases inside the mount container (measured: 5 at
 * 1057×978, CSS 845.6×782.4), so the capture composites them in DOM order onto a
 * background-filled canvas. The WebGL2 backend may hand back an empty buffer — the
 * blank-frame detector (frameStats) turns that into INCONCLUSIVE, never a PASS.
 */
export function compositeCanvases(host) {
  if (!host) return null;
  const list = Array.from(host.querySelectorAll('canvas')).filter((cv) => cv.width > 0 && cv.height > 0);
  if (!list.length) return null;
  const w = list[0].width, h = list[0].height;
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  const ctx = out.getContext('2d');
  ctx.fillStyle = '#0B0B0C';
  ctx.fillRect(0, 0, w, h);
  let painted = 0;
  for (const cv of list) {
    try { ctx.drawImage(cv, 0, 0, w, h); painted++; } catch { /* a tainted/GL canvas — skipped, counted */ }
  }
  if (!painted) return null;
  return out.toDataURL('image/png');
}

/**
 * COMPOSITE AFTER THE CHART SETTLES — the fix for a MEASURED defect.
 *
 * Vela repaints its canvas layers on its own animation frame, so a composite taken
 * immediately after `renderVision(...)` returns the PREVIOUS frame: the first canon
 * capture on this tab held the EMA study's pixels while the drawing set already
 * reported 11 canon boxes (the artifact contradicted the capture — caught by looking
 * at the PNG, not by any counter). This composites, waits two animation frames plus a
 * settle window, then composites again and returns the LATER one. If the two agree the
 * wait was free; if they differ, the fresh frame is the one that ships.
 */
export async function compositeCanvasesSettled(host, { frames = 2, settleMs = 80 } = {}) {
  const first = compositeCanvases(host);
  for (let i = 0; i < frames; i++) await new Promise((r) => requestAnimationFrame(() => r(null)));
  if (settleMs > 0) await new Promise((r) => setTimeout(r, settleMs));
  const second = compositeCanvases(host);
  return second || first;
}

/**
 * THE SANCTIONED CAPTURE PATH — measured on the live instance.
 *
 * The chart INSTANCE has no capture method, but `chart.renderer` (the renderer control)
 * DOES: `screenshot()` / `screenshotCanvas()` — and its own contract says a fresh
 * SYNCHRONOUS paint runs first, which also repaints the drawings layers, so the frame
 * is current (dist index.d.ts; the internal caller `screenshot` at
 * chart/app.bundle.js:35622 → `screenshotCanvas` at :17562). That is exactly what a
 * stale composite lacked. Order: renderer.screenshot() →
 * renderer.screenshotCanvas().toDataURL() → the settled canvas composite (last resort).
 * The channel used is returned so a capture can NAME how it was taken.
 */
export function captureViaRenderer(chart, host) {
  const r = chart && chart.renderer;
  try {
    if (r && typeof r.screenshot === 'function') {
      const s = r.screenshot();
      if (s) return { png: s, via: 'renderer.screenshot' };
    }
  } catch { /* fall through to the canvas path */ }
  try {
    if (r && typeof r.screenshotCanvas === 'function') {
      const cv = r.screenshotCanvas();
      if (cv) return { png: cv.toDataURL('image/png'), via: 'renderer.screenshotCanvas' };
    }
  } catch { /* fall through */ }
  const c = compositeCanvases(host);
  return c ? { png: c, via: 'canvas-composite' } : null;
}

/** Clear every drawing this module (or the operator) put on the chart. */
export function clearDrawings(chart) {
  let n = 0;
  try {
    const json = chart.drawings.toJSON();
    const list = (json && json.drawings) || [];
    for (const d of list) { try { chart.drawings.remove(d.id); n++; } catch { /* already gone */ } }
  } catch { /* no drawings API state */ }
  return n;
}

/**
 * BLANK-FRAME DETECTOR — the gate's INCONCLUSIVE test (SHELL_ANCHOR §5.3: "a blank
 * frame is INCONCLUSIVE, never PASS"). Draws the captured PNG into an offscreen
 * canvas, samples a 96×54 grid, and measures the fraction of samples that differ
 * from the modal (background) color. A chart with candles + drawings measures far
 * above the floor; an empty canvas measures ~0. Threshold is reported, not hidden.
 */
export async function frameStats(pngDataURL, { grid = 96, floor = 0.002 } = {}) {
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('png decode failed')); img.src = pngDataURL; });
  const w = Math.max(1, Math.round(grid));
  const h = Math.max(1, Math.round(grid * 0.5625));
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  const px = ctx.getImageData(0, 0, w, h).data;
  const hist = new Map();
  for (let i = 0; i < px.length; i += 4) {
    const key = (px[i] >> 3 << 10) | (px[i + 1] >> 3 << 5) | (px[i + 2] >> 3);
    hist.set(key, (hist.get(key) || 0) + 1);
  }
  let modalKey = 0, modalN = -1;
  for (const [k, n] of hist) if (n > modalN) { modalN = n; modalKey = k; }
  const mr = (modalKey >> 10 & 31) << 3, mg = (modalKey >> 5 & 31) << 3, mb = (modalKey & 31) << 3;
  let differing = 0, total = 0;
  for (let i = 0; i < px.length; i += 4) {
    total++;
    if (Math.abs(px[i] - mr) > 12 || Math.abs(px[i + 1] - mg) > 12 || Math.abs(px[i + 2] - mb) > 12) differing++;
  }
  const nonBackground = total ? differing / total : 0;
  return {
    width: img.naturalWidth, height: img.naturalHeight,
    samples: total, distinctColors: hist.size,
    nonBackground: Number(nonBackground.toFixed(5)),
    floor, blank: nonBackground < floor,
  };
}

/** sha256 of a data URL's bytes, in the browser. */
export async function sha256OfDataURL(dataURL) {
  const b64 = String(dataURL).replace(/^data:[^,]*,/, '');
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Pine plotshape/plotchar → a single glyph Vela paints (its GLYPH_OPTIONS set). */
const PINE_SHAPE_GLYPH = {
  circle: '\u25CF', triangleup: '\u25B2', triangledown: '\u25BC', arrowup: '\u25B2', arrowdown: '\u25BC',
  labelup: '\u25B2', labeldown: '\u25BC', diamond: '\u25C6', square: '\u25C6', cross: '\u271A',
  xcross: '\u2715', flag: '\u2691',
};
export function markerGlyph(p) {
  if (p && !p.shape && typeof p.char === 'string' && p.char.trim()) return Array.from(p.char.trim())[0];
  const key = String((p && p.shape) || 'circle').toLowerCase().replace(/^shape[._]?/, '').replace(/[_\s]/g, '');
  return PINE_SHAPE_GLYPH[key] || PINE_SHAPE_GLYPH.circle;
}
