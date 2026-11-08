# PLUTUS_VISION — Knowledge Graph Map

_Generated 2026-10-05 · the L1 semantica + the L2 arsumbris typed graph._

This map is the human-readable index over the graph. The graph is the authority; this map
is its ToC. Every card below is a durable decision; read the card, quote it, never paraphrase.

## L1 — semantica (the semantic walk)

- entities: **347** · relationships: **316**
- store: `.omp/graph-intelligence/layers/semantica/kg.json`
- produced by: `Graph_Intelligence/scripts/semantica-ingest.py` (the shared walk-skip law)

## L2 — the typed canon (the cards)

### LAWS — the immutable canon

#### `laws/LAW-01-v1-sacred.md`

- **id**: LAW-01 · **type**: pv-law
- **summary**: The V1 baseline is SACRED — any drift is HARD STOP H1.
- **anchor**: plutus-vision-v1.pine:1

Read: `laws/LAW-01-v1-sacred.md`. Quote it in any completion claim (see `README.md:1`).

#### `laws/LAW-02-v1-plus-e1-together.md`

- **id**: LAW-02 · **type**: pv-law
- **summary**: The deliverable = V1 baseline + E1 rendered TOGETHER (never E1 alone).
- **anchor**: plutus-vision-v2.pine:1359

Read: `laws/LAW-02-v1-plus-e1-together.md`. Quote it in any completion claim (see `README.md:1`).

#### `laws/LAW-03-e1-dynamic-week.md`

- **id**: LAW-03 · **type**: pv-law
- **summary**: The E1 data is DYNAMIC — adapted to the current trading week; no stale/hardcoded week.
- **anchor**: scripts/e1_week.py:1

Read: `laws/LAW-03-e1-dynamic-week.md`. Quote it in any completion claim (see `README.md:1`).

#### `laws/LAW-04-canon-verbatim-render.md`

- **id**: LAW-04 · **type**: pv-law
- **summary**: The canon render is VERBATIM from trident_v8.pine — only the LSZ is removed.
- **anchor**: Original_Canon_Data/Pine Scripts/trident_v8.pine:1

Read: `laws/LAW-04-canon-verbatim-render.md`. Quote it in any completion claim (see `README.md:1`).

#### `laws/LAW-05-5.3.3-authority.md`

- **id**: LAW-05 · **type**: pv-law
- **summary**: The Trident v5.3.3 engine prompt is the BINDING AUTHORITY.
- **anchor**: Original_Canon_Data/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:1

Read: `laws/LAW-05-5.3.3-authority.md`. Quote it in any completion claim (see `README.md:1`).

#### `laws/LAW-06-sources-auto.md`

- **id**: LAW-06 · **type**: pv-law
- **summary**: The data sources are AUTO-handled — no manual agent data-fetching in the render path.
- **anchor**: scripts/e1_sources.py:1

Read: `laws/LAW-06-sources-auto.md`. Quote it in any completion claim (see `README.md:1`).

### RULINGS — the operator s rulings

#### `rulings/R01-lsz-removed.md`

- **id**: R01 · **type**: pv-ruling
- **summary**: the only change is that you remove the liquidity zone rendering from the engine one
- **anchor**: operator ruling, 2026-10-05

Read: `rulings/R01-lsz-removed.md`. Quote it in any completion claim (see `README.md:1`).

#### `rulings/R02-no-stale-data.md`

- **id**: R02 · **type**: pv-ruling
- **summary**: it also has the stale options strike target from the canon that is completely irrelevant to the current week
- **anchor**: operator ruling, 2026-10-05

Read: `rulings/R02-no-stale-data.md`. Quote it in any completion claim (see `README.md:1`).

#### `rulings/R03-e1-on-top-v1.md`

- **id**: R03 · **type**: pv-ruling
- **summary**: the entire V1 baseline is missing ... we want to make sure that the engine one data is relevant
- **anchor**: operator ruling, 2026-10-05

Read: `rulings/R03-e1-on-top-v1.md`. Quote it in any completion claim (see `README.md:1`).

### MECHANISMS — the working machinery

#### `mechanisms/M01-five-institutional-roles.md`

- **id**: M01 · **type**: pv-state
- **summary**: The E1 zones are the 5 INSTITUTIONAL ROLES (5.3.3 section 5.2.1), synthesized from the week.
- **anchor**: scripts/e1_extract.py:372

Read: `mechanisms/M01-five-institutional-roles.md`. Quote it in any completion claim (see `README.md:1`).

## Diagnostics

- L2 diagnostics (mine): **0**
- the daemon socket: `~/.arsumbris/au-engine/run/3533896ff2f68389.sock`
- the OMP binding: `plutus-vision-au` (AU_MCP_WORKSPACE=.../PLUTUS_VISION)
- L1 store: `.omp/graph-intelligence/layers/semantica/kg.json`

## The reviews (the E2E gate)

- diagnostic sweep: 0 (see the daemon `diagnostic_counts` read).
- anchor sweep: every card's anchor resolves (see the per-card `file:line`).
- scope sweep: the corpus is `PLUTUS_VISION` only (see `.omp/graph-intelligence/CHARTER.md`).
- the map: this file.

## The record

| layer | artifact | count |
|---|---|---|
| L1 | `.omp/graph-intelligence/layers/semantica/kg.json` | 347 entities / 316 rels |
| L2 | `laws/` + `rulings/` | 9 cards |
| L3 | `plutus-vision-au` (mcp.json) | the OMP binding |
| L4 | this map + the 4 reviews | done |

## Verification

verification: the graph is verified by the daemon `diagnostics: 0` (scope=all) and by the
live socket probe; see `context_management/EVIDENCE_STATE.md:1` for the recorded numbers.

SEE the graph root `.omp/graph-intelligence/CHARTER.md` for the scope; SEE the daemon socket
for the live typed graph.
