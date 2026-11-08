PLUTUS_PINE_IDE_CONTEXT_HANDOVER — FULL CONTEXT HANDOVER
========================================================
PLUTUS VISION · the standalone Pine IDE + three liquidity deliverables (D1/D2/D3 + the v0
parity reference). Built 2026-10-02 at tree HEAD 53a29ac. Consumer: a WEB AGENT with its own
computer/sandbox and ZERO access to the machine that produced this, or any fresh local session.

PASTE ORDER
-----------
1. 00_HANDOVER/PLUTUS_PINE_IDE_CONTEXT_HANDOVER.md
   Primary-agent memory: the operator's rulings, the freeze, the dead paths, the drive contract.
2. 01_BINDING_SPEC/SPEC.md
   The only build spec. LAW. (Then GOAL_PIN.txt for the mission + its proof contract.)
3. 00_HANDOVER/PINE_IDE_OPERATORS_MANUAL.md
   The runbook: headless + headed launch, the API contract, symptom->action.
4. 05_DOCTRINE_READ_ONLY/
   WHAT the indicators ARE (the E1 zone-geometry layer of the TTE). READ-ONLY.
   Start with VISUAL_TELESCOPE_CHARTING_T2.md section 13 (the LQZ pattern criteria).
5. 04_REFERENCE_LIBRARY/LIBRARY_REFERENCE.md + ALL_OCR.txt
   The measured refinement target. Re-run the OCR counts yourself (section 2).
6. 02_PINE_IDE/
   The FULL INJECTABLE. Extract, run `bash setup.sh`, then the manual section 3 (headless).
7. 03_SUPERSEDED_READ_ONLY/
   History + forensics. DO NOT IMPLEMENT ANYTHING FROM HERE.
   (In particular: the OPERATING_MANUAL.md there is the OLD root copy. The manual in
   00_HANDOVER/ WINS.)

CONFLICT RULE
-------------
If handover conflicts with BINDING spec on implementation detail, BINDING wins.
If BINDING conflicts with a superseded spec, BINDING wins.
Dead paths in the handover override any superseded "v1 daemon / keep-alive" language.

THE FOLDERS
-----------
  00_HANDOVER/            the handover .md + this README + the operators manual + the kick prompt
  01_BINDING_SPEC/        SPEC.md (fence v2, job: fence) + GOAL_PIN.txt + DPL1_SPEC.md
  02_PINE_IDE/            the injectable: pine-ide/ (station incl. node_modules, kernel, renderer,
                          chart/charts/tv-feed), scripts/, launch-pine-ide, fixtures/, the three
                          .pine deliverables + the v0 parity reference, plutus-vision-lqz/, setup.sh
  03_SUPERSEDED_READ_ONLY/ history: the ship docs, the 12 canon docs, the reports
  04_REFERENCE_LIBRARY/   the operator's 39-frame WINNING_TRADE_LIBARARY + ALL_OCR.txt +
                          LIBRARY_REFERENCE.md (the MEASURED vocabulary + the correction)
  05_DOCTRINE_READ_ONLY/  what the indicators ARE: the Trident four-element doctrine, the E1/E2/E3
                          macro context, the TTE engineering spec, the architecture bible, the
                          project's DPL1 spec. READ-ONLY — read, never modify.

THE FREEZE (verify these before trusting anything)
--------------------------------------------------
  lqz-luxalgo.pine       sha256 db06b60574125039...   (D1)
  lqz-plutus.pine        sha256 68881deaca0c66a1...   (D2)
  plutus-vision-v1.pine  sha256 82da437af969a315...   (D3 — OPERATOR-APPROVED)
  plutus-vision-v0.pine  sha256 605bff82d3539e9e...   (THE PARITY REFERENCE — NEVER EDIT)
  engine: pinets 0.10.0 / @luxalgo/vela-pinets 0.2.14 / vela 0.8.0

DEAD PATHS (do not inherit them)
--------------------------------
  * "Sellside/Buyside Liquidity" / "Liquidity Void" library tags — MEASURED FALSE: 0 occurrences
    of Sellside, Buyside, LQ, Void across all 39 library frames (see 04_REFERENCE_LIBRARY/
    ALL_OCR.txt and LIBRARY_REFERENCE.md section 0). The label wiring built on that claim was
    REVERTED; D3 restored bit-for-bit to the approved 82da437af969a315 (commit 53a29ac).
  * a fallback/synthetic zone when a detector is starved — zero zones is the CORRECT output.
  * pinning an older engine to "fix" SWEEPS — the lock and the disk AGREE; there is no drift.
  * editing plutus-vision-v0.pine or sources/*.pine — both are frozen.
  * a local VLM as the visual verdict; a gate line as evidence; a capture nobody opened.

SECRETS SWEEP (what was checked and what was excluded)
------------------------------------------------------
Swept every packed tree for `.env*`, `*.pem`, `*.key`, `id_rsa*`, `credentials*`, and the
patterns API_KEY / SECRET / TOKEN / BEGIN ... PRIVATE KEY.
  RESULT: no .env file, no key file, no credential file exists in any packed tree.
  The only pattern hits were the literal word TOKEN used as a CSS design-token identifier
  (tokens.css, STATIC_TOKENS in the chart bundles) and ONE non-secret local dev fallback:
      pine-ide/ide/renderer/app.js:22  AUTH_TOKEN: 'rw_dev_plutus_backtest'
      pine-ide/ide/renderer/pine.html:13  authToken: 'rw_dev_plutus_backtest'
  That string is a placeholder bearer for a LOCALHOST-ONLY dashboard API (:9430) that this pack
  does not include and a foreign agent cannot reach. It is documented rather than scrubbed
  because it is present in pine.html — the IDE page itself — and removing it would break the
  page while removing nothing real. NO credential to any reachable service is in this pack.
EXCLUDED FROM THE PACK (not secrets — size/history): .git/ · Checkpoints/ (full tree copies;
ancestry listed in the handover Appendix B) · evidence/ + vil/ (runtime PNGs and ledgers) ·
node_modules outside pine-station/ · *.bak-* copies · pine-ide-fork/ · packages/ scaffolding
(except DPL1_SPEC.md) · probes/, parity_frames/, vision_frames/, rig/.

PROOF
-----
The proof definition is in the handover, section 9. Agent prose is not proof.
FIRST REPLY (mandatory): the four SHAs, the three compile titles with counts, SERVED_PINE_OK,
and the four OCR zero-counts. See 00_HANDOVER/KICK_PROMPT.md.
