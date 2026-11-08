/**
 * study-legend.mjs — the TradingView-style indicator row under the symbol legend
 * ("Plutus Vision v0  [eye] [gear]") and its Inputs dialog.
 *
 * The dialog renders the SAME structure the sources declare, which is what the operator
 * screenshotted and rejected on 2026-10-01 (one flat scroll, raw variable names as labels):
 *
 *   ▾ SMART MONEY CONCEPTS            52 inputs      <- one section per merged indicator
 *       SMART MONEY CONCEPTS                          <- the source's own group=
 *         Mode                        [Historical ▾]
 *         Style                       [Colored ▾]
 *         Bullish Structure           [All ▾] [■]    <- inline= pairs share ONE row
 *       REAL TIME SWING STRUCTURE
 *         ...
 *   ▸ LIQUIDITY SWEEPS                10 inputs
 *   ▸ LIQUIDITY VOIDS                  8 inputs
 *   ▸ LIQUIDITY POOLS                 14 inputs
 *
 * Editing a field rewrites ONLY that input's defval in the editor source, then re-runs.
 * The Pine logic is never touched.
 */
import { parseInputSections, buildRows, prettyName } from "./input_parser_v2.mjs";

const SECTION_TITLES = {
  SMC: "SMART MONEY CONCEPTS",
  SWEEPS: "LIQUIDITY SWEEPS",
  VOIDS: "LIQUIDITY VOIDS (FVG)",
  POOLS: "BUYSIDE / SELLSIDE LIQUIDITY",
  GENERAL: "GENERAL",
};

const CSS = `
.pv-legend{position:absolute;left:52px;top:34px;z-index:20;display:flex;align-items:center;gap:6px;
  font:12px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;color:#d1d4dc;padding:2px 4px;border-radius:4px}
.pv-legend:hover{background:rgba(42,46,57,.85)}
.pv-legend .t{font-weight:600}
.pv-legend button{background:none;border:0;color:#b2b5be;cursor:pointer;padding:0 3px;font-size:13px;line-height:1}
.pv-legend button:hover{color:#fff}
.pv-legend.off .t{opacity:.45}

.pv-dlg{position:absolute;left:52px;top:58px;z-index:30;width:520px;max-height:74%;display:flex;flex-direction:column;
  background:#1e222d;color:#d1d4dc;border:1px solid #363a45;border-radius:6px;
  box-shadow:0 10px 30px rgba(0,0,0,.55);font:12px/1.5 -apple-system,Segoe UI,Roboto,sans-serif}
.pv-dlg h3{margin:0;padding:9px 12px;font-size:13px;border-bottom:1px solid #363a45;
  display:flex;justify-content:space-between;align-items:center;gap:8px}
.pv-dlg h3 .x{background:none;border:0;color:#b2b5be;cursor:pointer;font-size:14px;line-height:1}
.pv-search{padding:6px 12px;border-bottom:1px solid #2a2e39}
.pv-search input{width:100%;background:#2a2e39;color:#d1d4dc;border:1px solid #434651;border-radius:3px;padding:4px 6px;font:inherit}
.pv-body{overflow:auto;padding:4px 0 8px}

.pv-sec{border-bottom:1px solid #2a2e39}
.pv-sec>summary{list-style:none;cursor:pointer;padding:7px 12px;display:flex;justify-content:space-between;
  align-items:center;font-weight:600;letter-spacing:.02em;background:#232732;user-select:none}
.pv-sec>summary::-webkit-details-marker{display:none}
.pv-sec>summary:hover{background:#2a2e39}
.pv-sec>summary .tw{color:#868993;font-weight:400;font-size:11px;margin-left:8px}
.pv-grp{padding:6px 12px 1px;color:#868993;text-transform:uppercase;font-size:10px;letter-spacing:.07em}
.pv-row{display:flex;align-items:center;justify-content:space-between;padding:3px 12px;gap:10px;min-height:24px}
.pv-row>label{flex:1;color:#d1d4dc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pv-row>.ctl{display:flex;gap:6px;align-items:center;flex-shrink:0}
.pv-row input[type=text],.pv-row input[type=number],.pv-row select{background:#2a2e39;color:#d1d4dc;
  border:1px solid #434651;border-radius:3px;padding:2px 5px;font:inherit;min-width:118px}
.pv-row input[type=checkbox]{width:14px;height:14px;accent-color:#2962ff}
.pv-row input[type=color]{width:30px;height:20px;padding:0;border:1px solid #434651;border-radius:3px;background:none}
.pv-row.changed>label{color:#2962ff}
.pv-row.changed>label:after{content:" ●";font-size:9px;vertical-align:super}
.pv-foot{display:flex;justify-content:flex-end;gap:8px;padding:9px 12px;border-top:1px solid #363a45;background:#1e222d}
.pv-foot button{background:#2a2e39;color:#d1d4dc;border:1px solid #434651;border-radius:4px;padding:5px 13px;cursor:pointer;font:inherit}
.pv-foot button.ok{background:#2962ff;border-color:#2962ff;color:#fff}
.pv-foot button.ghost{background:none}
.pv-empty{padding:18px 12px;color:#868993;text-align:center}
`;

/** Pine literal for a new value of an input of `kind`. */
function literal(kind, v) {
  if (kind === "bool") return v ? "true" : "false";
  if (kind === "int") return String(Math.round(Number(v)));
  if (kind === "float") return String(Number(v));
  if (kind === "color") return String(v);
  return `'${String(v).replace(/'/g, "\\'")}'`;
}

export function mountStudyLegend(host, api) {
  if (getComputedStyle(host).position === "static") host.style.position = "relative";
  if (!document.getElementById("pv-legend-css")) {
    const st = document.createElement("style");
    st.id = "pv-legend-css"; st.textContent = CSS; document.head.append(st);
  }

  const row = document.createElement("div");
  row.className = "pv-legend"; row.dataset.pvLegend = "1";
  const title = document.createElement("span"); title.className = "t"; title.textContent = "—";
  const eye = document.createElement("button"); eye.title = "Hide / show indicator"; eye.textContent = "👁";
  const gear = document.createElement("button"); gear.title = "Indicator settings"; gear.textContent = "⚙";
  gear.dataset.pvSettings = "1";
  row.append(title, eye, gear);
  host.append(row);

  let visible = true, dlg = null, collapsed = new Set();

  eye.onclick = () => {
    visible = !visible; row.classList.toggle("off", !visible); api.setDrawingsVisible(visible);
  };
  gear.onclick = () => (dlg ? close() : open());
  host.addEventListener("keydown", (e) => { if (e.key === "Escape" && dlg) close(); });

  function close() { if (dlg) dlg.remove(); dlg = null; }

  function open() {
    const sections = parseInputSections(api.getSource());
    dlg = document.createElement("div");
    dlg.className = "pv-dlg"; dlg.dataset.pvDialog = "1";

    const h = document.createElement("h3");
    const total = sections.reduce((n, s) => n + s.inputs.length, 0);
    h.innerHTML = `<span>${title.textContent} — Inputs</span>`;
    const x = document.createElement("button");
    x.className = "x"; x.textContent = "✕"; x.onclick = close;
    h.append(x); dlg.append(h);

    const sw = document.createElement("div"); sw.className = "pv-search";
    const search = document.createElement("input");
    search.placeholder = `filter ${total} inputs across ${sections.length} indicators…`;
    search.dataset.pvSearch = "1";
    sw.append(search); dlg.append(sw);

    const body = document.createElement("div"); body.className = "pv-body";
    const fields = [];   // { inp, el }

    const makeField = (inp) => {
      let el;
      if (inp.kind === "bool") { el = document.createElement("input"); el.type = "checkbox"; el.checked = inp.value === "true"; }
      else if (inp.options && inp.options.length) {
        el = document.createElement("select");
        for (const o of inp.options) { const op = document.createElement("option"); op.value = op.textContent = o; el.append(op); }
        el.value = inp.value;
      } else if (inp.kind === "int" || inp.kind === "float") {
        el = document.createElement("input"); el.type = "number"; el.value = inp.value;
        if (inp.min !== null) el.min = inp.min;
        if (inp.max !== null) el.max = inp.max;
        el.step = inp.step ?? (inp.kind === "int" ? 1 : "any");
      } else if (inp.kind === "color" && /^#[0-9a-fA-F]{6}$/.test(inp.value)) {
        el = document.createElement("input"); el.type = "color"; el.value = inp.value;
      } else {
        el = document.createElement("input"); el.type = "text"; el.value = inp.value;
      }
      el.dataset.pvInput = inp.name;
      el.title = `${inp.name} · line ${inp.line}`;
      return el;
    };

    for (const sec of sections) {
      const det = document.createElement("details");
      det.className = "pv-sec"; det.open = !collapsed.has(sec.id);
      det.dataset.pvSection = sec.id;
      det.addEventListener("toggle", () => {
        if (det.open) collapsed.delete(sec.id); else collapsed.add(sec.id);
      });

      const sum = document.createElement("summary");
      const label = SECTION_TITLES[sec.id] || sec.name.toUpperCase();
      const n = sec.inputs.length;
      sum.innerHTML = `<span>${det.open ? "▾" : "▸"} ${label}</span><span class="tw">${n}</span>`;
      det.append(sum);

      // rows, bucketed into the source's own groups in first-appearance order
      const rows = buildRows(sec.inputs);
      let curGroup = null;
      for (const r of rows) {
        const g = r.members[0].group || "";
        if (g !== curGroup) {
          curGroup = g;
          if (g) { const gh = document.createElement("div"); gh.className = "pv-grp"; gh.textContent = g; det.append(gh); }
        }
        const rowEl = document.createElement("div");
        rowEl.className = "pv-row"; rowEl.dataset.pvLabel = r.label.toLowerCase();
        const lab = document.createElement("label");
        lab.textContent = r.label; lab.title = r.tooltip || r.label;
        const ctl = document.createElement("div"); ctl.className = "ctl";
        for (const m of r.members) {
          const el = makeField(m);
          ctl.append(el);
          fields.push({ inp: m, el, rowEl });
          el.addEventListener("change", () => {
            const v = m.kind === "bool" ? el.checked : el.value;
            const cur = m.kind === "bool" ? m.value === "true" : m.value;
            rowEl.classList.toggle("changed", String(v) !== String(cur));
          });
        }
        rowEl.append(lab, ctl);
        det.append(rowEl);
      }
      body.append(det);
    }
    dlg.append(body);

    const f = document.createElement("div"); f.className = "pv-foot";
    const reset = document.createElement("button");
    reset.className = "ghost"; reset.textContent = "Reset";
    reset.onclick = () => { close(); open(); };
    const cancel = document.createElement("button"); cancel.textContent = "Cancel"; cancel.onclick = close;
    const ok = document.createElement("button"); ok.className = "ok"; ok.textContent = "Apply";
    ok.dataset.pvApply = "1";
    ok.onclick = async () => {
      const changes = [];
      for (const { inp, el } of fields) {
        const v = inp.kind === "bool" ? el.checked : el.value;
        const cur = inp.kind === "bool" ? inp.value === "true" : inp.value;
        if (String(v) !== String(cur)) changes.push({ input: inp, value: v });
      }
      close();
      if (!changes.length) return;
      api.setSource(applyChanges(api.getSource(), changes));
      await api.run();
    };
    f.append(reset, cancel, ok); dlg.append(f);
    host.append(dlg);

    search.addEventListener("input", () => {
      const q = search.value.trim().toLowerCase();
      for (const det of body.querySelectorAll(".pv-sec")) {
        let visibleInSec = 0;
        for (const r of det.querySelectorAll(".pv-row")) {
          const hit = !q || (r.dataset.pvLabel || "").includes(q) || (r.textContent || "").toLowerCase().includes(q);
          r.style.display = hit ? "" : "none";
          if (hit) visibleInSec++;
        }
        det.style.display = visibleInSec ? "" : "none";
        if (q) det.open = true;
      }
    });
    search.focus();
  }

  return {
    setTitle(t) { title.textContent = t || "—"; },
    refresh() { if (dlg) { close(); open(); } },
    destroy() { close(); row.remove(); },
  };
}

/** Rewrite ONLY the defval token of each changed input's declaration line. */
export function applyChanges(src, changes) {
  const lines = String(src).split("\n");
  for (const { input: inp, value } of changes) {
    const li = inp.line - 1;
    const l = lines[li];
    if (l === undefined) throw Object.assign(new Error(`input ${inp.name} line ${inp.line} out of range`), { code: "INPUT_DRIFT" });
    const at = l.indexOf("(", l.indexOf("input.")) + 1;
    const rest = l.slice(at);
    const lead = rest.match(/^\s*(?:defval\s*=\s*)?/)[0];
    const tail = rest.slice(lead.length);
    if (!tail.startsWith(inp.raw)) {
      throw Object.assign(new Error(`input ${inp.name} line ${inp.line} drifted (expected ${inp.raw})`), { code: "INPUT_DRIFT" });
    }
    lines[li] = l.slice(0, at) + lead + literal(inp.kind, value) + tail.slice(inp.raw.length);
  }
  return lines.join("\n");
}