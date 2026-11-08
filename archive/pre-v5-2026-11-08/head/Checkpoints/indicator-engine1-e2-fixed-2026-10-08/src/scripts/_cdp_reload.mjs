#!/usr/bin/env bun
// _cdp_reload.mjs — reload the dashboard renderer to clear stale studies, then verify the IDE returns.
const list = await (await fetch("http://127.0.0.1:9225/json/list")).json();
const page = list.find((t) => t.type === "page" && t.title === "Plutus Dashboard");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
let n = 0;
const call = (m, p = {}) => new Promise((ok) => { const id = ++n; const h = (e) => { const d = JSON.parse(e.data); if (d.id === id) { ws.removeEventListener("message", h); ok(d); } }; ws.addEventListener("message", h); ws.send(JSON.stringify({ id, method: m, params: p })); });
// enumerate the chart's studies/overlays first
const pre = await call("Runtime.evaluate", { expression: `(() => { const P=window.PlutusPineShell; const o={}; try{o.orch=Object.keys(P.chart.orchestrator||{})}catch(e){} try{o.dc=Object.keys(P.chart.drawingsControl||{});o.dcType=typeof P.chart.drawingsControl}catch(e){} try{o.handle=typeof P.chart.__plutusLiveHandle}catch(e){} return o; })()`, returnByValue: true });
console.log("PRE", JSON.stringify(pre.result?.result?.value));
ws.close();
