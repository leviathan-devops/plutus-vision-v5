job: fence
seat: plutus-vision-lqz
mission: >-
  Three liquidity indicators (lqz-luxalgo, lqz-plutus, plutus-vision-v1) render full-width
  horizontal green/red liquidity zones matching WINNING_TRADE_LIBARARY, judged by the operator
  in a panel grid on identical bars.
steps:
  - id: step-0-compile
    run: >-
      curl -s -X POST http://127.0.0.1:9741/run -H 'Content-Type: application/json'
      -d "{\"script\":\"$(cat lqz-plutus.pine)\",\"pair\":\"EUR/USD\",\"timeframe\":\"1H\",\"limit\":1603}"
    expect: response success true AND data.title == the deliverable's own title
  - id: step-1-parity
    run: python3 scripts/compare.py
    expect: SMC 195/195 AND POOLS 25/25 AND 0 unexplained drawing deltas
  - id: step-2-served-artifact
    run: bash scripts/verify_served_pine.sh
    expect: stdout ends SERVED_PINE_OK (source == renderer == wire sha256)
  - id: step-3-visual
    run: bash launch-pine-ide lqz-plutus.pine EUR/USD 1H && bash launch-pine-ide --shot /tmp/panel.png
    expect: >-
      the capture opens and every emitted zone spans the full plot width (>=99% row coverage)
      AND no zone sits off the price action
  - id: step-4-panel-judge
    run: bun scripts/lqz-panel.mjs 1H
    expect: >-
      a 4-panel grid [library reference | D1 luxalgo | D2 plutus | D3 vision] on identical bars
      is written, opened, and the operator records APPROVED
