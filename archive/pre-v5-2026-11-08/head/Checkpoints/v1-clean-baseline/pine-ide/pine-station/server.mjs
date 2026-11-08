/**
 * server.mjs — THE PINE STATION (127.0.0.1:9741).
 *
 * WHY A SEPARATE PROCESS (SHELL_ANCHOR §2, THE AGPL ISOLATION LAW):
 *   `pinets` (PineTS) and `@luxalgo/vela-pinets` are AGPL-3.0. They live in THIS
 *   package's own node_modules and are imported by THIS process only. Nothing
 *   AGPL ever reaches the Apache-2.0 dashboard bundle: the chart calls
 *   `http://127.0.0.1:9741/run` and receives JSON. Pull this process and the
 *   chart still renders candles, drawings and native (core-computed) indicators.
 *
 * OWNED BY THE ELECTRON MAIN PROCESS: main.js spawns `node server.mjs` on app
 * launch and kills it on quit (SHELL_ANCHOR §3 process law — no orphans). A dead
 * station yields the chart token `PINE_STATION_DOWN`, never a blank panel.
 *
 * CONTRACT (all JSON; every failure carries a NAMED code, never an empty success)
 *   GET  /health                      → { status, engine, pid, uptimeMs, canon }
 *   GET  /catalog                     → { studies: [ {id,name,kind,overlay,description,script} ] }
 *   GET  /canon                       → { path, sha256, bytes, lines, version, title }
 *   GET  /cells[?dataFile=]           → the fixture's pair/timeframe inventory
 *   GET  /bars?dataFile=&pair=&timeframe=[&limit=]
 *                                     → { bars: [{time,open,high,low,close,volume}] } (pinets-cli shape)
 *   POST /run {script | canon:true, bars|dataFile, pair, timeframe, symbol, limit,
 *              maxPoints, overlay:{script|canon:true, id}}
 *                                     → the normalized run. With `canon:true` the
 *                                       CANON indicator is read from disk by path
 *                                       and identified by sha256 (CANON IS LAW,
 *                                       SHELL_ANCHOR §16). With `overlay` a SECOND
 *                                       source runs over the SAME bars and its plot
 *                                       set is returned SEPARATELY (`overlay`), so
 *                                       a verdict can compare the two.
 *
 * Env: PINE_STATION_PORT (9741) · PINE_STATION_HOST (127.0.0.1) ·
 *      PLUTUS_BARS_FIXTURE · PLUTUS_STATION_ROOTS (: separated allow-list) ·
 *      PLUTUS_CANON_PINE (the canon indicator's path)
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPine, ENGINE, toInterval } from './lib/run.mjs';
import { resolveBars, cellsOf, resolveDataFile, DEFAULT_FIXTURE } from './lib/bars.mjs';
import { PINE_CATALOG } from './lib/catalog.mjs';
import { canonInfo, canonSource, sourceSha } from './lib/canon.mjs';

const PORT = parseInt(process.env.PINE_STATION_PORT || '9741', 10);
const HOST = process.env.PINE_STATION_HOST || '127.0.0.1';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const STARTED = Date.now();
const MAX_BODY = 12 * 1024 * 1024;

function log(...a) { console.log('[PINE-STATION]', ...a); }

function send(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, Object.assign({
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
  }, CORS));
  res.end(body);
}

/**
 * CORS — REQUIRED, and safe: the station binds 127.0.0.1 ONLY, and the chart page
 * is served from :9430 while the station answers on :9741, so every station call
 * from the terminal is cross-origin. Measured: without these headers the chart's
 * own `fetch` fails with "Failed to fetch" and the terminal renders
 * PINE_STATION_DOWN against a perfectly healthy station.
 */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Max-Age': '86400',
};
function ok(res, data) { send(res, 200, { success: true, data }); }
function fail(res, code, message, extra = {}) {
  const status = code === 'PINE_COMPILE_ERROR' || code === 'PINE_RUNTIME_ERROR' ? 422
    : code === 'PINE_DATA_DENIED' ? 403
      : code === 'CANON_PINE_ABSENT' ? 503
        : ['PINE_SCRIPT_ABSENT', 'PINE_BARS_ABSENT', 'PINE_REQUEST_MALFORMED', 'PINE_OVERLAY_MALFORMED'].includes(code) ? 400
          : 500;
  send(res, status, Object.assign({ success: false, error: message, code }, extra));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let n = 0;
    const chunks = [];
    req.on('data', (c) => {
      n += c.length;
      if (n > MAX_BODY) { reject(Object.assign(new Error('request body too large'), { code: 'PINE_BODY_TOO_LARGE' })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/** Trim to the last `limit` bars (a 0/absent limit keeps the full history). */
function trimBars(bars, limit) {
  const n = Number(limit);
  if (!Number.isFinite(n) || n <= 0 || n >= bars.length) return bars;
  return bars.slice(-Math.floor(n));
}

/** The gate's first assertion, on every run: what was produced, and from which source. */
function layerSummary(run, name) {
  return {
    layer: name,
    title: run.title,
    kind: run.kind,
    sourceSha: run.sourceSha,
    ms: run.runMs,
    bars: run.bars,
    counts: run.counts,
    trades: run.trades.length,
    warnings: run.warnings.length,
  };
}

/** Resolve one layer's script: an inline source, or the CANON file by path+sha. */
function scriptFor(spec, label) {
  if (!spec || typeof spec !== 'object') {
    throw Object.assign(new Error(`${label}: a script or canon:true is required`), { code: 'PINE_SCRIPT_ABSENT' });
  }
  if (spec.canon === true) {
    const c = canonSource();
    return { script: c.script, canonSha: c.sha256, canonPath: c.info.path, label: `${label}:canon` };
  }
  if (typeof spec.script === 'string' && spec.script.trim()) {
    return { script: spec.script, canonSha: null, canonPath: null, label: `${label}:inline` };
  }
  throw Object.assign(new Error(`${label}: a script or canon:true is required`), { code: 'PINE_SCRIPT_ABSENT' });
}

async function runLayer({ spec, label, bars, symbol, pair, timeframe, maxPoints, ticks }) {
  const { script, canonSha, canonPath } = scriptFor(spec, label);
  const out = await runPine({
    script, bars, symbol, timeframe, maxPoints,
    mintick: ticks?.mintick, pricescale: ticks?.pricescale,
  });
  out.layer = label;
  out.canonSha = canonSha;
  out.canonPath = canonPath;
  out.canon = canonSha ? { sha256: canonSha, path: canonPath, title: out.title } : null;
  out.pair = pair;
  return out;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const route = url.pathname.replace(/\/+$/, '') || '/';
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    return res.end();
  }
  try {
    if (req.method === 'GET' && (route === '/health' || route === '/')) {
      const canon = canonInfo();
      return ok(res, {
        status: 'ok',
        service: 'pine-station',
        engine: ENGINE,
        velaPinets: '0.2.14',
        pid: process.pid,
        uptimeMs: Date.now() - STARTED,
        host: HOST,
        port: PORT,
        defaultFixture: DEFAULT_FIXTURE,
        fixturePresent: fs.existsSync(DEFAULT_FIXTURE),
        canon,
        node: process.version,
        catalog: PINE_CATALOG.length,
      });
    }

    if (req.method === 'GET' && route === '/catalog') {
      return ok(res, { studies: PINE_CATALOG, engine: ENGINE });
    }

    if (req.method === 'GET' && route === '/canon') {
      const info = canonInfo();
      if (!info.present) return fail(res, 'CANON_PINE_ABSENT', `canon Pine indicator absent at ${info.path}`);
      return ok(res, info);
    }

    if (req.method === 'GET' && route === '/cells') {
      const q = url.searchParams;
      return ok(res, cellsOf(q.get('dataFile') || undefined));
    }

    if (req.method === 'GET' && route === '/bars') {
      const q = url.searchParams;
      const bars = resolveBars({
        dataFile: q.get('dataFile') || undefined,
        pair: q.get('pair') || 'EUR/USD',
        timeframe: q.get('timeframe') || '1H',
      });
      const trimmed = trimBars(bars.bars, q.get('limit'));
      return ok(res, {
        source: bars.source,
        label: bars.label,
        anchorMs: bars.anchorMs,
        ticks: bars.ticks || null,
        count: trimmed.length,
        bars: trimmed.map((b) => ({ time: b.openTime, open: b.open, high: b.high, low: b.low, close: b.close, volume: b.volume })),
      });
    }

    if (req.method === 'POST' && route === '/run') {
      const raw = await readBody(req);
      let body;
      try { body = raw ? JSON.parse(raw) : {}; }
      catch (e) { return fail(res, 'PINE_REQUEST_MALFORMED', `body is not JSON: ${e.message}`); }

      const pair = body.pair || 'EUR/USD';
      const timeframe = body.timeframe || '1H';
      const barsInfo = resolveBars({
        bars: body.bars,
        dataFile: body.dataFile ? resolveDataFile(body.dataFile) : undefined,
        pair, timeframe,
      });
      const bars = trimBars(barsInfo.bars, body.limit);
      const symbol = body.symbol || pair;
      const maxPoints = Number(body.maxPoints) || 1500;
      const ticks = barsInfo.ticks || null;

      let primary;
      try {
        primary = await runLayer({
          spec: { canon: body.canon === true, script: body.script },
          label: body.canon === true ? 'canon' : 'primary',
          bars, symbol, pair, timeframe, maxPoints, ticks,
        });
      } catch (e) {
        return fail(res, e.code || 'PINE_RUN_FAILED', e.message, { line: e.line ?? null, column: e.column ?? null });
      }

      // ── THE OVERLAY: a SECOND source over the SAME bars, returned separately.
      // This is what makes a canon-vs-pipeline verdict comparable: two plot sets,
      // one bar set, two identified sources.
      let overlay = null;
      if (body.overlay) {
        if (typeof body.overlay !== 'object') {
          return fail(res, 'PINE_OVERLAY_MALFORMED', 'overlay must be an object {script|canon:true, id}');
        }
        try {
          overlay = await runLayer({
            spec: body.overlay,
            label: body.overlay.id || 'overlay',
            bars, symbol, pair, timeframe, maxPoints, ticks,
          });
        } catch (e) {
          return fail(res, e.code || 'PINE_RUN_FAILED', `overlay: ${e.message}`, { line: e.line ?? null, column: e.column ?? null });
        }
      }

      primary.barsSource = barsInfo.source;
      primary.barsLabel = barsInfo.label;
      primary.barsFile = barsInfo.source;
      primary.anchorMs = barsInfo.anchorMs;
      primary.ticks = ticks;
      primary.layers = [layerSummary(primary, primary.layer)];
      if (overlay) {
        overlay.barsSource = barsInfo.source;
        overlay.ticks = ticks;
        primary.layers.push(layerSummary(overlay, overlay.layer));
        primary.overlay = overlay;
      }
      return ok(res, primary);
    }

    return fail(res, 'PINE_ROUTE_ABSENT', `no route ${req.method} ${route}`);
  } catch (e) {
    return fail(res, e.code || 'PINE_STATION_ERROR', e.message);
  }
});

server.on('error', (e) => {
  console.error('[PINE-STATION] server error:', e.message);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  const canon = canonInfo();
  log(`listening on http://${HOST}:${PORT} (pid ${process.pid}) engine=${ENGINE.name}@${ENGINE.version}`);
  log(`fixture=${DEFAULT_FIXTURE} present=${fs.existsSync(DEFAULT_FIXTURE)}`);
  log(`canon=${canon.path} present=${canon.present} sha=${canon.sha256 ? canon.sha256.slice(0, 12) : '—'} lines=${canon.lines || '—'}`);
});

// The Electron main process owns this child's lifetime; these are belt-and-braces
// so a signal-driven stop never leaves a listener behind.
for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => { log(`${sig} — closing`); server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 1500); });
}
