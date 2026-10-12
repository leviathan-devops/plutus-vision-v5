# MUSE_AGENT macro context (compaction-survival record)

- Mission phase NOW: understand-only. Read fractal arch + 5.3.3 (E1/E2) + corrected E3, build graph, run live-chart
  exercises. Indicator build is GATED — do not start until operator permission.
- Target LATER: Plutus Vision indicator renders E1+E2+E3 dynamically, temporally scoped to most-recent bar
  (bar-replay safe), ≥90% on 12 random DXY-basket weeks (rewind to Monday London open, play 10x to Friday close).
- Canon status: E1+E2 v5.3.3 CONFIRMED A+ (~95%), frozen. Corrected-E3 is the setup authority. Current Pine renders
  E1 ~95%; E2/E3 absent.
- Core loop to never forget: E1 WHERE (zones+ZFP) → E2 WHAT PATH (1H shape chain, ZFP-conditioned, day
  decomposition, inverted-direction pair translation) → E3 WHERE EXACTLY (R3-obeying anchors, sniper entry,
  ladder SL, opposing-rung TP, RRR≥3.0, BE1–BE12, rockets, cascade, Avatar audit).
- Elemental one-liner: Earth anchors, Fire ignites, Water forms, Air maps; Air→new Earth closes the cycle.
- Workspace: `PLUTUS_VISION/MUSE_AGENT/` on branch `MUSE_AGENT`. Artifacts: README, FRACTAL_SYNTHESIS,
  CANON_GRAPH.json, EXERCISES, CONTEXT (this file).
- Recovery: after compaction, re-read this file + FRACTAL_SYNTHESIS + EXERCISES + CANON_GRAPH.json, in that order.

## Recovery protocol (post-compaction, in order — estimated 5 minutes)

1. Read this file (mission phase + core loop). Confirm phase is still understand-only unless the operator's
   handover message says otherwise — never assume the gate lifted.
2. Read FRACTAL_SYNTHESIS.md §§1–9. The per-section "Operational consequence" lines are the compressed canon;
   the anchor index (§9) points at the exact upstream lines if depth is needed.
3. Read EXERCISES.md Exercises 1–3. They are the proof the synthesis is grounded (measured bars vs E1/E2 JSONs).
4. Load CANON_GRAPH.json for entity/relation checks (R3 law, ZFP bands, freshness ladder, rocket types).
5. Verify branch (`git branch --show-current` → MUSE_AGENT) and clean tree before writing anything.
6. Key upstream anchors (all opened this session): Original_Canon_Data/Toolset/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:1819
   (ZFP transitions), Original_Canon_Data/Toolset/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:1984 (E2 output),
   Original_Canon_Data/Toolset/TRIDENT_v5.3.3_CORRECTED_E3_ENGINE.md:473 (DAY assignment),
   Original_Canon_Data/Toolset/TRIDENT_v5.3.3_CORRECTED_E3_ENGINE.md:72 (R3 law),
   Original_Canon_Data/Toolset/Trident_Fractal_Architecture_FirstPrinciples_v2.3.md:251 (cycle).

## Element cheat-sheet (do not operate without this)

- EARTH = liquidity + IP zones. Heavy (IP/bedrock) > standard (LSZ/soil) > thin (never entry/SL).
  Anchors everything: entries, SLs, Fib spiderwebs, rocket trip-wires.
- FIRE = S/D. BoM = origin/hottest, ENTRY-PRIMARY, virgin 100%. MoM = continuation/cooling, LADDER-ONLY.
  Freshness: VIRGIN → ACTIVE-1 (~80%) → ACTIVE-2 (~50%) → DEPLETED (TP-only) → FORTRESS (flip) → BROKEN (never).
- WATER = shapes SS/BS/R/RS/WL/RWL/PWL/PRWL/WLS/PBS. Chain law: target-zone ZFP decides, not momentum.
  BS→ZFP<20% = RWL (the April-20–24 error class). R persisting >1 session reclassifies to SS.
- AIR = Fib. Wind until anchored to 2× Earth points → spiderweb. Wormholes 0.382↔1.382, 0.618↔1.618
  (strongest). Entry band 0.618–0.786; reinforcement 1.382–1.786 (90%); trigger 2.382–2.786.
- Cycle: Earth→Fire→Water→Air→new Earth. Avatar = E + FLR with all four at one price.

## E1/E2/E3 handoff lines (frozen, do not renegotiate)

- E1 emits: zone ID, top/bottom, zfp, confluence, zone_type, poi_tier, bom_mom, reactionCount, timeframe.
  Reference: Original_Canon_Data/Toolset/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:922.
- E2 emits: 5-day shape+direction+keyZoneId+triggers+confidence, chain ≤5 with audit trail, alternative chain
  at Decision Zone, pair-translated chains (same shape, inverted direction). 1H primary, 4H validates.
  Reference: Original_Canon_Data/Toolset/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:1887.
- E3 emits (R3-obeying): entry at approaching edge (TS-1), ladder SL (3p back-edge or next-rung), opposing-rung
  TP (single), RRR≥3.0 with 3-attempt repair, DAY+session+hit-window (12-step), BE1–BE12, rockets (FLR/FR/LR),
  cascade DXY→EU inverse →GU kept, Avatar audit. Reference: Original_Canon_Data/Toolset/TRIDENT_v5.3.3_CORRECTED_E3_ENGINE.md:927.

## Current-state ledger (2026-10-12, this session)

- DONE: fractal arch full read; 5.3.3 header map + E1/E2 deep reads; corrected-E3 deep reads; 3 measured
  exercises; graph + synthesis + context artifacts; MUSE_AGENT branch + initial commit path (W-9 satisfied).
- NOT DONE (gated): indicator build; 12-week verification set; operator handover review. No .pine touched.
- Measured evidence on disk: data/e1/DXY-2026-07-06.json:1 (5 zones), data/e2/DXY-2026-07-06-e2.json:1
  (R→SS→SS→BS→BS), fixtures/bars/2026-07-06.json:1 (382 1H bars), scripts/e2_engine.py:1 (E2 reference),
  plutus-vision-v2.pine:1 (indicator baseline, untouched).
- Other agents' dirs (MIMO_AGENT/, DEEPSEEK_AGENT/) observed in tree, never touched — split-test isolation holds.

## Failure-mode watchlist (derailments I am pre-committed to catching in myself)

1. Momentum-first E2 reads (predicting continuation into a Hard Wall). Antidote: target-zone ZFP first —
   Original_Canon_Data/Toolset/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:1819 before any chain extension.
2. MoM entries dressed as BoM entries. Antidote: check bom_mom + reactionCount before any entry claim;
   MoM reversal = hard reject, no exceptions — Original_Canon_Data/Toolset/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:1145.
3. Fabricated anchors (levels with no E1 zone ID + E2 shape day). Antidote: R3 trace on every number —
   Original_Canon_Data/Toolset/TRIDENT_v5.3.3_CORRECTED_E3_ENGINE.md:72.
4. Density/attack conflation ("Air attack", "Water entry"). Antidote: name the axis every time; tools vs attacks
   are different classifications — Original_Canon_Data/Toolset/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:566.
5. Regurgitation without application. Antidote: every synthesis claim must pair with an exercise row or a
   measured number (EXERCISES.md), or it gets cut.
6. Scope creep into indicator code before the gate lifts. Antidote: phase line at the top of this file;
   `git status` must show .pine untouched until the operator's explicit go.
7. Context loss across compaction. Antidote: this file + the recovery protocol above; CANON_GRAPH.json as the
   machine-checkable backstop (entity IDs stable across sessions).

## Session transcript pointers (where the work happened)

- Canon reads: fractal arch Read (lines 1–717) + 5.3.3 header grep + deep-reads (§§2.0.2–2.3, Protocol B,
  Part VI) + corrected-E3 deep-reads (Phases 0–12, output format, data model head).
- Measurements: July-week price-vs-zone python pass (382-bar fixture), April fixture-scale pass, EU ladder pass.
- Gate fight: W-9 REJECT on first commit → expanded all four .md files with real-anchor content → recommit.
- Canonical data refs: data/e1/DXY-2026-07-06.json:1, data/e2/DXY-2026-07-06-e2.json:1,
  fixtures/bars/2026-07-06.json:1, scripts/e2_engine.py:1, plutus-vision-v2.pine:1.

## Glossary (canonical terms, one line each — full definitions in FRACTAL_SYNTHESIS.md)

- LSZ: Liquidity Sweep Zone, standard Earth. IP zone: Institutional Pressure, HEAVY Earth.
- BoM: Beginning-of-Move S/D, hottest Fire, entry-primary. MoM: Middle-of-Move, ladder-only.
- ZFP: Zone Failure Probability (<20 Hard Wall, 20–40 mid, >45 failing, >70 piercing).
- SS/BS/R/RS/WL/RWL/PWL/PRWL/WLS/PBS: the Water taxonomy (shapes, not setups).
- Spiderweb: Fib anchored to 2× Earth points. Wormhole: retracement↔extension self-reference.
- FLR/FR/LR: Earth-heavy / Fire-precision / Water-precision rockets (attack axis).
- R3: E2 designates, E3 obeys; every anchor traces to E1 zone + E2 shape day.
- BE1–BE12: blind-execution labels; missing label = rejected setup.
- Avatar State: E + FLR with all four elements at one price.
