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
    win: null, es: null, poll: null, host: null, root: null, cells_cache: {}, switching: false, switchTimer: null, pinAt: 0,
    side: 'buy', busy: false, lastErr: null, attached: null, sessions: [], timers: {},
    seekArmed: false, // SELECT BAR is ONE-SHOT (operator 2026-10-02): armed by its button, spent by ONE chart click   // the ✂ SEEK toggle (the visible scissor): armed = a chart click seeks the replay there
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
      apiBase: function () { return (window.dashboardConfig && window.dashboardConfig.apiBase) || 'http://127.0.0.1:9430'; },
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
        time: function (ts) { var dt = ts ? new Date(ts) : null; return dt && !isNaN(dt) ? dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, hourCycle: 'h23' }) : '—'; },  // h23, or midnight prints 24:xx
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
      // 4s, not 2s: the probe's timer runs on the renderer's event loop - a busy renderer (a Pine run, a chart
      // reload) fired the 2s abort before a 1ms answer was read (measured 2026-10-01: DOWN with :9443 healthy)
      var r = await SH.probe(b + '/health', { timeoutMs: 4000 });
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
    Object.keys(S.timers).forEach(function (k) { clearTimeout(S.timers[k]); clearInterval(S.timers[k]); });
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
    armWatch();
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

  // THE LIVENESS WATCH: the room is re-probed every 5s while the tab is mounted (measured 2026-10-01: kill -9 the
  // room and the tab read 'ROOM :9443' for 40s+, nothing was polling without a session, and an attached stream
  // retries silently). Two misses -> DOWN (the stream/poller close; paintDown() schedules the recovery, and the
  // recovered refreshAll re-drives the existing resume path for the attached session).
  function armWatch() {
    clearTimeout(S.timers.watch);
    S.timers.watch = setTimeout(async function watch() {
      try { await watchOnce(watch); } catch (e) { console.warn('[backtest-room] watch tick failed', e); if (S.root) S.timers.watch = setTimeout(watch, 5000); }
    }, 5000);
  }
  async function watchOnce(watch) {
    {
      if (!S.root || !S.base) return;
      var r;
      try { r = await SH.probe(S.base + '/health', { timeoutMs: 4000 }); } catch (e) { r = { up: false, why: String((e && e.message) || e) }; }
      if (!S.root || !S.base) return;
      if (r.up) { S.watchMiss = 0; S.timers.watch = setTimeout(watch, 5000); return; }
      S.watchMiss = (S.watchMiss || 0) + 1;
      if (S.watchMiss < 2) { S.timers.watch = setTimeout(watch, 2000); return; }
      S.watchMiss = 0;
      if (S.es) { try { S.es.close(); } catch (e) { /* closed */ } S.es = null; }
      if (S.poll) { try { S.poll.stop(); } catch (e) { /* stopped */ } S.poll = null; }
      S.baseWhy = 'lost ' + S.base.replace('http://', '') + ' (' + (r.why || 'no answer') + ')';
      S.base = null;
      if (S.resumeTried && S.uid) delete S.resumeTried[S.uid]; // the restarted room gets one resume attempt
      paintDown();
    }
  }

  async function pullStatus() {
    if (!S.uid) return;
    try {
      var r = await api('GET', '/status?session=' + encodeURIComponent(S.uid));
      S.st = r.status;
      await pullWindow();
      // THE ROOM PROVIDER IS PINNED ON THE SESSION POLL (measured 2026-10-01: the operator's "backtesting tab
      // switches to live charts instead of replay mode if I change the asset"). It lives HERE, not in renderChart:
      // when the replay window has no bars renderChart returns early, and that is exactly the state in which the
      // chart is left showing whatever the pick drifted it to (the TV feed). This poll runs every 1.2s, always.
      if (WB.api) pinRoomMarket(WB.api);
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
        // NO DEAD END (measured 2026-10-03). The operator hit "SESSION_NOT_LIVE … (RESUME_DIVERGED). Create a
        // new session." and the tab gave them NOTHING to click: no chart, no button, no auto-attach — while 17
        // live sessions sat in the rail. A refused resume must still leave a WORKING chart. If any session is
        // RUNNING and not a ghost, attach it now; if none is, put a real button in the empty state.
        var alt = (S.sessions || []).filter(function (x) { return x.status === 'RUNNING' && !(S.ghosts && S.ghosts[x.session_uid]); });
        if (alt.length) {
          if (em) { em.style.display = 'flex'; em.textContent = ghost + ' could not be resumed (' + (S.resumeRefusal || 'RESUME_FAILED') + ') — attaching ' + alt[0].session_uid + '…'; }
          await attach(alt[0].session_uid);
          return;
        }
        S.ghostShown = true;
        paint();
        if (em) {
          em.style.display = 'flex'; em.textContent = '';
          var msg = document.createElement('div');
          msg.textContent = 'NO LIVE SESSION — ' + ghost + ' could not be resumed after the room restarted (' + (S.resumeRefusal || 'RESUME_FAILED') + ').';
          var act = document.createElement('div');
          act.style.cssText = 'margin-top:10px;display:inline-block;padding:6px 14px;border:1px solid #C8A96A;color:#C8A96A;cursor:pointer;font:11px/1 ui-monospace,monospace;letter-spacing:.08em';
          act.textContent = 'CREATE SESSION';
          act.addEventListener('click', function () {
            // the rail's own CREATE control, by its real attribute (backtest.html:54)
            var rail = document.querySelector('[data-bt="create"]');
            if (rail) { rail.scrollIntoView({ block: 'center' }); rail.focus(); }
          });
          em.append(msg, act);
        }
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
    // THE ROOM PROVIDER PIN - a dedicated timer, deliberately NOT on renderChart (returns early when the replay
    // window has no bars) and NOT on the session poll (startPoll only runs when the SSE stream FAILS - measured
    // 2026-10-01: with a healthy stream the pin never ran at all). Every attach passes here, whatever the
    // transport is doing. This is the operator's reported bug: "backtesting tab switches to live charts instead of
    // replay mode if I change the asset".
    clearInterval(S.timers.pin);
    S.timers.pin = setInterval(function () { if (WB.api && S.uid) pinRoomMarket(WB.api); }, 1000);
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
        } else if (d.type === 'removed') {
          if (d.session === S.uid) { S.uid = null; S.st = null; S.win = null; }
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
    var ce = q('create-err'); if (ce) ce.textContent = 'the control surface is down (127.0.0.1:' + PORTS.join('/') + ') - rechecking every 4s';
    // SELF-RECOVERY: a DOWN room is re-probed while the tab is mounted (measured 2026-10-01: one failed probe left the
    // tab on BACKTEST_ROOM_DOWN forever with the room healthy; only REFRESH recovered). unmount() clears S.timers.
    clearTimeout(S.timers.recover);
    S.timers.recover = setTimeout(function () { if (S.root) refreshAll(true).catch(function () { /* the next DOWN reschedules */ }); }, 4000);
  }

  function paintService(up) {
    var dot = q('dot'), svc = q('svc');
    if (dot) dot.className = 'ps-dot ' + (up ? 'ps-dot-ok' : 'ps-dot-down');
    if (svc) svc.textContent = 'ROOM ' + (S.base ? S.base.replace('http://127.0.0.1:', ':') : 'DOWN') + ' · v' + VERSION;
    if (up) {
      clearTimeout(S.timers.recover); // a recovered room cancels a pending recovery probe (no overlapping cycles)
      // a recovered room clears what paintDown() wrote; a live session repaints the chart over it
      var w = q('chart-empty'); if (w && /^BACKTEST_ROOM_DOWN/.test(w.textContent)) w.textContent = 'no session - create one (SESSIONS) or attach a running one';
      var ce = q('create-err'); if (ce && /control surface is down/.test(ce.textContent)) ce.textContent = '';
      // an outage's transport errors are not the operator's order errors: a recovered room clears them
      var oe = q('order-err'); if (oe && /\[(TRANSPORT|BACKTEST_ROOM_DOWN)\]/.test(oe.textContent)) oe.textContent = '';
    }
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
  function clearNotes() { ['order-err', 'create-err', 'order-ack'].forEach(function (k) { var n = q(k); if (n) n.textContent = ''; }); }

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
      try { var tr = await api('POST', '/create', tvBody); await attach(tr.session); await landReplay(tr.session, { playing: false }); } catch (e) { note(e); }
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
      // START FROM AN EMPTY FROM-FIELD → cursor 0 → the same one-bar window as a fresh tv session. landReplay
      // never rewinds, so a session created mid-series (the form's default) is left exactly where it starts.
      await landReplay(r.session, { playing: false });
    } catch (e) { note(e); }
    S.busy = false;
  }

  function renderSessions() {
    var box = q('sessions');
    if (!box) return;
    box.innerHTML = '';
    if (!S.sessions.length) { box.appendChild(el('div', { class: 'bt-muted', text: 'no sessions yet' })); return; }
    S.sessions.forEach(function (s) {
      var del = el('button', { class: 'bt-del', text: '✕', title: 'delete this session and everything it recorded (trades, events) — cannot be undone' });
      del.onclick = function (ev) { if (ev && ev.stopPropagation) ev.stopPropagation(); void delSession(s.session_uid, s.name); };
      var row = el('div', { class: 'bt-row' + (s.session_uid === S.uid ? ' attached' : '') }, [
        el('div', { class: 'top' }, [
          el('span', { text: s.name || s.session_uid }),
          el('span', { class: s.status === 'COMPLETED' ? 'v-pos' : 'v-dim', text: s.status }),
          del,
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

  /** DELETE a session (the operator's missing verb): confirm, call the room's /delete, detach if it
   * was the attached one, refresh. The room erases the row + its trades + its events together. */
  async function delSession(uid, name) {
    var label = name || uid;
    if (typeof window.confirm === 'function' && !window.confirm('delete "' + label + '"?\n\nits recorded trades and events go too — this cannot be undone.')) return;
    try {
      var r = await api('POST', '/delete', { session: uid });
      if (S.uid === uid) { S.uid = null; S.st = null; S.win = null; }
      note('deleted ' + label + ' (' + JSON.stringify(r.deleted || {}) + ')');
      await refreshAll(true);
    } catch (e) {
      note(makeErr('DELETE_REFUSED', (e && e.message) || String(e)));
    }
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
      ? 'bar ' + (st.cursor + 1) + '/' + st.barsTotal + ' · ' + F.date(st.now.iso) + ' ' + F.time(st.now.iso) + ' · C ' + (st.now.bar ? px(st.now.bar.close) : '—')
      : 'no session');
    var on = !!st;
    ['select-back', 'select-fwd', 'step-back', 'play', 'pause', 'step-fwd', 'jump-go', 'place', 'apply-manage'].forEach(function (k) {
      var n = q(k); if (n) n.disabled = !on;
    });
    var tfl = q('tf'); if (tfl) tfl.textContent = st ? String(st.timeframe || '').toLowerCase() : '—';
    var te = q('to-end'); if (te) te.disabled = !st || st.cursor >= (st.endIndex != null ? st.endIndex : st.barsTotal - 1);
    // ONE play/pause slot: a playing replay offers PAUSE, a paused one offers PLAY (never both, never neither)
    // the PAUSE-OK state: each button always does its own job, so both stay live whenever a session exists
    ['play', 'pause'].forEach(function (k) { var n = q(k); if (n) n.disabled = !st; });
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
  // the room names its timeframes with the LABEL ('1H', '15m'); the chart uses the CODE ('60', '15'). One
  // map both ways, so a chart tf can be asked of the room in the room's own vocabulary.
  var TF_LABEL = (function () { var m = {}; for (var k in TF_CODE) m[TF_CODE[k]] = k; return m; })();
  var TF_MS = { '1m': 60000, '5m': 300000, '15m': 900000, '30m': 1800000, '1H': 3600000, '4H': 14400000, '1D': 86400000 };
  var WB = { api: null, loading: null, ticker: null, uid: null, lastTime: null, reloads: 0, levelIds: [], levelKey: '', gen: 0, failedAt: 0, reloadAt: 0, host: null };
  window.PlutusBacktestChart = WB; // the probe handle (VIL captures, script tests)

  /**
   * openPlan — WHAT IT TAKES TO LAND A FRESHLY ATTACHED REPLAY ON A USABLE CHART.
   *
   * MEASURED 2026-10-01: a new session sits at CURSOR 0, so the room's window (`GET /bars?session=…`) is ONE
   * bar and the chart draws a single flat candle — the operator's "single bar backtesting chart slop". The
   * instrument is the room's OWN verb set: `/step` is ±1 bar (200 requests to walk out of the slop — and a
   * step REVEALS the bar it lands on), `/play` runs at a rate, and `/jump {barIndex}` advances the replay to a
   * bar by re-driving every bar in between (the same verb the JUMP-TO box and SELECT BAR already use).
   *
   * THE LAW THAT SHAPES THIS FUNCTION: the room refuses a jump past the session's own horizon with
   * BAR_RANGE_EXHAUSTED (replay.mjs: `target > this.endIndex`), so the target is CLAMPED to `endIndex` and a
   * past-horizon jump is NEVER attempted — a refusal the operator would see as "the asset did not switch".
   * A session already past `want` is never rewound, and a one-bar session has nothing to jump to (no request).
   *
   * The run state is a REQUEST, not a side effect: a playing session comes up playing on the new session, at
   * the same rate, AFTER the jump (so play resumes from the advanced cursor).
   *
   * @param {{cursor?:number, endIndex?:number, want?:number, playing?:boolean, rate?:number}} o
   * @returns {{cursor,endIndex,want,barIndex,clamped,advanced,requests:Array<{verb,barIndex?,rate?}>}}
   */
  var OPEN_BARS = 200; // = the room's own default window (control.mjs: GET /bars?lookback=200)
  function openPlan(o) {
    o = o || {};
    var cur = Math.max(0, Math.floor(Number(o.cursor) || 0));
    var end = Number.isFinite(Number(o.endIndex)) ? Math.max(0, Math.floor(Number(o.endIndex))) : cur;
    var want = (Number.isFinite(Number(o.want)) && Number(o.want) > 0) ? Math.floor(Number(o.want)) : OPEN_BARS;
    var barIndex = Math.min(end, Math.max(cur, want)); // clamped: a jump past the horizon is the room's BAR_RANGE_EXHAUSTED
    var requests = [];
    if (barIndex > cur) requests.push({ verb: 'jump', barIndex: barIndex });
    if (o.playing) requests.push({ verb: 'play', rate: Number(o.rate) > 0 ? Number(o.rate) : 2 });
    return { cursor: cur, endIndex: end, want: want, barIndex: barIndex, clamped: barIndex < want, advanced: barIndex > cur, requests: requests };
  }
  WB.openPlan = openPlan;
  WB.OPEN_BARS = OPEN_BARS;

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
    var apiBase = (window.dashboardConfig && window.dashboardConfig.apiBase) || 'http://127.0.0.1:9430';
    var origin;
    // the bundle loads from the dashboard API origin, which must be LOOPBACK (the preload's API_BASE)
    try { var u = new URL(apiBase); if (['127.0.0.1', 'localhost', '[::1]'].indexOf(u.hostname) < 0 || !/^https?:$/.test(u.protocol)) throw new Error(u.origin + ' is not a loopback API origin'); origin = u.origin; }
    catch (e) { var em0 = q('chart-empty'); if (em0) { em0.style.display = 'flex'; em0.textContent = 'WORKBENCH_ORIGIN_REFUSED — ' + e.message; } return Promise.resolve(null); }
    var thisLoad = WB.loading = import(origin + '/charts/workbench.bundle.js').then(function (mod) {
      WB.reloads = 1;
      WB.ticker = replayTicker();
      if (!mod || typeof mod.mountWorkbench !== 'function') throw new Error('the bundle has no mountWorkbench');
      if (gen !== WB.gen || !host.isConnected) { if (WB.loading === thisLoad) WB.loading = null; return null; } // unmounted while the bundle loaded
      WB.host = host;
      WB.api = mod.mountWorkbench(host, {
        symbol: 'room:' + WB.ticker, timeframe: TF_CODE[(S.st && S.st.timeframe) || '1H'] || '60', layout: false,
        roomBase: function () { return S.base; }, watermark: false, live: true, roomTfHandled: true,
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
      wireReplayPin();   // market:changed → instant replay switch (no live-asset paint, no poll latency)
      wireSeek(WB.api);  // click-to-rewind (the TV-style seek on the replay chart)
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

  /**
   * ONE STABLE TICKER PER ASSET (operator, 2026-10-02: *"every time i come back to the chart the counter
   * increases it says replay seven eight nine ten eleven twelve … it should be one consistent pinned chart
   * per asset and nothing else. This is extremely simple. Don't complicate it."*).
   *
   * THE DEFECT THIS REMOVES: the ticker used to be `REPLAY-<SYM>` then `.2`, `.3`, `.4` … — a counter that
   * existed ONLY to make Vela refetch (it refetches on a new symbol, not on a data change). So every reload
   * minted a NEW market, the legend walked 7 → 8 → 9 → 12, and each new market was a fresh ledger key.
   *
   * THE FIX: the ticker is now the plain asset symbol, permanently. One market per asset, one alias entry,
   * one ledger key — and re-pointing the SAME symbol at a NEW session is what actually forces the refetch
   * (see reloadRoomChart: it re-aliases, forgets the bars for that key, and re-sets the market). The reload
   * is driven by the alias target changing, not by a counter in the name.
   */
  function replayTicker() {
    return String((S.st && S.st.symbol) || 'SESSION').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  }

  /**
   * landReplay — OPEN A FRESHLY ATTACHED REPLAY ON A USABLE CHART (openPlan holds the measured defect and the
   * clamp law). Reads the session's OWN status (cursor / endIndex), derives the plan, and drives the room's
   * verbs in order. A jump reveals bars in BULK, so the chart is re-pointed at the room (a fresh `room:` market
   * makes Vela REFETCH the whole revealed window — the incremental push path is for one-bar-at-a-time reveals)
   * and then framed, so the scale is the window rather than a single flat candle.
   *
   * @param {string} uid  the session that was just attached
   * @param {{want?:number, playing?:boolean, rate?:number}} [o]  want = the cursor the caller wants (default 200)
   */
  async function landReplay(uid, o) {
    o = o || {};
    var r = await api('GET', '/status?session=' + encodeURIComponent(uid));
    var st = r && r.status;
    if (!st) return null;
    var plan = openPlan({ cursor: st.cursor, endIndex: st.endIndex, want: o.want, playing: o.playing, rate: o.rate });
    for (var i = 0; i < plan.requests.length; i++) {
      var req = plan.requests[i];
      if (req.verb === 'jump') await api('POST', '/jump', { session: uid, barIndex: req.barIndex, actor: 'human' });
      else if (req.verb === 'play') await api('POST', '/play', { session: uid, rate: req.rate, actor: 'human' });
    }
    if (S.uid === uid) await pullStatus();
    if (S.uid === uid && WB.api) {
      // a BULK reveal needs a REFETCH, not the one-bar push path (syncRoomChart reloads on the uid change; this
      // covers the case where the paint has not run yet)
      if (WB.uid !== uid) reloadRoomChart(WB.api);
      frameReplay(0);
    }
    return plan;
  }
  WB.landReplay = landReplay; // the probe handle: the landing path is drivable without a live room (script tests)
  WB.roomSymbol = roomSymbol; // the picker ticker → the room's pair code (the asset-switch path's first hop)

  /** THE CHART FRAMES WHAT THE REPLAY REVEALED — a bounded burst right after a landing. Vela keeps its zoom
   *  across a market reload (`reframeKeepZoom`, its own initial-fit flag is already spent), so a chart that was
   *  one bar wide stays one bar wide. The frame is set from the ROOM'S OWN WINDOW (`S.win.bars`, which the room
   *  clamps to the cursor — the window, never the future), through Vela's public `setVisibleRange({from,to})`;
   *  a chart that does not expose it falls back to the 'ALL' preset. Never a standing timer: a view the
   *  operator has panned since is not yanked back. */
  function frameReplay(attempt) {
    try {
      var ch = WB.api && WB.api.chart;
      var bars = (S.win && S.win.bars) || [];
      if (ch && bars.length > 1 && typeof ch.setVisibleRange === 'function') {
        var tfMs = TF_MS[String((S.st && S.st.timeframe) || '')] || 3600000;
        ch.setVisibleRange({ from: bars[0].time, to: bars[bars.length - 1].time + tfMs });
      } else if (ch && typeof ch.setVisibleRangePreset === 'function') {
        ch.setVisibleRangePreset('ALL');
      } else if (ch && typeof ch.fitContent === 'function') {
        ch.fitContent();
      }
    } catch (e) { /* not mounted — the next attempt, or the chart's own load, frames it */ }
    if ((attempt || 0) < 3) S.timers.fit = setTimeout(function () { frameReplay((attempt || 0) + 1); }, 260);
  }
  WB.frameReplay = frameReplay;

  function reloadRoomChart(wb) {
    WB.reloadAt = Date.now();
    var tf = TF_CODE[(S.st && S.st.timeframe) || '1H'] || '60';
    WB.ticker = replayTicker();            // ONE ticker per asset, re-derived every reload (label = data)
    wb.room.alias(WB.ticker, S.uid, tf);
    // forgetBars(provider, KEEP) - the second argument is the ticker to KEEP. Measured 2026-10-02: passing the
    // current asset kept exactly the bars a backward seek must drop - the chart held 2260 bars with the room's
    // cursor at 2222 (38 bars of the future on screen). With one ticker per asset, forget ALL room bars.
    wb.forgetBars('room');
    WB.uid = S.uid; WB.lastTime = null; WB.levelKey = ''; WB.cutAt = null; // the cut line redraws; its old id is removed
    var room = { symbol: 'room:' + WB.ticker, timeframe: tf };
    var m = wb.marketId && wb.marketId();
    var same = m && m.provider === 'room' && String(m.ticker).toUpperCase() === WB.ticker && String(m.timeframe) === tf;
    // A DIFFERENT asset is a new symbol: Vela refetches by itself. The SAME asset (a seek, a reset) is the case
    // Vela will not refetch: refetch() re-reads it from the room provider (every revealed bar, never one past the
    // cursor), and the live subscription stays on the room provider for the pushes.
    // NEVER inline `data` (2026-10-03): Vela never leaves an inline-data market (the follow-up same-symbol
    // setMarket is a no-op) and runs its demo tick generator on it - the "auto-play" the operator reported for
    // four hours. refetch() evicts the merged store and reloads the SAME symbol from the room provider.
    var p = !same ? Promise.resolve(wb.setMarket(room)) : Promise.resolve(wb.refetch());
    p.catch(function (e) { note({ message: 'chart reload failed: ' + (e && e.message) }); });
  }



  /**
   * THE REPLAY FOLLOWS THE ASSET YOU SELECT — measured 2026-10-01, twice.
   *
   * First the operator reported: "backtesting tab switches to live charts instead of replay mode if I change
   * the asset". Reproduced: picking GBPUSD in the chart's own symbol picker moved the market from
   * room:REPLAY-EURUSD to tv:GBPUSD and the replay was silently gone.
   *
   * The first repair only PINNED the room — and the operator rightly rejected it: pinning EURUSD is a refusal,
   * not a backtesting environment. The behaviour that is actually wanted is: pick an asset, get THAT asset's
   * replay.
   *
   * So a market that leaves `room:` is no longer refused or blindly re-asserted. The picked ticker is read, and
   * this tab creates (or re-uses) a replay session for THAT symbol — the same /create path the SESSIONS form
   * uses, with the room's own TV bar loader — then attaches it and re-aliases the chart. If the room refuses the
   * symbol the operator gets the room's own named code, and the chart is restored.
   */
  function roomSymbol(ticker) {
    var t = String(ticker || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (t.length === 6 && !/^\d/.test(t)) return t.slice(0, 3) + '/' + t.slice(3);   // GBPUSD -> GBP/USD
    return t;
  }

  async function switchReplayTo(ticker, tfCode) {
    var sym = roomSymbol(ticker);
    var tf = TF_CODE[tfCode || (S.st && S.st.timeframe) || '1H'] || '60';
    if (S.switching) return;
    // THE SAME-ASSET GUARD, NORMALIZED (2026-10-02): the pin hands the market's CODE ('60'), the session
    // carries its LABEL ('1H') — the first cut compared them raw ('1H' === '60' is never true), so every
    // pin re-switched to another session of the SAME asset. Compare in one vocabulary: the tf CODE.
    var wantCode = TF_CODE[tfCode] || String(tfCode || '');
    var curCode = TF_CODE[(S.st && S.st.timeframe)] || String((S.st && S.st.timeframe) || '');
    if (S.st && roomSymbol(S.st.symbol) === sym && curCode === wantCode) return;
    S.switching = true;
    clearTimeout(S.switchTimer);
    var em = q('chart-empty'); if (em) { em.style.display = 'flex'; em.textContent = 'LOADING THE ' + sym + ' REPLAY…'; }
    try {
      // the replay POSITION carries across the switch: a fresh session starts at bar 1, which lands the operator
      // on a single flat candle (measured 2026-10-01). landReplay() jumps the new session to the same point in
      // ITS data — clamped by that session's OWN horizon, so a shorter series can never trigger the room's
      // BAR_RANGE_EXHAUSTED (openPlan owns the clamp).
      var prevCursor = S.st && Number(S.st.cursor);
      // A TIMEFRAME switch moves to a series with a DIFFERENT number of bars per day, so the bar INDEX does not
      // carry (measured 2026-10-03: 15m bar 4801 = Sep 30, the same index on 1H = Sep 22). The MOMENT carries.
      var prevIso = S.st && S.st.now && S.st.now.iso;
      var prevTfLabel = S.st && S.st.timeframe;
      var wasPlaying = !!(S.st && S.st.playing);
      var prevRate = (S.st && Number(S.st.rate)) || 2;
      // REUSE THE ASSET'S EXISTING SESSION (2026-10-02). The operator: "there is huge latency. multiple
      // seconds". Measured: every pick minted a NEW session via POST /create — and the room's create
      // fetches 5000 bars from the TV feed (seconds, every time). An asset that already has a session
      // (the operator's usual three do) now RESUMES it instead — instant, and it carries their own
      // progress in that asset. The create path stays for assets with no session yet.
      // MEASURED 2026-10-03: this was the session's CURRENT label, so a 1H request filtered for - and created - a 15m
      // session again. The requested timeframe (a code) maps to its session label; no request keeps the session's own.
      var wantTf = (tfCode && TF_LABEL[TF_CODE[tfCode] || tfCode]) || (S.st && S.st.timeframe) || '1H';
      var reuse = null;
      try {
        var listR = await api('GET', '/sessions?limit=50');
        // THE RESTORED SET (2026-10-02): right after a restart the room holds only the sessions it has
        // lazily restored; a DB-only row attaches through the /resume path and can race it (measured: a
        // pick nulled the tab while resume settled). Prefer sessions the room ALREADY holds — instant,
        // no race; the resume path stays for the rest.
        var liveUids = [];
        try { var hR = await api('GET', '/health'); liveUids = (hR && hR.rooms && hR.rooms.uids) || []; } catch (e) { /* health older than rooms.uids — no preference */ }
        var cands = (listR.sessions || []).filter(function (s) {
          // NOTE: the /sessions row carries visible_bars, NOT bars_total — the first cut filtered on
          // bars_total (undefined) and every candidate fell through to a fresh create (measured).
          // RUNNING ONLY (2026-10-02): a COMPLETED session is read-only — the room refuses resume with
          // the NAMED SESSION_COMPLETED, which is exactly the "fatal error" the operator hit switching
          // to AUDUSD (its only session was finished). Finished assets fall to a fresh create below.
          return roomSymbol(s.symbol) === sym && String(s.timeframe) === wantTf && Number(s.visible_bars || 0) > 0 && s.status === 'RUNNING' && s.session_uid !== S.uid;
        });
        cands.sort(function (a, b) {
          var la = liveUids.indexOf(a.session_uid) >= 0 ? 1 : 0;
          var lb = liveUids.indexOf(b.session_uid) >= 0 ? 1 : 0;
          if (lb !== la) return lb - la;                              // the room already holds it → instant attach
          var r = (b.status === 'RUNNING' ? 1 : 0) - (a.status === 'RUNNING' ? 1 : 0);
          if (r) return r;
          return (Number(b.cursor) || 0) - (Number(a.cursor) || 0);   // your most-played session of the asset wins
        });
        reuse = cands[0] || null;
      } catch (e) { /* a list failure must not block the create path */ }
      var r;
      var reuseOk = false;
      if (reuse) {
        // A DB-only session (unrestored after a restart) MUST resume before attach — measured 2026-10-02:
        // the operator switched to AUDUSD and hit "no live session" because the reuse attached an unrestored
        // row and the once-per-session ghost map had already spent its resume attempt. This is a FRESH,
        // explicit resume: status → resume → status again. ANY refusal (SESSION_COMPLETED included) falls
        // through to CREATE — the switch is the operator's ask and it must land.
        try {
          var st0 = await api('GET', '/status?session=' + encodeURIComponent(reuse.session_uid));
          if (!st0 || !st0.status) throw makeErr('NOT_LIVE_YET', 'no status');
          reuseOk = true;
        } catch (e0) {
          try {
            await api('POST', '/resume', { session: reuse.session_uid, actor: 'human' });
            var st1 = await api('GET', '/status?session=' + encodeURIComponent(reuse.session_uid));
            if (!st1 || !st1.status) throw makeErr('RESUME_FAILED', 'the session would not resume');
            reuseOk = true;
          } catch (eR) {
            reuseOk = false;
            note({ message: 'reusing ' + reuse.session_uid + ' failed (' + (eR.code || eR.message) + ') — creating a fresh ' + sym + ' session' });
          }
        }
      }
      if (reuseOk) {
        r = { session: reuse.session_uid, reused: true };
        await attach(r.session);
      } else {
        r = await api('POST', '/create', {
          name: 'backtest ' + sym + ' ' + wantTf + ' · tv',
          symbol: sym, timeframe: wantTf, symbols: [sym],
          barsSource: 'tv', startingBalance: (S.st && S.st.startingBalance) || 10000, actor: 'human',
        });
        await attach(r.session);
      }
      // THE RUN STATE CARRIES: a fresh replay starts at bar 1 (no lookahead — the room refuses any jump past its
      // revealed horizon, by design), so if you were playing when you switched, the new replay STARTS PLAYING at
      // your speed instead of handing you a single flat candle.
      var plan = await landReplay(r.session, {
        want: Math.max(OPEN_BARS, prevCursor > 1 ? prevCursor : 0),
        playing: wasPlaying, rate: prevRate,
      });
      if (prevIso && prevTfLabel && prevTfLabel !== wantTf) {
        // same asset, another timeframe: put the new session at the SAME MOMENT (the room resolves a time to the
        // last bar at or before it). A refusal keeps landReplay's position - the switch itself already landed.
        try {
          var jr = await api('POST', '/jump', { session: r.session, time: prevIso, actor: 'human' });
          if (jr && jr.status) S.st = jr.status;
          if (WB.api) { reloadRoomChart(WB.api); frameReplay(0); }
          await pullWindow().then(paint).catch(function () { /* the reload repaints */ });
        } catch (eJ) { note({ message: 'kept the landing position (the new timeframe would not seek to ' + prevIso + ': ' + ((eJ && (eJ.code || eJ.message)) || 'refused') + ')' }); }
      }
      if (em) { em.style.display = 'none'; }
      note({ message: 'replay switched to ' + sym + ' (' + (r.reused ? 'resumed' : 'new') + ' session ' + r.session + ', cursor ' + (plan ? plan.barIndex : '?') + (plan && plan.clamped ? ' — clamped to its horizon' : '') + (wasPlaying ? ', playing ' + prevRate + '×' : '') + ')' });
    } catch (e) {
      // the room named its refusal (NO_TV_BARS for that symbol, etc.) — say it, and put OUR replay back
      note(e);
      if (em) { em.style.display = 'flex'; em.textContent = (e.code || 'REPLAY_SWITCH_FAILED') + ' — ' + String(e.message || '').slice(0, 120); }
      if (WB.api) reloadRoomChart(WB.api);
    } finally { S.switching = false; S.switchDoneAt = Date.now(); }
  }

  /**
   * THE REPLAY IS PINNED TO THE ATTACHED SESSION. A market that leaves `room:` is the operator picking an
   * asset, so it becomes a switchReplayTo() rather than a silent re-assert - UNLESS the room is mid-change, in
   * which case the chart is simply put back.
   */
  function pinRoomMarket(wb) {
    if (!wb || typeof wb.marketId !== 'function' || typeof wb.setMarket !== 'function' || !WB.ticker) return;
    var m = wb.marketId();
    if (!m) return;
    // satisfied ONLY by THIS asset's replay market: same symbol on the room provider. (The old `provider ===
    // 'room'` early-out also accepted a stale room market of ANOTHER asset.)
    // MEASURED 2026-10-03 (screen: ROOM_TF_FIXED, blank chart): this early-out also swallowed a TIMEFRAME change on
    // the SAME asset - the chart is already on room:<ticker>, so the tf branch below never ran. It now returns only
    // when the chart's timeframe is the session's too; a different timeframe falls through to the switch.
    if (m.provider === 'room' && String(m.ticker).toUpperCase() === WB.ticker) {
      var earlyWant = m.timeframe ? (TF_CODE[m.timeframe] || m.timeframe) : '';
      var earlyCur = (S.st && S.st.timeframe) ? (TF_CODE[S.st.timeframe] || S.st.timeframe) : '';
      if (!earlyWant || !earlyCur || earlyWant === earlyCur) return;
    }
    if (Date.now() - (S.pinAt || 0) < 250) return;   // was 1200ms: the event-driven pin below made the poll a backstop only
    S.pinAt = Date.now();
    if (S.switching) return;
    // a pick of ANOTHER asset means "replay THAT asset". A pick of the asset the session ALREADY replays (the
    // operator's second click on GU, 2026-10-02) is NOT a switch: switchReplayTo returns early on its same-asset
    // guard and the chart stayed on the LIVE market the picker set. That case falls through to the re-pin below.
    if (S.uid && S.st && roomSymbol(m.ticker) !== roomSymbol(S.st.symbol)) { switchReplayTo(m.ticker, m.timeframe); return; }
    // THE TIMEFRAME CONTROL (measured 2026-10-03). The operator: "if I try to switch from the 15 minute to the
    // one hour chart, it doesn't let me. It looks like it's pinned to the 15 minute chart. This is on every
    // pair." A tf change on a room market used to be swallowed right here: this function re-asserted the
    // SESSION's timeframe, so the chip snapped back and nothing else ran. A replay lives on one grid, so the
    // honest answer to "show me 1H" is a session at 1H - which is what switchReplayTo does: reuse a RUNNING
    // session at that timeframe, else create one. So a tf change is routed there instead of being undone.
    // MEASURED: the first cut compared the chart's CODE ('15', '60') with the session's LABEL ('15m', '1H')
    // through the same map, so `TF_CODE['15']` was undefined and the branch NEVER fired - the chip stayed dead
    // and the measured result was "sessionTf 15m, chart timeframe 15" after clicking 1h. Both sides are
    // normalized to a code before they are compared.
    var wantCodeNow = m.timeframe ? (TF_CODE[m.timeframe] || m.timeframe) : '';
    var curCodeNow = (S.st && S.st.timeframe) ? (TF_CODE[S.st.timeframe] || S.st.timeframe) : '';
    // SETTLE WINDOW (measured 2026-10-04): right after a restart / a switch the chart re-applies its own stored
    // layout, which changes its timeframe by itself; each of those was treated as a click and minted another
    // session - a chain of 6 (30m, 1D, 4H ...) nobody asked for. A timeframe change counts as the operator's only
    // when the replay has been quiet for 2.5s; inside the window it is re-asserted, not obeyed.
    var settled = Date.now() - (S.switchDoneAt || 0) > 2500;
    if (S.uid && S.st && wantCodeNow && curCodeNow && wantCodeNow !== curCodeNow && settled) {
      switchReplayTo(S.st.symbol, wantCodeNow, TF_LABEL[wantCodeNow] || TF_LABEL[m.timeframe]);
      return;
    }
    var tf = TF_CODE[(S.st && S.st.timeframe) || '1H'] || '60';
    try { wb.room.alias(WB.ticker, S.uid, tf); } catch (e) { WB.pinErr = 'alias: ' + (e && e.message); }
    WB.pins = (WB.pins || 0) + 1; WB.lastPin = 'room:' + WB.ticker;
    Promise.resolve(wb.setMarket({ symbol: 'room:' + WB.ticker, timeframe: tf })).catch(function (e) {
      WB.pinErr = (e && (e.code || e.message)) || 'failed';
      note({ message: 'chart re-pin failed: ' + (e && (e.code || e.message)) });
    });
  }

  /** THE INSTANT REPLAY PIN (2026-10-02). The operator: "it loads the live asset first and then switching…
   *  make it so that it is just replays by default". Measured flow before this: the picker set tv:<SYM>, the
   *  chart started the LIVE feed load (multi-second), and only the 1s poll + 1.2s debounce fired
   *  switchReplayTo(). Now the chart's own `market:changed` event triggers the switch the moment the market
   *  leaves the room — the live load is superseded before it can paint. The poll stays as a backstop. */
  function wireReplayPin() {
    if (WB.pinWired || !WB.api) return;
    WB.pinWired = true;
    var hook = function () { if (S.uid && !S.switching && WB.api) pinRoomMarket(WB.api); };
    for (var i = 0; i < 2; i++) {
      var src = i === 0 ? WB.api.chart : WB.api.ws;
      if (src && typeof src.on === 'function') { try { src.on('market:changed', hook); } catch (e) { /* not an emitter here */ } }
    }
  }

  /** THE SEEK — THE TV-STYLE CLICK-TO-REWIND (2026-10-02). The operator: "the EXACT 'click exactly on the
   *  chart and rewind to there' feature with that vertical scissor bar… so i can zoom out on a HTF chart and
   *  just click somewhere to instantly move months." The chart's click API does NOT live on the facade (the
   *  click-to-fill work measured the walk: rendererControl / rendererControl.renderer own onClick +
   *  onCrosshairMove); the click event's own time is unreliable, so the crosshair channel tracks the hovered
   *  time and the click commits it. The room's /jump accepts a TIME and resolves it to the last bar ≤ t —
   *  backward AND forward — then the chart is re-pointed + reframed exactly like landReplay does. */
  function seekTarget(node, depth) {
    if (!node || typeof node !== 'object' || (depth || 0) > 3) return null;
    if (typeof node.onClick === 'function') return node;
    if (node.chart && node.chart !== node) { var via = seekTarget(node.chart, (depth || 0) + 1); if (via) return via; }
    var rc = node.rendererControl;
    if (rc && typeof rc.onClick === 'function') return rc;
    if (rc && rc.renderer && typeof rc.renderer.onClick === 'function') return rc.renderer;
    return null;
  }
  function wireSeek(api) {
    if (!api || api.__seekWired) return;
    var target = seekTarget(api.chart);
    if (!target) { WB.seekErr = 'the chart has no click API'; return; }
    api.__seekWired = true;
    try {
      if (typeof target.onCrosshairMove === 'function') {
        target.onCrosshairMove(function (e) { var t = e && e.time; S.seekHover = (t != null && Number.isFinite(Number(t))) ? Number(t) : null; });
      }
    } catch (e) { /* no crosshair channel — the click event's own time is the only source */ }
    try {
      target.onClick(function (e) {
        if (!S.seekArmed) return; // the ✂ SEEK toggle (the visible scissor) owns this
        var t = (e && e.time != null && Number.isFinite(Number(e.time))) ? Number(e.time) : S.seekHover;
        if (t == null) return;
        setSeekArmed(false); // ONE-SHOT: one click seeks; to go further back, arm it again (TradingView's behaviour)
        void seekToTime(t);
      });
    } catch (e) { WB.seekErr = String((e && e.message) || e).slice(0, 80); }
  }
  /** arm/disarm SELECT BAR: the button, the cursor, and the live preview all follow this one flag */
  function setSeekArmed(on) {
    S.seekArmed = !!on;
    var b = q('scissor');
    if (b) { b.classList.toggle('is-on', S.seekArmed); b.setAttribute('aria-pressed', String(S.seekArmed)); }
    var host = WB.host;
    if (host) { seekPreviewLayers(host); host.classList.toggle('bt-seek-armed', S.seekArmed); }
    if (!S.seekArmed) hideSeekPreview();
  }
  /** THE LIVE PREVIEW (operator 2026-10-02: "I cannot see the actual rewind in real time. It only activates on the
   *  click"): while armed, a blue line follows the mouse and everything to its right - the bars the seek would
   *  hide - is shaded. Drawn as two DOM layers over the chart host (pointer-events none), so the chart keeps the
   *  click. The plot's right edge is the price axis' left edge, measured from the chart's own canvases. */
  function seekPreviewLayers(host) {
    if (!host) return null;
    if (!host.__seekVeil) {
      if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
      var veil = document.createElement('div'); veil.className = 'bt-seek-veil';
      var line = document.createElement('div'); line.className = 'bt-seek-line';
      host.appendChild(veil); host.appendChild(line);
      host.__seekVeil = veil; host.__seekLine = line;
      host.addEventListener('mousemove', function (e) {
        if (!S.seekArmed) return;
        var r = host.getBoundingClientRect(), x = e.clientX - r.left;
        var plotRight = plotRightEdge(host, r);
        if (x < 0 || x > plotRight) { hideSeekPreview(); return; }
        host.__seekLine.style.left = x + 'px'; host.__seekLine.style.display = 'block';
        host.__seekVeil.style.left = x + 'px'; host.__seekVeil.style.width = Math.max(0, plotRight - x) + 'px'; host.__seekVeil.style.display = 'block';
      });
      host.addEventListener('mouseleave', hideSeekPreview);
    }
    return host;
  }
  function plotRightEdge(host, r) {
    // the widest canvas that starts at the host's left is the plot; its right edge is where the price axis begins
    var best = r.width;
    var cs = host.querySelectorAll('canvas');
    for (var i = 0; i < cs.length; i++) {
      var c = cs[i].getBoundingClientRect();
      if (c.width > r.width * 0.5 && Math.abs(c.left - r.left) < 80 && c.right - r.left < best) best = c.right - r.left;
    }
    return best;
  }
  function hideSeekPreview() {
    var host = WB.host;
    if (host && host.__seekVeil) { host.__seekVeil.style.display = 'none'; host.__seekLine.style.display = 'none'; }
  }

  var seekBusy = false;
  async function seekToTime(t) {
    if (!S.uid || !S.base || seekBusy || S.switching) return;
    if (t < 1e12) t = t * 1000; // Vela/lightweight-charts event times are SECONDS; the room works in ms
    seekBusy = true;
    try {
      var r = await api('POST', '/jump', { session: S.uid, time: new Date(t).toISOString(), actor: 'human' });
      var st = r && r.status;
      if (st) S.st = st;
      note({ message: 'seeked to bar ' + (st ? (st.cursor + 1) : '?') + (st && st.now ? (' · ' + F.date(st.now.iso) + ' ' + F.time(st.now.iso)) : '') });
      if (WB.api) { reloadRoomChart(WB.api); frameReplay(0); }
      await pullWindow().then(paint).catch(function () { /* the reload repaints */ });
    } catch (e) {
      note(makeErr('SEEK_REFUSED', String((e && e.message) || e).slice(0, 140)));
    } finally { seekBusy = false; }
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
  /** TradingView's replay CUT LINE: a blue vertical line on the replay's current bar (the operator's screenshot).
   *  One drawing, redrawn only when the cursor bar changes. */
  function drawCutLine(wb) {
    var ch = wb && wb.chart, bars = S.win && S.win.bars;
    if (!ch || !ch.drawings || typeof ch.drawings.add !== 'function' || !bars || !bars.length) return;
    var b = bars[bars.length - 1];
    if (WB.cutAt === b.time) return;
    if (WB.cutId) { try { ch.drawings.remove(WB.cutId); } catch (e) { /* gone with a market swap */ } }
    try {
      var d = ch.drawings.add('vline', { anchors: [{ time: b.time, price: b.close }], style: { lineColor: '#2962FF', lineWidth: 1, lineStyle: 'solid' } });
      WB.cutId = d && d.id; WB.cutAt = b.time;
    } catch (e) { WB.cutId = null; }
  }

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
    // THE ROOM PROVIDER IS PINNED BEFORE ANY OTHER CHECK. Measured 2026-10-01: the first version of this pin sat
    // after the "no replay bars" early-return, so it never ran when the room window was empty - exactly the state
    // in which the chart is left showing whatever the operator's pick drifted it to (the TV feed).
    if (WB.api) pinRoomMarket(WB.api);

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
      pinRoomMarket(wb); // the ROOM provider is the ONLY market this tab may show (measured 2026-10-01)
      syncRoomChart(wb, w); // a throw here rejects this chain: surfaced by the .catch below
      drawTradeLevels(wb);
      drawCutLine(wb);
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
    // a note being TYPED survives the live repaint (~1.2s poll / every stream status) - audit b8df1936 H
    if (document.activeElement && document.activeElement.classList && document.activeElement.classList.contains('bt-note-input') && box.contains(document.activeElement)) return;
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
      // an INLINE note input (Enter saves, Escape/blur cancels): Electron does not implement window.prompt()
      // (it returns nothing), so this button never saved a note (measured 2026-10-01)
      b.onclick = function () {
        var inp = el('input', { class: 'bt-note-input', placeholder: 'note for ' + f.positionId + ' - Enter saves' });
        var done = false;
        var restore = function () { if (done) return; done = true; if (inp.parentNode) inp.replaceWith(b); };
        inp.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' && inp.value.trim()) { var t = inp.value.trim(); restore(); act('POST', '/note', { session: S.uid, tradeId: f.positionId, text: t }); }
          else if (e.key === 'Escape') restore();
        });
        inp.addEventListener('blur', restore);
        b.replaceWith(inp);
        inp.focus();
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
    // ONE request in flight: a second click while the first is pending was recorded as a DUPLICATE order
    // (events 12+13, 2026-09-30 11:56:26 / :28 — the operator clicked twice because nothing visibly happened)
    if (S.placing) return;
    var btn = q('place');
    S.placing = true; if (btn) { btn.disabled = true; btn.textContent = 'PLACING…'; }
    try { await doPlaceInner(); }
    finally { S.placing = false; if (btn) { btn.textContent = 'PLACE ORDER'; btn.disabled = !S.st; } }
  }

  async function doPlaceInner() {
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
    if (r) {
      var l = await api('GET', '/status?session=' + encodeURIComponent(S.uid)); S.st = l.status; paint();
      // SAY what the room did — a silent success read as 'the ticket does nothing'
      var o = r.order || {};
      var ack = q('order-ack');
      if (ack) {
        ack.textContent = o.status === 'filled'
          ? (String(o.side).toUpperCase() + ' ' + o.qty + ' FILLED @ ' + o.filledPrice + (o.sl != null ? ' · SL ' + o.sl : '') + (o.tp != null ? ' · TP ' + o.tp : '') + '  (' + o.id + ')')
          : (String(o.side).toUpperCase() + ' ' + String(o.type).toUpperCase() + ' ' + o.qty + ' WORKING @ ' + o.price + ' — fills when price reaches it as you step/play  (' + o.id + ')');
      }
    }
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
    // THE TRADINGVIEW REPLAY BAR (2026-10-02): the Select-bar dropdown holds the rarer controls; ⏯ jumps to the end.
    on('sel-menu', function (e) { e.stopPropagation(); var pop = q('sel-pop'); if (pop) pop.hidden = !pop.hidden; });
    var popEl = q('sel-pop');
    if (popEl) popEl.onclick = function (e) { e.stopPropagation(); };
    if (S.root && !S.root.dataset.popWired) {
      S.root.dataset.popWired = '1';
      document.addEventListener('click', function () { var pop = q('sel-pop'); if (pop) pop.hidden = true; });
    }
    on('to-end', function () {
      if (!S.st) return;
      var end = S.st.endIndex != null ? S.st.endIndex : S.st.barsTotal - 1;
      act('POST', '/jump', { barIndex: end });
    });
    on('step-back', function () { act('POST', '/step', { delta: -1 }); });
    // ONE play/pause button that asks the ROOM, not the cache (operator 2026-10-02: "it's paused, but the chart is
    // running the replay and I can't actually pause"). The cached status is not refreshed by the stream during play,
    // so a button keyed on it showed PLAY while the room played - and PLAY never pauses. The click reads the room's
    // own state first, then sends the opposite verb.
    // THE WORKING PAUSE/PLAY (restored verbatim from backtesting-rooms-working-ui, which the operator confirms
    // had ZERO issues). Two buttons, each posting ITS OWN verb. No inference.
    // The defect this replaces: a single toggle that read a FRESH /status and picked the verb from it. A select-bar
    // rewind leaves the room PAUSED, so that read said playing=false and the PAUSE button POSTed /play - the replay
    // started running the moment the operator rewound, and pause could never stop it. Measured root cause, 2026-10-02.
    on('play', function () { act('POST', '/play', { rate: Number((q('speed') || {}).value || 2) }); });
    on('pause', function () { act('POST', '/pause', {}); });
    // SELECT BAR (operator, from TradingView's replay bar, 2026-10-01): move N bars at a time instead of one.
    // It REPLACED the first/last buttons - they had no purpose in a replay (first is bar 0, last is the horizon,
    // which the JUMP TO date and the timeline already reach). The target is clamped to the session's revealed
    // horizon: a jump past it is refused by the room (BAR_RANGE_EXHAUSTED), so we clamp and say so instead.
    function selectBar(dir) {
      var n = Math.max(1, Number((q('select-n') || {}).value || 10));
      var st = S.st;
      if (!st) return;
      var horizon = st.endIndex != null ? Number(st.endIndex) : Number(st.cursor);
      var cur = Number(st.cursor);
      var at = dir < 0 ? Math.max(0, cur - n) : Math.min(horizon, cur + n);
      if (at === cur) { note(makeErr('BAR_RANGE_EXHAUSTED', dir < 0 ? 'already at the first bar' : 'already at the last revealed bar (bar ' + (horizon + 1) + '/' + st.barsTotal + ') - press PLAY to reveal more')); return; }
      act('POST', '/jump', { barIndex: at });
    }
    on('select-back', function () { selectBar(-1); });
    on('select-fwd', function () { selectBar(1); });
    // THE ✂ SEEK TOGGLE (the visible scissor — operator: "there is no click scissor button anywhere on
    // backtest"). While armed, a chart click jumps the replay to that bar (wireSeek). Disarm to keep chart
    // clicks inert (drawing/zooming without seeking).
    on('scissor', function (e) {
      if (e) e.stopPropagation();
      setSeekArmed(!S.seekArmed);
      if (S.seekArmed && WB.api) wireSeek(WB.api); // a chart mounted while disarmed may not have the hook yet
    });
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

  // ── THE ROOM PROVIDER PIN, VISIBILITY-DRIVEN (measured 2026-10-01) ───────────────────────────────
  // THE OPERATOR'S REPORT: "backtesting tab switches to live charts instead of replay mode if I change the
  // asset". Reproduced: picking GBPUSD in the chart's own picker moved the market from room:REPLAY-EURUSD to
  // tv:GBPUSD and the replay was silently gone; nothing re-asserted it.
  // Three earlier placements of this pin all FAILED to run, each for a different reason - recorded so the next
  // person does not retry them: (1) inside renderChart - it returns early when the replay window has no bars,
  // which is exactly the state where the chart is left on the wrong feed; (2) inside the session poll -
  // startPoll() only runs when the SSE stream FAILS, so with a healthy stream it never ran; (3) inside
  // openStream() - not reached on the restore path, so it still never ran.
  // THIS one is the guaranteed path: the tab manager's own 'tab-switched' event fires whenever the operator
  // brings the tab into view, which is precisely when a drifted chart would be seen and used. A slow guard also
  // repeats while the tab is the active one, so drift is repaired within a second of being LOOKED at.
  function pinRoomGuard() {
    if (!S.root || !WB.api || !S.uid) return;
    pinRoomMarket(WB.api);
    clearInterval(S.timers.pin);
    if (window.TabManager && TabManager.getActiveTab() === 'backtest') {
      S.timers.pin = setInterval(function () { if (WB.api && S.uid) pinRoomMarket(WB.api); }, 1000);
    }
  }
  document.addEventListener('tab-switched', function (e) {
    if (e && e.detail && e.detail.tab && e.detail.tab !== 'backtest') return;
    setTimeout(pinRoomGuard, 300);
  });

  console.log('[backtest-room] module loaded v' + VERSION + ' — nav data-page="' + KEY + '", mounts into #main-content (or #page-' + KEY + ')');
})();
