/**
 * agent-face.mjs — THE AGENT'S FACE (the Pine Shell's third panel).
 *
 * One card per AGENT WORKSPACE (the OPERATOR's own, plus every agent bound to an Orca terminal).
 * Clicking a card SWAPS the other two panels to that agent's workspace — the code panel (its
 * micro-tabs + Pine source) and the chart panel (its market + its study, re-run on its bars) — and
 * points this panel at the agent: TERMINAL mirrors the agent's Orca terminal (its rendered screen,
 * read through the dashboard's Orca bridge; typing here is delivered into that terminal) and LOG
 * shows the workspace's event log (the agent's notes, pushes, runs, verdicts). Everything persists
 * server-side (agent-workspaces.db), so any agent's work is there whenever its card is clicked.
 *
 * Agents drive the Pine IDE from their Orca terminal with tools/plutus-pine.mjs: push Pine into
 * their workspace, then queue run / gate / capture. The dashboard executes the queued command on
 * the chart (following the agent to its workspace when FOLLOW is on) and writes the result back,
 * where the agent's CLI is waiting for it.
 *
 * The IDE is driven only through these hooks (pine-ide.mjs owns the chart + the editor):
 *   ide.exportWorkspace() → state · ide.importWorkspace(state) → Promise · ide.runCommand(cmd) → Promise<{ok, result, summary}>
 */
export const FACE_VERSION = '1.0.0';
const OPERATOR = 'operator';
const SAVE_DEBOUNCE_MS = 1500;
const SCREEN_POLL_MS = 1000;
const STATUS_POLL_MS = 10000;
const COMMAND_MAX_AGE_MS = 10 * 60 * 1000;

export function createAgentFace({ root, apiBase, wsUrl, token, ide, storage = window.localStorage, onWsMessage = null } = {}) {
  const $ = (sel) => root.querySelector(sel);
  const slot = (n) => $(`[data-slot="${n}"]`);
  const S = {
    active: null, rev: 0, row: null, dirty: false, saveTimer: null,
    view: storage.getItem('plutus.face.view') || 'terminal', follow: storage.getItem('plutus.face.follow') !== 'off',
    workspaces: [], terminals: [], unread: {}, lastEventId: 0,
    ws: null, connected: false, tries: 0, seen: [],
    queue: [], busy: false, importing: false,
    screenTimer: null, screenInflight: false, screenErr: null, lastScreen: '',
    statusTimer: null, switching: null,
  };

  // ── the API (the operator's rw token: the dashboard IS the operator) ──
  async function api(method, p, body) {
    let r;
    try {
      r = await fetch(`${apiBase}/api/v1${p}`, { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: body !== undefined ? JSON.stringify(body) : undefined });
    } catch (e) { throw Object.assign(new Error(`API unreachable: ${e.message}`), { code: 'API_DOWN' }); }
    let j = null;
    try { j = await r.json(); } catch { j = null; }
    if (!r.ok || !j || !j.success) throw Object.assign(new Error((j && j.error) || `HTTP ${r.status}`), { code: (j && j.code) || `HTTP_${r.status}`, status: r.status, body: j });
    return j.data;
  }

  /** The archive of superseded operator text — bounded (the event payload cap is 200 KB). */
  function archiveTabs(tabs) {
    return (Array.isArray(tabs) ? tabs : []).slice(0, 12).map((t) => ({ name: String(t.name || '').slice(0, 80), chars: String(t.source || '').length, source: String(t.source || '').slice(0, 12000) }));
  }

  // ── the log panel ──
  const logEl = slot('chat-log');
  const termEl = slot('face-term');
  const sub = slot('chat-sub');
  const input = $('[data-act="chat-input"]');
  function logLine(kind, text, at, by) {
    if (!logEl) return;
    const row = document.createElement('div');
    row.className = 'pine-chat-line pine-chat-' + kind;
    const when = document.createElement('span'); when.className = 'pine-chat-when'; when.textContent = new Date(at || Date.now()).toISOString().slice(11, 19);
    const who = document.createElement('span'); who.className = 'pine-chat-by'; who.textContent = by ? String(by).replace(/^operator:.*/, 'you').replace(/^self:.*/, 'agent') : '';
    const txt = document.createElement('span'); txt.className = 'pine-chat-text'; txt.textContent = text;
    row.append(when, who, txt);
    logEl.appendChild(row);
    while (logEl.childNodes.length > 400) logEl.removeChild(logEl.firstChild);
    logEl.scrollTop = logEl.scrollHeight;
    S.seen.push({ kind, text }); if (S.seen.length > 200) S.seen.shift();
  }
  const sys = (t) => logLine('sys', t);
  function eventKind(e) { return e.kind === 'note' || e.kind === 'say' ? (String(e.by).startsWith('operator') ? 'me' : 'agent') : (e.kind === 'run' || e.kind === 'verdict' ? 'run' : 'sys'); }
  function renderEvents(events) {
    if (!logEl) return;
    logEl.textContent = '';
    for (const e of events || []) { logLine(eventKind(e), `${e.kind === 'note' || e.kind === 'say' ? '' : e.kind + ' · '}${e.text || ''}`, e.at, e.by); S.lastEventId = Math.max(S.lastEventId, e.id); }
    if (!(events || []).length) sys('no events yet — the agent\'s notes, pushes, runs and verdicts land here');
  }

  // ── the cards ──
  const cardsEl = slot('agents');
  function statusOf(w) {
    if (!w.orcaHandle) return 'local';
    const t = S.terminals.find((x) => x.handle === w.orcaHandle);
    if (!t) return 'gone';
    if (!t.connected) return 'off';
    return t.lastOutputAt && Date.now() - t.lastOutputAt < 20000 ? 'busy' : 'idle';
  }
  function renderCards() {
    if (!cardsEl) return;
    cardsEl.textContent = '';
    for (const w of S.workspaces) {
      const c = document.createElement('button');
      c.type = 'button';
      c.className = 'pine-agent-card' + (w.agentId === S.active ? ' is-active' : '');
      c.dataset.agent = w.agentId;
      const st = statusOf(w);
      c.dataset.status = st;
      c.title = `${w.label}${w.orcaHandle ? ' · Orca ' + (w.orcaTitle || w.orcaHandle) : ' · local (no terminal)'} · ${st}`;
      const dot = document.createElement('span'); dot.className = 'pine-agent-dot';
      const name = document.createElement('span'); name.className = 'pine-agent-name'; name.textContent = w.agentId === OPERATOR ? 'OPERATOR' : w.label;
      c.append(dot, name);
      if (S.unread[w.agentId]) { const b = document.createElement('span'); b.className = 'pine-agent-unread'; b.textContent = String(S.unread[w.agentId]); c.appendChild(b); }
      if (w.agentId !== OPERATOR) {
        const x = document.createElement('span'); x.className = 'pine-agent-x'; x.textContent = '×'; x.title = 'Unbind this agent (removes its workspace)';
        // IN-APP two-step confirm: the × ARMS (reads 'unbind?') for 4s, a second click unbinds. window.confirm()
        // was a native OS dialog that froze the whole dashboard until answered (measured 2026-10-01).
        x.addEventListener('click', (e) => {
          e.stopPropagation();
          if (x.dataset.armed !== '1') {
            x.dataset.armed = '1'; x.textContent = 'unbind?'; x.classList.add('armed');
            x._disarm = setTimeout(() => { x.dataset.armed = ''; x.textContent = '×'; x.classList.remove('armed'); }, 4000);
            return;
          }
          clearTimeout(x._disarm);
          void unbind(w);
        });
        c.appendChild(x);
      }
      c.addEventListener('click', () => { void switchTo(w.agentId); });
      cardsEl.appendChild(c);
    }
    const add = document.createElement('button');
    add.type = 'button'; add.className = 'pine-agent-add'; add.textContent = '+ BIND'; add.title = 'Bind an Orca terminal agent to a workspace';
    add.addEventListener('click', () => { void openBind(); });
    cardsEl.appendChild(add);
  }

  // ── bind / unbind ──
  const bindEl = slot('face-bind');
  async function openBind() {
    if (!bindEl) return;
    if (!bindEl.hidden) { bindEl.hidden = true; return; }
    bindEl.hidden = false;
    bindEl.textContent = 'reading Orca terminals…';
    try {
      const d = await api('GET', '/orca/terminals');
      S.terminals = d.terminals;
      const free = d.terminals.filter((t) => !t.boundTo);
      bindEl.textContent = '';
      const head = document.createElement('div'); head.className = 'pine-bind-head'; head.textContent = free.length ? 'BIND AN ORCA TERMINAL' : 'every Orca terminal is already bound';
      bindEl.appendChild(head);
      for (const t of free) {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'pine-bind-row';
        b.textContent = `${t.title || t.handle}  ·  ${String(t.worktreePath || '').split('/').slice(-2).join('/')}`;
        b.addEventListener('click', async () => {
          try {
            const label = String(t.title || 'agent').replace(/\s+-\s+.*$/, '').slice(0, 48) || 'agent';
            const r = await api('POST', '/workspaces', { label, orcaHandle: t.handle, orcaTitle: t.title });
            bindEl.hidden = true;
            await refreshList();
            sys(`bound ${r.agentId} → ${t.handle} (its CLI token: ${r.tokenFile})`);
            await switchTo(r.agentId);
          } catch (e) { sys(`bind refused: ${e.code} — ${e.message}`); }
        });
        bindEl.appendChild(b);
      }
    } catch (e) { bindEl.textContent = `ORCA: ${e.code} — ${e.message}`; }
  }
  async function unbind(w) {
    // the confirm is the × button's own armed second click (the workspace is deleted; the Orca terminal is untouched)
    try {
      await api('DELETE', `/workspaces/${w.agentId}`);
      if (S.active === w.agentId) { S.dirty = false; await load(OPERATOR); }
      await refreshList();
    } catch (e) { sys(`unbind refused: ${e.code} — ${e.message}`); }
  }

  // ── the workspace swap ──
  async function refreshList() {
    const d = await api('GET', '/workspaces');
    S.workspaces = d.workspaces;
    renderCards();
    return S.workspaces;
  }
  async function saveNow() {
    if (S.saveTimer) { clearTimeout(S.saveTimer); S.saveTimer = null; }
    if (!S.dirty || !S.active) return true;
    const agent = S.active;
    const patch = ide.exportWorkspace();
    S.dirty = false;
    try {
      const r = await api('PATCH', `/workspaces/${agent}/state`, { patch, baseRev: S.rev, origin: 'face' });
      if (S.active === agent) S.rev = r.rev;
      return true;
    } catch (e) {
      if (e.code === 'REV_CONFLICT') {
        sys('the agent changed this workspace while you edited — its version is loaded; your edit is logged below');
        try { await api('POST', `/workspaces/${agent}/events`, { kind: 'system', text: 'operator edit superseded by an agent write', payload: { lostSource: archiveTabs(patch.tabs) } }); } catch { /* the log is best effort */ }
        if (S.active === agent) await load(agent);
      } else { S.dirty = true; sys(`save failed: ${e.code} — ${e.message}`); }
      return false;
    }
  }
  function markDirty() {
    if (S.importing || !S.active) return;
    S.dirty = true;
    if (S.saveTimer) clearTimeout(S.saveTimer);
    S.saveTimer = setTimeout(() => { S.saveTimer = null; void saveNow(); }, SAVE_DEBOUNCE_MS);
  }
  async function load(agentId) {
    const d = await api('GET', `/workspaces/${agentId}`);
    // the face moves to the agent only once its code + chart HAVE swapped; a failed import restores the
    // previous workspace's panels and the face stays where it was
    S.importing = true;
    try { await ide.importWorkspace(d.state || {}, d); }
    catch (e) {
      if (S.row) { try { await ide.importWorkspace(S.row.state || {}, S.row); } catch (x) { /* named by the throw below */ } }
      throw e;
    } finally { S.importing = false; }
    S.active = agentId; S.row = d; S.rev = d.rev; S.unread[agentId] = 0; S.lastEventId = 0; S.dirty = false;
    storage.setItem('plutus.face.active', agentId);
    renderEvents(d.events);
    if (sub) sub.textContent = d.orcaHandle ? `${d.label} · ${d.orcaTitle || d.orcaHandle}` : `${d.agentId === OPERATOR ? 'OPERATOR' : d.label} · local workspace (no terminal)`;
    renderCards();
    lastScreenReset();
    applyView();
    if (S.queue.some((c) => c.agentId === agentId)) setTimeout(() => { void drain(); }, 0); // FOLLOW off: its queued commands run when its card opens
    return d;
  }
  /** Click a card: save the current workspace, then swap the code + chart panels to this agent's. */
  async function switchTo(agentId) {
    if (S.switching) await S.switching.catch(() => {}); // a PREVIOUS switch's failure is its own — it never blocks this one
    if (agentId === S.active) return S.row;
    const mine = (async () => { await saveNow(); return load(agentId); })();
    S.switching = mine;
    try { return await mine; } catch (e) { sys(`switch to ${agentId} failed: ${e.code} — ${e.message}`); return null; } finally { if (S.switching === mine) S.switching = null; }
  }

  // ── the terminal mirror ──
  function lastScreenReset() { S.lastScreen = ''; S.screenErr = null; if (termEl) termEl.textContent = ''; }
  function visible() { return !document.hidden && root.offsetParent !== null; }
  async function pollScreen() {
    if (S.view !== 'terminal' || S.screenInflight || !visible()) return;
    const h = S.row && S.row.orcaHandle;
    if (!h) {
      if (termEl && !S.lastScreen) termEl.textContent = S.active === OPERATOR
        ? 'OPERATOR — your own workspace has no Orca terminal.\n\nBind an agent (+ BIND) to mirror its terminal here, or switch to LOG.'
        : 'this workspace is not bound to an Orca terminal.';
      S.lastScreen = 'x';
      return;
    }
    S.screenInflight = true;
    try {
      const d = await api('GET', `/orca/terminals/${encodeURIComponent(h)}/screen`);
      const text = (d.lines || []).join('\n');
      if (text !== S.lastScreen && termEl) {
        const atBottom = termEl.scrollHeight - termEl.scrollTop - termEl.clientHeight < 24;
        termEl.textContent = text; S.lastScreen = text;
        if (atBottom) termEl.scrollTop = termEl.scrollHeight;
      }
      S.screenErr = null;
    } catch (e) {
      const m = `ORCA ${e.code}: ${e.message}`;
      if (m !== S.screenErr && termEl) { termEl.textContent = m + (S.lastScreen && S.lastScreen !== 'x' ? '\n\n— last screen —\n' + S.lastScreen : ''); S.screenErr = m; }
    } finally { S.screenInflight = false; }
  }
  function applyView() {
    root.dataset.faceView = S.view;
    for (const b of root.querySelectorAll('[data-act="face-view"]')) b.classList.toggle('is-active', b.dataset.view === S.view);
    if (termEl) termEl.hidden = S.view !== 'terminal';
    if (logEl) logEl.hidden = S.view !== 'log';
    if (input) input.placeholder = S.view === 'terminal'
      ? (S.row && S.row.orcaHandle ? `type into ${S.row.label}'s terminal · Enter sends` : 'no terminal — switch to LOG to leave a note')
      : `a note in ${S.row ? S.row.label : 'the'} workspace log`;
    const fl = $('[data-act="face-follow"]'); if (fl) fl.checked = S.follow;
    if (S.view === 'terminal') void pollScreen();
  }
  S.screenTimer = setInterval(() => { void pollScreen(); }, SCREEN_POLL_MS);
  S.statusTimer = setInterval(async () => {
    if (!visible()) return;
    try { S.terminals = (await api('GET', '/orca/terminals')).terminals; renderCards(); } catch { /* the dots keep their last state */ }
  }, STATUS_POLL_MS);

  // ── the input: TERMINAL → the agent's Orca terminal · LOG → a note event ──
  async function submit(text) {
    const raw = text !== undefined && text !== null ? text : (input ? input.value : '');
    const rawText = String(raw === undefined || raw === null ? '' : raw);
    // the TERMINAL gets the text exactly as typed (whitespace is meaningful there); a LOG note is trimmed
    const t = S.view === 'terminal' ? rawText : rawText.trim();
    if (!t.length) return { ok: false, code: 'EMPTY' };
    const cap = S.view === 'terminal' ? 4000 : 8000; // the server's own limits, checked before a round-trip
    if (t.length > cap) { sys(`too long: ${t.length} chars (the ${S.view} limit is ${cap}) — not sent`); return { ok: false, code: 'TEXT_TOO_LONG' }; }
    if (input) input.value = '';
    const restore = () => { if (input && !input.value) input.value = rawText; }; // a failed send never eats the text
    try {
      if (S.view === 'terminal') {
        const h = S.row && S.row.orcaHandle;
        if (!h) { restore(); sys('no terminal bound — the text was not sent (switch to LOG for a note)'); return { ok: false, code: 'NO_TERMINAL' }; }
        await api('POST', `/orca/terminals/${encodeURIComponent(h)}/send`, { text: t, enter: true });
        setTimeout(() => { void pollScreen(); }, 250);
        return { ok: true, sent: 'terminal' };
      }
      if (!S.active) { restore(); sys('no workspace is open yet — the note was not saved'); return { ok: false, code: 'NO_WORKSPACE' }; }
      await api('POST', `/workspaces/${S.active}/events`, { kind: 'note', text: t });
      return { ok: true, sent: 'log' };
    } catch (e) { restore(); sys(`send refused: ${e.code} — ${e.message}`); return { ok: false, code: e.code }; }
  }

  // ── the command queue (agents' run / gate / capture, executed on this chart) ──
  function enqueue(cmd) {
    if (!cmd || typeof cmd.id !== 'string' || !cmd.id) return; // an id-less command can neither be deduped nor answered
    if (!S.queue.some((c) => c.id === cmd.id)) S.queue.push({ ...cmd, at: cmd.at || Date.now() });
    void drain();
  }
  async function drain() {
    if (S.busy) return;
    S.busy = true;
    try {
      for (;;) {
        // FOLLOW on: the oldest command wins (open its workspace). FOLLOW off: only the ACTIVE
        // workspace's commands run; the others wait (their cards show the count) until opened.
        const idx = S.follow ? (S.queue.length ? 0 : -1) : S.queue.findIndex((c) => c.agentId === S.active);
        if (idx < 0) {
          for (const c of S.queue) if (!c.flagged) { c.flagged = true; S.unread[c.agentId] = (S.unread[c.agentId] || 0) + 1; }
          if (S.queue.length) renderCards();
          break;
        }
        const cmd = S.queue[idx];
        // a command queued too long ago runs on nothing current — it is answered EXPIRED, never run late
        if (cmd.at && Date.now() - cmd.at > COMMAND_MAX_AGE_MS) { S.queue.splice(idx, 1); await finish(cmd, false, { code: 'COMMAND_EXPIRED' }, 'waited past 10 min'); continue; }
        if (cmd.agentId !== S.active) {
          await switchTo(cmd.agentId);
          if (S.active !== cmd.agentId) { S.queue.splice(S.queue.indexOf(cmd), 1); await finish(cmd, false, { code: 'SWITCH_FAILED' }, 'could not open the workspace'); continue; }
        }
        S.queue.splice(S.queue.indexOf(cmd), 1);
        let out;
        try { out = await ide.runCommand(cmd); } catch (e) { out = { ok: false, result: { code: e.code || 'COMMAND_FAILED', error: e.message }, summary: e.message }; }
        await finish(cmd, !!out.ok, out.result, out.summary);
        if (out.ok && (cmd.cmd === 'load' || cmd.cmd === 'run')) { S.dirty = true; await saveNow(); } // a GOOD market / frame is part of the workspace; a failed one never persists
      }
    } finally { S.busy = false; }
  }
  async function finish(cmd, ok, result, summary) {
    try { await api('POST', `/workspaces/${cmd.agentId}/commands/${cmd.id}/result`, { ok, result, summary }); }
    catch (e) { sys(`command ${cmd.id} result not recorded: ${e.code}`); }
  }

  // ── the socket (:9431, channel 'agents') ──
  function connect() {
    if (S.ws) { try { S.ws.close(); } catch { /* gone */ } }
    try { S.ws = new WebSocket(`${wsUrl}${wsUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`); } catch (e) { if (sub) sub.textContent = `socket offline (${e.message})`; return; }
    S.ws.onopen = () => { S.connected = true; S.tries = 0; try { S.ws.send(JSON.stringify({ type: 'SUBSCRIBE', channels: ['agents', 'loops', 'vil'] })); } catch { /* best effort */ } };
    S.ws.onmessage = (ev) => {
      let m; try { m = JSON.parse(ev.data); } catch { return; }
      if (onWsMessage) { try { onWsMessage(m); } catch { /* the host's */ } }
      const d = m.data || m.payload || m; // websocket.js broadcast() flattens the payload: {type, ...data}
      switch (m.type) {
        case 'WORKSPACE_EVENT':
          if (d.agentId === S.active) { if (d.id > S.lastEventId) { logLine(eventKind(d), `${d.kind === 'note' || d.kind === 'say' ? '' : d.kind + ' · '}${d.text || ''}`, d.at, d.by); S.lastEventId = d.id; } }
          else { S.unread[d.agentId] = (S.unread[d.agentId] || 0) + 1; renderCards(); }
          break;
        case 'WORKSPACE_UPDATED':
          if (d.agentId === S.active && !(d.origin === 'face' && String(d.by).startsWith('operator'))) {
            if (d.rev > S.rev) {
              const hadEdits = S.dirty;
              // the operator's unsaved text is ARCHIVED to the log before the agent's version replaces it
              if (hadEdits) {
                const lost = archiveTabs(ide.exportWorkspace().tabs);
                api('POST', `/workspaces/${S.active}/events`, { kind: 'system', text: 'operator edit superseded by an agent push — archived here', payload: { lostSource: lost } }).catch(() => { /* the log is best effort */ });
              }
              // dirty is cleared ONLY once the agent's version is actually loaded; a failed reload keeps the edits
              // through the SAME serialization as a card click (never two loads/saves interleaved)
              const agent = S.active;
              const reload = (S.switching ? S.switching.catch(() => {}) : Promise.resolve()).then(() => (S.active === agent ? load(agent) : null));
              S.switching = reload.finally(() => { if (S.switching === reload) S.switching = null; });
              reload.then(() => { if (hadEdits) sys('the agent pushed while you had unsaved edits — the agent\'s version is loaded'); })
                .catch((e) => { sys(`reload after the agent's push failed: ${e.code || ''} ${e.message} — your edits are kept`); });
            }
          }
          break;
        case 'WORKSPACE_COMMAND': enqueue(d); break;
        case 'WORKSPACE_REGISTERED': case 'WORKSPACE_REMOVED': void refreshList(); break;
        default: break;
      }
    };
    S.ws.onclose = () => { S.connected = false; if (S.tries++ < 20) setTimeout(connect, Math.min(15000, 800 * S.tries)); };
  }

  // ── wiring ──
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    if (b.dataset.act === 'face-view') { S.view = b.dataset.view; storage.setItem('plutus.face.view', S.view); applyView(); }
    else if (b.dataset.act === 'chat-send') void submit();
  });
  root.addEventListener('change', (e) => {
    const el = e.target.closest('[data-act="face-follow"]');
    if (el) { S.follow = !!el.checked; storage.setItem('plutus.face.follow', S.follow ? 'on' : 'off'); if (S.follow) void drain(); }
  });
  if (input) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); void submit(); } });
  // an unload cannot await a fetch: the pending edit leaves with sendBeacon-free keepalive fetch
  window.addEventListener('beforeunload', () => {
    if (!S.dirty || !S.active) return;
    try {
      fetch(`${apiBase}/api/v1/workspaces/${S.active}/state`, { method: 'PATCH', keepalive: true, headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ patch: ide.exportWorkspace(), baseRev: S.rev, origin: 'face' }) });
    } catch { /* the page is going away */ }
  });

  async function boot() {
    try {
      let list = await refreshList();
      if (!list.some((w) => w.agentId === OPERATOR)) { await api('POST', '/workspaces', { label: 'operator' }); list = await refreshList(); }
      try { S.terminals = (await api('GET', '/orca/terminals')).terminals; } catch (e) { sys(`Orca bridge: ${e.code} — ${e.message}`); }
      const want = storage.getItem('plutus.face.active');
      await load(list.some((w) => w.agentId === want) ? want : OPERATOR);
      connect();
      const pend = (await api('GET', '/commands/pending')).commands;
      document.dispatchEvent(new CustomEvent('plutus-face-queue-read', { detail: { pending: pend.length } })); // the rail badge may clear now
      for (const c of pend) {
        const cmd = { id: c.id, agentId: c.agent_id, cmd: c.cmd, args: c.args, by: c.by };
        if (Date.now() - c.created_at > COMMAND_MAX_AGE_MS) await finish(cmd, false, { code: 'COMMAND_EXPIRED' }, 'queued while the dashboard was closed');
        else enqueue({ ...cmd, at: c.created_at });
      }
      return true;
    } catch (e) {
      sys(`AGENT WORKSPACES DOWN — ${e.code}: ${e.message}`);
      if (sub) sub.textContent = 'workspaces offline';
      return false;
    }
  }

  return {
    version: FACE_VERSION, boot, switchTo, submit, markDirty, saveNow, refreshList, enqueue,
    state: () => ({ active: S.active, rev: S.rev, dirty: S.dirty, view: S.view, follow: S.follow, agents: S.workspaces.map((w) => w.agentId), queue: S.queue.length, connected: S.connected, terminal: S.row ? S.row.orcaHandle : null, screenError: S.screenErr }),
    // the old chat surface (pine-ide state() + e2e probes read these)
    line: (kind, text) => logLine(kind, text), seen: () => S.seen.slice(), isConnected: () => S.connected,
    destroy() {
      clearInterval(S.screenTimer); clearInterval(S.statusTimer);
      if (S.saveTimer) { clearTimeout(S.saveTimer); S.saveTimer = null; }
      if (S.dirty) void saveNow(); // an SPA unmount never fires beforeunload: the pending edit is flushed here
      try { S.ws && S.ws.close(); } catch { /* gone */ }
    },
  };
}
