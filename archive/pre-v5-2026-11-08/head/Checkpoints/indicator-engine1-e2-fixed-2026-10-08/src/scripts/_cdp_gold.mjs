#!/usr/bin/env bun
// _cdp_gold.mjs — enumerate ALL chart studies + drawings by color, to identify the gold boxes.
const list = await (await fetch("http://127.0.0.1:9225/json/list")).json();
const page = list.find((t) => t.type === "page" && t.title === "Plutus Dashboard");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
let n = 0;
const call = (m, p = {}) => new Promise((ok) => { const id = ++n; const h = (e) => { const d = JSON.parse(e.data); if (d.id === id) { ws.removeEventListener("message", h); ok(d); } }; ws.addEventListener("message", h); ws.send(JSON.stringify({ id, method: m, params: p })); });
const expr = `(() => {
  const P = window.PlutusPineShell;
  const o = { studies: null, goldish: [] };
  // the study/indicator list on the chart
  try {
    const s = P.chart.studies || P.chart.indicators || P.chart.overlays;
    o.studies = s ? (Array.isArray(s) ? s.map(x => x && (x.title || x.name || x.id)) : Object.keys(s)) : null;
  } catch(e){ o.studies = "ERR "+e.message; }
  // every drawing, group by color
  try {
    const all = (P.chart.drawings.toJSON().drawings) || [];
    const byColor = {};
    for (const d of all) {
      const c = d.color || d.bgcolor || d.backgroundColor || "?";
      byColor[c] = (byColor[c]||0)+1;
    }
    o.byColor = byColor;
    // dump box-like drawings with their colors + price bounds
    o.boxes = all.filter(d => (d.kind||d.type||"")==="box" || d.a || d.p1).slice(0,20).map(d => ({ kind: d.kind||d.type, color: d.color||d.bgcolor, border: d.borderColor, a: d.a && d.a.price, b: d.b && d.b.price }));
  } catch(e){ o.drawErr = "ERR "+e.message; }
  // any global drawings registry
  try { o.reg = Object.keys(P.chart.drawings.ctrl || {}); } catch(e){}
  return o;
})()`;
const r = await call("Runtime.evaluate", { expression: expr, returnByValue: true });
console.log(JSON.stringify(r.result?.result?.value ?? r.result, null, 1).slice(0, 2500));
ws.close();
