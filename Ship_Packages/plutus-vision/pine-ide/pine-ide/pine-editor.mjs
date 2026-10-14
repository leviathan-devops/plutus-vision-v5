/**
 * pine-editor.mjs — THE PINE EDITOR (the tab's left pane).
 *
 * The dashboard ships NO editor dependency (package.json: vela/express/ws/zod/
 * better-sqlite3/electron/typescript — no CodeMirror, no Monaco). Per the ticket
 * ("do NOT add a heavyweight editor dep without checking package.json first") this is
 * a plain textarea + a synced line-number gutter + the INLINE ERROR MARKER the gate
 * requires: a compile/runtime error renders AT ITS LINE (gutter mark + inline row)
 * and the chart keeps the last good frame (the caller never clears on error).
 *
 * The keystroke path IS the real-time kernel: `onChange(source)` fires debounced
 * (default 120ms per SHELL_ANCHOR §15) so the caller can re-run and re-draw.
 */

export const EDITOR_VERSION = '1.0.0';

export function createPineEditor({ host, source = '', onChange = null, debounceMs = 120, placeholder = '//@version=5\nindicator("…", overlay=true)\nplot(close)' } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'pine-editor';
  wrap.innerHTML = '<div class="pine-gutter" aria-hidden="true"></div><textarea class="pine-src" spellcheck="false" wrap="off"></textarea><div class="pine-inline-error" role="alert" hidden></div>';
  const gutter = wrap.querySelector('.pine-gutter');
  const ta = wrap.querySelector('.pine-src');
  const errRow = wrap.querySelector('.pine-inline-error');
  ta.placeholder = placeholder;
  ta.setAttribute('aria-label', 'Pine script source');
  host.appendChild(wrap);

  let timer = null;
  let errorLine = null;

  function paintGutter() {
    const n = ta.value.split('\n').length;
    let html = '';
    for (let i = 1; i <= n; i++) html += `<span class="${i === errorLine ? 'pine-gutter-err' : ''}">${i}</span>`;
    gutter.innerHTML = html;
    gutter.scrollTop = ta.scrollTop;
  }
  function emit() { if (typeof onChange === 'function') onChange(ta.value); }
  function schedule() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { timer = null; emit(); }, Math.max(0, debounceMs));
  }
  ta.addEventListener('input', () => { paintGutter(); schedule(); });
  ta.addEventListener('scroll', () => { gutter.scrollTop = ta.scrollTop; });
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {                       // Tab indents instead of leaving the field
      e.preventDefault();
      const s = ta.selectionStart, en = ta.selectionEnd;
      ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(en);
      ta.selectionStart = ta.selectionEnd = s + 2;
      paintGutter(); schedule();
    }
  });

  function setError(err) {
    if (!err) return clearError();
    errorLine = Number.isFinite(Number(err.line)) && Number(err.line) > 0 ? Number(err.line) : null;
    const where = errorLine ? `LINE ${errorLine}` : 'NO LINE';
    errRow.hidden = false;
    errRow.innerHTML = `<b>${String(err.code || 'PINE_ERROR')}</b> · ${where} — ${escapeHtml(String(err.message || ''))}`;
    paintGutter();
    if (errorLine) {                             // scroll the offending line into view
      const lines = ta.value.split('\n');
      const before = lines.slice(0, errorLine - 1).join('\n');
      const ratio = before.length / Math.max(1, ta.value.length);
      ta.scrollTop = Math.max(0, Math.round(ta.scrollHeight * ratio) - ta.clientHeight / 2);
      gutter.scrollTop = ta.scrollTop;
    }
    return { line: errorLine };
  }
  function clearError() { errorLine = null; errRow.hidden = true; errRow.textContent = ''; paintGutter(); }

  function setSource(s) { ta.value = String(s ?? ''); paintGutter(); clearError(); }
  const getSource = () => ta.value;

  setSource(source);

  return {
    version: EDITOR_VERSION, el: wrap, textarea: ta,
    getSource, setSource, setError, clearError, focus: () => ta.focus(),
    get errorLine() { return errorLine; },
    get lines() { return ta.value.split('\n').length; },
    flush() { if (timer) { clearTimeout(timer); timer = null; } emit(); },
  };
}

function escapeHtml(s) {
  return s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
}
