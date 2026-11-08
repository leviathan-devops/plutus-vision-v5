# DEBUG_LOG — PLUTUS VISION (append-only)

Project root: /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION
Artifact under test: plutus-vision-v0.pine sha256 605bff82d3539e9e5e258da30ba4ec80607a3df7749fb5deb5f4402350f95847 (1520 lines)
Format per entry: THE FINDING → THE ROOT CAUSE → THE FIX (file:line) → THE VERIFICATION → THE LESSON.
Entries EN-001..EN-020 were captured 2026-10-01 during the v1-clean-baseline session.

## EN-001 — Pine IDE left panel rendered as bare unstyled HTML (2026-10-01)

- **THE FINDING:** the forked IDE (served at :9851) drew the chart styled but the editor/toolbar/rows/Agent's-Face panel as unstyled HTML (operator screenshot "what is this fucking garbage").
- **THE ROOT CAUSE:** `pine-ide/ide/renderer/index.html` linked ONLY `styles.css`. The tab CSS (`tokens.css`, `tabs/pineshell.css`, 15,301 bytes) is injected at runtime by `tabs/_shell.js` via fetch-and-`<style>`; that path was designed for Electron `file://` hosting and did not land when served over HTTP.
- **THE FIX:** `pine-ide/ide/renderer/pine.html` (the standalone host) links `styles.css`, `tokens.css`, `tabs/pineshell.css` directly and pins `window.dashboardConfig` before any script.
- **THE VERIFICATION:** curl `tabs/pineshell.css` → 200, 15,301 bytes; screenshot `/tmp/pv-standalone.png` showed the styled panel. A first attempt appeared to fail only because the reused Chrome profile cached the old HTML (see EN-010 for the class).
- **THE LESSON:** a fork that changes the HOST (Electron file:// → HTTP) must re-check every asset path the original host supplied implicitly.

## EN-002 — mount fight: "host lost the tab (a sibling re-render) — re-mounting" loop (2026-10-01)

- **THE FINDING:** console showed `[PlutusShell] pine-shell: host lost the tab ... re-mounting` repeating; `[data-shell-host="pine-shell"]` innerHTML length 0.
- **THE ROOT CAUSE:** the dashboard's `app.js` re-renders tab panels; `_shell.js`'s ownership test (`tabKeysIn(host)`) sees the fragment gone and re-mounts — the two fight forever.
- **THE FIX:** standalone `pine.html` loads only `tabs/_shell.js` + `tabs/pineshell.js` — no `app.js`, no tab manager.
- **THE VERIFICATION:** `document.querySelectorAll('.pine-shell').length` → 1 and `window.PlutusPineShell` present after load.
- **THE LESSON:** when forking one tab of an app, remove the app; do not try to co-host it.

## EN-003 — kernel import 404 (tabs/pine-ide symlink absent, then wrong depth) (2026-10-01)

- **THE FINDING:** `importKernel()` bases `apiBase + '/tabs/pine-ide/'` → 404; mount never completed.
- **THE ROOT CAUSE:** the original install contract is `ln -sfn ../../pine-ide dashboard/renderer/tabs/pine-ide`; the fork never created it. My first symlink used `../../pine-ide` from `renderer/tabs/` which resolves to `ide/pine-ide` (absent).
- **THE FIX:** `pine-ide/ide/renderer/tabs/pine-ide -> ../../../pine-ide` (relative, survives copying).
- **THE VERIFICATION:** `ls pine-ide/ide/renderer/tabs/pine-ide/pine-ide.mjs` → resolves; served 200.
- **THE LESSON:** compute relative symlink depth from the LINK's directory, then `ls` through it before moving on.

## EN-004 — WORKBENCH_ABSENT: charts/workbench.bundle.js 404 (2026-10-01)

- **THE FINDING:** chart panel showed `WORKBENCH_ABSENT — Failed to fetch dynamically imported module: http://127.0.0.1:9851/charts/workbench.bundle.js`.
- **THE ROOT CAUSE:** the kernel imports the Vela workbench from `${apiUrl.origin}/charts/`; the server root is `ide/renderer`, the bundle lives in `pine-ide/charts/`.
- **THE FIX:** `pine-ide/ide/renderer/charts -> ../../charts`.
- **THE VERIFICATION:** curl `/charts/workbench.bundle.js` → 200; probe `workbenchAbsent:false`, 14 canvases.
- **THE LESSON:** every dynamic import origin must be listed and served; read the import sites before serving a fork.

## EN-005 — FEED_BAD_REPLY: GET /api/v1/chart/bars → 404 (2026-10-01)

- **THE FINDING:** `P.loadBars()` → `FEED_BAD_REPLY ... /api/v1/chart/bars` 404; chart had 0 series.
- **THE ROOT CAUSE:** the FixtureProvider (`charts/workbench.js` getBars) expects the dashboard's main API; the fork served static files only (`python3 -m http.server`).
- **THE FIX:** `scripts/pv-server.py` (141 lines) serves static + `/api/v1/chart/bars?pair&timeframe`, mapping fixture `{timestamp,...}` → wire `{time,...}`, accepting `15m|30m|1H|4H` and `15|30|60|240`; missing cell returns `{success:false, code:'FIXTURE_CELL_ABSENT'}`.
- **THE VERIFICATION:** `scripts/verify_server.py`: EUR/USD 1H → 1603 bars; AUD/USD → NAMED FAIL FIXTURE_CELL_ABSENT.
- **THE LESSON:** read the consumer's request/response contract (workbench.js getBars + barsOf) before writing the provider.

## EN-006 — blank chart: Vela canvas sized 24,677 px tall (2026-10-01)

- **THE FINDING:** run reported 109 boxes / 183 drawings, but the visible chart was empty; `.pine-chart-host` rect = 861 × 24,756 px; canvas 816 × 24,677.
- **THE ROOT CAUSE:** `pineshell.css` sizes `.pine-shell { height: 100% }`; under the dashboard the app shell supplies a definite-height ancestor chain; in the standalone page `height:100%` resolved to `auto`, the flex chart host (`min-height:320px; flex:1 1 auto`) grew to content, and Vela sized its canvas to that height. The plot rendered far below the viewport.
- **THE FIX:** `pine.html` `<style>`: `html,body{height:100%}`, `body.pine-standalone{height:100vh;display:flex}`, `#pine-shell-root{flex:1 1 auto;min-height:0;display:flex}`.
- **THE VERIFICATION:** host 861 × 719, canvas 816 × 640; X11 window grab showed candles + geometry.
- **THE LESSON:** a measured element size (getBoundingClientRect) beats every theory about compositors; measure the host before blaming GPU/capture.

## EN-007 — editor load silently no-op'd (setValue does not exist) (2026-10-01)

- **THE FINDING:** RUN produced `title:"EMA Ribbon"` (the prefill) after "loading" the merged file; my own probe printed `editorLen: 83217`.
- **THE ROOT CAUSE:** the editor API (`pine-ide/pine-ide/pine-editor.mjs`) is `setSource/getSource/flush`; `setValue/getValue` are undefined. My probe's fallback `(P.editor.getValue ? ... : src).length` printed the SOURCE length, not the editor's — a false confirmation.
- **THE FIX:** `scripts/pv-load.mjs` uses `P.editor.setSource(src); P.editor.flush()`.
- **THE VERIFICATION:** run title `"Plutus Vision v0"`; editor head = `// PLUTUS VISION v0 — merged bundle`.
- **THE LESSON:** a probe must read the thing it claims to read — never fall back to the input you just wrote. (Also THEATRICALITY_LOG T-02.)

## EN-008 — timeframe '1h' (lowercase) left the chart on an unmapped market (2026-10-01)

- **THE FINDING:** `loadBars({timeframe:'1h'})` switched the market to an unmapped code; 0 bars.
- **THE ROOT CAUSE:** kernel `TF_CODE` keys are `'15m','30m','1H','4H'`; `tfCode('1h')` fell through.
- **THE FIX:** callers pass `'1H'`; pv-load default `1H`.
- **THE VERIFICATION:** `bars: 1603`, market `{provider:'fixture', ticker:'EURUSD', timeframe:'60'}`.
- **THE LESSON:** read the mapping table, do not guess label casing.

## EN-009 — DOUBLE MOUNT: two editors, chart showing the EMA-Ribbon prefill (2026-10-01, OPERATOR-CAUGHT)

- **THE FINDING:** operator screenshots: two `PINE gate · buffer` tabs, two editor columns (prefill + merged), chart showing the yellow/blue EMA ribbon. I had reported the IDE as working.
- **THE ROOT CAUSE:** `pine.html` called `PlutusShellTabs['pine-shell'].mount(host)` manually AND `_shell.js:532` auto-mounts every `[data-shell-host]` on DOMContentLoaded → two kernels on one host.
- **THE FIX:** removed the manual mount block from `pine.html` (comment left in its place).
- **THE VERIFICATION:** `shells:1, editors:1, microtabStrips:1`; `pv-load.mjs` now exits `DOUBLE_MOUNT` if `.pine-shell` count != 1.
- **THE LESSON:** before adding an init call, grep for the framework's own auto-init (`DOMContentLoaded`, `scan`).

## EN-010 — stale Chrome survivors ran old module code after edits (2026-10-01)

- **THE FINDING:** after patching `vision.mjs`, the live chart still held `pricelabel` drawings with `text.content`; 3 Chrome mains on `--user-data-dir=/tmp/pv-ide-chrome` (oldest 01:03:28 uptime).
- **THE ROOT CAUSE:** `pkill -f "pv-ide-chrome"` in the launcher did not terminate them; the survivor held the profile singleton + CDP :9222, the new `--app` was handed to it, and it kept the previously loaded modules.
- **THE FIX:** `scripts/pv-ide.sh`: `for p in $(pgrep -f "user-data-dir=/tmp/pv-ide-chrome"); do kill -9 "$p"; done`, wait loop, `CHROME_STUCK` refusal.
- **THE VERIFICATION:** two consecutive launches → `chromes: 1` each time; live drawing types became `text`.
- **THE LESSON:** after a kill, assert absence (pgrep count 0) — a kill is a claim.

## EN-011 — POOLS 0/25 drawings in the merge (2026-10-01)

- **THE FINDING:** `scripts/compare.py` (geometry keyed on type+anchors+colour): POOLS source 25 drawings, merged 0 matched.
- **THE ROOT CAUSE:** the W1 rename prefixed the TYPE FIELD `x` → `bsl_x` in `type bsl_ZZ` but every access stayed `.x` (`bsl_aZZ.x.get(0)` at the merge's POOLS section) — the zigzag never recorded pivots, so no zones.
- **THE FIX:** `plutus-vision-v0.pine` `type bsl_ZZ` field restored to `int [] x` (line ~1201 at the time).
- **THE VERIFICATION:** `scripts/pv_bisect` / compare: POOLS 0/25 → 25/25.
- **THE LESSON:** a namespace rename must never touch type FIELDS — only top-level identifiers. Diff the renamed section against the source with the prefix stripped (`perl -pe 's/\bbsl_//g'`) to see real deltas.

## EN-012 — W3 budget guards changed what was drawn (2026-10-01)

- **THE FINDING:** merged VOIDS/SWEEPS/POOLS/SMC deltas traced to added lines: `if swp_aBoxBr.size() < 125` guards (some with mis-indented bodies so the guard covered only the drop counter), `voi_lqV.size() < 100`, `bsl_b_liq_*.size() < 75`, drop counters, and an SMC FVG wrapper capped at 200.
- **THE ROOT CAUSE:** earlier session customised the indicators ("budget allocator") despite the operator's "no customizing"; the guards altered control flow.
- **THE FIX:** `scripts/deguard.py` removed every `*_drops` line, every size guard (dedenting its body), the counter declarations, and restored the SMC `smc_fairValueGapBox(...) => box.new(...)` one-liner. Backup: `/tmp/plutus-vision-v0.pre-deguard.pine`.
- **THE VERIFICATION:** `guards left: 0`; merged still compiles; compare deltas changed as expected.
- **THE LESSON:** "bundle the four" means verbatim modulo identifiers; every behavioural edit must be justified by a measured constraint.

## EN-013 — the one-script 500-box ceiling GC'd SMC order blocks; my first fix broke VOIDS (2026-10-01)

- **THE FINDING:** SMC 190/195 (5 order-block boxes missing), VOIDS 465 → merged fewer.
- **THE ROOT CAUSE:** a single Pine script has ONE `max_boxes_count = 500`. SMC pre-allocates its order-block boxes on bar 0 (the oldest objects); VOIDS keeps filled voids drawn forever, so its footprint grows past the ceiling and the engine deletes oldest-first — SMC's boxes. Bisection (`/tmp/pv_bisect.py`): removing VOIDS → SMC 195/195.
- **THE FIX:** `var array<box> voi_all` tracks every VOIDS slice; after the section's update loop `while voi_all.size() > 380: box.delete(voi_all.shift())` (`plutus-vision-v0.pine:1103`, cap block after the `voi_lqV.size() > 500` line). FIRST ATTEMPT placed the declaration INSIDE `if voi_per` (split the block → VOIDS 0/465) — fixed by moving it above `if voi_per`.
- **THE VERIFICATION:** SMC 195/195, POOLS 25/25; VOIDS newest 380 kept, evicted strictly oldest (`newest evicted 1780639200000 == oldest kept 1780639200000`).
- **THE LESSON:** a shared-resource fix must bound the GROWING consumer at its own oldest objects; and every insertion point must be re-read in context (indentation is scope in Pine).

## EN-014 — every structure label rendered as a price ("1.15") (2026-10-01)

- **THE FINDING:** chart pills showed `1.16/1.15/1.14/1.13` instead of `BOS/CHoCH/Strong High`. The ViL reader still answered "labels: YES".
- **THE ROOT CAUSE:** `vision.mjs` mapped Pine labels to Vela `pricelabel`; Vela `PriceLabel.labelText()` returns `anchors[0].price.toFixed(2)` and ignores text (workbench.bundle.js PriceLabel class).
- **THE FIX:** `pine-ide/pine-ide/vision.mjs:137` maps labels to Vela `text` with `text:{value, color: textColor, size:'small', hAlign:'center', vAlign by style}`; empty-text labels skipped; verified count accepts `text` (`vision.mjs:241`).
- **THE VERIFICATION:** live drawing types `{box, trendline, text}`; screenshot shows BOS/CHoCH/EQL text.
- **THE LESSON:** read the renderer class that consumes your schema; a field name match (`text`) is not a contract.

## EN-015 — anchors dropped on future bar_index drawings (2026-10-01)

- **THE FINDING:** status `7 anchors dropped`.
- **THE ROOT CAUSE:** station `anchorTime()` returned null for `bar_index >= bars.length`; Pine draws up to 500 bars into the future (`bar_index + 10` POOLS zones).
- **THE FIX:** `pine-ide/pine-station/lib/run.mjs:114-123` extrapolates `last.openTime + (i-(n-1))·interval` for i ≤ n-1+500.
- **THE VERIFICATION:** merged drops 7 → 3 (400 bars) / 4 (1603). Same counts as SMC alone (3/4); VOIDS/POOLS alone 0 → the remainder is the SMC source's own behaviour.
- **THE LESSON:** compare drop counts merged-vs-sources before calling a drop a merge defect.

## EN-016 — the fork wrote VIL rows through the DASHBOARD's rail :9444 (2026-10-01)

- **THE FINDING:** `gate.mjs DEFAULT_RAIL_BASES = [9444, 9445]`; :9444 owned by `PLUTUS/LIVE/dashboard/.../vil-rail.mjs` (another session).
- **THE ROOT CAUSE:** constant inherited from the reference checkpoint.
- **THE FIX:** `gate.mjs:21` → `['http://127.0.0.1:9754']`; `pv-ide.sh` starts the fork's own rail on :9754 with `PLUTUS_VIL_DIR=<tree>/vil`, `PLUTUS_VIL_EVIDENCE=<tree>/evidence`.
- **THE VERIFICATION:** status strip `rail :9754 · station UP`; rail log `vil=<tree>/vil`.
- **THE LESSON:** list every port a fork talks to and prove each is owned by the fork.

## EN-017 — compare.py keyed on the wrong schema (all None) (2026-10-01)

- **THE FINDING:** first parity run: keys like `('box', None, None, None, None)`; "lost=44" meaningless.
- **THE ROOT CAUSE:** assumed `left/right/top/bottom`; station emits `{a:{time,price}, b:{time,price}, color}` and labels `{time, price, text}`.
- **THE FIX:** `scripts/compare.py keys()` uses the real schema.
- **THE VERIFICATION:** source counts 195/465/25 match per-source run counts.
- **THE LESSON:** dump one record of the schema before writing a comparator.

## EN-018 — /tmp/bisect.py shadowed the stdlib bisect module (2026-10-01)

- **THE FINDING:** `AttributeError: cannot access submodule 'request' of module 'urllib' (circular import)`.
- **THE ROOT CAUSE:** urllib imports `bisect`; my script was named `bisect.py` in the cwd of the run.
- **THE FIX:** renamed `/tmp/pv_bisect.py`.
- **THE VERIFICATION:** bisection ran.
- **THE LESSON:** never name a script after a stdlib module.

## EN-019 — launcher hang: port held by a supervised server + background child (2026-10-01)

- **THE FINDING:** `pine-ide` hung > 3 minutes; `pv-ide.sh` in `do_wait`.
- **THE ROOT CAUSE:** (a) an older `pv-server` started under `hub` (restart=on-failure) still held :9851; (b) `( cd X && setsid node ... & )` left the station as a child the script waited on.
- **THE FIX:** `hub stop pv-server`; launcher uses `setsid -f` for station/rail/server/chrome, a `PORT_HELD` refusal after `fuser -k`, and `timeout 120` on pv-load.
- **THE VERIFICATION:** cold launch `real 0m9.081s`, exit 0.
- **THE LESSON:** a launcher must fail loudly with a named code, never wait silently.

## EN-020 — launch chain was not relocatable (hardcoded live paths) (2026-10-01)

- **THE FINDING:** `pv-ide.sh`, `pv-load.mjs`, `sandbox_up.py`, `pv-server.py` hardcoded `/home/.../PLUTUS_VISION` and the fixture lived in `PLUTUS/LIVE/agent/reference/fixtures`.
- **THE ROOT CAUSE:** written for one tree.
- **THE FIX:** fixture copied to `fixtures/bars/2026-07-06.json` (sha256 0c8f7d7aa3171af8… identical to the LIVE copy); `pv-ide.sh` derives `W` from its own path and starts the station with `PLUTUS_BARS_FIXTURE` + `PLUTUS_LIVE_ROOT=<tree>`; `pv-load.mjs` uses `import.meta.dir`; `pv-server.py` reads `PV_FIXTURE` or `<tree>/fixtures`; `~/.local/bin/pine-ide` honours `PINE_IDE_HOME`.
- **THE VERIFICATION:** station log `fixture=<tree>/fixtures/bars/2026-07-06.json present=true`; checkpoint launch proven in TESTING_LOG.
- **THE LESSON:** a checkpoint that cannot run from its own directory is not self-contained.

## EN-021 — ViL engineer read: VOIDS slices drawn with tan borders (OPEN, 2026-10-01)

- **THE FINDING:** 15m/30m/4H frames: VOIDS 13-slice stacks render as heavy tan-striped blocks (operator's 30m image).
- **THE ROOT CAUSE (classified PIPELINE per the ViL bible §3.3):** source draws `box.new(..., na, bgcolor=...)` (border na); station emits no borderColor; `vision.mjs` applies the BRASS default border.
- **THE FIX:** OPEN — next tuning wave (owner file `pine-ide/pine-ide/vision.mjs` box mapping).
- **THE VERIFICATION:** pending re-render + reader + engineer read.
- **THE LESSON:** a renderer default must not invent styling the source did not ask for.

## EN-022 — The vision-in-the-loop path was a 4B VLM answering four presence questions (2026-10-01)

- **THE FINDING:** the only verdict path for a visual product ran `POST /vil/look` → local Qwen3.5-4B, which was asked Q1 candlesticks / Q2 zones / Q3 labels / Q4 lines, temperature 0, max_tokens 220, and regex-parsed for `VERDICT: PASS|FAIL|INCONCLUSIVE`. It returned PASS on the 30m frame the operator called broken and on the cleaned 30m frame — indistinguishable. It returned `Q3: YES` on frames where every structure label rendered as a price pill (`vil-rail.mjs:291-347`).
- **THE ROOT CAUSE:** a presence detector was wired into the verdict position. Nothing asked it about clutter, overlap, clipping, or correctness, so nothing could be detected by it. Three `VIL GATE: PASS` lines were then cited in BUILD_REPORT, TESTING_LOG and EVIDENCE_STATE as proof the indicator renders correctly.
- **THE FIX:** `vil-rail.mjs` `lookAt()` now returns `{retired:true, verdict:'TRIAGE_ONLY', note: VLM_READER_RETIRED…}`; the original body is preserved as `lookAt__retired`. Verified live: `curl POST :9754/vil/look` → `{"retired":true,"verdict":"TRIAGE_ONLY",…}`.
- **THE VERIFICATION:** the endpoint refuses to produce a verdict. The replacement is `computer-use action=look` + the agent's own read + `action=verdict`.
- **THE LESSON:** a verifier may only occupy the verdict slot for a question the product's acceptance criteria actually contain. Four presence questions do not cover "rendered properly / accurate / zones correct".

## EN-023 — `require("node:crypto")` in an ESM extension threw on load (2026-10-01)

- **THE FINDING:** `computer-use/index.js` failed to import: `require is not defined` inside the `sha256` helper.
- **THE ROOT CAUSE:** the helper was written CommonJS-style while the extension is ESM (`export { x as default }`, per the `omp-ct` shape). Caught by `node --input-type=module -e "import(...)"`, which is why the load check runs before the rail test.
- **THE FIX:** `import { createHash } from "node:crypto"` at the top; the helper is now `const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");`
- **THE VERIFICATION:** `module loads: function` · `grep -c "require(" index.js` → 0.
- **THE LESSON:** a syntax check (`node --check`) passes on CommonJS calls inside ESM; the load check is what actually catches it.

## EN-024 — `pickWindow` searched only `$DISPLAY`, so the unobserved rail was never exercised (2026-10-01)

- **THE FINDING:** `computer-use action=focus title="Plutus Vision"` returned `FOCUS failed — no window matched`; `screenshot` returned no image. The rails that depend on a bound window silently produced nothing, and the rail test appeared to "pass" because the refusal came from `NO_WINDOW` instead of the rail.
- **THE ROOT CAUSE:** `pickWindow(titleRe)` ran `xdotool search` with `DISPLAY` inherited from the process (`:99` in the eval kernel) while the target window lives on `:3`. A single-display search cannot see across X servers. Compounding it, `discoverDisplays` filtered `--onlyvisible`, which hides unmapped-managed windows.
- **THE FIX:** `pickWindow(titleRe)` now iterates every discovered display and binds the one that matches; `discoverDisplays` searches without `--onlyvisible`. Both carry a comment naming the bug and the test that found it.
- **THE VERIFICATION:** `focus` → `FOCUS 14680067 "Plutus Vision — Pine IDE" on :3 · origin 44,86 · size 1626x931`; `look` → `image ✓ sha 35d98e22 bytes 241210`.
- **THE LESSON:** a test that passes because a DIFFERENT refusal fired proves nothing — the rail test asserted "refused", not "refused for the right reason". Assert the reason.

## EN-025 — `look` and `claim` were pre-gated by the window check (2026-10-01)

- **THE FINDING:** after the rails were added, `action=claim` with zero verdicts returned `NO_WINDOW` instead of `CLAIM_UNSUPPORTED`, and `action=look title=…` never bound.
- **THE ROOT CAUSE:** the window-binding guard ran for every action not in an exempt list, and `look`/`claim` were not on it — so they hit `requireWindow()` before reaching their own branches. A second bug: `look` called a `dispatch()` function that does not exist (introduced when the call was rewritten to avoid re-entering `tool.execute`).
- **THE FIX:** introduced `SELF_BOUND = ["plan","expect","verdict","report","ack","look","claim"]`; `look` binds and then **falls through** to the single `screenshot` branch (`act = "screenshot"`), so there is exactly one capture implementation.
- **THE VERIFICATION:** `T1 claim with no evidence → ✓ CLAIM REFUSED` · `T2 look (one call) → image ✓ sha 35d98e22`.
- **THE LESSON:** a dispatch-order change is a behaviour change; the rail test caught it in one run.

## EN-026 — "PASS, but the labels overlap" was recordable as PASS (2026-10-01)

- **THE FINDING:** `action=verdict verdict=PASS missing="" wrong="CHoCH labels overlap badly"` recorded a clean PASS.
- **THE ROOT CAUSE:** the rail checked for a look and an expectation but not the verdict's own content. "PASS with deltas" is the theatrical shape itself — a green summary line whose detail line contradicts it.
- **THE FIX:** `PASS` carrying `missing` or `wrong` is **REFUSED** with the deltas echoed and the two lawful options named (fix and re-look, or record FAIL). `force=1` overrides and writes a `verdict_override` ledger row naming the deltas.
- **THE VERIFICATION:** `T3 PASS with deltas → ✓ VERDICT REFUSED — PASS with deltas is the theatrical shape.` · `T4 PASS forced → allowed, override logged`.
- **THE LESSON:** the rail must judge the verdict, not only the circumstances that produced it.

## EN-027 — `ack` let an unlooked interaction be claimed silently (2026-10-01)

- **THE FINDING:** `action=ack` cleared `unobserved` and wrote one line, which is a free bypass of the look rail.
- **THE ROOT CAUSE:** `ack` was designed as an escape hatch for "I saw it another way" but was implemented with no cost.
- **THE FIX:** `ack` now **REFUSES** unless `note=` carries a reason of ≥12 characters; with one it clears the count, writes the reason into the ledger permanently, and `action=report` counts it under `acks w/o a look`.
- **THE VERIFICATION:** `T5 ack with no reason → ✓ ACK REFUSED` · `T6 ack with reason → allowed, gap recorded` · report line `acks w/o a look : 1 → the change is visible in the station log line, not in a frame`.
- **THE LESSON:** every escape hatch needs a cost proportional to what it bypasses, or it becomes the cheapest path.

## EN-028 — THE IDE WAS RENDERING A TWO-SESSION-OLD BINARY (the worst defect of the session)

- **THE FINDING:** the direct-look pass read the editor's visible text and saw `// BEHAVIOR: zero deltas vs sources` and the `W3 BUDGET` block. The source file said `BUDGET: one script = one 500-box ceiling… BEHAVIOR (measured…): SMC 195/195 · POOLS 25/25 … VOIDS newest 380 kept`. Hashing the editor's contents in-page gave `d7e0060997316565`; the file under test is `605bff82d3539e9e`.
- **THE ROOT CAUSE — three layers, each masking the last:**
  1. `plutus-vision-v0.pine` had been `cp`'d into `pine-ide/ide/renderer/` early in the session. Every fix after that went to the top-level file only. The IDE's `fetch('/plutus-vision-v0.pine')` served the stale copy.
  2. The copy was replaced by a relative symlink — but the browser still had the old bytes.
  3. `pv-server.py` sent `Cache-Control: no-store` only for `.html/.css/.js/.mjs`. **`.pine` was not in the list**, so Chrome served a *cached* copy indefinitely.
  4. A `python3 -m http.server` started earlier still held `:9851`, so `pv-server.py` never bound and its (fixed) headers were never sent.
- **THE IMPACT:** every visual verdict recorded before this point — the parity-crossing frames, the 1H/30m reads, the crash matrix — was rendered from `d7e00609`, NOT `605bff82`. The counts differed (`112 boxes / 51 lines` vs the correct `122 / 57`). The label and border fixes *were* visible because those live in `vision.mjs`, which is served live; the POOLS fix, the VOIDS cap and the corrected header were **not** on screen at all.
- **THE FIX:** (a) the renderer copy is now a symlink `-> ../../../plutus-vision-v0.pine`; (b) `pv-server.py` sends `no-store, no-cache, must-revalidate` for **everything except images and fonts**; (c) the stale `http.server` was killed and `pv-server.py` started; (d) `scripts/verify_served_pine.sh` compares source / renderer / over-the-wire shas and exits non-zero on `SERVED_PINE_DRIFT`.
- **THE VERIFICATION:** `source 605bff82d3539e9e  renderer 605bff82d3539e9e  served 605bff82d3539e9e → SERVED_PINE_OK`; after a hard reload the editor hashes `605bff82d3539e9e` and the run reports **122 boxes / 57 lines / 24 labels**, matching `scripts/compare.py`.
- **THE LESSON:** a source-of-truth file served to a verifier must be a symlink, served no-store, and sha-checked over the wire. A copy is a claim; only the hash is evidence. **This defect is the exact class the operator named — and it was caught by reading the pixels, not by any gate.** Every automated check had passed while the wrong binary rendered.

## EN-029 — The rail persisted its ledger but not its session

- **THE FINDING:** `action=expect` in one process then `action=verdict` in the next refused with `VERDICT REFUSED — no named expectation was written` — the rail firing for the wrong reason.
- **THE ROOT CAUSE:** state lived in a module-level `const S`, which dies with the process. The ledger (`runs.jsonl`) was written but never read back.
- **THE FIX:** `saveSession()`/`loadSession()` persist `display/win/plan/expectation/unobserved/lastShot/rows` to `~/.omp/agent/run/computer-use/session.json`.
- **THE LESSON:** a rail whose own state cannot survive the caller's process boundary refuses for the wrong reason, and a rail that refuses for the wrong reason teaches the caller to distrust it.

## EN-030 — `saveSession` had 3 call sites and no definition

- **THE FINDING:** after the first persistence patch, `session.json` was never written and `grep -c "saveSession()"` returned 3.
- **THE ROOT CAUSE:** the patch that inserted the definition silently did not land (the write was overwritten by a second script in the same command), and every call site wrapped it in `try { … } catch {}`, which swallowed the `ReferenceError` at runtime. The tool loaded, ran, and silently persisted nothing.
- **THE FIX:** the definition was inserted explicitly and verified by reading the file.
- **THE LESSON:** `catch {}` around bookkeeping turns a missing function into a silent no-op. A silent no-op in a verification rail is worse than a crash.

## EN-031 — `loadSession()` ran in the temporal dead zone

- **THE FINDING:** with the definition present, the expectation still did not survive. `loadSession` was called at line 61, `const S` is declared at line 64.
- **THE ROOT CAUSE:** `Object.assign(S, …)` inside `loadSession` referenced `S` before its `const` binding initialised → `ReferenceError` → swallowed by the `catch`. Every process started with default state, so `saveSession` dutifully overwrote a good file with an empty one.
- **THE FIX:** the `loadSession()` call was moved below the `S` declaration, with a comment naming the TDZ as the cause. A second patch persisted `unobserved`/`lastShot` mutations from the `look`, `ack` and `verdict` branches, which also lacked a save.
- **THE VERIFICATION:** `bash scripts/drive.sh` → `expectation: 1H on 605bff82… / unobserved : 0 / win : 14680067` across four separate node processes; the verdict then records instead of refusing.
- **THE LESSON:** a persisted-state loader placed above its own state object looks correct and is dead. Read the file after every patch instead of assuming.

## EN-032 — locked drawings could still be DELETED (operator-found)

- **THE FINDING:** the operator reported *"i can still delete the rendered indicator elements"* after `locked: true` had stopped the drag. True: clicking a drawing + Delete was blocked, but the Data Window's Remove button was not.
- **THE ROOT CAUSE:** Vela honours `locked` on the CANVAS path only — `deleteTargets()` returns `hit.locked ? [] : [hit.id]` (workbench.bundle.js:30689). Three object-tree paths call `chart.drawings.remove(d.id)` with **no check at all**: the Data Window row trash (48348), the context-menu "Remove" entry (48892), and one more site (51261).
- **THE FIX:** guard the STORE, not each caller — `remove(id)` returns `false` when `this.byId.get(id).locked` (workbench.bundle.js:17717), and `removeMany(ids)` filters through `this.ctrl.get(id)?.locked`. One change covers the keyboard, the Data Window, the context menu and every future caller.
- **THE VERIFICATION:** the first attempt threw `Cannot read properties of undefined (reading 'get')` — `removeMany` lives in the WRAPPER class (which has `this.ctrl`), not the store (which has `this.byId`). Fixed by reading through `this.ctrl.get()`.
- **THE LESSON:** a flag enforced on one path is not a lock. Guard the operation, not the callers.

## EN-033 — the inputs panel rendered raw variable names and one flat scroll (operator-found)

- **THE FINDING:** the operator screenshotted the settings dialog: `internalBullColorInput` and `internalBearColorInput` shown as labels, everything in one scroll with no indication of which indicator any input belonged to.
- **THE ROOT CAUSE:** two omissions in `study-legend.mjs`:
  1. **`inline=` was not implemented.** TradingView's convention is that an input with an EMPTY title and an `inline` key renders on the SAME ROW as the input above it (source: `internalBullColorInput = input.color(GREEN, '', group = INTERNAL_GROUP, inline = 'ibull')`). Rendering them as their own rows forced the fallback to the raw variable name.
  2. **The `// ═══ SMC ═══` section markers were ignored**, so all 84 inputs from four indicators sat in one flat list.
- **THE FIX:** `pine-ide/pine-ide/input_parser_v2.mjs` (new) — `parseInputSections()` returns per-indicator sections; `buildRows()` groups by the inline KEY across the whole list (SWEEPS declares `c1/c2/c1/c2`, which a consecutive-run matcher misses); `prettyName()` prettifies the last-resort label. `study-legend.mjs` rewritten to render collapsible `<details>` sections with input counts, the source's own `group=` as sub-headers, inline members side by side, a filter box, changed-field markers, and tooltips.
- **THE VERIFICATION:** `node scripts/test_parser_v2.mjs` → `sections: 4` · SMC 52→39 rows · SWEEPS 10→8 · VOIDS 8→4 · POOLS 14→5 · `ibull@101 → label "Bullish Structure" · members showInternalBullInput(string), internalBullColorInput(color)`. Live dialog query → `SMC:39 rows / SWEEPS:8 / VOIDS:4 / POOLS:5`, groups `[Smart Money Concepts, Real Time Internal Structure, Real Time Swing Structure, Order Blocks, EQH/EQL, Fair Value Gaps, Highs & Lows MTF, Premium & Discount Zones, Liquidity Sweeps, …]`. Frames `10-settings-v2.png` sha 154ebc8762 40 5c, `11-settings-all4.png` sha 541d0435f77.
- **THE LESSON:** reproducing an upstream UI means implementing its conventions, not its fields. `inline=` is a layout rule; ignoring it changes the labels.
