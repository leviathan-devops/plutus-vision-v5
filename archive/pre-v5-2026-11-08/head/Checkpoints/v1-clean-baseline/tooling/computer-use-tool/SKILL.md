---
name: computer-use-tool
description: "Drive and verify any live GUI product with the first-class computer-use tool — one-call screenshots returned as image blocks (the read-tool equivalent), window-relative input, and rails that make the theatrical path harder than the honest one: verdicts refuse without a look and without a written expectation, \"PASS but the labels overlap\" refuses, ack-without-a-reason refuses, and completion claims are generated from the ledger with sha256s. Use for any product verification, UI testing, dashboard/canvas checking, or \"look at this on the display\" task."
---

---
name: computer-use-tool
description: "Drive and verify any live GUI product with the first-class computer-use tool — one-call screenshots returned as image blocks (the read-tool equivalent), window-relative input, and rails that make the theatrical path harder than the honest one: verdicts refuse without a look and without a written expectation, 'PASS but the labels overlap' refuses, ack-without-a-reason refuses, and completion claims are generated from the ledger with sha256s. Use for any product verification, UI testing, dashboard/canvas checking, or 'look at this on the display' task."
---

# computer-use — the direct-look product-test tool

`~/.omp/agent/extensions/computer-use/index.js`, wired in `~/.omp/agent/config.yml`.

It exists because on 2026-10-01 a six-hour session "verified" a product with a 4B local VLM
answering four presence questions, batched screenshots, background jobs between action and
observation, and a video nobody watched — and produced PASS on frames the agent had itself
found defective. **The rails make the theatrical path more expensive than the honest one.**

## START HERE — `action=look` is the whole read-tool equivalent

```
computer-use action=look title="Plutus Vision"     # binds the window + returns the PNG
                                                    #   AS AN IMAGE BLOCK. One call.
```

Do not hand-roll `import -window` + `read` when a live app is the target. The tool does the
window lookup, the display resolution, and the origin translation, and the pixels arrive as an
attachment.

## Use

```
computer-use action=displays                       # discover displays + windows (never hardcode)
computer-use action=focus title="Plutus Vision"    # bind target; returns origin + size
computer-use action=expect expectation="..."       # the named ruler, BEFORE interacting
computer-use action=click x=400 y=500              # WINDOW-RELATIVE coords, tool does the origin math
computer-use action=type text="..."  ·  key keys="ctrl+a Return"  ·  drag x,y,x2,y2
computer-use action=look  ·  action=screenshot     # returns the PNG AS AN IMAGE BLOCK
computer-use action=verdict verdict=PASS found="..." missing="..." wrong="..."
computer-use action=ack note="..."                 # claim interactions WITHOUT a look (recorded as a gap)
computer-use action=report                         # verdicts + look-ratio + refusals + acks + overrides
computer-use action=claim                          # the completion statement, GENERATED with the
                                                    #   sha256s — REFUSED with zero verdicts behind it
```

## The rails (each refuses AND records the refusal as a named delta)

- every mutating action increments `unobserved`
- `look` / `screenshot` returns the image and clears it
- `verdict` **REFUSED** when `unobserved > 0` — "you cannot judge a state you did not look at"
- `verdict` **REFUSED** when no `expect` was written (the ruler must precede the observation)
- `verdict` **REFUSED** when no screenshot exists in the run
- `verdict` **REFUSED** for `PASS` carrying `missing`/`wrong` unless `force=1` — "PASS, but the
  labels overlap" is the theatrical shape; it is a FAIL with named deltas, or a fixed defect.
  A forced PASS is logged as an override and counted by `report`.
- `ack` **REFUSED** without a `note=`; with a reason it is recorded permanently as a gap
- `claim` **REFUSED** when zero verdicts are recorded; the statement it emits carries every
  frame's sha256, so a hand-written completion line has nothing to cite
- `report` prints the **look-ratio** (frames ÷ interactions) and counts refusals/acks/overrides
- **no model fallback** — the tool never calls a VLM

The look-ratio is the audit surface for the one bypass the tool cannot see: a bash-driven
`import` + `read` never reaches this ledger, so a low ratio is the tell.

## Display topology (measured, 2026-10-01)

| display | geometry | contents |
|---|---|---|
| `:0` / `:99` | 1920×1080 | the OMP/Orca session (MetaTrader lives here) |
| `:3` | 1638×996 | the nested-weston agent display — apps built for computer use live here |

**The `computer` eval facade is bound to the kernel's `DISPLAY` (`:99`) at construction and
cannot be repointed** — `capabilities().displayCount === 1`, no per-call display argument, and
`env("DISPLAY", ":3")` is ignored. Repointing it is a host-level launcher change, and moving
`:99` is not advisable (another session's work lives there). Until then this tool IS the
equivalent and better: real input + real capture on any display.

## Verifying the tool itself

```
node PLUTUS_VISION/scripts/rail-test.mjs    # rails hold against the LIVE display
node PLUTUS_VISION/scripts/rail-test2.mjs   # the theatrical shapes all refuse
```

Both drive `execute()` through a fake `pi` against the real `:3` display and the real Pine IDE.
They have found 5 real bugs: `require()` in ESM, single-display window search (the target was on
`:3` while the process was on `:99`), an `--onlyvisible` filter that hid the target, a dispatch-order
bug that pre-gated `look`/`claim`, and `look` calling a non-existent `dispatch`.

## The discipline it encodes

1. `expect` → interact → `look` → **open the image** → `verdict` → `claim`, all in one turn
2. never batch captures and read them later (a frame nobody opened was never looked at)
3. never put a background job between an interaction and its observation
4. never let a VLM, a parity table, or a gate line issue the verdict
5. every "wrong" is classified (SCRIPT / PIPELINE / TRANSPORT / ENV) then fixed and re-seen

## Wired into these skills

All of them carry a `⛔ RAIL — use computer-use` block that supersedes their old raw-capture
recipe: `direct-look-product-test`, `l5-chart-vision-verification`, `pine-ide`,
`tradingview-pine-l5-render`, `tradingview-agent-display-render`,
`tradingview-agent-display-pine-render`, `agent-display-tradingview-pine-render`,
`tradingview-pine-editor-cdp-load`, `tradingview-pine-render-agent-display`,
`tradingview-pine-render-and-session`.

Product spec: `PLUTUS_VISION/docs/PRODUCT_TEST_SPEC.md` (crash matrix C1–C10, banned substitutes).
The old VLM rail endpoint (`pine-ide/pine-ide/vil-rail.mjs` `/vil/look`) is demoted to
`triage-only` and returns `VLM_READER_RETIRED` — it must never be cited as verification.
