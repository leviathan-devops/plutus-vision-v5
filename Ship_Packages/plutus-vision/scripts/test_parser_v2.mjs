import { readFileSync } from "node:fs";
import { parseInputSections, buildRows, prettyName } from "./input_parser_v2.mjs";

const src = readFileSync("/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/plutus-vision-v0.pine", "utf8");
const sections = parseInputSections(src);
console.log(`sections: ${sections.length}`);
let total = 0;
for (const s of sections) {
  const rows = buildRows(s.inputs);
  total += s.inputs.length;
  const groups = [];
  for (const inp of s.inputs) if (inp.group && !groups.includes(inp.group)) groups.push(inp.group);
  console.log(`\n── ${s.name} (${s.id}) · ${s.inputs.length} inputs · ${rows.length} rows`);
  console.log(`   groups: ${groups.join(" | ") || "(none)"}`);
  for (const r of rows.slice(0, 6)) {
    const extra = r.members.length > 1 ? `  [+${r.members.length - 1} inline]` : "";
    const kinds = r.members.map((m) => m.kind).join("/");
    console.log(`   · ${r.label.padEnd(34)} ${kinds}${extra}`);
  }
  if (rows.length > 6) console.log(`   … ${rows.length - 6} more rows`);
}
console.log(`\nTOTAL inputs parsed: ${total}`);

// the specific defect the operator screenshotted
const smc = sections.find((s) => s.id === "SMC");
const ib = buildRows(smc.inputs).filter((r) => r.key.startsWith("ibull@") || r.key.startsWith("ibear@"));
console.log("\n=== the empty-title colour inputs (the screenshot defect) ===");
for (const r of ib) console.log(`  ${r.key} → label "${r.label}" · members ${r.members.map((m) => m.name + "(" + m.kind + ")").join(", ")}`);
console.log(`\nprettyName fallback: ${prettyName("internalBullColorInput")} | ${prettyName("voi_lqTH")} | ${prettyName("bsl_marBuy")}`);