const mod = await import("/home/leviathan/.omp/agent/extensions/computer-use/index.js");
const mk = (t) => { const o = { type: t }; o.optional = () => ({ type: t, optional: true }); return o; };
const pi = { zod: { string: () => mk("s"), number: () => mk("n"), boolean: () => mk("b"), object: (s) => ({ shape: s }) },
             registerTool: (t) => { globalThis.__tool = t; } };
mod.default(pi);
const tool = globalThis.__tool;
const call = async (args) => {
  const r = await tool.execute(args);
  return { text: (r.content || []).filter(c => c.type === "text").map(c => c.text).join("\n"),
           img: (r.content || []).find(c => c.type === "image"), isError: !!r.isError, d: r.details || {} };
};
const step = process.argv[2];
const arg = process.argv[3];
const OUT = "/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/vil/direct";
// state is per-process, so rebind the window on every invocation (idempotent, cheap)
const REBIND = ["expect", "click", "look", "verdict", "report"];
if (step !== "reset" && REBIND.includes(step)) {
  await call({ action: "focus", title: "Plutus Vision" });
}

if (step === "reset") {
  await call({ action: "reset" });
  await call({ action: "focus", title: "Plutus Vision" });
  await call({ action: "plan", plan: "Timeframe sweep on the live Pine IDE: expect -> click selector -> look(menu) -> click TF -> look(chart) -> read -> verdict." });
  console.log("bound:", (await call({ action: "look", out: `${OUT}/00-bound.png` })).text.split("\n")[2]);
}
if (step === "expect") { console.log((await call({ action: "expect", expectation: arg })).text.split("\n")[0]); }
if (step === "click") {
  const r = await call({ action: "click", x: +arg.split(",")[0], y: +arg.split(",")[1] });
  console.log(r.text.split("\n").slice(0, 2).join(" | "));
}
if (step === "look") {
  const r = await call({ action: "look", out: `${OUT}/${arg}.png` });
  console.log(r.text.split("\n").slice(1, 3).join(" | "));
}
if (step === "verdict") {
  const r = await call({ action: "verdict", verdict: arg.split("|")[0], found: arg.split("|")[1] || "", wrong: arg.split("|")[2] || "", missing: arg.split("|")[3] || "" });
  console.log(r.text.split("\n").slice(0, 4).join("\n"));
}
if (step === "report") console.log((await call({ action: "report" })).text);
