# BLUEPRINT — PLUTUS VISION INDICATOR PORT

## MISSION
Port the Toolset's Engine 1 (9-Pillar zone map) + Engine 2 (macro shape chain) INTO the Pine
indicator so it computes live from the chart's bars and renders on the V1 baseline — transcribed
from the approved Toolset, not re-derived; computed, not typed; NO report step.

## AUTHORITY (the Toolset — 6 files, fingerprinted)
- Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md (4216 ln, md5 9e0e4d1a...) — THE SPEC (E1 Part III, E2 Part VI, ZFP Appendix B, Pine rules Part X)
- TRIDENT_v5.3.3_CORRECTED_E3_ENGINE.md (1685 ln) — the operator's E3 fix
- trident_engine3_v8.py (1284 ln) — the WORKING reference
- Leviathan_Report_Template_v2.0.py (1576 ln) — the RETIRED oracle (validation, not product)
- Trident_Report_Validator.py (780 ln) — the RETIRED checklist
- Trident_Fractal_Architecture_FirstPrinciples_v2.3.md (721 ln) — the E1/E2/E3 role contract
SCOPE LAW: nothing outside the Toolset is cited.

## MODULE MAP
engine bars -> [e1_pillars.py: P1,P2,P5,P6,P9 live; P3,P4,P7,P8 baked] -> levels[]
            -> [e1_zone_assembly.py: cluster -> score -> degree -> zfp -> name] -> zones[]
            -> [e2_engine.py: §6.4.1 ZFP-conditioned chain] -> shapes[]
            -> [pine_emit.py -> plutus-vision-v2.pine] -> the render on the V1 baseline.

## THE CORE FIX (the ZFP)
zfp(zone, bars) = base(zone_type) [B.1: Hard 5-15 / Standard 15-30 / Soft 30-50 / One-Touch 50-70 /
Post-Expiry 20-40 / LSZ special] + SUM modifiers [B.2: Spring Release +20-30 / catalyst +15-25 /
momentum +10-20 / cross-pair +15-25 / cascade +20-30 / regime change +15-25], clamp 0-100.
PROOF: a breakout-week ceiling reads HIGHER than the same zone in consolidation.

## THE 8 PHASES (owner -> exit gate)
P0 ABSORB goal-prompt -> baseline measured this turn
P1 SPEC goal-prompt/build-package -> DPL1 + wave-plan written (this package)
P2 PREFLIGHT hydra-mode -> P5 checklist all green
P3 EXECUTE hydra-mode + SDD -> every wave audited (per-hunk verdicts), battery green
P4 RUNTIME runtime-grade -> the live rig operated; bug ledger non-empty
P5 ADVERSARIAL red-team -> a full corpus pass: ZERO confirmed defects
P6 DOCUMENT canon + ship -> U-gates + S-gates PASS with the AUDIT GATE line
P7 CHECKPOINT saving-checkpoints -> structure gate passed (src, dist+SHA, docs, visual, seal)
P8 VERDICT goal-prompt -> the legal-stop definition met in FULL

## INTERFACES (frozen — consumers build against these)
- Level: {price: float, label: str, technical/options/analyst/structural/psychological: 0..2, bonus: <=2}
- Zone: {top, bottom, zCat: RES|MID|SUP, zTir: T1|T2, confluence: int<=14, pressure_degree, zfp: int, poi_tier: 1|2}
- lsz: {range:[lo,hi], type: Demand-side|Supply-side, source, function, priority}
- payload: the e1_injected_* typed arrays (top/bottom/confluence/zfp/cat/id/degree)

## FAILURE MODES (each mapped to a fix + a gate)
- ZFP carries no failure info -> the base+modifiers fix -> test_zfp_discriminates
- fabricated zone count -> data-driven emit -> test_zone_count_data_driven
- rank-based names -> positional names -> test_names_positional
- hand-written payload -> computed emit -> test_payload_computed
- flat dimensions -> per-level compute -> test_dimension_not_flat
- V1 regression -> the seal gate -> test_v1_seal_intact

## REPLICATION RECIPE
1. Read the Toolset end-to-end. 2. Transcribe the ZFP (Appendix B) into e1_zfp.py.
3. Transcribe the 9-step assembly. 4. Port the chart-computable pillars into Pine.
5. Emit the payload from computed zones. 6. Run the differential + the 5-week litmus.
7. Seal. NO report generator, NO hand-written payload, NO derivation over transcription.

## HONEST GAPS
- OD-1 (where the computation runs) + OD-4 (the canonical week) are OPEN — the operator rules.
- P3/P4/P7/P8 need external data (the recorded F-52 block); their structure can be built, data may stay [NO DATA].
- The backtest tab (agent-face.mjs +604 uncommitted) is a SEPARATE surface (OD-3).

## AS-BUILT (2026-10-11 — what actually shipped, W1→W7)
- OD-1 RULED A3 (PIN_INDICATOR_PORT_BUILD.md:73): P1/P2/P5/P6/P9 run LIVE in the
  indicator from the chart's own bars; only P3/P4/P7/P8 may bake. A2 forbidden.
- The W5 artifact was RESURRECTED, not rewritten: the pre-restore computed pine
  (git 0b40379) already carried SC-19=0 with 19 ta.* calls; the audit fixed 6
  defects in it (F-132 WL-first order, F-133 Saturday anchor, F-134 baked week
  tag, F-135 5x tbl_row decl, F-136 empty table, F-137 flat-tail crush) and the
  file now computes E1+E2 live (JEV_GATE/run_gate.sh:54).
- The ONLY success gate is the JEV gate (PIN_INDICATOR_PORT_BUILD.md:6): the full
  context chunked, one noul per chunk, all-act or REJECT. W6 wires a fresh
  5-week litmus + a sha-bound :99 screenshot into EVERY chunk before JEV judges.
- Dead paths removed per the recipe's clause 3: the v8 width calcZFP (F-55 second
  ZFP), the LSZ layer (operator-ruled out), e1WeekTag, _zfp0, three theatrical
  inputs. The v1 region is byte-identical to the C16-approved copy (SPEC.md:21).
- P3/P4/P7/P8 remain [NO DATA] behind loud-fail guards (the opt-strike layer
  renders nothing when the harvest is down — never fabricated).
- W7 committed the keepers and deleted the slump per forensic/SLUMP_MAP.md:2
  (twin, orphans, scratch, 4 checkpoint dupes) with the fence PASS 5/5 in the
  commit message. test_tree_clean guards porcelain==0 + one v2 renderer.

## OPERATING RECORD (the rig + the evidence chain, 2026-10-11)
- THE RIG: pv-server :9851 (renderer + workspace proxy) · pine-station :9741 (the
  Pine runner) · VIL rail :9754 · judge :8090. THE APP is the native desktop
  shell `~/.local/bin/pine-ide` (GTK+WebKit2). OFF-DISPLAY LAW: the operator's
  physical display stays OFF — everything runs on agent xvfb :99, captures via
  `import -window` (PIN_INDICATOR_PORT_BUILD.md:23).
- THE IDE BUFFER IS A COPY: the editor restores from WebKit localStorage
  (`plutus.pine.editorSource`, UTF-16LE SQLite) when the :9430 face backend is
  down — editing the renderer file does NOT update the IDE. Every file edit is
  followed by a buffer re-sync + a fresh capture; the litmus ASSERTS buffer-sha
  == file-sha before it binds a screenshot (JEV_GATE/run_gate.sh:54).
- THE EVIDENCE CHAIN: station /run (counts + labels) → :99 screenshot (pixels,
  opened and read, never trusted by count) → litmus evidence (5 weeks +
  differential + shot-sha) → EVERY JEV chunk → verdict. No link is skipped.
- FAILURE DISCIPLINE: every rejection lands in FAILURE_LOG.md the moment it is
  observed (F-129..F-137 this wave set); the JEV gate is the ONLY success gate
  and no battery, exit code, or prose verdict substitutes for it (SPEC.md:1).
