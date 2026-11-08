#!/usr/bin/env bun
// _cdp_doreload.mjs — reload the dashboard renderer (clears all studies), wait, report readiness.
async function targets() { return (await (await fetch("http://127.0.0.1:9225/json/list")).json()); }
let list = await targets();
let page = list.find((t) => t.type === "page" && t.title === "Plutus Dashboard");
let ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
let n = 0;
const call = (m, p = {}) => new Promise((ok) => { const id = ++n; const h = (e) => { const d = JSON.parse(e.data); if (d.id === id) { ws.removeEventListener("message", h); ok(d); } }; ws.addEventListener("message", h); ws.send(JSON.stringify({ id, method: m, params: p })); });
await call("Page.reload", { ignoreCache: true });
console.log("reload sent");
ws.close();
await Bun.sleep(12000);
// reconnect and check
list = await targets();
page = list.find((t) => t.type === "page" && t.title === "Plutus Dashboard") || list.find(t => t.type === "page");
if (!page) { console.log("NO_PAGE after reload"); process.exit(0); }
ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
n = 0;
const r = await call("Runtime.evaluate", { expression: `(() => ({ title: document.title, shell: typeof window.PlutusPineShell, tabs: [...document.querySelectorAll('button,[role=tab],.tab')].map(b=>b.textContent.trim()).filter(t=>/PINE IDE|CHART|DATA/i.test(t)).slice(0,6) }))()`, returnByValue: true });
console.log("POST", JSON.stringify(r.result?.result?.value));
ws.close();
