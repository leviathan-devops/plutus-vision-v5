You are the builder/operator of the PLUTUS VISION Pine IDE, handed a self-contained pack
(PLUTUS_PINE_IDE_CONTEXT_HANDOVER.zip). You have your own machine and NO access to the
machine that produced it. Read, in order:

  1. README.txt (zip root)
  2. 00_HANDOVER/PLUTUS_PINE_IDE_CONTEXT_HANDOVER.md      <- the rulings, freeze, dead paths
  3. 01_BINDING_SPEC/SPEC.md and 01_BINDING_SPEC/GOAL_PIN.txt
  4. 00_HANDOVER/PINE_IDE_OPERATORS_MANUAL.md
  5. 05_DOCTRINE_READ_ONLY/VISUAL_TELESCOPE_CHARTING_T2.md §13 (what a zone IS)

Then DO THIS, in this order, and reply with EVIDENCE ONLY (verbatim tool output, file:line,
sha256[:16]) — never prose verdicts, never a plan:

  A. Extract 02_PINE_IDE/ and run `bash setup.sh` (npm install in pine-ide/pine-station).
  B. Start the HEADLESS rig (manual §3): station on :9741, renderer+bars on :9851.
     Probe liveness by COMPILE: POST /run a trivial probe and require "success":true.
     (NEVER probe GET / on :9741 — it can hang on a WORKING station.)
  C. `sha256sum` the four deliverables and confirm:
        lqz-luxalgo.pine      db06b60574125039...
        lqz-plutus.pine       68881deaca0c66a1...
        plutus-vision-v1.pine 82da437af969a315...   (OPERATOR-APPROVED — do not change it)
        plutus-vision-v0.pine 605bff82d3539e9e...   (PARITY REFERENCE — NEVER EDIT)
  D. Compile each of D1/D2/D3 via POST /run (limit 1603, EUR/USD, 1H) and assert each TITLE:
        LQZ LuxAlgo . LQZ Plutus — operator candle liquidity . Plutus Vision v1
     Post the three JSON count blocks verbatim.
  E. Run `bash scripts/verify_served_pine.sh` -> require SERVED_PINE_OK.
  F. Re-derive the library vocabulary yourself from 04_REFERENCE_LIBRARY/ALL_OCR.txt:
        grep -o 'Sellside' ALL_OCR.txt | wc -l   -> MUST be 0
        grep -o 'Buyside'  ALL_OCR.txt | wc -l   -> MUST be 0
        grep -o 'LQ '      ALL_OCR.txt | wc -l   -> MUST be 0
        grep -o 'Void'     ALL_OCR.txt | wc -l   -> MUST be 0
     These are DEAD PATHS. Do not emit "Sellside/Buyside Liquidity" labels. Ever.
  G. Only then continue the refinement stream (R-13): the lever is the zone-FILL layer in
     plutus-vision-lqz/lqz-render.pine (lqzFill3 / lqzFillA / lqzLineTol), by INPUT VALUES.
     Regenerate -> redeploy the served copy -> SERVED_PINE_OK -> compile -> LOOK (or state UNRUN).

HARD RULES: never edit plutus-vision-v0.pine or sources/*.pine. Never hand-edit *.bundle.js.
Never add a fallback band. Never quote a gate line as evidence. A capture nobody opened is not
evidence. A blocked op names its resume — it is never a pass.

FIRST REPLY: the four SHAs, the three compile titles with counts, SERVED_PINE_OK, and the four
OCR zero-counts. That is it.
