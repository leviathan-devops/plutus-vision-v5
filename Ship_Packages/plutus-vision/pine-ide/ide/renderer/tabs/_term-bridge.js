/* _term-bridge.js — window.PlutusTerm, THE LIVE TERMINAL TRANSPORT for the AGENT'S FACE 2.0.0.

   FACE_VERSION 2.0.0 (pine-ide/agent-face.mjs) draws a REAL terminal: one cols×rows ANSI
   grid per workspace (createAnsiScreen) fed by a pty's OWN byte stream. Its transport is
   `window.PlutusTerm`, resolved live on every call by the face's termTransport(). In the
   DASHBOARD that global is the Electron preload bridge (renderer/tabs/_agent-desk.js) over
   `ipcMain.handle('term:*')` → electron/terminal-bridge.js.

   THIS app runs in Chrome over HTTP (pv-server :9851) — there is no Electron IPC here — so
   the transport is supplied over HTTP by the SAME server, at /api/v1/term/* (pv-server.py:
   tmux + the stdlib pty, one `plutus-term-<workspace>` session per id). This file is the
   renderer half: the ONE place the face touches the transport, so the face stays a view.

   It is also the WIRING SENTINEL. If the endpoint is missing the face renders a LOUD, NAMED
   refusal (`TERMINAL BRIDGE NOT WIRED …`), never a fake terminal — the theatrical failure
   the 2.0.0 face exists to replace.

   CONTRACT (exactly what agent-face.mjs calls):
     available() · missingReason() · wiring
     open(id, {cols,rows,cwd}) -> {id,name,pid,backend,cols,rows,cwd,alive}
     write(id, data) · resize(id, cols, rows) · close(id) · sessions() · read(id) -> buffer:String
     onData(cb {workspaceId,data}) -> unsub · onExit(cb {workspaceId,name,exit}) -> unsub

   The pty stream is POLLED (/api/v1/term/poll?id=&cursor=): the server keeps a monotonic
   character cursor per session, so a reconnect resyncs (`cursor < floor` -> the whole
   buffer) and never double-paints — `read()` hands back the buffer AND the cursor it
   corresponds to, and the pump starts from that cursor. */
(function () {
  'use strict';
  var cfg = window.dashboardConfig || {};
  var API = ((cfg.apiBase || 'http://127.0.0.1:9851') + '/api/v1').replace(/\/$/, '');
  var TOKEN = cfg.authToken || '';
  var POLL_MS = 60;                       // the pane's own cadence; a keystroke echo is ~1 frame
  var POLL_BACKOFF_MS = 400;              // a refused poll backs off instead of spinning

  function qs(extra) {
    var q = '?token=' + encodeURIComponent(TOKEN);
    return extra ? q + '&' + extra : q;
  }
  function unwrap(r) {
    return r.json().then(function (j) {
      if (!r.ok || !j || j.success !== true) {
        var e = new Error((j && j.error) || ('HTTP ' + r.status));
        e.code = (j && j.code) || ('HTTP_' + r.status);
        throw e;
      }
      return j.data;
    }, function (e) {
      throw Object.assign(new Error('terminal bridge unreachable: ' + e.message), { code: 'TERM_API_DOWN' });
    });
  }
  function get(p, extra) { return fetch(API + p + qs(extra), { headers: TOKEN ? { authorization: 'Bearer ' + TOKEN } : {} }).then(unwrap); }
  function post(p, body) {
    var h = { 'content-type': 'application/json' };
    if (TOKEN) h.authorization = 'Bearer ' + TOKEN;
    return fetch(API + p + qs(), { method: 'POST', headers: h, body: JSON.stringify(body || {}) }).then(unwrap);
  }

  var dataCbs = [], exitCbs = [];
  var cursors = {};                       // id -> chars already consumed (the poll cursor)
  var pumps = {};                         // id -> true while a poll loop is live
  var wchain = {};                        // id -> ordered write chain (writes never overlap)
  var wbuf = {}, wtimer = {};             // id -> coalesced printable run + its flush timer
  var BATCH_MS = 10;                      // one keystroke word -> ONE request (see write() below)
  function emitData(ev) { for (var i = 0; i < dataCbs.length; i++) { try { dataCbs[i](ev); } catch (e) { /* a listener's own bug */ } } }
  function emitExit(ev) { for (var i = 0; i < exitCbs.length; i++) { try { exitCbs[i](ev); } catch (e) { /* a listener's own bug */ } } }

  function sendChunk(id, text) {
    if (!text) return Promise.resolve({ bytes: 0 });
    var p = (wchain[id] || Promise.resolve()).then(function () {
      return post('/term/write', { id: id, data: text });
    }, function () {
      return post('/term/write', { id: id, data: text });
    });
    wchain[id] = p.catch(function (e) { console.warn('[term-bridge] write refused:', e && e.code, e && e.message); });
    return p;
  }
  function flush(id) {
    if (wtimer[id]) { clearTimeout(wtimer[id]); wtimer[id] = null; }
    var s = wbuf[id] || '';
    wbuf[id] = '';
    return sendChunk(id, s);
  }

  function startPump(id) {
    if (pumps[id]) return;
    pumps[id] = true;
    var exited = false;
    (function loop() {
      if (!pumps[id]) return;
      var cur = cursors[id] || 0;
      get('/term/poll', 'id=' + encodeURIComponent(id) + '&cursor=' + cur).then(function (d) {
        cursors[id] = d.cursor || cur;
        if (d.data) emitData({ workspaceId: id, data: d.data });
        if (d.exit && !exited) { exited = true; emitExit({ workspaceId: id, name: d.name, exit: d.exit }); }
        setTimeout(loop, POLL_MS);
      }, function () {
        setTimeout(loop, POLL_BACKOFF_MS);       // never spin on a refused poll
      });
    })();
  }
  function stopPump(id) { delete pumps[id]; }

  window.PlutusTerm = {
    wiring: 'PLUTUS_VISION supplies window.PlutusTerm over HTTP (pv-server :9851 /api/v1/term/*; ' +
            'tmux + the Python stdlib pty, one plutus-term-<workspace> session per id). It needs no ' +
            'Electron preload: this app is Chrome over HTTP. The endpoint lives in scripts/pv-server.py.',
    available: function () { return true; },
    missingReason: function () { return null; },
    open: function (id, opts) {
      var o = opts || {};
      return post('/term/open', { id: id, cols: o.cols, rows: o.rows, cwd: o.cwd });
    },
    write: function (id, data) {
      var text = String(data == null ? '' : data);
      if (!text) return Promise.resolve({ bytes: 0 });
      // A SINGLE PRINTABLE KEYSTROKE COALESCES: a typed word becomes ONE request, not one per key.
      // (Measured 2026-10-07: the per-keystroke storm overflowed the server's connection backlog and
      // `echo PROBE_ALPHA` reached the pane as `echo PROBE_ALP` — 4 keys silently dropped.)
      // A CONTROL / ESCAPE / MULTI-CHAR chunk (Enter \r, arrows, a paste, the face's sendLine) is
      // flushed and sent AS ITS OWN WRITE, in order — Readline's measured law: the line and its Enter
      // must never share a chunk on this path.
      var printable = text.length === 1 && text.charCodeAt(0) >= 32 && text.charCodeAt(0) !== 127;
      if (printable) {
        wbuf[id] = (wbuf[id] || '') + text;
        if (!wtimer[id]) wtimer[id] = setTimeout(function () { void flush(id); }, BATCH_MS);
        return Promise.resolve({ batched: true });
      }
      return flush(id).then(function () { return sendChunk(id, text); });
    },
    resize: function (id, cols, rows) { return post('/term/resize', { id: id, cols: cols, rows: rows }); },
    close: function (id) {
      stopPump(id); delete cursors[id]; delete wbuf[id];
      if (wtimer[id]) { clearTimeout(wtimer[id]); wtimer[id] = null; }
      return post('/term/close', { id: id });
    },
    sessions: function () { return get('/term/sessions').then(function (d) { return (d && d.sessions) || []; }); },
    // read() returns the buffer the face replays into a FRESH screen, and records the cursor that
    // buffer corresponds to — the pump then starts EXACTLY there (never a double-paint).
    read: function (id) {
      return get('/term/read', 'id=' + encodeURIComponent(id)).then(function (d) {
        cursors[id] = (d && d.cursor) || 0;
        startPump(id);
        return (d && d.buffer) || '';
      }, function (e) {
        if (cursors[id] === undefined) cursors[id] = 0;
        startPump(id);
        throw e;
      });
    },
    onData: function (cb) { dataCbs.push(cb); return function () { var i = dataCbs.indexOf(cb); if (i >= 0) dataCbs.splice(i, 1); }; },
    onExit: function (cb) { exitCbs.push(cb); return function () { var i = exitCbs.indexOf(cb); if (i >= 0) exitCbs.splice(i, 1); }; },
    // the orchestrator's probe: one call answers "is the face backed by a real pty right now?"
    diagnose: function () {
      return this.sessions().then(function (s) { return { wired: true, transport: 'http:pv-term', sessions: s }; },
        function (e) { return { wired: true, transport: 'http:pv-term', error: e.code + ': ' + e.message }; });
    },
  };
})();
