# PACKAGE AUDIT — PLUTUS VISION · 2026.10.26-1

**VERDICT: PASS**

## MECHANICAL CHECKS

| check | result |
|---|---|
| every artifact in DEPLOY.sh exists in the package | PASS |
| the manifest's SHA table matches the packaged bytes | PASS |
| the three generated docs are present | PASS |
| zero secret patterns after redaction | PASS |
| the 8 root ship docs present | PASS |
| context_management present (14 docs) | PASS |
| every checkpoint dir has its manifest | PASS |

## ARTEFACT SHAS (the packaged bytes)

| path | KB | sha16 |
|---|---|---|
| dist/plutus-vision-v2.pine | 124 | `653eea1a5fc4c01a` |
| dist/computer-use-v2/MANIFEST.sha256 | 7 | `e15c9776ab6f4b96` |
| dist/pinebox/pinebox | 15 | `4ae6b8f57b7626da` |
| dist/pinebox/inject.py | 5 | `504418c966ba788f` |

## DOCS PRESENT

- BUILD_REPORT.md — 1201 lines
- DEBUG_LOG.md — 292 lines
- FULL_BUILD_CONTEXT.md — 455 lines
- SHIP_MANIFEST.md — 41 lines
- DEPLOY.sh — 21 lines
- GIT_HISTORY.md — 636 lines
- MASTER_INDEX.md — 46 lines

## HONEST GAPS CARRIED INTO THE PACKAGE

1. **AUDIT GATE BLOCKED** — the mandated `code-review` artefact does not exist (`OCR_MISSING`), so no
   ship-ready claim is made BY THIS PACKAGE either. This audit is mechanical (checks + shas), not the LLM gate.

2. BUILD_REPORT / DEBUG_LOG / FULL_BUILD_CONTEXT are BELOW their skill floors; each carries a
   thin-session note naming its line count. They were not inflated.

3. **`NO_FRESH_FRAME` is written but its two-way proof is incomplete** — the run reached WEEK_MISMATCH
   first (an empty week control on a fresh instance), and that false refusal has since been fixed by
   making `up` set the week. The predicate's positive side (a re-render yields a new frame) is proven;

   its must-fail side is NOT. Do not cite it as proven.

4. V11 (guest) unproven, V12 (agentOS) not built, E2 geometry discarded.
