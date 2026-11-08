#!/usr/bin/env bun
// _cdp_clear.mjs — enumerate + clear the IDE chart's studies/drawings so stale boxes go away.
const list = await (await fetch("http://127.0.0.1:9225/json/list")).json();
const page = list.find((t) => t.type === "page" && t.title === "Plutus Dashboard");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
let n = 0;
const call = (m, p = {}) => new Promise((ok) => { const id = ++n; const h = (e) => { const d = JSON.parse(e.data); if (d.id === id) { ws.removeEventListener("message", h); ok(d); } }; ws.addEventListener("message", h); ws.send(JSON.stringify({ id, method: m, params: p })); });
const expr = `(() => {
  const P = window.PlutusPineShell;
  const out = {};
  try { out.chartKeys = Object.keys(P.chart); } catch(e){ out.chartKeys = "ERR"; }
  try { out.dwKeys = Object.keys(P.chart.drawings); } catch(e){ out.dwKeys = "ERR"; }
  try { out.studyCount = (P.chart.studies && P.chart.studies.length) || (P.chart.overlays && P.chart.overlays.length) || "?"; } catch(e){ out.studyCount="ERR"; }
  try { out.tabs = [...document.querySelectorAll('.tab,[role=tab],button')].map(b=>b.textContent.trim()).filter(t=>/pine|canon|chart/i.test(t)).slice(0,8); } catch(e){}
  try { out.clearRet = P.clearDrawings && String(P.clearDrawings()); } catch(e){ out.clearRet = "ERR "+e.message; }
  return out;
})()`;
const r = await call("Runtime.evaluate", { expression: expr, returnByValue: true });
console.log(JSON.stringify(r.result?.result?.value ?? r.result, null, 1));
ws.close();
