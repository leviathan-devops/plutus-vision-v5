#!/usr/bin/env bun
// _cdp_kernel.mjs — find the alive dashboard IDE's bar source + what pairs it serves.
const list = await (await fetch("http://127.0.0.1:9225/json/list")).json();
const page = list.find((t) => t.type === "page" && t.title === "Plutus Dashboard");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
let n = 0;
const call = (method, params = {}) => new Promise((ok) => {
  const id = ++n;
  const h = (e) => { const d = JSON.parse(e.data); if (d.id === id) { ws.removeEventListener("message", h); ok(d); } };
  ws.addEventListener("message", h);
  ws.send(JSON.stringify({ id, method, params }));
});
const expr = `(async () => {
  const P = window.PlutusPineShell;
  const out = { kernelUrl: null, wbKeys: [], wsUrl: null, lbEU: null, lbDXY2: null };
  try { out.kernelUrl = P.kernelUrl; } catch(e){}
  try { out.wsUrl = P.workbench && P.workbench.ws && (P.workbench.ws.url || P.workbench.ws.readyState); } catch(e){}
  try { out.wbKeys = Object.keys(P.workbench); } catch(e){}
  try { out.lbEU = await P.loadBars({ pair: "EURUSD", timeframe: "1H" }); } catch(e){ out.lbEU = "ERR "+e.message; }
  return out;
})()`;
const r = await call("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
console.log(JSON.stringify(r.result?.result?.value ?? r.result, null, 1));
ws.close();
