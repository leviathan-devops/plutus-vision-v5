/* =================================================================
   journal.js — THE JOURNAL TAB  (SHELL_ANCHOR §5.1 T3)
   -----------------------------------------------------------------
   A SELF-CONTAINED tab module: it owns tabs/journal.{html,css,js} and NOTHING
   else in the renderer (index.html / app.js / styles.css / tokens.css belong to
   siblings — this file never touches them).

   WHAT IT IS: the tab that puts LuxAlgo's trade journal (vendored at a pinned
   sha, its own process on :9440) inside the dashboard — its toolbar carries the
   journal's own pages, and the body is a persistent-partition <webview>.

   WHAT IT DOES NOT DO: it never STARTS the journal server. The Electron main
   process owns that child (dashboard/journal-server/lifecycle.mjs → start()),
   exactly like every other shell child. The tab only POLLS the port, renders
   JOURNAL_DOWN + the reason when it is dead, and recovers on its own when it
   comes back — a named state, never a blank panel.

   INTEGRATION (the integrator's one line — see the report):
     <button class="nav-btn" data-page="journal-live"><span class="nav-label">JOURNAL</span></button>
   registerTab() claims that nav click in the capture phase (so sibling app.js
   never renders its own idea of the page into #main-content), and the explicit
   alternative is a branch in app.js renderCurrentPage:
     if (page === 'journal-live') { return window.PlutusShellTabs['journal-live'].mount(main); }
   Both entry points are supported; neither is required to be in this file.

   The pre-existing `renderJournalPage` (app.js:1806, page key 'journal') is the
   DATA-side record of the same trades and is NOT deleted or replaced by this
   module: the two live side by side.
   ================================================================= */
(function () {
  'use strict';

  var KEY = 'journal-live';
  var NAV_PAGE = 'journal-live';
  var FRAGMENT = 'tabs/journal.html';
  var CSS = 'tabs/journal.css';

  /** THE JOURNAL'S OWN PORT — allocated in SHELL_ANCHOR §3 (proven free). */
  var JOURNAL_ORIGIN = 'http://127.0.0.1:9440';
  /** The journal's routes, mirrored in the fragment's toolbar. */
  var ROUTES = ['/', '/calendar', '/journal', '/trades', '/reports', '/playbooks', '/notebook', '/prop-firms'];

  var S = {
    root: null,
    host: null,
    webview: null,
    poller: null,
    down: false,
    lastProbe: null,
    firstUp: false,
    route: '/',
  };

  var $ = function (id) {
    return S.root ? S.root.querySelector('#' + id) : null;
  };

  /** The JOURNAL_TAB_ASSET_MISSING panel, built as DOM nodes (no innerHTML). */
  function assetMissingPanel(frag) {
    var root = document.createElement('div');
    root.className = 'jt-root';
    root.setAttribute('data-tab-key', KEY + '-error');
    var down = document.createElement('div');
    down.className = 'jt-down';
    var card = document.createElement('div');
    card.className = 'jt-down-card';
    var code = document.createElement('div');
    code.className = 'jt-down-code';
    code.textContent = 'JOURNAL_TAB_ASSET_MISSING';
    var why = document.createElement('div');
    why.className = 'jt-down-why';
    why.textContent = 'Could not load ' + FRAGMENT + ' from the dashboard’s own static root.';
    var meta = document.createElement('div');
    meta.className = 'jt-down-meta';
    meta.textContent = String(frag.error || '') + ' — ' + String(frag.url || '');
    card.appendChild(code);
    card.appendChild(why);
    card.appendChild(meta);
    down.appendChild(card);
    root.appendChild(down);
    return root;
  }

  // ── THE NAMED DOWN STATE ──────────────────────────────────────
  function renderDown(res) {
    S.down = true;
    S.lastProbe = res;
    var panel = $('jt-down');
    var dot = $('jt-dot');
    var status = $('jt-status');
    var code = $('jt-down-code');
    var why = $('jt-down-why');
    var meta = $('jt-down-meta');
    if (!panel) return;

    var notRunning = res.status === 0;
    if (code) code.textContent = notRunning ? 'JOURNAL_DOWN (no server on the port)' : 'JOURNAL_DOWN';
    if (why) {
      why.textContent = notRunning
        ? 'Nothing is listening on ' + JOURNAL_ORIGIN + ' — the journal server is not running.'
        : 'The journal server answered but is not usable: HTTP ' + res.status + (res.why ? ' — ' + res.why : '');
    }
    if (meta) {
      meta.textContent =
        'probe ' +
        JOURNAL_ORIGIN +
        '/api/stats · ' +
        (res.ms === undefined ? '—' : res.ms + 'ms') +
        ' · ' +
        new Date().toLocaleTimeString('en-US', { hour12: false }) +
        (res.why && res.status !== 0 ? ' · ' + res.why : '') +
        ' · the dashboard is otherwise alive; rechecked every 4s';
    }
    if (dot) dot.className = 'ps-dot ps-dot-down';
    if (status) status.textContent = 'JOURNAL_DOWN';
    panel.hidden = false;
    if (S.host) S.host.style.display = 'none';
  }

  function renderUp(res) {
    var recovering = !S.firstUp || S.down; // never up before, or coming back
    S.down = false;
    S.lastProbe = res;
    var panel = $('jt-down');
    var dot = $('jt-dot');
    var status = $('jt-status');
    if (panel) panel.hidden = true;
    if (S.host) S.host.style.display = 'flex';
    if (dot) dot.className = 'ps-dot ps-dot-ok';
    if (status) {
      status.textContent =
        'up · ' + (res.source === 'api/stats' ? 'journal.db ok' : 'serving') + ' · ' + res.ms + 'ms';
    }
    S.firstUp = true;
    ensureWebview();
    // ONE recovery path, taken once per transition: the journal came up after
    // the tab did (or came BACK), so load it — the operator touches nothing.
    if (recovering) navigate(S.route);
  }

  // ── THE WEBVIEW (persistent partition) ───────────────────────
  function ensureWebview() {
    if (S.webview || !S.host) return S.webview;
    var wv = document.createElement('webview');
    wv.id = 'jt-webview';
    wv.className = 'jt-view';
    wv.setAttribute('partition', 'persist:plutus-journal');
    wv.setAttribute('allowpopups', 'false');
    wv.setAttribute('webpreferences', 'contextIsolation=yes, nodeIntegration=no');
    wv.addEventListener('dom-ready', function () {
      console.log('[journal-tab] webview dom-ready');
    });
    wv.addEventListener('did-fail-load', function (e) {
      if (e && e.errorCode === -3) return; // aborted (a navigation we caused)
      console.warn('[journal-tab] webview did-fail-load', e && e.errorCode, e && e.errorDescription);
      renderDown({ status: 0, ms: 0, why: 'webview: ' + (e && e.errorDescription) });
    });
    wv.addEventListener('did-navigate', function (e) {
      var u = e && e.url ? String(e.url) : '';
      var m = u.match(/^https?:\/\/127\.0\.0\.1:9440(\/[^?#]*)?/);
      if (m) markRoute(m[1] || '/');
    });
    S.host.appendChild(wv);
    S.webview = wv;
    return wv;
  }

  function navigate(route) {
    var wv = ensureWebview();
    if (!wv) return;
    S.route = ROUTES.indexOf(route) >= 0 ? route : '/';
    var target = JOURNAL_ORIGIN + S.route;
    if (wv.getAttribute('src') === target) {
      if (typeof wv.reload === 'function') wv.reload();
    } else {
      wv.setAttribute('src', target);
    }
    markRoute(S.route);
  }

  function markRoute(route) {
    var links = $('jt-links');
    if (!links) return;
    Array.prototype.forEach.call(links.querySelectorAll('[data-jt-route]'), function (b) {
      b.classList.toggle('active', b.getAttribute('data-jt-route') === route);
    });
  }

  // ── THE POLL (the only thing this tab does to the server: read it) ──
  function probeOnce() {
    return PlutusShell.probe(JOURNAL_ORIGIN + '/api/stats', { timeoutMs: 3000 })
      .then(function (r) {
        if (r.up) renderUp({ up: true, status: r.status, ms: r.ms, source: 'api/stats' });
        else renderDown({ status: r.status, ms: r.ms, why: r.why });
        return r;
      })
      .catch(function (e) {
        // probe() cannot reject, but a throw in renderUp/renderDown/navigate
        // must not become an unhandled rejection with the tab left stale.
        console.error('[journal-tab] probe continuation failed:', e);
        renderDown({ status: 0, ms: 0, why: 'tab error: ' + (e && e.message ? e.message : e) });
        return { up: false, status: 0, why: String(e) };
      });
  }

  // ── MOUNT / UNMOUNT ──────────────────────────────────────────
  var _cssHref = null;

  function ensureCss() {
    if (_cssHref || document.getElementById('jt-css')) return;
    var l = document.createElement('link');
    l.id = 'jt-css';
    l.rel = 'stylesheet';
    l.href = PlutusShell.apiBase() + '/' + CSS;
    document.head.appendChild(l);
    _cssHref = l;
  }

  async function mount(host) {
    if (!host) return { ok: false, error: 'NO_HOST' };
    if (!window.PlutusShell) {
      host.textContent = 'JOURNAL_TAB_HELPER_MISSING — tabs/_shell.js must be loaded before tabs/journal.js.';
      return { ok: false, error: 'SHELL_HELPER_MISSING' };
    }
    PlutusShell.ensureTokens();
    ensureCss();

    // CLAIM THE HOST. Under the integrator's app.js branch that host is already
    // empty (renderCurrentPage clearNode'd it), but under the ONE-LINE nav
    // self-mount nothing cleared it — measured live: the previous page's nodes
    // stayed above the tab. The tab owns its host, so it clears it itself.
    while (host.firstChild) host.removeChild(host.firstChild);
    var existing = host.querySelector('.jt-root');
    if (existing) existing.remove();
    S.webview = null;
    S.firstUp = false;

    var frag = await PlutusShell.loadFragment(FRAGMENT);
    if (!frag.ok) {
      // Named failure, built as NODES: `frag.error`/`frag.url` carry text from
      // a fetch, and putting that through innerHTML would be an XSS door.
      host.appendChild(assetMissingPanel(frag));
      return { ok: false, error: 'FRAGMENT_LOAD_FAILED: ' + frag.error };
    }

    var holder = document.createElement('div');
    holder.innerHTML = frag.html;
    // THE FRAGMENT GUARD: this markup comes over a socket, so it is only
    // adopted when it is OURS — the expected root key, and no script element.
    var root = holder.querySelector('.jt-root[data-tab-key="' + KEY + '"]');
    var hasScript = holder.querySelector('script');
    if (!root || hasScript) {
      host.appendChild(
        assetMissingPanel({
          error: !root ? 'fragment root missing data-tab-key="' + KEY + '"' : 'fragment carries a <script> element',
          url: frag.url,
        }),
      );
      return { ok: false, error: 'FRAGMENT_UNTRUSTED' };
    }
    host.appendChild(root);
    S.root = root;

    S.host = root.querySelector('#jt-view-host');

    // the toolbar
    var links = root.querySelector('#jt-links');
    if (links) {
      links.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-jt-route]');
        if (!btn) return;
        navigate(btn.getAttribute('data-jt-route'));
      });
    }
    var reload = root.querySelector('#jt-reload');
    if (reload) {
      reload.addEventListener('click', function () {
        if (S.webview && typeof S.webview.reload === 'function') S.webview.reload();
        probeOnce();
      });
    }
    var recheck = root.querySelector('#jt-recheck');
    if (recheck) recheck.addEventListener('click', probeOnce);
    var downRecheck = root.querySelector('#jt-down-recheck');
    if (downRecheck) downRecheck.addEventListener('click', probeOnce);

    if (S.poller) S.poller.stop();
    S.poller = PlutusShell.poll(probeOnce, { intervalMs: 4000 });
    markRoute('/');
    console.log('[journal-tab] mounted; server = ' + JOURNAL_ORIGIN + ' (the tab never starts it)');
    return { ok: true };
  }

  function unmount() {
    if (S.poller) S.poller.stop();
    S.poller = null;
    if (S.webview) {
      try {
        // detaching stops its renderer process from being kept warm by the tab
        S.webview.remove();
      } catch (e) {
        console.warn('[journal-tab] webview remove failed', e);
      }
    }
    if (S.root && S.root.parentNode) S.root.parentNode.removeChild(S.root);
    S.webview = null;
    S.root = null;
    S.host = null;
    // no stale state across a re-mount: the next probe decides the state again
    S.down = false;
    S.lastProbe = null;
    S.firstUp = false;
    S.route = '/';
  }

  if (window.PlutusShell && typeof window.PlutusShell.registerTab === 'function') {
    window.PlutusShell.registerTab({ key: KEY, navPage: NAV_PAGE, label: 'JOURNAL', mount: mount, unmount: unmount });
  } else {
    // _shell.js absent (a sibling loaded this module into a bare page): register
    // the same public shape by hand so the integrator's explicit mount still works.
    window.PlutusShellTabs = window.PlutusShellTabs || {};
    window.PlutusShellTabs[KEY] = { key: KEY, mounted: false, mount: mount, unmount: unmount };
    console.warn('[journal-tab] _shell.js was not loaded — the tab is half-armed (no nav self-mount)');
  }
})();
