// Probe the LIVE product: can a locked drawing still be deleted through the paths that
// bypassed the canvas guard (single remove + batch remove)?
const list = await (await fetch("http://127.0.0.1:9222/json/list")).json();
const page = list.find((t) => t.type === "page" && t.url.includes("9851"));
if (!page) { console.log("NO_PAGE"); process.exit(1); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => { ws.onopen = r; });
const expr = `(function(){
  var S = window.PlutusPineShell.chart.drawings;
  var all = S.toJSON().drawings;
  var before = all.length;
  var lockedCount = all.filter(function(d){ return d.locked === true; }).length;
  if (!all.length) return JSON.stringify({err:'NO_DRAWINGS'});
  var t = all.find(function(d){ return d.locked === true; }) || all[0];
  var r1 = S.remove(t.id);
  var afterOne = S.toJSON().drawings.length;
  S.removeMany(all.slice(0, 10).map(function(d){ return d.id; }));
  var afterMany = S.toJSON().drawings.length;
  return JSON.stringify({
    total: before, locked: lockedCount, removeReturned: r1,
    afterRemove: afterOne, afterRemoveMany: afterMany,
    verdict: (afterOne === before && afterMany === before) ? 'LOCKED_REMOVE_REFUSED' : 'STILL_DELETABLE'
  });
})()`;
const res = await new Promise((r) => {
  ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: expr, returnByValue: true } }));
  ws.onmessage = (e) => { const d = JSON.parse(e.data); if (d.id === 1) r(d); };
});
ws.close();
console.log(res.result?.result?.value || JSON.stringify(res).slice(0, 300));