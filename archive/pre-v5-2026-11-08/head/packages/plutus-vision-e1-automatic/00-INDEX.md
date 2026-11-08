# 00 — INDEX · PLUTUS VISION E1 AUTOMATIC

**The map.** Read this first. It names every file, its role, and the order to read them.

`2026-10-04` · class: **SYSTEM** · status: **PACKAGE MINTED** (spec APPROVED 0/8)

---

## §1 WHAT THIS PACKAGE IS

The complete pre-build engineering artifact set for ONE mission: **replace `trident_v8.pine`'s
manual data input with an automatic source, so E1's institutional pressure zones render for the
target trading week and follow bar replay — porting v8's renderer verbatim.**

It is the output of `create-planning` + `build-package`: a planning artifact that a build pass
consumes directly. The build itself is driven by the `/goal` pin minted from this package (see
`create`).

---

## §2 THE FILES (every one, its role)

| file | class | role | read when |
|---|---|---|---|
| `00-INDEX.md` | README | THIS map | first, always |
| `00-MISSION.md` | REPORT | the verbatim mission + 5 open questions | before any design |
| `01-DISCOVERY.md` | REPORT | the measured landing zone + the v8 port map | before dispatch |
| `plutus-vision-e1-automatic_DPL1_SPEC.md` | SPEC | the 14-section contract (APPROVED 0/8) | before every wave |
| `MASTER_BLUEPRINT.md` | ARCH | the machinery + the verbatim source to port | before the port (W4) |
| `CONTEXT_BIBLE.md` | BIBLE | the single-entry compaction-proof reference | on wake / compaction |
| `context_management/README.md` | INDEX | the package deltas + the fingerprint | on wake |
| `06-WAVES.md` | PLAN | the 10-wave dispatch order + the file map | before dispatch |
| `07-GOALS.md` | PLAN | the per-wave goal prompts + the hydra org | at each dispatch |
| `08-SPLIT-TEST.md` | REPORT | the deferred accuracy comparison | at W10 |
| `reference/trident_v8_lsz.pine` | REF | the frozen split-test arm A | at W10 |

---

## §3 THE READING ORDER (a fresh agent, cold)

```
1.  00-INDEX.md                (this — the map)
2.  plutus-vision-e1-automatic_DPL1_SPEC.md    (the contract: WHAT + done-when)
3.  MASTER_BLUEPRINT.md        (the machinery: HOW + the verbatim source)
4.  06-WAVES.md                (the order)
5.  07-GOALS.md                (the wave's own goal)
6.  CONTEXT_BIBLE.md           (keep open; the single entry)
```

**Then assert the fingerprint (from `context_management/README.md`):**
```bash
sha256sum plutus-vision-v1.pine    # 0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1
wc -l plutus-vision-v1.pine        # 1270
sha256sum reference/trident_v8_lsz.pine   # db24a18cc8cdd2349ce2419b1a1439c089ce32d634cdb85d1953f3855a54f985
```

---

## §4 THE QUICKSTART (the 30-second orientation)

```
THE MISSION   v8 renders institutional pressure zones for ONE hardcoded week. Make it automatic
              + chart-anchored, porting v8's renderer verbatim.
THE 3 MOVES   PORT the renderer · ANCHOR to the chart's last bar · INJECT the live data.
THE 1 GAP     v8 colours by zCat (RES|MID|SUP); we emit zone_type (supply|demand) — closed by a
              positional classify against spot (3 lines).
THE 5 FACTS   v1 sealed · xloc=bar_time only · time not now() · LSZ in reference/ · no E3.
THE DONE-WHEN C1..C16 all hold; the CT artifact reads PASS; the operator LOOKS (C16).
```

---

## §5 THE STRUCTURE (what plugs into what)

```
00-INDEX ─▶ MISSION ─▶ DISCOVERY ─▶ SPEC ─▶ BLUEPRINT ─▶ WAVES ─▶ GOALS ─▶ (the build)
                                     │           │
                                     ▼           ▼
                                 CONTEXT_BIBLE   reference/ (the frozen arm)
```

**The layers built (the target):**
```
L0 the seal     plutus-vision-v1.pine        (read-only)
L1 the data     e1_sources → e1_extract → e1_category
L2 the payload  data/e1/zones.json          (the v8 contract)
L3 the build    lqz_vision_v2_build.py
L4 the render   e1-render.pine              (the v8 port)
```

---

## §6 THE GATES (what blocks a dispatch / a ship)

| gate | command | blocks |
|---|---|---|
| G-SPEC | `spec-audit specPath=…` | REJECTED → no dispatch (CURRENT: APPROVED) |
| G-SEAL | `sha256sum plutus-vision-v1.pine` | drift → HARD STOP H1 |
| G-FLOOR | `grep -c 'pv_alerts\|smc_' plutus-vision-v2.pine` | ≠ 226 → refuse |
| G-E3 | `grep -icE 'entry\.\|strategy\.\|sl_'` | ≠ 0 → refuse |
| G-CT | the Phase-E 10 checks | any false → no declaration |
| G-AUDIT | `qwen-code-audit action=review` | FAIL → no ship |
| G-DOC | `wc -l` per class floor | under floor → refuse |

---

## §7 THE POINTERS (outside this package)

```
THE PROJECT      /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION
THE CANON        PLUTUS_VISION/context_management/   (the project-level 11 docs)
THE SEAL         PLUTUS_VISION/plutus-vision-v1.pine  (sha 0d20e831…)
THE PORT SOURCE  /tmp/tph2/Trident_Pine_Handover/reference_files/trident_v8.pine
THE RIG          :9741 station · :9854/:9851 renderer · :9222 CDP · :3 weston
THE SKILLS       create-planning · create · wave-planning · hydra-mode · script-test
                 · deep-container-testing · red-team-pressure-test · canon-doc-update
                 · ship-docs-update · saving-checkpoints
```

---

## §8 THE HONEST REMAINDER

```
UN-WIRED   S3-S9 (the 8 source harvesters) — scoped W6, implementation TBD
DEFERRED   W8 (the pairs) · W10 (the split test)
ASSERTED   the 4H path compiles (not run — the rig serves 1H)
PROVEN-ON  the VLM on a control table (6/6), not the live feed
```

---

## §9 THE NEXT ACTION

```
1. seal the round-0 checkpoint   Checkpoints/e1-automatic-round0-2026-10-04/
2. mint the /goal pin            (the create flow)
3. dispatch W1                   e1_week.py + ST-18
```

**The package is dispatch-ready.** The spec is APPROVED (0/8); the blueprint carries the verbatim
source; the waves are sequenced; the gates are named. Nothing blocks the first dispatch.

## ANCHOR INDEX (path:line)

- `plutus-vision-e1-automatic_DPL1_SPEC.md:1 (the contract)`
- `MASTER_BLUEPRINT.md:1 (the machinery)`
- `06-WAVES.md:3 (`WAVES: 10`)`
