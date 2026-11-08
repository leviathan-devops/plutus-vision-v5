---
type: "pv-law"
id: "LAW-01"
tldr: "The V1 baseline is SACRED — any drift is HARD STOP H1."
statement: "plutus-vision-v1.pine sha256 0d20e8314ce992fc23e27f1b97fed76b… (1270 lines) is the operator's sealed baseline of candle liquidity + the LuxAlgo SMC S/D zones. The v1 baseline must be byte-identical; ANY drift fires HARD STOP H1 and the build never runs."
tier: "IMMUTABLE"
anchor: "plutus-vision-v1.pine:1"
---

# LAW-01 - 01-v1-sacred

**The verbatim law (the goal pin, HARD STOPS):**
> v1 drift (sha != 0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1) -> `HARD STOP H1`, never build.

**Why it exists.** The v1 baseline is the operator's candle-liquidity + the LuxAlgo SMC
S/D zones — the visual foundation every E1 build sits ON TOP OF. If the foundation
drifts, every E1 build is measured against the wrong substrate.

**How it is enforced.** The v2 builder (`scripts/lqz_vision_v2_build.py`) reads v1,
computes its sha256, and `sys.exit` with `HARD STOP H1` the moment it differs from the
seal. The build NEVER edits v1 — v1 is GENERATED from `plutus-vision-lqz/*.pine` by
`scripts/lqz_vision_build.py`.

**The anchors.**
- `plutus-vision-v1.pine:1` — the sealed baseline (the operator's file).
- `scripts/lqz_vision_v2_build.py:83` — the seal check that fires HARD STOP H1.
- `scripts/e1_st_21.py:1` — the tamper test that proves the stop fires on a mutation.

**The failure mode it prevents.** A rebuild that silently reflows the v1 padding or drops
an SMC table row would render zones against a different chart than the operator signed
off on. The seal makes that impossible.

## THE MECHANISM IN FULL

The card records a binding decision that governs the E1 render build. It exists because a
session — human or agent — was about to do the opposite, and the cost of the wrong choice was
a shipped artifact that did not match the operator's intent. The graph exists so that the
NEXT session reads this and does not re-derive it wrongly.

## HOW TO APPLY THIS CARD

1. READ the graph card (never from memory — the never-paraphrase law, D13).
2. QUOTE the anchor in any completion claim (a claim without its file:line anchor is void).
3. VERIFY against the current tree: the anchor must still resolve (grep the quoted string).
4. If the tree contradicts the card, the CARD is the authority for intent — but the file:line
   anchor must be re-verified; a moved anchor is a repair, not a supersession.

## THE CROSS-LINKS

- The v1 substrate: `plutus-vision-v1.pine` (the sealed baseline, from `plutus-vision-lqz/*.pine`).
- The E1 layer: `plutus-vision-v2.pine` (lines 1359+; the colour ladder, the payload, the render).
- The build: `scripts/lqz_vision_v2_build.py` (the seal + the anchoring + the payload injection).
- The canon: `Original_Canon_Data/Pine Scripts/trident_v8.pine` (the verbatim render source).
- The authority: `Original_Canon_Data/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md` (the prompt).
- The tests: `scripts/e1_st_18.py` · `scripts/e1_st_19.py` · `scripts/e1_st_20.py` ·
  `scripts/e1_st_21.py` · `scripts/e1_st_22.py` · `scripts/e1_st_26.py`.

## THE VERIFICATION

The card is verified in-session by: (a) the anchor resolving (`grep -n "<quote>" <anchor-file>`),
(b) the daemon reporting `diagnostics: 0` for the corpus, and (c) the build proving the law on the
live tree (`make e1` -> the served v2). A card whose anchor does not resolve is FLAGGED, never
silently accepted (the source-anchor law).

## THE HISTORY

Authored 2026-10-05, the session in which the operator discovered the first E1 build had dropped
the V1 baseline and copied the canon's stale example week. The ruling was recorded verbatim; the
card is its durable form so the mistake cannot recur across sessions.

## THE GOVERNING CANON (references)

- context_management/DECISION_CHAIN.md:1 — the decision chain that records this ruling.
- context_management/CURRENT_STATE.md:1 — the current build state it governs.
- context_management/NEXT_STEPS.md:1 — the active task it directs.
- context_management/RUNNING_DEBUG_LOG.md:1 — the debug lineage of this class.
- reports/Knowledge_Graph_Map.md:1 — the map this card appears in.

## THE OPERATING CONTEXT

This card lives in the PLUTUS_VISION knowledge graph — the typed canon an agent reads before
touching the E1 render. The graph's job is to make the deliverable unambiguous: the V1 baseline
plus the engine-one institutional-pressure zones, rendered together, the E1 data dynamic to the
current trading week, the canon render verbatim with the LSZ removed.

## THE ENFORCEMENT SURFACE

The build path is `scripts/lqz_vision_v2_build.py`, which reads the sealed v1 substrate and
appends the E1 layer, then `make e1` runs the six acceptance suites. The daemon serves the
typed graph; the OMP binding `plutus-vision-au` surfaces it to an agent. Every enforcement is
POSITIVE + NEGATIVE: the seal fires on a tamper AND the clean build passes with zero misfire.

## THE PROPAGATION

When this card changes, the change propagates: re-ingest the L1 semantic layer, re-probe the
daemon `diagnostics` to 0, regenerate this map, and re-verify the render against the canon
screenshot. A card is never an island — it is a node the graph and the build both consume.

## THE DOCTRINE QUOTE

The operator's doctrine, verbatim, is the card's spine. A paraphrase is a claim; the quote is
the law. Agents READ the graph and QUOTE it (the never-paraphrase law, D13).
