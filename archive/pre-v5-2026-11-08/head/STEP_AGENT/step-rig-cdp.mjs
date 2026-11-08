#!/usr/bin/env bun
// step-rig-cdp — drive the ISOLATED PLUTUS render rig (pv-server :9861 / chrome :9322).
//   bun step-rig-cdp.mjs --pair DXY --tf 1H [--pine f.pine] [--from MS --to MS] [--shot out.png]
// Mirrors scripts/pv-load.mjs's CDP contract but on this agent's own ports.
import { readFileSync, writeFileSync } from "node:fs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const CDP = "http://127.0.0.1:9322";
const pair = arg("pair", "DXY");
const tf = arg("tf", "1H");
const pine = arg("pine", null);
const from = arg("from", null);
const to = arg("to", null);
const shot = arg("shot", null);
const fail = (code, msg) => { console.error(`${code}: ${msg}`); process.exit(1); };

const list = await (await fetch(`${CDP}/json/list`)).json();
const page = list.find((t) => t.type === "page" && t.url.includes(":9861/pine.html"));
if (!page) fail("NO_PAGE", `no pine.html tab on :9322 — is chrome running?`);

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
let n = 0;
const call = (method, params = {}) => new Promise((ok) => {
  const id = ++n;
  const h = (e) => { const d = JSON.parse(e.data); if (d.id === id) { ws.removeEventListener("message", h); ok(d); } };
  ws.addEventListener("message", h);
  ws.send(JSON.stringify({ id, method, params }));
});

const src = pine ? JSON.stringify(readFileSync(pine, "utf8")) : "null";
const expr = `(async () => {
  for (let i = 0; i < 120; i++) {
    if (document.readyState === "complete" && window.PlutusPineShell) break;
    await new Promise(r => setTimeout(r, 500));
  }
  for (let i = 0; i < 120 && !window.PlutusPineShell; i++) await new Promise(r => setTimeout(r, 500));
  const P = window.PlutusPineShell; if (!P) return { error: 'NO_HANDLE' };
  if (${src}) { P.editor.setSource(${src}); P.editor.flush(); }
  await P.loadBars({ pair: ${JSON.stringify(pair)}, timeframe: ${JSON.stringify(tf)} });
  await new Promise(r => setTimeout(r, 2500));
  let rr = null;
  if (${src}) {
    rr = await P.run({ silent: false });
    if (!rr.ok) return { error: 'RUN_FAILED', code: rr.code, detail: String(rr.error || '').slice(0, 300) };
    await new Promise(r => setTimeout(r, 2500));
  }
  const V = P.state().lastVision, e = V && V.extent;
  const vis = ${from && to}
    ? { from: ${from || 0}, to: ${to || 0} }
    : (e ? { from: e.minTime - 3600000, to: e.maxTime + 1800000 } : null);
  if (vis) { P.chart.setVisibleRange(vis); }
  await new Promise(r => setTimeout(r, 1500));
  const bars = P.workbench.getBars() || [];
  return {
    counts: rr ? rr.run.counts : null,
    bars: bars.length,
    firstBar: bars[0] ? bars[0].time : null,
    lastBar: bars[bars.length - 1] ? bars[bars.length - 1].time : null,
    onChart: P.chart.drawings.toJSON().drawings.length,
    priceRange: bars.length ? [Math.min(...bars.map(b => b.low)), Math.max(...bars.map(b => b.high))] : null,
  };
})()`;

let res = null;
for (let attempt = 0; attempt < 3; attempt++) {
  try {
    res = await call("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
    if (!res.result?.exceptionDetails) break;
  } catch (e) { res = { result: { exceptionDetails: String(e) } }; }
  await Bun.sleep(2000);
}
const v = res.result?.result?.value;
if (!v) fail("EVAL_FAILED", JSON.stringify(res).slice(0, 400));
if (v.error) fail(v.error, `${v.code || ""} ${v.detail || ""}`);

if (shot) {
  const r = await call("Page.captureScreenshot", { format: "png" });
  if (!r.result?.data) fail("SHOT_FAILED", JSON.stringify(r).slice(0, 200));
  writeFileSync(shot, Buffer.from(r.result.data, "base64"));
  console.log(`shot: ${shot} (${(r.result.data.length / 1365).toFixed(0)}KB)`);
}
console.log(JSON.stringify({ pair, tf, ...v }));
ws.close();
