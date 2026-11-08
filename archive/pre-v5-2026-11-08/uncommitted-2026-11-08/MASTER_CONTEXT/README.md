---
type: au.engine.readme::au-engine
tldr: The Plutus canon corpus — every bible, spec, macro context and feedback record. THE sole knowledge source of the plutus knowledge graph; agents read doctrine here, never from memory.
---

# Repo Overview

The Plutus MASTER_CONTEXT corpus: 41 files (8.9 MB) — the architecture bibles,
the E1/E2/E3 macro context, every V4.x spec, the golden trade feedback, the
MATHEXPR card bibles, and the NON-NEGOTIABLE-RELOAD set. This directory is the
ONLY knowledge source the plutus knowledge graph is built from.

## What this is

The canon. The au engine indexes it as a typed graph; the daemon serves it;
kgm keeps the daemon alive and the graph lint-clean.

## How to use this

Query the socket. Author new doctrine as corpus files; never let agents
paraphrase law — quote file:line from here.

## How to extend this

Drop new canon .md files here; add type-defs under type/ when a file class
deserves structure. Git is the history.
