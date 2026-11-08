/**
 * view-surfaces.js — THE SURFACES, IN THE DASHBOARD WINDOW.
 *
 * WHY (measured 2026-09-30): the reparented nested-weston window rendered SOLID BLACK inside the
 * dashboard on this host while the very same surfaces rendered correctly on the agent display
 * (captured on :4: the chart with 1603 bars, the browser with its page). TRADE and WEB RESEARCH
 * were unusable for the operator. The surfaces are now BrowserViews of the dashboard window itself:
 * no reparented X window, no second display, the bounds follow the host rect on every refit.
 *
 * THE CONTRACT IS UNCHANGED for every consumer:
 *   renderer  → display:embed(kind, rect) · display:unembed · display:status · surface:call(kind, route)
 *   agents    → the loopback control servers (chart :9433 · browser :9432 · tv :9434), the same routes
 *               surface.js served (status, navigate, back, forward, reload, pair, tf, draw, study…).
 *               Agents drive the views through these routes or CDP (:9225) — never synthetic X input.
 *
 * THREE KINDS — the TradingView backend of TRADE is its OWN view (it used to share the web-research
 * surface, so TRADE showed whatever page WEB RESEARCH had open last). All three share ONE persistent
 * partition, so the seeded TradingView login is common to both TV views.
 */
'use strict';

const { BrowserView, session, screen } = require('electron');
const http = require('http');
const crypto = require('crypto');
const chartToken = require('./chart-agent/token');   // the chart-tools secret (minted in main; 0600 on disk)

const MAIN_API = process.env.PLUTUS_MAIN_API || 'http://127.0.0.1:9430';
const PARTITION = process.env.PLUTUS_SURFACE_PARTITION || 'persist:w6r-browser';
const TV_HOME = 'https://www.tradingview.com/chart/';
const RESEARCH_HOME = 'https://www.forexfactory.com/calendar'; // WEB RESEARCH opens on the FX calendar
const KINDS = {
  chart: { port: 9433, home: `${MAIN_API}/charts/trade.html?pair=EURUSD&tf=1H` },
  browser: { port: 9432, home: RESEARCH_HOME },
  tv: { port: 9434, home: TV_HOME },
};
const BG = '#0B0B0C';

/** a CALLER's mistake is a 4xx (the agent must fix its request); only a surface fault is a 5xx */
const CALLER_CODES = new Set(['URL_INVALID', 'URL_SCHEME_REFUSED', 'DRAW_SPEC_INVALID', 'SURFACE_KIND_UNKNOWN', 'BODY_TOO_LARGE', 'BAD_JSON']);
function statusFor(code) {
  if (code === 'SURFACE_ROUTE_UNKNOWN') return 404;
  if (CALLER_CODES.has(code)) return 400;
  if (code === 'DASHBOARD_WINDOW_ABSENT') return 503;
  return 500;
}

function coded(code, message) { return Object.assign(new Error(`${code}: ${message}`), { code }); }

/** Only http(s) pages are ever loaded into a view (never file:, javascript:, data:, chrome:). */
function webUrl(raw) {
  let u;
  try { u = new URL(String(raw || '')); } catch (e) { throw coded('URL_INVALID', JSON.stringify(String(raw)).slice(0, 120)); }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw coded('URL_SCHEME_REFUSED', `${u.protocol} — http/https only`);
  return u.toString();
}

function createViewSurfaces({ getWindow, seedCookies, log = (...a) => console.log('[VIEWS]', ...a) }) {
  const views = {};        // kind -> { view, loaded: Promise, handlers }
  let active = null;       // the kind attached to the window
  let lastRect = null;     // the last rect, in DEVICE px (what the renderer measures)
  let seed = null;         // the TradingView cookie seed result (once per app run)
  let seeding = null;
  const servers = [];

  function win() {
    const w = getWindow();
    if (!w || w.isDestroyed()) throw coded('DASHBOARD_WINDOW_ABSENT', 'the dashboard window is not open');
    return w;
  }

  async function ensureSeed() {
    if (seed) return seed;
    if (!seeding) {
      seeding = (async () => {
        try { seed = await seedCookies(session.fromPartition(PARTITION)); }
        catch (e) { seed = { injected: 0, error: e.message }; log('cookie seed failed:', e.message); }
        return seed;
      })();
    }
    return seeding;
  }

  function buildHandlers(kind, wc) {
    const exec = (js) => wc.executeJavaScript(js, true);
    const h = {
      // the surface viewport MEASURED, never assumed: a 0x0 viewport is the "the TV page renders nothing" symptom
      viewport: async () => {
        const b = wc.getViewBounds ? wc.getViewBounds() : null;
        const inner = await exec('({ w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio })').catch(() => null);
        return { bounds: b, inner, url: wc.getURL() };
      },
      status: async () => ({
        kind,
        url: wc.getURL(),
        title: wc.getTitle(),
        loading: wc.isLoading(),
        attached: active === kind,
        partition: PARTITION,
        state: kind === 'chart' ? await exec('window.PlutusChart ? window.PlutusChart.state() : null') : null,
      }),
      reload: async () => { wc.reload(); return true; },
      // THE INPUT DOOR (web-mode mirror): Electron's own sendInputEvent drives the
      // REAL page with no debugger attach — the CDP door needs a debugger and is
      // reserved for the token-gated agent tool routes.
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
        if (b.type === 'text') {
          wc.insertText(String(b.text || ''));
          return { sent: 'text', length: String(b.text || '').length };
        }
        throw coded('INPUT_INVALID', "type must be 'click' | 'key' | 'text'");
      },
      // THE FRAME DOOR (web-mode mirror): capturePage() is the Electron-native
      // snapshot and does not need the debugger attached or the view embedded —
      // the CDP door's Page.captureScreenshot HANGS on an unattached view
      // (measured: /tool/cdp -> 8 s timeout, so the mirror saw no frame).
      capture: async () => {
        const img = await wc.capturePage();
        const png = img && !img.isEmpty() ? img.toPNG() : null;
        if (!png || !png.length) throw coded('SURFACE_FRAME_EMPTY', `${kind} produced an empty frame (the view is not painting)`);
        return { png_base64: png.toString('base64'), kind, url: wc.getURL(), title: wc.getTitle(), width: img.getSize().width, height: img.getSize().height };
      },
      navigate: async (q) => { await wc.loadURL(webUrl(q.get('url'))); return { url: wc.getURL() }; },
      // Electron 28: webContents.canGoBack()/goBack() (navigationHistory is Electron 31+ — the old
      // surface.js called it and both buttons threw)
      back: async () => { if (wc.canGoBack()) wc.goBack(); return { url: wc.getURL(), canGoBack: wc.canGoBack() }; },
      forward: async () => { if (wc.canGoForward()) wc.goForward(); return { url: wc.getURL(), canGoForward: wc.canGoForward() }; },
      'cookies/list': async () => {
        const all = await session.fromPartition(PARTITION).cookies.get({});
        return { count: all.length, tradingview: all.filter((c) => /tradingview/.test(c.domain)).map((c) => c.name) };
      },
    };
    if (kind === 'chart') {
      Object.assign(h, {
        study: async (q) => exec(`window.PlutusChart ? window.PlutusChart.applyStudy(${JSON.stringify(q.get('id') || '')}) : null`),
        canon: async () => exec('window.PlutusChart ? window.PlutusChart.runCanon() : null'),
        rerun: async () => exec('window.PlutusChart ? window.PlutusChart.rerunActive() : null'),
        source: async (q) => exec(`window.PlutusChart ? window.PlutusChart.runStudySource(${JSON.stringify(q.get('script') || '')}) : null`),
        pair: async (q) => exec(`window.PlutusChart.setPair(${JSON.stringify(q.get('symbol') || 'EURUSD')})`),
        tf: async (q) => exec(`window.PlutusChart.setTimeframe(${JSON.stringify(q.get('tf') || '1H')})`),
        'frame-week': async () => exec('window.PlutusChart.frameWeek()'),
        clear: async () => exec('window.PlutusChart.clearDrawings()'),
        draw: async (q) => {
          let spec;
          try { spec = JSON.parse(q.get('spec') || '{}'); } catch (e) { throw coded('DRAW_SPEC_INVALID', e.message); }
          const calls = [];
          const J = JSON.stringify;
          for (const b of spec.boxes || []) calls.push(`window.PlutusChart.drawBox(${J(b.a)},${J(b.b)},${J(b.style || null)})`);
          for (const l of spec.lines || []) calls.push(`window.PlutusChart.drawLine(${J(l.a)},${J(l.b)},${J(l.style || null)})`);
          for (const x of spec.hlines || []) calls.push(`window.PlutusChart.drawHLine(${J(x.price)},${J(x.style || null)})`);
          for (const l of spec.labels || []) calls.push(`window.PlutusChart.drawLabel(${J(l.at)},${J(l.text)},${J(l.style || null)})`);
          for (const m of spec.markers || []) calls.push(`window.PlutusChart.drawMarker(${J(m.at)},${J(m.glyph || 'circle')})`);
          if (!calls.length) return { ok: false, code: 'DRAW_SPEC_EMPTY' };
          return exec(`[${calls.join(',')}]`);
        },
      });
    } else {
      h.seed = async () => ensureSeed();
      // a bounded, expression-only evaluate route (diagnostics; the routes the shell drives are named above)
      h.eval = async (q) => {
        const expr = String(q.get('js') || '');
        if (!expr.trim()) throw coded('EVAL_EMPTY', 'no expression');
        if (expr.length > 20000) throw coded('EVAL_TOO_LONG', '20000 chars max');
        return exec(expr);
      };
      // THE TV-SIDE RENDER: paste a Pine source into TradingView's own editor and add it to ITS chart.
      // EVALUATE-ONLY (no synthetic input, no CDP focus dance): open the Pine editor, set Monaco's model value
      // through its own API when present (Monaco exposes window.monaco), and click "Add to chart". A refusal
      // names what it found so the caller can report it instead of pretending the render landed.
      h['pine-apply'] = async (q) => {
        const src = String(q.get('script') || '');
        if (!src.trim()) throw coded('PINE_SOURCE_EMPTY', 'nothing to apply');
        const title = String(q.get('title') || 'PLUTUS IDE');
        const before = await exec(`(() => ({
          url: location.href,
          hasMonaco: !!(window.monaco && window.monaco.editor),
          editors: (window.monaco && window.monaco.editor) ? window.monaco.editor.getEditors ? window.monaco.editor.getEditors().length : -1 : 0,
          tabs: document.querySelectorAll('[data-name="scripteditor"],[id*="scripteditor"],[class*="scriptEditorPane"]').length,
          buttons: [...document.querySelectorAll('button')].map(b => (b.innerText || b.textContent || '').trim()).filter(t => t && t.length < 40).slice(0, 120),
        }))()`);
        const opened = await exec(`(() => {
          const b = [...document.querySelectorAll('button,[role="tab"],[data-name]')].find(x => /pine editor|脚本编辑器|pine/i.test((x.innerText||x.getAttribute('data-name')||'')));
          if (b) { b.click(); return 'clicked:' + ((b.innerText||b.getAttribute('data-name')||'').trim().slice(0,30)); }
          return 'not-found';
        })()`);
        await new Promise((r) => setTimeout(r, 1200));
        const set = await exec(`(() => {
          const eds = window.monaco && window.monaco.editor && window.monaco.editor.getEditors ? window.monaco.editor.getEditors() : [];
          if (!eds.length) return 'no-monaco-editors';
          const model = eds[eds.length - 1].getModel && eds[eds.length - 1].getModel();
          if (!model) return 'no-model';
          model.setValue(${JSON.stringify(src)});
          return 'set:' + model.getLineCount();
        })()`);
        await new Promise((r) => setTimeout(r, 900));
        const added = await exec(`(() => {
          const b = [...document.querySelectorAll('button')].find(x => /add to chart|添加到图表/i.test((x.innerText||'').trim()));
          if (!b) return 'add-to-chart-not-found';
          if (b.disabled || b.getAttribute('aria-disabled') === 'true') return 'add-to-chart-disabled';
          b.click(); return 'clicked';
        })()`);
        const out = { title, opened, set, added, before };
        if (String(set).indexOf('set:') !== 0) out.code = 'TV_PINE_EDITOR_UNREACHABLE';
        else if (added !== 'clicked') out.code = 'TV_ADD_TO_CHART_REFUSED';
        else out.ok = true;
        return out;
      };
      h['tv-state'] = async () => {
        const text = await exec('document.body ? document.body.innerText.slice(0, 6000) : ""');
        const loginWall = /Look first|Join for free|Sign in to TradingView/i.test(text);
        return { url: wc.getURL(), title: wc.getTitle(), loginWall, verdict: loginWall ? 'TV_LOGIN_EXPIRED' : 'LOGGED_IN', excerpt: text.slice(0, 300) };
      };
    }
    // ── THE CHART-TOOLS DOOR (token-gated at the server; see startControlServers) ──
    // Drives the PAGE through CDP over Electron's own in-process debugger: no remote-debugging port, no second browser,
    // no synthetic X input. Exactly the CDP calls the TV MCP used (mouse, key, insertText, Runtime.evaluate,
    // captureScreenshot), nothing more; anything off the allowlist is refused by name.
    const CDP_ALLOW = new Set(['Input.dispatchMouseEvent', 'Input.dispatchKeyEvent', 'Input.insertText', 'Runtime.evaluate', 'Page.captureScreenshot', 'Page.navigate', 'Page.enable']);
    const TV_HOST_RE = /^https:\/\/([a-z0-9-]+\.)*tradingview\.com([/?#]|$)/i;
    async function cdpCall(method, params) {
      if (typeof method !== 'string' || !CDP_ALLOW.has(method)) throw coded('CDP_METHOD_REFUSED', `${JSON.stringify(String(method)).slice(0, 60)} is not on the chart-tools allowlist`);
      if (method === 'Page.navigate' && (kind !== 'tv' || !TV_HOST_RE.test(String((params || {}).url || '')))) throw coded('CDP_NAVIGATE_REFUSED', 'Page.navigate is allowed only on the tv view, and only to tradingview.com');
      const dbg = wc.debugger;
      if (!dbg.isAttached()) dbg.attach('1.3');
      return Promise.race([dbg.sendCommand(method, params || {}), new Promise((_, rej) => setTimeout(() => rej(coded('CDP_TIMEOUT', method)), 15000))]);
    }
    h['tool/cdp'] = async (q, body) => cdpCall(body && body.method, body && body.params);
    h['tool/screenshot'] = async () => {
      // a view that is not the embedded one has no viewport: name it, never hand back a blank frame as if it were a chart
      if (active !== kind) throw coded('SURFACE_NOT_VISIBLE', `${kind} is not the embedded view (active=${active || 'none'}) - screenshot the active backend, or embed this one first`);
      const r = await cdpCall('Page.captureScreenshot', { format: 'png' });
      if (!r || !r.data) throw coded('SCREENSHOT_EMPTY', `${kind} produced no image data`);
      return { png_base64: r.data, kind, url: wc.getURL() };
    };
    return h;
  }

  async function ensureView(kind, url) {
    if (!Object.prototype.hasOwnProperty.call(KINDS, kind)) throw coded('SURFACE_KIND_UNKNOWN', `${JSON.stringify(String(kind)).slice(0, 40)} — chart | browser | tv`);
    const have = views[kind];
    if (have && !have.view.webContents.isDestroyed()) return have;
    if (kind !== 'chart') await ensureSeed(); // the TV login lands BEFORE the first TradingView load
    const view = new BrowserView({
      webPreferences: { partition: PARTITION, contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false },
    });
    view.setBackgroundColor(BG);
    const wc = view.webContents;
    // a page asking for a new window opens IN the view (http/https only) — never a stray window
    wc.setWindowOpenHandler(({ url: u }) => {
      try { wc.loadURL(webUrl(u)); } catch (e) { /* refused scheme: dropped */ }
      return { action: 'deny' };
    });
    wc.on('render-process-gone', (e, d) => { log(`${kind} renderer gone: ${d.reason}`); });
    const entry = { view, handlers: buildHandlers(kind, wc), loaded: null };
    views[kind] = entry;
    const target = url ? webUrl(url) : KINDS[kind].home;
    entry.loaded = wc.loadURL(target).catch((e) => { log(`${kind} load ${target}: ${e.message}`); });
    return entry;
  }

  /** Device px (the renderer's measure) → DIP (what BrowserView bounds take). */
  function toDip(w, rect) {
    const sf = screen.getDisplayMatching(w.getBounds()).scaleFactor || 1;
    return {
      x: Math.round((rect.x || 0) / sf),
      y: Math.round((rect.y || 0) / sf),
      width: Math.max(1, Math.round((rect.width || 1) / sf)),
      height: Math.max(1, Math.round((rect.height || 1) / sf)),
    };
  }

  /** Attach a view across the dashboard window's own content area.
   *  Needed by the WEB MODE mirror: an unattached BrowserView is not
   *  composited, so capturePage() returns an EMPTY image (measured:
   *  SURFACE_FRAME_EMPTY while attached:false). Once attached it paints and
   *  the mirror captures real frames. It also makes the view visible in the
   *  dashboard's own window, exactly as the desktop tabs do. */
  async function attachFull(kind) {
    const w = win();
    const b = w.getContentBounds ? w.getContentBounds() : w.getBounds();
    return embed(kind, { x: 0, y: 0, width: b.width, height: b.height });
  }

  async function embed(kind, rect) {
    const w = win();
    const entry = await ensureView(kind, rect && rect.url);
    for (const [k, e] of Object.entries(views)) {
      if (k !== kind && w.getBrowserViews().includes(e.view)) w.removeBrowserView(e.view);
    }
    if (!w.getBrowserViews().includes(entry.view)) w.addBrowserView(entry.view);
    const r = rect && rect.width ? rect : lastRect;
    if (!r) throw coded('SURFACE_HOST_COLLAPSED', 'no host rect to attach into');
    const dip = toDip(w, r);
    entry.view.setBounds(dip);
    active = kind;
    lastRect = { x: r.x, y: r.y, width: r.width, height: r.height };
    return { embedded: true, kind, rect: lastRect, bounds: dip, scaleFactor: screen.getDisplayMatching(w.getBounds()).scaleFactor, url: entry.view.webContents.getURL() };
  }

  function unembed() {
    let w = null;
    try { w = win(); } catch (e) { active = null; return { embedded: false }; }
    for (const e of Object.values(views)) { if (w.getBrowserViews().includes(e.view)) w.removeBrowserView(e.view); }
    active = null;
    return { embedded: false };
  }

  function status() {
    const surfaces = {};
    for (const [k, e] of Object.entries(views)) {
      const wc = e.view.webContents;
      const alive = !wc.isDestroyed() && !wc.isCrashed();
      surfaces[k] = { alive, url: alive ? wc.getURL() : null, title: alive ? wc.getTitle() : null, port: KINDS[k].port, attached: active === k };
    }
    return { present: !!getWindow(), mode: 'in-window', active, embedded: lastRect, surfaces, seed };
  }

  /** route = 'navigate?url=…' | 'status' | … ; body = the parsed JSON of a POST (only /tool/* uses one). */
  async function call(kind, route, body) {
    const entry = await ensureView(kind);
    const u = new URL(String(route || ''), 'http://surface/');
    const key = u.pathname.replace(/^\//, '');
    const fn = entry.handlers[key];
    if (!fn) throw coded('SURFACE_ROUTE_UNKNOWN', `/${key} on ${kind}`);
    return fn(u.searchParams, body);
  }

  function startControlServers() {
    const CHART_TOKEN = (() => { try { return chartToken.readToken(); } catch (e) { return null; } })();
    const tokenOk = (req) => {
      const got = String(req.headers['x-chart-token'] || '');
      if (!CHART_TOKEN || got.length !== CHART_TOKEN.length) return false;
      try { return crypto.timingSafeEqual(Buffer.from(got), Buffer.from(CHART_TOKEN)); } catch (e) { return false; }
    };
    const readBody = (req) => new Promise((resolve, reject) => {
      const cs = []; let n = 0;
      req.on('data', (c) => { n += c.length; if (n > 4 * 1024 * 1024) { reject(coded('BODY_TOO_LARGE', '4 MB max')); req.destroy(); return; } cs.push(c); });
      req.on('end', () => { if (!n) return resolve(null); try { resolve(JSON.parse(Buffer.concat(cs).toString('utf8'))); } catch (e) { reject(coded('BAD_JSON', e.message)); } });
      req.on('error', reject);
    });
    for (const [kind, spec] of Object.entries(KINDS)) {
      const server = http.createServer(async (req, res) => {
        const send = (obj, code) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };
        try {
          const key = new URL(req.url, 'http://surface/').pathname.replace(/^\//, '');
          if (key.indexOf('tool/') === 0 && !tokenOk(req)) return send({ success: false, error: 'the chart-tools door needs the chart token', code: 'CHART_TOKEN_REQUIRED' }, 401);
          const body = req.method === 'POST' ? await readBody(req) : null;
          send({ success: true, data: await call(kind, req.url, body) }, 200);
        } catch (e) { send({ success: false, error: e.message, code: e.code || 'SURFACE_ERROR' }, statusFor(e.code)); }
      });
      server.on('error', (e) => log(`control server :${spec.port} (${kind}) — ${e.code || e.message}`));
      server.listen(spec.port, '127.0.0.1', () => log(`control server ${kind} on http://127.0.0.1:${spec.port}`));
      servers.push(server);
    }
  }

  function destroy() {
    for (const s of servers) { try { s.close(); } catch (e) { /* closed */ } }
    for (const e of Object.values(views)) { try { if (!e.view.webContents.isDestroyed()) e.view.webContents.close(); } catch (x) { /* gone */ } }
  }

  return { embed, attachFull, unembed, status, call, startControlServers, destroy, KINDS };
}

module.exports = { createViewSurfaces, webUrl, KINDS };
