# ERRATA — READ THIS BEFORE THE BINDING PIN
## Added 2026-10-10 · supersedes every stale sha claim in this pack and in the repo's canon docs

A fresh agent that trusts the stale claims below WILL be derailed: it will verify the served
indicator against the WRONG sha, conclude the approved render "drifted", and either revert the
operator's approved artifact or chase an artifact that is not the deliverable. Read this first.

---

## 1 · THE CURRENT TRUTH (the only two shas that matter)

| artifact | sha256 | status |
|---|---|---|
| `pine-ide/ide/renderer/plutus-vision-v1.pine` | `0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1` | **SEALED** — HARD STOP H1 on drift |
| `pine-ide/ide/renderer/plutus-vision-v2.pine` | `282517ac622769bdb34296ebee94fa8079da28dbab30bff1c27ae2146a74f011` | **APPROVED** — the operator's C16 Jul-6 render |

Verify with:

```
sha256sum pine-ide/ide/renderer/plutus-vision-v1.pine   # 0d20e831…517bd1
sha256sum pine-ide/ide/renderer/plutus-vision-v2.pine   # 282517ac…12ae2146a74f011
```

There are THREE v2 copies on disk that are NOT the served/approved one:

| path | sha | what it is |
|---|---|---|
| `pine-ide/ide/renderer/plutus-vision-v2.pine` | `282517ac` | **THE SERVED/APPROVED ONE** |
| `./plutus-vision-v2.pine` (repo root) | `668e89d7` | a build artifact — NOT the deliverable |
| `pine-ide/charts/plutus-vision-v2.pine` | `04d7a89a` | a chart-dir copy — NOT the deliverable |

The git HEAD commit (`caef1f9`) records the v2 as `87628e54…` — that is the checkpoint's `dist/`
copy (the commit message says so). The APPROVED file is `282517ac…`, which lives at
`Checkpoints/e1-automatic-polish-2026-10-06/render/` (inside `06_CHECKPOINTS/Checkpoints.tar.gz`)
and is what the live working tree serves. `87628e54` ≠ `282517ac`; the checkpoint's `dist/`
drifted after the approval. The approval is `282517ac`.

---

## 2 · THE STALE CLAIMS THAT WOULD DERAIL YOU (named, with the current truth)

| # | where it appears | the stale claim | the current truth |
|---|---|---|---|
| E-1 | `PIN_INDICATOR_PORT_BUILD.md:15` (the BINDING pin) | v2 = `668e89d7…` (1863 lines) | the SERVED v2 = `282517ac…`; `668e89d7` is the ROOT copy, not the renderer copy. **FIXED in place 2026-10-10.** |
| E-2 | `PIN_INDICATOR_PORT_BUILD.md:19` (the rig line) | `CDP :9222, the app on display :3` | both are DEAD PATHS. The app = `~/.local/bin/pine-ide` (WebKitGTK) on **wayland-0**. **FIXED in place 2026-10-10.** |
| E-3 | `context_management/CURRENT_STATE.md:3` (generated header) | v2 = `668e89d7…` | STALE. **ERRATA block added at the top of the file 2026-10-10.** |
| E-4 | `context_management/CURRENT_STATE.md:~14` | v2 = `5bb4baf3…` | an OLD v2 build. Superseded. |
| E-5 | `context_management/CURRENT_STATE.md:~297` | v2 = `7ebbe95b…` | an OLD v2 build. Superseded. |
| E-6 | `context_management/CURRENT_STATE.md:232` | v1 = `82da437a…` | **WRONG.** The v1 seal is `0d20e831…`. `82da437a` is not the seal. |
| E-7 | `context_management/BUILD_STATE.md:3,21,22,352` | v2 = `668e89d7…` | STALE (same as E-1). |
| E-8 | `context_management/EVIDENCE_STATE.md:9,11,31,82,83,112` | `overallVerdict: PASS` · `AUDIT GATE: PASS` · `7/7 PASS` · `12 pass 0 fail` | HISTORICAL greens for an EARLIER artifact. They do NOT describe the current v2, and they do NOT describe the JEV gate (which reads **NO** today). |

**THE CONFLICT RULE for these:** the two shas in §1 win. Every other sha in the pack is history.

---

## 3 · THE SC-19 REALITY (the biggest trap in the pack)

The binding pin requires **SC-19 == 0** — zero baked zone literals; the zones must be COMPUTED
live in Pine. **The approved render does NOT satisfy SC-19.** Measured on the approved artifact:

```
$ grep -cE 'e1_injected_(top|bottom|cat|degree|zfp)\.push\([0-9]' \
      pine-ide/ide/renderer/plutus-vision-v2.pine
18          # SC-19 requires 0
```

**NO pine on disk is SC-19 == 0.** Every v2 pine carries 15-18 baked `e1_injected_*` literals:

```
SC19=18  pine-ide/ide/renderer/plutus-vision-v2.pine          (the APPROVED/served)
SC19=18  Checkpoints/e1-automatic-polish-2026-10-06/render/plutus-vision-v2.pine
SC19=18  Checkpoints/e1-e2-v2-pending-ship-approval-2026-10-06/dist/plutus-vision-v2.pine
SC19=15  ./plutus-vision-v2.pine (root)   ·  Checkpoints/v2-e2-chain-2026-10-07/…
SC19=15  Checkpoints/indicator-engine1-e2-fixed-2026-10-08/src/plutus-vision-v2.pine
```

**WHAT THIS MEANS — do not conflate two different approvals:**

1. The **VISUAL approval (C16)** — the operator LOOKED at the Jul-6 render and said *"very good
   progress … I like that the engine two is reacting to the engine one."* The approved artifact
   `282517ac` satisfies THIS. It is the artifact to render.
2. The **SC-19 goal (the W5 build)** — compute the E1/E2 zones live from the chart's bars, zero
   baked literals. This is **NOT yet met by any artifact on disk.** The approved render is baked.

So: **the approved render and the SC-19-compliant render are not the same artifact, and the
SC-19-compliant one does not exist as a file yet.** The next agent's job (W1-W7 in the pin) is to
PRODUCE it. Do NOT "fix" the approved render by reverting it — that destroys the C16 render the
operator approved for the VISUAL.

The E2 path is baked too (`e2_injected_*` literals, 46 `.push(` calls) — and SC-19 names only the
`e1_injected_*` arrays. Whether the E2 path must also compute is an OPEN question for the operator
(handover §14).

---

## 4 · THE GATE TRUTH (the only success verdict)

```
$ bash JEV_GATE/run_gate.sh
… chunk 6/6  noul=0.085   route=noop
JEV VERDICT: NO — at least one context chunk is not act. THE ARTIFACT IS REJECTED.
```

The gate reads **NO** (all ~6 chunks `noop`). Any `PASS` / `AUDIT GATE: PASS` / `all gates green`
string elsewhere in this pack (the checkpoints' ship docs, `EVIDENCE_STATE.md`) is HISTORICAL and
describes an earlier artifact. The gate's verdict is the only success signal; nothing else decides.

---

## 5 · THE DEAD PATHS (named — a fresh agent MUST NOT re-live these)

| dead path | why | the live path |
|---|---|---|
| a Chrome `--app` CDP window (`:9222`) | the operator called it "makeshift trash" (RULE-A) | `~/.local/bin/pine-ide` (WebKitGTK) |
| nested weston `:3` | invisible to the operator; his display is `wayland-0` | the operator's `wayland-0` |
| agent xvfb `:99` | headless; the operator sees nothing | the operator's `wayland-0` |
| three IDE windows | RULE-B | ONE shell |
| baking the E1/E2 pillars as Pine literals | the ONE requirement is "compute it live" (AP-1/A2) | compute from the chart's bars |

---

## 6 · WHAT A FRESH AGENT DOES FIRST (from the handover §8.0)

```
1. sha256sum pine-ide/ide/renderer/plutus-vision-v1.pine   → 0d20e831…517bd1 or STOP (H1)
2. bash JEV_GATE/run_gate.sh                                → post the verdict (today: NO)
3. ~/.local/bin/pine-ide --status ; capture the display ; OPEN the image ; name the render
4. grep -cE 'e1_injected_(top|bottom|cat|degree|zfp)\.push\([0-9]' \
      pine-ide/ide/renderer/plutus-vision-v2.pine           → 18 (SC-19 wants 0)
```

The first reply is file:line hits and the gate verdict — NOT a redesign.

---

*This ERRATA is authoritative over every stale claim in the pack. When it disagrees with a
checkpoint ship doc or a canon doc's stale sha, THIS ERRATA wins. The two shas in §1 are the
only shas that matter.*
