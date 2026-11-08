/**
 * rail-test — proves the computer-use rails actually refuse, against the LIVE :3 display
 * and the real Pine IDE window. Not a unit test: it performs real X input and real capture.
 */
const mod = await import("/home/leviathan/.omp/agent/extensions/computer-use/index.js");

// minimal pi.zod shim: the real host passes callable factories
const mk = (t) => { const o = { type: t }; o.optional = () => ({ type: t, optional: true }); return o; };
const zstr = () => mk("string");
const znum = () => mk("number");
const zbool = () => mk("boolean");
const pi = {
  zod: { string: zstr, number: znum, boolean: zbool, object: (s) => ({ shape: s }) },
  registerTool: (t) => { globalThis.__tool = t; },
};
mod.default(pi);
const tool = globalThis.__tool;
console.log("registered tool:", tool.name, "|", tool.label);

const call = async (args) => {
  const r = await tool.execute(args);
  const text = (r.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
  const img = (r.content || []).find((c) => c.type === "image");
  return { text, img, isError: !!r.isError, details: r.details || {} };
};
const line = (n, s) => console.log(`\n── ${n} ${"─".repeat(Math.max(0, 58 - n.length))}\n${s}`);

// 1 · displays
let r = await call({ action: "displays" });
line("1 displays", r.text.split("\n").slice(0, 3).join("\n") + `\n[${(r.details.displays || []).length} displays found]`);

// 2 · focus the real Pine IDE
r = await call({ action: "focus", title: "Plutus Vision" });
line("2 focus", r.text);
const win = r.details.id;

// 3 · a REAL mutation (click inside the chart, harmless) → must mark unobserved
r = await call({ action: "click", x: 400, y: 500 });
line("3 click (mutation)", r.text);

// 4 · THE RAIL: verdict must be REFUSED because we have not looked
r = await call({ action: "verdict", verdict: "PASS", found: "everything is perfect" });
line("4 verdict WITHOUT looking", `${r.isError ? "REFUSED ✓" : "ALLOWED ✗ RAIL BROKEN"}\n${r.text.split("\n").slice(0, 4).join("\n")}`);

// 5 · THE RAIL: expectation must be required
r = await call({ action: "screenshot" });
line("5 screenshot", `image block returned: ${r.img ? "YES ✓ (" + r.img.mimeType + ")" : "NO ✗"}\nsha256: ${r.details.sha?.slice(0, 16)}  bytes: ${r.details.bytes}  path: ${r.details.path}`);
r = await call({ action: "verdict", verdict: "PASS", found: "looked, all good" });
line("6 verdict WITHOUT expectation", `${r.isError ? "REFUSED ✓" : "ALLOWED ✗ RAIL BROKEN"}\n${r.text.split("\n").slice(0, 3).join("\n")}`);

// 7 · the correct order: expect → interact → look → verdict
r = await call({ action: "expect", expectation: "EURUSD 1H: candles, the Plutus Vision legend row, SMC labels, zone boxes; nothing clipped" });
line("7 expect", r.text);
r = await call({ action: "click", x: 300, y: 400 });
line("8 interact", r.text.split("\n")[0] + `\n(unobserved: ${r.details.unobserved})`);
r = await call({ action: "verdict", verdict: "PASS" });
line("9 verdict still unobserved", `${r.isError ? "REFUSED ✓" : "ALLOWED ✗ RAIL BROKEN"} — ${r.text.split("\n")[0]}`);
r = await call({ action: "screenshot" });
line("10 screenshot", `image: ${r.img ? "YES ✓" : "NO ✗"}  sha ${r.details.sha?.slice(0, 12)}  unobserved now ${r.details.unobserved}`);
r = await call({ action: "verdict", verdict: "PASS", found: "candles + legend + labels + zones all present", missing: "", wrong: "" });
line("11 verdict WITH look + expectation", r.text);

// 8 · ack path (ack without looking is permitted but logged)
r = await call({ action: "click", x: 200, y: 300 });
const unobs = r.details.unobserved;
r = await call({ action: "ack" });
line("12 ack without look", `${r.text}\n(interactions it claimed: ${unobs} — logged as a gap, not silently dropped)`);

// 9 · report
r = await call({ action: "report" });
line("13 report", r.text);
