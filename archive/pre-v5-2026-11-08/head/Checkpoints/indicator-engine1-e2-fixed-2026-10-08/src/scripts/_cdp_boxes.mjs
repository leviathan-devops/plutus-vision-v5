#!/usr/bin/env bun
// _cdp_boxes.mjs — load my pine into the alive IDE and dump the DRAWN box colors + counts.
import { readFileSync } from "node:fs";
const W = "/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION";
const src = readFileSync(`${W}/plutus-vision-v2.pine`, "utf8");
const list = await (await fetch("http://127.0.0.1:9225/json/list")).json();
const page = list.find((t) => t.type === "page" && t.title === "Plutus Dashboard");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
let n = 0;
const call = (m, p = {}) => new Promise((ok) => {
  const id = ++n; const h = (e) => { const d = JSON.parse(e.data); if (d.id === id) { ws.removeEventListener("message", h); ok(d); } };
  ws.addEventListener("message", h); ws.send(JSON.stringify({ id, method: m, params: p }));
});
const expr = `(async () => {
  const P = window.PlutusPineShell;
  P.editor.setSource(${JSON.stringify(src)}); P.editor.flush();
  await P.loadBars({ pair: "EURUSD", timeframe: "1H" });
  await new Promise(r => setTimeout(r, 2500));
  const rr = await P.run({ silent: false });
  await new Promise(r => setTimeout(r, 2500));
  const V = P.state().lastVision || {};
  const j = (P.chart.drawings && P.chart.drawings.toJSON) ? P.chart.drawings.toJSON() : {};
  const boxes = (j.drawings || []).filter(d => d.kind === "box" || d.type === "box" || d.box);
  const allBoxes = (j.boxes || (j.drawings||[]).filter(d=>(d.kind||"")==="box"));
  return {
    ok: rr.ok, counts: rr.run && rr.run.counts,
    drawingsKeys: Object.keys(j),
    nDrawings: (j.drawings || []).length,
    boxes: (j.boxes || []).slice(0, 12).map(b => ({ color: b.color, border: b.borderColor, a: b.a && b.a.price, b: b.b && b.b.price }))
  };
})()`;
let r; for (let i = 0; i < 3; i++) { r = await call("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); if (!r.result?.exceptionDetails) break; await Bun.sleep(1500); }
console.log(JSON.stringify(r.result?.result?.value ?? r.result, null, 1));
ws.close();
