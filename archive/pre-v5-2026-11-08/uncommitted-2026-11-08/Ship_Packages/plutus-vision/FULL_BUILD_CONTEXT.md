# FULL BUILD CONTEXT — PLUTUS VISION computer-control cycle (2026-10-26)

> **THIN-SESSION NOTE (honest, per the ship-package skill):** this doc is 449 lines, below the 2000-line
> floor. The material available for it this cycle was a single build session, and it was NOT
> inflated with whitespace or repetition. The gap is the session's size, not a suppressed record:
> the full evidence lives in the repo's own DEBUG_LOG.md, FAILURE_LOG.md and THEATRICALITY_LOG.md,
> which are copied into this package unmodified.

**Read this first if you are a fresh agent.** It states what exists, where it lives, how it is proven,

and what it cannot do. Nothing here is a plan; every claim has a command behind it.

## 1 · PROJECT IDENTITY

- The project: PLUTUS VISION, a self-hosted Pine IDE (renderer + station + rail + a chart engine).

- The tools built this cycle: `computer` and `pinebox` — the agent's own Linux computer and its IDE app layer.

- The operator's requirement, verbatim: a headed window on their screen they can click into, which must

  never take the primary focus; and a way to open the IDE, run a script, LOOK at the result and know

  whether it worked, without narrating.

## 2 · ARCHITECTURE

```
computer (per instance id N)
  probe -> runtime (native|guest) -> surface adapter (weston-x11 default) -> tmux terminal
  drive: focus / click / type / key / screenshot   (X path, or CDP for a browser window)
  state: the scoped store (7 verbatim files, scope-guarded per instance root)
  govern: c3_check (focus+stack by identity, per 30ms sample) + the refusal ledger
pinebox (app layer, inherits the core whole)
  ports: derived from --id (station 9751+10N, rail 9764+10N, server 9861+10N, cdp 9232+10N)
  stages: preflight -> services -> page -> frame -> load -> verify
  inject: the served page is rewritten for BOTH config globals (dashboardConfig, PlutusPineShellConfig)
```

## 3 · KEY FILES

## FILES CHANGED (git diff --stat ea8c45a..HEAD, measured)
```
 BUILD_REPORT.md                                    |  127 +
 .../BUILD_REPORT.md                                | 2551 +++++++++++++++
 .../CHECKPOINT_MANIFEST.md                         |   97 +
 .../DEBUG_LOG.md                                   | 3455 ++++++++++++++++++++
 .../DESIGN_BLUEPRINT_CU_v2.md                      |  978 ++++++
 .../DESIGN_BLUEPRINT_PINEBOX.md                    |  913 ++++++
 .../FAILURE_LOG.md                                 | 2510 ++++++++++++++
 .../SHIP_DOCS_MANIFEST.md                          |  103 +
 .../SPEC_VIOLATION_LOG.md                          |  379 +++
 .../TESTING_LOG.md                                 | 2224 +++++++++++++
 .../THEATRICALITY_LOG.md                           |  567 ++++
 .../VISUAL_CHECKPOINTS_LOG.md                      |  130 +
 .../artifacts/c3-failing-timeline.txt              |   33 +
 .../artifacts/deploy-verify.txt                    |    1 +
 .../artifacts/gate-chain-computer-use.txt          |   12 +
 .../artifacts/gate-chain-pinebox.txt               |   10 +
 .../artifacts/pinebox-seven-instances.txt          |   71 +
 .../artifacts/release-order-rate.txt               |    4 +
 .../artifacts/tl-fail-1.txt                        |   30 +
 .../artifacts/tl-fail-2.txt                        |   30 +
 .../context_management/BUILD_STATE.md              |  305 ++
 .../context_management/CANON_MANIFEST.md           |  153 +
 .../context_management/CHANGELOG.md                |  422 +++
 .../context_management/COMPACTION_SURVIVAL.md      |  366 +++
 .../context_management/CURRENT_STATE.md            |  260 ++
 .../context_management/DECISION_CHAIN.md           |  462 +++
 .../context_management/ENGINE_BLUEPRINT.md         |  186 ++
 .../context_management/EVIDENCE_STATE.md           |  487 +++
 .../context_management/NEXT_STEPS.md               |  235 ++
 .../context_management/NEXT_STEPS_BLUEPRINT.md     |  116 +
 .../context_management/POST-COMPACTION_PROMPT.md   |  259 ++
 .../context_management/RUNNING_BUILD_LOG.md        | 1535 +++++++++
 .../context_management/RUNNING_DEBUG_LOG.md        | 1232 +++++++
 .../context_management/TASK_QUEUE.md               |  324 ++
 .../dist/MANIFEST.sha256                           |   61 +
 .../dist/hostwin-dc75cce7e31c                      |  Bin 0 -> 17496 bytes
 .../dist/lib/hostwin                               |  Bin 0 -> 17496 bytes
 .../dist/lib/nofocus.so                            |  Bin 0 -> 16200 bytes
 .../dist/nofocus-ccc1f778d2bd.so                   |  Bin 0 -> 16200 bytes
 .../src/computer-use-v2/MANIFEST.sha256            |   61 +
 .../src/computer-use-v2/computer                   |    3 +
 .../src/computer-use-v2/core/actions.json          |   52 +
 .../src/computer-use-v2/core/adapters/existing.sh  |   38 +
 .../src/computer-use-v2/core/adapters/order        |    4 +
 .../computer-use-v2/core/adapters/weston-vnc.sh    |  102 +
 .../computer-use-v2/core/adapters/weston-x11.sh    |  154 +
 .../src/computer-use-v2/core/adapters/xvfb.sh      |   68 +
 .../src/computer-use-v2/core/cdp.mjs               |  143 +
 .../src/computer-use-v2/core/cli.sh                |  223 ++
 .../src/computer-use-v2/core/drive.sh              |  203 ++
 .../src/computer-use-v2/core/govern.sh             |  151 +
 .../src/computer-use-v2/core/guest/boot.sh         |  100 +
 .../computer-use-v2/core/guest/rootfs/assert.sh    |   20 +
 .../computer-use-v2/core/guest/rootfs/manifest.txt |   24 +
 .../src/computer-use-v2/core/lib.sh                |  181 +
 .../src/computer-use-v2/core/probe.sh              |   45 +
 .../src/computer-use-v2/core/runtime.sh            |   16 +
 .../src/computer-use-v2/core/state-cli.ts          |   46 +
 .../src/computer-use-v2/core/state.sh              |   34 +
 .../src/computer-use-v2/core/surface.sh            |   60 +
 .../src/computer-use-v2/core/terminal.sh           |   38 +
 .../src/computer-use-v2/deploy.sh                  |  109 +
 .../src/computer-use-v2/helpers/build.sh           |   39 +
 .../src/computer-use-v2/helpers/hostwin.c          |  188 ++
 .../src/computer-use-v2/helpers/nofocus.c          |   75 +
 .../src/computer-use-v2/index.ts                   |  130 +
 .../src/computer-use-v2/mcp/server.mjs             |  105 +
 .../src/computer-use-v2/scoped/db-path.ts          |   66 +
 .../src/computer-use-v2/scoped/scope-binding.ts    |  208 ++
 .../src/computer-use-v2/scoped/scope-guard.ts      |  102 +
 .../src/computer-use-v2/scoped/scope-resolver.ts   |  176 +
 .../src/computer-use-v2/scoped/scoped-store.ts     |  201 ++
 .../src/computer-use-v2/scoped/session-state.ts    |   78 +
 .../scoped/workspace-scoping.test.ts               |  284 ++
 .../src/computer-use-v2/test/c3-no-raise.sh        |  177 +
 .../src/computer-use-v2/test/cmp-guard.sh          |   24 +
 .../src/computer-use-v2/test/isolation.sh          |   68 +
 .../src/computer-use-v2/test/leak-check.sh         |   37 +
 .../src/computer-use-v2/test/mcp.sh                |   57 +
 .../src/computer-use-v2/test/mutate.sh             |   70 +
 .../src/computer-use-v2/test/replica.sh            |   94 +
 .../src/computer-use-v2/test/run.sh                |   35 +
 .../src/computer-use-v2/test/strings.sh            |   79 +
 .../src/computer-use-v2/test/subshell-exit.sh      |   69 +
 .../src/computer-use-v2/test/v1.sha256             |    1 +
 .../src/pinebox-extension/index.ts                 |  107 +
 .../src/pinebox/actions.json                       |   39 +
 .../src/pinebox/inject.py                          |  113 +
 .../src/pinebox/mcp/server.mjs                     |   92 +
 .../src/pinebox/pinebox                            |  321 ++
 .../src/pinebox/ports.sh                           |   55 +
 .../src/pinebox/stages/load.sh                     |   40 +
 .../src/pinebox/stages/page.sh                     |   62 +
 .../src/pinebox/stages/services.sh                 |   93 +
 .../src/pinebox/test/fixtures/ema-ribbon.pine      |    9 +
 .../src/pinebox/test/inject.sh                     |   62 +
 .../src/pinebox/test/mcp.sh                        |   51 +
 .../src/pinebox/test/multi.sh                      |  126 +
 .../src/pinebox/test/mutate.sh                     |   44 +
 .../src/pinebox/test/run.sh                        |   30 +
 .../src/pinebox/test/strings.sh                    |   54 +
 .../src/plutus-scripts/pv-load.mjs                 |   88 +
 .../src/plutus-scripts/pv-server.py                |  686 ++++
 .../skill-measure-focus-theft-on-replica/SKILL.md  |   56 +
 .../visual/runtime-state.png                       |  Bin 0 -> 145066 bytes
 DEBUG_LOG.md                                       |  424 +++
 FAILURE_LOG.md                                     |  202 ++
 SHIP_DOCS_MANIFEST.md                              |    7 +-
 SPEC_VIOLATION_LOG.md                              |   17 +
 TESTING_LOG.md                                     |  250 ++
 THEATRICALITY_LOG.md                               |  156 +
 VISUAL_CHECKPOINTS_LOG.md                          |   11 +
 context_management/BUILD_STATE.md                  |   47 +
 context_management/CANON_MANIFEST.md               |    4 +-
 context_management/CHANGELOG.md                    |   28 +
 context_management/COMPACTION_SURVIVAL.md          |   47 +
 context_management/CURRENT_STATE.md                |   47 +
 context_management/DECISION_CHAIN.md               |   32 +
 context_management/EVIDENCE_STATE.md               |   47 +
 context_management/NEXT_STEPS.md                   |   26 +
 context_management/POST-COMPACTION_PROMPT.md       |   47 +
 context_management/RUNNING_BUILD_LOG.md            |   44 +
 context_management/RUNNING_DEBUG_LOG.md            |   53 +
 context_management/TASK_QUEUE.md                   |   20 +
 124 files changed, 28499 insertions(+), 4 deletions(-)
```

## THE SOURCE TREES
- scripts/pinebox/actions.json
- scripts/pinebox/inject.py
- scripts/pinebox/mcp/server.mjs
- scripts/pinebox/pinebox
- scripts/pinebox/ports.sh
- scripts/pinebox/stages/load.sh
- scripts/pinebox/stages/page.sh
- scripts/pinebox/stages/services.sh
- scripts/pinebox/test/fixtures/ema-ribbon.pine
- scripts/pinebox/test/inject.sh
- scripts/pinebox/test/mcp.sh
- scripts/pinebox/test/multi.sh
- scripts/pinebox/test/mutate.sh
- scripts/pinebox/test/run.sh
- scripts/pinebox/test/strings.sh
## 2026-10-26 (second) — DEPLOYED AND TESTED ON THE REFRESHED SESSION: 3 defects found and fixed

**The built.** Nothing new was designed. The deployed artefact was EXERCISED and three defects that no
gate could see were found and fixed, plus the broken extension the operator asked about.

**The why.** The operator's order after the refresh: *"test everything"* and *"whatever this is
disable/delete it"* (the per-boot `Failed to load extension` warning).

**The how.**
1. **Tested through the tools the operator uses**, not only the CLI: `computer probe`, `shell up`,
   `shell spawn`, `screenshot`, `click`/


## 4 · DESIGN DECISIONS

## 2026-10-26 — THE OPERATOR'S RULINGS ON THE COMPUTER TOOL (verbatim, binding)

**R1 · THE WINDOW IS THE PRODUCT, AND IT MUST NOT TAKE THE FOCUS.** *"this needs to be a headed window
on my screen that I can click into and see if I want. It just should not fucking rip the primary focus
are you fucking retarded?"* AND *"The solution is not to kill the window. That's fucking stupid. The
point is that this needs to work normally without stealing focus."*
Context: the agent had proposed a VNC surface that added no window at all, then presented "0 windows on
your screen" as a C3 success. Ruling: BOTH properties are the requirement; neither satisfies the other.
Consequence in the code: `weston-x11` is the default surface; the C3 check REFUSES `FOCUS_STOLEN` and
tears the instance down rather than shipping one.

**R2 · THE SURFACE IS NOT NEGOTIABLE BY CONVENIENCE.** *"One, why are you using VNC? VMC is not the
fucking spec. Two, what the fuck do you need zero windows on my screen?"*
Consequence: `core/probe.sh` selects by contract (C3 satisfied, a display exists), never by preference;
`weston-vnc` is reachable only where no display exists.

**R3 · THE SCOPE IS THE OPERATOR'S, INCLUDING THE WORD "EVERYTHING".** *"test everything"*, *"Make sure
everything is cleanly documented go ahead and generate the full ship package."*
Consequence: every phase of the ship-package skill runs; no phase, doc or component is dropped or
reduced, and a blocked component is named with its unblock condition rather than replaced.

**R4 · A BROKEN COMPONENT IS DISABLED OR DELETED, NOT TOLERATED.** *"[the per-boot extension warning] —
whatever this is disable/delete it"*
Consequence: the file was moved to `extensions-disabled/` (recoverable, not destroyed) and its config
entry removed with the sanctioned verb; a sweep now proves every enabled extension exports a factory.

**R5 · CONFIRMED BY THE OPERATOR, ON THEIR OWN SCREEN.** *"I can confirm that nothing stole focus. from
my active device and I can see it on my screen as well if I look at the windows. Good job."*
This is the OUTSIDE observation that closes C3 — the one claim an agent cannot make for itself.


## 2026-10-26 (second) — DEPLOYED AND TESTED ON THE REFRESHED SESSION: 3 defects found and fixed

**The built.** Nothing new was designed. The deployed artefact was EXERCISED and three defects that no
gate could see were found and fixed, plus the broken extension the operator asked about.

**The why.** The operator's order after the refresh: *"test everything"* and *"whatever this is
disable/delete it"* (the per-boot `Failed to load extension` warning).

**The how.**
1. **Tested through the tools the operator uses**, not only the CLI: `computer probe`, `shell up`,
   `shell spawn`, `screenshot`, `click`/`key`/`type`, `shell down`, then `pinebox up` / `status` /
   `shot` / `down` — with the focus oracle and the window's own `_NET_WM_STATE` read around EVERY step.
2. **Each surprise was chased to a mechanism** instead of being worked around: the xvfb probe's word
   match, the single token for two conditions, and the attention flag the C3 contract never covered.
3. **The extension** was moved out of the load path rather than deleted (it is not in git), and its
   config entry removed with the sanctioned verb.

**The evidence.**
- `computer probe` → `native` / `weston-x11`, and afterwards all four adapters honest.
- Instance `up` → `active=0x0 top=0xa0000a x-clients=2`, `stack=0x1e00005,0xa0000a` (ours at the
  BOTTOM), `usertime=0`, `state=[]`.
- Delivery proven from xev's own log: `ButtonPress … (120,120) … synthetic NO`, `KeyPress … keycode 56
  (keysym 0x62, b)`, 3 presses.
- `pinebox up --id 2` → 145 024-byte frame / 265 colours, `FIXTURE · DXY · 1H · 508 bars`, counts
  `{plots:2, markers:4}`, status row naming its OWN rail `:9774`; `status` → 712 MB with the hidden
  server pid named; `shot` → CDP, 264 colours, `c3:"held"`.
- Teardown ×2 → `weston=0`, `chrome=0`, `stations=0`, `x-clients=1`.
- `test/run.sh --slow` → **9 gates, 0 failed, exit 0**.

**The verification.**
- The three fixes each proven both ways: xvfb real → available, fake → `available:false`;
  `NO_WINDOW_BOUND` on a fresh instance vs `WINDOW_GONE` for a vanished binding; a fresh `up` now comes
  up `state=[]` where it previously carried `_NET_WM_STATE_DEMANDS_ATTENTION`.
- Deploy re-sealed after the edits: 61 files, `hostwin=88579d713640`, `mcp=2/2 answer`,
  `probe=native/weston-x11`.
- Extension sweep: `14 enabled, 0 with a problem`.

**The honest notes.**
- **`config.yml` cannot be proven to have changed only one key** — the sanctioned verb rewrites the
  whole file and the pre-edit copy was blocked, so the other 35 keys' divergence from HEAD is
  attributed to other sessions by INSPECTION, not by diff (F-151). The file parses at 36 keys and the
  host runs.
- **A concurrent session deleted six tracked skills**, one of them this session's; mine is restored
  (the deletion is cancelled because the file matches HEAD), the other five left as found (F-150).
- **The audit gate is still BLOCKED** (`OCR_MISSING`) — no ship-ready claim is made this cycle either.
- **The pinebox chain's seven-instance gate** was re-run and is reported in T-38 when it completed.

## 2026-10-26 — COMPUTER-USE v2 REBUILT TO ITS BLUEPRINT, AND PINEBOX SHIPPED (C3 proven, audit BLOCKED)

**The built.**
- **The core** (`~/.omp/agent/extensions/computer-use-v2/`, 48 files, commit `5263655`): `core/`
  {lib, govern, probe, runtime, surface, drive, terminal, state, cli} + 4 surface adapters
  {weston-x11, weston-vnc, xvfb, existing} + `core/cdp.mjs` (the browser drive path) +
  `core/actions.json` (THE action table both forwarders read) + `core/guest/boot.sh` with
  `rootfs/{manifest.txt,assert.sh}`; `helpers/` {nofocus.c, hostwin.c, build.sh keyed by source sha};
  `mcp/server.mjs` + `index.ts` (thin forwarders); `scoped/` (the 7 files, `cmp`-identical to the
  boilerplate); `test/` (9 gates); `deploy.sh` (seal/install/verify).
- **The focus fix:** `helpers/nofocus.c` sets `_NET_WM_USER_TIME=0` + `_NET_WM_STATE=[BELOW]` before the
  map; `hostwin release` removes BELOW and lowers in ONE flush, then verified on the WM stack.
- **PINEBOX** (`scripts/pinebox/`, commit `4de2be2`): `ports.sh` (the id-derived block), `inject.py`
  (rewrites BOTH config globals in the served bytes), `stages/{services,page,load}.sh`, the `pinebox`
  CLI, `actions.json` + `mcp/server.mjs` + the `pinebox` OMP extension, `test/` (7 gates incl.
  `multi.sh`). Plus `scripts/pv-server.py` (an opt-in `PINEBOX_PORTS` hook) and `scripts/pv-load.mjs`
  (`PV_CDP_PORT`/`PV_SERVER_PORT`).
- **The blueprints** now carry measured amendments: `design/DESIGN_BLUEPRINT_CU_v2.md` §18,
  `design/DESIGN_BLUEPRINT_PINEBOX.md` §19 (with a re-measured anchor table).
- **The durable lesson** is a managed skill: `measure-focus-theft-on-replica`.

**The why.** The operator's schema, twice: *"this needs to be a headed window on my screen that I can
click 


## 5 · TEST RESULTS

## TEST RESULT — 2026-10-26 — T-40 · the extension load contract

### SCRIPT
- **The run:** the check over `omp config get extensions --json` after moving
  `snapcompact-read-frames.ts` out.
- **The raw output:** `14 enabled, 0 with a problem`; `config.yml refs: 0`;
  `files in extensions/: 0`.
- **The verdict:** PASS.
- **The artifacts:** `extensions-disabled/snapcompact-read-frames.{ts,md}` (recoverable); the
  `extensions` key set to 14 entries via `omp config set`; commit `9031f45`.

## TEST RESULT — 2026-10-26 — T-39 · what testing BROKE (the three defects it found)

### HOST
- **The run:** the T-37 surface test, read honestly.
- **The raw output:** three defects, none of which any pre-existing gate could see:
  (1) `xvfb` reported `available:true` on the evidence `"Unrecognized option: -version"` — a dead
      detector matching the word inside a failure (EN-160);
  (2) `screenshot` on a live instance refused `WINDOW_GONE` for a condition that is not "gone"
      (EN-161);
  (3) a mapped instance carried `_NET_WM_STATE_DEMANDS_ATTENTION` — a taskbar flash the C3 oracle
      could not see (EN-162).
- **The verdict:** FAIL of the shipped state, PASS of the test (it found them).
- **The artifacts:** fixes at `core/adapters/xvfb.sh:31`, `core/drive.sh:60`,
  `helpers/hostwin.c` (release); re-sealed deploy `hostwin=88579d713640`; commit `9031f45`.

## TEST PLAN ENTRY — 2026-10-26 — THE EXTENSION LOAD CONTRACT

### SCRIPT
- **What:** every extension enabled in `config.yml` must export a factory the loader accepts, or it
  is skipped at boot with a warning.
- **How:** read `omp config get extensions --json`, and for each path check the file exists and its
  source matches `export default|export \{… as default\}|module.exports`.
- **PASS criteria:** every enabled extension present and exporting; 0 warnings from a refresh.
- **FAIL criteria:** any enabled path missing, or any file without a factory (the observed defect).
- **Status:** PASSED

## TEST RESULT — 2026-10-26 — T-38 · the gate chains after the deploy

### SCRIPT
- **The run:** `test/run.sh --slow` (computer-use) and `scripts/pinebox/test/run.sh --full`.
- **The raw output:** computer-use `cmp-guard PASS · strings PASS · mutate PASS · state battery PASS ·
  mcp PASS · c3-no-raise PASS · isolation PASS · mutate --slow PASS · leak-check PASS` →
  `9 gates · 0 failed`, `exit=0`.
- **The verdict:** PASS for the tool chain.
- **The artifacts:** `/tmp/t-cu.out` (full text), the pinebox chain's own output.

## TEST RESULT — 2026-10-26 — T-37 · the deployed surface on the refreshed session

### HOST
- **The run (verbatim, through the tool surface):**
  `computer probe` → runtime `native`, surface `weston-x11`, 4 adapters available with real evidence.
  `computer shell up --id 3` → `{"ok":true,"display":":3","x_slot":"3", ... "host_win":"0x1e00005",
  "comp_tok":"827507:83594196"}`.
  `computer shell spawn --id 3 -- xev -geometry 600x400` → `{"ok":true,"window":"4194305",
  "pid":837223,"c3":"held"}`.
  `computer screenshot --id 3` → `{"bytes":268,"colours":12,"via":"x","c3":"held"}`.
  `computer click/key/type` → three `{"c3":"held"}`.
  `pinebox up --id 2 --pine .../ema-ribbon.pine` → frame 145 024 bytes / 265 colours,
  `status_row:"FIXTURE · DXY · 1H · 508 bars"`, counts `{plots:2, markers:4}`, `bars:508, onChart:6`.
  `pinebox status --id 2` → `{station:31, rail:28, compositor:67, browser:586, instance:712,
  unreadable:"server pid(s) 850428"}` (MB, measured PSS, hidden process named).
  `pinebox shot` → `{"bytes":145145,"colours":264,"via":"cdp","c3":"held"}`.
- **The raw oracle readings:**
  before = `active=0x0 top=0xa0000a x-clients=1`;
  after `up` = `active=0x0 top=0xa0000a x-clients=2`, `stack = 0x1e00005,0xa0000a` (ours at the
  BOTTOM), `usertime=0`;
  after the three drive verbs = `active=0x0 top=0xa0000a`;
  after both teardowns = `active=0x0 top=0xa0000a x-clients=1`, `weston=0`, `chrome=0`, `stations=0`.
- **The delivery proof (the target's own log, not our claim):**
  `ButtonPress event, serial 34, synthetic NO, window 0x400001, ... (120,120), state 0x0, button 1`
  and `KeyPress ... keycode 56 (keysym 0x62, b)`, `KeyPress` count 3.
- **The verdict:** PASS — 0 focus changes, 0 raises, 0 attention flags after the fix, 0 leftovers.
- **The artifacts:** `/tmp/t3-shot.png` (opened and read: xev's 600×400 canvas); the pinebox frame
  attached by the tool (PINE IDE, candles + EMA 20/50 + 4 crossover triangles, status row naming the
  instance's OWN rail `:9774`).

## TEST RESULT — 2026-10-26 — the code-audit gate

### SCRIPT
- **The run:** `code-review action=scan scanPath=<core,helpers,index.ts,mcp,scripts/pinebox>` then
  `code-review action=health`.
- **The raw output:** `OCR_MISSING: the binary is not executable at
  /home/leviathan/.npm-global/bin/ocr` on both. No `sg-ocr-*.json` exists for this build.
- **The verdict:** **BLOCKED** — not PASS, not FAIL. No artifact, so no verdict. Per the degraded-run
  law every ship-ready / production-grade claim for this build is withheld.
- **AUDIT GATE: BLOCKED (OCR_MISSING — the review lane has no executable binary on this host)**
- **The partial substitute:** the independent `reviewer` subagent run (T-31) — which is an adversarial
  code review, and found 12 real defects, but is NOT the mandated artifact and is not reported as one.
- **The retry condition:** install/repair `ocr` (or repoint the lane at a keyed provider), then re-run
  the scan and accept only a verdict line carrying a session id, a non-empty file scope and a
  non-trivial duration.

---

## TEST PLAN ENTRY — 2026-10-26 — THE DEPLOYED SURFACE, after the session refresh

### HOST
- **What:** every artefact that was just deployed, exercised on the refreshed session through the
  TOOLS the operator will use (`computer.*`, `pinebox.*`), not only through the CLI.
- **How:** `computer probe` → `shell up id 3` → `shell spawn xev` → `screenshot` → `click`/`key`/
  `type` → `shell down`; then `pinebox up id 2 --pine ema-ribbon.pine` → `status` → `shot` → `down`.
  The focus oracle (`_NET_ACTIVE_WINDOW` + the top of `_NET_CLIENT_LIST_STACKING`) is read before and
  after every single step; the window's own `_NET_WM_STATE` is read too (EN-162).
- **PASS criteria:** `active`/`top` identical to the baseline (`0x0` / `0xa0000a`) at every step; the
  instance window at the BOTTOM of the stack; `state` empty; the delivered events visible in the
  target application's own log as non-synthetic X events; teardown leaving no process.
- **FAIL criteria:** any change in `active`/`top`; a raised window; a non-empty `_NET_WM_STATE`; a
  pass claimed from an exit code rather than from the application's log.
- **Status:** PASSED

## TEST RESULT — 2026-10-26 — T-36 · the deploy

### HOST
- **The run:** `~/.omp/agent/extensions/computer-use-v2/deploy.sh seal && deploy.sh install`.
- **The raw output:** `DEPLOY: OK  sealed=61 files  nofocus=ccc1f778d2bd  hostwin=dc75cce7e31c  mcp=2/2
  answer  probe=native/weston-x11`.
- *


## 6 · KNOWN BUGS

See BUILD_REPORT §8 — the audit gate is BLOCKED, V11/V12 are open, the E2 geometry is discarded, and

`NO_FRESH_FRAME` is written but its two-way proof was not completed.


## 7 · OPERATIONAL KNOWLEDGE

- `computer doctor` reports every adapter re-probed, orphans, and the refusal top-5.

- `pinebox verify --id N --week YYYY-MM-DD` is the ONE verb that answers "does it work": it refuses

  WEEK_MISMATCH / RAIL_DOWN / STATION_DOWN / PORTS_MISMATCH / NO_BARS / NO_DRAWINGS / FRAME_BLANK / NO_FRESH_FRAME.

- `pinebox week --set 2026-W28` drives the IDE's own `.pine-week` control so the week can be SET.

- Never verify on the operator's display with input; `existing` is for READING only (OPERATOR_DISPLAY).


## 8 · COMPACTION RECOVERY

1. `computer probe` — must print `runtime native` and a surface.

2. `extensions/computer-use-v2/deploy.sh verify` — must print `DEPLOY: OK` with the sealed file count.

3. `pinebox up --id 2 --pine scripts/pinebox/test/fixtures/ema-ribbon.pine` then `pinebox verify`.

4. If any step refuses, the token is the diagnosis; the refusal ledger is at `<state>/refusals.jsonl`.

