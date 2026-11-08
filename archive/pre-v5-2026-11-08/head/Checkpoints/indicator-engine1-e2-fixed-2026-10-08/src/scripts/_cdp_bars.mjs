#!/usr/bin/env bun
// _cdp_bars.mjs — probe the alive dashboard IDE's bar-loading (why CHART_NOT_LOADED).
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
  const api = Object.keys(P).slice(0, 40);
  let lb = null, lbErr = null;
  try { lb = await P.loadBars({ pair: "DXY", timeframe: "1H" }); }
  catch (e) { lbErr = String(e.message || e).slice(0, 200); }
  await new Promise(r => setTimeout(r, 1500));
  let bars = null, wb = null;
  try { bars = (P.workbench && P.workbench.getBars() || []).length; } catch (e) { bars = "ERR " + e.message; }
  try { wb = P.workbench && Object.keys(P.workbench).slice(0, 25); } catch (e) { wb = "ERR"; }
  let st = null;
  try { st = JSON.parse(JSON.stringify(P.state ? P.state() : {})).constructor === Object ? Object.keys(P.state()).slice(0,20) : "?"; } catch (e) { st = "ERR " + e.message; }
  return { api, lb, lbErr, bars, wb, st, pairs: (P.pairs && P.pairs()) || null };
})()`;
const r = await call("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
console.log(JSON.stringify(r.result?.result?.value ?? r.result, null, 1));
ws.close();
