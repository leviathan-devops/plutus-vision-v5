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
export const FACE_VERSION = '2.0.0';
const OPERATOR = 'operator';
const SAVE_DEBOUNCE_MS = 1500;
const FIT_POLL_MS = 1000;
const STATUS_POLL_MS = 10000;
const COMMAND_MAX_AGE_MS = 10 * 60 * 1000;
const TERM_DEFAULT_COLS = 120, TERM_DEFAULT_ROWS = 32;

/**
 * createAnsiScreen — the display half of a real terminal: a cols×rows character grid driven by the
 * pty's OWN byte stream. The old TERMINAL panel painted a polled text snapshot; a real session
 * (tmux attached through `script`) emits a full-screen ANSI stream — cursor addressing, erase-in-line
 * (`ESC[K`), erase-chars (`ESC[50X`), the alternate screen (`ESC[?1049h`) — and stripping it produces
 * the garbled misalignment that makes a "terminal" look theatrical. This is the smallest model that
 * renders that stream faithfully: cursor motion, erase, insert/delete line, scroll with scrollback,
 * the alternate screen, and CR/LF/BS/TAB.
 *
 * COLOUR (2026-10-02, the operator: "fix the color scheme of the terminal so its a normal terminal and not
 * taking the dashboard ui onto it"). SGR used to be parsed and DROPPED, so every program - omp's tui, tmux's
 * status bar, `ls --color` - was painted in the dashboard's one ink. Every cell now carries the attribute
 * the program set (16 / 256 / truecolor, bold, dim, italic, underline, inverse), and an erase paints the
 * CURRENT background (bce - how tmux fills its status line). render() is unchanged (plain text, the
 * cursor index); renderRuns() is the coloured view the face paints.
 * Returns { write, resize, render, renderRuns, size }.
 */
export const TERM_FG = '#D0D0D0';
export const TERM_BG = '#0C0C0C';
/** a normal terminal's 16 colours (not the dashboard's ink) */
export const TERM_PALETTE = Object.freeze([
  '#0C0C0C', '#E05252', '#4EC24E', '#D9B43A', '#4A8FE0', '#B65CC8', '#3CB8B8', '#C8C8C8',
  '#6A6A6A', '#FF6B6B', '#6BE86B', '#E8C84A', '#6BAEF0', '#D07BE0', '#5FD6D6', '#F0F0F0',
]);
const CUBE = [0, 95, 135, 175, 215, 255];
const hex2 = (v) => v.toString(16).padStart(2, '0');
/** a colour index (0-255) or '#rrggbb' → css */
export function termColor(c) {
  if (typeof c === 'string') return c;
  if (c < 16) return TERM_PALETTE[c];
  if (c < 232) { const n = c - 16; return '#' + hex2(CUBE[Math.floor(n / 36)]) + hex2(CUBE[Math.floor(n / 6) % 6]) + hex2(CUBE[n % 6]); }
  const v = 8 + (c - 232) * 10; return '#' + hex2(v) + hex2(v) + hex2(v);
}
/** the default attribute: no colour of its own, so the panel's normal fg/bg show through */
export const TERM_A0 = Object.freeze({ fg: null, bg: null, b: 0, d: 0, i: 0, u: 0, v: 0, key: '' });
/** an attribute → inline css ('' for the default) */
export function termStyle(a) {
  if (!a || a === TERM_A0) return '';
  let fg = a.fg === null ? null : termColor(a.fg), bg = a.bg === null ? null : termColor(a.bg);
  if (a.v) { const f = fg; fg = bg === null ? TERM_BG : bg; bg = f === null ? TERM_FG : f; }
  let css = '';
  if (fg !== null) css += 'color:' + fg + ';';
  if (bg !== null) css += 'background:' + bg + ';';
  if (a.b) css += 'font-weight:700;';
  if (a.d) css += 'opacity:.62;';
  if (a.i) css += 'font-style:italic;';
  if (a.u) css += 'text-decoration:underline;';
  return css;
}

const termEsc = (t) => t.replace(/[&<>]/g, (c) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;'));
/** runs → markup: default cells are bare text, coloured ones a span with the program's own style */
export function termRunsHtml(runs) {
  let h = '';
  for (const r of runs) { const st = termStyle(r.a); h += st ? `<span style="${st}">${termEsc(r.t)}</span>` : termEsc(r.t); }
  return h;
}
/** the cursor's line: a normal block cursor ON the grid cell - the cell's own colours inverted */
export function termCursorHtml(runs, col) {
  const cells = [];
  for (const r of runs) for (const ch of r.t) cells.push({ ch, a: r.a });
  while (cells.length <= col) cells.push({ ch: ' ', a: TERM_A0 });
  const at = cells[col];
  const fg = at.a.fg === null ? TERM_FG : termColor(at.a.fg), bg = at.a.bg === null ? TERM_BG : termColor(at.a.bg);
  const before = [], after = [];
  for (let i = 0; i < cells.length; i++) { if (i < col) before.push(cells[i]); else if (i > col) after.push(cells[i]); }
  const back = (list) => { const out = []; for (const c of list) { const l = out[out.length - 1]; if (l && l.a === c.a) l.t += c.ch; else out.push({ t: c.ch, a: c.a }); } return out; };
  return termRunsHtml(back(before)) + `<span class="pine-term-cur" style="background:${at.a.v ? bg : fg};color:${at.a.v ? fg : bg}">${termEsc(at.ch)}</span>` + termRunsHtml(back(after));
}

export function createAnsiScreen(cols = TERM_DEFAULT_COLS, rows = TERM_DEFAULT_ROWS, scrollbackMax = 4000) {
  let C = Math.max(2, cols | 0), R = Math.max(2, rows | 0);
  let grid = [], mainGrid = null, saved = null, pending = '';
  let cx = 0, cy = 0, cursorVisible = true;
  let scrollback = [], scrolled = false, gen = 0;
  // the attribute the program set (SGR) and the one an erase paints with (only its background - bce)
  const cache = new Map();
  let cur = TERM_A0, eraseA = TERM_A0;
  function mkAttr(o) {
    const key = (o.fg ?? '') + '|' + (o.bg ?? '') + '|' + (o.b ? 1 : 0) + (o.d ? 1 : 0) + (o.i ? 1 : 0) + (o.u ? 1 : 0) + (o.v ? 1 : 0);
    if (key === '||00000') return TERM_A0;
    let a = cache.get(key);
    if (!a) {
      if (cache.size > 4096) cache.clear();               // a truecolor storm cannot grow this without bound
      a = Object.freeze({ fg: o.fg ?? null, bg: o.bg ?? null, b: o.b ? 1 : 0, d: o.d ? 1 : 0, i: o.i ? 1 : 0, u: o.u ? 1 : 0, v: o.v ? 1 : 0, key });
      cache.set(key, a);
    }
    return a;
  }
  const blank = (a = TERM_A0) => ({ c: new Array(C).fill(' '), a: new Array(C).fill(a) });
  const newGrid = () => { const g = []; for (let i = 0; i < R; i++) g.push(blank()); return g; };
  grid = newGrid();
  /** a row as it goes into the scrollback: cut after the last cell that shows anything */
  function keep(row) {
    let n = row.c.length;
    while (n > 0 && row.c[n - 1] === ' ' && row.a[n - 1].bg === null && !row.a[n - 1].v) n--;
    return { c: row.c.slice(0, n), a: row.a.slice(0, n) };
  }

  function scrollUp() {
    const top = grid.shift();
    scrollback.push(keep(top));
    if (scrollback.length > scrollbackMax) scrollback.splice(0, scrollback.length - scrollbackMax);
    grid.push(blank(eraseA));
  }
  function scrollDown() { scrollback.pop(); grid.pop(); grid.unshift(blank(eraseA)); }
  function lineFeed() { cy++; if (cy >= R) { cy = R - 1; scrollUp(); scrolled = true; } }
  function put(ch) {
    if (cx >= C) { cx = 0; lineFeed(); }
    grid[cy].c[cx] = ch; grid[cy].a[cx] = cur; cx++;
  }
  function clear(row, from, to) { for (let x = from; x < to; x++) { row.c[x] = ' '; row.a[x] = eraseA; } }
  function eraseLine(mode) {
    const row = grid[cy]; if (!row) return;
    if (mode === 2 || mode === 1) clear(row, 0, C);
    else clear(row, cx, C);
    if (mode === 1) clear(row, 0, cx);
  }
  function eraseDisplay(mode) {
    if (mode === 2 || mode === 3) { for (let y = 0; y < R; y++) grid[y] = blank(eraseA); if (mode === 3) scrollback = []; }
    else if (mode === 1) { for (let y = 0; y < cy; y++) grid[y] = blank(eraseA); eraseLine(1); }
    else { eraseLine(0); for (let y = cy + 1; y < R; y++) grid[y] = blank(eraseA); }
  }
  function insertLines(n) { for (let i = 0; i < n; i++) { grid.splice(cy, 0, blank(eraseA)); grid.pop(); } }
  function deleteLines(n) { for (let i = 0; i < n; i++) { grid.splice(cy, 1); grid.push(blank(eraseA)); } }

  const num = (v, d) => { const n = parseInt(v, 10); return Number.isFinite(n) && n > 0 ? n : d; };

  /** a 38/48 extended colour from its sub-parameters: ['5', n] or ['2', (cs,) r, g, b] */
  function ext(sp) {
    const m = parseInt(sp[0], 10);
    if (m === 5) { const n = parseInt(sp[1], 10); return Number.isFinite(n) ? Math.max(0, Math.min(255, n)) : null; }
    if (m === 2) {
      const v = sp.slice(1).filter((x) => x !== '');
      const [r, g, b] = (v.length >= 4 ? v.slice(v.length - 3) : v).map((x) => Math.max(0, Math.min(255, parseInt(x, 10) || 0)));
      return v.length >= 3 ? '#' + hex2(r) + hex2(g) + hex2(b) : null;
    }
    return null;
  }
  /** SGR: the program's colours and styles */
  function sgr(raw) {
    const toks = raw === '' ? ['0'] : raw.split(';');
    const o = { fg: cur.fg, bg: cur.bg, b: cur.b, d: cur.d, i: cur.i, u: cur.u, v: cur.v };
    for (let k = 0; k < toks.length; k++) {
      const t = toks[k];
      if (t.includes(':')) {                         // ITU colon form: 38:2::r:g:b · 38:5:n · 4:3
        const sp = t.split(':'), n = parseInt(sp[0], 10);
        if (n === 38) o.fg = ext(sp.slice(1)); else if (n === 48) o.bg = ext(sp.slice(1)); else if (n === 4) o.u = (parseInt(sp[1], 10) || 0) ? 1 : 0;
        continue;
      }
      const n = t === '' ? 0 : parseInt(t, 10);
      if (!Number.isFinite(n)) continue;
      if (n === 0) { o.fg = null; o.bg = null; o.b = 0; o.d = 0; o.i = 0; o.u = 0; o.v = 0; }
      else if (n === 1) o.b = 1; else if (n === 2) o.d = 1; else if (n === 3) o.i = 1; else if (n === 4) o.u = 1; else if (n === 7) o.v = 1;
      else if (n === 22) { o.b = 0; o.d = 0; } else if (n === 23) o.i = 0; else if (n === 24) o.u = 0; else if (n === 27) o.v = 0;
      else if (n >= 30 && n <= 37) o.fg = n - 30; else if (n === 39) o.fg = null;
      else if (n >= 40 && n <= 47) o.bg = n - 40; else if (n === 49) o.bg = null;
      else if (n >= 90 && n <= 97) o.fg = n - 90 + 8; else if (n >= 100 && n <= 107) o.bg = n - 100 + 8;
      else if (n === 38 || n === 48) {
        const m = parseInt(toks[k + 1], 10);
        let col = null;
        if (m === 5) { col = ext(['5', toks[k + 2]]); k += 2; }
        else if (m === 2) { col = ext(['2', toks[k + 2], toks[k + 3], toks[k + 4]]); k += 4; }
        else k += 1;
        if (n === 38) o.fg = col; else o.bg = col;
      }
    }
    cur = mkAttr(o);
    eraseA = cur.bg === null ? TERM_A0 : mkAttr({ bg: cur.bg });
  }

  function csi(paramsRaw, inter, final) {
    const priv = paramsRaw[0] === '?' || paramsRaw[0] === '>' || paramsRaw[0] === '=';
    const body = priv || paramsRaw[0] === '<' ? paramsRaw.slice(1) : paramsRaw;
    if (!priv && !inter && final === 'm') { sgr(body); return; }
    const ps = body.split(';');
    const p = (i, d) => num(ps[i], d);
    if (priv) {                                    // private modes: only the alternate screen matters
      const set = final === 'h', mode = parseInt(ps[0], 10);
      if (mode === 1049 || mode === 47 || mode === 1047) {
        if (set) { mainGrid = grid; grid = newGrid(); scrollback = []; cx = 0; cy = 0; }
        else if (mainGrid) { grid = mainGrid; mainGrid = null; cx = 0; cy = 0; }
      } else if (mode === 25) cursorVisible = set;
      return;
    }
    switch (final) {
      case 'A': cy = Math.max(0, cy - p(0, 1)); break;
      case 'B': cy = Math.min(R - 1, cy + p(0, 1)); break;
      case 'C': cx = Math.min(C - 1, cx + p(0, 1)); break;
      case 'D': cx = Math.max(0, cx - p(0, 1)); break;
      case 'E': cy = Math.min(R - 1, cy + p(0, 1)); cx = 0; break;
      case 'F': cy = Math.max(0, cy - p(0, 1)); cx = 0; break;
      case 'G': case '`': cx = Math.min(C - 1, Math.max(0, p(0, 1) - 1)); break;
      case 'd': cy = Math.min(R - 1, Math.max(0, p(0, 1) - 1)); break;
      case 'H': case 'f': cy = Math.min(R - 1, Math.max(0, p(0, 1) - 1)); cx = Math.min(C - 1, Math.max(0, p(1, 1) - 1)); break;
      case 'J': eraseDisplay(num(ps[0], 0)); break;
      case 'K': eraseLine(num(ps[0], 0)); break;
      case 'L': insertLines(p(0, 1)); break;
      case 'M': deleteLines(p(0, 1)); break;
      case 'P': { const row = grid[cy], n = p(0, 1); for (let i = 0; i < n; i++) { row.c.splice(cx, 1); row.c.push(' '); row.a.splice(cx, 1); row.a.push(eraseA); } break; }
      case 'X': { const row = grid[cy], n = p(0, 1); for (let i = 0; i < n && cx + i < C; i++) { row.c[cx + i] = ' '; row.a[cx + i] = eraseA; } break; }
      case '@': { const row = grid[cy], n = p(0, 1); for (let i = 0; i < n; i++) { row.c.splice(cx, 0, ' '); row.c.pop(); row.a.splice(cx, 0, eraseA); row.a.pop(); } break; }
      case 'S': for (let i = 0; i < p(0, 1); i++) scrollUp(); break;
      case 'T': for (let i = 0; i < p(0, 1); i++) scrollDown(); break;
      case 's': saved = { cx, cy }; break;
      case 'u': if (saved) { cx = saved.cx; cy = saved.cy; } break;
      default: break;                              // r (region) · q · t · h/l · c — parsed, no effect on this grid
    }
  }

  /** consume a stream chunk; an incomplete escape at the tail is HELD until the next chunk */
  function write(chunk) {
    const s = (pending + String(chunk == null ? '' : chunk)).replace(/\u009b/g, '\u001b['); // 8-bit CSI → ESC [
    pending = '';
    gen++;
    let i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (ch === '\u001b') {
        const nxt = s[i + 1];
        if (nxt === undefined) { pending = s.slice(i); break; }
        if (nxt === '[') {
          let j = i + 2, params = '', inter = '';
          while (j < s.length && /[0-9;:?<>=!]/.test(s[j])) { params += s[j]; j++; }
          while (j < s.length && s[j] >= ' ' && s[j] <= '/') { inter += s[j]; j++; }
          if (j >= s.length) { pending = s.slice(i); break; }        // the final byte has not arrived
          if (!(s[j] >= '@' && s[j] <= '~')) {
            // a byte that cannot END a CSI (measured: `ESC[38;2;999;-1m` took '1' as the final byte and printed
            // 'm2' as text) - the sequence is malformed: swallow it to its real final byte, print nothing of it
            while (j < s.length && !(s[j] >= '@' && s[j] <= '~')) j++;
            if (j >= s.length) { pending = s.slice(i); break; }
            i = j + 1; continue;
          }
          csi(params, inter, s[j]); i = j + 1; continue;
        }
        if (nxt === ']' || nxt === 'P' || nxt === '^' || nxt === '_') { // OSC / DCS / PM / APC — to BEL or ST
          let j = i + 2;
          while (j < s.length && !(s[j] === '\u0007' || (s[j] === '\u001b' && s[j + 1] === '\\'))) j++;
          if (j >= s.length) { pending = s.slice(i); break; }
          i = s[j] === '\u0007' ? j + 1 : Math.min(s.length, j + 2); continue;
        }
        if (nxt === '(' || nxt === ')' || nxt === '*' || nxt === '+') {  // charset designation: 3 bytes
          if (i + 2 >= s.length) { pending = s.slice(i); break; }
          i += 3; continue;
        }
        if (nxt === '7') { saved = { cx, cy }; i += 2; continue; }
        if (nxt === '8') { if (saved) { cx = saved.cx; cy = saved.cy; } i += 2; continue; }
        if (nxt === 'c') { cur = TERM_A0; eraseA = TERM_A0; }                 // RIS: the attributes reset too
        i += 2; continue;                                                // ESC = · ESC > · ESC M/E/D/c …
      }
      if (ch === '\n') { lineFeed(); i++; continue; }
      if (ch === '\r') { cx = 0; i++; continue; }
      if (ch === '\b') { cx = Math.max(0, cx - 1); i++; continue; }
      if (ch === '\t') { cx = Math.min(C - 1, (Math.floor(cx / 8) + 1) * 8); i++; continue; }
      if (ch === '\u0007' || ch === '\u000e' || ch === '\u000f' || ch === '\u0000') { i++; continue; }
      if (ch < ' ') { i++; continue; }                // any other control byte: consumed, no cell written
      put(ch); i++;
    }
    if (pending.length > 2048) pending = '';               // an escape that never ends is dropped, never held forever
    return { pending: pending.length };
  }

  function resize(nc, nr) {
    const c = Math.max(2, nc | 0), r = Math.max(2, nr | 0);
    if (c === C && r === R) return { cols: C, rows: R };
    const g = [];
    for (let y = 0; y < r; y++) {
      const row = { c: new Array(c).fill(' '), a: new Array(c).fill(TERM_A0) };
      if (y < R && grid[y]) for (let x = 0; x < Math.min(c, C); x++) { row.c[x] = grid[y].c[x]; row.a[x] = grid[y].a[x]; }
      g.push(row);
    }
    grid = g; C = c; R = r;
    cx = Math.min(cx, C - 1); cy = Math.min(cy, R - 1);
    gen++;
    return { cols: C, rows: R };
  }

  /** the rendered view: scrollback + the grid, and where the cursor sits INSIDE that string */
  function render() {
    const sb = scrollback.map((row) => row.c.join('').replace(/\s+$/, ''));
    const gl = grid.map((row) => row.c.join('').replace(/\s+$/, ''));
    const lines = sb.concat(gl);
    let idx = 0;
    for (let i = 0; i < sb.length + cy && i < lines.length; i++) idx += lines[i].length + 1;
    const line = lines[sb.length + cy] || '';
    const col = Math.min(cx, line.length);
    return { text: lines.join('\n'), cursor: { line: sb.length + cy, col, index: idx + col, visible: cursorVisible }, cols: C, rows: R, scrollback: sb.length };
  }

  /** the COLOURED view: every line as runs of { t, a } (a = the attribute the program set). Scrollback rows
   *  are returned as the same objects every time (they never change once stored), so a painter can cache
   *  each one's markup. The cursor is a grid cell (line, col) - col may sit past the line's last run. */
  function renderRuns() {
    const toRuns = (row, n) => {
      const out = [];
      for (let x = 0; x < n; x++) {
        const a = row.a[x], last = out[out.length - 1];
        if (last && last.a === a) last.t += row.c[x]; else out.push({ t: row.c[x], a });
      }
      return out;
    };
    const gridRows = grid.map((row) => { const k = keep(row); return toRuns(k, k.c.length); });
    return { scrollback, gridRows, toRuns, cursor: { line: scrollback.length + cy, row: cy, col: cx, visible: cursorVisible }, cols: C, rows: R, gen };
  }

  return { write, resize, render, renderRuns, size: () => ({ cols: C, rows: R, scrollback: scrollback.length }), gen: () => gen, wasScrolled: () => { const v = scrolled; scrolled = false; return v; } };
}

export function createAgentFace({ root, apiBase, wsUrl, token, ide, storage = window.localStorage, onWsMessage = null } = {}) {
  const $ = (sel) => root.querySelector(sel);
  const slot = (n) => $(`[data-slot="${n}"]`);
  const S = {
    active: null, rev: 0, row: null, dirty: false, saveTimer: null,
    view: storage.getItem('plutus.face.view') || 'terminal', follow: storage.getItem('plutus.face.follow') !== 'off',
    workspaces: [], terminals: [], unread: {}, lastEventId: 0,
    ws: null, connected: false, tries: 0, seen: [],
    queue: [], busy: false, importing: false,
    screenTimer: null,
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
        // was a native OS dialog that froze the whole dashboard until answered (measured 2026-10-01). The armed
        // state lives in S (renderCards rebuilds every card on each status poll / unread event - a DOM-held arm
        // was wiped before it could be confirmed); a confirm inside 400ms of arming is a double-click, ignored.
        const armed = S.unbindArm && S.unbindArm.id === w.agentId;
        if (armed) { x.dataset.armed = '1'; x.textContent = 'unbind?'; x.classList.add('armed'); }
        x.addEventListener('click', (e) => {
          e.stopPropagation();
          const a = S.unbindArm;
          if (!a || a.id !== w.agentId) {
            if (a) clearTimeout(a.timer);
            S.unbindArm = { id: w.agentId, at: Date.now(), timer: setTimeout(() => { S.unbindArm = null; renderCards(); }, 4000) };
            renderCards();
            return;
          }
          if (Date.now() - a.at < 400) return;
          clearTimeout(a.timer); S.unbindArm = null;
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
    // the terminal follows the ACTIVE workspace: one live pty at a time (openTerminal closes the previous)
    if (S.view === 'terminal' && T.id && T.id !== agentId) void closeTerminal().then(() => openTerminal());
    else applyView();
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

  // ═══════════════════════════════════════════════════════════════════════════════════════════════
  // THE LIVE TERMINAL (2026-10-01) — this panel used to POLL an Orca terminal's rendered screen and
  // paint it as text: read-only, no keystrokes, no session of its own. The operator: "the agents face
  // needs to be a legit functioning terminal not some theatrical bullshit … so i can literally open a
  // session right there in the pine IDE and code things."
  //
  // Now: ONE real pty per app (electron/terminal-bridge.js → a plutus-term-<workspace> tmux session
  // attached through `script`), reached over the app's own IPC surface via window.PlutusTerm
  // (renderer/tabs/_agent-desk.js is the adapter and the wiring sentinel). Keystrokes from THIS <pre>
  // go into that pty; the pty's own ANSI stream comes back and is drawn through createAnsiScreen.
  //
  // POLICY: one live pty at a time. Switching a workspace card closes the previous session; leaving
  // the tab does NOT (the session keeps running and its output keeps buffering in the main process —
  // read() replays it on re-attach), and every session dies with the app (bridge closeAll).
  // ═══════════════════════════════════════════════════════════════════════════════════════════════
  const T = { id: null, session: null, screen: null, error: null, opening: null, cols: 0, rows: 0, cell: null, lastText: null, lastCur: -1, unsub: [], exited: null, rowHtml: new WeakMap() };
  function termTransport() { return (typeof window !== 'undefined' && window.PlutusTerm && window.PlutusTerm.available()) ? window.PlutusTerm : null; }
  function visible() { return !document.hidden && root.offsetParent !== null; }

  /** the terminal view with the bridge absent: a LOUD, NAMED refusal — never a fake terminal */
  function refusalText() {
    const t = termTransport();
    if (!t) {
      const why = (window.PlutusTerm && window.PlutusTerm.missingReason && window.PlutusTerm.missingReason()) || 'window.PlutusTerm is absent (renderer/tabs/_agent-desk.js did not load)';
      return `TERMINAL BRIDGE NOT WIRED — this panel cannot open a session.\n${why}\n\nWhat has to be added (electron/terminal-bridge.js ships the module, and its header carries this same list):\n\n${(window.PlutusTerm && window.PlutusTerm.wiring) || ''}`;
    }
    if (!S.active) return 'no workspace is open yet — a terminal session is created per workspace.';
    if (T.error) return `${T.error}\n\nworkspace: ${S.active}${T.session ? ` · session ${T.session.name} (pid ${T.session.pid})` : ''}`;
    return 'opening the session…';
  }

  function paintTerminal() {
    if (!termEl || termEl.hidden) return;
    const t = termTransport();
    if (!t || !T.screen) {
      if (T.lastText !== 'REFUSAL') { termEl.textContent = refusalText(); T.lastText = 'REFUSAL'; T.lastCur = -1; }
      return;
    }
    // the program's OWN colours (SGR), drawn on a normal terminal palette - never the dashboard's ink
    const v = T.screen.renderRuns();
    const key = v.gen + ':' + v.cursor.line + ':' + v.cursor.col + ':' + v.cursor.visible;
    if (key === T.lastText) return;
    const atBottom = termEl.scrollHeight - termEl.scrollTop - termEl.clientHeight < 30;
    let html = '';
    for (const row of v.scrollback) {                       // stored rows never change: their markup is cached
      let h = T.rowHtml.get(row);
      if (h === undefined) { h = termRunsHtml(v.toRuns(row, row.c.length)); T.rowHtml.set(row, h); }
      html += h + '\n';
    }
    v.gridRows.forEach((runs, y) => { html += (y === v.cursor.row && v.cursor.visible ? termCursorHtml(runs, v.cursor.col) : termRunsHtml(runs)) + '\n'; });
    termEl.innerHTML = html;
    T.lastText = key; T.lastCur = v.cursor.line;
    if (atBottom || T.screen.wasScrolled()) termEl.scrollTop = termEl.scrollHeight;
  }

  /** the element's own grid, measured from the rendered font, so cols/rows match what tmux draws */
  function fitTerminal() {
    if (!termEl || termEl.hidden || !T.screen || !T.id) return;
    if (!T.cell) {
      const probe = document.createElement('span');
      probe.textContent = '0'.repeat(40);
      probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;left:-9999px';
      termEl.appendChild(probe);
      const w = probe.getBoundingClientRect().width / 40;
      const lh = parseFloat(window.getComputedStyle(termEl).lineHeight) || 14;
      probe.remove();
      if (!w || !Number.isFinite(w)) return;                    // the panel is not laid out yet
      T.cell = { w, h: lh };
    }
    const cs = window.getComputedStyle(termEl);
    const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    const padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    const cols = Math.max(20, Math.floor((termEl.clientWidth - padX) / T.cell.w));
    const rows = Math.max(5, Math.floor((termEl.clientHeight - padY) / T.cell.h));
    if (cols === T.cols && rows === T.rows) return;
    T.cols = cols; T.rows = rows;
    T.screen.resize(cols, rows);
    const t = termTransport();
    if (t && T.id) t.resize(T.id, cols, rows).catch((e) => { sys(`terminal resize refused: ${e.code || ''} ${e.message}`); });
    paintTerminal();
  }

  async function closeTerminal() {
    for (const u of T.unsub) { try { u(); } catch { /* gone */ } }
    T.unsub = [];
    const id = T.id, t = termTransport();
    T.id = null; T.session = null; T.screen = null; T.error = null; T.exited = null; T.lastText = null; T.lastCur = -1;
    if (id && t) { try { await t.close(id); } catch (e) { sys(`terminal close refused: ${e.code || ''} ${e.message}`); } }
    if (termEl) termEl.textContent = '';
  }

  async function openTerminal() {
    if (S.view !== 'terminal' || !visible()) return;
    const t = termTransport();
    if (!t || !S.active) { paintTerminal(); return; }
    if (T.id === S.active && T.session) { fitTerminal(); paintTerminal(); return; }
    if (T.opening) { await T.opening.catch(() => {}); if (T.id === S.active) return; }
    const mine = (async () => {
      if (T.id && T.id !== S.active) await closeTerminal();
      T.error = null;
      // the workspace's own worktree, when it is bound to an Orca terminal (the agent's real cwd)
      const orca = S.terminals.find((x) => x.handle === (S.row && S.row.orcaHandle));
      const cwdOpt = orca && orca.worktreePath ? { cwd: orca.worktreePath } : {};
      try {
        T.session = await t.open(S.active, { cols: T.cols || TERM_DEFAULT_COLS, rows: T.rows || TERM_DEFAULT_ROWS, ...cwdOpt });
      } catch (e) { T.error = `terminal open refused — ${e.code || 'TERM_OPEN_FAILED'}: ${e.message}`; sys(T.error); paintTerminal(); return; }
      T.id = S.active;
      T.screen = createAnsiScreen(T.cols || TERM_DEFAULT_COLS, T.rows || TERM_DEFAULT_ROWS);
      T.unsub.push(t.onData((ev) => { if (ev && ev.workspaceId === T.id && T.screen) { T.screen.write(ev.data); paintTerminal(); } }));
      T.unsub.push(t.onExit((ev) => {
        if (!ev || ev.workspaceId !== T.id) return;
        T.exited = ev.exit || {};
        T.error = `session ${ev.name} exited (code ${T.exited && T.exited.code} signal ${T.exited && T.exited.signal}) — press ⟲ RESTART (or reopen the TERMINAL view) to start a fresh one`;
        sys(T.error); T.id = null; T.session = null; T.screen = null; paintTerminal();
      }));
      try { const buf = await t.read(S.active); if (buf && T.screen) T.screen.write(buf); } catch { /* a fresh session has no buffer */ }
      fitTerminal();
      paintTerminal();
    })();
    T.opening = mine;
    try { await mine; } finally { if (T.opening === mine) T.opening = null; }
  }

  /** THE ⟲ RESTART CONTROL (2026-10-01): the operator's one-click recovery for a terminal that is
   * stuck, wedged, or carrying an old adopted session's state. Semantics are exactly the proven
   * recovery pair — close the session (bridge kills the tmux session + its attach), then open a
   * FRESH one. It is destructive by definition (whatever ran IN the session dies, and the title
   * says so): the honest alternative to a terminal the operator cannot fix from the UI. */
  async function resetTerminal() {
    if (S.view !== 'terminal') return;
    if (!termTransport()) { sys('TERMINAL BRIDGE NOT WIRED — nothing to restart'); return; }
    sys('restarting the terminal — the old session is killed, a fresh one opens');
    await closeTerminal();
    await openTerminal();
    if (T.id) sys('terminal restarted — fresh session ' + (T.session && T.session.name ? T.session.name : T.id));
  }

  /** the input path: raw bytes into the pty (keystrokes AND pasted text) */
  async function sendInput(text) {
    const t = termTransport();
    if (!t) { sys('TERMINAL BRIDGE NOT WIRED — nothing was sent'); return { ok: false, code: 'TERM_NOT_WIRED' }; }
    if (!T.id) { await openTerminal(); if (!T.id) { sys('no terminal session is open — the input was not sent'); return { ok: false, code: 'TERM_NO_SESSION' }; } }
    try { await t.write(T.id, text); return { ok: true, sent: 'terminal' }; }
    catch (e) { sys(`terminal write refused: ${e.code || ''} ${e.message}`); return { ok: false, code: e.code || 'TERM_WRITE_FAILED' }; }
  }

  /** THE PROVEN LINE FRAMING (measured 2026-10-01): the text and its Enter go into the pty as TWO
   * writes — exactly what a keystroke stream is. A single `text + '\r'` chunk is eaten by the pane's
   * readline once the session has been resized to this panel's grid: the bytes REACH the pty (proven
   * with a `dd`/`cat` reader inside the pane — full hex, CR included), yet readline renders only the
   * first characters and never runs the line. Two writes executed 100% of measured attempts across
   * every session state (fresh, repeatedly-resized, readline at a prompt): 14/14 single-chunk
   * failures vs 0/20 split-shape failures in the same pane. NEVER re-join the CR into the text chunk
   * on this path. (The keystroke handler at termEl.sendInput is single-key by construction — safe.) */
  async function sendLine(text) {
    const a = await sendInput(text);
    if (!a.ok) return a;
    await new Promise((r) => setTimeout(r, 40)); // a keystroke cadence between the line and its Enter
    const b = await sendInput('\r');
    return b.ok ? { ok: true, sent: 'terminal' } : b;
  }

  /** a paste is typed: each newline becomes an Enter KEYSTROKE (never a CR inside a text chunk) */
  async function pasteText(txt) {
    const parts = String(txt).split(/\r?\n/);
    for (let i = 0; i < parts.length; i++) {
      const r = await sendInput(parts[i]);
      if (!r.ok) return;
      if (i < parts.length - 1) {
        await new Promise((res) => setTimeout(res, 40));
        const e = await sendInput('\r');
        if (!e.ok) return;
      }
    }
  }

  // the keymap: what a real terminal sends (xterm's own encodings). Anything not here is e.key verbatim.
  const KEYS = {
    Enter: '\r', Backspace: '\u007f', Tab: '\t', Escape: '\u001b', ' ': ' ',
    ArrowUp: '\u001b[A', ArrowDown: '\u001b[B', ArrowRight: '\u001b[C', ArrowLeft: '\u001b[D',
    Home: '\u001b[H', End: '\u001b[F', PageUp: '\u001b[5~', PageDown: '\u001b[6~', Insert: '\u001b[2~', Delete: '\u001b[3~',
    F1: '\u001bOP', F2: '\u001bOQ', F3: '\u001bOR', F4: '\u001bOS', F5: '\u001b[15~', F6: '\u001b[17~', F7: '\u001b[18~', F8: '\u001b[19~',
    F9: '\u001b[20~', F10: '\u001b[21~', F11: '\u001b[23~', F12: '\u001b[24~',
  };
  const MOD_KEYS = { ArrowUp: 'A', ArrowDown: 'B', ArrowRight: 'C', ArrowLeft: 'D', Home: 'H', End: 'F' };
  function keyBytes(e) {
    const mod = (e.ctrlKey ? 4 : 0) + (e.altKey ? 2 : 0) + (e.shiftKey ? 1 : 0);
    if (MOD_KEYS[e.key] && (e.ctrlKey || e.altKey)) return `\u001b[1;${mod + 1}${MOD_KEYS[e.key]}`;   // xterm's modifier form
    if (e.shiftKey && e.key === 'Tab') return '\u001b[Z';
    if (e.ctrlKey && !e.altKey && !e.metaKey && e.key && e.key.length === 1) { const c = e.key.toLowerCase().charCodeAt(0); return String.fromCharCode(c & 0x1f); }
    if (e.altKey && e.key && e.key.length === 1) return '\u001b' + e.key;
    if (Object.prototype.hasOwnProperty.call(KEYS, e.key)) return KEYS[e.key];
    if (!e.ctrlKey && !e.altKey && !e.metaKey && e.key && e.key.length === 1) return e.key;
    return null;                                                    // Shift/Control alone, dead keys, browser chords
  }
  if (termEl) {
    termEl.tabIndex = 0;                                            // focusable: the panel IS the terminal
    termEl.setAttribute('spellcheck', 'false');
    termEl.setAttribute('autocapitalize', 'off');
    termEl.setAttribute('autocorrect', 'off');
    termEl.title = 'the live terminal — click it and type';
    termEl.addEventListener('mousedown', () => { try { termEl.focus(); } catch { /* focus refused */ } });
    termEl.addEventListener('keydown', (e) => {
      if (S.view !== 'terminal') return;
      const bytes = keyBytes(e);
      if (bytes === null) return;
      e.preventDefault();
      void sendInput(bytes);
    });
    termEl.addEventListener('paste', (e) => {
      if (S.view !== 'terminal') return;
      const txt = e.clipboardData && e.clipboardData.getData ? e.clipboardData.getData('text') : '';
      if (!txt) return;
      e.preventDefault();
      void pasteText(txt);                                           // newlines become Enter KEYSTROKES, one write per line
    });
    window.addEventListener('resize', () => { if (S.view === 'terminal') setTimeout(fitTerminal, 120); });
  }

  /** what the TERMINAL panel is backed by right now (the orchestrator's probe, and the face's own state()) */
  function terminalState() {
    const t = termTransport();
    return {
      wired: !!t, transport: t ? 'ipc:term:*' : 'none',
      reason: t ? null : ((window.PlutusTerm && window.PlutusTerm.missingReason && window.PlutusTerm.missingReason()) || 'window.PlutusTerm absent'),
      workspaceId: T.id, name: T.session ? T.session.name : null, pid: T.session ? T.session.pid : null,
      cols: T.cols, rows: T.rows, backend: T.session ? T.session.backend : null, cwd: T.session ? T.session.cwd : null,
      error: T.error, exited: T.exited,
    };
  }

  function applyView() {
    root.dataset.faceView = S.view;
    for (const b of root.querySelectorAll('[data-act="face-view"]')) b.classList.toggle('is-active', b.dataset.view === S.view);
    if (termEl) termEl.hidden = S.view !== 'terminal';
    if (logEl) logEl.hidden = S.view !== 'log';
    if (input) input.placeholder = S.view === 'terminal'
      ? (termTransport() ? `type into ${S.row ? S.row.label : 'the'}'s terminal · Enter sends a line` : 'no terminal bridge — see the panel for the wiring')
      : `a note in ${S.row ? S.row.label : 'the'} workspace log`;
    const fl = $('[data-act="face-follow"]'); if (fl) fl.checked = S.follow;
    if (S.view === 'terminal') { void openTerminal(); } else { paintTerminal(); }
  }
  S.screenTimer = setInterval(() => { if (S.view === 'terminal' && visible()) fitTerminal(); }, FIT_POLL_MS);
  // A HIDDEN PANEL CANNOT MEASURE ITS GRID, and the session must not be opened for a panel the operator
  // cannot see. These two are the triggers for the real flow: the operator opens the PINE SHELL tab (or
  // comes back to the window) AFTER boot — openTerminal is a no-op when a session is already attached.
  document.addEventListener('tab-switched', (e) => { if (e && e.detail && e.detail.tab === 'pine' && S.view === 'terminal') setTimeout(() => { void openTerminal(); }, 120); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && S.view === 'terminal') setTimeout(() => { void openTerminal(); }, 120); });
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
        // the line goes into the REAL pty the same way keystrokes do — text, then its Enter as a
        // SEPARATE write (sendLine carries the measured why: single-chunk text+CR is eaten)
        const r = await sendLine(t);
        if (!r.ok) restore();
        return r.ok ? { ok: true, sent: 'terminal' } : r;
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
    else if (b.dataset.act === 'term-reset') void resetTerminal();
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
    state: () => ({ active: S.active, rev: S.rev, dirty: S.dirty, view: S.view, follow: S.follow, agents: S.workspaces.map((w) => w.agentId), queue: S.queue.length, connected: S.connected, terminal: S.row ? S.row.orcaHandle : null, term: terminalState() }),
    // the orchestrator's probe (window.PlutusPineShell.face.terminalState()): what the TERMINAL panel is
    // actually backed by right now — a live pty (pid), the wiring, or the named reason it is not
    terminalState: () => terminalState(),
    // the old chat surface (pine-ide state() + e2e probes read these)
    line: (kind, text) => logLine(kind, text), seen: () => S.seen.slice(), isConnected: () => S.connected,
    destroy() {
      clearInterval(S.screenTimer); clearInterval(S.statusTimer);
      if (S.saveTimer) { clearTimeout(S.saveTimer); S.saveTimer = null; }
      if (S.unbindArm) { clearTimeout(S.unbindArm.timer); S.unbindArm = null; } // no disarm render on a detached face
      // the pty is DELIBERATELY left running (it survives a tab switch, its output buffers in the main
      // process, and read() replays it on the next mount); only this face's subscriptions are released
      for (const u of T.unsub) { try { u(); } catch { /* gone */ } }
      T.unsub = [];
      if (S.dirty) void saveNow(); // an SPA unmount never fires beforeunload: the pending edit is flushed here
      try { S.ws && S.ws.close(); } catch { /* gone */ }
    },
  };
}
