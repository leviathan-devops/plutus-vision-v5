# pine-ide-fork — THE STANDALONE PINE SHELL (forked from the Plutus dashboard)

WHY: the dashboard's Pine IDE is purpose-built for exactly this job (compile a Pine
file against real bars, render the geometry, capture the frame), but it is owned by
the Electron dashboard, which is currently DEAD (`plutus-dashboard.service` inactive).
This fork is the same machinery, standalone: no Electron, no dashboard, no X display.

  pine-station/   the compile+run engine (PineTS 0.10.0) on :9441
  pine-ide/      the browser-side kernel (editor, vision render, microtabs, gate)
  charts/        the workbench chart page + the PineTS adapter
  chart/         the single-chart page
  tv-feed/       the data feed

  START:  node pine-station/server.mjs
  PROBE:  ./pv_probe.mjs <file.pine>
