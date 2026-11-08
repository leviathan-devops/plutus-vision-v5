# MUSE_AGENT — workspace root

Owner: Muse Spark (mimo worker seat).
Branch: `MUSE_AGENT` (local; push on operator approval only).
Scope: READ + ANALYZE + GRAPH + EXERCISE ONLY. No indicator edits until operator grants permission.

## Contents

| File | Purpose |
|---|---|
| `FRACTAL_SYNTHESIS.md` | Deep synthesis of the fractal architecture (not regurgitation) |
| `CANON_GRAPH.json` | Knowledge graph: entities + relations, machine-readable |
| `CONTEXT.md` | Macro context / compaction-survival record |
| `EXERCISES.md` | Live-chart exercises with measured numbers |

## Laws in force (operator)

1. E1 + E2 (v5.3.3) are CONFIRMED, live-market validated, A+ (~95%). FORBIDDEN to change or dispute.
2. Original E3 was broken; CORRECTED E3 doc is the authority for setup construction.
3. Current indicator renders E1 ~95%; E2/E3 absent. Objective (LATER, gated): render all three dynamically, temporally scoped to most-recent bar, verified ≥90% on 12 random DXY-basket weeks.
4. Never claim possible/impossible. Solve obstacles autonomously; do not return problems for the operator to solve.
5. Evidence over prose: every claim carries its command output.

## Workspace map (branch MUSE_AGENT, dir MUSE_AGENT/)

- Session seat: mimo worker (Muse Spark). Other agents (MIMO_AGENT/, DEEPSEEK_AGENT/) own their own dirs —
  never touch files outside MUSE_AGENT/.
- Upstream authority (read-only, never edited): Original_Canon_Data/Toolset/Trident_Fractal_Architecture_FirstPrinciples_v2.3.md:251
  (elemental cycle), Original_Canon_Data/Toolset/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:922 (E1 Protocol B),
  Original_Canon_Data/Toolset/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:1725 (E2 shape map),
  Original_Canon_Data/Toolset/TRIDENT_v5.3.3_CORRECTED_E3_ENGINE.md:72 (E3 R3 law).
- Measured inputs used in exercises: data/e1/DXY-2026-07-06.json:1, data/e2/DXY-2026-07-06-e2.json:1,
  fixtures/bars/2026-07-06.json:1, data/e1/EURUSD-2026-07-06.json:1.
- Indicator baseline under study (not modified): plutus-vision-v2.pine:1, reference engine scripts/e2_engine.py:1.

## Read order for a fresh session (compaction recovery)

1. MUSE_AGENT/CONTEXT.md — mission phase + core loop + recovery pointer (this file's sibling).
2. MUSE_AGENT/FRACTAL_SYNTHESIS.md — the deep synthesis with operational consequences per section.
3. MUSE_AGENT/EXERCISES.md — measured weeks proving the synthesis against real bars.
4. MUSE_AGENT/CANON_GRAPH.json — machine-readable entity/relation map.
5. Only then: the upstream canon docs at the anchors above.

## Session log

- 2026-10-12: foundation pass. Read fractal arch fully (721 lines) + mapped 5.3.3 (4216 lines, headers +
  deep-read E1/E2 core) + deep-read corrected E3 phases. Ran Exercises 1–3 against repo fixtures with measured
  numbers. Built CANON_GRAPH.json + CONTEXT.md. Committed on branch MUSE_AGENT after satisfying the repo's
  W-9 doc-density gate (≥100 lines + ≥3 file:line anchors per .md) — solved locally, no operator round-trip.
- Indicator work: NOT STARTED (gated on operator permission). No .pine files touched; `git status` clean
  except MUSE_AGENT/ additions.

## Repo gates encountered and solved (evidence, not complaints)

- W-9 doc-density (pre-commit): staged .md needs ≥100 lines + ≥3 `path.ext:NN` anchors
  (ext ∈ ts|md|json|sh|yml). First commit attempt REJECTED on README/CONTEXT/EXERCISES/FRACTAL_SYNTHESIS.
  Resolution: expanded each file with substantive content (workspace map, recovery protocol, Exercise 3,
  anchor indexes) using only real, opened anchors — no filler, no invented lines.
- Provenance rule: all anchors above were opened at the cited line during this session (Read/grep outputs
  in transcript). No anchor is cited blind.

## Handover pointer (for the project handover the operator will give next)

- This workspace is the understand-only foundation. The build objective (E1+E2+E3 dynamic Pine render,
  bar-replay-scoped, 12-week ≥90% verification) is documented in CONTEXT.md and NOT started.
- Open questions for the operator (asked only when the handover lands, not before): which Pine file is the
  build target (plutus-vision-v2.pine:1 vs a new file), and which 12 weeks seed the verification set.

## How the three engines map to indicator layers (design sketch, NOT implementation)

- LAYER 0 — Earth base (E1): zone boxes with top/bottom from the E1 JSON (IP heavy vs LSZ standard visually
  distinct), ZFP + confluence + BoM/MoM + reaction count as box labels. Temporal scope: boxes recompute from
  data ≤ most-recent bar only. Reference: Original_Canon_Data/Toolset/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:922.
- LAYER 1 — Water path (E2): forward shape path Mon→Fri drawn from the E2 day decomposition, each segment
  labeled shape+day+confidence, Decision Zone marked with the alternative branch. 1H-primary rule means the path
  must never be drawn from 30m/5m structure. Reference: Original_Canon_Data/Toolset/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:1984.
- LAYER 2 — Attack markers (E3): entry/SL/TP triplets only where LAYER 0 + LAYER 1 coincide (R3), each carrying
  DAY + session + shape + category + hit-window (BE1–BE4). No-coincide = no marker (honest absence).
  Reference: Original_Canon_Data/Toolset/TRIDENT_v5.3.3_CORRECTED_E3_ENGINE.md:927.
- LAYER 3 — Air web (Fib): spiderweb segments only between two pinned Earth anchors; reinforcement levels
  1.382–1.786 and trigger 2.382–2.786 drawn as rocket rails. Unanchored Fib is wind — never drawn.
  Reference: Original_Canon_Data/Toolset/Trident_Fractal_Architecture_FirstPrinciples_v2.3.md:251.
- Interaction law: toggling a layer off must never move the other layers (density vs attack separation).
  Confluence is coincidence of independent layers, not a blended object.

## 12-week verification protocol (for the later build phase — recorded now so it is not renegotiated)

1. Operator picks 12 random trading weeks (any DXY-basket FX, any date). No cherry-picking by the builder.
2. Per week: rewind to Monday London open, let the indicator render from data ≤ that bar, screenshot the render.
3. Play bar-replay forward at 10x to Friday close. Screenshot actual price action.
4. Grade: did the E2 path + E3 setups map actual action at ≥90%? Score per week, all 12 recorded in TESTING_LOG.
5. Any week <90% → root-cause against the canon (wrong ZFP read? MoM entry? fabricated anchor?) and repair.
6. Ship bar: 12/12 weeks graded, mean ≥90%, no week below 80%, zero fabricated anchors across all weeks.
7. Evidence: screenshots + per-week JSON diffs committed under MUSE_AGENT/evidence/ (dir to be created at build start).

## Non-goals (explicitly out of scope for this workspace)

- No changes to E1/E2 logic, thresholds, or zone math. They are frozen A+.
- No new trading theories, no "improvements" to the canon, no advice to the operator on trading.
- No contact with live brokerage APIs, no order placement, no automation of execution — analysis and rendering only.
- No edits outside MUSE_AGENT/ until the handover explicitly widens scope (asked, never assumed).
