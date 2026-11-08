# PINEBOX + COMPUTER-USE v2 — CONTEXT RECONSTRUCTION REPORT

**Date:** 2026-11-01 · **Session:** `2026-10-31T22-01-31-148Z_01a193fb` (takeover)
**Source session:** `2026-10-13T21-47-15-943Z_01a1373b` — "JARVIS INTELLIGENCE",
`~/.omp/agent/sessions/-JARVIS_WORKSPACE-Shared_Workspace/2026-10-13T21-47-15-943Z_01a1373b-ea67-7658-ac2c-e7ba441673a6.jsonl`,
115,933,409 bytes · 30,395 lines · **15 compaction boundaries** (`grep -c '"type":"compaction"'` = 15).
**Scope of this document:** CONTEXT RECONSTRUCTION ONLY. Nothing was built, deployed, or changed.
Every "state" below is either a **TOOL RESULT produced this session** or an **inherited record**, and the
two are labelled apart. Where an inherited record was contradicted by a measurement taken today, the
measurement wins and the contradiction is named.

---

## §0 · THE RECOVERY CHANNELS USED (and what each returned)

| channel | path | what came back |
|---|---|---|
| transcript | the 115.9 MB JSONL | 3,991 lines match `pinebox`; 851 match `computer-use`; 298 match `\bcua\b`; 6,436 `abide`; 2,416 `warhead`; 5,455 `jev` |
| compaction boundaries | `recall.py compactions` | 15 rows: `#0`..`#9` method=snapcompact (lines 2355…17467), `#10`..`#14` method=handoff (lines 19970…29383) |
| resume texts | `recall.py resume --index 12/13/14` | 29,400 / 12,748 / 16,495 chars — all three are the LATER branch (hydra-build-prep, abide warhead firewall), i.e. the "joined intelligence" work, **not** Pinebox |
| the checkpoint | `PLUTUS_VISION/Checkpoints/computer-use-v2-focus-proven-2026-10-26/` | 4 dirs + 30 files: the sealed tool, the sealed app layer, 14 canon docs, 8 ship docs, 2 blueprints, 7 artefacts, 1 opened frame |
| the deployed artifact | `~/.omp/agent/extensions/computer-use-v2/` + `PLUTUS_VISION/scripts/pinebox/` | the thing that actually runs (47 + 16 files) |
| the git record | both repos | `~/.omp/agent` HEAD `83ce4a4` (2026-10-26 17:20:25); `PLUTUS_VISION` HEAD `a91da51` (2026-10-26 18:09:09) |

**Where the Pinebox/CU-v2 arc actually sits in the transcript:** lines ~10,391 → ~12,904 — i.e. between
compaction `#5` (line 10,658) and `#7` (line 13,491). The session then left the arc and became the
abide/JEV/agent-desk work whose resume texts are `#12`–`#14`. The operator's recollection ("about three
compactions ago") is approximate; the artifact record dates the whole arc precisely: **all of it landed
2026-10-26, 14:00 → 18:24.**

---

## §1 · WHAT THE TWO THINGS ARE (the original target, as the blueprints define it)

### §1.1 · COMPUTER-USE v2 — the `computer` tool

**Blueprint:** `design/DESIGN_BLUEPRINT_CU_v2.md`, 978 lines, §0–§18.
**Authority:** `~/.omp/agent/extensions/computer-use-v2/` v2.0.0 — **a FORK of v1. v1 is never edited.**

The blueprint's own one-paragraph statement of the target:

> "v1 is 652 lines of navigation that assumes a display exists and never creates one — measured: zero
> weston references, zero agent-display references, zero focus-stealing calls, with the focus theft
> coming from one documented example line. v2 forks it and adds four planes underneath: a surface plane
> whose four adapters (weston-x11, weston-vnc, xvfb, existing) all satisfy one six-point contract — a
> display id, real pixels, no-raise, per-instance isolation, a scoped teardown, and a served form so a
> remote operator can look at a remote agent's screen; a state plane that is the seven-file scoped store
> copied verbatim, so a computer's filesystem can never spill into another's; a terminal plane that is
> tmux, because a piped stdout is not a terminal; and a runtime plane whose guest is a fallback the probe
> never selects on a Linux host."

**The constraint the whole design exists to satisfy** (blueprint §0, boxed):

```
┌──────────────────────────────────────────────────────────────────────────┐
│  THE AGENT MUST BE ABLE TO SEE AND ACT ON A REAL SURFACE, AND THE        │
│  OPERATOR MUST NEVER LOSE FOCUS, AND THE SAME CODE MUST RUN ON A HOST    │
│  THAT IS NOT THE OPERATOR'S.                                             │
└──────────────────────────────────────────────────────────────────────────┘
```

**The export surface — one core, three mounts** (blueprint §10): the core is the only code with logic;
the OMP extension and the MCP server translate `core/actions.json` into argv and add nothing. A bug fixed
in the core is fixed in all three at once.

### §1.2 · PINEBOX — the `pinebox` tool

**Blueprint:** `design/DESIGN_BLUEPRINT_PINEBOX.md`, 913 lines, §0–§19 + `DESIGN_BLUEPRINT_PINEBOX_v3_EXPANSION.md`, 175 lines.
**Authority:** `PLUTUS_VISION/scripts/pinebox/` — **a FORK of computer-use v2.0 with the Pine IDE as its
default application layer.**

The operator's own definition, verbatim from the session (transcript line 10,737):

> "A computer is just a shell environment with a display and a file system... Shell is just a Weston
> compositor and X11... combine Weston+X11+TMUX plus [workspace-scoped-state-boilerplate] and voila...
> PINEBOX is just the upgraded computer use tool with the pine IDE as the default application that
> spawns with the shell."

**The constraint PINEBOX is built around** (blueprint §0, boxed):

```
┌──────────────────────────────────────────────────────────────────────────┐
│  THE PAGE AND THE BACKEND ARE BOTH FROZEN AND BOTH ALREADY PARAMETERISED.│
│  THE ISOLATION MUST THEREFORE REACH THEM THROUGH THE TWO EXISTING SEAMS: │
│  THE SERVE-TIME CONFIG BLOCK, AND THE ENVIRONMENT PORT.                  │
│                                                                          │
│  Any design that edits a file under pine-ide/ is a FAILED design.        │
└──────────────────────────────────────────────────────────────────────────┘
```

**The v3 expansion** (spec, not built) grows the verb surface from **13 to 31**, grouped by user intent
rather than implementation step: lifecycle (`spawn`/`attach`), script (`run`/`insert`/`editor`), tabs
(`tab`), chart (`chart --pan/--zoom/--fit/--view/--resize`), data axes (`week`/`asset`/`tf`), widgets
(`widget --list/--open/--close`), backtest (`backtest --play/--pause/--step/--speed/--date`), vision
(`look` on **both** tools). Four phases: P1 script+vision, P2 navigation, P3 backtest, P4 drawing.

---

## §2 · THE ARCHITECTURE AS BUILT

```
┌──────────────────────────────────────────────────────────────────────────┐
│  PINEBOX  =  COMPUTER-USE v2 (inherited whole)  +  THE APP LAYER (A1)    │
└──────────────────────────────────────────────────────────────────────────┘

   PINEBOX planes                      CU v2 planes (byte-for-byte inherited)
   ─────────────────                   ─────────────────────────────────────
   A1  APP                             L6  GOVERN   registry · lock · no-raise
       station :9741+id*10                 · refusal ledger
       rail    :9754+id*10             L5  DRIVE    focus · shot · click ·
       server  :9851+id*10                 type · key · spawn (v1's verbs)
       page    pine.html (FROZEN)      L4  TERMINAL tmux, real PTY, cu-<id>-<n>
       browser chrome --app            L3  STATE    the 7-file scoped store
       ── the ONLY new code ──         L2  SURFACE  weston-x11 | weston-vnc |
   ────────────────────────────────────            xvfb | existing
   L0-L6  COMPUTER-USE v2, UNCHANGED   L1  RUNTIME  native | guest | agentos
                                       L0  PROBE    capability by RUNNING it

   ONE CORE, THREE MOUNTS (both tools):
     CLI        core/cli.sh  ·  scripts/pinebox/pinebox   ← the only logic
     OMP ext    index.ts (thin forwarder, reads actions.json)
     MCP        mcp/server.mjs (stdio, same action table)
```

**The port block** — every resource of an instance derived from its id, so instances cannot collide:

```
   station  9741 + id*10      rail  9754 + id*10     server 9851 + id*10
   cdp      9222 + id*10      vnc   5900 + id        ws     server + 80
   ids 0..9 (id 0 = the operator's own canonical block)
```

**The isolation mechanism that makes the frozen page work** (PINEBOX §5, §7D, amendment B-A1): at serve
time `inject.py` rewrites **two** globals in the bytes it returns for `pine.html` — `window.dashboardConfig`
and `window.PlutusPineShellConfig` — and the file on disk is never touched (`git diff HEAD -- pine-ide/`
is EMPTY). B-A1 records why the second global was needed: it is read at 3 sites and **defined nowhere**,
so without it every instance fell to `gate.mjs:21 DEFAULT_RAIL_BASES` and talked to instance 0's rail.

---

## §3 · THE DEPLOYED ARTIFACT — MEASURED TODAY

| thing | path | size / count | measured |
|---|---|---|---|
| the tool | `~/.omp/agent/extensions/computer-use-v2/` | **47 files** | `find -type f \| wc -l` |
| the tool's seal | `.../MANIFEST.sha256` | **63 rows** | `wc -l` (the checkpoint records 61 at seal time) |
| the app layer | `PLUTUS_VISION/scripts/pinebox/` | **16 files** | `find -type f \| wc -l` |
| the OMP forwarder | `~/.omp/agent/extensions/pinebox/index.ts` | 5,740 B | |
| the nofocus helper | `~/.cache/computer-use/lib/nofocus-ccc1f778d2bd.so` | 16,200 B | symlink `nofocus.so` → it |
| the hostwin helper | `~/.cache/computer-use/lib/hostwin-88579d713640` | 17,496 B | symlink `hostwin` → it |
| the refusal ledger | `/run/user/1000/computer-use/refusals.jsonl` | **35 rows** | |
| the run ledger | `~/.omp/agent/run/computer-use/runs.jsonl` | **111 rows** | |
| MCP registration | `~/.omp/agent/mcp.json:95,104` | 2 servers | `computer-use`, `pinebox` |
| config registration | `~/.omp/agent/config.yml:14` | v1 only | v2 + pinebox load by **discovery** |

**Both tools are LIVE in this session** — proven by calling them, not by reading a config:

```
computer action=probe   → {"os":{"kernel":"Linux","arch":"x86_64","native_linux":true},
                           "surface":{"adapters":[weston-x11 available:true,
                            weston-vnc available:true, xvfb available:true,
                            existing available:true]},
                           "selected":{"runtime":"native","surface":"weston-x11",
                                       "state":"scoped-store"}}
pinebox verb=list       → {"ok":true,"instances":[]}
pinebox verb=ports id=3 → {"ok":true,"id":3,"ports":{"station":9771,"rail":9784,
                           "server":9881,"cdp":9252,"ws":9961,"vnc":5903},
                           "state":{"station":"free",...},"claimable":true}
```

**One registration anomaly, measured:** `config.yml:14` lists
`/home/leviathan/.omp/agent/extensions/computer-use/index.js` (v1, sha256
`e0525197e392c77612e97885ba3949deb32be950001666d2ea4991c957234699`, mtime 2026-10-10 22:02:45). v1 exports
a valid default factory and registers a tool named `computer-use`. **That tool is absent from this
session's surface** — the session's tool names are exactly `bash, code-review, computer, pinebox, read,
task, wait`; `computer-use` occurs 0 times. The mechanism is unresolved. Candidate: the loader's
subdirectory rule takes `index.ts` (which is how `computer-use-v2/` and `pinebox/` load) while the explicit
config entry is not honoured — but `code-review/index.js` **is** live, so the rule is not that simple.
**UNRESOLVED — flagged, not explained.**

---

## §4 · DONE — VERIFIED (each row is a recorded run, not a claim)

### §4.1 · Computer-use v2

| # | what | the run | the result |
|---|---|---|---|
| T-32 | the gate chain | `test/run.sh --slow` | `9 gates · 0 failed`; state battery 32 pass / 0 fail / 68 expects |
| T-33 | the PINEBOX chain | `scripts/pinebox/test/run.sh --full` | `7 gates · 0 failed`; **P9 seven instances**: 35 distinct ports / 35 assignments, 7 slots, 7 compositors, 0 operator-focus changes, 46 checks |
| T-34 | C3 on the REAL desktop | `test/c3-no-raise.sh --real` (`:1`) | `26 PASS · 0 FAIL`; `active=0x0 top=0xa0000a` before AND after, through `up` + 17 verbs (X and CDP) + teardown |
| T-35 | the release-order rate | 60 × `up/down --id 1` on a replica, 30 ms sampler | `ok=60 FOCUS_STOLEN=0`, vs **~11 %** for the previous order (3/24, 5/45, 1/40) |
| T-36 | the deploy | `deploy.sh seal && install && verify` | `DEPLOY: OK sealed=61 files nofocus=ccc1f778d2bd hostwin=dc75cce7e31c mcp=2/2 answer probe=native/weston-x11`, + 5 must-fail probes each firing (`DEPLOY_DRIFT`×2, `HELPER_STALE`, `MCP_NOT_REGISTERED`×2) |
| T-37 | the deployed surface, through the TOOLS | `computer probe → shell up → shell spawn xev → screenshot → click/key/type → shell down`; `pinebox up/status/shot/down` | PASS — 0 focus changes, 0 raises, 0 attention flags, 0 leftovers; delivery proven from **xev's own log** (`ButtonPress … synthetic NO`, `KeyPress … keycode 56`, 3 presses) |
| T-38 | the chains after the deploy | both chains again | `9 gates · 0 failed`, exit 0 |
| T-39 | what testing BROKE | the T-37 read, honestly | 3 defects found that **no gate could see**, all fixed: dead xvfb detector (EN-160), one token for two conditions (EN-161), `_NET_WM_STATE_DEMANDS_ATTENTION` invisible to the C3 oracle (EN-162) |
| T-40 | the extension load contract | sweep over `omp config get extensions --json` | `14 enabled, 0 with a problem` |

**Blueprint exit table (§13), status as recorded:**

```
V0  probe                DONE   names ≥1 runtime AND ≥1 surface (probe output above)
V1  adapter existing     DONE   v1's six verbs unchanged
V2  adapter weston-x11   DONE   a display :N appears; xdpyinfo answers
V3  THE C3 PROOF         DONE   0 failures in 60 runs; 26/26 on the real desktop
V4  registry + lock      DONE   second `up --id N` → INSTANCE_LIVE
V5  scoped teardown      DONE   down --id 0 leaves siblings answering
V6  the state plane      DONE   7 files cmp-identical; battery in place; SCOPE_VIOLATION refuses
V7  the terminal         DONE   terminal send → read returns the output
V8  the extension        DONE   the `computer` tool is live and forwards (proven above)
V9  the MCP server       DONE   mcp.json:95; test/mcp.sh in the chain
V10 adapter weston-vnc   DONE   measured: "Output 'vnc' enabled", 0.0.0.0:5900, 0 windows added
V11 the guest runtime    PARTIAL core/guest/boot.sh built; 4 refusal paths proven; a REAL guest
                                boot was never tested — no guest image exists on this host
V12 agentos state        NOT BUILT — Phase Two; refuses AGENTOS_UNAVAILABLE with the remedy
```

### §4.2 · PINEBOX

| # | what | the run | the result |
|---|---|---|---|
| P0–P1 | the port block + the config injection | `inject.sh` gate | 4 distinct unclaimed ports; the SERVED bytes name the instance's OWN `apiBase`/`pineStation`; `git diff --stat -- pine-ide/` EMPTY |
| P2–P6 | the five stages | `pinebox up --id 2 --pine ema-ribbon.pine` | frame **145,024 B / 265 colours**; `status_row:"FIXTURE · DXY · 1H · 508 bars"`; counts `{plots:2, markers:4}`; `bars:508, onChart:6` |
| P7 | no-raise | FOCUS_STOLEN probe during drive AND capture | 0 focus changes on the operator's real `:1` |
| P8–P10 | two and seven instances | `multi.sh 2` and `multi.sh 7` | 7 rows, 7 slots, 7 port blocks, 0 shared ports; `down --id 1` left 2..7 serving |
| P11–P12 | the extension + MCP | `mcp.sh` gate | the `pinebox` tool is live and forwards; `tools/list` returns the whole verb table |
| P13 | the leak | after 3 loads | no growth; every browser pid recorded, teardown kills by recorded group |
| — | the v3 `verify` verb | `pinebox verify` built with 7 predicates | `RAIL_DOWN · STATION_DOWN · PORTS_MISMATCH · WEEK_MISMATCH · NO_BARS · NO_DRAWINGS · FRAME_BLANK` |

**The committed record (PLUTUS_VISION git):**

```
53ac679 2026-10-26 17:29:54 feat(pinebox): v3 expansion SPEC; up now sets the IDE week
829287b 2026-10-26 17:20:25 feat(pinebox): verify + week — "run the indicator and see if it works"
4de2be2 2026-10-26 16:05:50 feat(pinebox): the Pine IDE as a multi-instance agent computer, on a
                              computer-use v2 that never takes the operator's focus
```
and `~/.omp/agent`:
```
83ce4a4 2026-10-26 17:20:25 fix(computer-use-v2): four reachable failures closed — AP-25 surface
                              choice, fence order, binding, contract
9031f45 2026-10-26 17:11:49 fix(computer-use-v2): three defects found by testing the deployed tool,
                              and disable the broken snapcompact extension
```

---

## §5 · LIVE BLOCKERS — MEASURED THIS SESSION (not inherited)

### B1 · THE TOOLS CANNOT START A DISPLAY ON THIS HOST — `FOCUS_STOLEN`, REPRODUCED

```
computer action=shell_up id=3
  → COMPUTER REFUSED FOCUS_STOLEN: weston-x11 up: stack top moved 0x0 -> 0xe00005;
    stack top was 0xe00005 mid-verb

pinebox up --id 2 --week 2026-07-06 --pair DXY --tf 1H --pine .../ema-ribbon.pine
  → REFUSED  FOCUS_STOLEN  —  weston-x11 up: stack top moved 0x0 -> 0xe00005;
    stack top was 0xe00005 mid-verb
    (the partly started instance 2 was torn down; logs kept in /tmp/pinebox/i2)
```

**MECHANISM** (anchored, and the numbers trace to commands run this turn):

- `~/.omp/agent/extensions/computer-use-v2/core/govern.sh:96` —
  `t="$("$LIBDIR/hostwin" "$h" top 2>/dev/null)"` — reads the top of `_NET_CLIENT_LIST_STACKING`.
- `govern.sh:139` — `hit="${hit:+$hit; }stack top moved $b_top -> $a_top"` — fires when the top changed
  AND the new top is one of our windows, **with no guard for the operator's WM managing zero X clients**.
- `govern.sh:147` — the same predicate over the mid-verb samples.

**The measurement that makes it a false positive:**

```
xprop -root _NET_CLIENT_LIST_STACKING   → window id #            (0 ids)
xprop -root _NET_CLIENT_LIST            → window id #            (0 ids)
xprop -root _NET_ACTIVE_WINDOW          → 0x0                    (unchanged throughout)
xprop -root _NET_SUPPORTING_WM_CHECK    → 0x600001 → _NET_WM_NAME = "GNOME Shell"
XDG_SESSION_TYPE=wayland · mutter/gnome-shell pid 5713 running
hostwin :1 top    → 0x0     before the verb
hostwin :1 active → 0x0     before and after
```

**The sampler timeline** (`/run/user/1000/computer-use/i2/c3-up.timeline`, 110 lines):

```
  3 samples  active=0x0 top=0x0        ← the operator's WM has no X client at all
  104 samples active=0x0 top=0xe00005  ← ours is the only X client, so it is the top
  MARK release t=…686                  ← the release ran and changed nothing (nothing to be below)
```

**So:** on a desktop whose WM currently manages **zero** X11 clients — the operator's normal state, a
Wayland session with all apps native — the first X window this tool maps becomes the top of a
one-element stack, and C3 reads that as a theft. **Neither tool can start.** T-37 passed because that run
had `x-clients=1` (a foreign X client was present, so our window could be lowered *below* it). This is
exactly the limit the blueprint already recorded at amendment A-3: *"the oracle reads the X focus and X
stack; it cannot read the focus of a Wayland-native window."*

**Status: OPEN. Nothing is displaced — `active` never moved — so this is a false positive that blocks
100 % of use.** The narrow fix is a guard at `govern.sh:139`/`:147`: when `b_top = 0x0` there is no
operator window to displace, so the stack-top test cannot fire (the `active` test and the
`usertime=0`/no-DEMANDS_ATTENTION assertions still apply). **Not applied — a change to the safety
contract is the operator's to rule on.**

### B2 · THE DEPLOYED PINEBOX HAS DRIFTED FROM ITS OWN SEAL — `DEPLOY_DRIFT`

```
$ ~/.omp/agent/extensions/computer-use-v2/deploy.sh verify
REFUSED  DEPLOY_DRIFT  —  .../scripts/pinebox/pinebox: FAILED
                          .../scripts/pinebox/stages/verify.sh: FAILED
                          .../scripts/pinebox/test/run.sh: FAILED
                          sha256sum: WARNING: 3 computed checksums did NOT match
```

| file | sealed in `MANIFEST.sha256` | on disk now |
|---|---|---|
| `scripts/pinebox/pinebox` | `c13e4cbfe61d848a77cb07cf2ac758ed299ac9fa731ff67727647b1034f79f92` | `ed384df19bc62fc6ee9ef9e9fc7ca8a61dbbbb50f40e035815cee3640586b4c2` |
| `scripts/pinebox/stages/verify.sh` | `7e607fd34527ec4d2b8844480b4fb5d01d2d3124a4ba67bb1695d1a2abdb3be4` | `32bea4397b91391631b2d72d57ef7ab201329fb4f77a811c6b4db268335c4468` |
| `scripts/pinebox/test/run.sh` | `d54bbb95f48548212fdec32a037330e2a6866d89dd478cfa6378b7511fc67c20` | `c8605a128e16e661baa78092a48257a52dbfca7b5e5872a28c5d76b26a7cca38` |

**The change IS present in the deployed bytes** — `grep -c 'pb_verify'` = 2, `grep -c 'pb_week'` = 2,
`grep -c '^  verify)'` = 1, `grep -c '^  week)'` = 1 — and `cmp` against the checkpoint copy reports
`differ: char 2713, line 52`. So the deployed code is the NEWER code and **the seal is stale**: it was
taken before commit `829287b` (17:20:25, "verify + week"), and the app layer was never re-sealed after.
The SHIP_DOCS row still reads `sealed=61 files`; the manifest now has 63 rows.

**Root cause:** the seal step is manual and is **not wired into either gate chain** — `test/run.sh` runs
`strings`, `mutate`, `inject`, `mcp`, `multi`, `leak-check`, `blueprint-gate`, and never `deploy.sh
verify`. A drift of this class is therefore undetectable by the chains that are supposed to prove the
artifact. **Status: OPEN. The honest fix is the gate, not a re-seal.**

### B3 · THE MANDATED SHIP GATE IS BLOCKED — AND FOR A *SECOND* REASON

The 2026-10-26 blocker was `OCR_MISSING` (no executable `ocr`). **That is repaired** — measured this turn:

```
ocr --version                       → open-code-review v1.13.3 (375f64c) linux/amd64   rc=0
code-review action=health           → ✓ Connection test successful
                                      ✓ Tool-call round trip verified
                                      self-test returned ocr_selftest ok
```

But the real scan now fails for a **different** reason:

```
code-review action=scan scanPath=<abs paths>  → GATE: BLOCKED (OCR_JSON_ABSENT)
```

**MECHANISM** (anchored, reproduced this turn):

- `~/.omp/agent/extensions/code-review/index.js:236` — `push("--path", params.scanPath)` — passes the
  caller's paths verbatim, and they are **absolute**.
- `index.js:288` — `execFileAsync(OCR_BIN, argv, { cwd: repo, … })` with `repo = params.repo || process.cwd()`.
- The engine enumerates files **relative to the git working tree**, so an absolute path outside it fails:

```
$ cd ~/JARVIS_WORKSPACE/Shared_Workspace && ocr scan --preview \
    --path /home/leviathan/.omp/agent/extensions/computer-use-v2/core
Error: scan preview failed: enumerate files: --path
       "/home/leviathan/.omp/agent/extensions/computer-use-v2/core" does not exist in the working tree

$ cd ~/.omp/agent && ocr scan --preview --path extensions/computer-use-v2/core
Preview: 20 file(s) changed  |  +1707  -0
Will review (19):  [S] extensions/computer-use-v2/core/cli.sh +227 -0   … 18 more
Excluded from review (1): …/guest/rootfs/manifest.txt (unsupported_ext)
```

**So the fix is mechanical and proven: `cwd` = the repo that owns the paths, `--path` RELATIVE.**
Two scans are required (two repos): `~/.omp/agent` → `extensions/computer-use-v2/{core,helpers,index.ts,mcp,scoped}` + `extensions/pinebox`; and `PLUTUS_VISION` → `scripts/pinebox`.
**Status: OPEN — BLOCKED, not passed. No `sg-ocr-*.json` exists for this build, so no ship-ready claim is
made.** The only independent review this build has is the `reviewer` subagent run (T-31, 12 real defects
found, all fixed) — a substitute, never reported as the mandated artifact.

### B4 · A PLAINTEXT API KEY SITS IN AN OCR CONFIG FILE (security)

`~/.opencodereview/config.json` carries a `google` custom provider whose `api_key` is a **literal
plaintext Google API key** (value deliberately NOT reproduced here). Every other provider in the same
file resolves its bearer from a key script (`api_key_cmd: …/go-key.sh`, `…/openrouter-key.sh`).
**Status: OPEN. Report it, rotate it, move it to an `api_key_cmd`.** This document must never carry the
value.

---

## §6 · PENDING — THE HONEST GAPS (inherited, re-checked against today's measurements)

The checkpoint's own list, with the status corrected where today's measurement moved it:

| # | the gap (checkpoint's words) | status today |
|---|---|---|
| 1 | **AUDIT GATE BLOCKED** — `OCR_MISSING`, no verdict line (F-147) | **moved**: the binary is repaired and the lane answers; the gate is now blocked by B3 (path resolution). Still BLOCKED, different mechanism |
| 2 | **V11 (guest runtime) UNPROVEN** — no guest image exists, so a real boot was never tested | unchanged |
| 3 | **V12 (agentOS) NOT BUILT** — Phase Two | unchanged |
| 4 | **The E2 geometry is discarded** — `run.mjs:163` counts polylines/linefills/tables and drops them; `counts.polylines: 0` on every load | unchanged (B-A8, recorded NOT DONE) |
| 5 | **`plutus-vision-v2.pine` cannot render against any fixture here** — its baked geometry is Oct 2026, every fixture ends 2026-07-21 | unchanged; stage-5 acceptance uses `test/fixtures/ema-ribbon.pine` |
| 6 | **The C3 oracle is X-side only** — cannot read a Wayland-native window's focus | **now the live blocker** (B1) |
| 7 | **88 authored docs untracked** — refused by the repo's own W-9 doc floor (F-149) | unchanged; operator decision |
| 8 | **Two passes ran on the operator's `:1`** (self-authorised, P-12); a scratch `pkill` may have taken another agent's `:99` rig (F-146, P-13) | unchanged |
| 9 | **The server's PSS is unreadable** (non-dumpable), so `status` reports a LOWER BOUND | unchanged |
| 10 | **NEW (this session):** `config.yml:14` registers v1's extension; its `computer-use` tool is absent from the live surface | OPEN, mechanism unresolved (§3) |
| 11 | **NEW (this session):** the seal has drifted and no gate catches it (B2) | OPEN |
| 12 | **NEW (this session):** a plaintext API key in `~/.opencodereview/config.json` (B4) | OPEN, security |

**Blueprint deltas worth knowing (design vs built, measured):**
- PINEBOX §14 specifies `stages/shell.sh` and `stages/frame.sh`; the built tree has
  `stages/{load,page,services,verify}.sh` — shell and frame were folded into `page.sh` and the CLI.
- PINEBOX §12 P13 requires "≤5 chrome processes per instance"; the same document's §7F measures **11** for
  one `--app` chrome. Amendment B-A3 records the corrected invariant: *"the count after 3 loads ≤ the count
  before"*, which is what is enforced.
- PINEBOX §7A's known gap (`run.mjs:163`) is **a change under `pine-ide/pine-station/`** and conflicts
  with the frozen-page rule B1 inside a PINEBOX commit — it needs the renderer's draw path read first.
- §7F's memory budget, measured: **one instance = 753.5 MB** (chrome 553.0 + weston/Xwayland/shell 102.8
  + station 50.2 + rail 47.5); **seven = 5,274 MB**. The design deliberately does not pick a mitigation;
  `status --json` reports the measured PSS and the projection and the operator decides.

---

## §7 · THE ORDER TO "100 % PRODUCTION GRADE"

Ordered by what unblocks the most, with the exit each step can fail:

```
1  B1 — the C3 stack-top guard          exit: `computer shell_up id=3` returns a display on a
                                        desktop with ZERO X clients, and the FOCUS_STOLEN
                                        probe still FIRES when a raising click is injected
                                        (test/mutate.sh --slow must still go red)
2  B2 — wire `deploy.sh verify` into    exit: an edited sealed file makes BOTH chains exit non-zero
     both gate chains, then re-seal
3  B3 — fix the audit-gate invocation   exit: `GATE: PASS (0 critical/high)` or a real FAIL, with a
     (cwd = repo, relative --path)      session id, the file scope and a non-trivial duration
4  B4 — rotate + move the plaintext key exit: the provider resolves via api_key_cmd
5  V11 — build a guest image from       exit: one real guest boot with the framebuffer served
     core/guest/rootfs/manifest.txt
6  the E2 geometry (B-A8 / V-56)        exit: counts.polylines > 0 on a load, in its OWN commit,
                                        outside the frozen-page rule
7  the Pine/fixture date pairing        exit: plutus-vision-v2.pine renders against a fixture
8  the 88 untracked docs (F-149)        exit: the operator's decision (a/b/c) executed
9  the v3 expansion P1 → P4             exit: per verb, a must-fail case with its token rc=1, a
                                        legitimate case rc=0, and a `look` whose frame is OPENED
```

**Nothing above is started.** This document is the reconstruction; the order is the proposal.

---

## §8 · THE TRADING BUILD — WHAT RESUMING IT MEANS (and one ROT finding)

The operator's stated sequence is: *finish Pinebox + Computer Use to production grade, then resume the
trading build.*

**The build's own record, as it stands on disk:**

- **The rig IS PINEBOX.** `Checkpoints/computer-use-v2-focus-proven-2026-10-26/context_management/NEXT_STEPS.md`
  (dated 2026-10-22) sets **W0 = "the rig and the gate harness"**, with `W0.T1` = *"worktree + display +
  proof the display is NOT :0/:1/:2"* and `W0.T3` = *"the vision/rig/compare helpers"*. Pinebox and CU v2
  are that rig. **The tooling work and the build work are the same work.**
- **The wave plan:** `W0` rig+gates → `W1` purge → `W2` card field → `W3` sidecar → `W4` cast layer →
  `W5` render → `W6` verifier (frozen, ten unseen weeks, blind agent) → `W7` dashboard tab. Authority:
  `design/BUILD_WORKFLOW_v2.md:900` (the turns).
- **The three operator inputs still owed:** the ten held-out weeks (blocks W6.T2), the Protocol A source
  (blocks W3.T3+), and the golden week written into `.trident/goals/w5.md` (blocks W5.T7).
- **The baseline that must not move:** the V1 seal
  `0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1`, 1,270 lines, reproducible from its
  five modules by `python3 scripts/lqz_vision_build.py`.
- **The gate that is red:** `gates/anti/anti_patterns.py` → `rc=1`, 4 classes (A3 silent fallback,
  A9 15m creep in 27 files, A10 market-standard vocab — choch 488 · fvg 102 · premium 182 · discount 183,
  A12 docs-as-progress 5.9).

**⚠ ROT FOUND — the state docs are stale and must be re-measured before resuming.** The checkpoint's
`context_management/*.md` all carry the date **2026-10-22** and name as authority
`design/DESIGN_BLUEPRINT_v1.2_AUTHORITATIVE.md` (857 L) + `design/BUILD_WORKFLOW_v2.md` (2,916 L).
Measured today: **no `v1.2` document exists in `design/`** — the tree holds
`DESIGN_BLUEPRINT_v1.0_AS_DESIGNED.md`, `v2.0_AUTHORITATIVE.md`, `v3.0.md`, `v4.0_CLOUDFLARE.md`,
`v4.1_CLOUDFLARE.md` (62,344 B, 2026-10-26 08:32), plus `DESIGN_BLUEPRINT_AGENT_DESK_v3.md` and
`DESIGN_BLUEPRINT_P3_EVIDENCE_TICKET_JUDGE.md` (both 2026-10-26). The design has advanced **four
revisions past** what the state docs cite, and the session that advanced it is the one this report is
reconstructed from. **Resuming from those state docs without re-measuring is resuming from rot.**

---

## §9 · EVIDENCE APPENDIX — the exact commands behind every number above

```bash
# the session and its boundaries
python3 ~/.agents/skills/session-snapcompact-recall/scripts/recall.py compactions <S>
python3 ~/.agents/skills/session-snapcompact-recall/scripts/recall.py resume <S> --index -1

# the tools are live (through the tool surface, not the CLI)
computer action=probe ; pinebox verb=list ; pinebox verb=ports id=3

# B1 — the reproduced refusal and its mechanism
computer action=shell_up id=3
pinebox up --id 2 --week 2026-07-06 --pair DXY --tf 1H --pine <ema-ribbon.pine>
xprop -root _NET_CLIENT_LIST_STACKING ; xprop -root _NET_ACTIVE_WINDOW
xprop -root _NET_SUPPORTING_WM_CHECK
~/.cache/computer-use/lib/hostwin :1 top ; ~/.cache/computer-use/lib/hostwin :1 active
grep -o 'top=0x[0-9a-f]*' /run/user/1000/computer-use/i2/c3-up.timeline | sort | uniq -c
grep -n 'b_top=\|a_top=\|stack top moved\|stack top was' .../core/govern.sh

# B2 — the drift
~/.omp/agent/extensions/computer-use-v2/deploy.sh verify
grep -E 'pinebox/pinebox$' .../computer-use-v2/MANIFEST.sha256
sha256sum .../scripts/pinebox/{pinebox,stages/verify.sh,test/run.sh}
grep -c 'pb_verify\|pb_week' .../scripts/pinebox/pinebox

# B3 — the gate
ocr --version ; ocr session list ; ocr scan --help
cd ~/JARVIS_WORKSPACE/Shared_Workspace && ocr scan --preview --path <ABS>     # fails
cd ~/.omp/agent && ocr scan --preview --path extensions/computer-use-v2/core  # 20 files

# the record
git -C ~/.omp/agent log -3 ; git -C <PLUTUS_VISION> log -18
wc -l < .../computer-use-v2/MANIFEST.sha256          # 63
find .../computer-use-v2 -type f | wc -l             # 47
find .../scripts/pinebox -type f | wc -l             # 16
wc -l < /run/user/1000/computer-use/refusals.jsonl   # 35
```

**END OF REPORT.** Every inherited claim above is labelled as inherited; every measurement labelled as
measured today. Where the two disagreed (the seal, the audit gate's blocker, the C3 oracle's limit) the
measurement is stated and the disagreement is named.
