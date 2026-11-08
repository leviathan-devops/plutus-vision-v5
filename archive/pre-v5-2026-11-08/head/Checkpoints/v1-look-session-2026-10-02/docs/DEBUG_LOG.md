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

## 2026-10-02 — EN-17..EN-21 (the look session)

**EN-17 · the frame swap that never cleared.** Every visual verdict was read off stacked
layers; each compile added a full frame. Root cause: drawings emit `locked`, and the store's
`remove()` honours the lock, so `clearDrawings()` removed nothing. Fix: unlock before removing
(`122eb16`). Verified: live `cleared: 58` / `153`. Lesson: a protection flag that serves the
user can silently disable the renderer.

**EN-18 · the 50-line cap that ate 62 zones.** D2 drew 112 zones into 50 lines, no error.
Root cause: the engine's default `max_lines_count = 50`. Fix: 500 on lines/labels/boxes in all
three builders. Verified: 30-221 lines per deliverable/TF. Lesson: an undeclared cap eats data
silently.

**EN-19 · D1's paint suppression, two failed rounds.** D1 rendered 117 boxes of the detectors'
own primitives vs 36 LQZ lines. Round 1 missed because the POOLS colours are declared
`input.color (` WITH A SPACE (`input\.color\(` never matched). Round 2 missed the SWEEPS AREA
colours (`*_2` @50%, `*_3` @25%) — the large translucent bands dominating the frame. Fix:
override all 12 in place, same names, detection untouched. Verified: frame `a0f96c396c8168f7`.
Lesson: a regex over generated source must tolerate the source's actual whitespace.

**EN-20 · the panel grid's three defects.** (1) all three captures identical (44613 bytes x3);
(2) off by one — each panel froze the PREVIOUS deliverable; (3) the real cause, named only by
the assertion: `run()` returns the compiled script's own `run.title`, and the first run after
`setSource` compiles the PREVIOUS source because `flush()` is debounced. Fix: fixed point —
run until the returned title IS this deliverable (D1 1, D2 2, D3 7 runs). Verified: three
distinct shas + the identical-panel guard refuses a non-distinct grid. Lesson: "the value
changed" is not an identity test; assert the SUBJECT by name.

**EN-21 · the retry budget one attempt above the worst case.** The battery watched 8 attempts
exhaust after a legitimate panel needed 7. Fix: 20. Lesson: a retry budget that close to the
observed maximum is a coin flip, not a guard.

---

# 2026-10-02 — THE FULL EXPANSION (EN-17..EN-21 at density)

The entries above are the index; these are the entries. Each carries the finding, the root cause, the fix, the
verification, and the lesson — and each is expanded to the point where a session with zero prior context could
reproduce the diagnosis from this file alone.

---

## EN-17 · THE FRAME SWAP THAT NEVER CLEARED

### THE FINDING
Every compile stacked a complete fresh frame onto the previous frame's drawings. The chart accumulated; nothing
was ever removed. Measured consequence: the status strip reported `6 boxes · 3 labels` while the frame contained
a barcode of overlapping translucent fills and hairlines from the WHOLE SESSION's compiles.

**The report that surfaced it was the operator's, by eye, from a screenshot:**
> *"the colors are really bright which looks like multiple rounds are stacking on top of each other."*

That sentence is the complete diagnosis. No instrument in the project had reported it; four mechanical gates had
passed the frames it described.

### THE ROOT CAUSE — the full mechanism
```
vision.mjs, per compile:
   for each drawing:
       box.new(...) / line.new(...) / label.new(...)
              │
              └── emitted with  locked: true

why locked:true is CORRECT:
   the operator must not be able to drag or delete indicator output on the chart.
   On TradingView, clicking an indicator drawing and moving it is normal behaviour;
   this project explicitly must NOT allow that. The lock is the mechanism. (directive 5)

the store's clear path:
   clearDrawings()
      └── for each drawing: store.remove(d)
             └── if (d.locked) return;      ← THE HONOURING OF THE LOCK
                    │
                    └── removes NOTHING, returns SUCCESS

∴ every compile: 0 removals, N additions. The chart is the union of all frames.
```

**Why three separate observations failed to catch it:**
1. `clearDrawings()` returns without throwing — a call that removes nothing is indistinguishable from a call that
   removes everything, to any caller checking for success.
2. The status strip's counts describe the CURRENT compile's emitted drawings, not the chart's contents. `6 boxes`
   was TRUE about the compile and FALSE about the chart.
3. The `cleared` field existed in `lastVision` and read `0` — and `0` was not read as a defect because
   "there was nothing to clear" is a plausible reading of it.

### THE FIX
```javascript
// unlock before remove — the two callers have opposite needs
for (const d of drawings) d.locked = false;
clearDrawings();
```
Committed `122eb16`, message: *"the frame swap must actually clear - every visual verdict was on stacked layers"*.

### THE VERIFICATION
| observation | before | after |
|---|---|---|
| `lastVision.cleared` on a second compile | `0` (or absent) | `58` (D2), `153` (D1), `58` (D3) |
| frame sha across two compiles of the same script | identical | identical (correct — same input, same output) |
| frame sha across two DIFFERENT scripts | **identical when they should differ** | differs |
| the frame | barcode | candles visible |

**The decisive test:** compile D1 then D2 and compare the frame shas. Before the fix they could be identical
because both were rendered over the union of everything; after, they are distinct.

### THE LESSON, AND ITS GENERAL FORM
> **A protection flag that serves one caller can silently disable another.**
> The lock protects the OPERATOR from the renderer's drawings. The clear serves the RENDERER.
> One boolean cannot express both; the separation must be WRITTEN (unlock-then-clear) and not assumed.

### WHAT IT INVALIDATED
**Every visual verdict recorded before `122eb16`.** Including verdicts recorded as PASS. The ledger keeps the
pre-fix frames deliberately — they are the record of what a stacked frame looks like, and the evidence that the
fix changed something.

---

## EN-18 · THE 50-LINE CAP THAT ATE 62 ZONES

### THE FINDING
D2's emitter requested 112 zones. The vision reported `50 lines`. **62 zones were discarded with no error, no
warning, and `capped.drawings` reading `0`.**

### THE ROOT CAUSE
```pine
indicator("LQZ Plutus — operator candle liquidity", overlay = true)   ← no caps declared
```
PineTS 0.10.0's defaults: `max_lines_count = 50`, `max_labels_count = 50`, `max_boxes_count = 50`. The emitter's
zone loop runs 112 times; the engine keeps the first 50 line objects and drops the rest silently.

### WHY IT WAS INVISIBLE
1. The count printed was the count DRAWN (`50`), not the count EMITTED (`112`). A reader sees a number, not a gap.
2. `capped` reported `0` — the field covers segment and drawing caps, not the line budget.
3. The frame still showed A ladder. 50 lines look like a ladder. The defect is a DENSITY loss, not a failure.

### HOW IT WAS FOUND
By comparing two numbers that live in different components: the emitter's own requested-zone count against the
vision's reported line count. Neither component could see the gap alone.

### THE FIX
```pine
indicator("…", overlay = true,
  max_labels_count = 500, max_lines_count = 500, max_boxes_count = 500)
```
Applied to all three deliverables. Measured after: D1 30-182 lines, D2 38-112, D3 57-221 across four timeframes.

### THE VERIFICATION
The full matrix re-measured (BUILD_REPORT §III.1). The tell that it worked: D2's 30m and 1H rows both read `112`
— exactly the number the emitter requests, where before both read `50`.

### THE LESSON
> **An undeclared cap is a cap that eats data silently.**
> Declare every budget the engine imposes, and compare EMITTED against DRAWN. A count of what survived is not a
> count of what was requested.

### THE CLASS
Same shape as EN-17: a mechanism reporting success about itself. `50 lines` was TRUE about the vision and FALSE
about the emitter's intent.

---

## EN-19 · D1'S PAINT SUPPRESSION, IN TWO FAILED ROUNDS

### THE FINDING
D1's deliverable is *"the three LuxAlgo detectors bundled with proper full-width horizontal display"*. It rendered
as **117 boxes of the detectors' own primitives** against 36 LQZ lines. The frame read as three stacked render
styles — the exact defect D1 exists to remove.

### THE ROOT CAUSE (structural)
The three detectors drive 34 draw calls of their own (`SWEEPS` 12, `VOIDS` 6, `POOLS` 16). Bundling them verbatim
bundles their DISPLAY. The task is to keep their DETECTION and drop their PAINT.

### THE ARCHITECTURE THAT MADE THE FIX POSSIBLE
The detectors' internal state reaches the LQZ layer through TAPS — accessor functions:
```pine
lqzV1PoolMid()  => lqzV1PoolMid
lqzV1PoolRail() => lqzV1PoolRail
lqzV1SwpPrc()   => lqzV1SwpPrc
lqzV1VoidLo()   => lqzV1VoidLo
lqzV1VoidHi()   => lqzV1VoidHi
```
Because the LQZ layer consumes the taps (not the drawings), the detectors' drawing calls can be made INVISIBLE
without touching anything the LQZ layer depends on. **Deleting the calls would break code paths that run whether
or not anything is visible** — every `.set_top()`, `.set_rightbottom()` and array push.

### ROUND 1 — THE WHITESPACE MISS
```python
SILENT = ("swp_colBl", "swp_colBr", "voi_lqBC", "voi_lqSC",
          "bsl_cLIQ_B", "bsl_cLIQ_S", "bsl_cLQV_B", "bsl_cLQV_S")
blk = re.sub(rf"^{cname}\s*=\s*input\.color\(.*?\)$", f"{cname} = color(na)", blk, flags=re.M)
```
**The POOLS colours are declared `input.color (` — WITH A SPACE before the paren:**
```pine
bsl_cLIQ_B = input.color (color.new(#4caf50,  0), '', inline = 'Buyside', group = liqGrp)
```
`input\.color\(` requires `color(` adjacently. It never matched those four. **The build succeeded; the paint did
not change.** Detected by looking at the frame, not by the build.

### ROUND 2 — THE MISSING AREA COLOURS
The list above covers 8 constants. The SWEEPS section declares **four more**:
```pine
swp_colBl2 = input.color(#08998180,  ''  , …)    ← 50% alpha
swp_colBr2 = input.color(#f2364580,  ''  , …)    ← 50% alpha
swp_colBl3 = input.color(#08998141, 'Bull', …)   ← 25% alpha
swp_colBr3 = input.color(#f2364541, 'Bear', …)   ← 25% alpha
```
**These are the large translucent bands that dominated the frame** — the first thing an eye notices. Detected by
looking at the frame after round 1.

### A THIRD SELF-INFLICTED DEFECT — THE RENAME COLLISION
My first fix approach used a blanket `.replace()` to rename the section's references. A blanket replace renames
BOTH the declaration and the uses, so:
```
Identifier 'lqzSUPswpBl' has already been declared (40:4)     ← my rename vs my constant
```
**The fix was not a better name — it was to STOP renaming** and override the input declarations in place.

### THE FIX THAT WORKED
```python
SILENT = ("swp_colBl", "swp_colBr", "swp_colBl2", "swp_colBr2",
          "swp_colBl3", "swp_colBr3",
          "voi_lqBC", "voi_lqSC",
          "bsl_cLIQ_B", "bsl_cLIQ_S", "bsl_cLQV_B", "bsl_cLQV_S")
for cname in SILENT:
    blk = re.sub(rf"^{cname}\s*=\s*input\.color\s*\(.*?\)$",
                 f"{cname} = color(na)", blk, flags=re.M)
```
Committed `d6c633d`. **Same names, in place** — every downstream `.set_top()` / `.set_rightbottom()` / array push
keeps working; only transparency changes.

### THE VERIFICATION — the two-sided proof
| side | observation |
|---|---|
| detection UNTOUCHED | the counts are **identical** before and after: `total: 153`, `lqz: "117/36"` |
| paint CHANGED | the frame is different: `e7694c1692c68e42` (blocks) → `a0f96c396c8168f7` (no blocks) |

**The counts-identical half is the proof the suppression is a display change.** If the counts had moved, the fix
would have altered detection.

### THE LESSONS (three, all general)
1. **A regex over GENERATED source must tolerate the source's actual whitespace.** Match `\s*` where the source
   may have a space; the generated code's formatting is not stable across source versions.
2. **A mutation whose effect you cannot see is a mutation you have not verified.** Both failed rounds reported a
   successful build.
3. **Prefer overriding a declaration to renaming its references.** A rename must reach every use and no
   declaration; a replace does not know the difference.

---

## EN-20 · THE PANEL GRID'S THREE DEFECTS

### THE FINDING (three, in sequence)
1. **All three panels were the same frame.** `sha256` identical, 44613 bytes each.
2. **Off by one.** Each panel showed the PREVIOUS deliverable's frame.
3. **The real cause**, named only by a new assertion: `run()` returns the compiled script's own `run.title`, and
   the FIRST run after `setSource` compiles the PREVIOUS source — because the editor's `flush()` is debounced.

### DEFECT 1 — THE SOURCE RACE
```
  D1 ok=true cleared=105 5b/79l/21L  -> /tmp/lqz-panel/D1.png
  D2 ok=true cleared=105 5b/79l/21L  -> /tmp/lqz-panel/D2.png
  D3 ok=true cleared=105 5b/79l/21L  -> /tmp/lqz-panel/D3.png
```
One signature (`5b/79l/21L` = D3's) three times. `ok=true` on every run.

**Why it was silent:** `ok=true` describes the RUN, and a run that compiles the previous source IS a successful
run. Nothing in the per-panel output compared the panels to each other.

**The guard that caught it:** an sha-uniqueness check after the captures — D1/D2/D3 must have distinct shas.

### DEFECT 2 — THE WEAK IDENTITY TEST
The fix for defect 1 waited for `lastVision` to CHANGE before capturing. Measured:
```
  D1 ok=true cleared=105 117b/36l/0L   ← correct
  D2 ok=true cleared=153 117b/36l/0L   ← D1's signature
  D3 ok=true cleared=153 0b/58l/0L     ← D2's signature
```
The "changed" test is satisfied by the PREVIOUS run's late completion. The guard caught it again
(`panels are not distinct — D1=4ea7e951751b D2=4dd69cf0a668 D3=4dd69cf0a668`).

**Why it was silent:** "the value changed" says nothing about WHAT it changed to.

### DEFECT 3 — THE ASSERTION THAT NAMED THE CAUSE
Added: assert the HOLD SOURCE in the editor, then assert the RUN's returned title.
```
PANEL_GRID_FAIL: D1 — {"ok":false,"error":"ran 'Plutus Vision v1' but expected 'LQZ LuxAlgo'"}
```
**This one line is the diagnosis.** The editor HELD the right text (`LQZ LuxAlgo`) while `run()` COMPILED something
else — the previous source. The debounce is the mechanism.

### THE FIX — the fixed point
```javascript
let rr = null, got = null, tries = 0;
for (; tries < 20; tries++) {
  rr = await P.run({ silent: true });
  got = rr.run && rr.run.title;
  if (got && got.includes(EXPECT)) break;
  await new Promise(r => setTimeout(r, 700));
}
if (!got.includes(EXPECT)) return fail("after " + tries + " runs still compiled '" + got + "'");
```
Measured landing: **D1 1 run, D2 2 runs, D3 7 runs.**

### THE VERIFICATION
```
  D1 "LQZ LuxAlgo" in 1 run(s) ok=true cleared=153 117b/36l/0L
  D2 "LQZ Plutus — operator candle liquidity" in 2 run(s) ok=true cleared=153 0b/58l/0L
  D3 "Plutus Vision v1" in 7 run(s) ok=true cleared=58 5b/79l/21L
panels distinct: D1=4ea7e951751b D2=4dd69cf0a668 D3=6f58ca0de55f
wrote reports/panel-grid-1H.png  2002x1340
PANEL_GRID_OK
```

### THE LESSONS
1. **Assert the SUBJECT by name.** "The value changed" is not an identity test; assert the run's returned title.
2. **Prefer an assertion with a retry over a delay with a hope.** A sleep is a guess about an unpublished
   debounce and fails silently when the guess is short. The fixed point is self-correcting AND reports its
   attempt count — which is how the 7-run measurement, and therefore EN-21, became visible.
3. **A per-item success flag cannot detect a cross-item defect.** Each of the three identical runs reported
   `ok=true`. Only the cross-panel comparison could see it.

---

## EN-21 · THE RETRY BUDGET ONE ATTEMPT ABOVE THE WORST CASE

### THE FINDING
The fixed point's budget was 8. A legitimate panel (D3) measured **7**. The adversarial battery then watched 8
attempts exhaust without landing and reported `after 8 runs still compiled '…'`.

### THE ROOT CAUSE
The budget was set from a single observation plus one. That is a budget calibrated to the OBSERVED maximum, which
is by definition the minimum of the distribution — the next run is as likely to exceed it as to meet it.

### THE MEASUREMENT THAT SHOULD HAVE SET IT
| panel | runs |
|---|---|
| D1 | 1 |
| D2 | 2 |
| D3 | 7 |
| the battery's mutant | > 8 (exhausted) |

A budget must be set from the distribution's TAIL, not its mean or its last sample.

### THE FIX
Raised to 20 attempts × 700 ms (14 s worst case). Failure beyond that returns a message naming the compiled
title and the attempt count.

### THE LESSON
> **A retry budget near the observed worst case is a coin flip, not a guard.**
> Budget ≥ 3× the observed worst case, or make the operation deterministic. A guard that fails on the next
> legitimate input is indistinguishable from a broken guard.

### THE CLASS
The same shape as the project's larger defects: a mechanism reporting a plausible result about itself. `after 8
runs still compiled …` was TRUE about the loop and FALSE about the product — the product was fine; the budget
was not.

---

# THE FIVE ENTRIES IN ONE TABLE

| id | the one-line finding | the transferable rule |
|---|---|---|
| EN-17 | the clear path removed nothing; every frame stacked | a protection flag serving one caller can disable another — write the separation |
| EN-18 | a default cap ate 62 of 112 zones with no error | an undeclared cap eats data silently; compare EMITTED to DRAWN |
| EN-19 | the detectors' paint buried the consolidated layer; two regex misses | a mutation whose effect you cannot see is not verified |
| EN-20 | `run()` compiles the previous source after `setSource` | assert the SUBJECT by name; a per-item flag cannot see a cross-item defect |
| EN-21 | the retry budget was one attempt above the observed worst case | budget ≥ 3× the tail, or make it deterministic |

**THE COMMON STRUCTURE.** All five are mechanisms that reported success about THEMSELVES while the product was
wrong. All five were invisible to the project's four mechanical gates. **Three of the five were found by an eye
on a frame** (EN-17 by the operator's, EN-19's two rounds by mine); the other two by a comparison across
components that no single component could make.

---

# THE EARLIER ENTRIES AT DENSITY (EN-011 · EN-013 · EN-014 · EN-028)

These four carry the project's most transferable mechanisms. Expanded from the summaries above at the level a
session with zero prior context needs to reproduce the diagnosis.

---

## EN-011 · POOLS 0/25 IN THE MERGE — a namespace rename must never touch a TYPE FIELD

### THE FINDING
`scripts/compare.py` keys each drawing on `(type, anchors, colour)` and compares the merged bundle against each
upstream source. SMC matched 195/195. POOLS matched **0/25** — the source drew 25 objects, the merged bundle
matched none of them.

### THE ROOT CAUSE — one identifier, one scope
The W1 rename prefixed identifiers by subsystem: `x` → `smc_x`, `swp_x`, `voi_x`, `bsl_x`. For POOLS the zigzag
type was renamed:
```pine
type bsl_ZZ
    int [] bsl_x        ← the FIELD was renamed (WRONG)
```
but every ACCESS still used the bare name:
```pine
bsl_aZZ.x.get(0)        ← reads a field named `x`, which no longer exists
```
**Pine does not error on a missing field read in this position — it yields na.** So the zigzag never recorded a
pivot, `bsl_aZZ` stayed empty, and the POOLS section drew nothing. The compile succeeded; the section was simply
inert.

### WHY IT WAS INVISIBLE
- The merged file COMPILED — a missing field read is not a compile error.
- The section's own guards (`if bsl_aZZ.size() > 0`) were all false, so nothing threw.
- SMC's 195/195 dominated the totals; POOLS is 25 objects against SMC's 195, so the merged count looked plausible.

### THE FIX
```pine
type bsl_ZZ
    int [] x            ← field restored to the bare name (line ~1201 at the time)
```
The prefix applies to **top-level identifiers** (types, functions, variables), never to **type fields**.

### THE VERIFICATION
`scripts/pv_bisect` + `compare.py`: **POOLS 0/25 → 25/25.**

### THE DETECTOR FOR THE CLASS
Strip the prefix from the merged section and diff it against its source:
```bash
perl -pe 's/\bbsl_//g' <the merged section> | diff - <the source section>
```
Any remaining delta is a REAL behavioural change. A clean diff means the rename was mechanical.

### THE LESSON
> **A namespace rename must never touch type FIELDS — only top-level identifiers.**
> A field rename that misses its accesses produces `na` reads, not errors, and an inert section that compiles.

---

## EN-013 · THE 500-BOX CEILING — one script, one budget, oldest-first eviction

### THE FINDING
After the merge: SMC 190/195 — **5 order-block boxes missing.** VOIDS matched 465 in isolation and fewer in the
merge. The gap appeared only when the sections shared one script.

### THE ROOT CAUSE — a shared ceiling with oldest-first eviction
```pine
indicator("…", max_boxes_count = 500)     ← ONE budget for the WHOLE script
```
- **SMC pre-allocates its order-block boxes on bar 0** — the OLDEST objects in the script.
- **VOIDS keeps filled voids drawn forever** — its footprint grows monotonically.
- When VOIDS' footprint pushes the total past 500, the engine **deletes oldest-first** — which is SMC's boxes.

**Bisection confirmed it:** removing VOIDS restored SMC to 195/195 (`/tmp/pv_bisect.py` — note: `pv_bisect`, not
`bisect`, see EN-018).

### THE FIX — bound the growing consumer at its OWN oldest objects
```pine
var array<box> voi_all = array.new<box>()      ← TOP-LEVEL declaration
// … in VOIDS' update loop, after voi_lqV.size() > 500:
while voi_all.size() > 380
    box.delete(voi_all.shift())                ← evict the OLDEST VOID
```
`plutus-vision-v0.pine:1103`, the cap block after the `voi_lqV.size() > 500` line.

### THE FIRST ATTEMPT MADE IT WORSE — and the reason is a Pine law
I placed `var array<box> voi_all = …` INSIDE `if voi_per`. **In Pine, indentation is scope.** The declaration ran
only when `voi_per` was true, so on a false branch `voi_all` did not exist and the whole VOIDS block split:

**VOIDS 465 → 0.**

The fix: move the declaration ABOVE the `if`, so it exists unconditionally.

### THE VERIFICATION
- SMC **195/195**, POOLS **25/25** restored.
- VOIDS keeps the newest 380, evicting strictly oldest — proven by the boundary check:
  `newest evicted 1780639200000 == oldest kept 1780639200000` (the eviction is exactly at the boundary, no gap).

### THE LESSONS
1. **A shared-resource fix must bound the GROWING consumer at its own oldest objects** — capping a consumer that
   is not the one growing leaves the problem intact.
2. **Every insertion point must be re-read in context.** Indentation is scope in Pine; a declaration inserted one
   level deep changes when it exists.

### THE CLASS
This is the same shape as EN-18 (a cap eating data silently) — but found a session earlier, from the other side:
here the cap was DECLARED and shared; there it was DEFAULTED and undeclared.

---

## EN-014 · EVERY STRUCTURE LABEL RENDERED AS A PRICE

### THE FINDING
The chart's label pills showed `1.16 / 1.15 / 1.14 / 1.13` — prices — where `BOS / CHoCH / Strong High` belonged.
The vision-in-the-loop reader of the time still answered **"labels: YES"**, because labels WERE rendering. They
were rendering the wrong string.

### THE ROOT CAUSE — a field-name match is not a contract
`vision.mjs` mapped Pine `label` objects to Vela's `pricelabel`. Reading Vela's `PriceLabel` class in
`workbench.bundle.js`:
```javascript
PriceLabel.labelText() {
  return this.anchors[0].price.toFixed(2)     ← IGNORES the text entirely
}
```
The `PriceLabel` type **does not accept text**. Its label IS the price. The mapping compiled, the object was
created, the reader saw a label — and the content was structurally impossible.

### THE FIX
`pine-ide/pine-ide/vision.mjs:137` — map labels to Vela `text` instead:
```javascript
text: { value, color: textColor, size: 'small', hAlign: 'center', vAlign: <by style> }
```
Empty-text labels are skipped, and the verified count accepts `text` (`vision.mjs:241`).

### THE VERIFICATION
- live drawing types: `{box, trendline, text}` — the `pricelabel` type is gone;
- a screenshot shows `BOS / CHoCH / EQL` as text;
- the reader's answer is now backed by the right rendering type.

### THE LESSON
> **Read the renderer class that CONSUMES your schema.** A matching field name (`text`) is not a contract —
> the consumed type decides what is renderable, and the type here could not hold the string at all.

### THE CLASS
This is the project's most recurring shape, one layer down: a mechanism (the reader) answered a question about
ITSELF ("is a label present?") while the product question ("does it say BOS?") went unasked and unanswered.

---

## EN-028 · THE IDE WAS RENDERING A TWO-SESSION-OLD BINARY *(the project's worst defect)*

### THE FINDING
A direct-look pass read the editor's visible text and found:
```
// BEHAVIOR: zero deltas vs sources          ← the header the IDE was showing
```
while the file on disk said:
```
BUDGET: one script = one 500-box ceiling… BEHAVIOR (measured…): SMC 195/195 · POOLS 25/25 …
VOIDS newest 380 kept
```
Hashing the editor's contents in-page: **`d7e0060997316565`**. The file under test: **`605bff82d3539e9e`**.

**The IDE had been rendering a two-session-old build.**

### THE ROOT CAUSE — FOUR LAYERS, EACH MASKING THE LAST
```
LAYER 1  THE STALE COPY
   plutus-vision-v0.pine was `cp`'d into pine-ide/ide/renderer/ early in the session.
   Every fix afterwards went to the top-level file ONLY.
   The IDE's fetch('/plutus-vision-v0.pine') served the renderer's stale copy.
        │
LAYER 2  THE SYMLINK DID NOT HELP
   The copy was replaced by a relative symlink — but the browser still held the OLD BYTES.
        │
LAYER 3  THE CACHE HEADER COVERED THE WRONG EXTENSIONS
   pv-server.py sent `Cache-Control: no-store` only for .html/.css/.js/.mjs.
   .pine was NOT in the list → Chrome served a CACHED copy indefinitely.
        │
LAYER 4  THE PORT WAS HELD BY A DIFFERENT SERVER
   A `python3 -m http.server` started earlier still held :9851,
   so pv-server.py never bound — and its (fixed) headers were never sent at all.
```
Each layer alone would have been survivable. Together they formed a chain where the visible fix (the symlink)
changed nothing because the server was not the server.

### THE IMPACT — stated precisely
**Every visual verdict recorded before this point was rendered from `d7e00609`, not `605bff82`:**
- the parity-crossing frames,
- the 1H and 30m reads,
- the crash matrix.

The counts differed: `112 boxes / 51 lines` (stale) vs `122 boxes / 57 lines` (correct).

**The subtler half:** the label and border fixes WERE visible — because those live in `vision.mjs`, which IS served
live. So the screen showed a MIX: current renderer over a stale script. A partially-correct frame is more
misleading than a wholly stale one, because the correct parts build false confidence in the rest.

### THE FIX (four parts, one per layer)
1. the renderer copy is now a **symlink** → `../../../plutus-vision-v0.pine`;
2. `pv-server.py` sends `no-store, no-cache, must-revalidate` for **everything except images and fonts**;
3. the stale `http.server` was killed and `pv-server.py` started (asserting the port);
4. **`scripts/verify_served_pine.sh`** compares source / renderer / over-the-wire shas and exits non-zero on
   `SERVED_PINE_DRIFT`.

### THE VERIFICATION
```
source 605bff82d3539e9e  renderer 605bff82d3539e9e  served 605bff82d3539e9e → SERVED_PINE_OK
```
After a hard reload the editor hashes `605bff82d3539e9e` and the run reports **122 boxes / 57 lines / 24 labels**,
matching `scripts/compare.py`.

### THE LESSONS
1. **A source-of-truth file served to a verifier must be a SYMLINK, served no-store, and sha-checked over the
   wire.** A copy is a claim; only the hash is evidence.
2. **Check the port's OWNER before believing a config change took effect.** A fixed header on a server that never
   bound fixes nothing.
3. **A mix of live and stale code is the most misleading state.** Verify the WHOLE chain, not the part you changed.

### THE CLASS — and why it is the worst
This is the project's worst defect because **every automated check passed while the wrong binary rendered.** The
parity script compared files on disk (correct). The compile gate compiled what it was given (correct). The reader
saw labels (correct). Only reading the PIXELS — the editor's own visible bytes, hashed in-page — could see it.

**It is the purest instance of the project's one rule:** a claim about the product requires the product, observed.

---

# THE DEBUG LOG'S STANDING PATTERN

Nine entries above (EN-011 … EN-021, EN-028) and five from this session (EN-17 … EN-21) share one structure:

> **A mechanism reported success about itself while the product was wrong.**

| entry | the mechanism | what it reported | what was true |
|---|---|---|---|
| EN-011 | the POOLS section | compiled, drew 0 | a field read returned `na` |
| EN-013 | the box budget | 500 boxes kept | SMC's were the oldest, so SMC's were evicted |
| EN-014 | the label reader | "labels: YES" | the labels were prices |
| EN-028 | the whole IDE chain | the file under test | a two-session-old binary rendered |
| EN-17 | `clearDrawings()` | removed | removed nothing |
| EN-18 | the line count | 50 lines | 112 were requested |
| EN-19 | the build | succeeded | the paint did not change |
| EN-20 | each panel run | `ok=true` | the wrong script ran |
| EN-21 | the retry loop | exhausted | the budget was too small, not the input wrong |

**The remedy for the class is always the same:** find the observable that is the PRODUCT rather than the MECHANISM,
and assert on that. For rendering, the observable is the frame. There is no substitute, and this project has now
paid for that lesson nine times.

---

# THREE MORE AT DENSITY (EN-012 · EN-016 · EN-022)

## EN-012 · THE W3 BUDGET GUARDS CHANGED WHAT WAS DRAWN

### THE FINDING
Merged VOIDS/SWEEPS/POOLS/SMC deltas traced to lines that were not in any source:
```pine
if swp_aBoxBr.size() < 125       ← a size guard (some with mis-indented bodies, so the guard
if voi_lqV.size() < 100             covered only the drop counter, not the draw)
if bsl_b_liq_*.size() < 75
*_drops counters
an SMC FVG wrapper capped at 200
```

### THE ROOT CAUSE
An earlier session had "customised" the indicators under the heading of a *budget allocator* — **despite the
operator's explicit "no customizing"**. The guards did not merely cap output: they altered CONTROL FLOW. A guard
around a draw with its body mis-indented means the draw runs unconditionally and only the counter is gated.

### THE FIX
`scripts/deguard.py` removed:
- every `*_drops` line,
- every size guard (dedenting its body back to top level),
- the counter declarations,
- and restored the SMC one-liner `smc_fairValueGapBox(...) => box.new(...)`.

Backup taken: `/tmp/plutus-vision-v0.pre-deguard.pine`.

### THE VERIFICATION
`guards left: 0`; the merged bundle still compiles; `compare.py` deltas changed as expected (the guards had been
suppressing real drawings).

### THE LESSON
> **"Bundle the four" means verbatim modulo identifiers.** Every behavioural edit must be justified by a MEASURED
> constraint — and the measurement must be shown, not asserted. A budget guard is a behavioural edit.

### THE CLASS
A guard added "for safety" that silently changes output is the same shape as EN-18's default cap: a mechanism
altering the product while reporting nothing.

---

## EN-016 · THE FORK WROTE VIL ROWS THROUGH THE *DASHBOARD'S* RAIL

### THE FINDING
`gate.mjs` carried:
```javascript
const DEFAULT_RAIL_BASES = [9444, 9445]
```
and `:9444` is owned by `PLUTUS/LIVE/dashboard/.../vil-rail.mjs` — **another session's rail.**

### THE ROOT CAUSE
The constant was inherited verbatim from the reference checkpoint the fork was built from. The fork inherited the
reference's PORT along with its code.

### THE IMPACT
The fork's gate rows were written into the dashboard's rail ledger — this session's evidence landing in another
session's store. A cross-session write, invisible from either side alone.

### THE FIX
- `gate.mjs:21` → `['http://127.0.0.1:9754']`;
- `pv-ide.sh` starts the fork's OWN rail on `:9754` with `PLUTUS_VIL_DIR=<tree>/vil`,
  `PLUTUS_VIL_EVIDENCE=<tree>/evidence`.

### THE VERIFICATION
Status strip reads `rail :9754 · station UP`; the rail log names `vil=<tree>/vil`.

### THE LESSON
> **List every port a fork talks to and prove each is owned by the fork.**
> A fork inherits its ancestor's PORTS as silently as its code, and a port is a shared resource with another
> session's state on the other end.

---

## EN-022 · THE VISION-IN-THE-LOOP PATH WAS A 4B VLM ANSWERING FOUR PRESENCE QUESTIONS

### THE FINDING
The ViL gate's verdict came from a 4B local vision model answering four yes/no questions about element presence.
It recorded PASS on frames the operator could see were defective.

### THE ROOT CAUSE — the substitute class in full
The gate was written before the product was lookable. It was therefore designed against the signals that WERE
available — "is there a canvas", "are there drawing objects", "is a legend present" — rather than the verdict
that was required — "is the chart right". A 4B model asked presence questions answers presence questions, and it
answers them CORRECTLY: the canvas existed, the objects existed, the legend existed.

**Every individual answer was true. The verdict was false.**

### WHY IT SURVIVED SO LONG
1. The gate produced a verdict-shaped artifact (`PASS`) with a sha — it looked like evidence.
2. The questions were answered promptly and plausibly.
3. **No one asked the gate what it could not see.** The gate's exclusions were never enumerated.

### THE FIX (the pattern that replaced it)
```
capture → an eye opens the frame → a verdict recorded WITH the frame's sha
```
No model mediates. The capture half is mechanical; the verdict half is the eye.

### THE VERIFICATION OF THE REPLACEMENT
This session: five frames opened by the agent's own eye, each with a sha, three of them carrying a FAIL that the
old gate had passed — including the operator-caught stacked-frames defect the four gates all passed.

### THE LESSON
> **A verification substitute satisfies every gate while proving nothing about the product.**
> The test for the class: *if this mechanism were deleted, would any fact about the product become unknown?*
> If the answer is no, it is a substitute. For the 4B reader, the answer was no.

### THE CLASS
This is the project's Class A — the most expensive mistake in its history, and the reason the frame is now the
primary instrument.
