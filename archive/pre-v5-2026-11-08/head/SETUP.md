# SETUP — PLUTUS VISION Pine IDE

The Pine IDE dashboard: a native desktop shell (GTK+WebKit2) hosting a chart + a Pine
editor + a Pine runner (pine-station, PineTS) + an agent face. This branch (`pine-ide`)
carries the full, runnable code.

## Requirements

| dep | version measured on the reference host |
|---|---|
| node | v24.x |
| npm | 10.x |
| python3 | 3.12.x |
| a Linux desktop (X11 or Wayland) | the shell renders on the user's real display |

## Pull + set up (4 steps)

```bash
# 1. clone this branch
git clone -b pine-ide https://github.com/leviathan-devops/plutus-vision.git
cd plutus-vision

# 2. install the Pine runner's deps (pine-station = the PineTS executor, :9741)
cd pine-ide/pine-station && npm install && cd ../..

# 3. install the desktop launcher (symlinks ~/.local/bin/pine-ide + the .desktop entry)
bash desktop/install.sh

# 4. launch
pine-ide            # spawns the backend servers + the desktop shell
pine-ide --status   # verify: backend ports + display route + shell pid
```

## What runs

| port | process | role |
|---|---|---|
| 9741 | `pine-ide/pine-station/server.mjs` | the Pine runner (POST /run) |
| 9754 | `pine-ide/pine-ide/vil-rail.mjs` | the VIL rail |
| 9851 | `scripts/pv-server.py` | the renderer + the workspace proxy |

`desktop/pine-ide` starts/reuses all three and launches the shell on the user's display
(`detect_route`: wayland-0, else X11 :0/:1/:2). It never uses a nested display.

## The render

The IDE renders the study **"Plutus Vision v1"** = the sealed V1 baseline + the E1
institutional-pressure zones + the E2 predicted path. The source it renders comes from the
**agent-workspace store** (the dashboard on `:9430` owns it; the renderer proxies it at
`/api/v1/workspaces`).

## Verify it works

```bash
pine-ide --status
# expect:  http://127.0.0.1:9851/pine.html  200
#          http://127.0.0.1:9741/catalog    200
#          route: wayland (or x11:N)
#          desktop shell: pid … python3 …

# run the indicator directly through the station
curl -s -X POST http://127.0.0.1:9741/run \
  -H 'content-type: application/json' \
  -d '{"script":"'"$(cat pine-ide/ide/renderer/plutus-vision-v2.pine)"'","pair":"DXY","timeframe":"1H"}' \
  | head -c 400
```

## Layout

```
pine-ide/pine-ide/        the kernel (pine-ide.mjs) + the face + vision + the rail + persist
pine-ide/pine-station/    the Pine runner (:9741, PineTS)
pine-ide/ide/renderer/    plutus-vision-v1.pine (SEALED) · plutus-vision-v2.pine (the render)
pine-ide/charts/          the Vela chart workbench bundle
pine-ide/chart/           the chart app
desktop/                  the launcher + the WebKit shell + the .desktop + install.sh
scripts/                  pv-server.py (the renderer :9851) + the E1/E2 pipeline
JEV_GATE/                 the success gate (run_gate.sh)
```

## The sealed baseline (do not edit)

`pine-ide/ide/renderer/plutus-vision-v1.pine`
sha256 `0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1` — HARD STOP H1 on drift.

## The approved render

`pine-ide/ide/renderer/plutus-vision-v2.pine`
sha256 `282517ac622769bdb34296ebee94fa8079da28dbab30bff1c27ae2146a74f011`.

## Notes

- `pine-ide/pine-station/node_modules` is NOT committed — step 2 installs it.
- The Tauri shell (`desktop/tauri/`) is optional; `desktop/install.sh --build` builds it
  (needs cargo). Without it, the launcher uses the GTK+WebKit2 shell (`pine-ide-webview.py`).
- The full context handover is on the `handover` branch (`handovers/`).
