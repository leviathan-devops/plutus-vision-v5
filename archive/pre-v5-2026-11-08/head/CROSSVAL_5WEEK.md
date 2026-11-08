# CROSS-VALIDATION — 5 RANDOM TRADING WEEKS (W5 · the operator's litmus test)

**THE CLAIM UNDER TEST.** The PLUTUS VISION indicator renders Engine 1 (the institutional pressure
zones) + Engine 2 (the shape chain) in the v8's STRUCTURE — 5 zones (2 RES above the price, 1 MID
straddling, 2 SUP below), sorted TOP→DOWN — on ANY week, not just the one canonical week.

**THE AUTHORITY.** `Original_Canon_Data/Pine Scripts/trident_v8.pine` — the v8 zone table
(`trident_v8.pine:187-192`: `dxy_zTp`/`dxy_zBt`/`dxy_zCat`/`dxy_zDeg`/`dxy_zNm`) and its one computed
piece, `calcZFP` (`trident_v8.pine:334-338`). The prompt
(`Original_Canon_Data/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:1490-1501`) — the pressure-degree
table (score → degree).

**THE METHOD.**
1. Five trading weeks are chosen at random (disjoint from the canonical week 2026-W29).
2. For each, the bars are the week's own fixture: `fixtures/bars/cv-<monday>.json`.
3. The engine extracts the zones from THOSE bars: `scripts/e1_extract.py --pair DXY --out data/e1`
   (the spot is the anchor's price, NOT `bars[-1]` — the anti-derail law).
4. The pine is rebuilt for the week: `PV2_PAIR=DXY PV2_WEEK=<monday> python3
   scripts/lqz_vision_v2_build.py plutus-vision-v2.pine`.
5. The rig renders it: `scripts/pv-server.py :9851` (restarted with the week's fixture) +
   `pine-station :9741` + `vil-rail :9754` + CDP `:9222`, the app on display `:3`.
6. The window is captured with `DISPLAY=:3 import -window "$(xdotool search --name 'Plutus Vision')"`
   — the LIVE window, never a fixture.

**THE ANCHORS (file:line).** The fence contract: `SPEC.md:1`. The canon blueprint:
`context_management/ENGINE_BLUEPRINT.md:1`. The current state: `context_management/CURRENT_STATE.md:1`.
The week-1 payload: `data/e1/DXY-2026-04-20.json:1`. The week-5 payload:
`data/e1/DXY-2026-08-31.json:1`. The crossval evidence: `evidence/crossval-5week.json:1`.

**THE EVIDENCE — the payload structure (the mechanical gate).** For every week the payload's `zCat`
sequence is `RES,RES,MID,SUP,SUP` (the v8's exact structure) with ≥1 RES and ≥1 SUP:

| week (target) | fixture | spot | zones | zCat | render ok |
|---|---|---|---|---|---|
| 2026-04-20 | cv-2026-04-13 | 98.300 | 5 | RES,RES,MID,SUP,SUP | ok:true |
| 2026-05-11 | cv-2026-05-04 | 98.008 | 5 | RES,RES,MID,SUP,SUP | ok:true |
| 2026-06-22 | cv-2026-06-15 | 100.851 | 5 | RES,RES,MID,SUP,SUP | ok:true |
| 2026-07-06 | cv-2026-06-29 | 100.872 | 5 | RES,RES,MID,SUP,SUP | ok:true |
| 2026-08-31 | cv-2026-08-24 | 99.641 | 5 | RES,RES,MID,SUP,SUP | ok:true |

**THE EVIDENCE — the per-week zone tables (the computed payloads).** Each row is the zone's
`name | zCat | degree | calcZFP` as the engine emits it (`data/e1/DXY-<week>.json`):

**2026-04-20 (spot 98.300)** — `data/e1/DXY-2026-04-20.json`
| zone | zCat | degree | calcZFP |
|---|---|---|---|
| IP Resistance Ceiling | RES | MODERATE | 3% |
| Upper IP Resistance | RES | MODERATE | 3% |
| Equilibrium Zone | MID | MODERATE | 3% |
| Mid-Range Support | SUP | MODERATE | 3% |
| Key IP Support | SUP | LIGHT | 3% |

**2026-05-11 (spot 98.008)** — `data/e1/DXY-2026-05-11.json`
| zone | zCat | degree | calcZFP |
|---|---|---|---|
| IP Resistance Ceiling | RES | MODERATE-HEAVY | 4% |
| Upper IP Resistance | RES | MODERATE-HEAVY | 4% |
| Equilibrium Zone | MID | LIGHT | 4% |
| Mid-Range Support | SUP | MODERATE-HEAVY | 4% |
| Key IP Support | SUP | LIGHT | 4% |

**2026-06-22 (spot 100.851)** — `data/e1/DXY-2026-06-22.json`
| zone | zCat | degree | calcZFP |
|---|---|---|---|
| IP Resistance Ceiling | RES | MODERATE-HEAVY | 3% |
| Upper IP Resistance | RES | MODERATE-HEAVY | 3% |
| Equilibrium Zone | MID | MODERATE | 3% |
| Mid-Range Support | SUP | MODERATE | 3% |
| Key IP Support | SUP | LIGHT | 3% |

**2026-07-06 (spot 100.872)** — `data/e1/DXY-2026-07-06.json`
| zone | zCat | degree | calcZFP |
|---|---|---|---|
| IP Resistance Ceiling | RES | LIGHT | 0% |
| Upper IP Resistance | RES | MODERATE | 3% |
| Equilibrium Zone | MID | MODERATE-HEAVY | 3% |
| Mid-Range Support | SUP | MODERATE | 7% |
| Key IP Support | SUP | LIGHT | 4% |

**2026-08-31 (spot 99.641)** — `data/e1/DXY-2026-08-31.json`
| zone | zCat | degree | calcZFP |
|---|---|---|---|
| IP Resistance Ceiling | RES | MODERATE-HEAVY | 4% |
| Upper IP Resistance | RES | MODERATE-HEAVY | 4% |
| Equilibrium Zone | MID | MODERATE | 4% |
| Mid-Range Support | SUP | MODERATE-HEAVY | 4% |
| Key IP Support | SUP | LIGHT | 4% |

**THE EVIDENCE — the live captures.** `evidence/w5/wk-<week>.png` — the rendered window per week,
each carrying the 5 zones (RED for RES, ORANGE for MID, TEAL for SUP) + the E2 shape chain, with the
week's own bars visible (the forward price action to the right of the anchor). The canonical week's
full-window capture is `evidence/FINAL-RENDER-2026-10-07.png`.

**THE COMPARISON (the v8's structure vs the engine's).**

| property | the v8 (the author's hand-typed data, Apr 20-24) | the engine (computed, any week) |
|---|---|---|
| zone count | 5 | 5 ✓ |
| zCat order | RES,RES,MID,SUP,SUP | RES,RES,MID,SUP,SUP ✓ |
| sort | TOP→DOWN | TOP→DOWN ✓ |
| zNm | IP Resistance Ceiling · Upper IP Resistance · Equilibrium Zone · Mid-Range Support · Key IP Support | identical ✓ |
| label format | `nm \| degree \| calcZFP% ZFP` | identical (VERBATIM, `trident_v8.pine:364`) ✓ |
| calcZFP | `(tp-bt)/refRange*100`, refRange=1.60 DXY | identical (VERBATIM, `trident_v8.pine:334-338`) ✓ |
| colour ladder | RED (RES) / ORANGE (MID) / TEAL (SUP) × the degree | identical ✓ |
| degree | HEAVY · MOD-HEAVY · MOD-HEAVY · MODERATE · HEAVY (**hand-typed literals**) | computed from the confluence score (the prompt's table) |
| zone prices | **hand-typed literals for ONE week** | computed from the bars (any week) |

**THE MECHANICAL GATES (re-run on the tree, this session).**
- `python3 scripts/e1_st_18.py` → `RESULT pass=8 fail=0`
- `python3 scripts/e2_tests.py` → `RESULT pass=46 fail=0`
- `python3 scripts/e1_render_tests.py` → `RESULT pass=24 fail=0`
- `python3 scripts/wave_gates.py` → `RESULT pass=18 fail=3` (the 3: W1e + W2b/W2c, all data-gated)
- `git log --oneline -1` → `a7b07b3 test(w4-w5): the live render evidence …`
- `sha256sum plutus-vision-v1.pine` → `0d20e8314ce992fc…517bd1` (the HARD STOP H1 seal, unchanged)

**THE HONEST REMAINDER.**
- The v8's degrees are HARDCODED literals (`trident_v8.pine:190`), so a week-by-week degree
  comparison against a computation is impossible — the v8 has no computation to compare.
- The engine's degrees are COMPUTED (the prompt's `prompt:1490-1496` table applied to the confluence
  score). The extremes (ceiling + floor) reach MODERATE-HEAVY/LIGHT, not the v8's HEAVY, because the
  OPTIONS + ANALYST dimensions are [NO DATA] (F-52 — the sources are 403/Cloudflare blocked). The 4H
  dimension (Step 9.7 Tier 1/Tier 2) IS wired and fires.
- The rig's `pv-server` loads ONE fixture at startup, so a per-week capture requires a per-week
  restart + a browser hard-reload (the browser caches `/api/v1/chart/bars`); the W5 script does both,
  so the bars + zones + E2 chain are the week's own.
- **W1e** (the floor zfp < the mid zfp) is a gate premise that CONTRADICTS the v8's own data (F-53:
  the v8's floor zfp 21% > its mid 8%). The engine matches the v8; the gate differs.
- **C16** (the operator's look) is the only closer and is inherently the operator's.
