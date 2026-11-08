#!/usr/bin/env bun
// pv-eval — evaluate one JS expression in the running Pine IDE page (CDP :9222); prints the result.
//   bun pv-eval.mjs "document.querySelector('[data-pv-settings]').click()"
const expr = process.argv[2];
const page = (await (await fetch("http://127.0.0.1:9222/json/list")).json()).find((t) => t.type === "page" && t.url.includes(":9851/pine.html"));
if (!page) { console.error("NO_PAGE"); process.exit(1); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((ok) => (ws.onopen = ok));
ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: `(async()=>{return (${expr})})()`, awaitPromise: true, returnByValue: true } }));
const r = await new Promise((ok) => (ws.onmessage = (e) => { const d = JSON.parse(e.data); if (d.id === 1) ok(d); }));
ws.close();
const v = r.result?.result;
if (r.result?.exceptionDetails) { console.error("EVAL_ERROR", JSON.stringify(r.result.exceptionDetails).slice(0, 300)); process.exit(1); }
console.log(typeof v?.value === "string" ? v.value : JSON.stringify(v?.value));
