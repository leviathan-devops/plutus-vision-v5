# Pinebox's fork of the Pine IDE runtime

Operator ruling R1 (2026-11-03): "PINE IDE SOURCE IS OFF FUCKING LIMITS. PINEBOX IS SUPPOSED TO BE FORKED AND ENTIRELY SELF CONTAINED."

Pinebox runs ONLY from this directory. The CLI sets `PB_FORK="$PB_HOME/fork"` (pinebox:29); the station, the rail, the static server,
the loader, the fixtures and the backtest room are started from here, never from PLUTUS_VISION or the PLUTUS dashboard.

## Provenance (copied with `git archive`, committed bytes only)

| fork path | upstream | commit |
|---|---|---|
| pine-ide/ide/renderer, pine-ide/charts, pine-ide/pine-ide, pine-ide/pine-station | PLUTUS_VISION/pine-ide/... | 9fc33bbc82865fdf75dd5759393a1854e46d3763 |
| scripts/pv-server.py, scripts/pv-load.mjs | PLUTUS_VISION/scripts/ | 9fc33bbc82865fdf75dd5759393a1854e46d3763 |
| fixtures/bars, data/e1, plutus-vision-v0.pine, plutus-vision-v2.pine | PLUTUS_VISION/ | 9fc33bbc82865fdf75dd5759393a1854e46d3763 |
| dashboard/backtest-room, dashboard/lib/clean-spawn.cjs, dashboard/electron/server/db.js, dashboard/renderer/{tabs/_shell.js,tabs/backtest.js,tokens.css} | PLUTUS/GITHUB-PLUTUS-DASHBOARD/plutus-shell/src/dashboard/... | 7b78c45f95eb87794ba06177dcaab44468737f78 |

PLUTUS_VISION was first restored by `9fc33bb` (ruling R2: revert 987dc3e and 0888248), so the fork starts from the operator's original bytes.

## Local to the fork (not upstream)
- pv-server.py imports `inject` from `scripts/pinebox`; in the fork that directory does not exist, and the launcher passes `PYTHONPATH=$PB_HOME` (this tool's CLI directory) instead. (A `scripts/pinebox -> ../..` symlink was tried first: it made a directory loop that broke `diff -rq` and the seal.)
- `pine-ide/pine-station/node_modules`: not in git; `deploy.sh push` runs `npm ci` from the fork's own package-lock.json.
- The station's canon (`PLUTUS_CANON_PINE`) points at `canon/absent.pine`: the trading build's canon indicator is not part of Pinebox; `/health` reports `present:false`.

## Changes made in the fork after the copy
Every change to a fork file is listed here with its commit; `UPSTREAM.sha256` holds each file's hash at copy time, so
`sha256sum -c UPSTREAM.sha256` names exactly the files the fork has changed.
- 2026-11-03 (W6, ruling R1): `pine-ide/pine-station/lib/run.mjs` emits Pine polyline geometry (time-anchored points) instead of a count, and `pine-ide/pine-ide/vision.mjs` draws it - the change of PLUTUS_VISION 0888248 (reverted there by ruling R2), applied to the fork, plus `counts.polylines = drawings.polylines.length` (the reverted commit left the count reading `other.__polylines__`, which is always 0 after it).
- 2026-11-03 (W8 audit, ta stage 1 S1_X1_TEST_FILE x4): `dashboard/backtest-room/test/` (adversarial.mjs, fragment-hooks.test.mjs, resume.mjs, run-isolated.mjs) removed from the fork - upstream's own test files, copied in by the R1 fork, referenced by nothing in Pinebox's runtime (measured: no file outside test/ names them); a delivery carries no unit-test files (the testing law, X1).
- 2026-11-03 (W8 audit, ta stage 2 candidates on Pinebox's live paths): `scripts/pv-server.py`:
  - `/api/v1/health` answers FIXTURE_ABSENT (success:false) when the fixture is unreadable; it said success with 0 cells (D-77).
  - `/api/v1/e1/zones` names an unreadable newest E1 file (E1_UNREADABLE) instead of skipping it and serving the previous week's zones as current (D-53).
  - The PV_* numbers are validated at start and exit BAD_CONFIG by name (D-107..D-111).
  - The cleanup excepts are narrowed to the already-gone cases (D-46..D-52).
  - `pine-station/server.mjs`: PINE_STATION_PORT and PINE_STATION_RSS_CAP_MB are validated (a NaN cap silently disabled the memory guard; D-105/D-106).
  - `vil-rail.mjs`: PLUTUS_VIL_PORT is validated (D-104); the dead `lookAt__retired` is removed (no reference; D-201).
  - `backtest-room/control.mjs`: PLUTUS_BACKTEST_PORT is validated (D-103).
- 2026-11-03 (W8 audit, ta stage 2 orphans): eight exports referenced by nothing in the fork or the CLI (measured: 0 word-level references) are removed - `clearState` (tabs/backtest-persist.mjs), `getClosed` (backtest-room/store.mjs), `loadVela` (pine-ide.mjs), `anchoredCacheStats` and `clearAnchoredCache` (backtest-room/bars.mjs), `stopSync` (backtest-room/lifecycle.mjs), `clearWorkspace` (pine-persist.mjs), `createRoom` (backtest-room/replay.mjs). Their only callers were upstream's test files removed earlier the same day; dead code is removed, never carried.
- 2026-11-03 (W8, found while checking the audit fixes; the EN-195 queued item): the IDE's gate week survives a tab switch and a reload.
  - The shell re-mounts the Pine IDE on every tab activation (`container.innerHTML = fragment`, tabs/pineshell.js:138).
  - The local mirror (`pine-persist.mjs`) carried source/activeTab/market/tabs but not the week, so the week input came back empty and `pinebox verify` refused WEEK_MISMATCH after `tab --to backtest` -> `tab --to pine`.
  - Now `plutus.pine.week` is persisted (validated YYYY-Www or YYYY-MM-DD; a malformed value restores nothing) on every week change and every persist, and restored at mount.
  - `importWorkspace` keeps the mirror's week when a server workspace has none (it cleared it).
- 2026-11-03 (W8 audit, ta stage 2 round 6): files Pinebox never loads are removed - noVNC with its vendored pako (109 files under ide/renderer/novnc/), ide/renderer/{app.js,browser-polyfill.js,trade-canvas.js,tabs/_agent-desk.js}, dashboard/backtest-room/lifecycle.mjs, dashboard/lib/clean-spawn.cjs, charts/build.mjs.
  - Measured reach: the live page's resource list over CDP on both tabs (32 paths), the static import closure of the three node entries (station server.mjs, vil-rail.mjs, room control.mjs: 12 modules; control lib/run.mjs present) and pv-server.py.
  - Every reference from reachable code is a comment (_shell.js, _term-bridge.js, agent-face.mjs) or absent; the CLI, the extension and deploy.sh name none of them.
  - They are the upstream Electron dashboard's renderer pieces; Pinebox serves pine.html only.
- 2026-11-03 (W8): `ide/renderer/tabs/pineshell.js` resolves its asset base to its OWN directory over http (it used './', i.e. the page's dir, and requested /pineshell.css: a 404 on every mount) and does not inject the stylesheet pine.html already links; `pine.html` declares an empty icon (the browser's automatic /favicon.ico was a 404 on every load).
- 2026-11-03 (W8 audit, ta stage 2 round 7 D-123): `resolveVelaCtor` (pine-ide.mjs) is removed - its only callers were inside `loadVela`, removed earlier the same day; measured 0 references after that removal.
- 2026-11-04 (operator: "PINEBOX NEEDS TO BE 100% SELF CONTAINED"; the judge is the only allowed external dependency): every host path is removed from the fork's runtime.
  - The room's bars come only from `fixtures/bars/`.
  - The canon hand (`log-trade.js`, `close-trade.js`) is vendored into `plutus-backtest.hand/`.
  - The room's static roots are only its own.
  - The station's data root defaults to the fork itself.
  - The room DB and the rail dir are the instance's (`ROOM_DB_UNAVAILABLE` / `VIL_DIR_UNAVAILABLE` when not given).
  - No `/home/...`, `PLUTUS/LIVE` or `~/.plutus-dashboard` path remains in the runtime.
  - Unreachable `electron/server/db.js`, `index.html` and `mt5-tab.js` were removed.
  - The Backtest tab opens on a ready replay session (`tabs/backtest.js`).
