/* _rail.js — mounts the shell tabs into their TOP-RAIL panels.
   The tab modules register themselves (PlutusShell.registerTab); this file only
   decides WHEN: lazily, on the first switch to the tab, because a hidden panel
   has zero width and a chart sized while hidden would render at 0×0. After the
   mount (and on every later switch) it fires a resize so charts re-fit.
   A tab whose module failed to load renders a NAMED error, never a blank panel. */
(function () {
  'use strict';
  var MAP = { journal: 'journal-live', backtest: 'backtest-room', pine: 'pine-shell' };

  function ensure(tab) {
    var key = MAP[tab];
    if (!key) return;
    var host = window.PlutusShell && window.PlutusShell.railHostFor
      ? window.PlutusShell.railHostFor(key) : null;
    if (!host) return;
    var t = window.PlutusShellTabs && window.PlutusShellTabs[key];
    if (!t) {
      host.innerHTML = '';
      var err = document.createElement('div');
      err.className = 'shell-host-error';
      err.textContent = 'TAB_MODULE_ABSENT · tabs/' + key + ' did not register';
      host.appendChild(err);
      console.error('[rail] TAB_MODULE_ABSENT', key);
      return;
    }
    if (!t.mounted && !t.mounting) t.mount(host);
    requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); });
  }

  document.addEventListener('tab-switched', function (e) { ensure(e.detail && e.detail.tab); });
  function boot() {
    var a = window.TabManager && window.TabManager.getActiveTab && window.TabManager.getActiveTab();
    if (a) ensure(a);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 0); });
  else setTimeout(boot, 0);
  window.PlutusRail = { ensure: ensure, MAP: MAP };
})();
