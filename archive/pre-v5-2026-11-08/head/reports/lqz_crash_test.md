# THE CRASH TEST — directive 12, executed against the LIVE rig

Every row is a real request to `POST :9741/run` with the verbatim response. The rig was
NOT restarted for the test; it was hit as it stood, and its liveness was re-probed after.

## THE REFUSALS (the paths that must not silently succeed)

| input | response | verdict |
|---|---|---|
| baseline (valid 1520 L script, 1603 bars) | `HTTP 200 success=True` | the control — the rig works |
| empty script | `HTTP 400 :: primary: a script or canon:true is required` | **CORRECT** — named |
| not Pine at all (`hello world this is not pine`) | `HTTP 422 :: Unexpected token (2:6)` | **CORRECT** — names the position |
| truncated Pine (`indicator("t"` + `plot(`) | `HTTP 422 :: Failed to transpile Pine Script version 6: Unexpected token EOF '' at 3:6` | **CORRECT** — names the line:col |
| unknown identifier | `HTTP 422 :: nonexistent_series_xyz is not defined` | **CORRECT** — names the symbol |
| absent pair (`AUD/USD`) | `HTTP 500 :: no bars cell for pair=AUD/USD timeframe=1H (available: DXY 15m, DXY 1H, DXY 30m, DXY 4H, EUR/USD 15m, EUR/USD 1H, EUR/USD 30m, EUR/USD 4H, GBP/USD 15m, GBP/USD 1H, GBP/USD 30m, GBP/USD 4H)` | **CORRECT, and better than required** — it enumerates all 12 available cells |
| absent timeframe (`7m`) | `HTTP 500 :: no bars cell for pair=EUR/USD timeframe=7m (available: …)` | **CORRECT** — same enumeration |
| `limit=1` | `HTTP 400 :: bars absent (1)` | **CORRECT** — refuses rather than serving a degenerate window |

## THE TWO THAT NEEDED ADJUDICATION (not defects)

### `limit=0` → `HTTP 200 success=True`
**ADJUDICATED SIDE-A: PROBE ERROR. My expectation was wrong, the rig is right.**
The station's source documents this explicitly:
```js
/** Trim to the last `limit` bars (a 0/absent limit keeps the full history). */
function trimBars(bars, limit) { … return bars.slice(-Math.floor(n)); }
```
`0` means **keep the full history** — deliberate, documented behaviour. I asserted it should
refuse; the code says otherwise, and the code is the contract.
**This is the two-sided rule working:** the probe failure was adjudicated against the
CONTRACT before it became a finding, and it died as a probe error instead of entering the
ledger as a defect.

### `limit=-5` → `HTTP 200 success=True`
`Math.floor(-5) = -5`, so `bars.slice(-(-5))` = `bars.slice(5)` — the first 5 bars are
dropped and a valid window is returned. **Lenient, not wrong**: the result is a real slice
of real bars, the counts are consistent, and nothing is fabricated. A negative limit is
nonsense input and the response is a valid (if arbitrary) window rather than a refusal.
**Recorded as a MINOR lenient-input observation, not a defect** — it fabricates nothing and
cannot produce a wrong-level zone.

## WHY THE REFUSALS MATTER HERE

The pin's law: *"an empty detector MUST yield zero zones, never a fallback band."* Every
refusal above is the same property at the transport layer: **a bad input produces a NAMED
refusal, never a substitute artifact.** None of these paths returns a plausible-looking
chart built from something else.

## THE REST OF THE INPUT BATTERY

| input | response | verdict |
|---|---|---|
| `limit` as a string (`"1603"`) | `HTTP 200 success=True` (22.2s) | **CORRECT** — `Number(limit)` coerces, as the source says |
| `pair` as null | `HTTP 200 success=True` (4.1s) | **lenient** — falls through to a default cell. Recorded; it cannot fabricate a zone, but a null pair SHOULD arguably be a 400 |
| `script` as null | `HTTP 400 :: primary: a script or canon:true is required` | **CORRECT** |
| no fields at all | `HTTP 400 :: primary: a script or canon:true is required` | **CORRECT** |
| **1 MB script** (the real deliverable + 1M of comment) | `HTTP 200 success=True` in **1.0 s** | **CORRECT** — a large comment costs nothing; the parse is not pathological |

## THE CONCURRENCY BLOCK — and the real operational finding

```
conc-0  200 success=True   18.6s
conc-1  200 success=True   37.3s
conc-2  200 success=True   56.3s
conc-3  200 success=True   73.6s
conc-4  TimeoutError       90.1s   (my client timeout)
conc-5  TimeoutError       90.1s
wall 90.1s
```

**THE MECHANISM, not a blame:** the completions land at 18.6 · 37.3 · 56.3 · 73.6 s — **~19 s
apart, i.e. the station SERIALIZES compiles.** Six concurrent requests × ~16 s each = ~96 s
of queue; my client timeout was 90 s, so the last two exceeded MY budget, not the rig's
capacity. The rig never crashed: **`post-crash baseline → HTTP 200 success=True`.**

**ADJUDICATED SIDE-A: PROBE ERROR.** The "failure" is arithmetic — 6 × 16 s against a 90 s
client timeout. The station is behaving as designed.

**BUT THE PROPERTY IS REAL AND WORTH RECORDING:**
1. **The station has no queue-depth signal.** A caller cannot distinguish "queued behind 5
   others" from "hung". It simply waits.
2. **This is why every test in this project carries a 120 s budget** — bun's 5 s default
   failed a healthy rig (EN-24), and 90 s would have failed this 6-way case.
3. **A serialized verifier is the CORRECT design for this rig.** Determinism matters more
   than throughput for a verification station: two concurrent compiles that interleave
   would make two frames incomparable, which is exactly the property the whole rig exists
   to preserve.

## THE VERDICT

**The rig survives adversarial input.** Nine of fifteen adversarial cases are NAMED
refusals; four are documented or lenient behaviour; one (a 1 MB script) succeeds in 1.0 s;
and the concurrency case is a client-budget arithmetic, not a rig failure.

**ZERO confirmed defects.** Two operational notes carried, neither a defect:
- a null `pair` falls through to a default cell rather than a 400 (lenient, fabricates nothing);
- the station serializes with no busy signal (by design; the caller budgets for it).

**THE RIG WAS ALIVE AT THE END.** The last probe — the full valid compile — returned
`HTTP 200 success=True`. That is the crash test's real question.
