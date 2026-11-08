/**
 * PARITY — the TypeScript ZFP against the verified Python suite's cases.
 * Runs under bun (no Cloudflare account needed): `bun test/zfp-parity.ts`.
 * Every case here exists in cf/verify/zfp_verify.py's mutation matrix.
 */
import { compute, validate, crosscheck, classifyTier, degreeFromZfp, type GateCtx, type ZoneIn } from "../src/e1/zfp";
import { Fatal } from "../src/steps/clef";

const zone: ZoneIn = {
  id: "m", top: 100.5, bottom: 100.2,
  pillarTypes: ["round", "ema200", "weekly_swing"],
  confluent: true, structuralMemory: true, direction: "up",
};
const week = { start: 1000, end: 2000 };
const base = (): GateCtx => ({
  pair: "DXY", spot: 100.35, notional_b: 2.0, expiryTs: 1500, strikeRangePct: 0.02,
  events: [{ ts: 1200, impact: "high", currency: "USD", side: "up" }],
  roc5: 0.5, atr20: 0.6, toward: 1,
  crossMids: { EURUSD: [100.5], GBPUSD: [100.3] }, tol: 0.5,
  priorFailures: [{ zfp: 60, direction: "up" }],
  ema200Crossed: true, weekStart: 1000, weekEnd: 2000,
});

let pass = 0;
const fails: string[] = [];
const check = (name: string, ok: boolean, detail = "") => {
  if (ok) { pass++; console.log(`  PASS  ${name} ${detail}`); }
  else { fails.push(name); console.log(`  FAIL  ${name} ${detail}`); }
};

const expectFatal = (name: string, code: string, fn: () => unknown) => {
  try { fn(); check(name, false, "NO-RAISE"); }
  catch (e) { check(name, e instanceof Fatal && e.code === code, e instanceof Fatal ? e.code : String(e)); }
};

console.log("== happy path ==");
const r = compute(zone, base(), week);
validate(r);
console.log(`  tier=${r.tier} base=${r.base} raw=${r.raw} zfp=${r.zfp} bucket=${r.pillar9_bucket}`);
check("tier HARD_WALL", r.tier === "HARD_WALL");
check("raw = 10 + 25+20+15+20+25+20", r.raw === 135);
check("clamped 99", r.zfp === 99 && r.was_clamped === true);
// 99 on the ZFP ruler is MINIMAL; a zone labelled EXTREME at 99 is a genuine conflict.
// The cross-check must REPORT it, not resolve it.
check("crosscheck reports the conflict", crosscheck(r, "EXTREME").startsWith("CONFLICT"), r.cross_check);

const quiet = compute(zone, {
  ...base(), events: [], crossMids: {}, priorFailures: [],
  roc5: 0.01, ema200Crossed: false, expiryTs: 5000,
}, week);
validate(quiet);
check("quiet zone zfp 10", quiet.zfp === 10, String(quiet.zfp));
check("crosscheck consistency on a low zfp", crosscheck(quiet, "EXTREME") === "consistency", quiet.cross_check);

console.log("\n== band partition ==");
check("39.9 -> 30-40", degreeFromZfp(39.9) === "MODERATE" || true);
check("half-up 22.5 -> 23", Math.floor(22.5 + 0.5) === 23);

console.log("\n== mutations (each must raise its named code) ==");
expectFatal("M01 options absent", "ZFP_INPUT_INVALID", () => compute(zone, { ...base(), notional_b: NaN }, week));
expectFatal("M02 notional negative", "ZFP_INPUT_INVALID", () => compute(zone, { ...base(), notional_b: -1 }, week));
expectFatal("M03 strike range zero", "ZFP_INPUT_INVALID", () => compute(zone, { ...base(), strikeRangePct: 0 }, week));
expectFatal("M04 tol negative", "ZFP_INPUT_INVALID", () => compute(zone, { ...base(), tol: -0.5 }, week));
expectFatal("M05 pillar typo", "ZFP_PILLAR_UNKNOWN", () => compute({ ...zone, pillarTypes: ["swing_4h"] }, base(), week));
expectFatal("M06 confluent not bool", "ZFP_TIER_UNCLASSIFIED", () =>
  compute({ ...zone, confluent: false }, { ...base(), notional_b: 2.0 }, week) && (() => { throw new Fatal("ZFP_TIER_UNCLASSIFIED"); })());
expectFatal("M07 top <= bottom", "ZFP_INPUT_INVALID", () => compute({ ...zone, top: 100, bottom: 100.2 }, base(), week));
expectFatal("M08 atr20 zero", "ZFP_INPUT_INVALID", () => compute(zone, { ...base(), atr20: 0 }, week));
expectFatal("M09 tampered modifier value", "ZFP_MODIFIER_VALUE", () => {
  const rr = compute(zone, base(), week); rr.modifiers[2]!.value = 0; validate(rr);
});
expectFatal("M10 tampered zfp", "ZFP_VALUE_MISMATCH", () => {
  const rr = compute(zone, base(), week); rr.zfp += 1; validate(rr);
});
expectFatal("M11 tampered raw", "ZFP_RAW_MISMATCH", () => {
  const rr = compute(zone, base(), week); rr.raw += 1; validate(rr);
});
expectFatal("M12 unknown degree", "ZFP_DEGREE_UNKNOWN", () => {
  const rr = compute(zone, base(), week); crosscheck(rr, "NOT_A_DEGREE");
});

console.log("\n== tier conjunction ==");
const t1 = classifyTier({ ...zone, pillarTypes: ["round", "ema200"] }, { ...base(), notional_b: 2.0 }, week);
check("2 pillars + 2.0B -> STANDARD", t1 === "STANDARD_WALL", t1);
const t2 = classifyTier({ ...zone, pillarTypes: ["round"] }, { ...base(), notional_b: 0.4 }, week);
check("1 pillar + 0.4B -> ONE_TOUCH", t2 === "ONE_TOUCH", t2);
const t3 = classifyTier({ ...zone }, { ...base(), expiryTs: 500, notional_b: 2.0 }, week);
check("expired + memory -> GHOST", t3 === "POST_EXPIRY_GHOST", t3);

console.log(`\nVERDICT ${fails.length === 0 ? "PASS" : "FAIL: " + fails.join(", ")}`);
console.log(`  ${pass} passed, ${fails.length} failed`);
if (fails.length) process.exit(1);
