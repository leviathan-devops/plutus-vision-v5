# ARCHIVE_INDEX — the pre-v5 tree (frozen 2026-11-08)

## Scope

Operator ruling, verbatim: “Everything that currently sits in the Git beyond the V one baseline checkpoint that I've already established as a floor, you can put in an archive folder. We don't need to we're basically rebuilding the entire thing from scratch. So don't let any mess exist.”

- Live floor retained at `Checkpoints/v1-ship-approved-working-baseline/`.
- Live authorities retained at `Original_Canon_Data/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md`, `Original_Canon_Data/TRIDENT_v5.3.3_CORRECTED_E3_ENGINE.md`, and `MASTER_CONTEXT/OPERATOR_RULINGS_PV.md`.
- Live v5 design retained at `design/DESIGN_BLUEPRINT_v5.0_CLOUDFLARE.md` and `design/BUILD_WORKFLOW_v5.0_CLOUDFLARE.md`.
- Everything else from the pre-clean state is frozen below this directory and is not build input.

## Provenance

- Branch at freeze: `step_agent`
- HEAD at freeze: `f5ad6f724a7bb870b9a8272cf35c88af8e37f188`
- External safety bundle: `/home/leviathan/JARVIS_WORKSPACE/ARCHIVES/PLUTUS_VISION/pre-v5-2026-11-08/plutus-vision.bundle`
- Worktree status at freeze: `    336  D;    108 ??;     43  M;`
- Recent history at freeze:

  f5ad6f7 docs(plutus-browser): record the Workers VPC routing proof and resolve the routing notes
  0fc9fd2 feat(plutus-browser): the host tool - CLI on the computer-use v2 core, verb table, OMP extension, deploy
  c442b62 feat(plutus-browser): the headed browser runtime — forked, tested E2E, packaged
  34ac940 build(dist): mirror the deployed Pinebox tree (scripts/pinebox) at PINEBOX 65fb8ef - 13 files byte-identical to PINEBOX pinebox-cli (cmp 0 differ) + judge/phases.json; deploy.sh status IDENTICAL 217 files; fork/ stays recorded in PINEBOX only
  cd89dad docs(ship): mirror SPEC_VIOLATION_LOG re-verification and the F-192 closing entry (PINEBOX GAP_FIREWALL 0 open of 17)

## Layout

- `head/` — every tracked path beyond the retained floor, extracted verbatim from `git archive f5ad6f724a7bb870b9a8272cf35c88af8e37f188`.
- `uncommitted-2026-11-08/` — the modified and untracked worktree files that had not reached git, excluding runtime state (`.wrangler/`, `__pycache__/`, `node_modules/`, sqlite/wal/shm files, \*.pyc, source maps).

## Recovery

```bash
git -C /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION show f5ad6f724a7bb870b9a8272cf35c88af8e37f188:<path>
git -C /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION bundle verify /home/leviathan/JARVIS_WORKSPACE/ARCHIVES/PLUTUS_VISION/pre-v5-2026-11-08/plutus-vision.bundle
```

This directory is frozen. The commit gates reject later edits under `archive/`; reopening anything here requires a new operator ruling.
