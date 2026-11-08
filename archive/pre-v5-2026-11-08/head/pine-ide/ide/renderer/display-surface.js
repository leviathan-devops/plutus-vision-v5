/* =================================================================
   PLUTUS DASHBOARD — THE EMBEDDED AGENT DISPLAY + THE CHART TOGGLE
   -----------------------------------------------------------------
   The agent compositor's surface is a TAB of this dashboard: the
   compositor's X11 window is reparented INTO this Electron window and
   fitted to the active tab's content rect. The surfaces (Vela chart,
   agent browser) are windows of this same Electron app on the
   compositor's display — native input, no screencast, no second
   browser runtime.

   THE CHART TOGGLE (SHELL_ANCHOR §4, §10): the TRADE tab shows ONE of TWO
   backends — 'self' (the Vela terminal, the chart surface) or 'tv' (the
   persistent LOGGED-IN TradingView, the agent browser surface). The state
   machine, exactly as §10 specifies:

     1. tear down the VISIBLE surface ONLY — `unembed()` hides the compositor
        window; NEITHER backing session is destroyed (the TV cookies persist,
        the Vela chart keeps its script and drawings).
     2. attach the chosen surface to the chart region.
     3. REFRESH it — TV: reload the persistent page; SELF: re-run the active
        script through the pine station.
     4. write `chart_backend` + emit CHART_BACKEND_CHANGED on :9431
        (done by the caller: trade-tab.js owns the DB write through the preload
        settings bridge, main.js emits the WS event).
     5. re-arm the watchdog for the new surface.

   The toggle NEVER disappears: a failed backend is a NAMED token in the region
   (TV_UNREACHABLE / PINE_STATION_DOWN), never a blank pane and never a dead
   control.

   Failure is LOUD and NAMED (AGENT_DISPLAY_ABSENT / EMBED_FAILED /
   SURFACE_SPAWN_FAILED) — never a blank pane.
   ================================================================= */
(function () {
    'use strict';

    const HOSTS = { trade: 'trade-embed', browser: 'browser-embed' };
    const TV_URL = 'https://www.tradingview.com/chart/';
    const RESEARCH_URL = 'https://www.forexfactory.com/calendar'; // WEB RESEARCH's default page
    const SELF_URL = 'http://127.0.0.1:9851/charts/trade.html?pair=EURUSD&tf=1H'; // the workbench on the live feed
    const BACKENDS = { self: 'chart', tv: 'tv' };   // backend → surface kind (TV is its OWN view — never the web-research page)
    const SURFACE_PORTS = { chart: 9433, browser: 9432, tv: 9434 };

    let active = null;         // 'trade' | 'browser' | null (which TAB is embedded)
    let backend = 'self';      // 'self' | 'tv' — the chart tab's chosen backend
    let lastRect = null;
    let lastError = null;

    // THE EMBED QUEUE — BUG-1 (measured live 2026-09-29).
    // A plain `busy` flag made a concurrent swap a SILENT NO-OP: the operator
    // pressed SELF while a re-fit was in flight, `embed()` returned immediately,
    // nothing was attached, and the toggle looked dead while reporting no error.
    // Swaps are SERIALIZED instead: every request runs, in order, last one wins.
    let embedChain = Promise.resolve();
    let embedGen = 0;          // bumped by every successful attach; guards stale re-fits
    let switchSeq = 0;         // bumped by EVERY tab switch; an embed measured for an older switch is stale
    let backendSeq = 0;        // bumped by EVERY setBackend; only the newest call's embed attaches

    function host(tab) { return document.getElementById(HOSTS[tab]); }

    function rectOf(el) {
        const r = el.getBoundingClientRect();
        const s = window.devicePixelRatio || 1;
        return {
            x: Math.round(r.left * s),
            y: Math.round(r.top * s),
            width: Math.max(64, Math.round(r.width * s)),
            height: Math.max(64, Math.round(r.height * s)),
        };
    }

    /**
     * THE REAL RECT, AFTER LAYOUT — D3 (measured 2026-09-29).
     *
     * The host is `display:none` until its panel is shown, so a rect read in the
     * same tick as the switch is 0x0; the embed then clamped it to 64x64 and the
     * compositor child sat at 64x64 +240+127 while the tab showed black. So the
     * rect is read AFTER the panel has been laid out: two animation frames, then
     * a bounded retry until the host reports a real size (or we give up and say
     * so by name).
     */
    function measureHost(el, attempts, isStale) {
        const tries = attempts === undefined ? 24 : attempts;
        return new Promise(function (resolve) {
            function step(n) {
                if (isStale && isStale()) return resolve(null);          // switched away: stop measuring
                const r = el.getBoundingClientRect();
                if (r.width > 8 && r.height > 8) return resolve(rectOf(el));
                if (n <= 0) {
                    lastError = { code: 'SURFACE_HOST_COLLAPSED', message: 'the tab host never reported a size' };
                    return resolve(null);
                }
                // setTimeout, not requestAnimationFrame: rAF pauses in a hidden/minimized window and would
                // hold embedChain (and every embed/unembed/refit queued behind it) forever
                setTimeout(function () { step(n - 1); }, 40);
            }
            setTimeout(function () { step(tries); }, 32);
        });
    }

    function showError(el, code, message) {
        el.innerHTML = '';
        const box = document.createElement('div');
        box.className = 'embed-error';
        const c = document.createElement('div'); c.className = 'embed-error-code'; c.textContent = String(code || '');
        const m = document.createElement('div'); m.className = 'embed-error-msg'; m.textContent = String(message || '');
        box.append(c, m);
        el.appendChild(box);
    }

    function showHint(el, text) {
        el.innerHTML = '';
        const box = document.createElement('div');
        box.className = 'embed-hint';
        box.textContent = text;
        el.appendChild(box);
    }

    /** The URL a given tab+backend is served from. */
    // the TV view opens on the DASHBOARD's pair (never TradingView's own default symbol)
    const TV_SYMBOLS = { EURUSD: 'OANDA:EURUSD', GBPUSD: 'OANDA:GBPUSD', DXY: 'TVC:DXY' };
    function tvChartUrl() {
        const sel = document.getElementById('tv-pair');
        const pair = sel && sel.value ? String(sel.value) : 'EURUSD';
        return TV_URL + '?symbol=' + encodeURIComponent(TV_SYMBOLS[pair] || pair);
    }
    function urlFor(tab, be) {
        if (tab !== 'trade') return RESEARCH_URL;
        return be === 'tv' ? tvChartUrl() : SELF_URL;
    }

    /** Public embed — every call is QUEUED, never dropped (BUG-1). */
    function embed(tab, be, bseq) {
        const seq = switchSeq;
        // the backend AND its generation are snapshotted when the embed is QUEUED: of N setBackend() calls
        // queued back-to-back only the NEWEST attaches (tv, self, tv -> one browser attach, never two)
        const want = be === 'tv' || be === 'self' ? be : backend;
        const bgen = bseq === undefined ? backendSeq : bseq;
        embedChain = embedChain.then(function () { return doEmbed(tab, seq, want, bgen); }).catch(function () { /* next call still runs */ });
        return embedChain;
    }

    /** audit H (2cad66fa): measureHost() can take ~1s; a tab switch in that window made the stale
     *  embed attach TRADE over the tab the operator had moved to. The embed re-checks its switch. */
    function stale(seq) { return seq !== switchSeq; }

    async function doEmbed(tab, seq, want, bgen) {
        const el = host(tab);
        if (!el) return;
        const bridge = window.plutus && window.plutus.display;
        if (!bridge) { showError(el, 'DISPLAY_BRIDGE_ABSENT', 'preload display bridge missing'); return; }
        try {
            if (stale(seq)) return;                                       // coalesce: a newer switch owns the surface
            el.querySelectorAll('.embed-error,.embed-hint').forEach((n) => n.remove());
            const be = want; // ONE snapshot (taken at queue time): the kind and the url name the same backend
            if (tab === 'trade' && bgen !== backendSeq) return; // superseded: the newer setBackend's own embed follows on the chain
            const kind = tab === 'trade' ? BACKENDS[be] : 'browser';
            const rect = await measureHost(el, undefined, function () { return stale(seq); });
            if (stale(seq)) return; // the operator switched away while the host was measured
            if (!rect) {
                showError(el, 'SURFACE_HOST_COLLAPSED', 'the ' + tab + ' tab host has no size — the panel is not laid out yet');
                return;
            }
            rect.url = urlFor(tab, be);
            lastRect = rect;
            const res = await bridge.embed(kind, rect);
            if (!res || !res.success) {
                const code = (res && res.code) || 'AGENT_DISPLAY_ABSENT';
                lastError = { code, message: (res && res.error) || 'the agent compositor is not available' };
                // The chart tab's OWN token when the compositor is up but the
                // chosen backend is not: TV_UNREACHABLE for the TV path.
                const shown = (tab === 'trade' && be === 'tv' && code !== 'AGENT_DISPLAY_ABSENT')
                    ? 'TV_UNREACHABLE' : code;
                showError(el, shown, lastError.message);
                return;
            }
            // attached too late: hide it. Embeds and refits are all serialized on embedChain, so no newer
            // attach can have happened while this one ran — the newer switch's own step runs after us.
            if (stale(seq)) { active = null; try { await bridge.unembed(); } catch (e) { /* best effort */ } return; }
            lastError = null;
            active = tab;
            el.querySelectorAll('.embed-error,.embed-hint').forEach((n) => n.remove());
            // The tab layout settles a beat after first paint (chat/tracker
            // mount) — re-fit so the surface tracks the FINAL content rect.
            // A GENERATION counter guards these delayed re-fits: measured live,
            // a stale timer from the TRADE embed fired AFTER the operator had
            // switched to WEB RESEARCH and re-embedded (raised) the TRADE surface
            // over the browser one. A re-fit may only run for the embed that
            // scheduled it.
            const gen = ++embedGen;
            for (const delay of [500, 1200, 2600]) {
                setTimeout(function () { if (gen === embedGen) refit(); }, delay);
            }
        } catch (e) {
            lastError = { code: 'EMBED_FAILED', message: e.message };
            showError(el, 'EMBED_FAILED', e.message);
        }
    }

    async function unembed() {
        const bridge = window.plutus && window.plutus.display;
        if (!bridge) return;
        if (active) {
            const el = host(active);
            if (el) showHint(el, 'surface hidden');
        }
        active = null;
        try { await bridge.unembed(); } catch (e) { /* hidden best-effort */ }
    }

    /**
     * THE TOGGLE — SHELL_ANCHOR §10's five steps, in order.
     * @param {'self'|'tv'} next
     * @returns {Promise<{backend:string, refreshed:boolean, error:object|null}>}
     */
    async function setBackend(next) {
        const be = next === 'tv' ? 'tv' : 'self';
        const changed = be !== backend;
        backend = be;
        const bseq = ++backendSeq;

        // 1. tear down the VISIBLE surface only (the backing sessions survive)
        const bridge = window.plutus && window.plutus.display;
        if (bridge) {
            try { await bridge.unembed(); } catch (e) { /* the swap continues */ }
        }
        active = null;

        // 2. attach the chosen surface to the chart region (queued, never dropped — with THIS call's backend)
        await embed('trade', be, bseq);

        // a newer setBackend superseded this one while it waited: its embed was skipped, and so is its
        // refresh (the winner refreshes its OWN surface — never the loser's)
        if (bseq !== backendSeq) return { backend: be, refreshed: false, changed, superseded: true, error: null };

        // 3. REFRESH that surface
        const refreshed = await refreshSurface(be);

        // 5. re-arm the watchdog (it runs on its own interval and now watches
        //    the new surface + backend — see watchdog()).
        return { backend: be, refreshed, changed, error: lastError };
    }

    // ── BUG-2: THE REFLOW. The chart region is an X WINDOW reparented with a
    // FIXED rect, so a CSS layout change (collapsing the agent chat, toggling a
    // pane) moves the host element WITHOUT firing `window.resize` — the surface
    // stayed at its old width and the freed space showed as empty background.
    // A ResizeObserver on the host re-fits the surface to the REAL rect.
    let reflowTimer = null;
    function watchReflow() {
        if (typeof ResizeObserver !== 'function') return;
        const ro = new ResizeObserver(function () {
            if (!active) return;
            if (reflowTimer) clearTimeout(reflowTimer);
            reflowTimer = setTimeout(function () { lastRect = null; refit(); }, 90);
        });
        for (const id of Object.values(HOSTS)) {
            const el = document.getElementById(id);
            if (el) ro.observe(el);
        }
    }

    /** Step 3 of the state machine: TV reloads its page; SELF re-runs its script. */
    async function refreshSurface(be) {
        const bridge = window.plutus && window.plutus.display;
        if (!bridge) return false;
        try {
            if (be === 'tv') {
                const r = await bridge.surface('tv', 'reload');
                return !!(r && r.success);
            }
            // SELF: re-run the ACTIVE script through the pine station.
            const r = await bridge.surface('chart', 'rerun');
            return !!(r && r.success);
        } catch (e) {
            return false;
        }
    }

    /** Called by the tab router on every tab switch. */
    async function onTabSwitch(tab) {
        switchSeq++;
        if (tab === 'trade' || tab === 'browser') {
            await embed(tab);
        } else {
            // serialized behind any in-flight embed, so the hide always lands LAST
            embedChain = embedChain.then(function () { return active ? unembed() : null; }).catch(function () { /* next call still runs */ });
            await embedChain;
        }
    }

    /** A refit is QUEUED on embedChain like every attach, and runs only if no switch happened since. */
    function refit() {
        if (!active) return;
        const seq = switchSeq;
        const bseq = backendSeq; // a refit queued before a setBackend never re-attaches with the NEW backend
        embedChain = embedChain.then(function () { if (seq === switchSeq && bseq === backendSeq) return doRefit(seq); }).catch(function (e) {
            lastError = { code: 'REFIT_FAILED', message: e && e.message };
        });
        return embedChain;
    }
    function doRefit(seq) {
        if (!active) return;
        const el = host(active);
        if (!el) return;
        const live = el.getBoundingClientRect();
        if (live.width <= 8 || live.height <= 8) return; // a collapsed host never re-embeds at the 64x64 clamp
        const rect = rectOf(el);
        rect.url = urlFor(active, backend);
        if (lastRect && lastRect.x === rect.x && lastRect.y === rect.y
            && lastRect.width === rect.width && lastRect.height === rect.height
            && lastRect.url === rect.url) return;
        const bridge = window.plutus && window.plutus.display;
        if (!bridge) return;
        // the dedup rect advances only on SUCCESS (a failed refit is retried by the next one)
        return Promise.resolve(bridge.embed(active === 'trade' ? BACKENDS[backend] : 'browser', rect)).then(function (res) {
            if (seq !== undefined && seq !== switchSeq) return; // a switch landed while the refit ran: its rect is not ours
            if (res && res.success) lastRect = rect;
            else lastError = { code: (res && res.code) || 'REFIT_FAILED', message: (res && res.error) || 'the refit was refused' };
        });
    }

    window.addEventListener('resize', function () { setTimeout(refit, 120); });
    watchReflow();

    // ── WATCHDOG: the compositor can die (killed, crashed, restarted), and so
    // can the chosen surface. The tab must SAY SO by name, never sit blank, and
    // must recover when the surface comes back. Re-armed by setBackend().
    async function watchdog() {
        if (!active) return;
        const el = host(active);
        const bridge = window.plutus && window.plutus.display;
        if (!el || !bridge) return;
        let present = false;
        let surfaces = {};
        try {
            const st = await bridge.status();
            present = !!(st && st.success && st.data && st.data.present);
            surfaces = (st && st.data && st.data.surfaces) || {};
        } catch (e) { present = false; }
        const kind = active === 'trade' ? BACKENDS[backend] : 'browser';
        const alive = !!(surfaces[kind] && surfaces[kind].alive);
        const showingError = !!el.querySelector('.embed-error');
        if (!present) {
            if (!showingError) showError(el, 'DASHBOARD_WINDOW_ABSENT', 'the surface host window is not available');
            return;
        }
        if (!alive) {
            // The backing surface died: name it, then re-attach (which respawns it).
            if (!showingError) {
                showError(el, active === 'trade' && backend === 'tv' ? 'TV_UNREACHABLE' : 'SURFACE_SPAWN_FAILED',
                    'the ' + kind + ' surface is not running — re-attaching');
            }
            await embed(active);
            return;
        }
        if (showingError) await embed(active); // self-heal: the surface returned
    }
    setInterval(watchdog, 3000);

    window.DisplaySurface = Object.freeze({
        onTabSwitch: onTabSwitch,
        embed: embed,
        unembed: unembed,
        refit: refit,
        setBackend: setBackend,
        refreshSurface: refreshSurface,
        backend: function () { return backend; },
        lastError: function () { return lastError; },
        status: function () {
            const bridge = window.plutus && window.plutus.display;
            return bridge ? bridge.status() : Promise.resolve(null);
        },
        current: function () { return active; },
    });
})();
