import { readFileSync } from "node:fs";
import { parseInputSections, buildRows } from "../pine-ide/pine-ide/input_parser_v2.mjs";
import { applyChanges } from "../pine-ide/pine-ide/study-legend.mjs";
const src = readFileSync("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/plutus-vision-v0.pine", "utf8");
const secs = parseInputSections(src);
console.log("sections:", secs.map(s => `${s.name}(${s.inputs.length})`).join("  "));
// change Mode -> Present and Detection Length 7 -> 5
const smc = secs.find(s => s.id === "SMC");
const mode = smc.inputs.find(i => i.name === "modeInput");
const pools = secs.find(s => s.id === "POOLS");
const dlen = pools.inputs.find(i => i.name === "bsl_liqLen");
const out = applyChanges(src, [{ input: mode, value: "Present" }, { input: dlen, value: 5 }]);
console.log("\nSMC modeInput ->", out.split("\n")[mode.line - 1].trim().slice(0, 80));
console.log("POOLS bsl_liqLen ->", out.split("\n")[dlen.line - 1].trim().slice(0, 80));
// drift guard
try { applyChanges(src, [{ input: { ...mode, raw: "WRONG" }, value: "x" }]); console.log("DRIFT GUARD: MISSING"); }
catch (e) { console.log("DRIFT GUARD:", e.code); }
