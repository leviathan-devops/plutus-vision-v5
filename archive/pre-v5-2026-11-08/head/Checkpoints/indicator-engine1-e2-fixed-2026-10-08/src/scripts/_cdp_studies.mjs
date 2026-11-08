#!/usr/bin/env bun
// _cdp_studies.mjs — list the chart's loaded studies/engines + their drawing counts.
const list = await (await fetch("http://127.0.0.1:9225/json/list")).json();
const page = list.find((t) => t.type === "page" && t.title === "Plutus Dashboard");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
let n = 0;
const call = (m, p = {}) => new Promise((ok) => { const id = ++n; const h = (e) => { const d = JSON.parse(e.data); if (d.id === id) { ws.removeEventListener("message", h); ok(d); } }; ws.addEventListener("message", h); ws.send(JSON.stringify({ id, method: m, params: p })); });
const expr = `(() => {
  const P = window.PlutusPineShell;
  const o = {};
  try { const eng = P.chart.orchestrator.engines; o.engines = (eng && (eng.size !== undefined ? [...eng.keys()] : Object.keys(eng))) || []; } catch(e){ o.engines = "ERR "+e.message; }
  try { const reg = P.chart.orchestrator.registry; o.registry = (reg && (reg.size !== undefined ? [...reg.keys()] : Object.keys(reg))) || []; } catch(e){ o.registry = "ERR"; }
  try { o.tabs = (P.tabs && P.tabs.list && P.tabs.list()) || (P.tabs && Object.keys(P.tabs)) || null; } catch(e){ o.tabs = "ERR"; }
  // every drawing on the chart, grouped by kind + color
  try { const j = P.chart.drawings.toJSON(); o.drawingsKeys = Object.keys(j); o.drawings = (j.drawings||[]).length; } catch(e){ o.drawings="ERR "+e.message; }
  try { const all = P.chart.__plutusLiveHandle && P.chart.__plutusLiveHandle.drawings && P.chart.__plutusLiveHandle.drawings.all && P.chart.__plutusLiveHandle.drawings.all(); o.all = (all||[]).length; o.allKinds = all ? [...new Set(all.map(d=>d.kind||d.type))] : null; } catch(e){ o.all="ERR "+e.message; }
  return o;
})()`;
const r = await call("Runtime.evaluate", { expression: expr, returnByValue: true });
console.log(JSON.stringify(r.result?.result?.value ?? r.result, null, 1).slice(0, 1500));
ws.close();
