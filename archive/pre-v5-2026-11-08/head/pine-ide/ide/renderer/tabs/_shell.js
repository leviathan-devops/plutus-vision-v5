/* =================================================================
   _shell.js — THE SHARED HELPER FOR THE PLUTUS SHELL TABS
   -----------------------------------------------------------------
   Owner: the ShellJournal desk (SHELL_ANCHOR §5.1). APPEND-ONLY forever:
   later desks (ShellBacktest §5.2, the Pine Shell §5.3) may ADD exports,
   never rewrite or remove one — a removed export breaks a sibling tab.

   Why this file exists: the three shell tabs are SELF-CONTAINED modules
   (tabs/<name>.{js,css,html}) that must not edit index.html / app.js /
   styles.css / tokens.css (siblings own those). This file is the ONE place
   they share: the API bridge, the old-money tokens, the HTML fragment
   loader, the service probe, the poller, and the tab-registration contract.

   LOAD CONTRACT (integrator):
     <script src="tabs/_shell.js"></script>          ← before any tab module
     <script src="tabs/journal.js"></script>
   A tab module calls PlutusShell.registerTab({...}) and needs NOTHING else.

   MOUNT CONTRACT (two entry points, BOTH supported):
     1. THE NAV LINE (preferred — zero edits to app.js):
          <button class="nav-btn" data-page="journal-live">…
        registerTab is called with navPage:'journal-live'; the capture-phase
        click listener below claims the click, stops propagation (so the
        sibling app.js nav handler never renders into #main-content and
        cannot fight this tab), marks the button active, and mounts into
        #main-content.
     2. THE EXPLICIT CALL (if the integrator prefers a branch in
        app.js renderCurrentPage):
          if (page === 'journal-live') { return window.PlutusShellTabs['journal-live'].mount(main); }
        registerTab also exposes window.PlutusShellTabs[key] = {mount, unmount, dispose}
        and scans for #[containerId] on load.

   TAB MODULE REQUIREMENTS (both, or the guard cannot help you):
     · mount(host) must be IDEMPOTENT and may return a promise;
     · the tab's root element must carry `data-tab-key="<key>"` — it is the
       ownership token the re-mount guard reads.

   Measured facts this file is built on (live app, 2026-09-29):
     · the renderer loads over file:// (main.js loadFile) — so a fetch() of a
       fragment from the same directory is BLOCKED by Chromium; the fragment is
       fetched from the dashboard's OWN static root on :9430 instead
       (`app.use(express.static(rendererPath))`, api.js:386).
     · that cross-origin fetch WORKS from file:// — proven by CDP:
       fetch('http://127.0.0.1:9851/tokens.css') → 200 (ACAO: null is served,
       api.js:363-374).
     · the renderer holds window.dashboardConfig.apiBase = 'http://127.0.0.1:9851'
       (preload.js:208); the auth token is the same bridge's authToken.
     · app.js re-renders #main-content on a 30 s auto-refresh and on tab
       switches, which WIPES a self-mounted tab → watchHost() below; and two
       tabs mounted by this contract share ONE host, so the guard must be able
       to tell "the page was wiped" from "another tab took the panel".
   ================================================================= */
(function () {
  'use strict';

  var VERSION = '1.0.1';

  /** Numeric semver compare — '2.0.0' vs '10.0.0' MUST NOT be a string compare
   *  (lexicographically '2.0.0' > '10.0.0', which would make this loader skip a
   *  NEWER bridge). Returns -1 | 0 | 1. */
  function cmpVersion(a, b) {
    var pa = String(a).split('.').map(function (n) { return parseInt(n, 10) || 0; });
    var pb = String(b).split('.').map(function (n) { return parseInt(n, 10) || 0; });
    for (var i = 0; i < Math.max(pa.length, pb.length); i++) {
      var d = (pa[i] || 0) - (pb[i] || 0);
      if (d) return d > 0 ? 1 : -1;
    }
    return 0;
  }

  if (window.PlutusShell && cmpVersion(window.PlutusShell.VERSION || '0.0.0', VERSION) >= 0) {
    // A copy at least as new is already loaded — never downgrade.
    return;
  }

  var _dc = function () {
    return window.dashboardConfig || {};
  };

  // ── THE API BRIDGE ────────────────────────────────────────────
  function apiBase() {
    var base = _dc().apiBase || (window.plutus && window.plutus.apiBase) || 'http://127.0.0.1:9851';
    return String(base).replace(/\/+$/, '');
  }

  function wsUrl() {
    return _dc().wsUrl || 'ws://127.0.0.1:9431';
  }

  function authToken() {
    return _dc().authToken || null;
  }

  /** fetch with the Bearer token, a timeout, and a Result-shaped return.
   *  Never throws: {ok, status, json, text, error, ms}. */
  async function api(path, opts) {
    opts = opts || {};
    var url = /^https?:/.test(path) ? path : apiBase() + (path.charAt(0) === '/' ? path : '/' + path);
    var t0 = Date.now();
    var ctl = new AbortController();
    var timer = setTimeout(function () {
      ctl.abort();
    }, opts.timeoutMs || 10000);
    try {
      var headers = Object.assign({ Accept: 'application/json' }, opts.headers || {});
      var token = opts.token !== undefined ? opts.token : authToken();
      if (token) headers.Authorization = 'Bearer ' + token;
      if (opts.body !== undefined && typeof opts.body !== 'string') {
        headers['Content-Type'] = 'application/json';
        opts = Object.assign({}, opts, { body: JSON.stringify(opts.body) });
      }
      var res = await fetch(url, {
        method: opts.method || 'GET',
        headers: headers,
        body: opts.body,
        signal: ctl.signal,
      });
      var text = await res.text();
      var json = null;
      try {
        json = JSON.parse(text);
      } catch (_e) {
        json = null;
      }
      return { ok: res.ok, status: res.status, json: json, text: text, ms: Date.now() - t0, url: url };
    } catch (e) {
      return {
        ok: false,
        status: 0,
        json: null,
        text: '',
        error: e && e.name === 'AbortError' ? 'TIMEOUT after ' + (opts.timeoutMs || 10000) + 'ms' : String(e),
        ms: Date.now() - t0,
        url: url,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  /** A NAMED liveness read of any http service. {"up":bool,"status":n,"ms":n,"why":str}
   *  Never rejects (api() never throws), so a poll around it cannot die. */
  async function probe(url, opts) {
    opts = opts || {};
    var r = await api(url, { timeoutMs: opts.timeoutMs || 3000, token: null });
    var up = r.ok && r.status >= 200 && r.status < 400;
    return {
      up: up,
      status: r.status,
      ms: r.ms,
      why: up ? '' : r.error || ('HTTP ' + r.status),
      json: r.json,
      text: r.text,
    };
  }

  /** poll(fn, intervalMs) — fn may be async; overlap is impossible and a throw
   *  inside fn is caught and logged, never fatal. Returns {stop(), tick()}. */
  function poll(fn, opts) {
    opts = opts || {};
    var interval = opts.intervalMs || 5000;
    var stopped = false;
    var running = false;
    var handle = {
      intervalMs: interval,
      stop: function () {
        stopped = true;
        clearTimeout(handle._t);
      },
      tick: function () {
        run();
      },
    };
    async function run() {
      if (stopped || running) return;
      running = true;
      try {
        await fn();
      } catch (e) {
        console.error('[PlutusShell] poll handler threw:', e);
      } finally {
        running = false;
        if (!stopped) handle._t = setTimeout(run, interval);
      }
    }
    if (opts.immediate !== false) run();
    else handle._t = setTimeout(run, interval);
    return handle;
  }

  // ── FORMATTERS (old money: no neon, no gamified counters) ─────
  function _num(v, digits) {
    if (v === null || v === undefined || v === '' || isNaN(Number(v))) return '—';
    return Number(v).toLocaleString('en-US', {
      minimumFractionDigits: digits || 0,
      maximumFractionDigits: digits || 0,
    });
  }

  var fmt = {
    int: function (v) {
      return _num(v, 0);
    },
    num: function (v, d) {
      return _num(v, d === undefined ? 2 : d);
    },
    money: function (v, opts) {
      opts = opts || {};
      if (v === null || v === undefined || v === '' || isNaN(Number(v))) return '—';
      var n = Number(v);
      var s = Math.abs(n).toLocaleString('en-US', {
        minimumFractionDigits: opts.digits === undefined ? 2 : opts.digits,
        maximumFractionDigits: opts.digits === undefined ? 2 : opts.digits,
      });
      return (n < 0 ? '-' : '') + (opts.bare ? '' : '$') + s;
    },
    pct: function (v, d) {
      if (v === null || v === undefined || v === '' || isNaN(Number(v))) return '—';
      var n = Number(v);
      // Accepts 12.5 (already a percent) — the dashboard's own convention.
      return n.toFixed(d === undefined ? 1 : d) + '%';
    },
    /** 'YYYY-MM-DD HH:MM:SS' | ISO | epoch-seconds | epoch-ms → a Date or null.
     *  The epoch boundary is 1e11: seconds today ≈ 1.8e9, ms today ≈ 1.8e12, so
     *  1e11 separates them with room for any realistic date on either side
     *  (1e11 s = year 5138; 1e11 ms = 1973). */
    parse: function (ts) {
      if (ts === null || ts === undefined || ts === '') return null;
      if (ts instanceof Date) return ts;
      if (typeof ts === 'number') return new Date(ts < 1e11 ? ts * 1000 : ts);
      var s = String(ts).trim();
      if (/^\d+$/.test(s)) {
        var n = Number(s);
        return new Date(n < 1e11 ? n * 1000 : n);
      }
      var iso = /^\d{4}-\d{2}-\d{2}$/.test(s) ? s + 'T00:00:00' : s.replace(' ', 'T');
      var d = new Date(iso);
      return isNaN(d.getTime()) ? null : d;
    },
    date: function (ts) {
      var d = fmt.parse(ts);
      return d ? d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : '—';
    },
    time: function (ts) {
      var d = fmt.parse(ts);
      return d
        ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
        : '—';
    },
    ago: function (ts) {
      var d = fmt.parse(ts);
      if (!d) return '—';
      var s = Math.max(0, (Date.now() - d.getTime()) / 1000);
      if (s < 60) return Math.floor(s) + 's ago';
      if (s < 3600) return Math.floor(s / 60) + 'm ago';
      if (s < 86400) return Math.floor(s / 3600) + 'h ago';
      return Math.floor(s / 86400) + 'd ago';
    },
    dur: function (ms) {
      if (ms === null || ms === undefined) return '—';
      if (ms < 1000) return Math.round(ms) + 'ms';
      if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
      return Math.floor(ms / 60000) + 'm' + Math.round((ms % 60000) / 1000) + 's';
    },
  };

  // ── DOM ───────────────────────────────────────────────────────
  /** el('div', {class:'x', text:'y', onclick:fn, style:'…'}, [children]).
   *  SAFETY: there is NO `html` escape hatch (a tab that puts API or user text
   *  through it would be a stored-XSS hole), and an `on*` key is only honoured
   *  when its value is a FUNCTION — a string like "alert(1)" is ignored, never
   *  set as an attribute. Use textContent (the `text` key) for any data. */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined) return;
        if (k === 'text') node.textContent = String(v);
        else if (k === 'class' || k === 'className') node.className = String(v);
        else if (k === 'style') node.setAttribute('style', String(v));
        else if (k === 'dataset') Object.keys(v).forEach(function (d) { node.dataset[d] = v[d]; });
        else if (k.slice(0, 2) === 'on') {
          if (typeof v === 'function') node.addEventListener(k.slice(2), v);
          else console.warn('[PlutusShell] el(): ignored non-function handler ' + k);
        } else node.setAttribute(k, String(v));
      });
    }
    (children || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      node.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    });
    return node;
  }

  var _assets = {};
  /** ensureTokens() — idempotently link the dashboard's own tokens.css (single
   *  source of truth, served by the :9430 static root) and inject the shared
   *  shell base styles (status dots + the toolbar rhythm). Safe to call from
   *  every tab, and idempotent ACROSS copies (it checks the DOM by id, not only
   *  its own closure). */
  function ensureTokens() {
    if (_assets.tokens) return _assets.tokens;
    var link = document.getElementById('plutus-shell-tokens');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = apiBase() + '/tokens.css';
      link.id = 'plutus-shell-tokens';
      document.head.appendChild(link);
    }
    var style = document.getElementById('plutus-shell-base');
    if (!style) {
      style = document.createElement('style');
      style.id = 'plutus-shell-base';
      style.textContent = [
        '.ps-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--text-faint);',
        'vertical-align:middle;flex:0 0 auto}',
        '.ps-dot-ok{background:var(--accent-green)}',
        '.ps-dot-down{background:var(--accent-red)}',
        '.ps-dot-warn{background:var(--accent-gold)}',
        '.ps-dot-unknown{background:var(--text-muted)}',
        '.ps-toolbar{display:flex;align-items:center;gap:14px;padding:0 18px;height:38px;',
        'border-bottom:1px solid var(--border-base);background:var(--bg-panel);flex:0 0 auto}',
        '.ps-toolbar .ps-label{font-size:10px;letter-spacing:var(--track-wide);text-transform:uppercase;',
        'color:var(--text-muted)}',
        '.ps-tlink{background:none;border:none;padding:2px 0;font:inherit;font-size:11px;cursor:pointer;',
        'letter-spacing:var(--track-mid);text-transform:uppercase;color:var(--text-secondary);',
        'border-bottom:1px solid transparent}',
        '.ps-tlink:hover{color:var(--text-primary);border-bottom-color:var(--border-accent)}',
        '.ps-tlink.active{color:var(--accent-gold);border-bottom-color:var(--border-accent)}',
        '.ps-note{font-size:11px;color:var(--text-muted);letter-spacing:0.04em}',
      ].join('');
      document.head.appendChild(style);
    }
    _assets.tokens = { link: link, style: style };
    return _assets.tokens;
  }

  /** loadFragment('tabs/journal.html') — the body fragment of a tab module.
   *  The renderer runs on file:// where fetch() of a sibling file is blocked
   *  (Chromium), so the fragment is read from the dashboard's own static root
   *  on :9430. Loud on failure: returns {ok:false,error} — never an empty
   *  string masquerading as markup. The caller must NOT innerHTML this without
   *  a trust decision: it is same-machine HTTP, and the fragment is the tab's
   *  own file, but it is fetched over a socket — see mount() in journal.js for
   *  the guard the tab applies. */
  async function loadFragment(relPath) {
    var url = apiBase() + '/' + String(relPath).replace(/^\/+/, '');
    var r = await api(url, { timeoutMs: 8000, token: null });
    if (!r.ok || !r.text) {
      return { ok: false, error: r.error || 'HTTP ' + r.status, url: url, html: null };
    }
    return { ok: true, html: r.text, url: url };
  }

  // ── THE TAB REGISTRATION CONTRACT ─────────────────────────────
  var _tabs = {};

  /** The top-rail host (index.html: <div data-shell-host="<key>">) — the tab's own panel. */
  function railHostFor(key) {
    var all = document.querySelectorAll('[data-shell-host]');
    for (var i = 0; i < all.length; i++) {
      if (all[i].getAttribute('data-shell-host') === key) return all[i];
    }
    return null;
  }

  function mountHost(spec) {
    var rail = railHostFor(spec.key);
    if (rail) return rail;
    if (spec.containerId) {
      var byId = document.getElementById(spec.containerId);
      if (byId) return byId;
    }
    return document.getElementById('main-content') || document.body;
  }

  /** Every `data-tab-key` in the host, for the ownership test. */
  function tabKeysIn(host) {
    return Array.prototype.map.call(host.querySelectorAll('[data-tab-key]'), function (n) {
      return n.getAttribute('data-tab-key');
    });
  }

  function navButtonFor(navPage) {
    var all = document.querySelectorAll('.nav-btn[data-page]');
    for (var i = 0; i < all.length; i++) {
      if (all[i].dataset && all[i].dataset.page === navPage) return all[i];
    }
    return null;
  }

  /** Give the sibling app.js a state it agrees with, so its own re-render
   *  resolves to THIS tab's page key instead of the previous page. app.js
   *  exposes window.PLUTUS.navigateToPage (app.js:2364). Tolerant of a
   *  sync/void implementation in a future sibling: the state is synced either
   *  way, and a returned promise is only awaited when it really is one. */
  function claimTab(key) {
    try {
      if (!(window.PLUTUS && window.PLUTUS.State)) return;
      var state = window.PLUTUS.State;
      var was = state.currentPage;
      if (typeof window.PLUTUS.navigateToPage === 'function') {
        var ret = window.PLUTUS.navigateToPage(key);
        if (ret && typeof ret.then === 'function') {
          ret.then(null, function () {
            state.currentPage = key;
          });
        }
      }
      // sync immediately: app.js's navigateToPage sets it synchronously anyway,
      // and a no-op would otherwise leave the router on the old page.
      state.currentPage = key;
      if (was && was !== key) console.log('[PlutusShell] app.js page: ' + was + ' → ' + key);
    } catch (e) {
      console.warn('[PlutusShell] could not claim the app.js page key', e);
    }
  }

  /**
   * registerTab({
   *   key:        'journal-live',           // registry key + page key
   *   navPage:    'journal-live',           // the .nav-btn[data-page] that opens it (defaults to key)
   *   label:      'JOURNAL',                // for logging only
   *   containerId:'page-journal-live',      // optional explicit host
   *   mount: (host) => …,                   // REQUIRED, idempotent, may be async
   *   unmount: () => …                      // optional
   * })
   * → window.PlutusShellTabs[key] = {key, mount, unmount, dispose, mounted}
   */
  function registerTab(spec) {
    if (!spec || !spec.key || typeof spec.mount !== 'function') {
      throw new Error('PlutusShell.registerTab requires {key, mount}');
    }
    var key = spec.key;
    var navPage = spec.navPage || key;
    var tab = {
      key: key,
      navPage: navPage,
      version: VERSION,
      mounted: false,
      mounting: false,
      disposed: false,
      mount: function (host) {
        var target = host || mountHost(spec);
        if (!target) return { ok: false, error: 'NO_HOST' };
        tab.unmount();
        tab.mounted = true;
        tab.mounting = true;
        var done = function (r) {
          tab.mounting = false;
          return r === undefined ? { ok: true } : r;
        };
        var fail = function (e) {
          tab.mounting = false;
          tab.mounted = false;
          console.error('[PlutusShell] ' + key + ' mount failed:', e);
          return { ok: false, error: String(e) };
        };
        try {
          var res = spec.mount(target);
          if (res && typeof res.then === 'function') {
            // ALWAYS clear `mounting`, or the re-mount guard would refuse to
            // help for the rest of the session.
            return res.then(done, fail);
          }
          return done(res);
        } catch (e) {
          return fail(e);
        }
      },
      unmount: function () {
        if (!tab.mounted) return;
        try {
          if (typeof spec.unmount === 'function') spec.unmount();
        } catch (e) {
          console.error('[PlutusShell] ' + key + ' unmount threw:', e);
        }
        tab.mounted = false;
      },
      /** Permanent teardown: unmount + stop the re-mount guard. */
      dispose: function () {
        tab.disposed = true;
        tab.unmount();
        if (tab._observer) {
          try {
            tab._observer.disconnect();
          } catch (e) {
            /* already gone */
          }
          tab._observer = null;
        }
      },
      /** re-render in place (a toolbar refresh, a WS nudge) */
      refresh: function () {
        if (tab.mounted) tab.mount(null);
      },
    };
    _tabs[key] = tab;
    window.PlutusShellTabs = window.PlutusShellTabs || {};
    window.PlutusShellTabs[key] = tab;

    // SELF-MOUNT PATH 1 — claim the nav click before the sibling app.js
    // handler sees it (capture at document fires before the element listener;
    // stopPropagation at capture stops the whole path). One listener per tab,
    // and the match is a DATASET COMPARE, never a selector built from the key
    // (a key with a quote or a bracket would break an interpolated selector).
    document.addEventListener(
      'click',
      function (ev) {
        var t = ev.target;
        if (!t || !t.closest) return;
        var btn = t.closest('.nav-btn[data-page]');
        if (!btn || !btn.dataset || btn.dataset.page !== navPage) return;
        ev.stopPropagation();
        if (typeof ev.preventDefault === 'function') ev.preventDefault();
        Array.prototype.forEach.call(document.querySelectorAll('.nav-btn'), function (b) {
          b.classList.toggle('active', b === btn);
        });
        claimTab(key);
        tab.mount(null);
      },
      true,
    );

    // SELF-MOUNT PATH 2 — an explicit container that already exists.
    var scan = function () {
      var c = spec.containerId ? document.getElementById(spec.containerId) : null;
      if (c) tab.mount(c);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan);
    else setTimeout(scan, 0);

    // SELF-MOUNT PATH 3 — SURVIVE THE SIBLING'S RE-RENDER (measured live,
    // 2026-09-29): app.js re-renders the current page into #main-content on a
    // 30 s auto-refresh tick and on every tab switch back, which wipes a tab
    // that mounted itself. The tab's root must therefore carry
    // `data-tab-key="<key>"`; when the host loses it while this tab is the
    // active one, the tab re-mounts itself. mount() is idempotent by contract.
    watchHost(spec, tab, key);
    console.log('[PlutusShell] tab registered: ' + key + ' (nav data-page="' + navPage + '") v' + VERSION);
    return tab;
  }

  /** The re-render guard: re-mount the tab into its host whenever the host no
   *  longer contains `data-tab-key="<key>"` because the SIBLING RE-RENDERED the
   *  same page — and stand down when the host was taken by ANOTHER TAB (a mount
   *  is navigation; two guards without this rule fight forever, each wiping the
   *  other). Watches the HOST when one is known, the body otherwise, and is
   *  disconnected by tab.dispose(). */
  function watchHost(spec, tab, key) {
    if (typeof MutationObserver !== 'function') return;
    var timer = null;
    var check = function () {
      timer = null;
      if (tab.disposed || !tab.mounted || tab.mounting) return;
      var host = mountHost(spec);
      if (!host) return;
      var keys = tabKeysIn(host);
      if (keys.indexOf(key) >= 0) return; // ours is there
      // ONE HOST, ONE OWNER — ANY foreign tab root means the operator navigated.
      var foreign = keys.filter(function (k) {
        return k !== key;
      });
      if (foreign.length) {
        tab.mounted = false;
        console.log('[PlutusShell] ' + key + ': host is owned by ' + foreign.join(',') + ' — standing down');
        return;
      }
      // Only the ACTIVE page re-mounts itself. A TOP-RAIL tab (audit H1): it has no sidebar
      // .nav-btn, so "active" is its rail panel being displayed; a sidebar tab keeps the .active test.
      var rail = railHostFor(key);
      if (rail) {
        var panel = rail.closest('.tab-panel');
        // no panel, or a hidden one: NOT the active page — stand down (never re-mount blind)
        if (!panel || getComputedStyle(panel).display === 'none') { tab.mounted = false; return; }
      } else {
        var btn = navButtonFor(spec.navPage || key);
        if (!btn || !btn.classList.contains('active')) { tab.mounted = false; return; }
      }
      console.log('[PlutusShell] ' + key + ': host lost the tab (a sibling re-render) — re-mounting');
      tab.mount(host);
    };
    var obs = new MutationObserver(function () {
      if (timer || tab.disposed) return;
      timer = setTimeout(check, 250);
    });
    // Observe the tab's own host when it has one (the rail host), never the whole body (audit M).
    // the host's PARENT is observed (the rail panel): a re-render that REPLACES the host is seen too
    var rh = railHostFor(key);
    obs.observe((rh && rh.parentNode) || (spec.containerId && document.getElementById(spec.containerId)) || document.body, {
      childList: true,
      subtree: true,
    });
    tab._observer = obs;
  }

  function getTab(key) {
    return _tabs[key] || (window.PlutusShellTabs && window.PlutusShellTabs[key]) || null;
  }

  window.PlutusShell = {
    VERSION: VERSION,
    cmpVersion: cmpVersion,
    apiBase: apiBase,
    wsUrl: wsUrl,
    authToken: authToken,
    api: api,
    probe: probe,
    poll: poll,
    fmt: fmt,
    el: el,
    ensureTokens: ensureTokens,
    loadFragment: loadFragment,
    registerTab: registerTab,
    getTab: getTab,
    railHostFor: railHostFor,
  };
})();
