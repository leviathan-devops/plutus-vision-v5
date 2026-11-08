#!/usr/bin/env node
// cdp.mjs - drive a BROWSER window through the DevTools protocol, never through X.
//
// WHY (blueprint section 7A, the drive/capture invariant):
//   "for a BROWSER window the capture goes through Page.captureScreenshot, which is
//    in-process and therefore CANNOT raise the window. The X path is used only for
//    non-browser windows."
// CDP dispatches events INTO the page's own event loop. The window manager is never
// consulted, so nothing is raised or focused. MEASURED on a replica display: screenshot,
// click, type and evaluate each left the operator's focus and stack untouched.
//
// Usage: node cdp.mjs <port> <verb> [args...]       (JSON on stdout, exit 0)
//   targets                       list the page targets
//   screenshot <out.png>          Page.captureScreenshot
//   click <x> <y> [button]        Input.dispatchMouseEvent (page CSS pixels)
//   type <text>                   Input.dispatchKeyEvent per character
//   key <name|ctrl+a|...>         one key chord
//   evaluate <expression>         Runtime.evaluate, awaitPromise, returnByValue
//   wait-load [ms]                resolve when document.readyState is complete
// Env: CDP_URL_CONTAINS selects the target whose URL contains this substring.
// A refusal prints "REFUSED  <TOKEN>  -  <detail>" on stderr and exits 1.

import { writeFileSync } from "node:fs";

const [port, verb, ...args] = process.argv.slice(2);
const refuse = (token, detail) => { console.error(`REFUSED  ${token}  —  ${detail}`); process.exit(1); };
if (!port || !verb) refuse("BAD_ARGS", "usage: cdp.mjs <port> <verb> [args...]");

async function listTargets() {
  const r = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(3000) });
  return r.json();
}

async function pickTarget() {
  const want = process.env.CDP_URL_CONTAINS || "";
  let last = "no attempt", seen = [];
  for (let i = 0; i < 40; i++) {
    try {
      const list = await listTargets();
      seen = list.map((t) => `${t.type}:${t.url}`);
      const pages = list.filter((t) => t.type === "page" && t.webSocketDebuggerUrl);
      const hit = (want ? pages.find((t) => (t.url || "").includes(want)) : pages[0]);
      if (hit) return hit;
      last = `CDP :${port} reachable, no matching page target`;
    } catch (e) {
      last = `CDP :${port} unreachable — ${String(e.message || e).slice(0, 80)}`;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  refuse("NO_PAGE", `${last}; targets: ${JSON.stringify(seen)}`);
}

if (verb === "targets") {
  try { console.log(JSON.stringify({ ok: true, port: Number(port), targets: await listTargets() })); process.exit(0); }
  catch (e) { refuse("NO_PAGE", `CDP :${port} unreachable — ${String(e.message || e).slice(0, 80)}`); }
}

const target = await pickTarget();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error("websocket error")); })
  .catch((e) => refuse("NO_PAGE", `cannot open the target websocket: ${e.message}`));

let seq = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
const call = (method, params = {}) =>
  new Promise((res) => {
    const id = ++seq;
    pending.set(id, res);
    ws.send(JSON.stringify({ id, method, params }));
  });

await call("Runtime.enable");
await call("Page.enable");

const KEYS = {
  Enter: [13, "Enter"], Tab: [9, "Tab"], Escape: [27, "Escape"], Backspace: [8, "Backspace"],
  Delete: [46, "Delete"], ArrowLeft: [37, "ArrowLeft"], ArrowUp: [38, "ArrowUp"],
  ArrowRight: [39, "ArrowRight"], ArrowDown: [40, "ArrowDown"], Home: [36, "Home"],
  End: [35, "End"], PageUp: [33, "PageUp"], PageDown: [34, "PageDown"], Space: [32, " "],
};

let out;
if (verb === "screenshot") {
  const r = await call("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  if (!r.result?.data) refuse("CAPTURE_FAILED", JSON.stringify(r).slice(0, 200));
  const buf = Buffer.from(r.result.data, "base64");
  const path = args[0] || "shot.png";
  writeFileSync(path, buf);
  out = { ok: true, verb, path, bytes: buf.length, via: "cdp" };

} else if (verb === "click") {
  const x = Number(args[0] ?? 0), y = Number(args[1] ?? 0);
  const btn = { 1: "left", 2: "middle", 3: "right" }[Number(args[2] ?? 1)] || "left";
  await call("Input.dispatchMouseEvent", { type: "mouseMoved", x, y, button: "none" });
  await call("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: btn, clickCount: 1 });
  await call("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: btn, clickCount: 1 });
  out = { ok: true, verb, x, y, button: btn, via: "cdp" };

} else if (verb === "type") {
  const text = args.join(" ");
  for (const ch of text) {
    await call("Input.dispatchKeyEvent", { type: "keyDown", text: ch, unmodifiedText: ch, key: ch });
    await call("Input.dispatchKeyEvent", { type: "keyUp", key: ch });
  }
  out = { ok: true, verb, chars: [...text].length, via: "cdp" };

} else if (verb === "key") {
  const chord = (args[0] ?? "Enter").split("+");
  const name = chord.pop();
  const mods = chord.reduce((m, c) => m | ({ alt: 1, ctrl: 2, meta: 4, shift: 8 }[c.toLowerCase()] || 0), 0);
  const [vk, key] = KEYS[name] ?? [name.length === 1 ? name.toUpperCase().charCodeAt(0) : 0, name];
  await call("Input.dispatchKeyEvent", { type: "rawKeyDown", windowsVirtualKeyCode: vk, key, modifiers: mods });
  await call("Input.dispatchKeyEvent", { type: "keyUp", windowsVirtualKeyCode: vk, key, modifiers: mods });
  out = { ok: true, verb, key: args[0] ?? "Enter", via: "cdp" };

} else if (verb === "evaluate") {
  const r = await call("Runtime.evaluate", { expression: args.join(" "), awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) refuse("EVAL_FAILED", JSON.stringify(r.result.exceptionDetails).slice(0, 240));
  out = { ok: true, verb, value: r.result?.result?.value ?? null, via: "cdp" };

} else if (verb === "wait-load") {
  const limit = Number(args[0] ?? 15000), t0 = Date.now();
  let state = "";
  while (Date.now() - t0 < limit) {
    const r = await call("Runtime.evaluate", { expression: "document.readyState", returnByValue: true });
    state = r.result?.result?.value;
    if (state === "complete") break;
    await new Promise((r) => setTimeout(r, 200));
  }
  if (state !== "complete") refuse("PAGE_NOT_LOADED", `document.readyState is '${state}' after ${limit}ms`);
  out = { ok: true, verb, readyState: state, via: "cdp" };

} else {
  refuse("BAD_VERB", `unknown cdp verb '${verb}'`);
}

ws.close();
console.log(JSON.stringify(out));
process.exit(0);
