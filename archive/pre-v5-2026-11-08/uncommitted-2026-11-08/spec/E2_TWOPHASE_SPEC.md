# E2 — THE TWO-PHASE SPEC (corrected 2026-10-18)

**Authority:** operator correction, 2026-10-18, verbatim:

> *"The boxes from the references are there so that you can visually see the different shapes, but the
> indicator itself should be able to draw the actual path that the price action is going to take when
> the chain of the boxes together is set up. If it's easier for you, you can do this in phase one…
> Start with the chain of boxes for right now so you can get the data rendered correctly. And then
> once that is working, in phase two I want an actual line drawn that's going to trace the path that
> the price actually takes. That's the target."*

This SUPERSEDES the assumption that the reference frames are the target render. They are not.
**They show the SHAPES so the structure is legible. The line returns in phase 2, with a different
acceptance criterion than any line drawn so far.**

---

## §1 · WHY THE OLD LINE FAILED — measured, not asserted

An independent audit opened all 12 week renders and the 2 reference frames. Findings:

```
vertices ON bands            60/60 across 12 weeks, within 0.0–2.0 px
                             ← vertex membership was NEVER the problem
4th segment DEGENERATE       measured 0 px slope in 12/12 weeks
                             ← `iWL := iR` fires every week, line 179
line is not price            within 3 px of a candle at the same column for only
                             12–25% of its length (mean 18%)
                             ← 82% of the line was nowhere near the price
ladder sparsity              3–7 bands with 24–214 px of empty background
                             vs the reference's ~30 stripes covering 68–100% of the pane
```

**The failure was never the dots. It was (a) the segments between them and (b) the ladder being too
sparse to be a ladder.** A polyline whose X positions were invented clock offsets could not trace
price even in principle — the X axis was fiction before the Y axis mattered.

---

## §2 · PHASE 1 — THE CHAIN OF BOXES

**Purpose:** get the data rendered correctly. Every element of the chain must be a drawn object
whose edges terminate on ladder rungs, so the STRUCTURE is visible and verifiable.

```
  each box  =   entry time  ·  entry level  ·  exit time  ·  exit level

       ┌──────────────┐
       │  step N      │            top edge    = max(entry, exit) — a kept rung
       │              │            bottom edge = min(entry, exit) — a kept rung
       └──────────────┘            left edge   = entry bar TIME (real)
                  ┌──────────────┐ right edge  = exit bar TIME  (real)
                  │  step N+1    │
                  └──────────────┘  ← shares an edge with the previous box
```

**The four hard rules:**

| # | rule | why |
|---|---|---|
| P1-1 | every box's `top` and `bottom` are members of that week's `kept` | the ruling: *"if it is not on the ladder, it is not drawn"* |
| P1-2 | every box's `left` and `right` are **real bar times** from the week | an invented time is an invented X axis |
| P1-3 | consecutive boxes **share an edge** — box N's right = box N+1's left | the chain, not a scatter |
| P1-4 | **zero diagonals** — every edge is axis-aligned | the measured property of both references |

**Chain order:** `SS → BS → R → WL` per the ruling. Each box carries its step name.

**Phase-1 acceptance — eyes-only:**

```
on an opened screenshot of a rendered week:
  [ ] >= 3 boxes visible, each with both edges on named bands
  [ ] boxes visibly CHAINED — no gap, no overlap-by-more-than-a-border
  [ ] price candles run THROUGH the boxes (the boxes are not off in empty pane)
  [ ] every box labelled with its step name
  [ ] no diagonal line anywhere on the chart
```

---

## §3 · PHASE 2 — THE TRACED LINE

**Purpose:** draw a line that traces **the path the price actually takes.**

This is a different object from everything drawn so far. The old line was
`line.new(t0, L0, t1, L1)` where `t0/t1` were clock offsets — a diagonal between two invented
X positions. The phase-2 line must be a **trace of the price series itself.**

```
  THE OLD LINE (rejected)                THE PHASE-2 LINE (target)
  ┌──────────────────────────┐           ┌──────────────────────────┐
  │ ╲                        │           │   ╭─╮   ╭╮               │
  │   ╲   straight segment   │           │  ╱   ╲ ╱  ╲    ╭─╮       │
  │     ╲  between two       │           │ ╱     V    ╲  ╱   ╲      │
  │       ╲ invented times   │           │╱            ╲╱     ╲     │
  └──────────────────────────┘           └──────────────────────────┘
   X = clock offset                       X = real bar time
   Y = ladder rung                        Y = the price at that bar
   within 3px of a candle 18% of length   by construction it IS the candle path
```

**Phase-2 acceptance — measured, not eyeballed:**

| # | criterion | instrument |
|---|---|---|
| P2-1 | the line's Y at bar `t` equals that bar's close (within 1 tick) | sample 20 bars, compare |
| P2-2 | the line is within 3 px of a candle column for **>= 90%** of its length | the audit's own measurement, re-run |
| P2-3 | the line remains inside the ladder for its whole length | no excursion into empty pane |
| P2-4 | the line passes THROUGH the phase-1 boxes, not around them | visual on an opened frame |

**The measured bar for P2-2 is 18% today.** Phase 2 is done when that number is ≥90% on all 12 weeks.

---

## §4 · THE GATES (per the accepted plan, with the two phases made explicit)

| # | gate | phase | instrument |
|---|---|---|---|
| 1 | every vertex price ∈ that week's `kept` | P1 | computed set membership, printed |
| 2 | every band labelled with its real ladder name | P1 | read off the opened frame |
| 3 | band height ≤ 0.08 | P1 | computed |
| 4 | boxes chained, shared edges, SS→BS→R→WL order | P1 | read off the opened frame |
| 5 | WL rung ≠ SS rung | P1 | computed |
| 6 | no bar of the drawn week is read | both | the lock only accumulates the PRIOR week |
| 7 | everything inside the visible pane on all 12 weeks | P1 | opened frame per week |
| 8 | **visual match to the winning-library standard** | P1 | opened frame vs the 2 references, named deltas |
| 9 | **the line traces real price (≥90% column-coincidence)** | **P2** | the audit's measurement re-run |

**Gate status — quoted from `PLUTUS_VISION_SESSION_HISTORY.md` (read this session), not re-derived:**

> *"Gates 1–7 are met by the clean script. Gate 8 is not. That is the open rejection."*

And gate 8's own text, same source:
> *"8. Visual match to winning-library standard: clean discrete bands + path on them."*

Gate 9 (the phase-2 line metric) does not exist yet — it is introduced by this spec and has never
been measured on any render.

---

## §5 · THE ANTI-HARDCODE TEST (applies to both phases)

The failure mode this exists to kill, verbatim from the operator:

> *"they just hard-coded a bunch of trash and made the screenshots look accurate… then when I test
> this on 15 other weeks, everything breaks."*

```
1  the build sees the FITTED weeks          2026-04-20 (the report week), 2026-07-06
2  the build does NOT see the HELD-OUT set  drawn AFTER the build freezes, by the operator
3  score both sets
       fitted HIGH + held-out LOW   ->  HARDCODED, REJECT
       both HIGH                    ->  real derivation
       both LOW                     ->  broken, fix
4  the structural discriminator: feed two different weeks and diff the emitted
   geometry. If the rungs are byte-identical across two weeks, the ladder is a
   constant and the whole indicator is a screenshot machine.
```

**Phase 1 makes this cheap:** a hardcoded box chain cannot produce real entry/exit bar times for a
week it has never seen. `P1-2` **is** the anti-hardcode test.

---

## §6 · WHAT THE REFERENCES ACTUALLY ARE (so they are not misread again)

Measured by the audit, both frames:

```
win-ssbs.png   943×530   GBPUSD 1m
  ~30 thin stripes, 68% of pane rows tinted — the ladder IS the background
  6 white-outlined rectangles chained in time:
     RECOVERY SURGE · PIERCING WHIPLASH · SWING SCALPS ·
     PIERCING BREAKOUT SURGE · RECOVERY · WHIPLASH
  every box edge ON a stripe boundary · consecutive boxes share boundaries
  diagonal segments: 0

win-rbs.png    938×527   GBPUSD 15m
  ~8 filled levels 15–32 px covering the pane
  3 axis-aligned coloured rectangles, edges on the level lines
  price drops to a level line and the next band begins
  diagonal segments: 0
```

**They are annotated by a different tool on a different instrument — they are STRUCTURE DIAGRAMS,
not the target render.** Use them for: box proportions, chaining, edge-on-level, ladder density.
Do not use them for: labels, colours, or as a pixel-match target.

---

## §7 · SCOPE, THIS TURN

```
WRITTEN   this spec
NOT DONE  any build work — explicitly forbidden until the workflow is correct
NOT DONE  the phase-1 render verified against gate 8
NOT DONE  the phase-2 line at all
NOT DONE  the 12-week battery with held-out weeks
```

**Next action is spec/workflow, not code.** The open work in the spec layer:
1. fold this two-phase split into `EW_B2_ENGINE2_SPEC.md` (which currently describes a polyline)
2. define the phase-1 box renderer's turn-by-turn execution workflow
3. define the held-out-week generator (the operator draws it, not the builder)
