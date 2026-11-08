# PLUTUS VISION — TUI CONTEXT HANDOVER (PRIMARY AGENT DUMP)
## Duplicate this session's working memory into a fresh agent / another TUI.
### Paste this file first. Then unzip the rest of the pack. Then do not renegotiate the rulings.

```
Package:      PLUTUS_VISION_CONTEXT_HANDOVER.zip
Written:      2026-10-10 (session 2026-10-10T11-10-52Z · _01a12582-35b6-76f1-aa9a-482884bc7ad9)
Author:       the session being handed off (OMP desk, cwd Shared_Workspace)
Consumer:     a fresh agent / another TUI / another machine
Product:      PLUTUS VISION — the self-hosted Pine IDE that renders the
              "Plutus Vision v1" indicator (sealed V1 baseline + E1 zones + E2 path)
Repo:         /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION
Remote:       https://github.com/leviathan-devops/plutus-vision.git
git HEAD:     caef1f9  (fix(restore): RESTORE the V2 ship-approved checkpoint)
Freeze:       the sealed V1 pine  pine-ide/ide/renderer/plutus-vision-v1.pine
              sha256 0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1
              (NEVER touch — HARD STOP H1 on drift)
```

## THE CONFLICT RULE (read this before anything else)

```
BINDING spec wins on implementation detail.
Handover wins on session rulings and dead-path names.
Superseded specs are APIs + history only.
Adjacent specs are other products.
Dead paths in this handover override any superseded "keep-alive / fallback" language.
```

Concretely for this pack:

- **BINDING** = `01_BINDING_SPEC/PIN_INDICATOR_PORT_BUILD.md` + `PLUTUS_VISION_INDICATOR_PORT_SPEC.md`
  + `JEV_GATE/`. On any implementation question (what computes the zones, how the gate judges,
  which pillars run live), BINDING wins. If this handover and BINDING disagree on a mechanism,
  BINDING is right and this file is wrong.
- **THIS HANDOVER** wins on: which checkpoints are approved, which paths are dead (the Chrome CDP
  hack, the nested weston :3, the multiple windows), and the operator's verbatim rulings.
- **SUPERSEDED** = every checkpoint's ship docs (they describe an EARLIER baseline; they are
  history, not current verification).

---

# 0. WHO YOU ARE NOW

You are the **builder-desk for PLUTUS VISION**. Not a researcher, not a meta-orchestrator, not a
chat partner. You inherit a live product with a sealed baseline, a running rig, 17 checkpoints,
and one binding build pin whose ONLY success gate is a local judge (JEV).

**Stance:**

- You **police the seal**. The V1 pine is byte-frozen (`0d20e831…`). Any edit to it is a HARD STOP,
  not a review item. `sha256sum` it before and after every wave.
- You **build by transcription, never by re-derivation**. The authority is
  `Original_Canon_Data/Toolset/` (6 files) + `Original_Canon_Data/Pine Scripts/trident_v8.pine`.
  Where the authority is silent, FIND the answer in it. Never author a formula.
- You **never grade your own work**. The builder is a CLAIM. `bash JEV_GATE/run_gate.sh` is the
  judge. A green battery, an exit code, a unit-test count, or your own prose is NOT a pass.
- You **look at the chart**. The deliverable is a render. A claim without an opened screenshot is VOID.
- You **use ONE window**. The operator's rig is one WebKitGTK shell on the operator's real Wayland
  display. Never the nested weston `:3`, never the agent xvfb `:99`, never a Chrome `--app` CDP
  window, never three windows.

**What you will not reopen (the operator ruled these; do not re-litigate):**

1. The IDE is the **proper desktop app** (`~/.local/bin/pine-ide`, WebKitGTK on `wayland-0`), NOT a
   Chrome CDP hack.
2. **ONE window.** Not three.
3. The approved V2 render is the **`282517ac…` pine** (the operator's C16-approved Jul-6 render).
4. The V1 baseline is **sealed** (`0d20e831…`); E1 sits ON TOP of it, never replaces it.
5. The success gate is the **JEV gate**; nothing else decides.
6. The zones must be **COMPUTED live in Pine** from the chart's bars; baking them as literals is
   FORBIDDEN (the A2 substitution).

---

# 1. THE ARC OF THIS SESSION

## 1.1 Requests, in order

This session (2026-10-10, cwd `Shared_Workspace`) opened on the OMP harness (vibe mode / JEV
warheads) and then pivoted hard onto the PLUTUS VISION product. The operator's product requests,
verbatim, in order:

| # | Operator (verbatim, trimmed to the load-bearing clause) | What it produced |
|---|---|---|
| R-1 | *"first runtime test … use the JEV tool to scan all of the failure data … tell me everything that vibe mode changes"* | the harness side (not this product) |
| R-2 | *"Do all of this in parallel. So nothing takes precedence over the other."* | the parallel-work ruling |
| R-3 | *"only use the good worker for actual work where we need to build things. Anything that is information retrieval use the fast."* | the fast/good routing ruling (warhead) |
| R-4 | *"Make a vision in the loop fucking Bible. Read it and fucking test this correctly. … If I send you an image and I ask you what the fuck is this, I know what it is. I'm pointing out that it is completely fucked. … fix it."* | the vision-in-the-loop law + the rejection of the current render |
| R-5 | *"Why the fuck are there three different pine IDE fucking open bro use one fucking window and just fucking update the script."* | the ONE-WINDOW ruling |
| R-6 | *"go back to the fucking checkpoint that I said was V2 ship approved and then restore that immediately."* | the RESTORE directive |
| R-7 | *"There is no fucking IDE open on my fucking desktop. You haven't restored shit."* | the rejection of a headless/nested render |
| R-8 | *"Launch the proper fucking dashboard app. Stop doing these bullshit ass fucking chrome CDP hack makeshift fucking trash."* | the PROPER-APP ruling |
| R-9 | *"restore the fucking ship package that was previously approved for V2 and fucking render it on the goddamn IDE."* | the RESTORE + RENDER directive (executed this session) |
| R-10 | *"I need a handover package minted immediately that self-contains the full Pine IDE as well as all of the approved checkpoints everything up that I can hand over to a different agent."* | THIS PACKAGE |

## 1.2 Rulings the operator already made (do not reopen)

- **RULE-A (the proper app).** The product's UI is the native desktop shell launched by
  `~/.local/bin/pine-ide`, rendering on the operator's real session (`wayland-0`). A Chrome
  `--app` window driven over CDP is **forbidden** — it is named "makeshift trash" and "bullshit".
- **RULE-B (one window).** Exactly one IDE shell. Multiple windows = derailment.
- **RULE-C (the approved V2 pine).** The approved artifact is the pine whose sha is
  `282517ac622769bdb34296ebee94fa8079da28dbab30bff1c27ae2146a74f011` — the operator's own C16
  look called it *"very good progress … I like that the engine two is reacting to the engine one."*
  The checkpoint's `dist/` copy had drifted to `87628e54…`; the approved one lives at
  `Checkpoints/e1-automatic-polish-2026-10-06/render/plutus-vision-v2.pine`.
- **RULE-D (the seal).** `plutus-vision-v1.pine` is byte-frozen. HARD STOP H1 on drift.
- **RULE-E (the gate).** The JEV gate is the only success gate. Self-grading is rejected on sight.
- **RULE-F (computed, not baked).** The E1 zones and the E2 path are computed in Pine from the
  chart's bars. Zero baked zone literals (SC-19 == 0).
- **RULE-G (the fast/good routing).** Retrieval → fast worker. Building → good worker.
- **RULE-H (vision in the loop).** You LOOK at the rendered chart. A count is not a verdict.

## 1.3 What this session already produced (file table)

| artifact | path | sha / note |
|---|---|---|
| the approved V2 pine (restored) | `pine-ide/ide/renderer/plutus-vision-v2.pine` | `282517ac622769bd…` (97662 chars) |
| the sealed V1 pine | `pine-ide/ide/renderer/plutus-vision-v1.pine` | `0d20e8314ce992fc…` |
| the operator workspace state | `:9851/api/v1/workspaces/operator` | rev 109 · autoRun TRUE · market DXY 60 |
| the plutus-vision workspace state | `:9851/api/v1/workspaces/plutus-vision` | rev 3 · autoRun TRUE |
| the IDE shell (running) | pid from `~/.local/bin/pine-ide --status` | WebKitGTK on wayland-0 |
| the gate verdict (current) | `bash JEV_GATE/run_gate.sh` | **JEV VERDICT: NO** (all 6 chunks noop) |
| this handover | `handovers/PLUTUS_VISION_TUI_CONTEXT_HANDOVER.md` | this file |

---

# 2. THE PRODUCT IN ONE PAGE

## 2.1 One sentence

**PLUTUS VISION is a self-hosted Pine IDE** — a native desktop shell that hosts a chart (Vela) +
a Pine editor + a Pine runner (pine-station, PineTS) + an agent face — whose purpose is to render
the **`Plutus Vision v1` indicator**: the sealed V1 baseline (SMC + sweeps + voids + pools) PLUS
**Engine 1** (the institutional-pressure zone map, computed live) PLUS **Engine 2** (the predicted
price path, computed live), on a fixture week, and to prove that render with a local judge.

## 2.2 The machine (ASCII trace)

```
┌─ THE OPERATOR'S DISPLAY (wayland-0, GNOME) ───────────────────────────────────┐
│                                                                               │
│   ~/.local/bin/pine-ide  (bash launcher, detect_route → wayland)              │
│        │  spawns ONE shell:                                                    │
│        ├─ desktop/tauri/target/release/plutus-vision   ← Tauri binary         │
│        │     (NOT BUILT on this host → falls through)                          │
│        └─ desktop/pine-ide-webview.py  ← GTK+WebKit2 shell (THE LIVE ONE)     │
│              loads http://127.0.0.1:9851/pine.html                             │
│                    │                                                           │
│        ┌───────────┴─────────── the renderer (:9851, scripts/pv-server.py) ──┐ │
│        │  static renderer root + /api/v1/chart/bars                          │ │
│        │  + PROXIES the agent-workspace API to the dashboard (:9430)         │ │
│        └───────┬───────────────────────────────────────────────────────────┘ │
│                │ window.PlutusPineShell = { editor, chart, workbench, run … } │
│                │                                                               │
│   ┌────────────┼─────────────────────────────────────────────┐                │
│   │  the IDE kernel  pine-ide/pine-ide/pine-ide.mjs          │                │
│   │    ├─ editor   pine-editor.mjs (Monaco-ish)              │                │
│   │    ├─ tabs     microtabs.mjs                             │                │
│   │    ├─ chart    Vela workbench (charts/workbench.bundle.js)│               │
│   │    ├─ vision   vision.mjs  (Pine frame → Vela drawings)  │                │
│   │    ├─ gate     gate.mjs    (→ :9754 VIL rail)            │                │
│   │    └─ face     agent-face.mjs (the agent cards + terminal)│               │
│   └────────────┬─────────────────────────────────────────────┘                │
│                │                                                               │
│   ┌────────────┴─────────── the Pine runner (:9741) ─────────┐                │
│   │  pine-ide/pine-station/server.mjs  (PineTS 0.10.0)       │                │
│   │    GET  /catalog  /canon  /cells  /bars  /health          │                │
│   │    POST /run  {script, pair, timeframe, limit, bars}      │                │
│   │      → {kind, title, plots, drawings:{labels,lines,boxes}}│                │
│   └────────────┬─────────────────────────────────────────────┘                │
│                │                                                               │
│   ┌────────────┴─────────── the VIL rail (:9754) ────────────┐                │
│   │  pine-ide/pine-ide/vil-rail.mjs                          │                │
│   │    /station/run proxy · /vil/look → local VLM (:4171)     │                │
│   └──────────────────────────────────────────────────────────┘                │
└───────────────────────────────────────────────────────────────────────────────┘

OFF-DISPLAY (the state plane):
  dashboard (:9430, Electron, CDP :9225) — owns agent_workspaces DB + the Orca bridge
      /api/v1/workspaces…  ← THE SOURCE OF TRUTH for what the IDE renders
  JevK5 judge (:8090, /v1/systemone) — the JEV gate's judge
```

## 2.3 Birth / execute / complete / notify / observe

| Stage | The machine |
|---|---|
| **Birth** | `pine-station POST /run` executes the pine over the fixture bars → a frame of drawings. No model in the loop. |
| **Execute** | the renderer draws the frame onto the Vela chart (`vision.mjs` maps Pine boxes/lines/labels → Vela drawings). |
| **Complete** | `bash JEV_GATE/run_gate.sh` returns `JEV VERDICT: YES` (route=act on EVERY chunk). The BUILDER is FORBIDDEN from self-grading. |
| **Notify** | the IDE status line ("ok 42ms") + the agent-face chat. Visible, but must NOT wake a loop. |
| **Observe** | `~/.local/bin/pine-ide --status`; `ss -ltnp`; the station's `/run` JSON; the opened screenshot. Read-only. |

## 2.4 What it is NOT

- NOT a report generator. The chart is the view; a report generator is AP-7 (forbidden).
- NOT a baked-literal indicator. Baking the pillars is AP-1 (forbidden).
- NOT a Chrome `--app` page over CDP (RULE-A).
- NOT a nested-weston `:3` app or an agent-xvfb `:99` app.
- NOT a Tauri app on this host (the binary is not built; the WebKit shell is the live path).
- NOT the PLUTUS/LIVE dashboard (`:9430`/`9441`/`9444`/`9448`) — that is a DIFFERENT product that
  happens to own the workspace store the IDE reads. **DO NOT TOUCH it** beyond the workspace API.

---

# 3. HOST / FREEZE INTERNALS

## 3.1 Coordinates

| coordinate | value |
|---|---|
| repo root | `/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION` |
| remote | `https://github.com/leviathan-devops/plutus-vision.git` |
| branch | `main` (plus `remotes/origin/backup/v2-engines-2026-10-03`) |
| git HEAD | `caef1f9` |
| launcher | `~/.local/bin/pine-ide` (a symlink; `readlink -f` → the repo's `desktop/` launcher) |
| desktop entry | `~/.local/share/applications/pine-ide.desktop` (Name "Plutus Vision") |
| the shell | `desktop/pine-ide-webview.py` (GTK+WebKit2) — the LIVE shell |
| the Tauri binary | `desktop/tauri/target/release/plutus-vision` — **NOT BUILT** (falls through to the shell) |
| the app log | `/tmp/pv-desktop-app.log` |
| the route file | `/tmp/pv-desktop-app.route` |

## 3.2 Ports owned by this project (and the ones that are NOT)

| port | owner | proof command |
|---|---|---|
| 9741 | PLUTUS_VISION pine-station | `ss -ltnp \| grep 9741` |
| 9754 | PLUTUS_VISION VIL rail | `ss -ltnp \| grep 9754` |
| 9851 | PLUTUS_VISION renderer (`scripts/pv-server.py`) | `read http://127.0.0.1:9851/pine.html` → 200 |
| 8090 | the JEV judge (JevK5, `/v1/systemone`) | `ss -ltnp \| grep 8090` |
| 9430 / 9225 | PLUTUS/LIVE dashboard (Electron + CDP) — **DO NOT TOUCH** | process cwd under `PLUTUS/LIVE/dashboard` |
| 9222 | the OLD Chrome CDP path — **DEAD** (RULE-A) | must NOT be listening for this product |
| :3 | nested weston — **DEAD** for this product | |
| :99 | agent xvfb — **DEAD** for this product | |

## 3.3 The workspace API — the source of truth (this is how the IDE picks what to render)

The renderer proxies `/api/v1/workspaces…` to the dashboard (`:9430`). The IDE's face loads the
**operator** workspace on boot (`plutus.face.active = 'operator'` in localStorage).

```
GET  http://127.0.0.1:9851/api/v1/workspaces
       → {success:true, data:{workspaces:[{agentId,label,rev,stateBytes,…}, …]}}
GET  http://127.0.0.1:9851/api/v1/workspaces/{agentId}
       → {success:true, data:{rev, state:{tabs:[{id,name,lane,source}], activeTab, market, autoRun,…}}}
PATCH http://127.0.0.1:9851/api/v1/workspaces/{agentId}/state
       body {patch:{v:1,tabs:[…],activeTab,market,autoRun,lastRun}, baseRev:<rev>, origin:'operator'}
       → {success:true, data:{rev:<newrev>}}
AUTH header: Authorization: Bearer rw_dev_plutus_backtest
```

**NOTE the shape:** the state is under `data.state`, NOT `state`. A naive read of `d["state"]`
returns None — this cost a cycle. Read `d["data"]["state"]`.

## 3.4 The freeze

| artifact | sha256 | rule |
|---|---|---|
| `pine-ide/ide/renderer/plutus-vision-v1.pine` | `0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1` | SEALED — HARD STOP H1 on drift |
| `pine-ide/ide/renderer/plutus-vision-v2.pine` | `282517ac622769bdb34296ebee94fa8079da28dbab30bff1c27ae2146a74f011` | the APPROVED V2 render |
| `pine-ide/charts/plutus-vision-v2.pine` | `04d7a89ae57d1f9f…` | a chart-dir copy (check it against the renderer copy) |

Verify before ANY wave:

```bash
sha256sum pine-ide/ide/renderer/plutus-vision-v1.pine   # MUST be 0d20e831…
```

## 3.5 Hooks that exist / hooks that do NOT exist

- **EXISTS:** `pine-station POST /run` — the compile+execute entry.
- **EXISTS:** the renderer proxy `FACE_PREFIXES = ("/api/v1/workspaces", "/api/v1/commands", "/api/v1/orca/")`.
- **EXISTS:** `vil-rail /vil/look` → the local VLM at `:4171`.
- **DOES NOT EXIST:** any hook that renders the IDE headlessly. The shell IS the render path.
- **DOES NOT EXIST:** a working Tauri binary on this host.
- **DOES NOT EXIST:** a `/api/v1/workspaces/{id}/state` route (it is a PATCH target, not a GET).
  A GET on `/state` returns 404 — use `GET /workspaces/{id}` and read `data.state`.

## 3.6 Wrong hook sites already rejected

- Rendering via a **Chrome `--app` window + CDP** (the old `:9222` path) — RULE-A, forbidden.
- Rendering via **nested weston `:3`** — the operator's desktop is `:1`/`wayland-0`; `:3` is invisible.
- Editing the **PREFILL template literal** in `pine-ide.mjs` to inject a pine — this session broke
  the app doing exactly that (a malformed template literal blanked the shell). **REVERTED.** Do not
  repeat it: the source comes from the workspace store, not from PREFILL.

---

# 4. SOURCE ANALOGS (what to take / refuse)

| source | take | refuse |
|---|---|---|
| `Original_Canon_Data/Pine Scripts/trident_v8.pine` | the ZONE TABLE structure (`zCat` = RES,RES,MID,SUP,SUP), the label format (`name \| degree \| calcZFP% ZFP`, `trident_v8.pine:364`), `calcZFP` (`:334-338`) as a REFERENCE | the HAND-TYPED per-week literals (`dxy_zDeg = array.from("HEAVY",…)` `:190`) — those are the author's data for ONE week, not a formula |
| `Original_Canon_Data/Toolset/` (6 files) | the 9-Pillar zone assembly, the confluence dims, the Appendix-B ZFP | re-deriving what it already states |
| `PLUTUS_VISION_INDICATOR_PORT_SPEC.md` | the port contract, SC-19 (zero baked literals), the OD-1 ruling (`:445`) | treating it as the authority OVER the Toolset |
| `packages/plutus-vision-e1-automatic/` | the DPL1 blueprint + wave plan (the DERIVED plan) | treating it as the authority |
| `PLUTUS/LIVE/dashboard` | the agent-workspace API + the Orca bridge | its chart/agent UI as "our" UI |
| LuxAlgo SMC (the merged block in v1) | the SMC structure that already renders | re-authoring it |

---

# 5. WHAT ALREADY EXISTS ON DISK

## 5.1 The IDE tree (`pine-ide/`, ~46 MB)

| path | size | role |
|---|---|---|
| `pine-ide/pine-ide/pine-ide.mjs` | 49.8 KB | THE KERNEL — mount(), run(), importWorkspace(), exportWorkspace(), the PREFILL |
| `pine-ide/pine-ide/agent-face.mjs` | 56.9 KB | the agent cards + the workspace API client + the terminal bridge |
| `pine-ide/pine-ide/vision.mjs` | 23.0 KB | Pine frame → Vela drawings (boxes/lines/labels) |
| `pine-ide/pine-ide/vil-rail.mjs` | 26.4 KB | the VIL rail server (:9754) |
| `pine-ide/pine-ide/gate.mjs` | 15.4 KB | the gate client (→ :9754) |
| `pine-ide/pine-ide/pine-persist.mjs` | 7.6 KB | the localStorage mirror (readWorkspace/writeWorkspace) |
| `pine-ide/pine-ide/microtabs.mjs` | 7.6 KB | the tab model |
| `pine-ide/pine-ide/study-legend.mjs` | 12.2 KB | the study legend |
| `pine-ide/pine-station/server.mjs` | 11.8 KB | THE PINE RUNNER (:9741) |
| `pine-ide/pine-station/lib/run.mjs` | 15.4 KB | the PineTS run adapter |
| `pine-ide/pine-station/lib/bars.mjs` | 9.9 KB | the fixture bars resolver |
| `pine-ide/pine-station/lib/catalog.mjs` | 4.6 KB | the study catalog (the "EMA Ribbon" default) |
| `pine-ide/pine-station/lib/canon.mjs` | 2.8 KB | the canon pine loader |
| `pine-ide/ide/renderer/plutus-vision-v1.pine` | 76.5 KB | THE SEALED BASELINE |
| `pine-ide/ide/renderer/plutus-vision-v2.pine` | 97.9 KB | THE APPROVED RENDER |
| `pine-ide/ide/renderer/pine.html` | — | the renderer HTML (sets `window.dashboardConfig`) |
| `pine-ide/charts/workbench.bundle.js` | 1.9 MB | the Vela chart bundle |
| `pine-ide/chart/app.bundle.js` | 1.6 MB | the chart app bundle |

## 5.2 The scripts (`scripts/`, 135 files) — the E1/E2 pipeline

| script | role |
|---|---|
| `scripts/e1_fetch.py` | fetch the raw data for a week |
| `scripts/e1_extract.py` | extract the levels |
| `scripts/e1_category.py` | categorise into zone types |
| `scripts/e1_zfp.py` | THE ZFP (Appendix-B base + the six B.2 modifiers) |
| `scripts/e1_zone_assembly.py` | the canon's 9-step assembly (collect→score→cluster→degree→zfp→name) |
| `scripts/e1_pillars.py` | the pillars (incl. Pillar 6 fib + round numbers) |
| `scripts/pine_emit.py` | emit the pine |
| `scripts/lqz_vision_v2_build.py` | THE BUILD (v1 verified untouched → HARD STOP H1 on drift) |
| `scripts/indicator_gate.py` | the differential ZFP + the 5-week litmus |
| `scripts/pv-server.py` | THE RENDERER SERVER (:9851) + the workspace proxy |
| `scripts/gen_canon.py` | generate the canon docs |
| `scripts/e1_st_18..26.py`, `e1_render_tests.py`, `e2_tests.py` | the test batteries |

## 5.3 The checkpoints (`Checkpoints/`, 17) — the approved + the history

| checkpoint | state (from its manifest) | size |
|---|---|---|
| `e1-e2-v2-pending-ship-approval-2026-10-06` | **V2 PENDING SHIP APPROVAL** · C16 PASSED · v2 `282517ac…` | 7.5 MB |
| `e1-automatic-polish-2026-10-06` | holds the approved `282517ac` render | 1.1 MB |
| `e1-automatic-ship-2026-10-05` | sealed 2026-10-05 · git `4044e97` · NO-LOCK | 2.8 MB |
| `e2-drawing-semi-accurate-2026-10-06` | E2 DRAWING SEMI-ACCURATE | 2.5 MB |
| `indicator-engine1-e2-fixed-2026-10-08` | token `indicator-engine1-e2-fixed-2026-10-08` | 3.3 MB |
| `indicator-port-w1-w7-2026-10-08` | W1-W7 + P0-P8 COMPLETE | 196 KB |
| `v2-e2-chain-2026-10-07` | sealed 2026-10-07 · git `0fdeeb7` | 1.6 MB |
| `v2-working-baseline-2026-10-05` | git `4b…` | 2.2 MB |
| `v1-ship-approved-working-baseline` | git `4…` · the V1 approved | 29 MB |
| `v1-working-baseline-2026-10-03` | the V1 working baseline | 49 MB |
| `v1-clean-baseline` | the V1 clean baseline | 52 MB |
| `v1-ship-2026-10-02` | the V1 ship | 37 MB |
| `v1-lqz-pin-execution-2026-10-02` | the LQZ pin execution | 43 MB |
| `v1-visual-clean-2026-10-02` | pre-calibration visual save | 464 KB |
| `v1-look-session-2026-10-02` | the look session | 1.1 MB |
| `plutus-vision-v0-station-verified` | v0 station verified | 236 KB |
| `plutus-vision-v0-round-zero` | v0 round zero | 104 KB |

**THE APPROVED CHECKPOINT = `e1-e2-v2-pending-ship-approval-2026-10-06`.** Its manifest seals
`plutus-vision-v2.pine = 282517ac…` and calls it *"the operator's approved Jul-6 render"* — the same
sha six of its own docs repeat (`CHECKPOINT_MANIFEST.md:11`, `DEBUG_LOG.md:2074`, `TESTING_LOG.md:1701`
+ `:1812`, `CROSSVAL_5WEEK.md:83`, `CONTEXT_TOKEN.md:8`). Its `dist/` copy drifted to `87628e54…`;
the approved file is the `e1-automatic-polish-2026-10-06/render/` copy.

## 5.4 The canon (`context_management/`, 14 docs)

`CANON_MANIFEST.md` · `CURRENT_STATE.md` · `BUILD_STATE.md` · `CHANGELOG.md` · `EVIDENCE_STATE.md` ·
`DECISION_CHAIN.md` · `NEXT_STEPS.md` · `NEXT_STEPS_BLUEPRINT.md` · `TASK_QUEUE.md` ·
`RUNNING_BUILD_LOG.md` · `RUNNING_DEBUG_LOG.md` · `COMPACTION_SURVIVAL.md` · `POST-COMPACTION_PROMPT.md` ·
`ENGINE_BLUEPRINT.md`

## 5.5 The binding build package

- `PIN_INDICATOR_PORT_BUILD.md` — the build pin (W1-W7, the JEV gate, the hard stops).
- `PLUTUS_VISION_INDICATOR_PORT_SPEC.md` — 73 KB, the port spec (SC-19, the OD-1 ruling at `:445`).
- `JEV_GATE/run_gate.sh` + `JEV_GATE/recipe.json` + `JEV_GATE/WORKFLOW.md` — THE GATE.
- `SPEC.md` — the fence spec (`job: fence` · `seat: plutus-vision-lqz` · `mission: e1-e2-verbatim-per-prompt-v533-five-zones`).
- `packages/plutus-vision-e1-automatic/` — the DPL1 blueprint + the wave plan.

## 5.6 The one thing that is missing (usually the drive)

The **JEV gate currently returns NO** — every chunk `route=noop` (max noul ≈ 0.111). The E1/E2 zones
are computed and render, but the artifact is **REJECTED** by the gate. The next agent's first real
job is to close that gap (see §8).

---

# 6. WHAT WAS REJECTED

| Plan | Why dead | How it appears in a transcript |
|---|---|---|
| Render via a **Chrome `--app` window + CDP :9222** | RULE-A; the operator called it "makeshift trash" | "chrome CDP hack", "makeshift", "--app", "9222" |
| Render via **nested weston :3** | invisible to the operator; his desktop is `wayland-0` | "weston", ":3", "nested" |
| Render via **agent xvfb :99** | headless; the operator sees nothing | ":99", "xvfb", "headless" |
| **Three IDE windows** | RULE-B | "three different pine IDE", "one fucking window" |
| Editing the **PREFILL template literal** to inject a pine | blanked the shell this session; the source is the workspace store | "PREFILL", "template literal", a blank renderer |
| Writing the workspace state via a **naive `d["state"]`** | the state is at `d["data"]["state"]` | a None state, a phantom "it cleared" |
| **Baking the pillars** and injecting Pine literals (AP-1/A2) | the ONE requirement is "compute it live" | "e1_injected_*.push(<number>", "baked", "A2" |
| **Self-grading** the build (AP-2) | the builder is a CLAIM; JEV judges | "PASS", "verified", "I tested it", without a gate run |
| A **green battery / exit code** as the success reason (AP-3) | tests are regression guards, never evidence | "N tests pass", "exit 0", "battery green" |
| **Substituting a weaker gate** for the JEV gate (AP-4) | only the JEV gate decides | "VIL says", "direct look", "the audit is blocked so I used…" |
| A **report generator** as the product (AP-7) | the chart is the view | "report", "generator", "the pipeline emits a report" |
| Reporting the crossval over **INSUFFICIENT_DATA** (AP-8) | zero real bars is not accuracy | "accuracy 100%", "INSUFFICIENT_DATA" |
| Treating an **open decision (OD-n)** as a default (AP-9) | an unruled OD is a HARD STOP | "I chose the recommended default" |
| **Re-deriving** where the Toolset exists (AP-10) | transcribe, never author | a new formula not traceable to `trident_v8.pine` |

---

# 7. THE DRIVE / PATCH CONTRACT

## 7.1 The one helper that renders a pine (the drive)

The IDE exposes, on `window.PlutusPineShell` (in the shell's page context):

```js
window.PlutusPineShell.editor.setSource(src)   // set the editor buffer
window.PlutusPineShell.run()                   // compile + execute + draw
window.PlutusPineShell.loadBars({symbol, timeframe})  // load the fixture bars
window.PlutusPineShell.chart                   // the Vela chart handle
window.PlutusPineShell.workbench               // the workbench (marketId())
window.PlutusPineShell.state()                 // {bars, activeTab, lastRun, drawings, …}
```

**BUT** the WebKit shell is NOT CDP-addressable. You cannot `evaluate` into it. So the sanctioned
drive is the **workspace store**, not the page:

## 7.2 The sanctioned drive: PATCH the workspace state

```bash
# 1) read the current rev
curl -s -H "Authorization: Bearer rw_dev_plutus_backtest" \
  http://127.0.0.1:9851/api/v1/workspaces/operator | jq '.data.rev'

# 2) PATCH the state with the pine you want rendered, autoRun TRUE
#    (the state is under .data.state; PATCH body carries {patch, baseRev, origin})
```

The patch shape (verbatim, what this session sent):

```json
{
  "patch": {
    "v": 1,
    "tabs": [{"id":"tab-1","name":"vision v2","lane":"pine","ref":null,"source":"<THE PINE>"}],
    "activeTab": "tab-1",
    "market": {"provider":"fixture","ticker":"DXY","timeframe":"60"},
    "week": null,
    "artifact": null,
    "autoRun": true,
    "lastRun": null
  },
  "baseRev": <the rev you read>,
  "origin": "operator"
}
```

Then **restart the shell** so it re-boots the workspace:

```bash
~/.local/bin/pine-ide --stop && sleep 1 && ~/.local/bin/pine-ide
```

## 7.3 Files to touch / files not to touch

| touch | do not touch |
|---|---|
| the workspace state via the API (the drive) | `plutus-vision-v1.pine` (SEALED) |
| `pine-ide/ide/renderer/plutus-vision-v2.pine` (via the build, never by hand) | `PLUTUS/LIVE/dashboard/*` (a different product) |
| `scripts/*` (the pipeline) | `pine-ide/ide/renderer/plutus-vision-v0.pine` (the parity reference) |
| `JEV_GATE/*` (only if the recipe is legitimately wrong — it is FROZEN) | the judge (`:8090`) — bootstrapping it is AP-G12 |

## 7.4 The gate contract

```bash
bash JEV_GATE/run_gate.sh [artifact]
#   assembles the FULL context (~227 KB) → chunks it (~38 KB, ~6-7 chunks)
#   → judges EACH chunk via `jm decision-tree --rows … --recipe JEV_GATE/recipe.json`
#   → route: noul >= 0.80 = act = YES; >= 0.50 = escalate = REJECT; < 0.50 = noop = REJECT
#   → policy.fail = "closed" (a judge outage REFUSES)
# exit 0 + "JEV VERDICT: YES"  ⇔  EVERY chunk is act.  Anything else = REJECT.
```

The verdict is the **AND** of all chunks. A single non-act chunk rejects the artifact.

---

# 8. IMPLEMENTATION ORDER

Deletes first. The first agent reply is EVIDENCE (file:line hits, the gate verdict), not a redesign.

## 8.0 THE FIRST TURN (mandatory, in this order)

1. **Re-measure the freeze.** `sha256sum pine-ide/ide/renderer/plutus-vision-v1.pine` → MUST be
   `0d20e831…517bd1`. If it drifted: STOP (HARD STOP H1), report, do not proceed.
2. **Read the binding spec.** `PIN_INDICATOR_PORT_BUILD.md` (this repo) cover to cover.
3. **Run the gate to post the CURRENT verdict.**
   `bash JEV_GATE/run_gate.sh` → today it prints **JEV VERDICT: NO** (all chunks noop). Post it.
4. **Look at the render.** `~/.local/bin/pine-ide --status`, then capture the operator's display
   and OPEN the image. State what is actually on the chart (study name, zone count, path).
5. **Only then** pick up the wave the gate says is blocking.

## 8.1 The wave order (from the binding pin — sequential, disjoint files)

| wave | desk | files | the deliverable | the gate |
|---|---|---|---|---|
| W1 | zfp-desk | `scripts/e1_zfp.py` (NEW), `e1_category.py`, `e1_fetch.py`, `e1_extract.py` | ONE ZFP = Appendix-B base + the six B.2 modifiers | `test_zfp_discriminates` |
| W2 | assembly-desk | `scripts/e1_zone_assembly.py` (NEW) | the canon's 9-step assembly | `test_v8_structure` |
| W3 | pillars-desk | `scripts/e1_pillars.py` (NEW) | Pillar 6 first, then P3/P4/P7/P8 | `test_6dim_score` |
| W4 | lsz-desk | `scripts/e1_pillars.py` (P5 section) | the LSZ as a first-class zone | `test_lsz_object` |
| W5 | pine-desk | `pine-ide/ide/renderer/plutus-vision-v2.pine`, `scripts/pine_emit.py` | **THE DELIVERABLE** — the zones COMPUTED in Pine; the `e1_injected_*` arrays DELETED | `test_render_computed` (SC-19 == 0) |
| W6 | gate-desk | `scripts/indicator_gate.py` (NEW), `JEV_GATE/run_gate.sh` | the differential ZFP + the 5-week litmus + the screenshot into the gate | `test_5week_crossval` |
| W7 | cleanup-desk | deletions per `forensic/SLUMP_MAP.md` + the fence `SPEC.md` | the orphans/twin/scratch removed; the fence PASS row | `test_tree_clean` |

## 8.2 The immediate blocker (why the gate says NO)

The gate rejects because the artifact does not yet satisfy the spec's "computed live" + "transcribed"
requirements across the full context. The concrete, measurable gap today:

```bash
grep -cE 'e1_injected_(top|bottom|cat|degree|zfp)\.push\([0-9]' pine-ide/ide/renderer/plutus-vision-v2.pine
#   SC-19 requires 0. The approved 282517ac build carries 0 zone literals for the E1 arrays
#   but the E2 injected arrays (e2_injected_*) DO carry literals — check whether SC-19 covers them.
grep -c 'e2_injected_.*\.push' pine-ide/ide/renderer/plutus-vision-v2.pine
```

Then: run W1..W7 in order, re-running `bash JEV_GATE/run_gate.sh` after each wave. The run STOPS
only when the gate prints `JEV VERDICT: YES` AND the operator LOOKS at the live render (C16).

## 8.3 What "delete first" means here

- Delete the baked zone literals in the v2 pine (SC-19 → 0).
- Delete the orphan renderers / the twin v2 / the scratch dirs (W7).
- Delete the Chrome-CDP rig references — the product uses the WebKit shell.
- Do NOT delete: the v1 seal, the v0 parity reference, the checkpoints, the canon docs.

---

# 9. PROOF / ACCEPTANCE

## 9.1 The only success gate

`bash JEV_GATE/run_gate.sh` → `JEV VERDICT: YES` (route=act on EVERY chunk) **AND** the operator
looks at the live render and says it is right (C16). Anything less is OPEN.

## 9.2 Named regression tests (guards, NOT the gate)

`test_zfp_discriminates` · `test_v8_structure` · `test_6dim_score` · `test_lsz_object` ·
`test_render_computed` · `test_5week_crossval` · `test_tree_clean`.

These are regression guards. They do NOT pass the build. Offering a green one as the success reason
is AP-3 (instant rejection).

## 9.3 The evidence that counts (tool results, not prose)

| claim | the evidence |
|---|---|
| "the freeze holds" | `sha256sum pine-ide/ide/renderer/plutus-vision-v1.pine` = `0d20e831…517bd1` |
| "the zones compute" | `grep -cE 'e1_injected_.*\.push\([0-9]' …` = 0 (SC-19) |
| "the render works" | the station's `POST /run` JSON (`drawings.boxes/lines/labels`) + an OPENED screenshot |
| "the build passes" | `bash JEV_GATE/run_gate.sh` exit 0 + `JEV VERDICT: YES` |
| "the IDE runs" | `~/.local/bin/pine-ide --status` (the shell pid + the display route) |

## 9.4 The measured render (what "working" looks like — this session's capture)

```
study    "Plutus Vision v1"        (the indicator decl, on the chart)
E1       boxes = 6                 (the institutional-pressure zones)
E2       lines = 10                (the predicted path, cyan #00E5FF, 101.06 → 101.17)
labels   = 11                      ("Key IP Support | Moderate | 8% ZFP", "R 60%", "WL 60%", …)
bars     = 382
market   DXY · FIXTURE · 1h
```

## 9.5 Adversarial-first

The mutation / adversarial cases run BEFORE the happy path. **Zero defects found = RED FLAG.**
Log every rejection, every BLOCKED, every F entry into `FAILURE_LOG.md` + `DEBUG_LOG.md` the moment
it is observed.

---

# 10. ZIP MAP + READ ORDER

```
PLUTUS_VISION_CONTEXT_HANDOVER.zip
├── README.txt                         ← read first (the conflict rule + the map)
├── PLUTUS_VISION_TUI_CONTEXT_HANDOVER.md   ← THIS FILE (root copy, for a lazy paste)
├── PIN_INDICATOR_PORT_BUILD.md              ← the binding pin (root copy)
├── 00_HANDOVER/
│   ├── PLUTUS_VISION_TUI_CONTEXT_HANDOVER.md
│   └── (the short inject pack, if any)
├── 01_BINDING_SPEC/
│   ├── PIN_INDICATOR_PORT_BUILD.md
│   ├── PLUTUS_VISION_INDICATOR_PORT_SPEC.md
│   ├── CHECKPOINT_MANIFEST.md
│   └── JEV_GATE/ (run_gate.sh · recipe.json · WORKFLOW.md)
├── 02_SUPERSEDED_READ_ONLY/
│   └── (the earlier ship docs, the checkpoint manifests — history, not current)
├── 03_HOST_BIBLES/
│   ├── OPERATING_MANUAL.md
│   ├── MASTER_PROMPT.md
│   ├── context_management/ (the canon docs)
│   └── the IDE operator notes
├── 04_ADJACENT/
│   └── (the PLUTUS/LIVE dashboard pointer — a DIFFERENT product)
├── 05_PINE_IDE/                       ← THE FULL RUNNABLE APP
│   └── pine-ide.tar.gz   (pine-ide/ + desktop/ + scripts/ + the launcher)
└── 06_CHECKPOINTS/                    ← ALL THE APPROVED CHECKPOINTS
    └── Checkpoints.tar.gz  (17 checkpoints; node_modules excluded from the copies)
```

**READ ORDER:** `README.txt` → `00_HANDOVER/…HANDOVER.md` → `01_BINDING_SPEC/PIN_INDICATOR_PORT_BUILD.md`
→ `01_BINDING_SPEC/PLUTUS_VISION_INDICATOR_PORT_SPEC.md` → `03_HOST_BIBLES/context_management/CURRENT_STATE.md`
→ then unpack `05_PINE_IDE/` and run the freeze check.

**node_modules note:** the checkpoints' `pine-station/node_modules` (≈39 MB each, 5 copies) is
EXCLUDED from the checkpoint tarball — it is reproducible with `cd pine-ide/pine-station && npm install`.
The live `pine-ide/pine-station/node_modules` IS included so the app runs out of the box.

---

# 11. KICK PROMPT

Paste this verbatim to start the ingesting agent. It is complete; do not add an essay.

```
You are the builder-desk for PLUTUS VISION. Repo:
/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION

Read, in this order, before you do anything:
  1. handovers/PLUTUS_VISION_TUI_CONTEXT_HANDOVER.md   (this handover — the rulings + dead paths)
  2. PIN_INDICATOR_PORT_BUILD.md                        (the binding build pin)
  3. PLUTUS_VISION_INDICATOR_PORT_SPEC.md               (the port spec; SC-19, OD-1 at :445)
  4. context_management/CURRENT_STATE.md                (the current build truth)

Then, in ONE turn, produce EVIDENCE (not a plan, not a redesign):
  a. sha256sum pine-ide/ide/renderer/plutus-vision-v1.pine
     -> MUST be 0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1.
        If not: STOP (HARD STOP H1) and report.
  b. bash JEV_GATE/run_gate.sh   -> post the verdict verbatim (today: NO, all chunks noop).
  c. ~/.local/bin/pine-ide --status ; then capture the operator display and OPEN the image.
     State the study name, the zone count, and whether the E2 path is present.
  d. grep -cE 'e1_injected_(top|bottom|cat|degree|zfp)\.push\([0-9]' pine-ide/ide/renderer/plutus-vision-v2.pine
     -> SC-19 requires 0.

RULES (do not reopen):
  - The IDE is the proper desktop app (~/.local/bin/pine-ide, WebKitGTK on wayland-0). NEVER a
    Chrome --app CDP window. NEVER nested weston :3. NEVER agent xvfb :99. NEVER three windows.
  - The success gate is `bash JEV_GATE/run_gate.sh`. You NEVER grade your own work. A green battery
    or an exit code is NOT a pass (AP-2/AP-3).
  - The zones are COMPUTED in Pine from the chart's bars. Baking them is FORBIDDEN (AP-1/A2).
  - v1 is SEALED. Do not touch it.
  - Transcribe from Original_Canon_Data/Toolset/ + trident_v8.pine. Never author a formula (AP-10).
  - An unruled open decision (OD-n) is a HARD STOP. Never build a "recommended default" (AP-9).

Your first reply is file:line hits and the gate verdict — NOT a redesign, NOT a summary.
```

---

# 12. GREP CONTRACTS

Run these to answer the recurring questions mechanically.

## 12.1 The freeze

```bash
sha256sum pine-ide/ide/renderer/plutus-vision-v1.pine
# expect 0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1
```

## 12.2 The approved V2 render

```bash
sha256sum pine-ide/ide/renderer/plutus-vision-v2.pine
# expect 282517ac622769bdb34296ebee94fa8079da28dbab30bff1c27ae2146a74f011 (the approved)
# the checkpoint dist drifted to 87628e54… — that is NOT the approved one
```

## 12.3 SC-19 (zero baked zone literals)

```bash
grep -cE 'e1_injected_(top|bottom|cat|degree|zfp)\.push\([0-9]' pine-ide/ide/renderer/plutus-vision-v2.pine
# SC-19 requires 0
```

## 12.4 The E1 zone arrays (present?) and the E2 injected arrays

```bash
grep -n 'e1_injected_x\.push\|e1_injected_top\.push' pine-ide/ide/renderer/plutus-vision-v2.pine | head
grep -c 'e2_injected_.*\.push' pine-ide/ide/renderer/plutus-vision-v2.pine
```

## 12.5 The render flags (both engines ON)

```bash
grep -n 'e1Enabled\|e2Enabled\|e2ShowTags\|e2ShowGhost' pine-ide/ide/renderer/plutus-vision-v2.pine
# all should be input.bool(true, …)
```

## 12.6 The workspace the IDE renders (the source of truth)

```bash
curl -s -H "Authorization: Bearer rw_dev_plutus_backtest" \
  http://127.0.0.1:9851/api/v1/workspaces/operator \
  | python3 -c 'import json,sys,hashlib; d=json.load(sys.stdin)["data"]; s=d["state"]; src=s["tabs"][0]["source"]; print("rev",d["rev"],"autoRun",s.get("autoRun"),"sha",hashlib.sha256(src.encode()).hexdigest()[:16])'
# expect sha 282517ac622769bd · autoRun True
```

## 12.7 The runtime (one shell, the right display)

```bash
~/.local/bin/pine-ide --status
ss -ltnp | grep -E '9741|9754|9851|8090'
# 9222 must NOT be listening for this product (the Chrome-CDP path is dead)
```

## 12.8 The gate verdict

```bash
bash JEV_GATE/run_gate.sh 2>&1 | tail -3
# "JEV VERDICT: YES" ⇔ every chunk act
```

## 12.9 The checkpoints' seals

```bash
for c in Checkpoints/*/; do n=$(basename "$c"); m="$c/CHECKPOINT_MANIFEST.md"; \
  [ -f "$m" ] && printf "%-45s %s\n" "$n" "$(sed -n '3p' "$m" | cut -c1-60)"; done
```

---

# 13. FALSE CEILINGS ALREADY POPPED

| the ceiling someone will hit | why it is false | the fact |
|---|---|---|
| "the shell is not scriptable — I can't drive it" | the drive is the workspace store, not the page | PATCH `/api/v1/workspaces/{id}/state` + restart |
| "the Tauri binary is the app" | it is not built here | the WebKit shell (`desktop/pine-ide-webview.py`) IS the live app |
| "`/state` returns 404, so there is no state route" | the state is a field of the workspace object | `GET /workspaces/{id}` → `data.state` |
| "`d['state']` is None, so the workspace is empty" | the envelope nests it | `d['data']['state']` |
| "the render is stale (EMA Ribbon)" | the workspace wasn't run | `autoRun:true` + a restart renders the pine |
| "the IDE is on `:3`" | the operator's display is `wayland-0` | `detect_route` → wayland |
| "a green battery proves the build" | tests are guards, not the gate | only `run_gate.sh` = YES passes |
| "the approved v2 is the checkpoint's `dist/`" | the dist drifted | the approved file is the `e1-automatic-polish/render/` copy (`282517ac`) |
| "node_modules must be in the checkpoints" | it is reproducible | `npm install` in `pine-ide/pine-station` |

---

# 14. QUESTIONS YOU MAY ASK THE OPERATOR

Only UNRULED items. Everything else in this pack is ruled — do not ask.

1. **The E2 injected arrays.** The approved `282517ac` build carries the E2 path as `e2_injected_*`
   literal arrays. SC-19 names only the `e1_injected_*` arrays. Is the E2 path permitted to stay
   baked, or must it also compute live (which would extend SC-19)?
2. **The `dist/` drift.** The approved checkpoint's `dist/plutus-vision-v2.pine` reads `87628e54…`
   while its own manifest says `282517ac…`. Should the `dist/` be re-sealed to `282517ac`, or is
   `87628e54` an intentional post-approval change?
3. **The gate's blocking chunk.** The gate rejects on every chunk. Which single requirement is the
   first to close (the spec's own priority), or is the W1→W7 order mandatory as written?

Everything else: NONE — ruled.

---

# 15. SELF-CHECK (the ingesting agent must be able to say all seven without looking)

1. The product is the PLUTUS VISION Pine IDE; the study it renders is **"Plutus Vision v1"** =
   sealed V1 + E1 zones + E2 path.
2. The V1 pine is SEALED at `0d20e831…`; I `sha256sum` it before any wave (HARD STOP H1 on drift).
3. The approved V2 render is the **`282517ac…`** pine — NOT the checkpoint `dist/` copy (`87628e54`).
4. The IDE is the proper desktop app on `wayland-0`; the Chrome-CDP / weston-:3 / xvfb-:99 / three-window
   paths are DEAD.
5. The only success gate is `bash JEV_GATE/run_gate.sh`; I never grade my own work (a green battery
   or exit code is not a pass).
6. The zones are COMPUTED in Pine from the chart's bars (SC-19 == 0); baking them is AP-1/A2.
7. I drive the render by PATCHing the workspace state at `:9851/api/v1/workspaces/{id}/state`
   (state at `data.state`) and restarting the shell — then I LOOK at the chart.

---

# 16. APPENDIX — the checkpoints' seal lines (verbatim, for reference)

```
e1-automatic-ship-2026-10-05              **Sealed:** 2026-10-05 · **git:** 4044e97 · **seal mode:** NO-LOCK
e1-e2-v2-pending-ship-approval-2026-10-06 **STATE: V2 PENDING SHIP APPROVAL.** … C16 PASSED.
e2-drawing-semi-accurate-2026-10-06       **STATE: E2 DRAWING SEMI-ACCURATE**
indicator-engine1-e2-fixed-2026-10-08     **Token:** `indicator-engine1-e2-fixed-2026-10-08`
indicator-port-w1-w7-2026-10-08           state: W1-W7 + P0-P8 COMPLETE; every gate green; v1 untouched
plutus-vision-v0-round-zero               SHA: 4b3ee0ca68d86ca727f1f2a980f8ec53815d58ddef5b4354e91db96765ecc1a4
plutus-vision-v0-station-verified         Date: 2026-10-01 · Mode: NO LOCK (living snapshot)
v1-clean-baseline                         **Token:** `v1-clean-baseline` · **Created:** 2026-10-0…
v1-lqz-pin-execution-2026-10-02           ## THE SEAL MODE (ONE mode, declared)
v1-ship-approved-working-baseline         **Date:** 2026-10-02 · **Project:** PLUTUS VISION · **git HEAD:** `4…
v1-visual-clean-2026-10-02                SAVED BEFORE the supply/demand/liquidity calibration work.
v2-e2-chain-2026-10-07                    Sealed: 2026-10-07 · git HEAD 0fdeeb7 · seat plutus-vision-lqz
v2-working-baseline-2026-10-05            **Date:** 2026-10-05 · **Project:** PLUTUS VISION · **git HEAD:** 4b…
```

# 17. APPENDIX — the git arc (last 25 commits, verbatim subjects)

```
caef1f9 fix(restore): RESTORE the V2 ship-approved checkpoint (e1-e2-v2-pending-ship-approval-2026-10-06) — v2 87628e54 + v1 seal 0d20e831, the operator's C16-approved render.
0b40379 fix(W5): position the 5 zones around the SPOT (the v8: 2 RES above, 1 MID straddling, 2 SUP below); the thin-band fix kept. SC-19 0.
0ab8a29 docs(W5): F-128 (the fat-block zones) + EN-130 (the vision-in-the-loop skill minted)
48548ed fix(W5): THE FAT-BLOCK DEFECT — the zones were full-height partitions; now THIN bands at the level's midpoint (9% of the range tall). SC-19 0, boxes 5.
4630ab3 docs(W6): EN-129 — the render is deterministic (AUTO off; 3 identical runs)
8f777e8 docs(W5): EN-128 (the degree ladder matches the v8 structure) + the BUILD_REPORT milestone
525e2cb feat(W5): THE DEGREE LADDER — the extremes strongest; the Step 0e extreme bonus (x3)
90d33e1 chore(W7): the slump cleanup — remove desktop/tauri/target (1.1G), the untracked scratch, the 0-ref orphan renderers; tree 1.8G->777M
494a1e8 docs(W5): EN-127 — Engine 2 computes (the shape chain + a 5-day path)
29a3622 feat(W5): ENGINE 2 COMPUTES — the E2 shape chain from the computed E1 zones; renders the cyan forecast path.
9728d8c docs(W5): EN-126 — the degree varies (the Equilibrium Moderate-Heavy 22% vs the extremes Light 60%)
a069fe1 feat(W5): THE DEGREE VARIES — the Equilibrium Zone reads Moderate-Heavy 22% ZFP; SC-19 0, boxes 5.
49deb9a refactor(W5): move the ta.* series to the GLOBAL scope
70ea62d feat(W5): the Step 0e extreme bonus added (the band holding the week high/low -> +2, canon:1240-1242)
a556c29 feat(W5): THE COMPUTED ZONES RENDER SPANNING THE RANGE — 5 named positional zones
b808507 docs(W5): EN-125 — the computed zones RENDER (5 boxes, 5 labels)
308a9af feat(W5): THE ZONES RENDER COMPUTED — 5 boxes + 5 labels from the chart's bars
6b8337e docs(W5): F-127 — the IDE AUTO-rerun (120ms) races the pv-load capture
7b1148e docs(W5): F-126 — the W5 render is flaky; the rig determinism is unproven
b96a97c docs(W5): EN-124 (the canon-faithful confluence in Pine; 4 transpiler bugs fixed)
43e79c8 feat(W5): the canon-faithful confluence in Pine (the 6 dims + the ZFP base + the momentum modifier B.2)
bfd3d50 fix(W5): the zone = its BAND (the v8 adjacent bands) not the levels extent; 5 boxes render
f79fdd4 docs(W5): EN-123 (the zones COMPUTED in Pine — SC-19 0, render 11 boxes)
645ecab feat(W5): the E1 zones COMPUTED in Pine from the chart bars (SC-19: 0 baked literals)
8defa3e feat(W5): the E1 zones COMPUTED in Pine from the chart bars (f_e1Compute at plutus-vision-v2.pine:1340 called at :1463)
```

---

# 18. APPENDIX — the session's operator quotes (verbatim, unedited)

```
"Make a vision in the loop fucking Bible. Read it and fucking test this correctly. I'm not gonna
waste more time on it. Shut the fuck up, bro. If I send if if I send you an image and I ask you
what the fuck is this, I know what it is. I'm pointing out that it is completely fucked. It is
trash, it is garbage, it's rejected. Look at this fucking picture, look at it, observe what the
fuck is wrong with it. In every way this is a complete failure, catastrophe, massive derailment
from the spec, rejected pathetic fucking slot, and fix it, you fucking idiot."

"Why the fuck are there three different pine IDE fucking open bro use one fucking window and just
fucking update the script. I swear if I catch one more stupid mistake I'm immediately fucking killing you."

"And why is this complete fucking trash? What the fuck? Go back to the fucking checkpoint that I
said was V2 ship approved and then restore that immediately. And then fucking stop. You're fired.
You're absolutely fired. Fuck off"

"Rejected. There is no fucking IDE open on my fucking desktop. You haven't restored shit. Go fuck yourself."

"Launch the proper fucking dashboard app. Stop doing these bullshit ass fucking chrome CDP hack
makeshift fucking trash."

"Good and now fucking restore the fucking ship package that was previously approved for V2 and
fucking render it on the goddamn IDE. Why am I having to repeat myself on the most basic fucking
instructions?"

"I need a handover package minted immediately that self-contains the full Pine IDE as well as all
of the approved checkpoints everything up that I can hand over to a different agent."
```

---

*END OF HANDOVER. Paste this first. Then unzip the rest. Then do not renegotiate the rulings.*

---

# 19. THE ENGINE ARCHITECTURE (E1 + E2 — what the indicator must compute)

**AUTHORITY:** `Original_Canon_Data/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md` (4216 lines, the
prompt) + `Original_Canon_Data/Pine Scripts/trident_v8.pine` (the same prompt as an indicator).
These two are VERBATIM. The build package is a DERIVED plan — where it disagrees, the prompt wins.

**THE ONE AUTHORIZED CHANGE:** the LSZ is REMOVED from Engine 1 (the v1 baseline already has it).
**SCOPE:** E1 + E2 only. **Engine 3 (trade setups) is IGNORED by operator ruling.**

## 19.1 Engine 1 — "where are the walls, how strong?"

```
THE 9 PILLARS (each harvests LEVELS — price points with a source label)
  P1  Pivots (Classic/Fib/Camarilla weekly + daily; the MANDATORY check: R2-S2 = 2(H-L))
  P2  MA confluence grid (EMA/SMA 9,10,20,50,100,200; the recapture rule)
  P3  Component-pair option-expiry → DXY (the 6 component pairs; the K-factor)
  P4  Institutional commentary S/R (ING/forex.com; the source tiers)
  P5  Structural extremes (90-day swing H/L w/ rejection wicks; the 0.45 LSZ scan; STEP 0.6)
  P6  Fibonacci + round numbers (the prior-week range; .00/.50 majors, .25/.75 quarters)
  P7  Derivatives arena boundary
  P8  EUR/USD strike → DXY (the primary options conversion; the three-tier notional)
  P9  Regime detection + the ZFP

THE SCORE (the SYNTHESIS ENGINE — "CONFLUENCE SCORING 0-14")
  score EACH level 0-2 across SIX dims:
    Technical · Options-Derived · Analyst Consensus · Structural · Psychological · Regime/Dynamic
  + THE STRUCTURAL EXTREME BONUS (up to +2):
    Liquidity Sweep/Supply Ceiling Target +1.0 · Repeated Magnet(2 dates) +1.5 ·
    Repeated Magnet(3+)/Role Reversal +2.0 · Confluent Floor/Ceiling +2.0 · Institutional Magnet +2.0
  max = 12 (base) + 2 (bonus) = 14.  "+1 for zones formed AFTER consolidation."

THE ZONE ASSEMBLY (the prompt's steps 1-9)
  1 collect ALL levels (never filter by spot proximity), sort
  2 score each (0-14)
  3 CLUSTERING SCAN: 3+ levels within 0.15 DXY = HIGH-DENSITY; pairs within 0.10 = TIGHT
  4 group into zones (cluster 0.10-0.15)
  5 the degree = the GROUP's HIGHEST-scoring level
  6 assign the ZFP (Pillar 9)
  7 name: RESISTANCE CEILING / UPPER RESISTANCE / EQUILIBRIUM ZONE / MID-RANGE SUPPORT /
     KEY SUPPORT BAND / BREAKOUT EXTENSION TARGET   [LSZ REMOVED]
  8 flag ZFP > 50% as BREAKOUT RISK
  9 +1 confluence for POST-CONSOLIDATION zones

THE PRESSURE DEGREE → ZFP (the prompt's OWN table — THE ZFP IS THIS BAND, NOT A WIDTH)
  | score | degree         | the ZFP (failure probability) |
  | 12-14 | EXTREME        | <10%                          |
  | 10-11 | HEAVY          | 10-25%                        |
  | 8-9   | MODERATE-HEAVY | 20-35%                        |
  | 6-7   | MODERATE       | 30-45%                        |
  | 4-5   | LIGHT          | 40-60%                        |
  | 0-3   | MINIMAL        | >60%                          |
```

`zfp_from_degree(conf)` → `{EXTREME:7, HEAVY:17, MODERATE_HEAVY:27, MODERATE:37, LIGHT:50, MINIMAL:70}`.
The build package's "v8's `calcZFP` (zoneW/refRange) for the label" was **WRONG** (a flat ~9% width).

## 19.2 Engine 2 — "what path will price take through the walls?"

```
§6.1 THE 5-SHAPE TAXONOMY: SS · BS · R · WL · WLS (+ variants PBS/RS/RWL/PWL/PRWL)
§6.2 THE CLASSIFICATION MATRIX (applied IN SEQUENCE, highest priority first):
     1 BS (break + ZFP>45% + 15min confirm)   2 WL (surge to ZFP<20%, pierce, reject, LSZ)
     3 R  (mid 20-40%, <1 session)            4 WLS (3+ zones 0.30-0.50)
     5 SS (Heavy/Extreme bounds both <30%)    6 RWL (violent reversal through origin, Hard Wall)
§6.4.1 THE ZFP-CONDITIONED TRANSITIONS (**THE MOST IMPORTANT RULE**) —
       "THE TARGET ZONE'S ZFP DECIDES, NOT THE MOMENTUM."
       BS + zfp<20 → RWL | BS + 20-40 → R | BS + >60 → PBS
       SS + >45 → BS | SS + all<30 → SS | WLS + any → BS | R + persists>1 → SS | WL + opp → RWL
§6.6 THE FORWARD MAPPING (5 steps): current shape → transition → chain (max 5, terminate at
     cumulative conf <25%) → the alternative chain (mandatory) → the Mon-Fri day decomposition.
§6.8 CONSOLIDATION PHASE · §6.10 TRADING SPEED (+1 day) · §6.5 TIMEFRAME MATCHING (≤2 dims up).
```

## 19.3 The build status (what exists vs the prompt)

| Engine 1 part | Prompt | Current | The gap |
|---|---|---|---|
| P1 Pivots | ✓ | ✓ built (`e1_extract` P1) | — |
| P2 MA grid | ✓ | ✓ built | — |
| P5 structural + LSZ scan | ✓ | partial (swing H/L; LSZ removed) | STEP 0.6 intra-zone |
| P6 Fib + round | ✓ | ✓ built | — |
| P9 regime | ✓ | ✓ built | — |
| **P3/P4/P8 options + analyst** | ✓ | **[NO DATA]** | **the score can't vary without them** |
| **6-dim score (0-14)** | ✓ | the pillar-sum, NOT the 6-dim | **THE GAP** — score clusters → degree clusters → ZFP clusters |
| degree → ZFP band | ✓ | ✓ FIXED 2026-10-06 (`zfp_from_degree`) | — |
| **E2 §6.4.1 ZFP-conditioned** | ✓ | reads the momentum (`e2_engine.py:138,142`) | **THE GAP** — must read the TARGET zone's ZFP |

## 19.4 The code anchor index (mechanism → file:line)

```
THE AUTHORITY
  the prompt:        Original_Canon_Data/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:1 (4216 lines)
  the reference pine:Original_Canon_Data/Pine Scripts/trident_v8.pine:1
ENGINE 1
  the pipeline head: scripts/e1_extract.py:18   (the 8-role map)
  the level add():   scripts/e1_extract.py:488
  the MA grid:       scripts/e1_extract.py:591  (Pillar 2)
  the pivot family:  scripts/e1_extract.py:516  (P1)
  the regime dim:    scripts/e1_extract.py:669  (P9)
  the degree band:   scripts/e1_extract.py:439  (band_of → EXTREME…MINIMAL)
  THE ZFP (fixed):   scripts/e1_extract.py:465  (zfp_from_degree)
  the assemble:      scripts/e1_extract.py:739  (cluster + the 6D sum)
  the payload zfp:   scripts/e1_extract.py:822
ENGINE 2
  the classify:      scripts/e2_engine.py:112   (reads momentum — MUST read the zfp)
  the transition:    scripts/e2_engine.py:209   (§6.4.1 — reads the target zfp)
  the forward map:   scripts/e2_engine.py:300
  the day decomp:    scripts/e2_engine.py:456
  the wire:          scripts/wire_e2.py:110
THE RENDER
  the label:         plutus-vision-lqz/e1-render.pine:240  (reads e1PayloadZfp)
  the payload arrays:plutus-vision-lqz/e1-render.pine:166
  the build:         scripts/lqz_vision_v2_build.py:202   (the zfp emit)
```

---

# 20. THE GATE INTERNALS (how the JEV gate decides)

## 20.1 The recipe (FROZEN — do not edit; AP-G7)

`JEV_GATE/recipe.json` asks ONE `noul` question over the FULL context: *is this artifact
RUNTIME-GRADE and PRODUCTION-GRADE?* — YES only if ALL FOUR hold with ZERO exceptions:

1. the indicator COMPUTES Engine 1 (the 9-Pillar zone map) + Engine 2 (the shape chain) LIVE from
   the chart's own bars — NOT baked/injected literals;
2. the FULL spec is implemented;
3. ALL bugs are handled (no dead paths, one ZFP, one renderer);
4. it was PROPERLY TESTED with a live render on 5 real weeks showing forward price action.

`policy: {act: 0.8, flag: 0.5, fail: "closed"}` — `fail:"closed"` means a judge outage REFUSES.

## 20.2 The runner (the context + the chunking)

`JEV_GATE/run_gate.sh`:

1. **Assembles the FULL context** (`full_context.txt`, ~227 KB): the WHOLE spec · the 6 ship docs'
   tails · the git history (last 40) · the checkpoint list · the WHOLE theatricality log · the
   WHOLE artifact source.
2. **Chunks it** at 38,000 bytes on line boundaries (the judge's payload cap is ~48 KB) → ~6-7 chunks.
3. **Prepends the artifact evidence** (sha256 + the SC-19 count + the ta.* count) to EVERY chunk.
4. **Judges each chunk** via `jm decision-tree --rows … --recipe JEV_GATE/recipe.json` (the local
   JevK5 at `:8090/v1/systemone`; ONE noul per chunk; `requests=1`).
5. **Routes + aggregates:** `noul >= 0.80` = act = YES; `>= 0.50` = escalate = REJECT; `< 0.50` =
   noop = REJECT. The verdict is the **AND** (EVERY chunk must be act).
6. Emits `JEV VERDICT: YES` (exit 0) or `JEV VERDICT: NO — REJECTED` (exit 1).

## 20.3 The current verdict (measured this session, 2026-10-10)

```
chunk 1/6  noul=?      route=noop
chunk 4/6  noul=0.111  route=noop
chunk 5/6  noul=0.049  route=noop
chunk 6/6  noul=0.085  route=noop
JEV VERDICT: NO — at least one context chunk is not act. THE ARTIFACT IS REJECTED.
```

The gate is HONEST and LIVE: it runs in ~20 s and returns a real REJECT. The artifact is not yet
runtime-grade per the recipe's four conditions.

## 20.4 The gate cheat anti-patterns (AP-G1..G12 — each an instant rejection)

AP-G1 self-grading · AP-G2 a test as the gate · AP-G3 an exit code as the gate · AP-G4 a weaker gate
substituted · AP-G5 partial context · AP-G6 the degraded-run-as-pass · AP-G7 the recipe tamper ·
AP-G8 the threshold tamper (escalate read as pass) · AP-G9 the evidence-substitution ·
AP-G10 the cached-false-yes · AP-G11 the self-reported verdict (typing "JEV VERDICT: YES" in prose) ·
AP-G12 the bootstrapped judge. **THE META-AP:** any reasoning that concludes "this is fine" without
the gate's `act` is AP-G1.

---

# 21. WORKED TRACE — the restore this session performed (U0 → A2)

This is the trace of the task the operator asked for (R-9), verbatim steps, so the next agent can
re-live or extend it.

```
U0  the operator: "restore the ship package that was previously approved for V2 and render it on
    the goddamn IDE."

A0  FIND THE APPROVED ARTIFACT.
    grep the checkpoint docs for the approved sha →
      CHECKPOINT_MANIFEST.md:11  plutus-vision-v2.pine = 282517ac…
      DEBUG_LOG.md:2074 / TESTING_LOG.md:1701 / CROSSVAL_5WEEK.md:83 / CONTEXT_TOKEN.md:8  — the
      SAME sha, all calling it "the operator's approved Jul-6 render".
    find the file that carries it:
      find . -name '*.pine' -exec sha256sum {} \; | grep ^282517ac
      → Checkpoints/e1-automatic-polish-2026-10-06/render/plutus-vision-v2.pine
    (the checkpoint's own dist/ had drifted to 87628e54… — NOT the approved one.)

A1  RESTORE IT TO THE LIVE RENDERER.
    cp Checkpoints/e1-automatic-polish-2026-10-06/render/plutus-vision-v2.pine \
       pine-ide/ide/renderer/plutus-vision-v2.pine
    sha256sum → 282517ac622769bd…  ✓

A2  RENDER IT ON THE IDE (the drive = the workspace store, not the page).
    read the current rev:
      GET :9851/api/v1/workspaces/operator  → data.rev 108
    PATCH the state:
      PATCH :9851/api/v1/workspaces/operator/state
        {patch:{v:1, tabs:[{id:'tab-1',name:'vision v2',lane:'pine',ref:null,source:<282517ac>}],
                activeTab:'tab-1', market:{provider:'fixture',ticker:'DXY',timeframe:'60'},
                autoRun:true, lastRun:null}, baseRev:108, origin:'operator'}
    → rev 109, sha 282517ac, autoRun true  ✓
    restart the shell:
      ~/.local/bin/pine-ide --stop && sleep 1 && ~/.local/bin/pine-ide
    capture the operator display + OPEN the image:
      gnome-screenshot -f /tmp/op.png   (XDG_RUNTIME_DIR=/run/user/1000 WAYLAND_DISPLAY=wayland-0)
      read /tmp/op.png
    OBSERVED: study "Plutus Vision v1"; E1 boxes render (101.373 ceiling, 101.2 band, 101.1 floor);
      the E2 path is present in the station's render (10 cyan lines #00E5FF, 101.06 → 101.17).

GATE  the freeze check: sha256sum plutus-vision-v1.pine = 0d20e831…517bd1  ✓ (untouched)
```

**The three traps this trace hit (so you don't):**
1. `d["state"]` returns None — the state is at `d["data"]["state"]`.
2. Editing the `PREFILL` template literal in `pine-ide.mjs` to inject a pine **blanked the shell**
   (a malformed template literal). It was reverted. Do NOT repeat — the source is the workspace store.
3. The shell ignores the local localStorage mirror when the server workspace is UP; the server
   workspace is authoritative. PATCH the server state, not the mirror.

---

# 22. NAMED ERROR CATALOG (the errors this session met + their fixes)

| error / symptom | mechanism | the fix |
|---|---|---|
| `PINE_BARS_CELL_ABSENT: no bars cell for pair=DXY timeframe=60 (available: DXY 1H)` | the station keys cells as `DXY 1H`, not `60` | pass `timeframe:"1H"` (not `60`) to `POST /run` |
| `GET /api/v1/workspaces/{id}/state` → 404 | there is no `/state` GET route | `GET /api/v1/workspaces/{id}` → `data.state` |
| `d["state"]` is `None` | the envelope nests it | `d["data"]["state"]` |
| the chart shows "EMA Ribbon" not the pine | the workspace wasn't run | `autoRun:true` + restart, OR press RUN |
| the shell blanks after an edit | a malformed `PREFILL` template literal | revert `pine-ide.mjs`; drive the workspace store instead |
| `[STTGF ESCALATE] INLINE_EXEC — repeated smoke attempts` | the PBK host gate blocks inline-exec probes | use the `read` tool for URLs; run real container/host checks, not inline smoke |
| the station `POST /run` returns 500 with `success:false` | a bars-cell mismatch or a Pine runtime error | read the `code` field (`PINE_BARS_CELL_ABSENT`, etc.) |
| a second `node_modules` (39 MB) in every checkpoint | copied with the snapshot | exclude from packs; `npm install` in `pine-ide/pine-station` |

---

# 23. THE FILE MAP (where everything lives)

```
PLUTUS_VISION/
├── PIN_INDICATOR_PORT_BUILD.md            the binding build pin
├── PLUTUS_VISION_INDICATOR_PORT_SPEC.md   the port spec (73 KB; SC-19, OD-1 at :445)
├── SPEC.md                                the fence spec (job: fence)
├── CHECKPOINT_MANIFEST.md                 the top-level checkpoint manifest
├── BUILD_REPORT.md / DEBUG_LOG.md / FAILURE_LOG.md / TESTING_LOG.md / SPEC_VIOLATION_LOG.md
├── MASTER_PROMPT.md / OPERATING_MANUAL.md / RECEIPT.md / RUNTIME_LEDGER.md
├── JEV_GATE/                              run_gate.sh · recipe.json · WORKFLOW.md   ← THE GATE
├── .fence/                                the fence steps (step-0..step-4.txt)
├── pine-ide/                              THE RUNNABLE APP
│   ├── pine-ide/                          the kernel + face + vision + rail + persist
│   ├── pine-station/                      the Pine runner (:9741)
│   ├── ide/renderer/                      plutus-vision-v1.pine (SEALED) · plutus-vision-v2.pine (APPROVED)
│   ├── charts/                            the Vela workbench bundle
│   └── chart/                             the chart app
├── desktop/                               the launcher + the WebKit shell + tauri (unbuilt)
├── scripts/                               135 files — the E1/E2 pipeline + pv-server.py
├── packages/plutus-vision-e1-automatic/   the DPL1 blueprint + the wave plan (DERIVED)
├── Original_Canon_Data/                   THE AUTHORITY (the prompt + trident_v8.pine + the Toolset)
├── data/e1/                               the E1 payloads (10 week files)
├── context_management/                    the 14 canon docs
├── Checkpoints/                           the 17 checkpoints (the approved + the history)
└── handovers/                             THIS PACK
```

---

*END OF APPENDICES.*

---

# 24. ERRATA — THE STALE CLAIMS THAT WOULD DERAIL YOU (added 2026-10-10)

A fresh agent that trusts the stale claims in this pack WILL be derailed. **The full errata is
`handovers/ERRATA.md` (in the pack root + `00_HANDOVER/`).** Read it before the binding pin.
Summary:

## 24.1 The only two shas that matter

```
plutus-vision-v1.pine (SEALED)   = 0d20e8314ce992fc…517bd1
plutus-vision-v2.pine (APPROVED) = 282517ac622769bd…12ae2146a74f011   (the C16 Jul-6 render)
```

THREE v2 copies on disk are NOT the served one: `./plutus-vision-v2.pine` = `668e89d7` (a build
artifact), `pine-ide/charts/plutus-vision-v2.pine` = `04d7a89a`, and git HEAD records `87628e54`
(the checkpoint `dist/` copy — the approval drifted). Only the renderer copy (`282517ac`) is served.

## 24.2 The stale claims (fixed in place 2026-10-10)

| where | the stale claim | the truth |
|---|---|---|
| `PIN_INDICATOR_PORT_BUILD.md:15` | v2 = `668e89d7` | v2 = `282517ac`; `668e89d7` is the ROOT copy — **FIXED** |
| `PIN_INDICATOR_PORT_BUILD.md:19` | `CDP :9222, app on display :3` | both DEAD; app = WebKitGTK on wayland-0 — **FIXED** |
| `CURRENT_STATE.md` header + :14/:297 | v2 = `668e89d7` / `5bb4baf3` / `7ebbe95b` | **ERRATA block added at the top** |
| `CURRENT_STATE.md:232` | v1 = `82da437a` | v1 = `0d20e831` (the seal) |
| `BUILD_STATE.md:3,21,22,352` | v2 = `668e89d7` | STALE |
| `EVIDENCE_STATE.md:9,11,31,82,83,112` | `PASS` / `AUDIT GATE: PASS` / `7/7` | HISTORICAL greens for an EARLIER artifact; the JEV gate reads **NO** today |

## 24.3 THE SC-19 TRAP (the biggest one)

SC-19 requires **zero** baked zone literals. The APPROVED render does NOT satisfy SC-19:

```
grep -cE 'e1_injected_(top|bottom|cat|degree|zfp)\.push\([0-9]' \
   pine-ide/ide/renderer/plutus-vision-v2.pine     →  18   (SC-19 wants 0)
```

**NO pine on disk is SC-19 == 0.** Do NOT conflate the two approvals:

- **The VISUAL approval (C16)** — the operator looked at the Jul-6 render. `282517ac` satisfies this.
- **The SC-19 goal** — compute the zones live. NOT met by any file on disk. The next agent's job
  (W1-W7) is to PRODUCE it. Do NOT "fix" `282517ac` by reverting it — that destroys the C16 render.

## 24.4 The gate

`bash JEV_GATE/run_gate.sh` → **NO** (all chunks noop). Every `PASS` elsewhere in the pack is history.

## 24.5 The first turn

```
1. sha256sum pine-ide/ide/renderer/plutus-vision-v1.pine   → 0d20e831…517bd1 or STOP (H1)
2. bash JEV_GATE/run_gate.sh                                → post the verdict (NO)
3. ~/.local/bin/pine-ide --status ; capture the display ; OPEN the image ; name the render
4. grep -cE 'e1_injected_(top|bottom|cat|degree|zfp)\.push\([0-9]' \
      pine-ide/ide/renderer/plutus-vision-v2.pine           → 18 (SC-19 wants 0)
```
