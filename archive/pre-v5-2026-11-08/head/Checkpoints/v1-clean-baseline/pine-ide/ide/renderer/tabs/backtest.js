/* ============================================================================
   tabs/backtest.js — THE BACKTESTING ROOM  (SHELL_ANCHOR §5.2 · W-S3 T2)
   ----------------------------------------------------------------------------
   A SELF-CONTAINED tab module — the exact contract of the shell's tab desk:
     · edits NO sibling file (index.html / app.js / styles.css / tokens.css / chart/**)
     · self-injects its stylesheet (tabs/backtest.css) and its body fragment
       (tabs/backtest.html) — the fragment is loaded from the dashboard's static root
       on :9430 (file:// cannot fetch a sibling file), or, standalone, from the room's
       own control surface
     · registers through PlutusShell.registerTab, so the WHOLE integration is ONE nav
       button:  <button class="nav-btn" data-page="backtest-room">…</button>
     · mount(host) is IDEMPOTENT (the registry unmounts first) and the module never
       assumes it owns the document: every query is scoped to the mounted host.

   THE ENGINE IS NOT HERE. This module is a CLIENT of the room's control surface
   (dashboard/backtest-room/control.mjs, 127.0.0.1:9443 → 9444 → 9445). One engine,
   one truth: the tab and an agent driving the same verbs cannot diverge. When the
   surface is not up the room renders a NAMED state (BACKTEST_ROOM_DOWN), never a
   blank panel.
   ============================================================================ */
(function () {
  'use strict';

  var KEY = 'backtest-room';
  var PORTS = [9443, 9446, 9447]; // :9444/:9445 are the VIL rail's
  var VERSION = '1.0.0';

  var S = {
    base: null, baseWhy: null, health: null, cells: [], uid: null, st: null,
    win: null, es: null, poll: null, host: null, root: null, cells_cache: {},
    side: 'buy', busy: false, lastErr: null, attached: null, sessions: [], timers: {},
  };

  // ─────────────────────────────────────────────────────────── the shell (real or dev shim)
  function ensureShell() {
    if (window.PlutusShell && typeof window.PlutusShell.registerTab === 'function') return window.PlutusShell;

    // DEV FALLBACK, used ONLY when tabs/_shell.js has not loaded (the standalone room page
    // served by the control surface before integration). It implements the minimum this tab
    // needs; the real _shell.js is the shipped path and is never modified here.
    console.warn('[backtest-room] PlutusShell absent → the dev fallback shim is in use');
    var _tabs = {};
    var _assets = {};
    var shim = {
      VERSION: VERSION,
      apiBase: function () { return (window.dashboardConfig && window.dashboardConfig.apiBase) || 'http://127.0.0.1:9851'; },
      el: function (tag, attrs, children) {
        var n = document.createElement(tag);
        if (attrs) Object.keys(attrs).forEach(function (k) {
          var v = attrs[k];
          if (v === null || v === undefined) return;
          if (k === 'text') n.textContent = String(v);
          else if (k === 'html') n.innerHTML = String(v);
          else if (k === 'class') n.className = String(v);
          else if (k === 'style') n.setAttribute('style', String(v));
          else if (k === 'dataset') Object.keys(v).forEach(function (d) { n.dataset[d] = v[d]; });
          else if (k.slice(0, 2) === 'on' && typeof v === 'function') n.addEventListener(k.slice(2), v);
          else n.setAttribute(k, String(v));
        });
        (children || []).forEach(function (c) {
          if (c === null || c === undefined || c === false) return;
          n.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
        });
        return n;
      },
      fmt: {
        num: function (v, d) { return (v === null || v === undefined || isNaN(Number(v))) ? '—' : Number(v).toLocaleString('en-US', { minimumFractionDigits: d === undefined ? 2 : d, maximumFractionDigits: d === undefined ? 2 : d }); },
        int: function (v) { return (v === null || v === undefined || isNaN(Number(v))) ? '—' : Number(v).toLocaleString('en-US'); },
        money: function (v, o) { o = o || {}; if (v === null || v === undefined || isNaN(Number(v))) return '—'; var n = Number(v); var s = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: o.digits === undefined ? 2 : o.digits, maximumFractionDigits: o.digits === undefined ? 2 : o.digits }); return (n < 0 ? '-' : '') + (o.bare ? '' : '$') + s; },
        pct: function (v, d) { return (v === null || v === undefined || isNaN(Number(v))) ? '—' : Number(v).toFixed(d === undefined ? 1 : d) + '%'; },
        date: function (ts) { var dt = ts ? new Date(ts) : null; return dt && !isNaN(dt) ? dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : '—'; },
        time: function (ts) { var dt = ts ? new Date(ts) : null; return dt && !isNaN(dt) ? dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—'; },
        parse: function (ts) { if (ts === null || ts === undefined || ts === '') return null; if (typeof ts === 'number') return new Date(ts < 1e12 ? ts * 1000 : ts); var d = new Date(String(ts).replace(' ', 'T')); return isNaN(d.getTime()) ? null : d; },
      },
      api: function (path, opts) {
        opts = opts || {};
        var url = /^https?:/.test(path) ? path : shim.apiBase() + (path.charAt(0) === '/' ? path : '/' + path);
        var t0 = Date.now();
        var ctl = new AbortController();
        var boot = setTimeout(function () { ctl.abort(); }, opts.timeoutMs || 8000);
        return fetch(url, {
          method: opts.method || 'GET',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
          signal: ctl.signal,
        }).then(function (r) { return r.text().then(function (t) { var j = null; try { j = JSON.parse(t); } catch (e) { j = null; } return { ok: r.ok, status: r.status, json: j, text: t, ms: Date.now() - t0, url: url }; }); })
          .catch(function (e) { return { ok: false, status: 0, json: null, text: '', error: String(e), ms: Date.now() - t0, url: url }; })
          .then(function (v) { clearTimeout(boot); return v; });
      },
      probe: function (url, opts) {
        opts = opts || {};
        return shim.api(url, { timeoutMs: opts.timeoutMs || 2500, token: null }).then(function (r) {
          return { up: r.ok && r.status >= 200 && r.status < 400, status: r.status, ms: r.ms, why: r.ok ? '' : (r.error || ('HTTP ' + r.status)), json: r.json, text: r.text };
        });
      },
      poll: function (fn, opts) {
        opts = opts || {};
        var stopped = false, running = false, h = { intervalMs: opts.intervalMs || 5000 };
        function run() {
          if (stopped || running) return;
          running = true;
          Promise.resolve().then(fn).catch(function (e) { console.error('[backtest-room] poll threw', e); }).then(function () {
            running = false;
            if (!stopped) h._t = setTimeout(run, h.intervalMs);
          });
        }
        h.stop = function () { stopped = true; clearTimeout(h._t); };
        h.tick = run;
        if (opts.immediate !== false) run(); else h._t = setTimeout(run, h.intervalMs);
        return h;
      },
      ensureTokens: function () {
        if (_assets.t) return;
        var l = document.createElement('link');
        l.rel = 'stylesheet'; l.href = shim.apiBase() + '/tokens.css'; l.id = 'plutus-shell-tokens';
        document.head.appendChild(l);
        var s = document.createElement('style');
        s.textContent = '.ps-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--text-faint);vertical-align:middle}.ps-dot-ok{background:var(--accent-green)}.ps-dot-down{background:var(--accent-red)}.ps-dot-warn{background:var(--accent-gold)}.ps-dot-unknown{background:var(--text-muted)}.ps-label{font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:var(--text-muted)}.ps-tlink{background:none;border:none;font:inherit;font-size:11px;cursor:pointer;letter-spacing:0.14em;text-transform:uppercase;color:var(--text-secondary)}.ps-tlink:hover{color:var(--text-primary)}.ps-note{font-size:11px;color:var(--text-muted)}';
        document.head.appendChild(s);
        _assets.t = { l: l, s: s };
      },
      loadFragment: function (rel) {
        return shim.api(shim.apiBase() + '/' + String(rel).replace(/^\/+/, ''), { timeoutMs: 8000, token: null }).then(function (r) {
          return r.ok && r.text ? { ok: true, html: r.text, url: r.url } : { ok: false, error: r.error || ('HTTP ' + r.status), url: r.url, html: null };
        });
      },
      registerTab: function (spec) {
        _tabs[spec.key] = spec;
        window.PlutusShellTabs = window.PlutusShellTabs || {};
        var tab = {
          key: spec.key, mounted: false,
          mount: function (host) {
            var t = host || document.getElementById(spec.containerId) || document.getElementById('main-content') || document.body;
            tab.unmount();
            tab.mounted = true;
            try { spec.mount(t); } catch (e) { tab.mounted = false; console.error('[backtest-room] mount threw', e); }
          },
          unmount: function () { if (!tab.mounted) return; try { if (spec.unmount) spec.unmount(); } catch (e) { /* documented */ } tab.mounted = false; },
        };
        window.PlutusShellTabs[spec.key] = tab;
        document.addEventListener('click', function (ev) {
          var btn = ev.target && ev.target.closest ? ev.target.closest('.nav-btn[data-page="' + (spec.navPage || spec.key) + '"]') : null;
          if (!btn) return;
          ev.stopPropagation(); ev.preventDefault();
          Array.prototype.forEach.call(document.querySelectorAll('.nav-btn'), function (b) { b.classList.toggle('active', b === btn); });
          tab.mount(null);
        }, true);
        var mountIfPresent = function () {
          var c = spec.containerId ? document.getElementById(spec.containerId) : null;
          if (c) tab.mount(c);
        };
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountIfPresent);
        else setTimeout(mountIfPresent, 0);
        return tab;
      },
    };
    window.PlutusShell = shim;
    return shim;
  }

  var SH = ensureShell();
  var el = SH.el;
  var F = SH.fmt;

  // ─────────────────────────────────────────────────────────── the control surface
  async function discover(force) {
    if (S.base && !force) return S.base;
    var tried = [];
    for (var i = 0; i < PORTS.length; i++) {
      var b = 'http://127.0.0.1:' + PORTS[i];
      var r = await SH.probe(b + '/health', { timeoutMs: 2000 });
      tried.push(PORTS[i] + (r.up ? ' UP' : ' down(' + r.why + ')'));
      if (r.up && r.json && r.json.service === 'plutus-backtest-room') {
        S.base = b; S.health = r.json; S.baseWhy = null;
        return S.base;
      }
    }
    S.base = null;
    S.baseWhy = 'tried ' + tried.join(' · ');
    return null;
  }

  async function api(method, path, body) {
    if (!S.base) await discover();
    if (!S.base) throw makeErr('BACKTEST_ROOM_DOWN', 'the backtest room control surface is not up (' + S.baseWhy + ')');
    var r = await SH.api(S.base + path, { method: method, body: body, timeoutMs: 20000 });
    if (!r.ok) {
      var code = (r.json && r.json.code) || (r.error ? 'TRANSPORT' : 'HTTP_' + r.status);
      var msg = (r.json && r.json.error) || r.error || ('HTTP ' + r.status);
      throw makeErr(code, msg, r.json && r.json.detail, r.status);
    }
    return r.json;
  }
  function makeErr(code, message, detail, status) {
    var e = new Error(message + '  [' + code + ']');
    e.code = code; e.detail = detail; e.status = status;
    return e;
  }

  // ─────────────────────────────────────────────────────────── mount / unmount
  function mount(host) {
    if (!host) return { ok: false, error: 'NO_HOST' };
    S.host = host;
    S.uid = null; S.st = null; S.win = null;

    host.classList.add('bt-host');   // .main-content gains zero padding + a flex column while the room is mounted

    if (host.id === 'page-backtest-room') { host.style.height = '100vh'; }

    injectCss();

    return loadFragmentAny().then(function (frag) {
      if (!frag.ok) {
        host.innerHTML = '';
        host.appendChild(el('div', { class: 'bt-room' }, [
          el('div', { class: 'bt-head' }, [el('div', { class: 'bt-title', text: 'BACKTESTING — FRAGMENT_ABSENT' })]),
          el('div', { class: 'bt-panel' }, [
            el('div', { class: 'bt-err', text: 'tabs/backtest.html could not be loaded: ' + frag.error + ' (tried ' + frag.tried.join(' , ') + ')' }),
            el('div', { class: 'ps-note', text: 'post-integration it is served from :9430/tabs/backtest.html by the dashboard itself' }),
          ]),
        ]));
        return { ok: false, error: 'FRAGMENT_ABSENT' };
      }
      host.innerHTML = frag.html;
      host.dataset.btWired = '1';
      S.root = host.querySelector('.bt-room');
      SH.ensureTokens && SH.ensureTokens();
      wire();
      return refreshAll(true);
    }).catch(function (e) {
      console.error('[backtest-room] mount failed', e);
      return { ok: false, error: String(e) };
    });
  }

  function unmount() {
    if (S.es) { try { S.es.close(); } catch (e) { /* closed */ } S.es = null; }
    if (S.poll) { S.poll.stop(); S.poll = null; }
    Object.keys(S.timers).forEach(function (k) { clearTimeout(S.timers[k]); });
    S.timers = {};
    // the workbench is bound to THIS host: destroy it with the host, so a remount mounts a fresh chart
    if (WB.api) { try { WB.api.destroy(); } catch (e) { /* host already gone */ } }
    WB.api = null; WB.loading = null; WB.ticker = null; WB.uid = null; WB.lastTime = null; WB.reloads = 0; WB.levelIds = []; WB.levelKey = '';
    WB.gen = (WB.gen || 0) + 1; // any bundle import still in flight belongs to a dead mount
    WB.failedAt = 0; WB.host = null; WB.reloadAt = 0; // a remount retries at once, reloads unthrottled
    if (S.host) {
      S.host.classList.remove('bt-host');
      S.host.innerHTML = '';
      if (S.host.id === 'page-backtest-room') S.host.style.height = '';
    }
    S.root = null; S.host = null;
  }

  function injectCss() {
    if (document.getElementById('bt-room-css')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.id = 'bt-room-css';
    // From the SHELL's static root (:9430 serves renderer/tabs/) — the room being down must not
    // leave the tab unstyled (RT-11: it fell back to the dead :9443 and the page rendered raw).
    l.href = SH.apiBase() + '/tabs/backtest.css';
    document.head.appendChild(l);
  }

  async function loadFragmentAny() {
    var tried = [];
    var bases = [];
    try { bases.push(SH.apiBase()); } catch (e) { /* no shell base */ }
    await discover();
    if (S.base) bases.push(S.base);
    for (var i = 0; i < bases.length; i++) {
      var url = bases[i] + '/tabs/backtest.html';
      var r = await SH.api(url, { timeoutMs: 8000, token: null });
      tried.push(url + ' → HTTP ' + r.status);
      if (r.ok && r.text) return { ok: true, html: r.text, url: url, tried: tried };
    }
    return { ok: false, tried: tried, error: 'no base served tabs/backtest.html' };
  }

  // ─────────────────────────────────────────────────────────── refresh / poll
  async function refreshAll(full) {
    var base = await discover();
    if (!base) { paintDown(); return; }
    paintService(true);
    if (full || !S.cells.length) {
      try {
        var c = await api('GET', '/cells');
        S.cells = c.cells || [];
        renderCreateForm();
      } catch (e) { note(e); }
    }
    try {
      var s = await api('GET', '/sessions?limit=25');
      S.sessions = s.sessions || [];
      renderSessions();
    } catch (e) { note(e); }
    if (!S.uid) {
      var live = S.sessions.filter(function (x) { return x.status === 'RUNNING' && !(S.ghosts && S.ghosts[x.session_uid]); });
      if (live.length) await attach(live[0].session_uid);
    } else {
      await pullStatus();
    }
  }

  async function pullStatus() {
    if (!S.uid) return;
    try {
      var r = await api('GET', '/status?session=' + encodeURIComponent(S.uid));
      S.st = r.status;
      await pullWindow();
      paint();
    } catch (e) {
      // a RUNNING row whose room restarted: the replay state lived in that process's memory. NAME it —
      // never "no session", never a silent attach to a ghost (measured 2026-09-30 after an app restart).
      if (e && e.code === 'SESSION_NOT_FOUND') {
        var ghost = S.uid;
        // the room restarted: RESUME it (the room re-drives the recorded verb log, cursor-asserted) — once per
        // session; only a REFUSED resume leaves the session named dead, with the room's own refusal code
        S.resumeTried = S.resumeTried || {};
        if (!S.resumeTried[ghost]) {
          S.resumeTried[ghost] = true;
          var em0 = q('chart-empty'); if (em0) { em0.style.display = 'flex'; em0.textContent = 'RESUMING ' + ghost + ' — replaying its recorded session…'; }
          try {
            var rr = await api('POST', '/resume', { session: ghost, actor: 'human' });
            if (rr && rr.ok) {
              S.ghostShown = false;
              if (S.uid === ghost) { await pullStatus(); openStream(); renderSessions(); paint(); }
              return;
            }
          } catch (re) { S.resumeRefusal = (re && (re.code || re.message)) || 'RESUME_FAILED'; }
        }
        S.ghosts = S.ghosts || {}; S.ghosts[ghost] = true;
        S.uid = null; S.st = null; S.win = null;
        // the dead session's stream and poller stop with it
        if (S.es) { try { S.es.close(); } catch (x) { /* closed */ } S.es = null; }
        if (S.poll) { try { S.poll.stop(); } catch (x) { /* stopped */ } S.poll = null; }
        S.ghostShown = true;
        paint();
        var em = q('chart-empty');
        if (em) { em.style.display = 'flex'; em.textContent = 'SESSION_NOT_LIVE — ' + ghost + ' could not be resumed after the room restarted (' + (S.resumeRefusal || 'RESUME_FAILED') + '). Create a new session.'; }
        return;
      }
      note(e);
    }
  }

  async function pullWindow() {
    if (!S.uid) return;
    try {
      var w = await api('GET', '/bars?session=' + encodeURIComponent(S.uid) + '&lookback=180');
      S.win = w;
    } catch (e) { note(e); }
  }

  async function attach(uid) {
    if (S.ghosts) delete S.ghosts[uid]; // an explicit attach re-probes a session once marked a ghost
    S.uid = uid;
    await pullStatus();
    openStream();
    renderSessions();
    paint();
  }

  function openStream() {
    if (S.es) { try { S.es.close(); } catch (e) { /* closed */ } S.es = null; }
    if (!S.uid || !S.base || typeof EventSource === 'undefined') { startPoll(); return; }
    try {
      var es = new EventSource(S.base + '/stream?session=' + encodeURIComponent(S.uid));
      var connected = false;
      S.es = es;
      es.onopen = function () { connected = true; if (S.poll) { S.poll.stop(); S.poll = null; } };
      es.onmessage = function (m) {
        var d = null;
        try { d = JSON.parse(m.data); } catch (e) { return; }
        if (d.type === 'status' && d.session === S.uid) {
          S.st = d.status;
          pullWindow().then(paint);
        } else if (d.type === 'created' || d.type === 'finished') {
          refreshAll(false);
        } else if (d.type === 'error') {
          note(makeErr(d.code || 'PLAY_ERROR', d.error));
        }
      };
      es.onerror = function () {
        if (!connected) { try { es.close(); } catch (e) { /* closed */ } S.es = null; startPoll(); }
      };
      S.timers.sseGuard = setTimeout(function () { if (!connected) { try { es.close(); } catch (e) { /* closed */ } S.es = null; startPoll(); } }, 3000);
    } catch (e) { startPoll(); }
  }

  function startPoll() {
    if (S.poll) S.poll.stop();
    S.poll = SH.poll(function () { return pullStatus(); }, { intervalMs: 1200, immediate: true });
  }

  // ─────────────────────────────────────────────────────────── paint
  function paintDown() {
    if (!S.root) return;
    S.root.querySelectorAll('[data-bt]').forEach(function (n) {
      if (n.dataset.bt === 'svc') n.textContent = 'BACKTEST_ROOM_DOWN';
    });
    var dot = q('dot'); if (dot) dot.className = 'ps-dot ps-dot-down';
    var w = q('chart-empty'); if (w) { w.style.display = 'flex'; w.textContent = 'BACKTEST_ROOM_DOWN — ' + (S.baseWhy || ''); }
    var ce = q('create-err'); if (ce) ce.textContent = 'the control surface is down (127.0.0.1:' + PORTS.join('/') + ')';
  }

  function paintService(up) {
    var dot = q('dot'), svc = q('svc');
    if (dot) dot.className = 'ps-dot ' + (up ? 'ps-dot-ok' : 'ps-dot-down');
    if (svc) svc.textContent = 'ROOM ' + (S.base ? S.base.replace('http://127.0.0.1:', ':') : 'DOWN') + ' · v' + VERSION;
  }

  function paint() {
    paintService(true);
    renderControlsState();
    renderStrip();
    renderChart();
    renderPosition();
    renderOrders();
    renderJournal();
    renderHud();
  }

  /** prices at instrument precision: kills the float artifact in every price cell
   *  (the engine rounds at the source too — this is the display twin, not a patch) */
  function px(v) {
    if (v === null || v === undefined || v === '') return '—';
    var n = Number(v);
    if (!isFinite(n)) return '—';
    var dec = Math.abs(n) >= 100 ? 3 : (Math.abs(n) >= 10 ? 4 : 5);
    return n.toFixed(dec);
  }

  function q(k) { return S.root ? S.root.querySelector('[data-bt="' + k + '"]') : null; }
  function setText(k, t) { var n = q(k); if (n) n.textContent = t; }
  function note(err) {
    S.lastErr = err;
    var box = q('order-err') || q('create-err');
    if (box) box.textContent = err ? (err.message || String(err)) : '';
    console.warn('[backtest-room]', err);
  }
  function clearNotes() { ['order-err', 'create-err'].forEach(function (k) { var n = q(k); if (n) n.textContent = ''; }); }

  // ─────────────────────────────────────────────────────────── the create form
  function sourceOf() { var s = q('f-source'); return s && s.value === 'tv' ? 'tv' : 'fixture'; }
  var localInput = function (d) { return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
  async function loadTvCells() {
    if (S.tvCells) return S.tvCells;
    try { var r = await api('GET', '/tv-cells'); S.tvCells = { pairs: r.pairs || [], timeframes: r.timeframes || [] }; }
    catch (e) { S.tvCells = { pairs: [], timeframes: [], error: e.code || e.message }; }
    return S.tvCells;
  }
  async function renderTvForm() {
    var sym = q('f-symbol'), tf = q('f-timeframe');
    var c = await loadTvCells();
    if (sourceOf() !== 'tv') return;
    sym.innerHTML = ''; tf.innerHTML = '';
    c.pairs.forEach(function (p) { sym.appendChild(el('option', { value: p, text: p })); });
    c.timeframes.forEach(function (t) { tf.appendChild(el('option', { value: t, text: t })); });
    tf.value = c.timeframes.indexOf('1H') >= 0 ? '1H' : tf.value;
    var from = q('f-from'), to = q('f-to');
    if (from) from.value = localInput(new Date(Date.now() - 30 * 86400000));
    if (to) to.value = '';
    setText('cellinfo', c.error
      ? 'TV_FEED_DOWN — the feed (:9448) did not answer: ' + c.error
      : 'TV FEED · up to 5000 CLOSED bars ending at TO (empty = the latest closed bar). Everything before FROM is visible history; after FROM stays hidden until you step.');
  }
  function renderCreateForm() {
    var sym = q('f-symbol'), tf = q('f-timeframe');
    if (!sym || !tf) return;
    var srcSel = q('f-source');
    if (srcSel && !srcSel.onchange) srcSel.onchange = function () { S.cells_cache.from = false; renderCreateForm(); };
    if (sourceOf() === 'tv') { sym.onchange = null; tf.onchange = null; void renderTvForm(); return; }
    var pairs = [];
    S.cells.forEach(function (c) { if (pairs.indexOf(c.pair) < 0) pairs.push(c.pair); });
    sym.innerHTML = '';
    pairs.forEach(function (p) { sym.appendChild(el('option', { value: p, text: p })); });
    fillTimeframes();
    sym.onchange = function () { fillTimeframes(); renderCellInfo(); };
    tf.onchange = function () { renderCellInfo(); };
    var info = q('cellinfo');
    if (info) info.onclick = renderCellInfo;
    if (!S.cells_cache.from) {
      var cell = cellFor();
      if (cell) {
        var from = q('f-from'), to = q('f-to');
        var mid = new Date((cell.first + cell.last) / 2);
        var p = function (d) { return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
        if (from) from.value = p(mid);
        if (to) to.value = p(new Date(cell.last));
        S.cells_cache.from = true;
      }
    }
    renderCellInfo();
  }

  function fillTimeframes() {
    var sym = q('f-symbol'), tf = q('f-timeframe');
    if (!sym || !tf) return;
    var want = sym.value;
    var tfs = S.cells.filter(function (c) { return c.pair === want; }).map(function (c) { return c.timeframe; });
    tf.innerHTML = '';
    tfs.forEach(function (t) { tf.appendChild(el('option', { value: t, text: t })); });
  }

  function cellFor() {
    var sym = q('f-symbol'), tf = q('f-timeframe');
    if (!sym || !tf) return null;
    return S.cells.filter(function (c) { return c.pair === sym.value && c.timeframe === tf.value; })[0] || null;
  }

  function renderCellInfo() {
    var cell = cellFor();
    setText('cellinfo', cell
      ? cell.bars + ' bars · ' + F.date(cell.first) + ' → ' + F.date(cell.last) + '  (the bars the room replays; everything after the start date stays hidden until you step)'
      : 'no bars cell selected');
  }

  async function doCreate() {
    clearNotes();
    if (sourceOf() === 'tv') {
      var tvSym = (q('f-symbol') || {}).value, tvTf = (q('f-timeframe') || {}).value;
      if (!tvSym || !tvTf) { note(makeErr('NO_TV_MARKET', 'pick a symbol + timeframe')); return; }
      var tvFrom = (q('f-from') || {}).value, tvTo = (q('f-to') || {}).value;
      var tvBody = {
        name: (q('f-name') || {}).value || ('backtest ' + tvSym + ' ' + tvTf + ' · tv'),
        strategy: (q('f-strategy') || {}).value || null,
        symbol: tvSym, timeframe: tvTf, symbols: [tvSym], barsSource: 'tv',
        startDate: tvFrom ? new Date(tvFrom).toISOString() : null,
        endDate: tvTo ? new Date(tvTo).toISOString() : null,
        startingBalance: Number((q('f-balance') || {}).value || 10000),
        actor: 'human',
      };
      S.busy = true;
      setText('cellinfo', 'loading up to 5000 closed bars from the TradingView feed…');
      try { var tr = await api('POST', '/create', tvBody); await attach(tr.session); } catch (e) { note(e); }
      S.busy = false;
      if (sourceOf() === 'tv') void renderTvForm(); // the note returns to the source description (never a stale 'loading…')
      return;
    }
    var cell = cellFor();
    if (!cell) { note(makeErr('NO_CELL', 'pick a symbol + timeframe')); return; }
    var fromV = (q('f-from') || {}).value;
    var toV = (q('f-to') || {}).value;
    var body = {
      name: (q('f-name') || {}).value || ('backtest ' + cell.pair + ' ' + cell.timeframe),
      strategy: (q('f-strategy') || {}).value || null,
      symbol: cell.pair, timeframe: cell.timeframe, symbols: [cell.pair],
      startDate: fromV ? new Date(fromV).toISOString() : null,
      endDate: toV ? new Date(toV).toISOString() : null,
      startingBalance: Number((q('f-balance') || {}).value || 10000),
      actor: 'human',
    };
    S.busy = true;
    try {
      var r = await api('POST', '/create', body);
      await attach(r.session);
    } catch (e) { note(e); }
    S.busy = false;
  }

  function renderSessions() {
    var box = q('sessions');
    if (!box) return;
    box.innerHTML = '';
    if (!S.sessions.length) { box.appendChild(el('div', { class: 'bt-muted', text: 'no sessions yet' })); return; }
    S.sessions.forEach(function (s) {
      var row = el('div', { class: 'bt-row' + (s.session_uid === S.uid ? ' attached' : '') }, [
        el('div', { class: 'top' }, [
          el('span', { text: s.name || s.session_uid }),
          el('span', { class: s.status === 'COMPLETED' ? 'v-pos' : 'v-dim', text: s.status }),
        ]),
        el('div', { class: 'bot' }, [
          el('span', { text: (s.symbol || '') + ' ' + (s.timeframe || '') }),
          el('span', { text: 'bars ' + (s.visible_bars ?? '—') + ' · fills ' + (s.fills ?? 0) + (s.win_rate == null ? '' : ' · WR ' + (Number(s.win_rate) * 100).toFixed(0) + '%') }),
        ]),
      ]);
      row.onclick = function () { attach(s.session_uid); };
      box.appendChild(row);
    });
  }

  // ─────────────────────────────────────────────────────────── controls
  function renderControlsState() {
    var st = S.st;
    var tl = q('timeline');
    var j = q('jump-at');
    if (tl) {
      tl.max = st ? String(st.barsTotal - 1) : '0';
      tl.value = st ? String(st.cursor) : '0';
      tl.disabled = !st;
    }
    if (j && st) j.value = new Date(st.now.time - new Date(st.now.time).getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    // the "now" readout — measured defect: this element existed and was never written
    setText('now', st
      ? 'bar ' + (st.cursor + 1) + '/' + st.barsTotal + ' · ' + F.date(st.now.iso) + ' ' + F.time(st.now.iso) + ' · C ' + (st.now.bar ? st.now.bar.close : '—')
      : 'no session');
    var on = !!st;
    ['go-first', 'step-back', 'play', 'pause', 'step-fwd', 'go-last', 'jump-go', 'place', 'apply-manage'].forEach(function (k) {
      var n = q(k); if (n) n.disabled = !on;
    });
  }

  function renderHud() {
    var st = S.st, hud = q('hud'), lg = q('legend');
    if (!hud) return;
    if (!st) { hud.textContent = ''; if (lg) lg.textContent = ''; return; }
    var bar = st.now.bar;
    // the workbench's status line shows the live OHLC; this HUD is only the fallback when no chart mounted
    hud.style.display = WB.api ? 'none' : '';
    hud.textContent = st.symbol + ' · ' + st.timeframe + '\n' + F.date(st.now.iso) + ' ' + F.time(st.now.iso) +
      '\nO ' + px(bar.open) + '  H ' + px(bar.high) + '\nL ' + px(bar.low) + '  C ' + px(bar.close);
    if (lg) {
      var p = st.positions[0];
      lg.textContent = 'visible ' + st.visibleBars + ' / ' + st.barsTotal + '  (' + st.futureHidden + ' hidden)' +
        (p ? '\n' + p.side.toUpperCase() + ' ' + F.int(p.qty) + ' @ ' + px(p.entry) + '\nSL ' + (p.sl == null ? '—' : px(p.sl)) + '   TP ' + (p.tp == null ? '—' : px(p.tp)) : '');
    }
  }

  // ─────────────────────────────────────────────────────────── the chart (the workbench)
  // A full navigable Vela chart (pan / zoom / crosshair / drawing tools / indicators) over the
  // room provider: it shows EXACTLY the bars the engine revealed (the room slices bars[..cursor]
  // server-side — no lookahead can reach it). Each newly revealed bar is pushed live; a seek
  // BACKWARDS re-points the chart at room:<uid>.r<n> (a clean reload of the revealed window).
  var TF_CODE = { '1m': '1', '5m': '5', '15m': '15', '30m': '30', '1H': '60', '4H': '240', '1D': '1D' };
  var WB = { api: null, loading: null, ticker: null, uid: null, lastTime: null, reloads: 0, levelIds: [], levelKey: '', gen: 0, failedAt: 0, reloadAt: 0, host: null };
  window.PlutusBacktestChart = WB; // the probe handle (VIL captures, script tests)

  function ensureWorkbench() {
    if (WB.api && WB.host && WB.host.isConnected) return Promise.resolve(WB.api);
    if (WB.api) { try { WB.api.destroy(); } catch (e) { /* host gone */ } WB.api = null; } // bound to a detached host
    if (WB.loading) return WB.loading;
    if (WB.failedAt && Date.now() - WB.failedAt < 15000) { // a failed bundle is not re-fetched every paint — and it STAYS named
      var em1 = q('chart-empty'); if (em1 && em1.style.display === 'none') { em1.style.display = 'flex'; em1.textContent = 'WORKBENCH_ABSENT — retrying shortly'; }
      return Promise.resolve(null);
    }
    var host = q('chart');
    if (!host) return Promise.resolve(null); // the fragment is not mounted — nothing to draw into
    var gen = WB.gen;
    var apiBase = (window.dashboardConfig && window.dashboardConfig.apiBase) || 'http://127.0.0.1:9851';
    var origin;
    // the bundle loads from the dashboard API origin, which must be LOOPBACK (the preload's API_BASE)
    try { var u = new URL(apiBase); if (['127.0.0.1', 'localhost', '[::1]'].indexOf(u.hostname) < 0 || !/^https?:$/.test(u.protocol)) throw new Error(u.origin + ' is not a loopback API origin'); origin = u.origin; }
    catch (e) { var em0 = q('chart-empty'); if (em0) { em0.style.display = 'flex'; em0.textContent = 'WORKBENCH_ORIGIN_REFUSED — ' + e.message; } return Promise.resolve(null); }
    var thisLoad = WB.loading = import(origin + '/charts/workbench.bundle.js').then(function (mod) {
      WB.reloads = 1;
      WB.ticker = replayTicker(1);
      if (!mod || typeof mod.mountWorkbench !== 'function') throw new Error('the bundle has no mountWorkbench');
      if (gen !== WB.gen || !host.isConnected) { if (WB.loading === thisLoad) WB.loading = null; return null; } // unmounted while the bundle loaded
      WB.host = host;
      WB.api = mod.mountWorkbench(host, {
        symbol: 'room:' + WB.ticker, timeframe: TF_CODE[(S.st && S.st.timeframe) || '1H'] || '60', layout: false,
        roomBase: function () { return S.base; }, watermark: false, live: true,
        onError: function (e) {
          if (e) { note({ message: e.message }); S.chartErrMsg = e.message; return; }
          // recovered: clear the box ONLY while it still shows this chart error (an order refusal stays)
          if (S.chartErrMsg) { ['order-err', 'create-err'].forEach(function (k) { var b = q(k); if (b && b.textContent === S.chartErrMsg) b.textContent = ''; }); S.chartErrMsg = null; }
        },
      });
      if (!WB.api.room || typeof WB.api.room.alias !== 'function' || typeof WB.api.room.push !== 'function' || typeof WB.api.forgetBars !== 'function' || typeof WB.api.setMarket !== 'function') {
        try { WB.api.destroy(); } catch (x) { /* best effort */ } // never leave an incompatible chart mounted
        WB.api = null;
        throw new Error('the workbench bundle predates the replay room API (room.alias/push, forgetBars)');
      }
      WB.api.room.alias(WB.ticker, S.uid, TF_CODE[(S.st && S.st.timeframe) || '1H'] || '60');
      WB.uid = S.uid;
      var hud0 = q('hud'); if (hud0) hud0.style.display = 'none'; // the workbench status line owns the OHLC now
      if (WB.loading === thisLoad) WB.loading = null; // only OUR tracker — never a newer mount's in-flight load
      return WB.api;
    }).catch(function (e) {
      if (WB.loading === thisLoad) WB.loading = null;
      WB.failedAt = Date.now();
      var em = q('chart-empty');
      if (em) { em.style.display = 'flex'; em.textContent = 'WORKBENCH_ABSENT — ' + (e && e.message); }
      return null;
    });
    return WB.loading;
  }

  /** REPLAY-EURUSD, then REPLAY-EURUSD.2, .3 … — Vela only refetches on a NEW symbol. */
  function replayTicker(n) {
    var sym = String((S.st && S.st.symbol) || 'SESSION').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return 'REPLAY-' + sym + (n > 1 ? '.' + n : '');
  }

  function reloadRoomChart(wb) {
    WB.reloadAt = Date.now();
    WB.reloads += 1;
    WB.ticker = replayTicker(WB.reloads);
    wb.room.alias(WB.ticker, S.uid, TF_CODE[(S.st && S.st.timeframe) || '1H'] || '60');
    wb.forgetBars('room', WB.ticker);
    WB.uid = S.uid; WB.lastTime = null; WB.levelKey = '';
    Promise.resolve(wb.setMarket({ symbol: 'room:' + WB.ticker, timeframe: TF_CODE[(S.st && S.st.timeframe) || '1H'] || '60' })).catch(function (e) {
      note({ message: 'chart reload failed: ' + (e && e.message) });
    });
  }

  function syncRoomChart(wb, w) {
    var bars = w.bars || [];
    var last = bars.length ? bars[bars.length - 1].time : null;
    if (WB.uid !== S.uid) { reloadRoomChart(wb); WB.lastTime = last; return; }         // another session
    if (WB.lastTime == null) { WB.lastTime = last; return; }                            // the first load
    if (last < WB.lastTime) { reloadRoomChart(wb); WB.lastTime = last; return; }        // seek / reset backwards
    var fresh = bars.filter(function (b) { return b.time > WB.lastTime; });
    if (!fresh.length) return;
    if (fresh.length === bars.length) { reloadRoomChart(wb); WB.lastTime = last; return; } // a jump past the window
    var pushed = wb.room.push(WB.ticker, fresh);
    // nobody subscribed yet (Vela still loading): the bars were NOT delivered — reload, never advance past them
    if (!pushed || pushed.subscribers === 0) {
      // a reload in flight will subscribe shortly: hold lastTime (these bars are re-pushed then; updateBar is
      // idempotent) instead of reloading on every sync
      if (Date.now() - (WB.reloadAt || 0) < 1500) return;
      reloadRoomChart(wb); WB.lastTime = last; return;
    }
    if (pushed.errors && pushed.errors.length) note({ message: 'chart: ' + pushed.errors.length + ' bar(s) not drawn — ' + pushed.errors[0].error });
    WB.lastTime = last;
  }

  /** The open position's SL / TP / entry as live price lines, and the fills as stamps. */
  function drawTradeLevels(wb) {
    var st = S.st;
    var p = st && st.positions[0];
    var fills = (st && st.recentFills) || [];
    var key = p ? [p.id, p.sl, p.tp, p.entry].join('|') : 'flat';
    key += '#' + fills.map(function (f) { return f.time + f.kind; }).join(',');
    if (key === WB.levelKey) return;
    var ch = wb.chart;
    // the key is recorded only once the levels are actually DRAWN — a chart not ready yet retries next paint
    if (!ch || !ch.drawings || typeof ch.drawings.add !== 'function') return;
    WB.levelKey = key;
    WB.levelIds.forEach(function (id) { try { ch.drawings.remove(id); } catch (e) { /* already gone */ } });
    WB.levelIds = [];
    var add = function (type, init) { try { var d = ch.drawings.add(type, init); if (d) WB.levelIds.push(d.id); } catch (e) { /* the level stays in the side panel */ } };
    var t0 = (S.win && S.win.bars && S.win.bars.length) ? S.win.bars[S.win.bars.length - 1].time : Date.now();
    if (p) {
      [[p.sl, '#9C6B6B', 'SL'], [p.tp, '#7E9C82', 'TP'], [p.entry, '#C8A96A', 'ENTRY']].forEach(function (t) {
        if (t[0] == null) return;
        add('hline', { anchors: [{ time: t0, price: Number(t[0]) }], style: { lineColor: t[1], lineWidth: 1, lineStyle: 'dashed' }, text: { content: t[2] + ' ' + px(t[0]) } });
      });
    }
    fills.forEach(function (f) {
      add('iconstamp', { anchors: [{ time: f.time, price: Number(f.price) }], props: { glyph: f.side === 'buy' ? '\u25B2' : '\u25BC' },
        style: { lineColor: f.kind === 'entry' ? '#C8A96A' : '#7E9C82', lineWidth: 2, lineStyle: 'solid' } });
    });
  }

  function renderChart() {
    var host = q('chart');
    var empty = q('chart-empty');
    if (!host) return;
    var w = S.win;
    if (!S.uid || !w || !w.bars || !w.bars.length) {
      if (empty) {
        empty.style.display = 'flex';
        // a NAMED state (SESSION_NOT_LIVE …) stays until a session attaches; otherwise the plain prompt
        if (!S.ghostShown) empty.textContent = 'no session — create one on the left';
      }
      return;
    }
    S.ghostShown = false;
    if (empty) empty.style.display = 'none';
    var uidAt = S.uid;
    var genAt = WB.gen;
    ensureWorkbench().then(function (wb) {
      if (!wb) return;
      // a newer window, an unmount, or a detached host since this paint: its own paint (if any) syncs it
      if (S.uid !== uidAt || S.win !== w || WB.gen !== genAt || !WB.host || !WB.host.isConnected) return;
      syncRoomChart(wb, w); // a throw here rejects this chain: surfaced by the .catch below
      drawTradeLevels(wb);
    }).catch(function (e) {
      var em = q('chart-empty');
      if (em) { em.style.display = 'flex'; em.textContent = 'CHART_SYNC_FAILED — ' + (e && e.message); }
    });
  }

  // ─────────────────────────────────────────────────────────── the details strip (canon envelope)
  function renderStrip() {
    var box = q('strip');
    if (!box) return;
    box.innerHTML = '';
    var st = S.st;
    if (!st) {
      box.appendChild(el('div', { class: 'bt-cell wide' }, [el('div', { class: 'k', text: 'no session' }), el('div', { class: 'v v-dim', text: '—' })]));
      return;
    }
    var s = st.stats;
    var cell = function (k, v, note, cls) {
      return el('div', { class: 'bt-cell' + (cls ? ' ' + cls : '') }, [
        el('div', { class: 'k', text: k }),
        el('div', { class: 'v', text: v }),
        note ? el('div', { class: 'n', text: note }) : null,
      ]);
    };
    var money = function (v) { return F.money(v); };
    box.appendChild(cell('balance', money(st.balance), 'start ' + money(st.startingBalance)));
    box.appendChild(cell('equity', money(st.equity), (st.unrealized < 0 ? '' : '+') + F.money(st.unrealized, { bare: true }) + ' open', st.unrealized < 0 ? 'v-neg' : 'v-pos'));
    box.appendChild(cell('realized', money(st.realized), s.trades_total + ' closed trades'));
    box.appendChild(cell('win rate', s.winRate.guard === 'NO_ESTIMATE' ? 'no estimate' : F.pct(s.winRate.estimate * 100),
      'n=' + s.winRate.n + (s.winRate.ci ? ' · 95% CI [' + (s.winRate.ci.lo * 100).toFixed(1) + '%, ' + (s.winRate.ci.hi * 100).toFixed(1) + '%]' : ''),
      s.winRate.guard === 'OK' ? '' : 'v-dim'));
    box.appendChild(cell('profit factor', s.profitFactor.value == null ? '—' : F.num(s.profitFactor.value),
      s.profitFactor.value == null ? ('n=' + s.profitFactor.n + ' · ' + (s.profitFactor.note || 'undefined')) : ('n=' + s.profitFactor.n)));
    box.appendChild(cell('avg R', s.avgR.value == null ? '—' : F.num(s.avgR.value), 'n=' + s.avgR.n));
    box.appendChild(cell('max DD', s.max_drawdown ? F.money(s.max_drawdown.currency) : '—',
      s.max_drawdown ? F.num(s.max_drawdown.pct) + '% of peak' : ''));
    box.appendChild(cell('replay', st.visibleBars + ' / ' + st.barsTotal, st.futureHidden + ' bars hidden · ' + (st.playing ? 'PLAYING ' + st.rate + '×' : 'paused')));
    var warn = s.winRate.guard !== 'OK';
    setText('strip-note', (warn ? '⚠ ' + (s.winRate.warning || '') + ' · ' : '') + s.disclaimer +
      '   ·   canon envelope: edge-stats (10-THE-TRADING-TOOLKIT §4) via stats.mjs; win_rate sent to the canon as a FRACTION');
  }

  // ─────────────────────────────────────────────────────────── the position + orders
  function renderPosition() {
    var box = q('position');
    if (!box) return;
    box.innerHTML = '';
    var st = S.st;
    var p = st && st.positions[0];
    if (!p) { box.appendChild(el('div', { class: 'bt-muted', text: 'flat' })); return; }
    var pnl = st.unrealized;
    [['id', p.id], ['side', p.side.toUpperCase() + ' ' + F.int(p.qty) + ' / ' + F.int(p.qty0)],
      ['entry', px(p.entry)], ['sl', p.sl == null ? '—' : px(p.sl)], ['tp', p.tp == null ? '—' : px(p.tp)],
      ['trailing', p.trailing ? JSON.stringify(p.trailing) : 'off'],
      ['auto-BE', p.be ? (p.beArmed ? 'ARMED (SL moved)' : 'waiting') : 'off'],
      ['risk', p.riskAmount == null ? '—' : F.money(p.riskAmount)],
      ['open P&L', F.money(pnl)],
      ['bars in trade', (st.cursor - p.entryBar)]].forEach(function (r) {
      box.appendChild(el('div', { class: 'bt-kv' }, [el('span', { class: 'k', text: r[0] }), el('span', { class: (r[0] === 'open P&L' ? (pnl < 0 ? 'v-neg' : 'v-pos') : ''), text: String(r[1]) })]));
    });
  }

  function renderOrders() {
    var box = q('orders');
    if (!box) return;
    box.innerHTML = '';
    var st = S.st;
    var os = (st && st.orders) || [];
    if (!os.length) { box.appendChild(el('div', { class: 'bt-muted', text: 'none working' })); return; }
    os.forEach(function (o) {
      var row = el('div', { class: 'bt-kv' }, [
        el('span', { class: 'k', text: o.id + ' ' + o.side + ' ' + o.type + (o.pendingFill ? ' (next open)' : ' @ ' + o.price) }),
        el('span', { text: F.int(o.qty) + ' · SL ' + (o.sl == null ? '—' : px(o.sl)) + ' TP ' + (o.tp == null ? '—' : px(o.tp)) }),
      ]);
      var c = el('button', { class: 'bt-note-btn', text: 'CANCEL' });
      c.onclick = function () { return act('POST', '/cancel', { session: S.uid, id: o.id }); };
      row.appendChild(c);
      box.appendChild(row);
    });
  }

  // ─────────────────────────────────────────────────────────── the journal rail
  function renderJournal() {
    var box = q('jtrades');
    var sn = q('snotes'), stg = q('stags');
    var st = S.st;
    if (sn && document.activeElement !== sn) sn.value = st ? (st.sessionNotes || '') : '';
    if (stg && document.activeElement !== stg) stg.value = st ? (st.tags || []).join(', ') : '';
    if (!box) return;
    box.innerHTML = '';
    var rows = (st && st.recentFills) || [];
    if (!rows.length) { box.appendChild(el('div', { class: 'bt-muted', text: 'every simulated trade auto-logs here' })); return; }
    var tbl = el('table', { class: 'bt-table' }, [
      el('thead', {}, [el('tr', {}, ['#', 'KIND', 'SIDE', 'QTY', 'PRICE', 'P&L', 'BAR', 'NOTE'].map(function (h) { return el('th', { text: h }); }))]),
    ]);
    var tb = el('tbody', {});
    rows.slice().reverse().forEach(function (f) {
      var tr = el('tr', {}, [
        el('td', { text: String(f.seq) }),
        el('td', { text: f.kind + (f.reason ? '/' + f.reason : '') }),
        el('td', { text: f.side.toUpperCase() }),
        el('td', { class: 'num', text: F.int(f.qty) }),
        el('td', { class: 'num', text: px(f.price) }),
        el('td', { class: 'num ' + (f.pnl > 0 ? 'v-pos' : (f.pnl < 0 ? 'v-neg' : '')), text: f.pnl ? F.money(f.pnl) : '—' }),
        el('td', { class: 'num bar', text: F.date(f.iso).replace(/, \d{4}$/, '') + ' ' + F.time(f.iso) }),
      ]);
      var td = el('td', { class: 'note' });
      var b = el('button', { class: 'bt-note-btn', text: '\u270E', title: 'add a note to this trade' });
      b.onclick = function () {
        var t = window.prompt('note for ' + f.positionId + ' (this fill\'s position):', '');
        if (t == null) return;
        act('POST', '/note', { session: S.uid, tradeId: f.positionId, text: t });
      };
      td.appendChild(b);
      tr.appendChild(td);
      tb.appendChild(tr);
    });
    tbl.appendChild(tb);
    box.appendChild(tbl);
  }

  // ─────────────────────────────────────────────────────────── the ticket + actions
  function levelFrom(modeSel, valueInput, label) {
    var mode = (q(modeSel) || {}).value;
    var raw = (q(valueInput) || {}).value;
    if (raw === '' || raw == null) return null;
    var v = Number(raw);
    if (!isFinite(v)) { note(makeErr('BAD_LEVEL', label + ' is not a number')); return null; }
    return { mode: mode, value: v };
  }

  async function act(method, path, body) {
    clearNotes();
    if (!S.uid && path !== '/create') { note(makeErr('SESSION_REQUIRED', 'create or attach a session first')); return null; }
    S.busy = true;
    try {
      var r = await api(method, path, Object.assign({ session: S.uid, actor: 'human' }, body || {}));
      if (r.status) { S.st = r.status; await pullWindow(); paint(); }
      return r;
    } catch (e) { note(e); return null; } finally { S.busy = false; }
  }

  async function doPlace() {
    var type = (q('o-type') || {}).value || 'market';
    var sizeMode = (q('o-sizemode') || {}).value;
    var sizeVal = Number((q('o-size') || {}).value);
    var body = {
      side: S.side, type: type,
      sl: levelFrom('o-slmode', 'o-sl', 'SL'),
      tp: levelFrom('o-tpmode', 'o-tp', 'TP'),
      tag: (q('o-tag') || {}).value || null,
    };
    if (sizeMode === 'qty') body.qty = sizeVal; else body.riskPct = sizeVal;
    if (type !== 'market') {
      var p = Number((q('o-price') || {}).value);
      if (!isFinite(p) || (q('o-price') || {}).value === '') { note(makeErr('BAD_PRICE', type + ' needs a trigger price')); return; }
      body.price = p;
    }
    var tr = Number((q('o-trail') || {}).value);
    if ((q('o-trail') || {}).value !== '' && isFinite(tr)) body.trailing = { dist: { mode: 'ticks', value: tr } };
    if ((q('o-be') || {}).checked) body.be = true;
    var r = await act('POST', '/place', body);
    if (r) { var l = await api('GET', '/status?session=' + encodeURIComponent(S.uid)); S.st = l.status; paint(); }
  }

  async function doManage() {
    var patch = {};
    var slRaw = (q('m-sl') || {}).value;
    if (slRaw !== '' && slRaw != null) patch.sl = { mode: 'ticks', value: Number(slRaw) };
    var tpRaw = (q('m-tp') || {}).value;
    if (tpRaw !== '' && tpRaw != null) patch.tp = { mode: 'ticks', value: Number(tpRaw) };
    var trRaw = (q('m-trail') || {}).value;
    if (trRaw !== '' && trRaw != null) patch.trailing = { dist: { mode: 'ticks', value: Number(trRaw) } };
    if ((q('m-be') || {}).checked) patch.be = true;
    var st = S.st;
    var target = (st && (st.positions[0] || st.orders[0]));
    if (!target) { note(makeErr('POSITION_NOT_FOUND', 'nothing open to modify')); return; }
    if (!Object.keys(patch).length) { note(makeErr('BAD_ORDER', 'set at least one field to modify')); return; }
    patch.id = target.id;
    await act('POST', '/modify', patch);
  }

  // ─────────────────────────────────────────────────────────── layout (collapsible panels)
  // Each panel collapses independently; FOCUS collapses all three. The chart column takes the space and
  // the Vela chart is told to re-measure (a flex change does not always fire its own observer).
  var LAYOUT_KEY = 'plutus.bt.layout';
  var PANES = ['left', 'journal', 'right'];
  function readLayout() {
    var d = { left: false, journal: false, right: false };
    try { var j = JSON.parse(localStorage.getItem(LAYOUT_KEY) || '{}'); PANES.forEach(function (p) { d[p] = j[p] === true; }); } catch (e) { /* default */ }
    return d;
  }
  function applyLayout(hidden) {
    if (!S.root) return;
    PANES.forEach(function (p) {
      S.root.setAttribute('data-hide-' + p, hidden[p] ? '1' : '0');
      var b = q('lay-' + p); if (b) b.setAttribute('aria-pressed', hidden[p] ? 'false' : 'true');
    });
    var all = PANES.every(function (p) { return hidden[p]; });
    var f = q('lay-focus'); if (f) f.setAttribute('aria-pressed', all ? 'true' : 'false');
    try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(hidden)); } catch (e) { /* storage off */ }
    var resize = function () { try { if (WB.api && WB.api.chart) WB.api.chart.resize(); } catch (e) { /* not mounted */ } };
    requestAnimationFrame(function () { resize(); setTimeout(resize, 120); });
  }
  function wireLayout() {
    var hidden = readLayout();
    PANES.forEach(function (p) {
      var b = q('lay-' + p);
      if (b) b.onclick = function () { hidden[p] = !hidden[p]; applyLayout(hidden); };
    });
    // the panel-level controls: the button ON a panel collapses it; its rail expands it again
    [['col-left', 'left'], ['rail-left', 'left'], ['col-right', 'right'], ['rail-right', 'right'], ['col-journal', 'journal'], ['rail-journal', 'journal']]
      .forEach(function (pair) {
        var b = q(pair[0]);
        if (b) b.onclick = function () { hidden[pair[1]] = !hidden[pair[1]]; applyLayout(hidden); };
      });
    var f = q('lay-focus');
    if (f) f.onclick = function () {
      var all = PANES.every(function (p) { return hidden[p]; });
      PANES.forEach(function (p) { hidden[p] = !all; });
      applyLayout(hidden);
    };
    applyLayout(hidden);
  }

  // ─────────────────────────────────────────────────────────── wiring
  function wire() {
    var on = function (k, fn) { var n = q(k); if (n) n.onclick = fn; };
    var onSel = function (k, fn) { var n = q(k); if (n) n.onchange = fn; };

    on('create', doCreate);
    on('refresh', function () { refreshAll(true); });
    wireLayout();
    q('side').querySelectorAll('.bt-side-btn').forEach(function (b) {
      b.onclick = function () {
        S.side = b.dataset.side;
        q('side').querySelectorAll('.bt-side-btn').forEach(function (x) { x.classList.toggle('active', x === b); });
      };
    });
    onSel('o-type', function () {
      var t = q('o-type').value;
      var p = q('o-price');
      p.disabled = t === 'market';
      if (!p.disabled && (!p.value || p.value === '') && S.st) p.value = S.st.now.bar.close;
    });
    on('place', doPlace);
    on('apply-manage', doManage);
    ['25', '50', '75', '100'].forEach(function (pc) {
      on('pc-' + pc, function () { act('POST', '/close', { pct: Number(pc), reason: 'PARTIAL' }); });
    });
    on('pc-go', function () {
      var v = Number((q('pc-custom') || {}).value);
      if (!isFinite(v) || v <= 0 || v > 100) { note(makeErr('BAD_PCT', 'close % must be 0 < pct <= 100')); return; }
      act('POST', '/close', { pct: v, reason: 'MANUAL' });
    });
    on('step-fwd', function () { act('POST', '/step', { delta: 1 }); });
    on('step-back', function () { act('POST', '/step', { delta: -1 }); });
    on('play', function () { act('POST', '/play', { rate: Number((q('speed') || {}).value || 2) }); });
    on('pause', function () { act('POST', '/pause', {}); });
    on('go-first', function () { act('POST', '/jump', { barIndex: 0 }); });
    on('go-last', function () { act('POST', '/jump', { barIndex: q('timeline').max }); });
    on('jump-go', function () {
      var v = (q('jump-at') || {}).value;
      if (!v) { note(makeErr('BAD_DATE', 'pick a date to jump to')); return; }
      act('POST', '/jump', { ms: new Date(v).getTime() });
    });
    on('save-note', function () {
      var text = (q('snotes') || {}).value || '';
      var tags = ((q('stags') || {}).value || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      act('POST', '/note', { text: text, tags: tags }).then(function (r) { if (r) setText('note-info', 'saved ' + (r.status ? r.status.visibleBars : '') + ' bars-in · tags: ' + tags.join(', ')); });
    });
    var tl = q('timeline');
    if (tl) {
      tl.onchange = function () { act('POST', '/jump', { barIndex: Number(tl.value) }); };
    }
    var speed = q('speed');
    if (speed) speed.onchange = function () { if (S.st && S.st.playing) act('POST', '/play', { rate: Number(speed.value) }); };
  }

  // ─────────────────────────────────────────────────────────── the registration
  var api_ = {
    key: KEY, navPage: KEY, label: 'BACKTEST', containerId: 'page-' + KEY,
    version: VERSION,
    mount: mount, unmount: unmount,
    refresh: function () { return refreshAll(true); },
    state: function () { return { base: S.base, uid: S.uid, status: S.st }; },
  };

  if (SH.registerTab) SH.registerTab(api_);
  window.PlutusBacktestRoom = api_;

  console.log('[backtest-room] module loaded v' + VERSION + ' — nav data-page="' + KEY + '", mounts into #main-content (or #page-' + KEY + ')');
})();
