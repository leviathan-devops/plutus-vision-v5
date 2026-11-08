#!/usr/bin/env bun
// pv-load — push a .pine file into the running PLUTUS_VISION Pine IDE, RUN it on
// the chart's bars, frame the drawn geometry, and print the counts.
//   bun pv-load.mjs [file.pine] [PAIR] [TF]      defaults: plutus-vision-v0.pine EUR/USD 1H
// Exit 0 = compiled + drawn; exit 1 = a named failure (NO_PAGE / NO_HANDLE / RUN_FAILED / NOTHING_DRAWN).
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const W = resolve(import.meta.dir, "..");
const file = resolve(process.argv[2] || `${W}/plutus-vision-v0.pine`);
const pair = process.argv[3] || "EUR/USD";
const tf = process.argv[4] || "1H";
const src = readFileSync(file, "utf8");
const fail = (code, msg) => { console.error(`${code}: ${msg}`); process.exit(1); };

let page;
for (let i = 0; i < 30 && !page; i++) {
  try {
    const list = await (await fetch("http://127.0.0.1:9222/json/list")).json();
    page = list.find((t) => t.type === "page" && t.url.includes(":9851/pine.html"));
  } catch {}
  if (!page) await Bun.sleep(1000);
}
if (!page) fail("NO_PAGE", "no pine.html tab on CDP :9222 — run pv-ide.sh first");

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
  // Wait for the kernel AND for the document to stop navigating. A relaunch destroys the
  // execution context mid-evaluate ("Execution context was destroyed") — found 2026-10-01.
  for (let i = 0; i < 120; i++) {
    if (document.readyState === "complete" && window.PlutusPineShell) break;
    await new Promise(r => setTimeout(r, 500));
  }
  for (let i = 0; i < 120 && !window.PlutusPineShell; i++) await new Promise(r => setTimeout(r, 500));
  const P = window.PlutusPineShell; if (!P) return { error: 'NO_HANDLE' };
  const shells = document.querySelectorAll('.pine-shell').length;
  P.editor.setSource(${JSON.stringify(src)}); P.editor.flush();
  await P.loadBars({ pair: ${JSON.stringify(pair)}, timeframe: ${JSON.stringify(tf)} });
  await new Promise(r => setTimeout(r, 2500));
  const rr = await P.run({ silent: false });
  if (!rr.ok) return { error: 'RUN_FAILED', code: rr.code, detail: String(rr.error || '').slice(0, 300) };
  await new Promise(r => setTimeout(r, 2500));
  const V = P.state().lastVision, e = V && V.extent;
  // frame the geometry with a right margin (8% of the span, ≥1 bar) so labels anchored at the
  // last/future bar (Strong/Weak High/Low, POOLS zones) are not clipped by the price axis
  if (e) { const pad = Math.max(3600000, (e.maxTime - e.minTime) * 0.08);
           P.chart.setVisibleRange({ from: e.minTime - 3600000, to: e.maxTime + pad }); }
  await new Promise(r => setTimeout(r, 1500));
  return { shells, title: rr.run.title, counts: rr.run.counts,
           bars: (P.workbench.getBars() || []).length,
           onChart: P.chart.drawings.toJSON().drawings.length };
})()`;
// Retry once on a destroyed execution context (the page navigated under us).
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
if (!v) fail("EVAL_FAILED", JSON.stringify(res).slice(0, 300));
if (v.error) fail(v.error, `${v.code || ""} ${v.detail || ""}`);
console.log(JSON.stringify({ file, pair, tf, ...v }));
if (v.shells !== 1) fail("DOUBLE_MOUNT", `${v.shells} pine shells mounted`);
if (!v.onChart) fail("NOTHING_DRAWN", "run ok but 0 drawings on chart");
