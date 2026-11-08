/* =================================================================
   pineshell.js — THE PINE SHELL TAB MODULE (SHELL_ANCHOR §5.3 + §15/§16).
   -----------------------------------------------------------------
   OWNER: the PineShell desk. SELF-CONTAINED: it edits NO sibling file. It
   injects its own stylesheet, loads its own fragment, imports the kernel from
   dashboard/pine-ide/**, and registers itself with PlutusShell (created by the
   ShellJournal desk) when that helper is present.

   INTEGRATOR LINES (verbatim; nothing else is required):
     1. NAV ENTRY — in dashboard/renderer/index.html, inside <nav class="sidebar-nav">:
          <button class="nav-btn" data-page="pine-shell"><span class="nav-label">PINE SHELL</span></button>
     2. SCRIPT TAGS — in index.html before </body> (after _shell.js):
          <script src="tabs/_shell.js"></script>
          <script src="tabs/pineshell.js"></script>
     3. THE KERNEL must be reachable over the static root (a file:// renderer cannot
        import a sibling file). ONE symlink, no copying:
          ln -sfn ../../pine-ide dashboard/renderer/tabs/pine-ide
     4. THE VIL RAIL (the ledger + PNG writer; :9444) — spawned by the main process
        beside the journal/pine-station children, and stopped on quit:
          var vilRail = require('child_process').spawn(process.execPath, [path.join(__dirname,'..','pine-ide','vil-rail.mjs')], { stdio: ['ignore','pipe','pipe'] });
          vilRail.stdout.on('data', d => console.log('[MAIN] vil-rail:', String(d).trim()));
          // on quit: try { vilRail.kill('SIGTERM'); } catch {}
     5. OPTIONAL (the LOOK): window.PlutusPineShellConfig = { readerUrl: 'http://127.0.0.1:PORT/vision' }
        — a reader endpoint accepting POST {image_base64, task} → {verdict, text, model}.
        Absent ⇒ the row records readerVerdict PENDING + delta READER_ABSENT (never PASS).

   MOUNT CONTRACT: PlutusShell.registerTab({key:'pine-shell', navPage:'pine-shell',
   containerId:'pine-shell-root'}) — and, with no helper present, a self-mount into
   #pine-shell-root / [data-pine-shell] / #main-content.
   ================================================================= */
(function () {
  'use strict';

  var VERSION = '1.0.0';
  var KEY = 'pine-shell';
  var _handle = null;
  var _container = null;

  function apiBase() {
    return (window.dashboardConfig && window.dashboardConfig.apiBase) || 'http://127.0.0.1:9851';
  }
  function wsUrl() {
    return (window.dashboardConfig && window.dashboardConfig.wsUrl) || 'ws://127.0.0.1:9431';
  }
  function overHttp() { return location.protocol === 'http:' || location.protocol === 'https:'; }
  /** The asset base: the shell's static root from file://, the page's own dir over http. */
  function assetBase() { return overHttp() ? './' : apiBase() + '/tabs/'; }

  function injectCss() {
    var id = 'pineshell-css';
    if (document.getElementById(id)) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.id = id; l.href = assetBase() + 'pineshell.css';
    document.head.appendChild(l);
  }

  /** The dashboard's own tokens (single source of truth) — link it when the helper
   *  is absent (a bare harness) so every var() resolves. */
  function ensureTokens() {
    if (window.PlutusShell && typeof window.PlutusShell.ensureTokens === 'function') {
      try { window.PlutusShell.ensureTokens(); return; } catch (e) { /* fall through */ }
    }
    if (document.getElementById('plutus-shell-tokens')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.id = 'plutus-shell-tokens';
    l.href = assetBase() + 'tokens.css';
    document.head.appendChild(l);
  }

  async function loadFragment() {
    if (window.PlutusShell && typeof window.PlutusShell.loadFragment === 'function') {
      var r = await window.PlutusShell.loadFragment('tabs/pineshell.html');
      if (r && r.ok && r.html) return { ok: true, html: r.html, via: 'PlutusShell.loadFragment' };
      return { ok: false, error: (r && r.error) || 'fragment load failed', via: 'PlutusShell.loadFragment' };
    }
    var url = assetBase() + 'pineshell.html';
    try {
      var res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return { ok: false, error: 'HTTP ' + res.status, url: url, via: 'fetch' };
      return { ok: true, html: await res.text(), via: 'fetch', url: url };
    } catch (e) {
      return { ok: false, error: e.message, url: url, via: 'fetch' };
    }
  }

  async function importKernel() {
    var bases = [apiBase() + '/tabs/pine-ide/', './pine-ide/', '../pine-ide/'];
    var errors = [];
    for (var i = 0; i < bases.length; i++) {
      var url = bases[i] + 'pine-ide.mjs';
      try {
        var mod = await import(/* @vite-ignore */ url);
        return { ok: true, mod: mod, url: url };
      } catch (e) {
        errors.push(url + ' → ' + e.message);
      }
    }
    return { ok: false, errors: errors };
  }

  /** The optional LOOK reader: a vision endpoint that returns a verdict. */
  function makeReader() {
    var cfg = window.PlutusPineShellConfig || {};
    // Default: the VIL rail's /vil/look (the rail calls the local vision seat :4171 server-side).
    var url = cfg.readerUrl || (function () { try { return localStorage.getItem('plutus_pine_reader'); } catch (e) { return null; } })()
      || ((cfg.railBases && cfg.railBases[0]) || 'http://127.0.0.1:9444') + '/vil/look';
    if (cfg.readerUrl === false) return null;
    return async function (pngDataURL, stats) {
      var res = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: String(pngDataURL).replace(/^data:[^,]*,/, ''),
          task: 'vision verdict: does this chart render the Plutus vision indicator (zone boxes / shape line / labels)? Reply PASS, FAIL or INCONCLUSIVE with one sentence.',
          stats: stats || null,
        }),
        signal: AbortSignal.timeout(120000),
      });
      var j = await res.json();
      var d = (j && j.data) || j || {};
      return { verdict: d.verdict, note: d.note || d.text || d.message || j.error, model: d.model };
    };
  }

  async function mount(host) {
    var container = host || document.getElementById('pine-shell-root') || document.querySelector('[data-pine-shell]') || document.getElementById('main-content');
    if (!container) return { ok: false, error: 'NO_HOST' };
    _container = container;
    ensureTokens();
    injectCss();

    if (_handle) { try { _handle.destroy(); } catch (e) { /* gone */ } _handle = null; }

    var frag = await loadFragment();
    if (!frag.ok) {
      container.innerHTML = '<div class="pine-chart-error"><b>PINESHELL_FRAGMENT_ABSENT</b><br>' + String(frag.error) + '<br><span style="opacity:.7">' + String(frag.url || '') + '</span></div>';
      return { ok: false, error: frag.error, code: 'PINESHELL_FRAGMENT_ABSENT' };
    }
    container.innerHTML = frag.html;

    var kern = await importKernel();
    if (!kern.ok) {
      container.innerHTML = '<div class="pine-chart-error"><b>PINESHELL_KERNEL_ABSENT</b><br>' + kern.errors.join('<br>') +
        '<br><span style="opacity:.7">the kernel must be served: ln -sfn ../../pine-ide dashboard/renderer/tabs/pine-ide</span></div>';
      return { ok: false, error: kern.errors.join(' | '), code: 'PINESHELL_KERNEL_ABSENT' };
    }

    var cfg = window.PlutusPineShellConfig || {};
    _handle = await kern.mod.mount(container, {
      apiBase: apiBase(),
      wsUrl: wsUrl(),
      railBases: cfg.railBases || undefined,
      config: cfg.config || undefined,
      reader: makeReader(),
    });
    _handle.fragmentVia = frag.via;
    _handle.kernelUrl = kern.url;
    console.log('[PineShell] mounted v' + VERSION + ' · kernel ' + kern.url + ' · fragment via ' + frag.via);
    return { ok: true, version: VERSION, kernel: kern.url, fragment: frag.via };
  }

  function unmount() {
    if (_handle) { try { _handle.destroy(); } catch (e) { /* gone */ } _handle = null; }
  }

  window.PlutusPineShellTab = { version: VERSION, key: KEY, mount: mount, unmount: unmount, handle: function () { return _handle; } };

  if (window.PlutusShell && typeof window.PlutusShell.registerTab === 'function') {
    window.PlutusShell.registerTab({
      key: KEY,
      navPage: KEY,
      label: 'PINE SHELL',
      containerId: 'pine-shell-root',
      mount: mount,
      unmount: unmount,
    });
  } else {
    // No helper (a bare harness, or the helper failed to load): self-mount when the
    // container is already present, so the tab is never silently absent.
    function scan() {
      var c = document.getElementById('pine-shell-root') || document.querySelector('[data-pine-shell]');
      if (c) { void mount(c); return true; }
      return false;
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(scan, 0); });
    else setTimeout(scan, 0);
  }
})();
