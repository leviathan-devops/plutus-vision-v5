# OVERNIGHT HANDOVER — 2026-11-01 (computer-use v2 · Pinebox · trading build)

Every number below was produced by a command in this session. Anything not run is marked
NOT RUN. Nothing here is a model verdict; the audit tool's verdicts are quoted as returned.

## 1. WHAT IS VERIFIED (command + observed result)

| item | evidence |
|---|---|
| ripwire works from any cwd | `jail()` at `extensions/code-retrieval/index.js:64` no longer pins roots to cwd; `ripwire verb=for path=/home/leviathan/.omp/agent/extensions/computer-use-v2` returns a map; both MCP bridges restarted, fresh process verified |
| B1 C3 false refusal (empty X stack) | `computer shell_up --id 3` → `{"ok":true,"display":":5"}`, `c3:"held"`; `govern.sh` predicate controls: empty-baseline PASS, displaced-baseline REFUSE, focus-moved REFUSE; `c3-no-raise` 32/0 earlier; `mutate --slow` 14/0 |
| B2 deploy drift | `deploy.sh verify` → `DEPLOY: OK sealed=66 files nofocus=854207cee6d0`; a 1-byte injected change → `DEPLOY_DRIFT` rc=1, restored byte-exact; gate is now in BOTH chains |
| B3 audit gate invocation | `code-review/index.js` normalises absolute `scanPath` against `repo`; fresh process previews 19 (CU core) / 15 (pinebox) files. Real scans RAN: see §3 |
| B4 plaintext key | `~/.opencodereview/config.json`: google/verboo/muse-free use `api_key_cmd` resolvers, no `api_key` values remain; `ocr` health `ocr_selftest ok`. **Rotation of the leaked Google key is YOURS** (external account) |
| Pinebox runtime | `pinebox up --id 2` → `READY`, 508 bars, 6 chart objects, ~36 s; `verify` → `WORKS` with a 6-element JSON array of checks; unchanged chart → `NO_FRESH_FRAME` (3-state oracle); opened frames show candles + EMA20/EMA50 + crossover triangles, week 2026-W28, rail `:9954` |
| Pinebox lock-leak root cause | bash `exec N>file` is INHERITED (measured): 8 processes held `.up-2.lock`; after `pb_computer` wrapper: **0 holders**, `pinebox down` 1.5 s (previously hung) |
| v3 P1/P2/P3 | `run insert editor look tab chart asset tf widget backtest` implemented; 20 attack/boundary inputs all REFUSE with tokens and **no side-effect file** (`/tmp/js-pwn` absent); replay date bounded both edges (06-21 and 07-20 refuse; 06-23/07-08/07-19 seek, queue 483→221→6) |
| E2 geometry | `plutus-vision-v2.pine` re-anchored to the fixture week (-7848000000 ms); 32 chart objects (11 boxes, 12 labels, 7 lines, 1 table) rendered; polyline payload now emitted by the station (`run.mjs:161`) and rendered (`vision.mjs`); opened frame shows all five zone classes + option-strike labels |
| V11 guest | real Alpine 3.22 qcow2 (syslinux, `vda1`/`vda3`), SSH-reachable, manifest assert rc=0; booted **through the tool's own `op_guest`** (`boot.sh guest 5`), `xev` spawned via `op_forward`, frame fetched over ssh and **opened**; `shell_down` left 0 qemu. Image sha256 `df5b6976…8a3f`; artifact `reports/overnight-2026-11-01/artifacts/guest-proof.json` |
| Cloudflare Worker / G0 | `npx tsc --noEmit` rc=0 after fixing 5 real type contracts + a missing `e2/candidates.ts`; local `wrangler dev` `/health` returns `build_sha` + 7 bindings; `gates/gate.sh G0` → pass, stale-sha fixture refuses |

## 2. THE FINAL CHAIN STATE

- **PINEBOX chain:** `8 gates · 0 failed` (default). `--full` adds `multi N=7`, which **REFUSED to start**: `INSTRUMENT_INVALID only 5941 MB available; 7 instances need ~7800 MB`. That is **BLOCKED, not passed.** An earlier run on this tree passed N=7 44/0 (seven distinct compositors, 35 distinct ports) — but not on the final code.
- **CU v2 chain:** fast gates PASS (`cmp-guard`, `strings`, `mutate 12/0`, `deploy verify`). The **`c3-no-raise` Chrome-CDP step does not complete on this machine right now** (rc=124). It is **not a regression**: the pre-fix commit `1c4e2af` fails identically (bg_20, rc=124, 7m2s), and the same Chrome spawn passes by hand on xvfb (1.65 s) and weston-x11 (5.6 s). Load average was 7.5 with a shared `llama-server` at 80 % CPU. **The full CU chain is therefore UNPROVEN on the final code.** Last green: 9/9 at commit `1c4e2af`.

## 3. THE SHIP GATE — NOT PASSED

The mandated audit RAN on both trees and **FAILED**, so no ship-ready claim is made:

- CU v2 + pinebox ext: `GATE: FAIL (7 critical, 75 high)` (authoritative persisted set: 213 comments, 7 critical / 78 high; session `2db8054d`).
- Pinebox: `GATE: FAIL (1 critical, 35 high)` (session `805809e4`).

What was done about it (each fix driven with an attack input AND a positive control, see commits `93f6f31`, `67fb2bc`):
all **7 CU criticals** and the **1 Pinebox critical**, and the Pinebox highs on injection, scope, evidence integrity and MCP behaviour. **NOT re-audited:** the gate has NOT been re-run on the fixed code, so the verdict above is the stale one. Many medium/low findings and some highs remain unaddressed (the artifact lists them: `.ocr-runs/computer-use-v2-pinebox-scan-2db8054d.md`, 118 KB).

## 4. WHAT IS STILL OPEN (honest list)

1. Re-run the ship gate on the fixed trees and close what it returns (the verdict is stale).
2. `c3-no-raise` Chrome-CDP step and `multi N=7` on a quiet host (blocked by host load / 5.9 GB free).
3. **Backtest ROOM** control surface (`9443/9446/9447`) is not provisioned per instance — the opened Backtest pane shows `BACKTEST_ROOM_DOWN`. The chart's own replay controller (what `backtest` drives) works; the room's session/ticket UI does not.
4. Guest: weston adapters are unavailable inside the Alpine guest (Xvfb adapter works); the guest image lives in `/tmp/cu-guest-build/` and is not installed into a durable location.
5. Trading build: only **P0.T1/G0** was started. The rest of `BUILD_WORKFLOW_v5.1_CLOUDFLARE` (29 turns) is NOT RUN. The checkpoint's October state docs are stale and name an authority file that does not exist.
6. Operator-owned: rotate the Google key that was in plaintext; the 88 untracked docs (F-149); the three trading inputs (ten held-out weeks, Protocol A source, golden week).
7. `PROOF/`, `Ship_Packages/`, `vcards/` show uncommitted changes from other agents' work in the same repo — not touched.

## 5. COMMITS

`~/.omp/agent`: 8b489a2, 4848a13, c47edb6, 45d8c1b, cb3ded1, 1c4e2af, 0292343, 93f6f31
`PLUTUS_VISION`: dc214b1 … 67fb2bc, fc82ac4 (CF/G0), 6f643a7
