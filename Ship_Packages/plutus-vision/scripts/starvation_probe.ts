// starvation_probe.ts — I-3: parse the merged file, assert all 4 subsystems
// draw AND every drop counter is wired. Exit 0 PASS / 1 FAIL.
import { readFileSync } from "node:fs";
const f = process.argv[2] ?? "plutus-vision-v0.pine";
const t = readFileSync(f, "utf8");
const rows: Array<[string, boolean, string]> = [];
const has = (re: RegExp) => re.test(t);
rows.push(["smc draws", /smc_drawStructure|smc_drawOrderBlocks|smc_drawPremiumDiscountZones/.test(t), "structure/OB/zones fns"]);
rows.push(["sweeps draws", /swp_break_box|swp_line/.test(t), "sweep box + line fns"]);
rows.push(["voids draws", /box\.new\(.*voi_|voi_lqV/.test(t), "13-slice void boxes"]);
rows.push(["pools draws", /bsl_b_liq_B|bsl_b_liq_S/.test(t), "pool arrays"]);
for (const c of ["smc_drops", "swp_drops", "voi_drops", "bsl_drops"])
  rows.push([c + " wired", t.includes(`var int ${c} = 0`) && t.includes(`${c} += 1`), "decl + increment"]);
rows.push(["budget 200/125/100/75", /SMC cap 200/.test(t) && /SWEEPS cap 125/.test(t) && /VOIDS cap 100/.test(t) && /POOLS cap 75/.test(t), "§16 split"]);
rows.push(["attribution", (t.match(/LuxAlgo/g) ?? []).length >= 1, "CC header"]);
let fail = 0;
for (const [n, ok, why] of rows) { console.log(`${ok ? "PASS" : "FAIL"}  ${n}  (${why})`); if (!ok) fail = 1; }
process.exit(fail);
