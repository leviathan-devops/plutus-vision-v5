/**
 * surface.js — THE AGENT SURFACES (windows of the SAME Electron app, on the
 * agent compositor's Xwayland display).
 *
 * One process per surface:
 *   --plutus-surface=chart    → the Vela candles (served by the dashboard API)
 *   --plutus-surface=browser  → the agent's headed browser (persistent profile)
 *
 * WHY A SECOND PROCESS: an X11 client belongs to ONE display per connection;
 * the dashboard talks :1, the surfaces must talk the compositor's display.
 * Electron IS Chromium (32 §2: no second browser runtime) — the same binary,
 * the same app, a different DISPLAY.
 *
 * THE PERSISTENT-COOKIE PATH (defect 2): the browser surface runs on a
 * PERSISTENT partition inside a PERSISTENT userData dir, so logins survive a
 * full dashboard restart. At boot it seeds the TradingView cookies from the
 * operator's captured profile (`dashboard/tv-browser-profile`, the profile
 * 30 §2 measured: 11 TV cookies incl. `sessionid`, Basic-store encrypted),
 * decrypting them with Chromium's Basic-store key. No credentials, no paste.
 *
 * CONTROL CONTRACT (loopback only — the dashboard drives the surface):
 *   GET /status           → { url, title, state }
 *   chart:  /pair?symbol=, /tf?tf=, /draw?...   /clear
 *   browser:/navigate?url=, /back, /forward, /reload, /tv-state
 *   both:   /cookie/set?name=&value=, /cookie/get?name=
 */

'use strict';

const { app, BrowserWindow, session } = require('electron');
const http = require('http');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const APP_ROOT = path.join(__dirname, '..');
const MAIN_API = process.env.PLUTUS_MAIN_API || 'http://127.0.0.1:9430';
const SOURCE_PROFILE = process.env.PLUTUS_TV_PROFILE || path.join(APP_ROOT, 'tv-browser-profile');
const PARTITION = process.env.PLUTUS_SURFACE_PARTITION || 'persist:w6r-browser';

// ─────────────────────────────────────────────────────────────
// THE CHART-TOOLS DOOR (agents overhaul, 2026-10-05)
//
// Handlers under /tool/* drive the PAGE ITSELF through CDP - over Electron's own in-process debugger, so there is no
// remote-debugging port and no second browser (the TV MCP's five calls - mouse, key, insertText, Runtime.evaluate,
// captureScreenshot - are exactly what this exposes). They are TOKEN-GATED: the secret is minted by the main process
// (electron/chart-agent/token.js), handed to the surface through the environment at spawn, and read by the chart-agent
// proxy from a 0600 file. Every other route of this server is unchanged.
// ─────────────────────────────────────────────────────────────
const CHART_TOKEN = process.env.PLUTUS_CHART_TOKEN || '';
const TOOL_PREFIX = 'tool/';
/** the ONLY CDP methods the door will forward - anything else is refused by name */
const CDP_ALLOW = new Set(['Input.dispatchMouseEvent', 'Input.dispatchKeyEvent', 'Input.insertText', 'Runtime.evaluate', 'Page.captureScreenshot', 'Page.navigate', 'Page.enable']);
const TV_URL_RE = /^https:\/\/([a-z0-9-]+\.)*tradingview\.com([/?#]|$)/i;

function tokenOk(req) {
  const got = String(req.headers['x-chart-token'] || '');
  if (!CHART_TOKEN || got.length !== CHART_TOKEN.length) return false;
  try { return crypto.timingSafeEqual(Buffer.from(got), Buffer.from(CHART_TOKEN)); } catch (e) { return false; }
}

function readJsonBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let n = 0;
    req.on('data', (c) => {
      n += c.length;
      if (n > limit) { reject(Object.assign(new Error('request body too large'), { code: 'BODY_TOO_LARGE' })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!n) return resolve(null);
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch (e) { reject(Object.assign(new Error('body is not JSON'), { code: 'BAD_JSON' })); }
    });
    req.on('error', reject);
  });
}

/** one allowlisted CDP command against THIS surface's page (the debugger attaches lazily and re-attaches after a detach) */
async function cdpCall(win, kind, body) {
  const method = body && body.method;
  if (typeof method !== 'string' || !CDP_ALLOW.has(method)) {
    throw Object.assign(new Error(`CDP method ${JSON.stringify(String(method)).slice(0, 60)} is not on the chart-tools allowlist`), { code: 'CDP_METHOD_REFUSED' });
  }
  const params = body.params && typeof body.params === 'object' ? body.params : {};
  if (method === 'Page.navigate' && (kind !== 'browser' || !TV_URL_RE.test(String(params.url || '')))) {
    throw Object.assign(new Error('Page.navigate is allowed only on the TradingView surface, and only to tradingview.com'), { code: 'CDP_NAVIGATE_REFUSED' });
  }
  const dbg = win.webContents.debugger;
  if (!dbg.isAttached()) dbg.attach('1.3');
  return Promise.race([
    dbg.sendCommand(method, params),
    new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error('CDP timeout: ' + method), { code: 'CDP_TIMEOUT' })), 15000)),
  ]);
}

function log(...a) { console.log('[SURFACE]', ...a); }
function arg(name, dflt) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : dflt;
}

// ─────────────────────────────────────────────────────────────
// Chromium Basic-store cookie decryption (no keyring needed: the captured
// profile used the "peanuts" store — measured: every TV cookie is 0x763130
// ("v10") + AES-128-CBC under PBKDF2('peanuts','saltysalt')).
// ─────────────────────────────────────────────────────────────
function basicStoreKey() {
  return crypto.pbkdf2Sync('peanuts', 'saltysalt', 1, 16, 'sha1');
}

function decryptV10(blob, key) {
  if (!blob || blob.length < 3) return null;
  if (blob.slice(0, 3).toString('latin1') !== 'v10') return null;
  try {
    const iv = Buffer.alloc(16, ' ');
    const d = crypto.createDecipheriv('aes-128-cbc', key, iv);
    const out = Buffer.concat([d.update(blob.slice(3)), d.final()]);
    return out.toString('utf8');
  } catch (e) {
    return null;
  }
}

function readSourceCookies(dbPath) {
  if (!fs.existsSync(dbPath)) return [];
  const sql = "SELECT host_key,name,path,expires_utc,is_secure,is_httponly,value,hex(encrypted_value) AS ev,CAST(last_update_utc AS TEXT) AS lu FROM cookies";
  let raw = null;
  try {
    raw = execFileSync('sqlite3', ['-json', dbPath, sql], { encoding: 'utf8', timeout: 15000, maxBuffer: 32 * 1024 * 1024 });
  } catch (e) {
    return [];
  }
  try { return JSON.parse(raw || '[]'); } catch (e) { return []; }
}

/** Seed the captured TradingView login into a persistent Electron session.
 *
 *  TWO MEASURED GUARDS (2026-10-02, the "chart tab is blank" defect):
 *  1. THE PARTITION WINS. The surfaces run on a PERSISTENT partition whose cookies survive runs —
 *     if it already holds a TradingView sessionid, the captured profile must NEVER re-seed over it.
 *     (Measured: the capture was re-applied on every launch, shadowing whatever fresh state the
 *     partition had.)
 *  2. THE CAPTURE MUST BE FRESH. A 63-day-old captured sessionid had been revoked server-side; TV's
 *     chart datafeed answered every request with 'Protocol error. Reason=bad auth token.' in a 6s
 *     loop (blank candle pane). An anonymous chart beats a poisoned one: a sessionid/sessionid_sign
 *     pair whose last_update_utc is older than MAX_AGE is skipped with a NAMED log line. */
async function seedTradingViewCookies(sess) {
  const MAX_AGE_MS = 7 * 24 * 3600 * 1000;
  try {
    const existing = await sess.cookies.get({ domain: '.tradingview.com', name: 'sessionid' });
    if (existing && existing.length) {
      log('cookie seed: partition already holds a TradingView sessionid — captured profile skipped (PARTITION_HAS_SESSION)');
      return { source: '(partition)', read: 0, injected: 0, failed: 0, names: [], skipped: 'PARTITION_HAS_SESSION' };
    }
  } catch (e) { /* a cookie read failure must not block the seed */ }
  const dbPath = path.join(SOURCE_PROFILE, 'Default', 'Cookies');
  const rows = readSourceCookies(dbPath);
  const key = basicStoreKey();
  const nowMs = Date.now();
  const stats = { source: dbPath, read: rows.length, injected: 0, failed: 0, names: [], stale: [] };
  for (const r of rows) {
    if (r.name === 'sessionid' || r.name === 'sessionid_sign') {
      const lu = Number(r.lu) || 0;
      const ageMs = lu ? nowMs - (lu / 1000 - 11644473600000) : Infinity;
      if (ageMs > MAX_AGE_MS) { stats.failed++; stats.stale.push(r.name); continue; }
    }
    let value = r.value && r.value.length ? r.value : null;
    if (!value && r.ev) value = decryptV10(Buffer.from(r.ev, 'hex'), key);
    if (!value) { stats.failed++; continue; }
    const host = String(r.host_key || '').replace(/^\./, '');
    if (!host) { stats.failed++; continue; }
    const domain = r.host_key.startsWith('.') ? r.host_key : host;
    try {
      await sess.cookies.set({
        url: `https://${host}${r.path || '/'}`,
        name: r.name,
        value,
        domain,
        path: r.path || '/',
        secure: !!r.is_secure,
        httpOnly: !!r.is_httponly,
        expirationDate: r.expires_utc ? Math.floor(Number(r.expires_utc) / 1e6) - 11644473600 : undefined,
      });
      stats.injected++;
      stats.names.push(r.name);
    } catch (e) {
      stats.failed++;
    }
  }
  if (stats.stale.length) log(`cookie seed: STALE auth pair skipped (${stats.stale.join(',')}) — the surface runs anonymous until a fresh login inside the embed (its partition persists)`);
  log(`cookie seed: read=${stats.read} injected=${stats.injected} failed=${stats.failed}`);
  return stats;
}

// ─────────────────────────────────────────────────────────────
// The control server (loopback)
// ─────────────────────────────────────────────────────────────
function startControlServer(port, handlers) {
  const server = http.createServer(async (req, res) => {
    const u = new URL(req.url, `http://127.0.0.1:${port}`);
    const key = u.pathname.replace(/^\//, '');
    const send = (obj, code = 200) => {
      const body = JSON.stringify(obj);
      res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(body);
    };
    try {
      const fn = handlers[key];
      if (!fn) return send({ success: false, error: `no route /${key}` }, 404);
      if (key.startsWith(TOOL_PREFIX) && !tokenOk(req)) return send({ success: false, error: 'the chart-tools door needs the chart token', code: 'CHART_TOKEN_REQUIRED' }, 401);
      const body = req.method === 'POST' ? await readJsonBody(req, 4 * 1024 * 1024) : null;
      const out = await fn(u.searchParams, body);
      return send({ success: true, data: out });
    } catch (e) {
      return send({ success: false, error: e.message, code: e.code || 'SURFACE_ERROR' }, (e.code === 'BAD_JSON' || e.code === 'BODY_TOO_LARGE') ? 400 : 500);
    }
  });
  server.listen(port, '127.0.0.1', () => log(`control server on http://127.0.0.1:${port}`));
  server.on('error', (e) => log('control server error:', e.message));
  return server;
}

// ─────────────────────────────────────────────────────────────
// Boot
// ─────────────────────────────────────────────────────────────
function runSurface() {
  const kind = arg('plutus-surface', process.env.PLUTUS_SURFACE || 'chart');
  const url = arg('plutus-surface-url', process.env.PLUTUS_SURFACE_URL || '');
  const port = parseInt(arg('plutus-surface-port', process.env.PLUTUS_SURFACE_PORT || (kind === 'browser' ? '9432' : '9433')), 10);
  const userData = process.env.PLUTUS_SURFACE_USERDATA || path.join(APP_ROOT, '.w6r-profile');
  // The profile holds LIVE cookies (the measured store writes them with a
  // populated `value` column — Chromium's plaintext fallback on this host).
  // Keep it owner-only, always: 0700 on the dir, 0600 on the cookie DB.
  fs.mkdirSync(userData, { recursive: true, mode: 0o700 });
  try { fs.chmodSync(userData, 0o700); } catch (e) { /* best effort */ }
  app.setPath('userData', userData);

  // Software compositing: the surfaces render under nested Weston's Xwayland.
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-dev-shm-usage');
  app.commandLine.appendSwitch('use-gl', 'swiftshader');

  let win = null;
  const W = parseInt(process.env.PLUTUS_SURFACE_W || '1600', 10);
  const H = parseInt(process.env.PLUTUS_SURFACE_H || '900', 10);

  app.whenReady().then(async () => {
    const sess = session.fromPartition(PARTITION);
    const screen = require('electron').screen;
    const disp = screen.getPrimaryDisplay();
    const bounds = { x: 0, y: 0, width: Math.max(W, disp.bounds.width), height: Math.max(H, disp.bounds.height) };

    win = new BrowserWindow({
      ...bounds,
      show: false,
      frame: false,
      backgroundColor: '#0B0B0C',
      title: kind === 'chart' ? 'PLUTUS-CHART' : 'PLUTUS-BROWSER',
      webPreferences: {
        partition: PARTITION,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        backgroundThrottling: false,
      },
    });
    win.setMenuBarVisibility(false);
    win.once('ready-to-show', () => win.show());
    win.on('closed', () => { win = null; });

    const exec = (js) => win.webContents.executeJavaScript(js, true);

    const handlers = {
      status: async () => ({
        kind,
        url: win.webContents.getURL(),
        title: win.webContents.getTitle(),
        display: process.env.DISPLAY,
        userData,
        partition: PARTITION,
        state: kind === 'chart' ? await exec('window.PlutusChart ? window.PlutusChart.state() : null') : null,
      }),
      'cookie/set': async (q) => {
        const name = q.get('name');
        const value = q.get('value');
        await sess.cookies.set({ url: `${MAIN_API}/`, name, value, expirationDate: Math.floor(Date.now() / 1000) + 30 * 24 * 3600 });
        return { set: name };
      },
      'cookie/get': async (q) => {
        const all = await sess.cookies.get({ url: `${MAIN_API}/` });
        const hit = all.find((c) => c.name === q.get('name'));
        return hit ? { name: hit.name, value: hit.value, persistent: !!hit.expirationDate, expires: hit.expirationDate } : null;
      },
      'cookies/list': async () => {
        const all = await sess.cookies.get({});
        return { count: all.length, tradingview: all.filter((c) => /tradingview/.test(c.domain)).map((c) => c.name) };
      },
      // ── THE STUDY DOOR (additive, 2026-09-29) ──────────────────────────
      // The chart's own page owns the pine wiring (it holds the bars and the
      // drawings). These three routes are the host's handle on it: run a catalog
      // study by id, run the CANON lane (SHELL_ANCHOR §16), or re-run whatever is
      // active — which is what the [TradingView | Self-Hosted] toggle's SELF
      // refresh (step 3 of §10's state machine) calls.
      study: async (q) => exec(`window.PlutusChart ? window.PlutusChart.applyStudy(${JSON.stringify(q.get('id') || '')}) : null`),
      canon: async () => exec('window.PlutusChart ? window.PlutusChart.runCanon() : null'),
      rerun: async () => exec('window.PlutusChart ? window.PlutusChart.rerunActive() : null'),
      source: async (q) => exec(`window.PlutusChart ? window.PlutusChart.runStudySource(${JSON.stringify(q.get('script') || '')}) : null`),
      // ── THE CHART-TOOLS DOOR (token-gated: see tokenOk) ──
      'tool/cdp': async (q, body) => cdpCall(win, kind, body),
      'tool/screenshot': async () => {
        const r = await cdpCall(win, kind, { method: 'Page.captureScreenshot', params: { format: 'png' } });
        return { png_base64: r.data, kind, url: win.webContents.getURL() };
      },
    };

    if (kind === 'chart') {
      Object.assign(handlers, {
        reload: async () => { win.webContents.reload(); return true; },
        pair: async (q) => exec(`window.PlutusChart.setPair(${JSON.stringify(q.get('symbol') || 'EURUSD')})`),
        tf: async (q) => exec(`window.PlutusChart.setTimeframe(${JSON.stringify(q.get('tf') || '1H')})`),
        'frame-week': async () => exec('window.PlutusChart.frameWeek()'),
        clear: async () => exec('window.PlutusChart.clearDrawings()'),
        draw: async (q) => {
          const spec = JSON.parse(q.get('spec') || '{}');
          const calls = [];
          if (spec.boxes) for (const b of spec.boxes) calls.push(`window.PlutusChart.drawBox(${JSON.stringify(b.a)},${JSON.stringify(b.b)},${JSON.stringify(b.style || null)})`);
          if (spec.lines) for (const l of spec.lines) calls.push(`window.PlutusChart.drawLine(${JSON.stringify(l.a)},${JSON.stringify(l.b)},${JSON.stringify(l.style || null)})`);
          if (spec.hlines) for (const h of spec.hlines) calls.push(`window.PlutusChart.drawHLine(${JSON.stringify(h.price)},${JSON.stringify(h.style || null)})`);
          if (spec.labels) for (const l of spec.labels) calls.push(`window.PlutusChart.drawLabel(${JSON.stringify(l.at)},${JSON.stringify(l.text)},${JSON.stringify(l.style || null)})`);
          if (spec.markers) for (const m of spec.markers) calls.push(`window.PlutusChart.drawMarker(${JSON.stringify(m.at)},${JSON.stringify(m.glyph || 'circle')})`);
          if (!calls.length) return { ok: false, code: 'DRAW_SPEC_EMPTY' };
          return exec(`[${calls.join(',')}]`);
        },
      });
      await win.loadURL(url || `${MAIN_API}/chart/?pair=EURUSD&tf=1H`);
    } else {
      // THE PERSISTENT LOGIN (defect 2): seed the captured TV session first.
      let seed = { injected: 0 };
      try { seed = await seedTradingViewCookies(sess); } catch (e) { log('cookie seed failed:', e.message); }
      handlers.seed = async () => seed;
      handlers['tv-state'] = async () => {
        const text = await exec('document.body ? document.body.innerText.slice(0, 6000) : ""');
        const loginWall = /Look first|Join for free|Sign in to TradingView/i.test(text);
        return {
          url: win.webContents.getURL(),
          title: win.webContents.getTitle(),
          loginWall,
          verdict: loginWall ? 'TV_LOGIN_EXPIRED' : 'LOGGED_IN',
          excerpt: text.slice(0, 300),
        };
      };
      Object.assign(handlers, {
        navigate: async (q) => { await win.loadURL(q.get('url')); return { url: win.webContents.getURL() }; },
        back: async () => { if (win.webContents.navigationHistory.canGoBack()) win.webContents.navigationHistory.goBack(); return true; },
        forward: async () => { if (win.webContents.navigationHistory.canGoForward()) win.webContents.navigationHistory.goForward(); return true; },
        reload: async () => { win.webContents.reload(); return true; },
      });
      await win.loadURL(url || 'https://www.tradingview.com/chart/');
    }

    startControlServer(port, handlers);
    log(`surface ${kind} ready on ${process.env.DISPLAY} url=${win.webContents.getURL()}`);
  });

  app.on('window-all-closed', () => app.quit());
}

module.exports = { runSurface, seedTradingViewCookies, decryptV10, basicStoreKey };
