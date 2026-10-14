# COMPACTION_SURVIVAL — PLUTUS VISION
**Overwritten 2026-10-14.** If your context was compacted, read THIS file first, then
`CURRENT_STATE.md`, then `BUILD_STATE.md`. Doctrine below is verbatim and is never rewritten.

## STATE AT A GLANCE
| field | value |
|---|---|
| what this is | the Pine IDE + backtest shell around the Vision indicator |
| branch / HEAD | `step_agent` / `c058e3e` |
| served v2 sha256 | `125c94f86e6a2f1d3009a75c778e02ad16c48e4f3772e8d0d8d95c50af162400` |
| v1 seal (HARD STOP H1) | `0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1` |
| workbench bundle | `7ff93dcf5b2c9e77d0fbba310a7e9c2c04073e6521c233c664b140d888a61aec` |
| ship-docs gate | S1-S7 PASSED |
| code-audit gate | **BLOCKED** (8/8 `403 FreeTierError`, 1.986s — F-141) |
| entry counters | EN-137 · F-141 · V-44 · P-11 · T-30 |
| open work | A1 audit · A2 tv-feed · A3 no-cache · A4 port bind · A5 date sweep |

## THE FIVE THINGS THAT WILL SURPRISE YOU
1. **The layout is a column, not a row.** `.pine-shell` = toolbar over `.pine-cols`
   (`[.pine-left | .pine-split | .pine-right]`). The default is `data-hide-foot="1"`, so the
   chart is full height BY DESIGN. If you see the verdict block under the chart, someone set
   `foot=0` in `plutus.pine.layout` — that is a user choice, not a bug.
2. **The browser may be running OLD JavaScript.** `scripts/pv-server.py` sends no
   `Cache-Control`, so Chrome heuristically caches. Before debugging any renderer logic, compare
   the SERVED bytes against the EXECUTED function (`mount.toString().includes(...)` through CDP).
   This cost a full cycle once (EN-134).
3. **The IDE's editor buffer has two sources of truth.** With the `:9430` face backend down it
   restores from localStorage (`plutus.pine.editorSource`), NOT from disk. Editing a renderer
   file does not update the buffer. Assert `buffer-sha == file-sha` before binding a screenshot.
4. **`tv-feed` is dead.** `:9448` cannot start (`ERR_MODULE_NOT_FOUND`). Every `tv:` market is
   therefore unreachable; only `fixture:` works, and DXY is the fixture's market.
5. **The port is NOT locked.** The guardian is disarmed after killing a bystander, because
   `/proc/<pid>/fd` is unreadable in the ORCA scope and no holder-identification can be precise
   here. Do not rebuild the killer; the fix is binding the port.

## THE OPERATING LAWS (do not rediscover these)
- **The collapse mechanism is PORTED, not invented.** `pine-ide/ide/renderer/tabs/backtest.js:1084-1132`
  owns the original (`data-hide-*`, `aria-pressed`=shown, the rAF+120ms double `chart.resize()`).
  The pine shell mirrors it. Change one, change both.
- **A flex change does not always fire the chart's observer.** Every layout mutation must drive
  `chart.resize()` explicitly, and dispatching a window `resize` event is the cheap fallback.
- **A throw inside a render chain is a component outage**, never a bad cell — guard the format
  site (`isFinite` before `toISOString`), never ask the caller to pre-validate.
- **A silent `if (!x) return;` on a wiring path converts a findable bug into an unfindable one.**
  Log the miss with the object that failed to resolve.
- **The only sound port lock is binding.** Policing requires identifying the holder, and this
  host denies that.
- **A verdict printed by a short audit run is void in BOTH directions.** Accept only when
  `files_reviewed.length >= 1 AND duration_seconds > 10`, read from the session jsonl.

## THE VERIFICATION LOOP (the only one that has been proven here)
```
edit the source
  → node --check <the js>
  → reload the page on display :5 (the agent's own; never another display)
  → read the LIVE DOM through CDP on --remote-debugging-port=9444
  → open the window-scoped capture (agent-display.sh shot 4194307) and LOOK at it
  → record the observation in TESTING_LOG with the token from the tool result
```
A DOM read proves the attributes; the pixels prove the chart. You need both, and a claim without
either is unverified.

## THE DISCIPLINE (what this project counts as evidence)
- A SHA beats a recorded SHA beats memory. Re-measure; the manifest has been stale before (V-44).
- The ship docs own EVIDENCE; the canon docs own STATE. Neither rewrites the other.
- An operator-caught theatrical act is logged in THEATRICALITY_LOG with the split kept visible
  (running total OPERATOR-CAUGHT 11 · SELF-CORRECTED 5).
- Nothing is reported delivered while its mechanism is unproven.

## THE RESTORE POINTS
- vision tree: commit `caef1f9` restores the V2 ship-approved checkpoint
  (`e1-e2-v2-pending-ship-approval-2026-10-06`, v2 `87628e54` + v1 seal `0d20e831`).
- dashboard: tag `agents-overhaul-2026-10-05` (`7ce1d2a`) in `leviathan-devops/PLUTUS-DASHBOARD`.
- checkpoints on disk: `Checkpoints/` — `v1-ship-approved-working-baseline`,
  `v2-working-baseline-2026-10-05`, `e1-e2-v2-pending-ship-approval-2026-10-06`,
  `indicator-engine1-e2-fixed-2026-10-08`.

## THE THING TO REMEMBER
The indicator renders to a chart that is looked at by a human. Every mechanism in this project —
the fixture, the gate, the capture, the verdict ledger — exists so that a look at the pixels is
worth something. If a change makes the pixels less trustworthy, it does not matter how green the
gates are.

## THE FILE MAP (where each behaviour lives, with anchors)
| behaviour | file | anchor |
|---|---|---|
| the two-tab shell + switcher | `pine-ide/ide/renderer/pine.html` | the inline `PVActivate` IIFE |
| the fragment load + kernel import | `pine-ide/ide/renderer/tabs/pineshell.js` | `loadFragment()`, `importKernel()` |
| the layout wiring | `pine-ide/ide/renderer/tabs/pineshell.js` | `:157` call site, `:213` definition |
| the layout rules | `pine-ide/ide/renderer/tabs/pineshell.css` | `.pine-shell`, `.pine-cols`, `.pine-split`, the `[data-hide-*]` block |
| the collapse original | `pine-ide/ide/renderer/tabs/backtest.js` | `:1084-1132` |
| the date guard | `pine-ide/ide/renderer/tabs/backtest.js` | `:683-690` |
| the room's control addressing | `pine-ide/ide/renderer/tabs/backtest.js` | `:520` `q(k)` → `[data-bt="<k>"]` |
| the replay commands | `pine-ide/ide/renderer/tabs/backtest.js` | `:1165` `/step`, `:1170` `/jump` |
| the kernel | `pine-ide/pine-ide/pine-ide.mjs` | `:203-204` mountWorkbench, `:821` the handle |
| the feed rule | `pine-ide/pine-ide/pine-ide.mjs` | `:96` DXY→fixture |
| the persisted market | `pine-ide/pine-ide/pine-ide.mjs` | `:208-209` |
| the persistence keys | `pine-ide/pine-ide/pine-persist.mjs` | `:36-41` `PINE_KEYS` |
| the market validator | `pine-ide/pine-ide/pine-persist.mjs` | `:45-50` `MARKET_RE` |
| the static server | `scripts/pv-server.py` | the loop guards + (missing) `Cache-Control` |
| the dead feed | `pine-ide/tv-feed/server.mjs` | `:26` `PORT … || 9448` |

## THE PORT / PROCESS MAP
| port | process | state |
|---|---|---|
| `:9851` | `scripts/pv-server.py` (the main renderer root + the face proxy) | up |
| `:9863` | `scripts/pv-server.py` (the per-instance renderer root) | up |
| `:9741` | `pine-station` — the Pine compiler | up |
| `:9754` | `vil-rail` — the VIL ledger + PNG writer | up |
| `:9443` | the backtest room server (replay state) | up |
| `:9448` | `pine-ide/tv-feed/server.mjs` | **DEAD — no node_modules** |
| `:9444` | the agent display's Chrome remote-debugging port | up while the display is |

## THE LOCALSTORAGE KEYS (what the IDE restores from)
```
plutus.pine.market        {"provider":"tv|fixture","ticker":…,"timeframe":…}   pine-persist.mjs:36
plutus.pine.editorSource  the active micro-tab's Pine source                    pine-persist.mjs:36
plutus.pine.activeMicrotab the active tab id                                    pine-persist.mjs:36
plutus.pine.tabs          [{id,name,lane,ref,source}] — sanitised, ≤32          pine-persist.mjs:36
plutus.pine.layout        {left,face,foot,w} — the LAYOUT (added 2026-10-14)    pineshell.js
```
`MARKET_RE` (`pine-persist.mjs:45`) rejects any provider other than `tv|fixture`, so a corrupt
market is dropped rather than restored.

## THE FAILURE MODES THAT ARE OPEN RIGHT NOW
| symptom | mechanism | where it is recorded |
|---|---|---|
| `FEED_UNREACHABLE: :9448/bars` | tv-feed has no deps | A2 / EN-135 |
| an edit "does nothing" on reload | no `Cache-Control` → heuristic cache | A3 / EN-134 |
| a foreign process binds a port | no lock; the killer is disarmed | A4 / F-140 |
| `RangeError` on the room | fixed at one site; siblings unswept | A5 / EN-133 |
| no independent review | `403 FreeTierError`, 8/8 failures | A1 / F-141 |

## THE FRESH-SESSION ENTRY SEQUENCE
1. Read this file, then `CURRENT_STATE.md`, then `BUILD_STATE.md`'s anchor ledger.
2. Re-measure the two indicator SHAs before trusting any recorded value.
3. Check the four servers; the UI names each gap, do not assume.
4. Confirm the browser is running the CURRENT bytes before debugging renderer logic.
5. Read `DEBUG_LOG.md` EN-133..137 and `FAILURE_LOG.md` F-139..141 — they contain the
   mechanisms, not just the symptoms.
6. Only then touch code, and only at the anchors above.

## THE DOCTRINE (verbatim, never rewritten by this file)
- Evidence over prose. A claim without a tool result behind it is not a finding.
- The artifact is what runs: a SHA, a DOM read, an opened pixel, an HTTP code.
- Loud fail or clear pass — never a silent fallback producing a different artifact.
- The scope is the operator's; a blocked goal names the block, it never shrinks.
- Report what actually happened, and state a blocked check as blocked.

## THE RESTORE / START RECIPE (the four servers + the browser)
```bash
cd /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION
F=$PWD/fixtures/bars/2026-07-06.json
env PV_FIXTURE=$F setsid -f python3 scripts/pv-server.py 9851 $PWD/pine-ide/ide/renderer
env PV_FIXTURE=$F setsid -f python3 scripts/pv-server.py 9863 /tmp/agent-displays/<instance>/renderer
setsid -f node pine-ide/pine-station/server.mjs      # :9741 — RUN/GATE
setsid -f node pine-ide/vil-rail.mjs                 # :9754 — CAPTURE + the ledger
# the browser — its own profile AND a debugging port, or you will be debugging blind
agent-display.sh app <chrome> --ozone-platform=x11 \
  --user-data-dir=/tmp/agent-displays/<instance>/cp2 --remote-debugging-port=9444 \
  http://127.0.0.1:9863/pine.html
```
The market must be `fixture:DXY` while tv-feed is dead — set
`localStorage["plutus.pine.market"]='{"provider":"fixture","ticker":"DXY","timeframe":"60"}'`
or the chart reports `FEED_UNREACHABLE`.

## THE GATES (what will judge your work)
| gate | what it checks | where it lives |
|---|---|---|
| S1-S7 | the six ship docs current, the dist SHA matching disk, unique counters, the audit artifact referenced, the degraded run BLOCKED, the theatricality split | the ship-docs-update skill |
| U1-U4 | every canon doc ≥200 lines with ≥3 `file:line` refs, the read-first SHA match, the logs freshly appended, the manifest timestamp | the canon-doc-update skill |
| the audit | an independent review, accepted ONLY on `files_reviewed>=1 AND duration>10` | `code-review action=scan` |

## THE FRESH-SESSION CHECKLIST (six steps, in order)
1. `sha256sum` the two indicator files; compare against the GLANCE table above.
2. Confirm the four servers; the UI names each gap (`rail —`, `station DOWN`, `FEED_UNREACHABLE`).
3. Confirm the browser is running CURRENT bytes — `mount.toString().includes(...)` via CDP.
4. Read EN-133..137 and F-139..141 for the mechanisms, not just the symptoms.
5. Pick one ACTIVE row from `TASK_QUEUE.md`; run `ripwire verb=callers` on anything you edit.
6. Verify by opening the capture and looking — a DOM read alone is not a render.

## WHAT COUNTS AS FINISHED
A task is finished when its done-when was OBSERVED in a tool result: a DOM JSON, an opened
pixel, an HTTP code, a sha256. It is not finished because it was attempted, because the code
looks right, or because a component reported success. If you cannot observe it, it is BLOCKED
and the blocker is named — never "pending", never "should work".

## THE EVIDENCE INDEX (what proves which claim — read before repeating any of them)
| claim | the artifact that proves it |
|---|---|
| the layout applied | the CDP DOM read `{"hide":"left=0 face=0 foot=1","footDisplay":"none / none","editorPct":"34%","toggles":4,"splitter":true}` |
| the chart renders | an OPENED capture showing candles + the EMA Ribbon, plus `508 bars` in the status slot |
| the room mounts | pane `display:flex` and the TradeZella chrome text, with no `RangeError` in the stream |
| the replay completes | `{"bar":"bar 941/941","visible":"visible 941 / 941"}` |
| the code is this code | the five sha16 values in `BUILD_STATE.md`'s changed-file table |
| the audit did not pass | `421ace33-…jsonl` → `llm_failures: 8`, `duration_seconds: 1.986` |
| the port is unlocked | `systemctl --user is-active pv-port-guard.service` → `inactive` |
| the docs are current | the S1-S7 gate output, re-runnable |

## THE DISCIPLINE, IN ONE PARAGRAPH
Every number in this project was re-measured rather than inherited — the manifest's own
`Served SHA16` had gone stale and was caught that way (V-44). Every verdict is read from the
artifact the signal claims to describe, never from the signal: the session jsonl rather than the
gate line, the served bytes rather than the executed function, the opened pixel rather than the
count. When a mechanism could not be made precise on this host, it was disarmed and reported
undelivered rather than shipped as a lock (F-140). That is the whole discipline.

## ANCHOR INDEX (plain text — the commit gate measures anchors only in ts/md/json/sh/yml)

scripts/pv-port-guard.sh:37 — the SQUAT_RE, narrowed to the interpreter's argv[1] after it killed a bystander.
scripts/pv-port-guard.sh:27 — the PROTECT list: the five ports the (now disarmed) guardian watched.
context_management/CURRENT_STATE.md:54 — THE LAYOUT AS IT STANDS, the section describing the shipped layout.
context_management/BUILD_STATE.md:186 — THE ANCHOR LEDGER, every change at its exact site.
context_management/NEXT_STEPS.md:18 — W-N2, the tv-feed work item that unblocks every non-fixture market.
context_management/TASK_QUEUE.md:66 — A2, start tv-feed, with its done-when.
context_management/COMPACTION_SURVIVAL.md:84 — THE FILE MAP, where each behaviour lives.
context_management/POST-COMPACTION_PROMPT.md:77 — THE TASK CONTRACTS, self-contained for a fresh hand.
DEBUG_LOG.md:2942 — EN-133, the unguarded date that killed the BACKTEST mount.
FAILURE_LOG.md:2341 — F-141, the code-audit lane BLOCKED with its retry condition.
TESTING_LOG.md:1960 — the code-audit gate plan entry, Status BLOCKED.
SHIP_DOCS_MANIFEST.md:3 — the Dist artifact row naming the served v2 pine.
Every line above was measured this cycle with grep -n; each names a real site in this tree, so a
reviewer can re-run the reference and land on the same line.
