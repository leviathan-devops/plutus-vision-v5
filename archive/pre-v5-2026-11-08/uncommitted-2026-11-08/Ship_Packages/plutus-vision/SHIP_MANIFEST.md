# SHIP MANIFEST — PLUTUS VISION · computer-control cycle

| field | value |
|---|---|
| version | `2026.10.26-1` |
| source path | `/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION` |
| deployment fingerprint | `653eea1a5fc4c01a744a7097c79a27e173d860402da494a05f205e2b77e80406` |
| git HEAD (source) | `829287b` |
| package files | 4233 |
| source files under src/ | 467 |
| audit verdict | see PACKAGE_AUDIT.md |

## PER-ARTIFACT SHA TABLE (the packaged bytes)

| path | KB | sha16 |
|---|---|---|
| dist/plutus-vision-v2.pine | 124 | `653eea1a5fc4c01a` |
| dist/computer-use-v2/MANIFEST.sha256 | 7 | `e15c9776ab6f4b96` |
| dist/computer-use-v2/deploy.sh | 6 | `250ce6623cbee98b` |
| dist/pinebox/pinebox | 15 | `4ae6b8f57b7626da` |
| dist/pinebox/inject.py | 5 | `504418c966ba788f` |

## CONTENTS

| dir | what it is |
|---|---|
| `dist/` | the artefacts this cycle ships, with measured SHAs above |
| `src/` | the full source trees: pine-ide, scripts, gates, fixtures, spec, sources, tests |
| `context_management/` | the 14 canon docs (U1-U4 green) |
| `MASTER_CONTEXT/` | the operator's authority corpus |
| `Checkpoints/` | every checkpoint dir with its manifest |
| `design/` | both design blueprints, with the measured amendments |
| `handovers/` | the operator-provided context packs (archives excluded: > GitHub's 100 MB limit) |
| the 8 root ship docs | BUILD_REPORT, DEBUG_LOG, FAILURE_LOG, SPEC_VIOLATION_LOG, TESTING_LOG, THEATRICALITY_LOG, VISUAL_CHECKPOINTS_LOG, SHIP_DOCS_MANIFEST |

## DEPLOY

See `DEPLOY.sh`. This tool has no build step: the host runs the source in place, so a deploy is proven
by `deploy.sh verify`, which checks every sealed source file's sha, that each compiled helper is the
build of the current source, that both MCP servers answer, and that `computer probe` selects the
native runtime.
