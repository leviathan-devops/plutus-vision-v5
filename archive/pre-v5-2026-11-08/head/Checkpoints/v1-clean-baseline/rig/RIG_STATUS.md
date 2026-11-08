# P4 RIG STATUS — TradingView runtime seat (2026-10-01)

## What was built
- `rig/tv_rig.py` — headed-Chrome Playwright rig: `save_state` / `paste` / `shot`
- Chrome launches and reaches TradingView (STATE_SAVED ok, 16s wall).

## What the session probe found
- `.tv-state.json`: 9 cookies, ALL trackers/analytics (`_ga`, `_sp_*`, consent).
- ZERO session/auth cookies (`sessionid`, `tv_session`, auth tokens: absent).
- Verdict: the operator is NOT logged into TradingView in this Chrome profile,
  or the login lives in a different profile/store.

## Why this blocks P4
- The Pine editor save + chart render require an authenticated TradingView
  session. An anonymous page cannot save an indicator or hold a layout.
- Continuing to drive the anonymous page (screenshots of a login wall,
  pasting into a read-only editor) would be theater, not runtime evidence.

## The unblock (operator-owned, one action)
Log into TradingView ONCE in the headed Chrome the rig opens
(`python3 rig/tv_rig.py save_state`, sign in in the visible window),
then re-run `save_state`. When `.tv-state.json` carries session cookies,
P4 proceeds: paste merged file -> save (error count) -> EURUSD H4 render
(4/4) -> parity screenshots -> runtime ledger.

## Standing artifacts (all green, independent of the rig)
- lexcheck PASS (0 findings) · probe 10/10 PASS · single decl · attribution ×5
- behavior diff 10/10 shapes present · manifest 4 UNFILLED (honest)
- round-zero checkpoint sealed · merged SHA 4b3ee0ca68d86ca7
