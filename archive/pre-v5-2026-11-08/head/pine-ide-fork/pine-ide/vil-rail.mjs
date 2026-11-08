/**
 * vil-rail.mjs — THE VIL RAIL (127.0.0.1:9444). The Pine Shell's Node side.
 *
 * WHY THIS PROCESS EXISTS (measured, 2026-09-29 — SHELL_ANCHOR §15/§16 + Main's ruling):
 *   1. THE RENDERER IS file:// (electron/main.js loadFile). A file:// page cannot
 *      write a file: contextIsolation=true, nodeIntegration=false, and preload.js
 *      exposes no write IPC. The VIL gate MUST append a ledger row and MUST write
 *      the capture PNG → that requires a Node process.
 *   2. THE PINE STATION SENDS NO CORS HEADERS (pine-station/server.mjs send():
 *      Content-Type/Cache-Control/Content-Length only). A file:// page (Origin: null)
 *      cannot READ its JSON. This rail proxies /run server-side (Node→Node: no CORS).
 *   3. THE CANON SOURCE IS A FILE BY PATH+SHA (PLUTUS/Original_Canon_Data/Pine
 *      Scripts/trident_v8.pine, sha256 5c1ab5221ced87ff…). The browser cannot read
 *      it; the rail loads it BY PATH and asserts the sha — never copies it.
 *
 * THE LAW (SHELL_ANCHOR §15, operator ruling): a pipeline test with no verdict row
 * for its week is VIL_UNLOOKED = NOT PASSED. A blank/unreadable frame is
 * INCONCLUSIVE, never PASS. Every failure carries a NAMED code; never an empty success.
 *
 * PORTS (Main's allocation): :9440 journal · :9441 pine station · :9442 broker rail ·
 * :9443 backtest · **:9444 THIS RAIL** (env PLUTUS_VIL_PORT; 9444→9445 fallback).
 *
 * ROUTES (all JSON)
 *   GET  /health                      → { service, port, station, vilDir, evidenceDir, canon }
 *   GET  /artifacts                   → { roots, items:[{ref,kind,week?,path,bytes,sha256,mtime}] }
 *   GET  /artifact?ref=WEEK|canon:v8  → { ref, source, sha256, bytes, path }
 *   GET  /catalog                     → the station's PINE_CATALOG (proxied)
 *   GET  /bars?pair=&timeframe=&limit=→ the station's bar resolution (proxied)
 *   POST /station/run {script|ref,…}  → the station's run JSON (proxied) + {elapsedMs}
 *   GET  /vil/rows?week=              → { week, rows:[…], count }
 *   POST /vil/row  {week,pineSha,pngSha,readerVerdict,orchestratorVerdict,deltas[],…}
 *                                     → append-only row; { path, bytes, count }
 *   POST /vil/capture {name,pngBase64}→ writes the PNG under evidence/shell/; { path, sha256, bytes }
 *
 * Env: PLUTUS_VIL_PORT(9444) · PLUTUS_VIL_HOST(127.0.0.1) · PLUTUS_STATION_URL ·
 *      PLUTUS_VIL_DIR(~/.plutus-dashboard/vil) · PLUTUS_VIL_EVIDENCE · PLUTUS_VIL_ROOTS(:)
 */

import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(HERE, '..');            // …/dashboard/dashboard
const REPO_DIR = path.resolve(APP_DIR, '..');        // …/PLUTUS/LIVE/dashboard
const HOME = process.env.HOME || os.homedir();

const HOST = process.env.PLUTUS_VIL_HOST || '127.0.0.1';
const PORT_ENV = Number(process.env.PLUTUS_VIL_PORT || 0);
const PORTS = PORT_ENV ? [PORT_ENV] : [9444, 9445];

const STATION = process.env.PLUTUS_STATION_URL || 'http://127.0.0.1:9441';
const VIL_DIR = path.resolve(process.env.PLUTUS_VIL_DIR || path.join(HOME, '.plutus-dashboard', 'vil'));
const EVIDENCE_DIR = path.resolve(process.env.PLUTUS_VIL_EVIDENCE || path.join(APP_DIR, 'evidence', 'shell'));
const PINE_DIR = path.join(VIL_DIR, 'pine');

/** The canon Part X render, by PATH + SHA. Never copied into the repo (Main's ruling). */
const CANON_DIR = resolveCanonDir();
function resolveCanonDir() {
  if (process.env.PLUTUS_CANON_DIR) return path.resolve(process.env.PLUTUS_CANON_DIR);
  // The rail runs from a worktree (…/LIVE/dashboard-wt/<desk>/dashboard/pine-ide) OR the
  // main checkout (…/LIVE/dashboard/dashboard/pine-ide) — the depth differs by one level,
  // so walk UP looking for Original_Canon_Data/Pine Scripts instead of counting '..'.
  let dir = REPO_DIR;
  for (let i = 0; i < 5; i++) {
    const cand = path.join(dir, 'Original_Canon_Data', 'Pine Scripts');
    if (fs.existsSync(cand)) return cand;
    dir = path.resolve(dir, '..');
  }
  return path.join(REPO_DIR, '..', '..', 'Original_Canon_Data', 'Pine Scripts');
}
const CANON = {
  'canon:v8': { path: path.join(CANON_DIR, 'trident_v8.pine'), sha256: '5c1ab5221ced87ff7cca928640d9b61bc79e13135120e738961288e3ec60c5c7' },
  'canon:v7': { path: path.join(CANON_DIR, 'trident_v7 (2).pine'), sha256: '5a06e9e1b3af5bedf73acc661e1e9ee7a4534053e89e35111beec5a54791cbf7' },
};

function artifactRoots() {
  const env = (process.env.PLUTUS_VIL_ROOTS || '').split(':').filter(Boolean);
  return [...env, PINE_DIR, path.join(EVIDENCE_DIR, 'pine'), CANON_DIR].map((p) => path.resolve(p));
}

const STARTED = Date.now();
const MAX_BODY = 16 * 1024 * 1024;
let PORT = PORTS[0];

function log(...a) { console.log('[VIL-RAIL]', ...a); }

function send(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  res.end(body);
}
function ok(res, data) { send(res, 200, { success: true, data }); }
function fail(res, code, message, extra = {}) {
  const status = code === 'VIL_ROW_INVALID' || code === 'VIL_WEEK_INVALID' || code === 'VIL_CAPTURE_EMPTY'
    || code === 'VIL_ARTIFACT_ABSENT' ? 400
    : code === 'VIL_ARTIFACT_DENIED' ? 403
      : code === 'VIL_METHOD_INVALID' || code === 'VIL_ROUTE_ABSENT' ? 404
        : 500;
  send(res, status, Object.assign({ success: false, error: message, code }, extra));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let n = 0; const chunks = [];
    req.on('data', (c) => {
      n += c.length;
      if (n > MAX_BODY) { reject(Object.assign(new Error('body too large'), { code: 'VIL_BODY_TOO_LARGE' })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const WEEK_RE = /^[0-9]{4}-W[0-9]{2}$|^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

function ensureDirs() {
  for (const d of [VIL_DIR, PINE_DIR, EVIDENCE_DIR]) fs.mkdirSync(d, { recursive: true, mode: 0o755 });
}

function within(p, roots) {
  const abs = path.resolve(p);
  return roots.some((r) => abs === r || abs.startsWith(r + path.sep));
}

/** Every artifact the gate can load: the week Pine files, the canon scripts, the station catalog. */
function listArtifacts() {
  const roots = artifactRoots();
  const items = [];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const name of fs.readdirSync(root)) {
      if (!/\.pine$/i.test(name)) continue;
      const p = path.join(root, name);
      let st; try { st = fs.statSync(p); } catch { continue; }
      if (!st.isFile()) continue;
      const buf = fs.readFileSync(p);
      const base = name.replace(/\.pine$/i, '');
      const canonRef = Object.keys(CANON).find((k) => path.resolve(CANON[k].path) === path.resolve(p));
      items.push({
        ref: canonRef || base,
        kind: canonRef ? 'canon' : (WEEK_RE.test(base) ? 'week' : 'file'),
        week: WEEK_RE.test(base) ? base : null,
        path: p,
        bytes: st.size,
        sha256: sha256(buf),
        mtime: st.mtimeMs,
        lines: buf.toString('utf8').split('\n').length,
      });
    }
  }
  return { roots, items: items.sort((a, b) => b.mtime - a.mtime) };
}

/** Resolve an artifact ref → {source, sha256, path, bytes}. Canon refs assert the recorded sha. */
function resolveArtifact(ref) {
  const r = String(ref || '').trim();
  if (!r) throw Object.assign(new Error('ref is required'), { code: 'VIL_ARTIFACT_ABSENT' });
  const roots = artifactRoots();

  if (CANON[r]) {
    const spec = CANON[r];
    if (!fs.existsSync(spec.path)) {
      throw Object.assign(new Error(`canon artifact absent: ${spec.path}`), { code: 'VIL_ARTIFACT_ABSENT', path: spec.path });
    }
    const buf = fs.readFileSync(spec.path);
    const got = sha256(buf);
    if (got !== spec.sha256) {
      throw Object.assign(
        new Error(`canon sha mismatch for ${r}: expected ${spec.sha256}, got ${got}`),
        { code: 'VIL_ARTIFACT_DENIED', expected: spec.sha256, got, path: spec.path },
      );
    }
    return { ref: r, source: buf.toString('utf8'), sha256: got, bytes: buf.length, path: spec.path, canon: true, week: null };
  }

  const candidates = [
    path.join(PINE_DIR, `${r}.pine`),
    path.join(EVIDENCE_DIR, 'pine', `${r}.pine`),
    /\.pine$/i.test(r) ? r : `${r}.pine`,
  ];
  for (const c of candidates) {
    const abs = path.resolve(c);
    if (!fs.existsSync(abs)) continue;
    if (!within(abs, roots)) {
      throw Object.assign(new Error(`artifact outside the allow-listed roots: ${abs}`), { code: 'VIL_ARTIFACT_DENIED', roots });
    }
    const buf = fs.readFileSync(abs);
    return { ref: r, source: buf.toString('utf8'), sha256: sha256(buf), bytes: buf.length, path: abs, canon: false, week: WEEK_RE.test(r) ? r : null };
  }
  throw Object.assign(new Error(`artifact not found for ref "${r}" (roots: ${roots.join(', ')})`), { code: 'VIL_ARTIFACT_ABSENT', roots });
}

async function stationFetch(route, { method = 'GET', body } = {}, timeoutMs = 120000) {
  const url = `${STATION.replace(/\/+$/, '')}${route}`;
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* non-JSON station body */ }
    if (!json) {
      return { ok: false, status: res.status, code: 'PINE_STATION_NON_JSON', error: text.slice(0, 400) };
    }
    return { ok: res.ok && json.success !== false, status: res.status, json };
  } catch (e) {
    return { ok: false, status: 0, code: 'PINE_STATION_DOWN', error: `${e.name}: ${e.message}`, station: STATION };
  }
}

function readRows(week) {
  if (!WEEK_RE.test(String(week || ''))) {
    throw Object.assign(new Error(`week must be YYYY-Www or YYYY-MM-DD, got "${week}"`), { code: 'VIL_WEEK_INVALID' });
  }
  const file = path.join(VIL_DIR, `${week}.jsonl`);
  if (!fs.existsSync(file)) return { week, file, rows: [] };
  const rows = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((line) => {
    try { return JSON.parse(line); } catch { return { _unparsed: line.slice(0, 200) }; }
  });
  return { week, file, rows };
}

const VERDICTS = new Set(['PASS', 'FAIL', 'INCONCLUSIVE', 'VIL_UNLOOKED', 'PENDING', null, undefined]);

function appendRow(row) {
  const week = String(row.week || '');
  if (!WEEK_RE.test(week)) throw Object.assign(new Error(`week must be YYYY-Www or YYYY-MM-DD, got "${week}"`), { code: 'VIL_WEEK_INVALID' });
  for (const k of ['pineSha', 'pngSha']) {
    if (!row[k] || !/^[0-9a-f]{64}$/.test(String(row[k]))) {
      throw Object.assign(new Error(`${k} must be a sha256 hex digest (got ${JSON.stringify(row[k])})`), { code: 'VIL_ROW_INVALID', field: k });
    }
  }
  if (!VERDICTS.has(row.readerVerdict)) {
    throw Object.assign(new Error(`readerVerdict must be PASS|FAIL|INCONCLUSIVE|PENDING (got ${JSON.stringify(row.readerVerdict)})`), { code: 'VIL_ROW_INVALID', field: 'readerVerdict' });
  }
  if (!VERDICTS.has(row.orchestratorVerdict)) {
    throw Object.assign(new Error(`orchestratorVerdict must be PASS|FAIL|INCONCLUSIVE|null (got ${JSON.stringify(row.orchestratorVerdict)})`), { code: 'VIL_ROW_INVALID', field: 'orchestratorVerdict' });
  }
  const deltas = Array.isArray(row.deltas) ? row.deltas : [];
  // THE MECHANICAL ENFORCEMENT (SHELL_ANCHOR §5.3, Main's ruling): "a blank/unreadable
  // frame is INCONCLUSIVE, never PASS". A PASS that carries a blank-frame delta is
  // REFUSED at the ledger — not warned about, not softened.
  const blankDeltas = deltas.filter((d) => /FRAME_BLANK|RUN_FAILED|NO_GEOMETRY/.test(String(d)));
  if (blankDeltas.length && (row.readerVerdict === 'PASS' || row.orchestratorVerdict === 'PASS')) {
    throw Object.assign(
      new Error(`PASS refused: the row carries ${blankDeltas.join(', ')} — a blank or failed frame is INCONCLUSIVE, never PASS`),
      { code: 'VIL_ROW_INVALID', field: 'verdict', deltas: blankDeltas },
    );
  }
  const out = {
    week,
    pineSha: row.pineSha,
    pngSha: row.pngSha,
    readerVerdict: row.readerVerdict ?? 'PENDING',
    orchestratorVerdict: row.orchestratorVerdict ?? null,
    deltas: Array.isArray(row.deltas) ? row.deltas : [],
    createdAt: row.createdAt || new Date().toISOString(),
    ref: row.ref ?? null,
    pair: row.pair ?? null,
    timeframe: row.timeframe ?? null,
    engine: row.engine ?? null,
    counts: row.counts ?? null,
    pngPath: row.pngPath ?? null,
    runMs: Number.isFinite(row.runMs) ? row.runMs : null,
    railVersion: VERSION,
  };
  fs.mkdirSync(VIL_DIR, { recursive: true, mode: 0o755 });
  const file = path.join(VIL_DIR, `${week}.jsonl`);
  const line = JSON.stringify(out) + '\n';
  fs.appendFileSync(file, line, { mode: 0o644 });
  return { path: file, bytes: Buffer.byteLength(line), count: readRows(week).rows.length, row: out };
}

// ── THE LOOK (the independent reader) ────────────────────────────────────────
// The local vision seat (Qwen3.5-4B + mmproj, :4171, OpenAI-compatible). It is asked ONE
// closed question about the canon render's visual contract and must answer on a fixed
// `VERDICT:` line. Anything it cannot answer in that shape is INCONCLUSIVE — never PASS.
// The mechanical blank-frame check runs BEFORE this (gate.judge), because the seat is
// measured to confabulate on a blank frame (runtime ledger RT-2).
const READER_URL = process.env.PLUTUS_VIL_READER_URL || 'http://127.0.0.1:4171/v1/chat/completions';
const READER_PROMPT = [
  'You are a strict visual verifier. You are shown ONE chart screenshot.',
  'Answer only from what is visibly present in the image. Do not guess.',
  'IGNORE the chart chrome: the price scale on the right edge, the coloured price TAG boxes on that',
  'scale, the dotted last-price line, the time axis, the logo, and plotted indicator curves. Those are',
  'NOT zones and NOT labels. A zone is a filled rectangle drawn INSIDE the price area spanning time.',
  'Check each item and answer YES or NO:',
  'Q1: price candlesticks are visible.',
  'Q2: filled horizontal rectangular zones (coloured boxes) are drawn across the price area.',
  'Q3: text labels are drawn on or next to those zones.',
  'Q4: horizontal lines are drawn across the chart (for example amber/orange lines).',
  'Then give the verdict: PASS only if Q1 AND Q2 AND Q3 are YES; FAIL if Q1 is YES but Q2 or Q3 is NO;',
  'INCONCLUSIVE if the image is empty, unreadable, or not a price chart.',
  'Reply in EXACTLY this format, nothing else:',
  'Q1: YES|NO', 'Q2: YES|NO', 'Q3: YES|NO', 'Q4: YES|NO',
  'VERDICT: PASS|FAIL|INCONCLUSIVE', 'EVIDENCE: <one sentence naming what you see>',
].join('\n');

async function lookAt(pngBase64) {
  const body = {
    model: 'reader',
    temperature: 0,
    max_tokens: 220,
    chat_template_kwargs: { enable_thinking: false },
    messages: [{ role: 'user', content: [
      { type: 'image_url', image_url: { url: 'data:image/png;base64,' + pngBase64 } },
      { type: 'text', text: READER_PROMPT },
    ] }],
  };
  const t0 = Date.now();
  const r = await fetch(READER_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body), signal: AbortSignal.timeout(120000) });
  if (!r.ok) throw Object.assign(new Error('reader HTTP ' + r.status), { code: 'READER_HTTP_' + r.status });
  const j = await r.json();
  const text = String(j?.choices?.[0]?.message?.content || '').trim();
  const m = text.match(/VERDICT:\s*(PASS|FAIL|INCONCLUSIVE)/i);
  const answers = {};
  for (const q of ['Q1', 'Q2', 'Q3', 'Q4']) {
    const a = text.match(new RegExp(q + ':\\s*(YES|NO)', 'i'));
    answers[q] = a ? a[1].toUpperCase() : null;
  }
  let verdict = m ? m[1].toUpperCase() : 'INCONCLUSIVE';
  // THE CONSISTENCY LAW: a PASS whose own answers do not support it is not a PASS.
  if (verdict === 'PASS' && !(answers.Q1 === 'YES' && answers.Q2 === 'YES' && answers.Q3 === 'YES')) verdict = 'INCONCLUSIVE';
  const ev = text.match(/EVIDENCE:\s*(.+)/i);
  return {
    verdict, answers, model: j.model || READER_URL, ms: Date.now() - t0,
    note: (ev ? ev[1].trim() : '') || (m ? '' : 'READER_UNPARSEABLE: ' + text.slice(0, 160)),
    raw: text.slice(0, 600),
  };
}

const VERSION = '1.0.0';

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const route = url.pathname.replace(/\/+$/, '') || '/';
  if (req.method === 'OPTIONS') return send(res, 204, {});
  try {
    if (route === '/health') {
      const st = await stationFetch('/health', {}, 4000);
      return ok(res, {
        service: 'vil-rail', version: VERSION, pid: process.pid, port: PORT, uptimeMs: Date.now() - STARTED,
        station: { url: STATION, up: st.ok, health: st.ok ? st.json.data : null, code: st.ok ? null : st.code, error: st.ok ? null : st.error },
        vilDir: VIL_DIR, evidenceDir: EVIDENCE_DIR, pineDir: PINE_DIR, roots: artifactRoots(),
        canon: Object.fromEntries(Object.entries(CANON).map(([k, v]) => [k, { path: v.path, present: fs.existsSync(v.path), sha256: v.sha256 }])),
      });
    }

    if (route === '/artifacts') return ok(res, listArtifacts());

    if (route === '/artifact') {
      const a = resolveArtifact(url.searchParams.get('ref'));
      return ok(res, { ref: a.ref, sha256: a.sha256, bytes: a.bytes, path: a.path, canon: a.canon, week: a.week, source: a.source, lines: a.source.split('\n').length });
    }

    if (route === '/catalog') {
      const st = await stationFetch('/catalog', {}, 8000);
      if (!st.ok) return fail(res, st.code || 'PINE_STATION_DOWN', st.error || 'catalog unavailable', { station: STATION });
      return ok(res, st.json.data);
    }

    if (route === '/bars') {
      const q = url.searchParams;
      const qs = new URLSearchParams({
        pair: q.get('pair') || 'EUR/USD',
        timeframe: q.get('timeframe') || '1H',
        ...(q.get('limit') ? { limit: q.get('limit') } : {}),
      });
      const st = await stationFetch(`/bars?${qs}`, {}, 15000);
      if (!st.ok) return fail(res, st.code || 'PINE_STATION_DOWN', st.error || 'bars unavailable', { station: STATION });
      return ok(res, st.json.data);
    }

    if (req.method === 'POST' && route === '/station/run') {
      const raw = await readBody(req);
      let body;
      try { body = raw ? JSON.parse(raw) : {}; } catch (e) { return fail(res, 'VIL_ROW_INVALID', `body is not JSON: ${e.message}`); }

      let artifact = null;
      if (!body.script && body.ref) {
        try { artifact = resolveArtifact(body.ref); } catch (e) { return fail(res, e.code || 'VIL_ARTIFACT_ABSENT', e.message, { roots: e.roots, path: e.path }); }
      }
      const script = body.script || (artifact && artifact.source);
      if (!script) return fail(res, 'VIL_ROW_INVALID', 'script or ref is required');

      const payload = {
        script,
        pair: body.pair || 'EUR/USD',
        timeframe: body.timeframe || '1H',
        symbol: body.symbol || String(body.pair || 'EUR/USD').replace('/', ''),
        ...(body.limit ? { limit: body.limit } : {}),
        ...(body.maxPoints ? { maxPoints: body.maxPoints } : {}),
        ...(Array.isArray(body.bars) ? { bars: body.bars } : {}),
        ...(body.dataFile ? { dataFile: body.dataFile } : {}),
      };
      const t0 = Date.now();
      const st = await stationFetch('/run', { method: 'POST', body: payload });
      const elapsedMs = Date.now() - t0;
      const sha = sha256(Buffer.from(script, 'utf8'));
      if (!st.ok) {
        const j = st.json || {};
        return send(res, 200, {
          success: false,
          code: j.code || st.code || 'PINE_RUN_FAILED',
          error: j.error || st.error || 'station run failed',
          line: j.line ?? null, column: j.column ?? null,
          elapsedMs, pineSha: sha, station: STATION, artifact: artifact ? { ref: artifact.ref, path: artifact.path, canon: artifact.canon } : null,
        });
      }
      return ok(res, Object.assign({}, st.json.data, {
        elapsedMs, pineSha: sha, station: STATION,
        artifact: artifact ? { ref: artifact.ref, path: artifact.path, canon: artifact.canon, sha256: artifact.sha256 } : null,
      }));
    }

    if (route === '/vil/look') {
      if (req.method !== 'POST') return fail(res, 'VIL_METHOD_INVALID', 'POST only');
      let b; try { b = JSON.parse(await readBody(req) || '{}'); } catch (e) { return fail(res, 'VIL_ROW_INVALID', 'body is not JSON'); }
      const png = String(b.image_base64 || b.pngBase64 || '').replace(/^data:[^,]*,/, '');
      if (!png) return fail(res, 'VIL_CAPTURE_EMPTY', 'no image_base64');
      try { return ok(res, await lookAt(png)); }
      catch (e) { return ok(res, { verdict: 'PENDING', note: 'READER_DOWN: ' + e.message, code: e.code || 'READER_DOWN', model: null }); }
    }
    if (route === '/vil/rows') {
      const r = readRows(url.searchParams.get('week'));
      return ok(res, { week: r.week, file: r.file, count: r.rows.length, rows: r.rows, unlooked: r.rows.length === 0 });
    }

    if (req.method === 'POST' && route === '/vil/row') {
      const raw = await readBody(req);
      let body;
      try { body = raw ? JSON.parse(raw) : {}; } catch (e) { return fail(res, 'VIL_ROW_INVALID', `body is not JSON: ${e.message}`); }
      try { return ok(res, appendRow(body)); } catch (e) { return fail(res, e.code || 'VIL_ROW_INVALID', e.message, { field: e.field }); }
    }

    if (req.method === 'POST' && route === '/vil/capture') {
      const raw = await readBody(req);
      let body;
      try { body = raw ? JSON.parse(raw) : {}; } catch (e) { return fail(res, 'VIL_ROW_INVALID', `body is not JSON: ${e.message}`); }
      const b64 = String(body.pngBase64 || '').replace(/^data:image\/png;base64,/, '');
      if (!b64) return fail(res, 'VIL_CAPTURE_EMPTY', 'pngBase64 is required');
      const buf = Buffer.from(b64, 'base64');
      if (!buf.length) return fail(res, 'VIL_CAPTURE_EMPTY', 'decoded PNG is empty');
      const isPng = buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
      if (!isPng) return fail(res, 'VIL_CAPTURE_EMPTY', `not a PNG (first bytes ${buf.slice(0, 4).toString('hex')})`);
      const name = String(body.name || `capture-${Date.now()}`).replace(/[^A-Za-z0-9._-]/g, '_').replace(/\.png$/i, '') + '.png';
      fs.mkdirSync(EVIDENCE_DIR, { recursive: true, mode: 0o755 });
      const file = path.join(EVIDENCE_DIR, name);
      fs.writeFileSync(file, buf, { mode: 0o644 });
      return ok(res, { path: file, name, sha256: sha256(buf), bytes: buf.length });
    }

    return fail(res, 'VIL_ROUTE_ABSENT', `no route ${req.method} ${route}`);
  } catch (e) {
    return fail(res, e.code || 'VIL_RAIL_ERROR', e.message);
  }
});

function listen(idx) {
  PORT = PORTS[idx];
  server.once('error', (e) => {
    if (e.code === 'EADDRINUSE' && idx + 1 < PORTS.length) {
      log(`port ${PORT} in use → trying ${PORTS[idx + 1]}`);
      return listen(idx + 1);
    }
    console.error('[VIL-RAIL] server error:', e.message);
    process.exit(1);
  });
  server.listen(PORT, HOST, () => {
    ensureDirs();
    log(`listening on http://${HOST}:${PORT} (pid ${process.pid})`);
    log(`station=${STATION} vil=${VIL_DIR} evidence=${EVIDENCE_DIR}`);
    log(`canon v8 present=${fs.existsSync(CANON['canon:v8'].path)}`);
  });
}
listen(0);

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => { log(`${sig} — closing`); server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 1500); });
}
