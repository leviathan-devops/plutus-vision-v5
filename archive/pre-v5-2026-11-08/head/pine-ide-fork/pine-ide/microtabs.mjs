/**
 * microtabs.mjs — THE MICRO-TAB MANAGER.
 *
 * SHELL_ANCHOR §5.3: "an embedded Vela chart per MICRO-TAB (≥2 concurrent) · each
 * micro-tab = a source editor + its compiled output". Main's re-scope: "each micro-tab
 * = one artifact's gate run: its Pine + its chart + its verdict row".
 *
 * A micro-tab is therefore a full GATE RUN in a box:
 *   { id, name, lane, ref, source, frame, verdictRow, status }
 * where `frame` is the LAST GOOD RENDER — the station payload + the bars it ran on +
 * the vision summary. That is what makes ADV-d mechanical: activating a tab REPLAYS
 * its own frame onto the shared chart; an error in tab A never clears tab B's frame,
 * and editing A never touches B's buffer.
 *
 * Consumers of the chart drawing API this manager drives (measured, ripwire callers
 * of addDrawing → chart/app.js:149-186): drawBox/drawLine/drawHLine/drawLabel/
 * drawMarker — the same five Vela drawing types the vision renderer emits.
 */

export const MICROTABS_VERSION = '1.0.0';

export function createMicroTabs({ host, onActivate = null, onRemove = null, onAdd = null, onMutate = null } = {}) {
  const tabs = new Map();
  let order = [];
  let activeId = null;

  const strip = document.createElement('div');
  strip.className = 'pine-microtabs';
  const list = document.createElement('div');
  list.className = 'pine-microtab-list';
  const addBtn = document.createElement('button');
  addBtn.className = 'pine-microtab-add';
  addBtn.type = 'button';
  addBtn.title = 'New micro-tab (one more artifact gate run)';
  addBtn.textContent = '+';
  addBtn.addEventListener('click', () => { if (onAdd) onAdd(); });
  strip.appendChild(list);
  strip.appendChild(addBtn);
  host.appendChild(strip);

  function render() {
    list.textContent = '';
    for (const id of order) {
      const t = tabs.get(id);
      if (!t) continue;
      const el = document.createElement('div');
      el.className = 'pine-microtab' + (id === activeId ? ' is-active' : '') + (t.status && t.status.state ? ' is-' + t.status.state : '');
      el.dataset.tabId = id;
      el.title = `${t.name} · lane ${t.lane}${t.ref ? ' · ' + t.ref : ''}`;
      const lane = document.createElement('span');
      lane.className = 'pine-microtab-lane';
      lane.textContent = t.lane === 'canon' ? 'CANON' : (t.lane === 'station' ? 'STUDY' : 'PINE');
      const name = document.createElement('span');
      name.className = 'pine-microtab-name';
      name.textContent = t.name;
      const close = document.createElement('button');
      close.className = 'pine-microtab-close';
      close.type = 'button';
      close.textContent = '×';
      close.title = 'Close this micro-tab';
      close.addEventListener('click', (e) => {
        e.stopPropagation();
        remove(id);
        if (onRemove) onRemove(id);
      });
      el.addEventListener('click', () => activate(id));
      el.appendChild(lane); el.appendChild(name); el.appendChild(close);
      list.appendChild(el);
    }
  }

  function add(spec) {
    const id = spec.id || ('tab-' + (order.length + 1) + '-' + Math.random().toString(36).slice(2, 7));
    const tab = Object.assign({
      id, name: spec.name || id, lane: spec.lane || 'pine', ref: spec.ref || null,
      source: spec.source || '', frame: null, verdictRow: null,
      status: { state: 'idle', text: 'idle' },
    }, spec, { id });
    tabs.set(id, tab);
    order.push(id);
    render();
    if (onMutate) onMutate('add', tab);
    return tab;
  }

  function remove(id) {
    if (!tabs.has(id)) return false;
    tabs.delete(id);
    order = order.filter((x) => x !== id);
    if (activeId === id) {
      activeId = order[0] || null;
      if (activeId && onActivate) onActivate(tabs.get(activeId));
    }
    render();
    if (onMutate) onMutate('remove', { id });
    return true;
  }

  function activate(id) {
    if (!tabs.has(id)) return null;
    activeId = id;
    render();
    const t = tabs.get(id);
    if (onActivate) onActivate(t);
    return t;
  }

  function setStatus(id, status) {
    const t = tabs.get(id);
    if (!t) return null;
    t.status = Object.assign({ state: 'idle', text: '' }, status || {});
    render();
    return t;
  }

  render();
  return {
    version: MICROTABS_VERSION, el: strip, list,
    add, remove, activate, setStatus,
    get: (id) => tabs.get(id) || null,
    active: () => (activeId ? tabs.get(activeId) : null),
    activeId: () => activeId,
    list: () => order.map((id) => tabs.get(id)),
    count: () => order.length,
    rename(id, name) { const t = tabs.get(id); if (!t) return null; t.name = String(name == null ? '' : name).slice(0, 80) || t.id; render(); if (onMutate) onMutate('rename', t); return t; },
    /** Replace EVERY tab at once (a workspace switch) — no onActivate / onMutate: the caller owns
     *  the editor + chart swap that follows. Returns the active tab. */
    reset(list, activeTabId) {
      tabs.clear(); order = [];
      // persisted state is agent-writable: only object entries with a string source are tabs; ids are unique
      for (const spec of Array.isArray(list) ? list.slice(0, 32) : []) { // at most 32 tabs from agent-writable state
        if (!spec || typeof spec !== 'object' || typeof spec.source !== 'string' || spec.source.length > 400000) continue; // the CLI's own cap
        let id = typeof spec.id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(spec.id) ? spec.id : 'tab-' + (order.length + 1);
        if (tabs.has(id)) { const base = id.slice(0, 56); let k = 2; while (tabs.has(`${base}-${k}`)) k++; id = `${base}-${k}`; }
        tabs.set(id, { id, name: typeof spec.name === 'string' ? spec.name.slice(0, 80) : id, lane: ['pine', 'canon', 'station', 'week'].includes(spec.lane) ? spec.lane : 'pine', ref: typeof spec.ref === 'string' ? spec.ref.slice(0, 200) : null, source: spec.source, frame: null, verdictRow: null, status: { state: 'idle', text: 'idle' } });
        order.push(id);
      }
      activeId = tabs.has(activeTabId) ? activeTabId : (order[0] || null);
      render();
      return activeId ? tabs.get(activeId) : null;
    },
  };
}
