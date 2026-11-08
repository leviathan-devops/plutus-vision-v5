---
type: au.engine.readme::au-engine
tldr: The PLUTUS_VISION canon corpus — the V1 baseline, the E1 institutional-pressure render, the 5.3.3 engine prompt, the build package and the canon docs. THE sole knowledge source of the plutus-vision knowledge graph; agents read the laws here, never from memory.
---

# Repo Overview

The PLUTUS_VISION engine corpus. The deliverable it exists to hold: the **V1 baseline +
the engine-one (E1) institutional-pressure zones rendered TOGETHER**, the E1 data
**dynamically adapted to the current trading week** (no stale data; sources auto-handled),
the canon render **verbatim** from `trident_v8.pine` with the **LSZ removed**.

## What this is

The canon. The au engine indexes it as a typed graph (laws, rulings, mechanisms,
states, gates, lessons); the daemon serves it; the OMP binding reads it reflexively.

## How to use this

Query the socket. Author new doctrine as cards under the kind dirs. Agents READ the
graph and QUOTE it — the never-paraphrase law (D13).

## How to extend this

Drop new cards under `laws/` `rulings/` `mechanisms/` `gates/` `state/` `lessons/`;
add a type-def under `type/` when a new class deserves structure. Git is the history.

## The Layers

- **L1 — semantica.** The fast automatic semantic walk over the corpus. Output:
  `.omp/graph-intelligence/layers/semantica/kg.json`. Produced by
  `Graph_Intelligence/scripts/semantica-ingest.py` (the shared walk-skip law).
- **L2 — arsumbris.** The curated typed graph: the cards under `laws/` and `rulings/`, served
  by the au-engine daemon. See `.arsumbris/repo.yaml:1` for the repo type.
- **L3 — the agent binding.** `plutus-vision-au` in the OMP `mcp.json`, pointing at this repo
  via `AU_MCP_WORKSPACE`.
- **L4 — the review + the map.** The four reviews (diagnostics 0, anchors resolved, scope, the
  map) and `reports/Knowledge_Graph_Map.md`.

## The Corpus

The corpus is THIS repository, honoring the shared walk-skip law (never walked: `node_modules/`,
`.git/`, `dist/`, `build/`, `Checkpoints/`). The load-bearing subtrees: the V1 baseline
(`plutus-vision-v1.pine`), the E1 layer (`plutus-vision-v2.pine`, `plutus-vision-lqz/`), the
E1 pipeline (`scripts/`), the payload (`data/e1/`), and the canon (`Original_Canon_Data/`).

## The Laws (read these first)

- `laws/LAW-01-v1-sacred.md` — the V1 baseline is byte-identical (HARD STOP H1 on drift).
- `laws/LAW-02-v1-plus-e1-together.md` — the deliverable = V1 + E1 rendered together.
- `laws/LAW-03-e1-dynamic-week.md` — the E1 data is dynamic to the current week.
- `laws/LAW-04-canon-verbatim-render.md` — the canon render verbatim, LSZ removed.
- `laws/LAW-05-5.3.3-authority.md` — the 5.3.3 prompt is the binding authority.
- `laws/LAW-06-sources-auto.md` — the data sources are auto-handled.

## The Rulings

- `rulings/R01-lsz-removed.md` — the LSZ rendering is removed from engine one.
- `rulings/R02-no-stale-data.md` — no copied canon example data; the week is dynamic.
- `rulings/R03-e1-on-top-v1.md` — E1 sits ON TOP OF the V1 baseline, never alone.

## How To Query

The daemon serves the typed graph over a Unix socket; the OMP binding exposes it as MCP tools.
The read verbs: `diagnostics`, `type_counts`, `instances_of`. verification: the daemon reports
`diagnostics: 0` for this corpus. SEE `reports/Knowledge_Graph_Map.md:1` for the human map.

## The Contract

Every card carries its `file:line` anchor. Agents read the graph and quote it — never
paraphrase (the D13 law). A card whose anchor does not resolve is FLAGGED, never silently
accepted. The graph is the authority; this README is its front door.

## Maintenance

Re-ingest L1 after corpus changes; re-probe the daemon after card changes; regenerate the map
after either. The canon docs (`context_management/`) are the build state; the graph is the law.
SEE `context_management/CANON_MANIFEST.md:1` for the canon contract.

## The Worked Example

To read the law for the V1 baseline, open `laws/LAW-01-v1-sacred.md`. To read the law that the
deliverable is V1+E1 together, open `laws/LAW-02-v1-plus-e1-together.md`. To read the law that
the E1 data is dynamic, open `laws/LAW-03-e1-dynamic-week.md`. To read the ruling that the LSZ
is removed, open `rulings/R01-lsz-removed.md`. Each card carries its anchor and its verbatim
operator quote.

## The Build Path

The build reads the sealed v1 substrate, appends the E1 layer, and deploys. The tests are the
six acceptance suites. The render is verified on the live IDE by capture. SEE
`context_management/EVIDENCE_STATE.md:1` for the recorded evidence.

## The Non-Goals

This graph does NOT hold the deferred engines (E2 the macro shape chain, E3 the trade setup
architecture). It holds engine one and its render contract. The deferred work is named in
`context_management/NEXT_STEPS.md:1`.

## The History

Authored 2026-10-05, the session in which the operator discovered the first E1 build had
dropped the V1 baseline and copied the canon's stale example week. The graph records the
correction so it cannot recur.
