# 01 — DISCOVERY (measured, this session)

Everything below was measured on disk. Nothing is estimated. Commands are given so a fresh
agent can re-run them.

---

## §1 THE LANDING ZONE

```
/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION
```
`git branch` = main · `git rev-parse HEAD` = `4044e97cca441daa49b2dd4d1b440ec8b212fc57` ·
backed up on `origin/backup/v2-engines-2026-10-03` (verified: the remote ref equals local HEAD,
`refs/pull/1/head` matches, 3836 files in the remote commit).

## §2 THE SEALED BASELINE (v1) — the thing never touched

```
$ sha256sum plutus-vision-v1.pine
0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1   76550 B   1270 lines

$ grep -c 'pv_alerts\|smc_'                plutus-vision-v2.pine   -> 226
$ grep -c 'smc_storeOrdeBlock\|smc_drawOrderBlocks'                -> 6
$ grep -c 'lqzColorLq\|f_lqzRender'                                -> 4
$ grep -icE 'entry\.|strategy\.|sl_|take\.profit|position_size'    -> 0
```

**The builder refuses on drift** (`scripts/lqz_vision_v2_build.py:53`, `verify_v1_untouched()`,
seal `V1_SEALED_SHA`): proven by appending one line — the build exited
`HARD STOP H1 — v1 HAS MOVED`. v1 was then restored to the exact sha.

## §3 WHAT ALREADY EXISTS (the machinery this build extends)

| artifact | lines | what it does | state |
|---|---|---|---|
| `plutus-vision-v2.pine` | 1694 | v1 verbatim + E1 + E2 injected | builds, renders |
| `plutus-vision-lqz/e1-render.pine` | 236 | the current E1 render (degree-banded) | **REPLACED by this build** |
| `plutus-vision-lqz/e2-render.pine` | ~120 | the E2 single polyline | keep |
| `scripts/e1_extract.py` | 24081 B | OHLC → levels → **6 zones**, pivots verified 1e-9 | the data source |
| `scripts/e2_engine.py` | 16025 B | the shape chain: `BS → RWL`, day decomposition | keep |
| `scripts/wire_e2.py` | — | runs the engine over a zone map → the E2 payload | keep |
| `scripts/lqz_vision_v2_build.py` | — | the composition: v1 + payload + E1 + E2 | edited |
| `scripts/e1_fetch.py` | — | the 9 sources; ST-1..ST-5 green | keep |

**The measured E1 output today** (`data/e1/EURUSD-2026-10-06.json`, run
`python3 scripts/e1_extract.py --week 2026-10-06`):

```
bars  1614 (broker-validated DXY 1H from fixtures/bars/2026-07-06.json)
spot  101.048
levels 74      zones 6
  LIGH_DEMAND_100.83  4/14 LIGHT  40%  100.831-100.831
  LIGH_DEMAND_100.85  4/14 LIGHT  40%  100.852-100.852
  LIGH_DEMAND_100.92  4/14 LIGHT  40%  100.916-100.918
  LIGH_SUPPLY_101.23  4/14 LIGHT  40%  101.226-101.226
  LIGH_SUPPLY_101.27  4/14 LIGHT  40%  101.267-101.267
  LIGH_SUPPLY_101.28  4/14 LIGHT  40%  101.281-101.281
```

## §4 THE REFERENCE — `trident_v8.pine` (the renderer to port)

From `/home/leviathan/Documents/WEB_AGENT_WARHEADS/Trident_Pine_Handover.zip` (83114 B, 13 files,
extracted to `/tmp/tph2/Trident_Pine_Handover`). NOTE: the file carries a non-UTF-8 byte — read
it with `errors="replace"`.

```
trident_v8.pine                                  668 lines   CURRENT single-week hardcoded
trident_v8_multi_pair_template.pine              793 lines   multi-pair template
trident_phase2.pine                              686 lines   runtime paste-buffer indicator
trident_phase1.py                               2219 lines   the generator (--report/--json)
trident_template.json                           1837 B       THE SCHEMA
MASTER_HANDOVER.md / BUILD_GUIDE.md / QUICKSTART.md          the prose
plutus_models.py / plutus_guardrails.toml                    the model client + limits
```

### THE PORT MAP (file:line, verbatim from the source)

| what | trident_v8.pine | copy or adapt |
|---|---|---|
| the date range | `:35-37` `timestamp(2026,4,6)..(2026,5,15)` | **ADAPT** → computed |
| the colour ladder R/G/T `_F1..6` + `_B1..6` | `:44-65` | **COPY verbatim** |
| `zfill()` `zbord()` | `:67-158` | **COPY verbatim** |
| `pressureLbl()` | `:157-158` | **COPY verbatim** |
| LSZ colours | `:160-162` | **DO NOT COPY** — the split test |
| pair detection | `:168-175` | copy (for the 4-pair wave) |
| the data arrays `dxy_zTp/zBt/zCat/zDeg/zTir/zNm` | `:187-192` | **ADAPT** → injected |
| `volLbl()` `calcZFP()` | `:320-338` | **COPY verbatim** |
| **THE IP ZONE DRAWING BLOCK** | `:352-365` | **COPY verbatim** (the loop) |
| the LSZ block | `:367-377` | **DO NOT COPY** — the split test |
| option strikes | `:379+` | separate layer (W6) |
| `generate_sample()` | `:1901` | not ours |

### THE v8 DATA CONTRACT vs WHAT WE PRODUCE

| v8 array | type | meaning | ours | gap |
|---|---|---|---|---|
| `dxy_zTp` | float | zone top | `top` | — |
| `dxy_zBt` | float | zone bottom | `bottom` | — |
| `dxy_zCat` | string | `RES`\|`MID`\|`SUP` | `zone_type` = supply\|demand | **THE GAP — derivable** |
| `dxy_zDeg` | string | `HEAVY`\|`MODERATE-HEAVY`\|… | `pressure_degree` | — |
| `dxy_zTir` | string | `T1`\|`T2` | `poi_tier` (int 1\|2) | cast |
| `dxy_zNm` | string | the zone name | `name` | — |

**The one gap is `zCat`**, and it is positional, not fetched:
`bottom > spot → RES` (entirely above), `top < spot → SUP` (entirely below), else `MID`
(straddles spot). **CORRECTED 2026-10-05:** the first draft wrote `top > spot`/`bottom < spot`,
which mislabels a straddling zone RES — ST-19c caught it; see RUNNING_DEBUG_LOG.

## §5 THE DOWNSTREAM CONSUMERS (blast radius)

```
scripts/lqz_vision_v2_build.py
  ├── verify_v1_untouched()        the H1 guard — untouched
  ├── strip_decl()                 removes array.from decls from the modules
  ├── build_payload()              emits the E1 + E2 typed arrays  ← EDITED
  └── build()                      v1 + decls + e1 + e2            ← EDITED
pine-ide/ide/renderer/
  └── plutus-vision-v2.pine        the served copy — redeployed each build
scripts/e1_extract.py              ← EDITED (+zCat, +this-week anchor)
plutus-vision-lqz/e1-render.pine   ← REPLACED (the v8 port)
```

## §6 THE RUNNING RIG (measured)

```
:9741  pine-station   the PineTS engine (transpiles + runs)
:9754  VIL rail       the byte-level ledger
:9851  pv-server      serves /pine.html + /api/v1/chart/bars
:9222  CDP            the browser the IDE drives
:3     X display      the nested weston (1638x996) — the IDE lives HERE, not on :99
```
`curl :9851/api/v1/chart/bars?pair=DXY&timeframe=1H` → 1614 bars · `pair=EURUSD` → 1603 bars.

**The rig's measured traps (all paid for):**
1. **`run()` returns a CACHED payload** unless the page is hard-reloaded. Two builds returned an
   identical sha and census. → reload `about:blank` → `/pine.html` before every measurement.
2. **`run()` returns `ok:true` with an EMPTY payload while still compiling.** → poll the on-screen
   `.pine-status` until it leaves `running…` before reading a census.
3. **The drawing store ACCUMULATES across runs** (v1's own labels do it too — `500 lines · 500
   labels` at cap after repeated runs). A per-run count is derived by difference, or from one run
   in a fresh page.
4. **The transpiler has neither `str.split` NOR `tonumber`**; it has `ta.atr`, not bare `atr`.
   `array.from([])` fails — an empty list carries no element type.
5. **`xloc.bar_time` with bounds derived from an off-chart anchor gets CULLED** — the F-17 root
   cause: the target week sat 83 days past the window's end and every box was dropped while its
   labels rendered (`anchors dropped` in the status line).

## §7 WHAT WAS NOT READ

- `trident_phase2.pine` (686 lines) — the runtime paste-buffer variant; not needed while the
  payload is injected at build time. Named for a later wave if the paste path is ever wanted.
- `plutus_guardrails.toml` (19463 B) — the guardrail config; scope-adjacent, unread.
- The full body of `trident_phase1.py` — only its structure was read (dataclasses, `parse_json`,
  `PineGenerator`, the arg surface). Its parser is NOT reused: our extractor already produces the
  schema, so only the `.pine` emission shape matters and that is `trident_v8.pine` itself.
- The 9 legacy indicator versions in the handover (`v310`/`v41`/`v51`/`v7`, all OBSOLETE per
  `MASTER_HANDOVER.md:2`) — explicitly historical.

## §8 THE LINEAGE / VARIANT TABLE

| version | lines | status | verdict |
|---|---|---|---|
| `trident_v8.pine` | 668 | CURRENT | **THE WINNER** — the single-week hardcoded, the visual system to port |
| `trident_v8_multi_pair_template.pine` | 793 | CURRENT | a SUPERSET for the 4-pair wave (W7); not needed for DXY-first |
| `trident_phase2.pine` | 686 | CURRENT | the runtime paste-buffer — an ALTERNATE delivery to ours |
| `trident_phase2_v3_HARDCODED.pine` | 483 | EXPERIMENTAL | abandoned per `MASTER_HANDOVER.md` |
| `trident_v310/v41/v51/v7` | 336-450 | OBSOLETE | historical |

**The fork point:** v8 (hardcoded, no paste) vs phase2 (runtime, paste). We take **neither
delivery**: we inject at build time. v8's RENDERER is what we take; its DATA PATH is what we
replace.
