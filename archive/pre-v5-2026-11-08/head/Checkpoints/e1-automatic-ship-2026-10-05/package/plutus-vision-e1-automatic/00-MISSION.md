# 00 — MISSION

**Slug:** `plutus-vision-e1-automatic` · **Class:** SYSTEM (multi-front, multi-day)
**Date:** 2026-10-04 · **Target:** `/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION`

---

## §1 THE MISSION, VERBATIM

> "we need the five institutional pressure zones that are rendered for engine one from the nine
> web data sources to actually see where's all the institutional pressure for a target trading
> week"

> "the exact indicator we have right now is the baseline and we just add the five institutional
> pressure zones on top, but you need to improve like you copy paste exactly what's working in
> that regard from the original time [trident_v8.pine]"

> "we need to improve on top of that so that the original manual data input design is now
> replaced with an automatic data input. where all of the steps that go into generating the
> report for engine one data all of that needs to be done automatically now by scripts and by
> code and by jab and by the embedded clen model that exists on disk"

> "if we have that local vlm it can extract the data for the options from investing.live the
> options data table we can extract directly"

> "Like make it automatic so that the indicator just loads the institutional pressure zones for
> the target trading week."

> "It should also auto-adjust so that if I use bar replay and I rewind to any random fucking date
> in the trading week, the engine one zones render for that week."

> "you can base it on the most recent bar of the chart that is active so if I bar replay… what is
> the most active bar that is the trading day from which the trading week is discerned and you
> render all of the data based on the data of this specific trading week's reality"

> "There is no next week. There is no previous week. It just renders from Monday to Friday of
> this trading week the engine one zones are just overlaid on top of our existing indicator."

> "I want to independently render the liquidity zones of both of these in a split test and see
> which one is more accurate to the actual liquidity of the chart. That's a task for later. Right
> now what I want you to do is separate the liquidity zones out"

---

## §2 THE RESTATED UNDERSTANDING

**What this build is.** Take the **institutional pressure zone renderer** that already works in
`trident_v8.pine` (a 4-month-old hand-fed indicator) and weld it onto our sealed v1 baseline as
**one more layer**, then replace the manual data input with an **automatic pipeline** so the
zones for the current trading week appear without a human generating a report.

**The three composed facts that define it:**

1. **The renderer already exists and is proven.** `trident_v8.pine:352-365` draws the IP zones;
   `:44-65` is its colour ladder; `:67-158` its helpers; `:334-338` its ZFP. It is fed by
   hardcoded arrays (`:187-192`). We port the renderer, not the data.
2. **The data source already exists in our tree.** `scripts/e1_extract.py` already produces
   scored zones from real bars (6 zones, pivots verified to 1e-9) — but it emits OUR schema, not
   v8's. One field is missing (`zCat`: RES/MID/SUP, derivable positionally).
3. **The temporal anchor becomes the CHART, not the clock.** v8 hardcodes
   `timestamp(2026,4,6)` (`:35`). We compute it from **the last bar on the chart**, which makes
   bar replay work by construction — the rewind point *is* the last bar.

**What "automatic" means, concretely.** Today: a human reads a report, runs
`trident_phase1.py`, copies the `.pine`, pastes it into TradingView. After: the build resolves
the week, harvests, scores, and injects — no human step. The `.pine` still ships (it is a Pine
indicator), but its payload is generated, not typed.

**The explicit deferral.** The liquidity (LSZ) split test is **task for later**. The LSZ layer
stays **out** of the ported render, and `trident_v8.pine:367-377` stays **byte-intact** in the
tree as the reference arm.

---

## §3 NON-NEGOTIABLES

| # | The law | The mechanical consequence |
|---|---|---|
| N1 | **v1 is byte-identical.** `plutus-vision-v1.pine` sha `0d20e8314ce992fc…` never changes | the builder REFUSES on drift (`HARD STOP H1`); proven by tampering |
| N2 | **The floor holds**: LuxAlgo SMC 226 · order blocks 6 · LQZ bands 4 | re-checked on every build; a drop is a hard stop |
| N3 | **Engine 3 is out of scope** — no entry, no SL, no TP | grep for `strategy.`/`entry.`/`sl_`/`take.profit` returns 0 |
| N4 | **Pure code; the model reads ONE artefact** (the options-table image) | deleting the model call yields a valid file with that pillar `[NO DATA]` |
| N5 | **No fallbacks.** A dead source emits `[NO DATA]` + the reason | a wrong strike would be a fake zone on a chart |
| N6 | **ADD ONLY** — the baseline is the foundation, the zones are added on top | the port never edits a v1 layer |
| N7 | **The anchor is the chart's last bar**, never wall-clock `now` | bar replay works with zero extra code |

## §4 THE FORBIDDEN LIST

```
✗ Editing plutus-vision-v1.pine or any v1 layer (LuxAlgo SMC, order blocks, LQZ)
✗ Porting the LSZ block — it is the split-test reference, preserved out-of-band
✗ Any Engine-3 primitive — entry, SL, TP, position sizing
✗ A hardcoded timestamp — the anchor is always computed
✗ A model call anywhere but the options-table image
✗ A fabricated strike/notional/level when a source is down — [NO DATA], always
✗ A silent fallback that produces a different artifact and marks it ready
✗ Navigating a browser the process did not launch (the 2026-10-03 display hijack)
```

## §5 OPEN QUESTIONS (max 5, only unresolvable ones)

| # | The question | Why it is not resolvable here | Default taken |
|---|---|---|---|
| Q1 | **4H or 1H?** v8 assumes 4H; our rig serves 1H DXY | a product decision | render on both — `bar_time` makes the layer timeframe-agnostic |
| Q2 | **Which ZFP formula shows in the label?** v8's `zoneW/refRange` vs our Pillar-9 base+modifiers | both are defensible; the operator reads the label | v8's — it is the one the operator has read for 4 months |
| Q3 | **When does the pipeline run?** on build, on a timer, on demand | an ops decision | on build + a `make e1` target; a timer is a later iteration |
| Q4 | **Do the four pairs land now, or DXY only?** PART X specifies four | scope-vs-time | DXY first (the master chart, where the zones are denominated); the four-pair isolation is a named wave |
| Q5 | **Does the local VLM exist and answer?** the arm is proven but is a 3 GB CPU model | measured, not decidable here | use it; on death the options pillar is `[NO DATA]` — the pipeline continues |

**No answer to Q1-Q5 changes the architecture.** All five are recorded with defaults and the
build proceeds; the shapes above are the same under either branch.
