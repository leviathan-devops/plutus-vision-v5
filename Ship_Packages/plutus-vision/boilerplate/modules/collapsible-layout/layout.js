  // ─────────────────────────────────────────────────── THE LAYOUT (collapsible panels + drag resize)
  // Ported from the BACKTEST tab's `layout (collapsible panels)` block (backtest.js ~1084): each
  // panel collapses independently, FOCUS collapses all but the chart, the chart column takes every
  // pixel freed, and the Vela chart is told to re-measure — "a flex change does not always fire its
  // own observer". Added: a drag splitter for the editor/chart boundary (the operator's "resize").
  var LAYOUT_KEY = 'plutus.pine.layout';
  var PANES = ['left', 'face', 'foot'];
  // The operator, 2026-10-14: "the chart needs to cover the full height from the top to the bottom"
  // + "why is there shit underneath the chart?" → the status/verdict FOOT starts HIDDEN, so the
  // chart is full height on first paint; the editor starts at 34% ("30 or 40% of the screen").
  var DEFAULTS = { left: false, face: false, foot: true, w: 0.34 };

  function readLayout() {
    var d = { left: DEFAULTS.left, face: DEFAULTS.face, foot: DEFAULTS.foot, w: DEFAULTS.w };
    try {
      var j = JSON.parse(localStorage.getItem(LAYOUT_KEY) || '{}');
      PANES.forEach(function (p) { if (typeof j[p] === 'boolean') d[p] = j[p]; });
      if (typeof j.w === 'number' && isFinite(j.w) && j.w >= 0.18 && j.w <= 0.7) d.w = j.w;
    } catch (e) { /* storage off / corrupt → the defaults stand */ }
    return d;
  }
  function saveLayout(d) { try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(d)); } catch (e) { /* storage off */ } }

  /** Tell the Vela chart to re-measure after the flex layout moved under it. */
  function relayoutChart() {
    try {
      if (_handle && _handle.workbench && _handle.workbench.chart &&
          typeof _handle.workbench.chart.resize === 'function') {
        _handle.workbench.chart.resize();
      }
    } catch (e) { /* not mounted yet */ }
    // belt + braces: the workbench bundle also binds window resize (handleResize / onReflow)
    try { window.dispatchEvent(new Event('resize')); } catch (e) { /* no Event ctor */ }
  }

  function applyLayout(shell, d) {
    if (!shell) { console.warn('[PineShell] applyLayout got no shell'); return; }
    PANES.forEach(function (p) {
      shell.setAttribute('data-hide-' + p, d[p] ? '1' : '0');
      var b = shell.querySelector('.pine-lay-btn[data-lay="' + p + '"]');
      if (b) b.setAttribute('aria-pressed', d[p] ? 'false' : 'true');   // pressed = SHOWN (backtest's convention)
    });
    shell.style.setProperty('--pine-left-w', Math.round(d.w * 100) + '%');
    var all = PANES.every(function (p) { return d[p]; });
    var f = shell.querySelector('.pine-lay-btn[data-lay="focus"]');
    if (f) f.setAttribute('aria-pressed', all ? 'true' : 'false');
    saveLayout(d);
    // the chart host has just changed size: measure now, and again once the layout settles
    requestAnimationFrame(function () { relayoutChart(); setTimeout(relayoutChart, 120); });
  }

  function wireLayout(container) {
    // Look up the shell from the mount container FIRST, then fall back to the document: the
    // fragment is the only [data-pine-shell] on the page, and the shell host may have been
    // re-parented by the tab helper between `innerHTML = frag.html` and here (measured: the
    // container-scoped lookup returned null, so the layout silently never wired).
    var shell = (container && container.querySelector && container.querySelector('[data-pine-shell]'))
      || document.querySelector('[data-pine-shell]');
    if (!shell) {
      console.warn('[PineShell] layout NOT wired — no [data-pine-shell] found (container id: ' +
        ((container && container.id) || container && container.tagName) + ')');
      return;
    }
    var d = readLayout();

    PANES.forEach(function (p) {
      var b = shell.querySelector('.pine-lay-btn[data-lay="' + p + '"]');
      if (b) b.onclick = function () { d[p] = !d[p]; applyLayout(shell, d); };
    });
    var f = shell.querySelector('.pine-lay-btn[data-lay="focus"]');
    if (f) f.onclick = function () {
      var all = PANES.every(function (p) { return d[p]; });   // all hidden → bring them all back
      PANES.forEach(function (p) { d[p] = !all; });
      applyLayout(shell, d);
    };

    // THE DRAG SPLITTER — pointer events, so mouse, pen and trackpad all work. The handle writes
    // --pine-left-w (a percentage of the columns row), which is exactly what .pine-left consumes.
    var split = shell.querySelector('.pine-split');
    var cols = shell.querySelector('.pine-cols');
    if (split && cols) {
      split.onpointerdown = function (ev) {
        ev.preventDefault();
        try { split.setPointerCapture(ev.pointerId); } catch (e) { /* headless */ }
        split.classList.add('is-drag');
        var move = function (e) {
          var r = cols.getBoundingClientRect();
          if (!r.width) return;
          d.w = Math.min(0.7, Math.max(0.18, (e.clientX - r.left) / r.width));
          shell.style.setProperty('--pine-left-w', Math.round(d.w * 100) + '%');
          relayoutChart();
        };
        var up = function (e) {
          split.classList.remove('is-drag');
          try { split.releasePointerCapture(e.pointerId); } catch (x) { /* gone */ }
          split.onpointermove = null; split.onpointerup = null; split.onpointercancel = null;
          saveLayout(d); relayoutChart();
        };
        split.onpointermove = move;
        split.onpointerup = up;
        split.onpointercancel = up;
        move(ev);
      };
    }

    applyLayout(shell, d);
    console.log('[PineShell] layout wired · shell=' + (shell.id || shell.className) +
      ' · hide=' + shell.getAttribute('data-hide-left') + '/' + shell.getAttribute('data-hide-face') +
      '/' + shell.getAttribute('data-hide-foot'));
  }

  function unmount() {
