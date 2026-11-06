/**
 * plutus-browser — the PLUTUS dashboard's web-research surface as a self-contained, ephemeral runtime.
 *
 * ONE headed Electron window, ONE page, ONE loopback control server. Nothing else from the dashboard
 * (no API, no SQLite, no children, no renderer shell). Forked 2026-11-06 from the dashboard's LIVE
 * handlers (dashboard/electron/view-surfaces.js) and its standalone window boot (dashboard/electron/surface.js);
 * see upstream/PROVENANCE.md for the source SHAs. The source repo was never written.
 *
 * WHY HEADED: investinglive.com refuses headless browsers ("blocks headless browsers with 403/CloudFront",
 * Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:813; Cloudflare Browser Run measured 403 on 2026-11-06).
 *
 * INPUTS — each has exactly ONE source; a missing one is a NAMED REFUSAL and a nonzero exit, never a substitute:
 *   --port=<n>        the control-server port (loopback only)
 *   DISPLAY           the X display the window paints on
 *   TOKEN_FILE        ~/.plutus-browser/token (0600) — every route except /health requires `Authorization: Bearer <token>`
 *
 * ROUTES (JSON: {success, data} | {success:false, error, code}):
 *   GET  /health                     no auth; liveness only (no URL, no title, no page data)
 *   GET  /status                     url, title, loading, display
 *   GET  /bookmarks                  the dashboard's 4 quick links
 *   GET  /navigate?url=              http(s) only
 *   GET  /back · /forward · /reload  Electron 28 canGoBack/goBack (the live handler, not navigationHistory)
 *   GET  /viewport                   the measured viewport
 *   GET  /capture                    the window as PNG base64
 *   GET  /eval?js=                   one expression, <= 20000 chars
 *   GET  /images                     every <img> on the page: {src, w, h, alt}
 *   POST /input                      {type:'click'|'key'|'text', ...}
 */
'use strict';

const { app, BrowserWindow, session } = require('electron');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

class Refusal extends Error {
  constructor(msg) { super(msg); this.code = String(msg).split(':')[0]; }
}

const TOKEN_FILE = path.join(os.homedir(), '.plutus-browser', 'token');
const USER_DATA = path.join(os.homedir(), '.plutus-browser', 'profile');
const PARTITION = 'persist:plutus-browser';
const BOOKMARKS = [
  { label: 'TRADINGVIEW', url: 'https://www.tradingview.com/chart/' },
  { label: 'FX CALENDAR', url: 'https://www.forexfactory.com/calendar' },
  { label: 'INVESTING ORDERS', url: 'https://investinglive.com/Orders/' },
  { label: 'TV MARKETS', url: 'https://www.tradingview.com/markets/currencies/' },
];
const HOME = 'https://www.forexfactory.com/calendar';

function log(...a) { console.log('[plutus-browser]', ...a); }

function argValue(name) {
  const hit = process.argv.find((a) => a.indexOf(`--${name}=`) === 0);
  return hit ? hit.slice(name.length + 3) : null;
}

/** every required input, each from ONE source, refused by name when missing */
function requireInputs() {
  const portRaw = argValue('port');
  if (!portRaw) throw new Refusal('PLUTUS_BROWSER_PORT_UNAVAILABLE: no --port=<n> argument - pass the control-server port, e.g. --port=9470');
  const port = Number(portRaw);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Refusal(`PLUTUS_BROWSER_PORT_UNAVAILABLE: --port=${portRaw} is not an integer in 1024..65535 - pass a valid port`);

  const display = process.env.DISPLAY;
  if (!display) throw new Refusal('PLUTUS_BROWSER_DISPLAY_UNAVAILABLE: DISPLAY is not set - launch inside a headed display (computer tool shell_up / agent-display.sh), never on a guessed one');

  let token;
  try { token = fs.readFileSync(TOKEN_FILE, 'utf8').trim(); }
  catch (e) { throw new Refusal(`PLUTUS_BROWSER_TOKEN_UNAVAILABLE: ${TOKEN_FILE} is unreadable (${e.code || e.message}) - create it: mkdir -p ~/.plutus-browser && openssl rand -hex 32 > ${TOKEN_FILE} && chmod 600 ${TOKEN_FILE}`); }
  if (!/^[0-9a-f]{64}$/.test(token)) throw new Refusal(`PLUTUS_BROWSER_TOKEN_UNAVAILABLE: ${TOKEN_FILE} does not hold 64 hex chars - regenerate it with openssl rand -hex 32`);
  const mode = fs.statSync(TOKEN_FILE).mode & 0o777;
  if (mode & 0o077) throw new Refusal(`PLUTUS_BROWSER_TOKEN_UNAVAILABLE: ${TOKEN_FILE} is mode ${mode.toString(8)}, readable by others - chmod 600 ${TOKEN_FILE}`);

  return { port, display, token };
}

/** a CALLER's mistake is a 4xx; only a surface fault is a 5xx (from view-surfaces.js:38-45) */
const CALLER_CODES = new Set(['URL_INVALID', 'URL_SCHEME_REFUSED', 'BODY_TOO_LARGE', 'BAD_JSON', 'INPUT_INVALID', 'EVAL_EMPTY', 'EVAL_TOO_LONG']);
function statusFor(code) {
  if (code === 'ROUTE_UNKNOWN') return 404;
  if (code === 'AUTH_REQUIRED') return 401;
  if (CALLER_CODES.has(code)) return 400;
  return 500;
}
function coded(code, message) { return Object.assign(new Error(`${code}: ${message}`), { code }); }

/** only http(s) pages are ever loaded (view-surfaces.js:50-55) */
function webUrl(raw) {
  let u;
  try { u = new URL(String(raw || '')); } catch (e) { throw coded('URL_INVALID', JSON.stringify(String(raw)).slice(0, 120)); }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw coded('URL_SCHEME_REFUSED', `${u.protocol} - http/https only`);
  return u.toString();
}

function buildHandlers(win, display) {
  const wc = win.webContents;
  const exec = (js) => wc.executeJavaScript(js, true);
  return {
    status: async () => ({ url: wc.getURL(), title: wc.getTitle(), loading: wc.isLoading(), display, partition: PARTITION }),
    bookmarks: async () => BOOKMARKS,
    viewport: async () => ({ bounds: win.getContentBounds(), inner: await exec('({ w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio })'), url: wc.getURL() }),
    navigate: async (q) => { await wc.loadURL(webUrl(q.get('url'))); return { url: wc.getURL(), title: wc.getTitle() }; },
    // Electron 28 API (view-surfaces.js:139-140). surface.js's navigationHistory is Electron 31+ and threw (BUILD_REPORT.md:611-614).
    back: async () => { if (wc.canGoBack()) wc.goBack(); return { url: wc.getURL(), canGoBack: wc.canGoBack() }; },
    forward: async () => { if (wc.canGoForward()) wc.goForward(); return { url: wc.getURL(), canGoForward: wc.canGoForward() }; },
    reload: async () => { wc.reload(); return true; },
    input: async (q, body) => {
      const b = body || {};
      if (b.type === 'click') {
        const x = Math.round(Number(b.x)), y = Math.round(Number(b.y));
        if (!Number.isFinite(x) || !Number.isFinite(y)) throw coded('INPUT_INVALID', 'click needs finite x and y');
        wc.sendInputEvent({ type: 'mouseDown', x, y, button: 'left', clickCount: 1 });
        wc.sendInputEvent({ type: 'mouseUp', x, y, button: 'left', clickCount: 1 });
        return { sent: 'click', x, y };
      }
      if (b.type === 'key') {
        if (!b.key) throw coded('INPUT_INVALID', 'key needs a key name');
        wc.sendInputEvent({ type: 'keyDown', keyCode: String(b.key) });
        wc.sendInputEvent({ type: 'keyUp', keyCode: String(b.key) });
        return { sent: 'key', key: String(b.key) };
      }
      if (b.type === 'text') { wc.insertText(String(b.text || '')); return { sent: 'text', length: String(b.text || '').length }; }
      throw coded('INPUT_INVALID', "type must be 'click' | 'key' | 'text'");
    },
    capture: async () => {
      const img = await wc.capturePage();
      const png = img && !img.isEmpty() ? img.toPNG() : null;
      if (!png || !png.length) throw coded('SURFACE_FRAME_EMPTY', 'the window produced an empty frame (it is not painting)');
      return { png_base64: png.toString('base64'), url: wc.getURL(), title: wc.getTitle(), width: img.getSize().width, height: img.getSize().height };
    },
    eval: async (q) => {
      const expr = String(q.get('js') || '');
      if (!expr.trim()) throw coded('EVAL_EMPTY', 'no expression');
      if (expr.length > 20000) throw coded('EVAL_TOO_LONG', '20000 chars max');
      return exec(expr);
    },
    images: async () => exec('[...document.images].map(i => ({ src: i.currentSrc || i.src, w: i.naturalWidth, h: i.naturalHeight, alt: i.alt || "" }))'),
  };
}

function startControlServer(port, token, handlers) {
  const tokenBuf = Buffer.from(token);
  const authed = (req) => {
    const m = /^Bearer ([0-9a-f]{64})$/.exec(String(req.headers.authorization || ''));
    if (!m) return false;
    const got = Buffer.from(m[1]);
    return got.length === tokenBuf.length && crypto.timingSafeEqual(got, tokenBuf);
  };
  const readBody = (req) => new Promise((resolve, reject) => {
    const cs = []; let n = 0;
    req.on('data', (c) => { n += c.length; if (n > 1024 * 1024) { reject(coded('BODY_TOO_LARGE', '1 MB max')); req.destroy(); return; } cs.push(c); });
    req.on('end', () => { if (!n) return resolve(null); try { resolve(JSON.parse(Buffer.concat(cs).toString('utf8'))); } catch (e) { reject(coded('BAD_JSON', e.message)); } });
    req.on('error', reject);
  });
  const server = http.createServer(async (req, res) => {
    const send = (obj, code) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };
    try {
      const u = new URL(req.url, 'http://plutus-browser/');
      const key = u.pathname.replace(/^\//, '');
      if (key === 'health') return send({ success: true, data: { up: true, pid: process.pid } }, 200);
      if (!authed(req)) throw coded('AUTH_REQUIRED', 'Authorization: Bearer <token from ~/.plutus-browser/token> is required');
      const fn = handlers[key];
      if (!fn) throw coded('ROUTE_UNKNOWN', `no route /${key}`);
      const body = req.method === 'POST' ? await readBody(req) : null;
      send({ success: true, data: await fn(u.searchParams, body) }, 200);
    } catch (e) { send({ success: false, error: e.message, code: e.code || 'SURFACE_ERROR' }, statusFor(e.code)); }
  });
  server.on('error', (e) => { log(`control server :${port} - ${e.code || e.message}`); process.exitCode = 3; app.quit(); });
  server.listen(port, '127.0.0.1', () => log(`control server on http://127.0.0.1:${port}`));
  return server;
}

let inputs;
try { inputs = requireInputs(); }
catch (e) { console.error(e.message); process.exit(2); }

fs.mkdirSync(USER_DATA, { recursive: true, mode: 0o700 });
fs.chmodSync(USER_DATA, 0o700);
app.setPath('userData', USER_DATA);
app.commandLine.appendSwitch('disable-dev-shm-usage');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1400, height: 900, show: false, backgroundColor: '#0B0B0C', title: 'PLUTUS-BROWSER',
    webPreferences: { partition: PARTITION, contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false },
  });
  win.setMenuBarVisibility(false);
  win.once('ready-to-show', () => win.show());
  const server = startControlServer(inputs.port, inputs.token, buildHandlers(win, inputs.display));
  win.on('closed', () => { server.close(); });
  await win.loadURL(HOME);
  log(`ready on DISPLAY=${inputs.display} url=${win.webContents.getURL()} session=${session.fromPartition(PARTITION).storagePath}`);
});

app.on('window-all-closed', () => app.quit());
