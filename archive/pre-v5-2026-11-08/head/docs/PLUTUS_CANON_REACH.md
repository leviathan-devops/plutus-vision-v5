# PLUTUS_VISION — the canon graph, and how the reflex reaches it

**Written:** 2026-10-02 · **Scope:** the Plutus Knowledge LSP (`plutus-lsp` in `~/.omp/agent/lsp.json`)

## THE TWO GATES

The PCSL reflex only speaks when BOTH pass. Fixing one is the common half-fix.

| gate | test | state |
|---|---|---|
| **SCOPE** | a path SEGMENT equals `PLUTUS_LSP_SCOPE` (default `PLUTUS`), **or** an ancestor carries a scope FILE (`plutus.yaml`/`.plutus`) below `$HOME` — `store.ts:97` | `PLUTUS_VISION/plutus.yaml` planted |
| **REACH** | `l1PathFor` (`store.ts:246-292`) resolves a **LAW-BEARING** `kg.json` | local graph below |

`PLUTUS_VISION`'s basename is `PLUTUS_VISION`, not `PLUTUS` — the segment test does not match, so
the marker FILE is what brings this tree into scope.

## THE REACH FIX ACTUALLY IN EFFECT

**There is no `env` block in the `plutus-lsp` entry, and there cannot be:** omp's `ServerConfig`
(`omp://lsp-config.md`) has no `env` field. Its fields are `command`, `args`, `fileTypes`,
`languageId`, `rootMarkers`, `initOptions`, `settings`, `disabled`, `warmupTimeoutMs`,
`isLinter`, `capabilities`, `workspaceReadyTimings`. An `env` key is silently ignored, which
leaves the `KNOWN_L1_PATHS` fallback (the one that holds the canon) permanently off.

**So the reach is step 2 of the resolver — a law-bearing `kg.json` at this project root:**

```
PLUTUS_VISION/.omp/graph-intelligence/layers/semantica/kg.json
```

No env var, no global config edit, per-project, auditable. Measured: with the marker alone the
reflex refused `PLUTUS_NO_STORE`; with this graph it publishes.

## THE GRAPH — THE CANON ONLY

Built by filtering the corpus graph
`PLUTUS/MASTER_CONTEXT/.omp/graph-intelligence/layers/semantica/kg.json` (1836 entities).

**9 canon docs** (the prompt + fractal era; the rest of the corpus is secondary):
`Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md` · `Trident_Fractal_Architecture_FirstPrinciples_v2.3.md`
· `PLUTUS_ARCHITECTURE_BIBLE_4.0.md` · `PLUTUS_ARCHITECTURE_BIBLE_4.5.md` ·
`PLUTUS_E1_E2_E3_MACRO_CONTEXT.md` · `VISUAL_TELESCOPE_CHARTING_T2.md` ·
`Golden_Operator_Trade_Feedback_EU_GU.md` · `HANDOVER_37_FUNDAMENTAL_LAWS.md` · `CANON.md`

**486 laws** (from 559) after the quality bar — dropped: 62 with `statement` < 40 chars,
6 doc closing-paragraph fragments (`*END …`), 5 markdown-noise. Tiers: IMMUTABLE 460 · EVOLVING 21 ·
SUPERSEDED 5.

The full corpus graph is **untouched** — this is an additional, narrower view for this project.
Backups sit beside the file as `kg.json.bak-<epoch>`.

## THE PROBES (re-run these after any change)

```bash
L=…/Shared_Workspace/PLUTUS-COMMON-SENSE-LSP
cd "$L" && bun scripts/plutus-lsp.ts --selftest <a .ts under PLUTUS_VISION> --no-judge
#  IN    -> SELFTEST OK — N card(s), tokens: plutus/law
cd "$L" && bun scripts/plutus-lsp.ts --selftest /tmp/foreign.ts --no-judge
#  OUT   -> NO TOKENS — the reflex produced no card
cd "$L" && bun scripts/plutus-lsp.ts --selftest \
  …/PLUTUS/MASTER_CONTEXT/HANDOVER_37_FUNDAMENTAL_LAWS.md --no-judge
#  ref   -> SELFTEST OK  (the corpus graph is unregressed)
```

`NO TOKENS` → the SCOPE gate failed. `REFUSED: PLUTUS_NO_STORE` → the REACH gate failed.

## RESTART

The LSP binds at session construction — **restart the TUI** for this wiring to take hold, then
watch `PLUTUS-COMMON-SENSE-LSP/forensic/lsp-receipts.log` for
`PUBLISH … tokens=plutus/law` rows naming files in this tree.

## READ ORDER FOR A FRESH SESSION

1. This file.
2. `plutus-graph-context` — the canon reload (reads the corpus graph from disk).
3. `enable-plutus-lsp` — the scope/plant procedure.

**Note on precedence:** the operator's ruling is that **Bible 4.0 is read first, then 4.5,
sequentially** — 4.5 is a supplement, not a replacement. Do not quote "4.5 supersedes 4.0".
