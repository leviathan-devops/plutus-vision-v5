/**
 * gate.mjs — THE VIL GATE PROTOCOL CLIENT (the mandatory success gate).
 *
 * THE CONTRACT (Main's ruling, verbatim substance): the IDE exposes a GATE MODE —
 *   gate(week|artifact) → loads THAT artifact's Pine, runs it, renders it as the
 *   Plutus vision indicator, CAPTURES a sha'd PNG, and writes a verdict row
 *   (append-only) to ~/.plutus-dashboard/vil/<week>.jsonl with
 *   {week, pineSha, pngSha, readerVerdict, orchestratorVerdict, deltas[], createdAt}.
 *   A pipeline test that has no row for its week is VIL_UNLOOKED = NOT PASSED.
 *   A blank/unreadable frame is INCONCLUSIVE, never PASS.
 *
 * The row is written by the VIL RAIL (a file:// renderer cannot write; the rail is the
 * only Node surface the shell tab has). This module is the PROTOCOL: resolve → run →
 * render → capture → sha → look → row → state. It enforces the verdict laws
 * CLIENT-SIDE too (belt and braces with the rail's own refusal).
 */

export const GATE_VERSION = '1.0.0';

// PLUTUS_VISION fork: its OWN rail (:9754 -> station :9741). :9444 is the dashboard's rail.
export const DEFAULT_RAIL_BASES = ['http://127.0.0.1:9754'];

export function createGate(opts = {}) {
  const railBases = opts.railBases || DEFAULT_RAIL_BASES;
  const doFetch = opts.fetchImpl || ((...a) => fetch(...a));
  let base = railBases[0];
  let baseResolved = false;

  async function resolveBase() {
    if (baseResolved) return base;
    for (const b of railBases) {
      try {
        const res = await doFetch(`${b}/health`, { signal: AbortSignal.timeout(2500) });
        if (res.ok) { base = b; baseResolved = true; return base; }
      } catch { /* try the next base */ }
    }
    throw Object.assign(new Error(`no VIL rail answered on ${railBases.join(' / ')}`), { code: 'VIL_RAIL_DOWN' });
  }

  async function railGet(path) {
    const b = await resolveBase();
    const res = await doFetch(`${b}${path}`, { signal: AbortSignal.timeout(20000) });
    const json = await res.json().catch(() => null);
    if (!json) throw Object.assign(new Error(`rail ${path}: non-JSON reply`), { code: 'VIL_RAIL_ERROR' });
    if (json.success === false) throw Object.assign(new Error(json.error || 'rail error'), { code: json.code || 'VIL_RAIL_ERROR' });
    return json.data;
  }
  async function railPost(path, body) {
    const b = await resolveBase();
    const res = await doFetch(`${b}${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(180000),
    });
    const json = await res.json().catch(() => null);
    if (!json) throw Object.assign(new Error(`rail ${path}: non-JSON reply`), { code: 'VIL_RAIL_ERROR' });
    return json;                                   // callers branch on success/code (a run failure is data)
  }

  const api = {
    version: GATE_VERSION,
    async health() { try { return await railGet('/health'); } catch (e) { return { service: 'vil-rail', up: false, code: e.code, error: e.message }; } },
    async artifacts() { return railGet('/artifacts'); },
    async load(ref) { return railGet('/artifact?ref=' + encodeURIComponent(ref)); },
    async catalog() { return railGet('/catalog'); },
    async bars({ pair, timeframe, limit } = {}) {
      const qs = new URLSearchParams({ pair: pair || 'EUR/USD', timeframe: timeframe || '1H', ...(limit ? { limit: String(limit) } : {}) });
      return railGet('/bars?' + qs);
    },

    /** RUN the Pine through the station (proxied by the rail). Never throws on a script error. */
    async run({ ref = null, script = null, pair = 'EUR/USD', timeframe = '1H', limit = 400, bars = null, symbol = null, maxPoints = null } = {}) {
      const reply = await railPost('/station/run', { ref, script, pair, timeframe, limit, symbol, bars, maxPoints });
      if (reply.success === false) {
        return { ok: false, code: reply.code || 'PINE_RUN_FAILED', error: reply.error, line: reply.line ?? null, column: reply.column ?? null, elapsedMs: reply.elapsedMs, pineSha: reply.pineSha, station: reply.station };
      }
      const d = reply.data || {};
      return { ok: true, run: d, elapsedMs: d.elapsedMs, pineSha: d.pineSha, station: d.station, artifact: d.artifact || null };
    },

    /** Capture the chart canvas → sha256 → PNG on disk (through the rail). */
    async capture({ name = null } = {}) {
      const canvasFn = (typeof opts.captureCanvas === 'function') ? opts.captureCanvas : null;
      const chart = opts.chart;
      let png = null;
      if (canvasFn) { try { png = await canvasFn(); } catch (e) { png = null; } }
      if (!png && chart && typeof chart.screenshot === 'function') { try { png = chart.screenshot(); } catch (e) { png = null; } }
      if (!png) throw Object.assign(new Error('no chart canvas to capture (composite returned null)'), { code: 'CAPTURE_ABSENT' });
      const { sha256OfDataURL, frameStats } = await import('./vision.mjs');
      const sha256 = await sha256OfDataURL(png);
      const stats = await frameStats(png);
      const safeName = name || `pineshell-${new Date().toISOString().replace(/[:.]/g, '-')}-${sha256.slice(0, 12)}`;
      let written = null;
      try { written = await railPost('/vil/capture', { name: safeName, pngBase64: png }); } catch (e) { written = { success: false, code: e.code || 'VIL_RAIL_DOWN', error: e.message }; }
      return {
        png, sha256, stats,
        path: written && written.success ? written.data.path : null,
        bytes: written && written.success ? written.data.bytes : null,
        writeError: written && written.success ? null : (written.error || 'rail write failed'),
        writeCode: written && written.success ? null : (written.code || 'VIL_RAIL_DOWN'),
      };
    },

    /** The LOOK: an optional reader (local Qwen vision etc.). Absent → PENDING + READER_ABSENT. */
    async look(capture) {
      if (typeof opts.reader !== 'function') {
        return { verdict: 'PENDING', note: 'no reader configured (READER_ABSENT)', model: null, absent: true };
      }
      try {
        const r = await opts.reader(capture.png, capture.stats);
        const verdict = ['PASS', 'FAIL', 'INCONCLUSIVE', 'PENDING'].includes(r && r.verdict) ? r.verdict : 'PENDING';
        return { verdict, note: (r && (r.note || r.text)) || null, model: (r && r.model) || null };
      } catch (e) {
        return { verdict: 'PENDING', note: `reader error: ${e.message}`, model: null, error: e.message };
      }
    },

    /** Compute the mechanical deltas + reader verdict. Blank frame ⇒ INCONCLUSIVE, never PASS. */
    async judge({ run, vision, capture, look }) {
      const deltas = [];
      if (!run || !run.ok) {
        deltas.push('RUN_FAILED:' + ((run && run.code) || 'PINE_RUN_FAILED'));
        if (run && run.line) deltas.push('ERROR_LINE:' + run.line);
        return { readerVerdict: 'INCONCLUSIVE', deltas, reason: (run && run.error) || 'run failed' };
      }
      const geometry = (vision ? (vision.boxes + vision.lines + vision.labels + vision.markers + vision.plotSegments + vision.trades) : 0);
      if (!geometry) deltas.push('NO_GEOMETRY');
      if (vision && vision.droppedAnchors) deltas.push('ANCHOR_DROPPED:' + vision.droppedAnchors);
      if (vision && vision.unanchoredMarkers) deltas.push('MARKER_UNANCHORED:' + vision.unanchoredMarkers);
      if (vision && vision.errors && vision.errors.length) {
        const real = vision.errors.filter((e) => e.code !== 'GEOMETRY_OFFSCREEN');
        if (real.length) deltas.push('DRAWING_ERRORS:' + real.length);
      }
      if (vision && vision.capped && (vision.capped.segments || vision.capped.drawings)) deltas.push('CAPPED:seg' + vision.capped.segments + ':draw' + vision.capped.drawings);
      if (vision && vision.tables) deltas.push('TABLE_GEOMETRY_ABSENT:' + vision.tables);
      if (vision && vision.extent && vision.extent.offscreen) {
        // THE VISIBILITY LAW: geometry the operator cannot see is not a render. The canon
        // Part X indicator anchors to its own hardcoded week; when that window does not
        // intersect the bars the frame shows nothing — INCONCLUSIVE, never PASS.
        deltas.push('GEOMETRY_OFFSCREEN');
        if (vision.frameClamped) deltas.push('FRAME_CLAMPED');
        return { readerVerdict: 'INCONCLUSIVE', deltas, reason: 'the artifact window does not intersect the chart data — the render is offscreen' };
      }
      if (!capture) { deltas.push('CAPTURE_ABSENT'); return { readerVerdict: 'INCONCLUSIVE', deltas, reason: 'no capture' }; }
      if (capture.writeCode) deltas.push('CAPTURE_WRITE_FAILED:' + capture.writeCode);
      if (capture.stats && capture.stats.blank) {
        deltas.push('FRAME_BLANK');
        return { readerVerdict: 'INCONCLUSIVE', deltas, reason: `blank frame (nonBackground ${capture.stats.nonBackground} < floor ${capture.stats.floor})` };
      }
      if (look && look.absent) deltas.push('READER_ABSENT');
      const verdict = (look && look.verdict) || 'PENDING';
      // THE MECHANICAL VETO (RT-14, measured 2026-09-29): the vision reader returned PASS on an EMA-only
      // chart — it took the price-axis tag + the last-price line for "a zone with a label". The run's own
      // draw counts are the FIRST reader: the Plutus vision indicator ALWAYS draws zones and labels, so a
      // PASS with no drawn box or no drawn label is impossible. Both readers must agree.
      const zones = vision ? (Number(vision.boxes) || 0) : 0;
      const labels = vision ? (Number(vision.labels) || 0) : 0;
      if (verdict === 'PASS' && (zones === 0 || labels === 0)) {
        deltas.push(`MECH_VETO:boxes=${zones}:labels=${labels}`);
        return { readerVerdict: 'FAIL', deltas, reason: 'the reader said PASS but the run drew no zones/labels — the Plutus vision indicator is not on this chart' };
      }
      return { readerVerdict: verdict, deltas, reason: (look && look.note) || null };
    },

    /**
     * THE GATE — one artifact, one run, one render, one capture, one row.
     * @returns the written row (or a refusal object with a named code).
     */
    async gate({ ref = null, week = null, pair = 'EUR/USD', timeframe = '1H', limit = 400, bars = null, name = null, trades = false } = {}) {
      const meta = typeof opts.getMeta === 'function' ? (opts.getMeta() || {}) : {};
      const art = ref || meta.ref || null;
      const wk = week || meta.week || null;
      const src = typeof opts.getSource === 'function' ? opts.getSource() : null;

      let loaded = null;
      if (art && !/^week:|^buffer$/.test(String(art))) {
        try { loaded = await api.load(art); } catch (e) { return { ok: false, code: e.code || 'VIL_ARTIFACT_ABSENT', error: e.message }; }
      }
      const script = loaded ? loaded.source : src;
      if (!script) return { ok: false, code: 'PINE_SCRIPT_ABSENT', error: 'no Pine source (artifact or buffer)' };

      const run = await api.run({ script, pair, timeframe, limit, bars, ref: null });
      let vision = null;
      const chart = opts.chart;
      if (run.ok && chart) {
        if (typeof opts.beforeCapture === 'function') {
          // The caller owns framing/widening (pine-ide.prepareVision) so the gated frame
          // is as seeable as an interactive one — the artifact must show the render.
          try { vision = await opts.beforeCapture(run.run); } catch { vision = null; }
        }
        if (!vision && typeof opts.render === 'function') {
          const bs = bars || (typeof opts.getBars === 'function' ? opts.getBars() : null);
          try { vision = opts.render(chart, run.run, { bars: bs, trades }); } catch (e) { vision = { error: String(e.message), boxes: 0, lines: 0, labels: 0, markers: 0, plotSegments: 0, trades: 0, errors: [{ code: 'RENDER_THREW', message: e.message }], droppedAnchors: 0, capped: { segments: 0, drawings: 0 } }; }
        }
      }

      let capture = null;
      if (run.ok && chart) { try { capture = await api.capture({ name }); } catch (e) { capture = { error: e.message, writeCode: 'CAPTURE_FAILED', stats: null, sha256: null }; } }

      const look = capture ? await api.look(capture) : { verdict: 'PENDING', absent: true };
      const judged = await api.judge({ run, vision, capture, look });

      const pineSha = run.pineSha || (loaded && loaded.sha256) || null;
      const pngSha = (capture && capture.sha256) || null;
      if (!pineSha || !pngSha) {
        return {
          ok: false, code: pineSha ? 'CAPTURE_ABSENT' : 'PINE_SHA_ABSENT',
          error: 'the row requires both pineSha and pngSha', run, vision, capture, deltas: judged.deltas,
        };
      }

      const rowBody = {
        week: wk, ref: art, pineSha, pngSha,
        readerVerdict: judged.readerVerdict, orchestratorVerdict: null,
        deltas: judged.deltas, pair, timeframe,
        engine: (run.run && run.run.engine) || null,
        counts: {
          bars: (run.run && run.run.bars) || 0,
          plots: (run.run && (run.run.plots || []).length) || 0,
          boxes: (run.run && run.run.drawings && (run.run.drawings.boxes || []).length) || 0,
          lines: (run.run && run.run.drawings && (run.run.drawings.lines || []).length) || 0,
          labels: (run.run && run.run.drawings && (run.run.drawings.labels || []).length) || 0,
          dropped: (run.run && run.run.droppedAnchors) || 0,
        },
        pngPath: capture.path, runMs: run.elapsedMs || null,
      };
      if (!wk) {
        return { ok: false, code: 'VIL_WEEK_INVALID', error: 'a gate run needs a week (YYYY-Www or YYYY-MM-DD) to write its row', row: rowBody, run, vision, capture, deltas: judged.deltas };
      }
      const reply = await railPost('/vil/row', rowBody);
      if (reply.success === false) {
        return { ok: false, code: reply.code || 'VIL_ROW_INVALID', error: reply.error, row: rowBody, run, vision, capture, deltas: judged.deltas };
      }
      return { ok: true, row: reply.data.row, rowPath: reply.data.path, run, vision, capture, look, deltas: judged.deltas, reason: judged.reason };
    },

    /** Append the ORCHESTRATOR's look (append-only: a second row carries the verdict). */
    async verdict({ week, pineSha, pngSha, orchestratorVerdict, deltas = [], ref = null, pair = null, timeframe = null, note = null }) {
      const reply = await railPost('/vil/row', { week, pineSha, pngSha, readerVerdict: 'PENDING', orchestratorVerdict, deltas, ref, pair, timeframe, note });
      if (reply.success === false) return { ok: false, code: reply.code, error: reply.error };
      return { ok: true, row: reply.data.row, rowPath: reply.data.path };
    },

    async rows(week) { return railGet('/vil/rows?week=' + encodeURIComponent(week)); },

    /** THE STATE MACHINE: VIL_UNLOOKED · AWAITING_LOOK · AWAITING_ORCHESTRATOR · PASS · FAIL · INCONCLUSIVE */
    async state(week) {
      let data;
      try { data = await api.rows(week); } catch (e) { return { week, state: 'RAIL_DOWN', code: e.code, rows: [] }; }
      const rows = data.rows || [];
      if (!rows.length) return { week, state: 'VIL_UNLOOKED', rows, verdict: 'VIL_UNLOOKED', note: 'no verdict row for this week — NOT PASSED' };
      const last = rows[rows.length - 1];
      const blanks = (last.deltas || []).filter((d) => /FRAME_BLANK|RUN_FAILED|NO_GEOMETRY/.test(String(d)));
      let state;
      if (last.orchestratorVerdict) state = blanks.length ? 'INCONCLUSIVE' : last.orchestratorVerdict;
      else if (last.readerVerdict && last.readerVerdict !== 'PENDING') state = blanks.length ? 'INCONCLUSIVE' : 'AWAITING_ORCHESTRATOR';
      else state = 'AWAITING_LOOK';
      return { week, state, rows, last, deltas: last.deltas || [], readerVerdict: last.readerVerdict, orchestratorVerdict: last.orchestratorVerdict };
    },
  };
  return api;
}
