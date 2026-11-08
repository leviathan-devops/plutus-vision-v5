#!/usr/bin/env bun
// _cdp_probe.mjs — inspect the alive Plutus Dashboard (CDP :9225): find the Pine shell + frames.
const PORT = process.argv[2] || "9225";
const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
for (const t of list) {
  if (t.type !== "page") continue;
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
  let n = 0;
  const call = (method, params = {}) => new Promise((ok) => {
    const id = ++n;
    const h = (e) => { const d = JSON.parse(e.data); if (d.id === id) { ws.removeEventListener("message", h); ok(d); } };
    ws.addEventListener("message", h);
    ws.send(JSON.stringify({ id, method, params }));
  });
  const r = await call("Runtime.evaluate", {
    expression: `(() => ({
      url: location.href.slice(0,60),
      shell: typeof window.PlutusPineShell,
      pineGlobals: Object.keys(window).filter(k => /pine|plutus|shell/i.test(k)).slice(0,10),
      iframes: [...document.querySelectorAll('iframe,webview')].map(f => (f.src||f.getAttribute('src')||'').slice(0,60)),
      editorTabs: [...document.querySelectorAll('[class*=tab],[class*=Tab]')].map(e => (e.textContent||'').trim().slice(0,24)).filter(Boolean).slice(0,12)
    }))()`, returnByValue: true
  });
  console.log(JSON.stringify({ target: t.title, ...r.result?.result?.value }, null, 1));
  ws.close();
}
