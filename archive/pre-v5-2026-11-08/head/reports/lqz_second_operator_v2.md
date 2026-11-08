# THE SECOND OPERATOR — CHECK v2 (against the UPDATED docs)

## THE PROTOCOL
A subagent (`SecondOperator2`, **8m58s**) given EXACTLY two documents — the runtime ledger and
the receipt — told to bring the rig up, compile a deliverable, capture a frame, open it, and
report every point where the docs were insufficient. **Mid-run I steered it to the newly
extracted `OPERATING_MANUAL.md`**, which I had written AFTER dispatching it (the ledger had
grown to 970 lines and buried the operating guidance at line 158).

**Purpose: verify the DOCS, not the agent.** Its verdict was **INSUFFICIENT**, and it was right.

## WHAT IT FOUND — one defect I introduced, and it traced it to the line

### THE DEFECT: D2's title was `LQZ`, not `LQZ Plutus — operator candle liquidity`
It compiled all three deliverables and tabulated the titles against each file's
`indicator()` declaration. D1 and D3 matched; **D2 did not.** It then found the mechanism:

> `scripts/lqz_assemble.py:49` defaults `--title "LQZ"` — so regenerating D2 with `--candles`
> and no `--title` **silently dropped its descriptive title.**

**I did exactly that earlier in this session, fixing the NA guard.** The consequences it traced,
all real:
1. **`scripts/lqz-panel.mjs` asserts `expect = "LQZ Plutus"` → THE GRID COMMAND ABORTED:**
   ```
   D1 "LQZ LuxAlgo" in 1 run(s) ok=true …
   PANEL_GRID_FAIL: D2 — {"ok":false,"error":"editor never held LQZ Plutus"}
   EXIT=1
   ```
2. **`scripts/lqz_ship.test.ts:103` expects the long title → THE SHIP TEST WAS BROKEN.**
3. **The ledger's H1 table asserted the old title → STALE, and it would make an operator
   following the manual declare a GOOD compile FAILED.** It said it hit exactly this.

**THE FIX — and it was verified end to end:**
```
python3 scripts/lqz_assemble.py lqz-plutus.pine --candles --title "LQZ Plutus — operator candle liquidity"
→ indicator("LQZ Plutus — operator candle liquidity", …)   NA guard preserved (1)   SERVED_PINE_OK

bun scripts/lqz-panel.mjs 1H
  D1 "LQZ LuxAlgo" in 1 run(s) · D2 "LQZ Plutus — operator candle liquidity" in 2 run(s)
  · D3 "Plutus Vision v1" in 6 run(s) · panels distinct · PANEL_GRID_OK
```

## ITS SIX DOC GAPS
| # | gap | severity | state |
|---|---|---|---|
| 1 | **the documented capture command cannot complete** (the D2 title) | **CRITICAL** | **FIXED + VERIFIED** |
| 2 | the manual says "ASSERT THE TITLE" and supplies **no expected-title table** | high | **CLOSED** — the table is in the manual, with the regenerate-never-update-the-consumer rule |
| 3 | **the capture remedy is contradicted by its own ledger** — the reload fixes the compositor and breaks the editor; the only unblock is a restart a read-only operator may not perform | high | **RECORDED, OPEN** — the contradiction is real |
| 4 | `lqz-panel.mjs` writes a hard-coded `reports/panel-grid-<TF>.png` **into the repo**, overwriting a RECEIPT-cited artifact | medium | **CLOSED** — flagged in the manual |
| 5 | **the docs quote counts from two instruments without labelling them** — the station (`limit 1603`) gives D1 481/182, D3 205/97; the IDE's `lastVision` (400 bars) gives 117/36 and 79/21 | medium | **CLOSED** — both sets labelled in the manual |
| 6 | **two chart windows exist on :3** — `Pine IDE` (14680067) and `PLUTUS-CHART` (4194307, a DIFFERENT study) | minor | **CLOSED** — warned in the manual |

## WHAT IT GOT RIGHT THAT MATTERS
- **It followed the manual's rig check** and reported `GET /` did NOT hang — and used the
  work-route probe as the authority, exactly as the manual prescribes.
- **It refuted its own staleness suspicion.** It noticed `sourceChars 68483 ≠ 69520 bytes` and
  suspected a stale frame — then checked the sha (`82da437af969a315` = the shipped D3) and
  **withdrew the suspicion.** That is the discipline the project asks for, unprompted.
- **It left the repo untouched** (`git status --porcelain` = 0) and reported the one runtime
  state change (the IDE now holds D2) rather than tidying it away.

## THE HONEST REMAINDER
**Gap 3 is the real one.** The manual prescribes "reload before every capture" and the same
document records that the reload resets the editor — six approaches measured, none holding. **A
read-only operator cannot unblock it**, because the only remedy is a restart. The fix is a load
path that survives the re-mount (the shell's `P.tabs` / `importWorkspace`), which remains the
named next move.

**AND THE META-FINDING: a zero-context operator found a defect the author introduced and did not
notice — in the author's own tooling, from the artifact's title alone.** That is the check
paying for itself a second time.
