/* _agent-desk.js — THE AGENT DESK WATCHER (always loaded, whatever tab is on screen).

   Agents in Orca drive the Pine Shell through queued commands (tools/plutus-pine.mjs). The executor
   is the AGENT'S FACE inside the PINE SHELL tab, which mounts lazily (a hidden chart renders 0x0).
   Measured 2026-09-30: after a reload with the operator on BACKTEST, an agent's `market` command sat
   PENDING — nothing on screen could run it. This watcher closes that gap:

     FOLLOW AGENTS on  (the face's toggle, localStorage plutus.face.follow != 'off')
         → a command for an unmounted Pine Shell OPENS the PINE SHELL tab; the face boots, reads the
           pending queue and runs it on the real chart.
     FOLLOW AGENTS off
         → the PINE SHELL rail button carries the count of waiting agent commands; they run when the
           operator opens it (the agent's CLI waits, then names COMMAND_TIMEOUT).

   Once the Pine Shell is mounted the face owns the socket traffic; this watcher stands down. */
(function () {
  'use strict';
  var cfg = window.dashboardConfig || {};
  var API = (cfg.apiBase || 'http://127.0.0.1:9851') + '/api/v1';
  var WS_URL = cfg.wsUrl || 'ws://127.0.0.1:9431';
  var TOKEN = cfg.authToken || '';
  var waiting = {};
  var ws = null, tries = 0;

  // mounted = a live handle whose container is IN the document (a destroyed shell clears the global too)
  function pineMounted() { var h = window.PlutusPineShell; return !!(h && h.mount && h.mount.isConnected); }
  function follow() { try { return localStorage.getItem('plutus.face.follow') !== 'off'; } catch (e) { return true; } }
  function railButton() { return document.querySelector('.tab-btn[data-tab="pine"]'); }

  function paintBadge() {
    var btn = railButton();
    if (!btn) return;
    var n = Object.keys(waiting).length;
    var b = btn.querySelector('.rail-agent-badge');
    if (!n || pineMounted()) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement('span'); b.className = 'rail-agent-badge'; btn.appendChild(b); }
    b.textContent = String(n);
    b.title = n + ' agent command' + (n > 1 ? 's' : '') + ' waiting for the Pine Shell';
  }

  var switching = false;
  var COMMANDS = { run: 1, gate: 1, capture: 1, focus: 1, load: 1 };
  function onCommand(cmd) {
    // only a well-formed command of a known verb may move the operator's view
    // OWN properties only: 'toString' / 'constructor' / '__proto__' are not verbs
    if (!cmd || typeof cmd.id !== 'string' || !/^cmd_[0-9a-f]{16}$/.test(cmd.id) || !Object.prototype.hasOwnProperty.call(COMMANDS, cmd.cmd) || pineMounted()) return;
    if (Object.keys(waiting).length >= 200) return; // bounded: the badge counts at most 200 waiting commands
    waiting[cmd.id] = cmd;
    // ONE switch per burst: N queued commands never fight the operator's tab N times
    if (follow() && !switching && window.TabManager && typeof window.TabManager.switchTab === 'function') {
      switching = true;
      setTimeout(function () { switching = false; }, 5000);
      console.log('[agent-desk] ' + (cmd.agentId || 'an agent') + ' queued ' + cmd.cmd + ' — FOLLOW: opening the PINE SHELL');
      window.TabManager.switchTab('pine');
      // the count clears only when the face has READ the pending queue (plutus-face-queue-read below)
    }
    paintBadge();
  }

  function connect() {
    if (pineMounted()) return; // the face owns the socket from here
    try { ws = new WebSocket(WS_URL + (TOKEN ? '?token=' + encodeURIComponent(TOKEN) : '')); } catch (e) { return; }
    ws.onopen = function () { tries = 0; try { ws.send(JSON.stringify({ type: 'SUBSCRIBE', channels: ['agents'] })); } catch (e) { /* best effort */ } };
    ws.onmessage = function (ev) {
      var m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.type === 'WORKSPACE_COMMAND') onCommand(m);
    };
    ws.onclose = function () { if (!pineMounted() && tries++ < 30) setTimeout(connect, Math.min(15000, 800 * tries)); };
  }

  /** Commands queued while the dashboard was closed (the face expires the stale ones itself). */
  function readPending() {
    if (!TOKEN || pineMounted()) return;
    fetch(API + '/commands/pending', { headers: { authorization: 'Bearer ' + TOKEN } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) {
        var list = (j && j.success && j.data && j.data.commands) || [];
        list.forEach(function (c) { onCommand({ id: c.id, agentId: c.agent_id, cmd: c.cmd }); });
      })
      .catch(function (e) { console.warn('[agent-desk] pending queue unreadable:', e && e.message); });
  }

  // the Pine Shell mounted (by the operator or by FOLLOW): the face takes over
  document.addEventListener('tab-switched', function (e) {
    if (e.detail && e.detail.tab === 'pine') {
      setTimeout(function () { if (pineMounted() && ws) { try { ws.close(); } catch (x) { /* gone */ } } }, 1500);
    }
  });

  // the face read the pending queue: every waiting command is now the face's — the badge clears
  document.addEventListener('plutus-face-queue-read', function () { waiting = {}; paintBadge(); });
  function boot() { connect(); readPending(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 300); });
  else setTimeout(boot, 300);
  window.PlutusAgentDesk = { waiting: function () { return Object.keys(waiting); }, follow: follow };
})();
