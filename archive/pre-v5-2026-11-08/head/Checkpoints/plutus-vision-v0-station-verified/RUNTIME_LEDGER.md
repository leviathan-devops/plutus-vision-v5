# P4 RUNTIME LEDGER — what RUNNING taught that READING could not

Instance: pine-ide-fork station :9641 (PineTS 0.10.0), EUR/USD 4H fixture, limit 300.
Stance: driver of the station runtime, first-person numbered ops.

## Ops
1. Fired merged file -> 422 indent (orphan decl tails). EXPECTED clean-ish, GOT error.
   MECHANISM: strip_decl() removed the indicator() line but left 6 continuation lines.
   FIX: comment the full tail block. RETEST: next fire advanced past it.
2. Fired -> 422 indent (swp_drops += 1 at 12sp in 8sp block). FIX: re-indent.
3. Fired -> 422 PINE_RUNTIME_ERROR get_left. Bisected per-section: SWEEPS the trigger.
   Probed loop shapes p1-p7: ALL PASS in isolation. Root cause was NOT the loop.
4. Differential method removal: removing swp_isSet flips FAIL->OK. Traced to
   type/parameter shadow (float swp_piv vs type swp_piv). Renamed params. Still failed.
5. Bisected to the unshift sites: swp_get.br(...) UDT-method returns poison the array
   in PineTS. Inlined all 4 sites with direction literals bound per site. FIXED.
6. POOLS silent 0/0/0: traced to bsl_aZZ.in_out stale call (method renamed to
   bsl_roll, 2 call sites missed). Fixed -> POOLS draws 1/0/2.
7. Full file RUN_OK: boxes=112 labels=22 lines=45, 0 warnings. 4/4 subsystems draw.

## What RUNNING taught
- PineTS 0.10.0 does not tolerate UDT-returning methods invoked on array elements;
  TradingView does. The merge must carry BOTH shapes: method def retained, call
  sites inlined. (L-5 note: this is an engine-compat shim, not a logic change.)
- for-in over UDT arrays with a field-na seed needs the na-guard; TradingView
  tolerates it, PineTS throws on the seed.
- A rename pass that touches method params can shadow type names; the linter
  (identifier-level) cannot see it — only a runtime fire catches it.
- Bare 3-letter input names (len) and single-letter methods (n/p/l/br) are the
  highest-risk renames; both bit.

## Residual
- TradingView-operator steps (save 0 errors, chart render, eyes parity) still need
  the operator's profile. Station evidence stands in as the mechanical proxy.
- POOLS thinness (1 box vs source 8) is threshold/bar-count dependent, not a defect
  proven — needs the 3000-bar run + eyes.
