# OPERATOR MANUAL — the Plutus knowledge graph (arsumbris stack)

```
MACHINERY : arsumbris typed knowledge graph for Plutus
            au-engine 0.0.1-alpha (the `au` binary) · au-host (Electron UI)
            au-mcp kernel (agent gate, 44 tools) · kgm supervisor
STACK HOME: ~/arsumbris/ · GRAPH HOME: /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/MASTER_CONTEXT
THE JOB   : author + preserve Plutus doctrine as typed cards so every agent
            operates on quoted law — never from memory, never re-explained.
WHY it is designed this way → PLUTUS_MASTER_CONTEXT_INJECTOR.md (the V5 repo)
WHAT is true about it     → state/ cards in this repo + arsumbris thread
HOW to use it             → THIS MANUAL
```

## §1 WHAT THIS IS FOR

The ONE outcome: **your doctrine, in your words, typed and anchored — every agent reads the law instead of asking you.**

USE IT WHEN: capturing a ruling, a never-do, a lesson (wrong/correct), a vocabulary term, a verification gate, a state fingerprint.
DO NOT USE IT WHEN: storing prose essays, code, secrets, or context that is not law. If it can't be quoted, it isn't law yet — it's an opinion.

## §2 BEFORE YOU START (each item checkable)

- ☐ engine alive: `~/arsumbris/au-engine/target/release/au daemon status /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/MASTER_CONTEXT` → `ready=true`
- ☐ graph clean: ask any OMP session for `au_diagnostics` → `"total": 0`
- ☐ UI up: an "au-host" window exists (title bar says au-host)
- ☐ supervisor armed: `systemctl --user is-active ydotoold` (input), kgm (engine healing)

## §3 THE QUICK START — capture a card (the 80% case)

1. Open the au-host window, left sidebar, expand `rulings/` in the Files pane.
2. Copy any existing card as your template (frontmatter shape is the law).
3. Fill: `type: plutus-ruling` · `id: R39` · `quote: "…verbatim words…"` · `source: "<corpus-file>.md:<line>"` · `status: operator-confirmed`.
4. Save (Ctrl+S). Nothing to restart — the graph re-indexes in ~1s.
5. Say "check the graph" — the agent reads `au_diagnostics`; fix anything flagged.
6. `git add rulings/R39-*.md && git commit -m "R39: <name>"`.
7. Done — every agent session now sees it.

## §4 THE FULL PROCEDURE

```
A-1 │ LAUNCH THE STACK
    PRE:  none (cold machine)
    ACT:  run `arsumbris` (terminal) or click the Arsumbris app icon
    EXP:  au-host window, engine ready badge, both workspaces listed
    IF NOT: black window → §6 SYM-1. No window at all → §6 SYM-2.
    PROVES: the UI + engine are up.
A-2 │ ENTER THE WORKSPACE
    ACT:  click the MASTER_CONTEXT card → Launch
    EXP:  Files pane (corpus tree), Force Graph (bottom-left), reader tabs
    IF NOT: "No composition selected" → §6 SYM-3.
    PROVES: host ↔ engine pairing.
A-3 │ AUTHOR A RULING CARD
    ACT:  create rulings/R<N>-<slug>.md per §3
    EXP:  file exists; diagnostics flag only real mistakes
    IF NOT: `source:` rejected → §6 SYM-4.
    PROVES: your words are now graph nodes.
A-4 │ ANCHOR THE QUOTE
    ACT:  grep -in "<first 40 chars of quote>" *.md → put file:line in source
    EXP:  source points at the real line
    IF NOT: the quote isn't in the corpus → the card needs YOUR source file
            added to the corpus first, or it stays flagged UNANCHORED.
    PROVES: D13 holds — anything cited can be found.
A-5 │ LINK THE NEIGHBORHOOD
    ACT:  add [[R09-rrr-floor-2p5]]-style links (filename, not id)
    EXP:  Force Graph gains edges to the linked cards
    IF NOT: link target filename typo'd → §6 SYM-5.
    PROVES: the reference web is growing, not just node count.
A-6 │ SUPERSEDE, NEVER REWRITE
    ACT:  new card carries the change; old card gets `status: superseded`
    EXP:  both cards exist, linked by the body
    IF NOT: you edited a quote in place → undo; history is git + cards.
    PROVES: doctrine evolution stays auditable.
A-7 │ UPDATE STATE AFTER A VERIFIED RUN
    ACT:  edit state/<component>.md — value + verifiedAt + evidence
    EXP:  the fingerprint card matches the last verified run
    IF NOT: nothing verifies → don't touch state; fix the run first.
    PROVES: the graph always answers "what is proven RIGHT NOW".
A-8 │ QUERY THE GRAPH (or ask the agent)
    ACT:  say "au_instances_of plutus-ruling" / "au_diagnostics" / "au_overview"
    EXP:  counts + names + spans from the live graph
    IF NOT: engine down → §6 SYM-2.
    PROVES: agents read the same truth you see.
A-9 │ START AN AGENT SESSION IN-APP
    ACT:  right rail → adapter selector → OMP → + New session
    EXP:  a terminal pane spawns the omp TUI
    IF NOT: selector missing OMP → §6 SYM-6. Pane shows execvp error → §6 SYM-7.
    PROVES: the in-app agent loop.
A-10│ RUN THE VERIFICATION GATES
    ACT:  gates/canon-battery card — run its commands
    EXP:  all green; frozen pair unchanged
    IF NOT: frozen-pair drift = CRITICAL STOP, all desks halt.
    PROVES: the pipeline still honors the graph.
A-11│ KEEP THE SUPERVISOR ARMED
    ACT:  `bun kgm/fleet.ts tick` (or the cron line) after incidents
    EXP:  drifted=0 healed=0 raised=0
    IF NOT: raised=1 → diagnostics>0 → fix cards, never the engine.
    PROVES: liveness + lint are machine-checked.
A-12│ COMMIT
    ACT:  git add <files> && git commit (the graph repo is ordinary git)
    EXP:  history grows
    IF NOT: nothing to commit → nothing was authored.
    PROVES: the law survives session death.
```

## §5 WHAT YOU SHOULD SEE (verbatim)

- daemon status → `engine=up, ref=ready, ready=true, version=N`
- clean graph → `diagnostic_counts: {"by_code":{}, "by_severity":{}, "total":0}`
- kgm tick → `{"ran":true,"checked":2,"drifted":0,"healed":0,"raised":0}`
- a bad card saved → a diagnostic with code + file + line within ~1s; the file still on disk

## §6 WHEN IT GOES WRONG (symptom → action; every row walked 2026-09-16)

| SYMPTOM | ACTION |
|---|---|
| SYM-1 black window, UI gone | WebGL blocklist (Optimus+XWayland). Relaunch with the direct command: `cd ~/arsumbris/au-host/app && env DISPLAY=:1 XAUTHORITY=/run/user/1000/.mutter-Xwaylandauth.* <electron> . --ozone-platform=x11 --force-renderer-accessibility` — the graceful-degrade patch makes it render; if red "mount failed" returns, rebuild: `pnpm --filter au-avatar build`. |
| SYM-2 no au-host window / engine down | `cd ~/arsumbris/au-host/app && arsumbris`-style relaunch, then `bun ~/arsumbris/au-host/../../JARVIS_WORKSPACE/PLUTUS_Knowledge/kgm/fleet.ts tick` wait — exact: `cd /home/leviathan/JARVIS_WORKSPACE/PLUTUS_Knowledge && bun kgm/fleet.ts tick` (heals the engine with read-back). |
| SYM-3 "No composition selected" | the workspace has no layout at its root. Ensure `workspace-layout.yaml` exists at MASTER_CONTEXT root AND the workspace mounts `host-bundle` + `mcp-bundle` (its .arsumbris/workspace.yaml). Then reopen the workspace. |
| SYM-4 source: rejected on save | source must be `something.md:123` or a corpus filename. A bare `/` inside a type regex also breaks parsing — regexes are slash-delimited `String{/^…$/}` and must not contain a bare `/` in a character class. |
| SYM-5 "reference-target-missing" on save | a `[[wikilink]]` names a file that doesn't exist. Links point at FILENAMES (`[[R09-rrr-floor-2p5]]`), never bare ids. Fix the link or create the target. |
| SYM-6 adapter dropdown has no OMP | the engine must be cycled AFTER registering the adapter repo (repos.yaml + workspace.yaml discover). `au daemon stop <ws>` then kgm tick, then RESTART au-host — discovery happens at workspace open. |
| SYM-7 pane shows `execvp(3) failed: No such file or directory` | the agent binary path didn't resolve at spawn. `paths.yaml` → `binaries.omp: /home/leviathan/.bun/bin/omp` (absolute), host restart, re-select the profile, + New session again. |
| SYM-8 duplicate adapters/profiles in the pickers | the same-named files exist in two mounted repos (profiles/ vs arsumbris/profiles/). Delete one copy — pickers list per-file, dedup is yours. |
| SYM-9 keyboard/typing into the app fails from automation | the window is not the focused surface (Wayland focus law). Click the window once, or use AT-SPI element actions / ydotool. |
| SYM-10 screen capture tools return nothing | you are on Wayland: X11 tools see only XWayland clients. au-host runs X11-mode, so `import -window <WID>` works for it; full-screen/native capture needs the omp `wayland-pipewire` rebuild (OPEN-002). |

## §7 RECOVERY

- ABORT: any edit — just stop; unsaved = nonexistent.
- ROLLBACK: the graph repo is git. `git checkout -- <file>`. Engine state cannot corrupt (stateless over files).
- DAEMON CRASH: stateless; `bun kgm/fleet.ts tick` restarts with read-back proof.
- RESUME: crash-first work rows resume on the next kgm tick automatically.

## §8 THE SECOND RUN

Editing = first run minus setup (open, edit, save, commit). Re-seeding generated cards: `python3 tools/seed_corpus.py` (hand cards untouched). New machine: clone ~/arsumbris + the corpus, `pnpm install` au-host, rebuild au-avatar, `seed-device-config.py --write`, launch.

## §9 THE LIMITS

- The engine is LINT, not police: bad cards save and get flagged — discipline stays human.
- The daemon socket is unauthenticated (single-user trust).
- Alpha, tag-pinned: never mix arsumbris repo versions.
- One writer at a time; git arbitrates the rest.
- Full-screen / native-Wayland capture: not available until the omp `wayland-pipewire` rebuild (OPEN-002).
- OMP-native computer use requires the session's DISPLAY=:1 — a stale ancestor env (Orca `:99`) breaks it at the source (EN-001).

## §10 THE TRAPS

- Type-defs live in `type/` (singular). `types/` silently misplaces them.
- Wikilinks resolve to FILENAMES, not ids.
- Regex refinements: slash-delimited; a bare `/` in a character class ends the regex.
- repo.yaml `name:` must equal the folder name; both repo.yaml and README need their self-declaration types.
- Folder renames must update: repos.yaml, recents.yaml, view-state.json, mcp.json env, hub service args.
- The adapter must be a workspace member AND its repo registered, or the launcher never sees it.

## §11 VERIFICATION

1. `au daemon status <ws>` → ready=true
2. `au_diagnostics` → total: 0
3. `bun kgm/fleet.ts tick` → drifted=0
4. `git log --oneline -1` shows your card commit

## §12 THE DRILL

The §6 table is the walked drill (2026-09-16: the 106→42→3→0 diagnostics ladder, the launch-stack failures, the registry substring bug). Residual: the zero-question fresh-operator run is pending — first agent to use ONLY this manual reports its question count as the hole count.

## ADDENDUM v2 (2026-09-17 — post-fix corrections)

- SYM-7 ROOT CAUSE CONFIRMED: the host must OWN its au-mcp kernel child. Any second kernel on the workspace socket (hub service, manual start) reads as "mcp off" and "+ New session" dies at `host.mcp.start()`. ACTION: kill foreign kernels (`pgrep -af "au-mcp/src/cli.ts"`), restart au-host, verify the badge flips ON.
- Reports live at `MASTER_CONTEXT/reports/` (in-graph): the engineering report, the two-substrate blueprints, and the master blueprint.
- Profiles consolidated at `MASTER_CONTEXT/profiles/` (Claude · Codex · OMP); the starter folder is deleted; the Files tree shows one of everything.
- The adapter's launch entry emits an ABSOLUTE binary path (`/home/leviathan/.bun/bin/omp`) — paths.yaml `binaries.*` is the resolver of record.


## ADDENDUM v3 (2026-09-17 — post-overhaul)

- **Graph shape:** 703 nodes · 24 edges · 0 diagnostics · 649 typed cards
- **New type:** `plutus-mechanism` (slug · kind[mechanism|taxonomy|lesson|gate|limit] · quote · source · mechanics · links) — 583 instances in `mechanisms/`
- **Map:** `reports/Knowledge_Graph_Map_v2.md` (5,904 lines, hyperlinked ToC + connection footnotes)
- **The cross-link pass is P1:** 649 nodes / 24 edges = edge-poor. Adding [[links]] between related mechanism cards + rulings is the fastest value-add.
