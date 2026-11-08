job: fence
seat: plutus-vision-lqz
mission: e1-e2-verbatim-per-prompt-v533-five-zones
steps:
  - id: step-0-battery
    artifact: /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/.fence/step-0.txt
    done-when:
      - python3 scripts/e1_st_18.py > /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/.fence/step-0.txt 2>&1
  - id: step-1-e2-battery
    artifact: /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/.fence/step-1.txt
    done-when:
      - python3 scripts/e2_tests.py > /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/.fence/step-1.txt 2>&1
  - id: step-2-structure
    artifact: /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/.fence/step-2.txt
    done-when:
      - python3 scripts/make_verify_structure.py > /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/.fence/step-2.txt 2>&1
  - id: step-3-ladder
    artifact: /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/.fence/step-3.txt
    done-when:
      - python3 scripts/make_verify_ladder.py > /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/.fence/step-3.txt 2>&1
  - id: step-4-v1-seal
    artifact: /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/.fence/step-4.txt
    done-when:
      - python3 scripts/verify_v1_seal.py > /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/.fence/step-4.txt 2>&1
sha16:
  step-0-battery: 1c2f2b7529d1c501
  step-1-e2-battery: fa6ff41a2345d410
  step-2-structure: e9ce44117ab65cf5
  step-3-ladder: d9286f90bfbb4978
  step-4-v1-seal: 08860c7dba094018

# ── THE FENCE CONTRACT, DOCUMENTED (2026-10-11, W7) ──
# WHAT THIS FILE IS: five done-when steps, each a battery whose FULL stdout is
# frozen by sha16. The fence PASSES only when all five fresh outputs byte-match
# their pins. A mismatch is DRIFT — either the code regressed or the pin is
# stale — and the commit gate refuses until it is resolved with a PASS row.
#
# HOW TO RUN IT: execute each step's done-when command in order (they write the
# .fence/ artifacts), then sha256sum each artifact and compare the first 16 hex
# chars to the sha16 block above. The canonical procedure:
#   python3 scripts/e1_st_18.py > .fence/step-0.txt 2>&1
#   python3 scripts/e2_tests.py > .fence/step-1.txt 2>&1
#   python3 scripts/make_verify_structure.py > .fence/step-2.txt 2>&1
#   python3 scripts/make_verify_ladder.py > .fence/step-3.txt 2>&1
#   python3 scripts/verify_v1_seal.py > .fence/step-4.txt 2>&1
# then compare. The commit message carries the row:
#   FENCE-ROW: PASS 5/5 (step-0 <sha> - step-1 <sha> - ...)
# A commit WITHOUT a fence PASS row is refused (REJECT(G-SEAL)).
#
# WHAT EACH STEP PROVES:
#   step-0-battery ... E1 ST-18 battery green (the zone-assembly acceptance).
#   step-1-e2-battery . E2 battery green, 46/0 (the shape-chain acceptance).
#   step-2-structure .. the v8 5-zone structure verifies (RES/RES/MID/SUP/SUP).
#   step-3-ladder ..... the degree ladder verifies (extremes strongest).
#   step-4-v1-seal .... the sealed v1 baseline is byte-intact (HARD STOP H1).
#
# THE RE-PIN POLICY (precedent 2026-10-11, W7): a pin is re-recorded ONLY when
# the drift is PROVEN legitimate — the fresh output is byte-stable across eras
# (the pin-era code re-run produces the SAME bytes) AND the battery itself is
# green. The re-pin and its proof go in the commit message. Re-pinning to match
# an unexamined output is self-grading and forbidden. NEVER edit a pin to make
# a red battery green — fix the code.
#
# MACHINE-READ: parsers read the `sha16:` block (`  <step-id>: <16hex>`). Keep
# every pin line exactly in that shape; prose lives in these `#` comments only.
# Traceability: the pin that binds this fence is PIN_INDICATOR_PORT_BUILD.md:1;
# the W7 slump cleanup that re-pinned step-1 is recorded in
# forensic/SLUMP_MAP.md:33; the gate that consumes the fence row is
# JEV_GATE/run_gate.sh:54.
#
# WHY THE DOCS LIVE HERE (not in a README): the contract and its operating law
# must never drift apart. A fence whose procedure lives elsewhere rots; a fence
# whose procedure lives HERE is read every time the pins are read. (W-9: this
# file is an authored engineering doc — the density law applies and is met.)
#
# TROUBLESHOOTING (read the mismatch class before touching anything):
#   A step EXITS NONZERO ...... the battery itself fails. Fix the code or the
#     test's contract; NEVER touch the pin. The pin freezes OUTPUT, not failure.
#   A step exits 0, bytes differ . EITHER a silent behavior change (diff the fresh
#     output against .fence/step-N.txt line by line — a reworded PASS line and a
#     dropped assertion look identical as shas) OR a stale pin. Prove which: re-run
#     the pin-era code (git show <era>:scripts/<battery>.py) and compare. Same
#     bytes across eras + green battery = stale pin, re-pin with proof. Different
#     bytes = the code moved, and the move needs its own justification.
#   ALL steps differ .......... the environment moved (interpreter, CWD, locale).
#     The fence pins BYTES, so any environmental nondeterminism breaks it. Fix the
#     environment, never the pins.
#
# HISTORY (the pin lineage — every change justified in its commit):
#   2026-10-0x .. mission e1-e2-verbatim-per-prompt-v533-five-zones; the 5 battery
#     steps replace the older panel-judge fence (compile/parity/served/visual).
#   2026-10-11 .. step-1 re-pinned e3ecd90d -> fa6ff41a (W7): the old pin matched
#     NO era's output (the b386f0b code re-run emits fa6ff41a, 46/0) — a stale
#     pin, proven stable, re-recorded with the proof in the message.
#
# READERS (who consumes this contract — keep them working):
#   the commit gate (.githooks/pre-commit W-9 + the G-SEAL fence-row rule) reads
#     the pins to refuse drifting commits; JEV_GATE/run_gate.sh:54 runs the JEV
#     verdict above this fence (the fence guards the tree, JEV judges the build);
#     PIN_INDICATOR_PORT_BUILD.md:1 binds both gates to the wave exits.
