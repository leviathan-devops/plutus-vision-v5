---
type: "pv-ruling"
id: "R03"
quote: "the entire V1 baseline is missing ... we want to make sure that the engine one data is relevant"
source: "operator ruling, 2026-10-05"
status: "operator-confirmed"
---

# R03 - e1-on-top-v1

**Operator (verbatim):**
> "I noticed that the entire V1 baseline has disappeared right now and it is just rendering the institutional pressure zone."

**The defect.** The first E1 build (`plutus-vision-e1-automatic.pine`) was the canon
`trident_v8` IP block rendered STANDALONE — it dropped the operator's V1 baseline (the
candle-liquidity + the LuxAlgo SMC layer) entirely.

**The fix.** The deliverable re-renders the v1 baseline AND adds the E1 zones on top, in
ONE file, ONE indicator (LAW-02). The v1 baseline is the sealed substrate; E1 is the
additive layer.

**The anchors.**
- `plutus-vision-v1.pine:1` — the sealed v1 baseline (1270 lines).
- `plutus-vision-v2.pine:1359` — where the E1 layer is appended on top.
- `plutus-vision-e1-automatic.pine:1` — the (wrong) E1-alone build this ruling corrects.

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

## THE WORKED EXAMPLE

The canon `trident_v8.pine` is the source of truth for the RENDER — see
`Original_Canon_Data/Pine Scripts/trident_v8.pine:1`. The build that respects this ruling is
produced by `scripts/lqz_vision_v2_build.py:83` (the seal) reading the v1 substrate at
`plutus-vision-v1.pine:1` and appending the E1 layer, then deploying the served file. The
verification is `make e1` (which runs the six acceptance suites: see `scripts/e1_st_18.py:1`
through `scripts/e1_st_26.py:1`) and the live capture on the IDE.

## THE COUNTER-EXAMPLE

The first E1 build was `plutus-vision-e1-automatic.pine` — the canon IP block STANDALONE. It
violated this ruling twice: it dropped the v1 baseline (see the v1 substrate at
`plutus-vision-v1.pine:1`), and it copied the canon's stale Apr example data (see
`Original_Canon_Data/Pine Scripts/trident_v8.pine:150`). The operator caught it by LOOKING at
the chart and comparing it with the canon screenshot.

## THE METRICS

The before/after of the correct build: the served `plutus-vision-v2.pine` equals the sealed v1
baseline (`plutus-vision-v1.pine:1`, sha 0d20e8314ce992fc…) PLUS the E1 layer appended at
`plutus-vision-v2.pine:1359`, with the E1 payload derived for the current week by
`scripts/e1_extract.py:1`. The census on the live IDE is the measure: the v1 layer + the E1 IP
zones rendered together.

## THE ENFORCEMENT IN CODE

The render layer never reads the v1 array state; it consumes only `e1_injected_*`. The build
never edits v1; it only reads and seals it. The payload is derived, never hardcoded. Each of
these is a mechanical property of `scripts/lqz_vision_v2_build.py`, not a convention.

## THE RESIDUAL

No residual. This ruling is fully enforced by the build at
`scripts/lqz_vision_v2_build.py:83` and proven by the live render on the IDE. Any future
deviation is a regression, caught by re-reading this card against the served file.

## THE SIGN-OFF

Recorded verbatim from the operator on 2026-10-05; status operator-confirmed. The card is the
durable form of the ruling; it is READ by any session touching the E1 render, and QUOTED — never
paraphrased — in any completion claim.

## THE DOC ANCHORS (file:line)

- context_management/DECISION_CHAIN.md:1 — the ruling recorded in the decision chain.
- context_management/CURRENT_STATE.md:371 — the render-correction state.
- context_management/NEXT_STEPS.md:345 — the active rebuild task.
- laws/LAW-02-v1-plus-e1-together.md:1 — the companion law.
- context_management/RUNNING_DEBUG_LOG.md:729 — the debug entry for this class.

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
