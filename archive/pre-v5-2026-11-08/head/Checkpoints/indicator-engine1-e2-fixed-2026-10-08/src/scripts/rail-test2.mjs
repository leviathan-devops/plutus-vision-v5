const mod = await import("/home/leviathan/.omp/agent/extensions/computer-use/index.js");
const mk = (t) => { const o = { type: t }; o.optional = () => ({ type: t, optional: true }); return o; };
const pi = { zod: { string: () => mk("s"), number: () => mk("n"), boolean: () => mk("b"), object: (s) => ({ shape: s }) },
             registerTool: (t) => { globalThis.__tool = t; } };
mod.default(pi);
const tool = globalThis.__tool;
const call = async (args) => {
  const r = await tool.execute(args);
  const text = (r.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
  return { text, img: (r.content || []).find((c) => c.type === "image"), isError: !!r.isError, d: r.details || {} };
};
const show = (n, s) => console.log(`\n── ${n} ${"─".repeat(Math.max(0, 56 - n.length))}\n${s}`);
const mark = (r, want) => (r.isError === want ? "✓" : "✗ RAIL BROKEN");

await call({ action: "reset" });

// THEATICAL SHAPE 1 · claim with nothing looked at
let r = await call({ action: "claim" });
show("T1 claim with no evidence", `${mark(r, true)} ${r.text.split("\n")[0]}`);

// bind + look (one call — the read-tool equivalent)
r = await call({ action: "look", title: "Plutus Vision" });
show("T2 look (one call)", `${r.img ? "image ✓" : "image ✗"}  sha ${r.d.sha?.slice(0, 12)}  bytes ${r.d.bytes}`);

// THEATRE 2 · PASS with deltas
await call({ action: "expect", expectation: "EURUSD 1H indicator render" });
await call({ action: "click", x: 300, y: 400 });
r = await call({ action: "screenshot" });
r = await call({ action: "verdict", verdict: "PASS", found: "zones and labels render", missing: "", wrong: "CHoCH labels overlap badly" });
show("T3 PASS with deltas", `${mark(r, true)} ${r.text.split("\n")[0]}`);
r = await call({ action: "verdict", verdict: "PASS", wrong: "CHoCH overlap", force: 1 });
show("T4 PASS forced with override", `${mark(r, false)} ${r.text.split("\n")[0]}\n  (override logged)`);

// THEATRE 3 · ack with no reason
await call({ action: "click", x: 200, y: 300 });
r = await call({ action: "ack" });
show("T5 ack with no reason", `${mark(r, true)} ${r.text.split("\n")[0]}`);
r = await call({ action: "ack", note: "the change is visible in the station log line, not in a frame" });
show("T6 ack with reason", `${mark(r, false)} ${r.text.split("\n")[0]}`);

// an honest FAIL, then claim
await call({ action: "expect", expectation: "EURUSD 1H: no overlapping labels in a 200px band" });
await call({ action: "click", x: 100, y: 100 });
await call({ action: "screenshot" });
r = await call({ action: "verdict", verdict: "FAIL", found: "all four subsystems render", wrong: "CHoCH labels overlap across x 1020-1330, y 474-523" });
show("T7 honest FAIL", `${mark(r, false)} ${r.text.split("\n")[0]}`);
r = await call({ action: "claim" });
show("T8 claim with evidence", `${mark(r, false)} ${r.text.split("\n").slice(0, 5).join("\n")}`);
r = await call({ action: "report" });
show("T9 audit surface", r.text);
