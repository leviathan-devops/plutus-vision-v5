# DEBUG LOG — PLUTUS VISION · computer-control cycle (2026-10-26)

> **THIN-SESSION NOTE (honest, per the ship-package skill):** this doc is 286 lines, below the 1000-line
> floor. The material available for it this cycle was a single build session, and it was NOT
> inflated with whitespace or repetition. The gap is the session's size, not a suppressed record:
> the full evidence lives in the repo's own DEBUG_LOG.md, FAILURE_LOG.md and THEATRICALITY_LOG.md,
> which are copied into this package unmodified.

Every entry carries symptom → root cause → fix → verification → lesson. Every verification names the
command and its output; a lesson without its evidence was not a lesson.

## BUG SUMMARY

| id | one line |
|---|---|
| EN-140 | see the entry |
| EN-141 | see the entry |
| EN-142 | see the entry |
| EN-147 | see the entry |
| EN-148 | see the entry |
| EN-149 | see the entry |
| EN-150 | see the entry |
| EN-151 | see the entry |
| EN-152 | see the entry |
| EN-153 | see the entry |
| EN-154 | see the entry |
| EN-155 | see the entry |
| EN-156 | see the entry |
| EN-157 | see the entry |
| EN-158 | see the entry |
| EN-159 | see the entry |
| EN-160 | see the entry |
| EN-161 | see the entry |
| EN-162 | see the entry |
| EN-163 | see the entry |


# EN-163 — the extension that never loaded: `export function init()` is not a factory

- **THE FINDING:** on every session start:
  `Warning: Failed to load extension ~/.omp/agent/extensions/snapcompact-read-frames.ts: Extension
  does not export a valid factory function`.
- **THE ROOT CAUSE:** the file exported `export function init(pi: any)` and no default. The loader
  looks for a default export (the shape every other extension in this directory uses: `export
  default function`, or `export { x as default }`). So the file was skipped on every boot while its
  intent — force the agent to read snapcompact image frames — was silently absent.
- **THE FIX:** moved to `~/.omp/agent/extensions-disabled/` (recoverable, not destroyed) and its entry
  removed from `config.yml`'s `extensions` with `omp config set` — the config gate refuses a hand
  edit (`ORDER_config-hand-edit`). 14 extensions remain, all exporting a factory.
- **THE VERIFICATION:** a check over every enabled extension (file exists AND matches
  `export default|export {… as default}|module.exports`) reports 14 enabled, 0 with a problem; the
  other three direct-file extensions (`jarvis-*.js`) already used `export { x as default }`.
- **THE LESSON:** the loader's factory contract is the SPEC, and a file that fails it produces a
  warning that is easy to read past on every single boot. A one-line sweep over the enabled list —
  "does each export a factory?" — turns a per-boot warning into a single check.

# EN-162 — a mapped instance carried `_NET_WM_STATE_DEMANDS_ATTENTION`

- **THE FINDING:** immediately after `up` on the operator's display, the compositor's host window
  reported `state=[_NET_WM_STATE_DEMANDS_ATTENTION]` while `usertime=0`, the focus was untouched
  (`active=0x0`) and the window sat at the BOTTOM of the stack. Focus and stacking were correct; the
  window was still ASKING to be noticed.
- **THE ROOT CAUSE:** something requests activation on that window (weston forwarding a client's
  request, or its own focus handling); the window manager cannot grant it with a zero user-time, so
  it converts the request into "demands attention" — the flag that makes a taskbar entry flash. The
  C3 contract covered focus and stacking and did not cover attention, so a flash could survive a
  PASS.
- **THE FIX:** `hostwin release` now removes `_NET_WM_STATE_DEMANDS_ATTENTION` in the SAME flush as
  remove-BELOW and the restack, so the flag cannot outlive `up`.
  `helpers/hostwin.c` (release verb), sha 88579d713640.
- **THE VERIFICATION:** the running instance went from `state=[_NET_WM_STATE_DEMANDS_ATTENTION]` to
  `state=[]` on one `release`, focus/stack unchanged; and a FRESH `up` now comes up at `state=[]`.
- **THE LESSON:** "does not take the focus" and "does not ask for attention" are different
  properties. A window can be perfectly well-behaved by the focus oracle and still blink at the
  operator — so the oracle needs to read the window's own state list, not only the WM's focus record.

# EN-161 — `WINDOW_GONE` was two conditions wearing one token

- **THE FINDING:** `computer screenshot --id 3` on a live instance refused
  `WINDOW_GONE: instance 3 has no bound window`.
- **THE ROOT CAUSE:** `win_of` refused `WINDOW_GONE` when nothing had been bound yet, while
  `win_check` refuses `WINDOW_GONE` when a bound window has since vanished. Those are different
  facts and they call for different next actions: the first means "spawn an app, then bind", the
  second means "your binding went away".
- **THE FIX:** `core/drive.sh:60` refuses `NO_WINDOW_BOUND` with the spawn-then-focus remedy;
  `WINDOW_GONE` is left to mean only what it says.
- **THE VERIFICATION:** on a fresh instance, `shell_spawn` then `screenshot` → `{"bytes":268,
  "colours":12,"via":"x","c3":"held"}`; the refusal path now names `NO_WINDOW_BOUND`.
- **THE LESSON:** a token is a caller's only branch key. Two conditions behind one token force every
  consumer to guess, and the guess is wrong half the time.

# EN-160 — the xvfb adapter's probe was a DEAD DETECTOR that accepted a failure as evidence

- **THE FINDING:** `computer probe` reported `{"adapter":"xvfb","available":true,"reason":"",
  "evidence":{"xvfb":"Unrecognized option: -version"}}` — an adapter declared available on the
  strength of its own failure message.
- **THE ROOT CAUSE:** the probe ran `Xvfb -version`, which exits 1 on this host, and then matched
  `*X*erver*|*Xvfb*|*X.Org*|*version*` against the output. The string
  `Unrecognized option: -version` CONTAINS the word "version", so the pattern matched the error.
  A detector that accepts any output containing a word it looks for cannot distinguish success from
  failure — it reports whatever it is given.
- **THE FIX:** the discriminator is `Xvfb -help` (rc 0, prints `use: X [:<display>] [option]`), and
  the rc is taken from the COMMAND. `core/adapters/xvfb.sh:31`.
- **THE SECOND BUG FOUND WHILE FIXING IT:** the first attempt captured `Xvfb -help | head -1` and
  read `$?` — which is the PIPE's status, and `head` exiting early makes the writer die of SIGPIPE, so
  the adapter reported `Xvfb -help exited 141` for a working binary. The rc must come from the command,
  so the whole output is captured first and the first line taken after.
- **THE VERIFICATION:** real Xvfb → `available:true`, evidence `use: X [:<display>] [option]`; a fake
  `Xvfb` that exits 1 → `available:false`, `reason:"Xvfb -help exited 1"`; through the tool, all four
  adapters now report honestly.
- **THE LESSON:** a probe's pattern must be anchored to a SUCCESS SHAPE (a usage line, an rc), never
  to a word that also appears in the failure. And `$?` after a pipe measures the last stage.

# EN-159 — readiness requiring HTTP 200 reported a live, listening service as DOWN

- **THE FINDING:** the rail came up, listened on its port, answered, and the record said `rail: down`.
- **THE ROOT CAUSE:** `pb_http_ok` demanded the exact status 200 on `GET /`; the rail's `/` is not a
  200 route. The service was up; the predicate was wrong.
- **THE FIX:** `pb_http_answers` — a service is up when it ANSWERS (any HTTP status); only the PAGE
  requires a 200, because the page is the thing being served.
- **THE VERIFICATION:** `status` and the page's own status row now read `rail : <port> · station UP`.
- **THE LESSON:** "up" and "correct" are different predicates. Demanding the strong one where only the
  weak one applies turns a healthy subsystem into a false failure — and a false failure is how a real
  one later gets ignored.

---

# EN-158 — a window search by TITLE finds nothing when the title is the URL

- **THE FINDING:** `chrome opened no window` even though a window had mapped.
- **THE ROOT CAUSE:** the search was `xdotool search --name 'Plutus'`; a chrome `--app=` window's
  title is the page's title, which here was `127.0.0.1`. The profile also maps 10x10 helper windows
  (`Chromium clipboard`), so "any window" is not the answer either.
- **THE FIX:** find by GEOMETRY — the largest new window (width > 400) is the app's client area;
  PINEBOX stage 3 uses the same rule and records `app_win`.
- **THE VERIFICATION:** the window is found and driven (`4194307 127.0.0.1 1625x930`); `app.log`
  shows the dispatched `ButtonPress … (100,100)` and the `KeyPress` events arriving.
- **THE LESSON:** address a window by a property that is stable and yours (size, id, the core's own
  spawn record), not by a string the application chooses.

# EN-157 — the E1 theory was wrong, and its machinery was removed rather than kept

- **THE FINDING:** the loaded chart framed to a ONE-HOUR window at the last bar, showing nothing,
  while the engine reported 508 bars and 32 drawn objects.
- **THE FIRST THEORY (WRONG):** the server hands the page the NEWEST E1 zone file while the fixture
  was a different week, so the zones were priced for another week and the extent stretched the view.
  Machinery was built on it: a per-instance E1 directory (symlinks) and an `E1_ABSENT` refusal.
- **THE MEASUREMENT THAT KILLED IT:** pinning E1 to the fixture's week changed NOTHING — same extent
  (`2026-06-26 → 2026-10-25`), same one-hour window. The zones on this chart do not come from the E1
  route at all; they are baked into the Pine SOURCE.
- **THE ACTUAL CAUSE:** `plutus-vision-v2.pine` (mtime 2026-10-25) contains October timestamps
  (`1791144000000` = 2026-10-04 … 2026-10-25) while every bar fixture in the repo ends 2026-07-21;
  `pv-load.mjs:66-67` frames to the geometry's extent, which the chart clamps to a one-hour window
  pinned at the last bar.
- **THE FIX:** the machinery was REMOVED (E1 pin and `E1_ABSENT` deleted — an invented refusal blocks
  weeks that would otherwise work), and the stage-5 acceptance uses a fixture-matched source
  (`test/fixtures/ema-ribbon.pine`). The data pairing itself is recorded as the operator's to resolve.
- **THE VERIFICATION:** with the matched source, 508 bars and candles + both EMAs + 4 triangles in the
  OPENED frame, on a replica AND on the real desktop.
- **THE LESSON:** a theory that produced a plausible-looking refusal was still a theory. The test that
  killed it cost one `up` and one `evaluate`. Build the probe before the machinery.




## ARCHITECTURE DECISIONS

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
  boilerplate); `test/` (9 gates); `deploy.sh` (seal/install/ver


## REGRESSION WATCH

These are the classes to re-check on any change to the compositor path, the binding code, or the app layer:

1. a mapped window's `_NET_WM_STATE` must be empty after `up` (attention flag, EN-162);

2. `stack` must have our window at the BOTTOM and `usertime` must read 0 (EN-140);

3. replaying `up` 60 times must produce 0 focus changes (EN-141);

4. every adapter's probe must FAIL when its underlying command fails (EN-160);

5. a refusing helper substituted in `$()` without `|| exit $?` is a leak (EN-144);

6. a LISTEN row with an invisible owner is a HELD port (EN-143).


## IRON LAWS FROM THIS CYCLE

1. A window manager reads properties; it is never adversarial. Measure `_NET_ACTIVE_WINDOW` and the top

   of `_NET_CLIENT_LIST_STACKING`, by identity, over every sample — not before/after only.

2. A probe must assert a SUCCESS SHAPE (a return code, a usage line, a token). Matching a word that also

   appears in the failure makes a dead detector that reports its own error as evidence.

3. One token per condition. `WINDOW_GONE` for "nothing bound yet" forced every caller to guess.

4. An intermittent fix needs a TIMELINE, not a theory. Three theories were wrong before the marked

   timeline named the exact step in one run.

5. Prevention beats repair. A guard loop that re-focuses a window on a timer IS the defect it patches.

