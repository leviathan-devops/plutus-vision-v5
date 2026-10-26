---
name: measure-focus-theft-on-replica
description: "Use when a headed window (weston, chrome, any compositor) steals the operator's focus or comes to the front, or when verifying computer-use-v2 / pinebox C3; measures it on an isolated replica display, never the operator's screen."
---

# Measure focus theft on a replica display (never on the operator's screen)

THE LAW: a focus/raise bug is a WINDOW-MANAGER fact. Measure the WM's own record, on a display
that is not the operator's, with controls that can read a theft, THEN confirm once on the real
display. Never `xdotool windowactivate` a window "to see if it works": that IS the theft.

## The instrument (all under ~/.omp/agent/extensions/computer-use-v2/)
- `test/replica.sh up` -> a real X framebuffer + mutter (`--x11`) as its WM, on a fresh display in
  **:200-:230 only**. `replica.sh operator D` maps a focusable stand-in window and focuses it.
  `replica.sh down D` REFUSES (REPLICA_FOREIGN) any display outside the range. Do not use other
  patterns: `pkill -f 'Xvfb.real :9[0-9]'` matches another agent's `:99` rig.
- `helpers/hostwin` (xcb, EWMH): `active`, `top`, `stack`, `clients`, `state W`, `usertime W`,
  `viewable W`, `release W`, `lower W`, `raise W`. The ORACLE is `_NET_ACTIVE_WINDOW` plus the top of
  `_NET_CLIENT_LIST_STACKING`, read from the WM, compared BY IDENTITY to the windows this tool owns.
- ONE display per case. Reusing a display accumulates clients and voids the measurement
  (`rig_clean`: refuse RIG_DIRTY unless exactly the operator window is present).

## Controls (an oracle that cannot read a theft proves nothing)
1. NEGATIVE: do nothing for a second -> must read UNCHANGED.
2. POSITIVE: a raw compositor with NO interposer -> must read STOLEN.
3. POSITIVE: `view --confirm` (the one permitted raise) -> must read RAISED.
A positive that fails to read = INSTRUMENT_INVALID (exit 3), never a pass. `xeyes` is NOT a valid
positive (it takes no input focus); use `xmessage`.

## The root cause (measured 2026-10-26, mutter 46.2) and its fix
weston's x11 backend (libweston-13/x11-backend.so) maps its host window with no `_NET_WM_USER_TIME`
(0 of 11 atoms) -> the WM focuses it on map and puts it on top. FIX = `helpers/nofocus.c`
(LD_PRELOAD on `xcb_map_window`): `_NET_WM_USER_TIME=0` + `_NET_WM_STATE=[BELOW]` before the map, then
`hostwin release` = remove-BELOW + `_NET_RESTACK_WINDOW` lower in ONE flush, verified on the WM stack.
Releasing BELOW alone drops the window on TOP of the normal layer (25 ms later); a lower issued
BEFORE the release is a no-op. Driving an instance afterwards (X input, CDP) was measured not to
raise anything, on 11 rungs.

## Traps that cost an hour each
- A rate, not an anecdote: the first fix failed ~11% (3/24, 5/45). A single green run proved nothing;
  run the sequence 40-60 times with a sampler (30 ms) over the whole operation and count any sample
  with your window above the operator's. 0/60 after the real fix.
- Add a marked TIMELINE (`c3_mark`, `C3_SAMPLE_DEBUG=1`, `C3_SAMPLES_KEEP`) before theorising: it
  showed the failure was at the RELEASE, not the map.
- `ss -p` / `fuser` / `lsof` cannot name a non-dumpable process's listener, and
  `/proc/<pid>/smaps_rollup` is Permission-denied for the same uid. A LISTEN row is a HELD port.
  Never read "owner not visible" as "free" or a hidden PSS as 0.
- `refuse` inside `$(...)` exits only the subshell: every refusing helper substituted without
  `|| exit $?` makes the caller carry on (printed 3 refusals; once printed "ok" for an empty value).
- `cmd | grep -q` under `set -o pipefail` reports SIGPIPE on the writer even when the token matched.
- A test's own control compositor leaked one process per run until it was torn down by PROCESS GROUP
  with KILL escalation and the teardown was verified. End every chain with `test/leak-check.sh`.

## The real-display confirmation (once, operator away or told)
`bash test/c3-no-raise.sh --real` (baselines `active` and `top` SEPARATELY: on Wayland the focused
window may be native, active=0x0). It can read X focus/stack only, not a Wayland-native window.
