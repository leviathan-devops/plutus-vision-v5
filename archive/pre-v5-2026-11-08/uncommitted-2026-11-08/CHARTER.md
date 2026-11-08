# PLUTUS_VISION — Knowledge Graph Charter

**Chartered:** 2026-10-21 · **supersedes** the 2026-09-16 graph (archived at `.archive/graph-v1-*.tar.gz`)

## THE SCOPE — NAMED, EXACT

The graph is built from **these thirteen authoritative sources and nothing else**:

| # | source | what it authoritatively holds |
|---|---|---|
| 1 | `Original_Canon_Data/Toolset/Trident_Fractal_Architecture_FirstPrinciples_v2.3.md` | the fractal thesis, the three-engine decomposition |
| 2 | `Original_Canon_Data/Toolset/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md` | E1 both faces, the nine pillars, ZFP Appendix B, the confidence formula |
| 3 | `Original_Canon_Data/Toolset/TRIDENT_v5.3.3_CORRECTED_E3_ENGINE.md` | E3: entry/SL/TP/RRR, the eight setups |
| 4 | `MASTER_CONTEXT/NON-NEGOTIABLE-RELOAD/PLUTUS_ARCHITECTURE_BIBLE_v2.1.md` | the architecture and its invariants |
| 5 | `MASTER_CONTEXT/NON-NEGOTIABLE-RELOAD/PLUTUS_E1_E2_E3_MACRO_CONTEXT.md` | the engine context and the macro chain |
| 6 | `MASTER_CONTEXT/NON-NEGOTIABLE-RELOAD/TTE_MACRO_SHAPES_COMPLETE_REFERENCE.md` | the shape anatomy numbers |
| 7 | `MASTER_CONTEXT/NON-NEGOTIABLE-RELOAD/TTE_SHAPE_ZONE_MECHANICS_MILITARY_GRADE.md` | zone grammar and mechanics |
| 8 | `Training Data/PDFs/Forex SMC Notes-1.pdf` | SMC: order blocks, liquidity, structure |
| 9 | `Training Data/PDFs/Forex SMC Notes-2.pdf` | SMC continued |
| 10 | `Training Data/PDFs/Macro Shape Library.pdf` | visual reference, real weekly charts |
| 11 | `Training Data/PDFs/Trading Laws.pdf` | the operator's operating laws |
| 12 | `Training Data/PDFs/Trading Infrastructure.pdf` | accounts, prop stacking, execution |
| 13 | `Training Data/PDFs/Trading Observations.pdf` | recurring market observations |

**Members mounted, not edited:** `DEEPSEEK_AGENT`, `MIMO_AGENT`, `MASTER_CONTEXT` (discover only).
**Out of scope:** `packages/`, `Checkpoints/`, `node_modules/`, every build artifact.

## THE LAYERS

- **L2 arsumbris** — the PRIMARY typed graph. Cards under `cards/`, types under `type/`, hubs under `sources/`.
- **L1 semantica** — the SECONDARY decision-intelligence graph, derived from the same cards, emitted to
  `.omp/graph-intelligence/layers/semantica/kg.json`.

## THE TYPES

`pv-engine` · `pv-law` · `pv-shape` · `pv-zone` · `pv-mechanic` · `pv-term` · `pv-ruling` · `pv-doc`

## THE GATES (each exits nonzero — 8 conditions, one command)

1. `pv-kg-gate` — `diagnostic_counts scope:own` must be **0**. A graph with lint is not canon.
2. Every card carries `**Source key:** [[<hub>]]` — an orphan card fails.
3. Every card carries `anchor:` naming a real file, and that anchor must RESOLVE.
4. **AUTHORITY** — `pv-verify-anchors`: the quoted text must exist at the cited line.
   Three failure classes, each named: MISANCHORED (move it), WRONG-SOURCE (repoint),
   PARAPHRASE (a defect — the card is not authoritative).
5. **CANON TERMS** — `pv-canon-terms`: a card's title must contain a phrase that
   appears in the operator's trading sources. Market-standard vocabulary is refused.
6. **HUB COMPLETENESS** — every hub carries at least one card. A hub with none is an
   unwritten engine.
7. Total graph ≤ **200,000 tokens**.
8. All ten shapes present, and L1 `entities > 0` and `relationships > 0`.

## THE LAWS

- **Diagnostics are lint.** Saves always land; drive to 0 by fixing CARDS, never the engine.
- **The source-anchor law.** Every quote anchors to `file:line`. An unanchored quote is not a card.
- **The never-paraphrase law.** Agents READ the graph and QUOTE it.
- **The scope ruling is the operator's.** Never widen or shrink this list.
