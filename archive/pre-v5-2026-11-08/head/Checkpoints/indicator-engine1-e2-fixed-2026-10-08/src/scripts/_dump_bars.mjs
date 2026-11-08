#!/usr/bin/env bun
// _dump_bars.mjs — pull the alive IDE's EURUSD 1H bars (the exact bars on its chart) and write
// them as a trident-fixture the E1 engine reads.
import { writeFileSync } from "node:fs";
const OUT = process.argv[2] || "/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/fixtures/bars/EURUSD-live.json";
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
  await P.loadBars({ pair: "EURUSD", timeframe: "1H" });
  await new Promise(r => setTimeout(r, 2000));
  const b = (P.workbench.getBars() || []);
  return { n: b.length, sample: b.slice(-2), first: b[0] };
})()`;
const r = await call("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
const v = r.result?.result?.value;
if (!v) { console.error("EVAL_FAILED", JSON.stringify(r).slice(0, 300)); process.exit(1); }
console.log("count", v.n, "sample", JSON.stringify(v.sample));
// normalize whatever key names the workbench uses
const norm = (bar) => ({
  timestamp: bar.timestamp ?? bar.time ?? bar.t,
  open: bar.open ?? bar.o, high: bar.high ?? bar.h,
  low: bar.low ?? bar.l, close: bar.close ?? bar.c, volume: bar.volume ?? bar.v ?? 0,
});
const bars = (v.sample && v.n ? await (async () => {
  const r2 = await call("Runtime.evaluate", { expression: `window.PlutusPineShell.workbench.getBars().map(b=>({timestamp:b.timestamp??b.time??b.t,open:b.open??b.o,high:b.high??b.h,low:b.low??b.l,close:b.close??b.c,volume:b.volume??b.v??0}))`, returnByValue: true });
  return r2.result?.result?.value || [];
})() : []);
ws.close();
const doc = { schema: "trident-fixture/1",
  provenance: `EUR/USD 1H live from the dashboard tv-feed (the alive IDE's own bars)`,
  cells: [{ pair: "EUR/USD", timeframe: "1H", bars: bars.map(norm) }] };
writeFileSync(OUT, JSON.stringify(doc));
console.log("wrote", OUT, "bars", bars.length, "first", JSON.stringify(bars[0]), "last", JSON.stringify(bars[bars.length - 1]));
