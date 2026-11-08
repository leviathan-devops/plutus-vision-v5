---
type: "pv-law"
id: "LAW-03"
tldr: "The E1 data is DYNAMIC — adapted to the current trading week; no stale/hardcoded week."
statement: "The E1 institutional-pressure data (zones + option strikes) is derived for the CURRENT trading week, dynamically. Copying a stale week's data (e.g. the canon's Apr 20-24 example) is FORBIDDEN — the render must match the current price action."
tier: "IMMUTABLE"
anchor: "scripts/e1_week.py:1"
---

# LAW-03 - 03-e1-dynamic-week

**Operator (verbatim, 2026-10-05):**
> "we want to make sure that the engine one data is relevant to the current week. and not stale ... because I can zoom forward and see that this is not matched to the current week at all."

**The anchor is the chart, not the clock.** The E1 zones anchor to the chart's OWN last
bar (`bar_index`), never `now()` / `timenow` — so under bar replay the zones follow the
replay week. The injection carries `e1_injected_anchor_ms` derived from the active bar.

**The pipeline derives the week.** `scripts/e1_week.py` resolves the trading week from the
anchor; `scripts/e1_extract.py` builds the current-week payload (zones with `zCat`,
`top`, `bottom`, `confluence`); `scripts/e1_sources.py` harvests the sources; down sources
render `[NO DATA]` + a reason (the loud-fail law) — never a stale carry-forward.

**The anchors.**
- `scripts/e1_week.py:1` — the week resolution (the anchor -> Mon..Fri/Sun).
- `scripts/e1_extract.py:1` — the current-week payload derivation.
- `scripts/lqz_vision_v2_build.py:83` — the E1/E2 week anchoring (the mix guard).

**The failure mode it prevents.** Copying the canon's Apr 20-24 example data (zones +
option strikes) renders zones at prices the current chart never visits — a stale, useless
overlay. That is the R02 ruling.

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
