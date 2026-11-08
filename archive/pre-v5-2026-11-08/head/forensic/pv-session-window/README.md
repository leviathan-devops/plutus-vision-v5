---
type: au.engine.readme::au-engine
tldr: The PV derailment decision graph — the typed instances of every derailment class in the Plutus Vision session window (checkpoint 2026-10-06 07:47 → the JEV order 2026-10-09 15:18).
---

# Repo Overview

## What this is

The TYPED DECISION GRAPH of the Plutus Vision derailment window: the operator rulings, the
agent claims, the derailment classes, the regressions from the restored checkpoints, and the
gate gaps — as typed, anchored instances. Companion layers: the L1 semantica kg.json (the
semantic/context graph) and the L3 UA graph (the code structure).

## How to use this

Read `cards/` for the instances; each card is `type:` + its required fields. The engine
(`au daemon start .`) serves the typed graph + diagnostics.

## How to extend this

Add a type under `.arsumbris/type/<name>.type.yaml`, add the card with `type: <name>`, and
keep `diagnostic_counts` at 0.

## The window

`[2026-10-06T07:47 .. 2026-10-09T15:19]` — from the `e1-e2-v2-pending-ship-approval-2026-10-06`
checkpoint (the operator's C16-approved render, restored at `caef1f9`) to the operator's order
to wire the JEV gate (n=349).
