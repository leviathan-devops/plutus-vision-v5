#!/usr/bin/env bun
// pv-load-dash.mjs — push a .pine into the ALIVE Plutus Dashboard's PINE IDE tab (CDP :9225),
// RUN it on the chart bars, frame the geometry, print the counts. The pv-load protocol, retargeted
// from the standalone pv-ide chrome to the embedded dashboard IDE.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const W = resolve(import.meta.dir, "..");
const file = resolve(process.argv[2] || `${W}/plutus-vision-v2.pine`);
const pair = process.argv[3] || "DXY";
const tf = process.argv[4] || "1H";
const src = readFileSync(file, "utf8");
const fail = (code, msg) => { console.error(`${code}: ${msg}`); process.exit(1); };

let page, lastErr = "no attempt";
for (let i = 0; i < 30 && !page; i++) {
  try {
    const list = await (await fetch("http://127.0.0.1:9225/json/list")).json();
    page = list.find((t) => t.type === "page" && t.title === "Plutus Dashboard");
    lastErr = page ? "" : "CDP :9225 reachable but no 'Plutus Dashboard' page";
  } catch (e) {
    lastErr = `CDP :9225 unreachable — ${String(e.message || e).slice(0, 70)}`;
  }
  if (!page) await Bun.sleep(1000);
}
if (!page) fail("NO_PAGE", lastErr);

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
  if (!P) return { error: 'NO_HANDLE', keys: Object.keys(window).filter(k=>/pine/i.test(k)) };
  if (!P.editor || !P.run) return { error: 'NO_API', api: Object.keys(P).slice(0,20) };
  try { P.clearDrawings(); } catch (e) {}
  P.editor.setSource(${JSON.stringify(src)});
  P.editor.flush();
  await P.loadBars({ pair: ${JSON.stringify(pair)}, timeframe: ${JSON.stringify(tf)} });
  await new Promise(r => setTimeout(r, 2500));
  const rr = await P.run({ silent: false });
  if (!rr.ok) return { error: 'RUN_FAILED', code: rr.code, detail: String(rr.error || '').slice(0, 300) };
  await new Promise(r => setTimeout(r, 2500));
  const V = P.state().lastVision, e = V && V.extent;
  if (e && P.chart && P.chart.setVisibleRange) {
    const pad = Math.max(3600000, (e.maxTime - e.minTime) * 0.08);
    P.chart.setVisibleRange({ from: e.minTime - 3600000, to: e.maxTime + pad });
  }
  await new Promise(r => setTimeout(r, 1500));
  return { title: rr.run.title, counts: rr.run.counts,
           bars: (P.workbench && P.workbench.getBars() || []).length,
           onChart: P.chart && P.chart.drawings && P.chart.drawings.toJSON().drawings.length };
})()`;

let res = null;
for (let attempt = 0; attempt < 3; attempt++) {
  try {
    res = await call("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
    if (!res.result?.exceptionDetails) break;
  } catch (e) { res = { result: { exceptionDetails: String(e) } }; }
  await Bun.sleep(2000);
}
ws.close();
const v = res.result?.result?.value;
if (!v) fail("EVAL_FAILED", JSON.stringify(res).slice(0, 400));
if (v.error) fail(v.error, `${v.code || ""} ${v.detail || ""} ${v.keys || v.api || ""}`);
console.log(JSON.stringify({ file, pair, tf, ...v }));
if (!v.onChart) fail("NOTHING_DRAWN", "run ok but 0 drawings on chart");
