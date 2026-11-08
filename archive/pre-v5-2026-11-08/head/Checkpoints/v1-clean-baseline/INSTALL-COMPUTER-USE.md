# Install `computer-use` from this checkpoint

```bash
mkdir -p ~/.omp/agent/extensions/computer-use
cp tooling/computer-use/index.js ~/.omp/agent/extensions/computer-use/index.js
# add under `extensions:` in ~/.omp/agent/config.yml if absent:
#   - /home/leviathan/.omp/agent/extensions/computer-use/index.js
# restart the session (extensions load at session construction)
```

Prove it, against a live display:

```bash
node scripts/rail-test2.mjs     # drives execute() live; every refusal must fire
```

Requires `xdotool`, `import` (ImageMagick), `xdpyinfo` on the target display. No npm deps.

- tool: `tooling/computer-use/index.js` sha256 bc1c52b62965e3b7…
- spec: `docs/PRODUCT_TEST_SPEC.md` (the loop, the C1–C10 crash matrix, the banned substitutes)
- skill: `tooling/computer-use-tool/` (the managed skill that routes to it)
