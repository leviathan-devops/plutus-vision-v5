#!/usr/bin/env bun
/**
 * charts/build.mjs — builds charts/workbench.bundle.js (bun build + ONE patch to vendored Vela).
 *
 * THE PATCH (Vela 0.8.0, Apache-2.0 — modified here, notice kept): the status line formats every
 * OHLC value with `decimalsFor(bar.close)` = `a >= 1 ? 2 : …` — EURUSD 1.13384 renders "1.13", an FX
 * chart that cannot show a pip. The rule is replaced by a magnitude rule that shows a pip on every
 * instrument class the shell charts (FX 5dp, JPY/DXY 3dp, gold/indices/crypto 2dp). The build FAILS
 * LOUDLY (VELA_PATCH_TARGET_ABSENT) if the vendored source no longer carries the exact text — a Vela
 * upgrade is re-examined, never silently shipped unpatched.
 */
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const ORIGINAL = 'function decimalsFor(ref) {\n  const a = Math.abs(ref);\n  return a >= 1 ? 2 : a >= 0.01 ? 4 : 6;\n}';
const PATCHED = 'function decimalsFor(ref) {\n  const a = Math.abs(ref);\n  return a >= 1000 ? 2 : a >= 10 ? 3 : a >= 0.01 ? 5 : 6; // PLUTUS PATCH: pip-true FX/JPY/index decimals\n}';

let hits = 0;
const velaPatch = {
  name: 'vela-decimals',
  setup(build) {
    build.onLoad({ filter: /@luxalgo[\\/]vela[\\/]dist[\\/].*\.js$/ }, async (args) => {
      const src = await Bun.file(args.path).text();
      const resolveDir = path.dirname(args.path); // relative imports inside the vendored file resolve from ITS dir
      if (!src.includes('function decimalsFor(')) return { contents: src, loader: 'js', resolveDir };
      if (!src.includes(ORIGINAL)) throw new Error(`VELA_PATCH_TARGET_ABSENT: decimalsFor changed in ${args.path}`);
      const copies = src.split('function decimalsFor(').length - 1;
      if (copies !== 1) throw new Error(`VELA_PATCH_COPIES: ${copies} decimalsFor definitions in ${args.path} — patch every one or re-examine`);
      hits++;
      return { contents: src.replace(ORIGINAL, PATCHED), loader: 'js', resolveDir };
    });
  },
};

const out = await Bun.build({
  entrypoints: [path.join(HERE, 'workbench.js')],
  outdir: HERE, naming: 'workbench.bundle.js', format: 'esm', target: 'browser',
  define: { 'process.env.NODE_ENV': '"production"' }, plugins: [velaPatch],
});
if (!out.success) { for (const l of out.logs) console.error(l); process.exit(1); }
if (hits !== 1) { console.error(`VELA_PATCH_COUNT: expected 1 patched module, got ${hits}`); process.exit(3); }
console.log(`[charts/build] workbench.bundle.js · vela decimals patch applied (${hits})`);
