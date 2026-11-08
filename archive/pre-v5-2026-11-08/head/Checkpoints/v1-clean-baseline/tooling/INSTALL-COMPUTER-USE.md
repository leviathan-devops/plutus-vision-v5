# Install `computer-use` from this checkpoint

```bash
mkdir -p ~/.omp/agent/extensions/computer-use
cp tooling/computer-use/index.js ~/.omp/agent/extensions/computer-use/index.js
# add to ~/.omp/agent/config.yml under `extensions:` if absent:
#   - /home/leviathan/.omp/agent/extensions/computer-use/index.js
# restart the session (extensions load at session construction)
```

Prove it loaded, against a live display:

```bash
node scripts/rail-test2.mjs     # drives execute() live; every refusal must fire
```

Requires: `xdotool`, `import` (ImageMagick), `xdpyinfo` on the target display. No npm deps.
