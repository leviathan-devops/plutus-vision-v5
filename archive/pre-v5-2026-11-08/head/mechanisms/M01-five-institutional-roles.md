---
type: pv-state
id: "M01"
tldr: "The E1 zones are the 5 INSTITUTIONAL ROLES (5.3.3 section 5.2.1), synthesized from the week."
statement: "synthesize_institutional_zones() in scripts/e1_extract.py produces the 5 roles of the Trident 5.3.3 IP Zone Map (section 5.2.1): IP Resistance Ceiling / Upper IP Resistance / Equilibrium Zone / Mid-Range Support / IP Support Floor, spanning the WEEK's own swing range, each snapped to the real levels in its band, zCat=RES|MID|SUP by position. NOT the raw confluence ladder."
anchor: "scripts/e1_extract.py:372"
---

# M01 — the five institutional roles

**The 5 roles (verbatim, Trident 5.3.3 section 5.2.1 + the canon trident_v8.pine):**

IP Resistance Ceiling · Upper IP Resistance · Equilibrium Zone · Mid-Range Support · IP Support Floor.

## The mechanism

`synthesize_institutional_zones(levels, bars, spot, pair)` in `scripts/e1_extract.py`:
1. takes the week's own range (`bars[-120:]`, 5 days of 1H);
2. defines the 5 role bands as fractions of that range (Ceiling 85-100%, Upper 66-85%,
   Equilibrium 34-66%, Mid 15-34%, Floor 0-15%);
3. snaps each band to its real levels (top/bottom from the actual levels in the band);
4. assigns `zCat` = RES (the upper two) | MID (centre) | SUP (the lower two) — the positional
   classify vs spot (the goal's one missing field).

## Why

The operator's correction: the render showed the RAW CONFLUENCE LADDER (`assemble()`, 6 thin
clustered zones) instead of the 5 institutional roles. See `rulings/R03-e1-on-top-v1.md:1` and
`laws/LAW-05-5.3.3-authority.md:1`.

## The anchors

- scripts/e1_extract.py:372 — synthesize_institutional_zones (the 5 roles).
- scripts/e1_extract.py:428 — assemble (the raw ladder, kept for the record).
- Original_Canon_Data/Pine Scripts/trident_v8.pine:300 — the canon's 5 roles (the reference).

## The data flow

bars -> synthesize_institutional_zones -> `zones[]` (5, with zCat/zTir/zfp_label/degree_v8) ->
`data/e1/<PAIR>-<week>.json` -> `scripts/lqz_vision_v2_build.py` (the injected payload) ->
`plutus-vision-v2.pine` (the render consumes e1_injected_*) -> the live IDE.

## The gap (named)

The degrees resolve to LIGHT (the band confluence is 2-4/14). The canon's HEAVY /
MODERATE-HEAVY degrees need the 9-SOURCE ENGINE synthesis (the goal's nine-source payload),
not just the level confluence. That synthesis is the unbuilt W6/W7.

## How to apply this card

Read it before touching the E1 zone model. Quote the anchor. Never replace the 5 roles with
the raw ladder (see `rulings/R03-e1-on-top-v1.md:1`).

## The verification

verification: `make e1` -> `data/e1/DXY-2026-07-06.json` shows 5 role-named zones; the live
census shows 14 labels · 31 boxes. SEE `context_management/RUNNING_BUILD_LOG.md:1` for the
record. SEE `laws/LAW-05-5.3.3-authority.md:1` for the authority.

## The history

Authored 2026-10-05, the session in which the operator corrected the render to the 5
institutional roles. The synthesis is deterministic from the week's data — never the canon's
stale example, never hand-drawn.

## The propagation

When the 9-source engine lands, this card updates: the roles keep their positions but gain the
engine's degrees (HEAVY/MODERATE-HEAVY/...) instead of the confluence-derived LIGHT. The
render consumes the same `zones[]` — only the degree field changes.

## The cross-links

- laws/LAW-03-e1-dynamic-week.md:1 — the E1 data is the current week.
- laws/LAW-05-5.3.3-authority.md:1 — the prompt is the authority.
- rulings/R03-e1-on-top-v1.md:1 — E1 on top of the v1 baseline.

## The record

mechanism M01 · scripts/e1_extract.py · the 5 roles · zCat RES|MID|SUP · the week's range.

## The governing canon (references)

- context_management/CURRENT_STATE.md:1 — the state this mechanism serves.
- context_management/NEXT_STEPS.md:1 — the active task.
- context_management/RUNNING_BUILD_LOG.md:1 — the build record.
- context_management/EVIDENCE_STATE.md:1 — the evidence.
- reports/Knowledge_Graph_Map.md:1 — the map this card appears in.

## The operating context

This mechanism is the bridge between the harvested levels and the canon render. The levels are
the raw scored candidates (`build_levels`); the roles are their institutional synthesis. The
render consumes the roles, so the chart reads as the canon: 5 zones spread across the week, one
role per band.

## The enforcement surface

The producer is `scripts/e1_extract.py` (the synthesis); the consumer is
`scripts/lqz_vision_v2_build.py` (the payload injection); the render is
`plutus-vision-lqz/e1-render.pine` (the E1 layer). The chain is mechanical: the week's bars ->
the 5 roles -> the injected payload -> the chart.

## The verification (extended)

Run `make e1` and read `data/e1/<PAIR>-<week>.json` — 5 role-named zones spanning the week's
range. Run the six acceptance suites (`scripts/e1_st_18.py` ... `scripts/e1_st_26.py`) — 6/6.
Render on the live IDE and read the census — the 5 labels appear.

## The non-goals

This mechanism does NOT compute the trade setups (Engine 3), the macro shape chain (Engine 2),
or the option strikes. It produces the 5 IP roles only — the engine-one zone map.

## The doctrine

The 5.3.3 prompt is the authority: the IP Zone Map is ONE role per band, not a ladder of
confluence clusters. A paraphrase is a claim; the prompt is the law.
