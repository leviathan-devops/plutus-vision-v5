/* =================================================================
   PLUTUS DASHBOARD — TRADE TAB  (W-S1)
   -----------------------------------------------------------------
   THE CHART IS THE AGENT COMPOSITOR SURFACE (32 §2). The Vela native
   chart (@luxalgo/vela, Apache-2.0) runs in a window of this same
   Electron app on the agent compositor display, and that compositor
   window is embedded into THIS tab's content area.

   NEW (SHELL_ANCHOR §4/§10): THE [TradingView | Self-Hosted] TOGGLE.
   The tab shows ONE of two backends at a time and the control at the
   tab's TOP-RIGHT switches between them:

     SELF → the Vela terminal (the `chart` surface, :9433) whose studies
            run through the PINE STATION (:9741)
     TV   → the persistent LOGGED-IN TradingView (its OWN `tv` view, :9434 —
            the same cookie partition as WEB RESEARCH, never the same page)

   On every press, in §10's order:
     1. tear down the visible surface only (the backing sessions survive)
     2. attach the chosen surface
     3. refresh it (TV: reload the page · SELF: re-run the active script)
     4. write `chart_backend` + emit CHART_BACKEND_CHANGED on :9431
     5. re-arm the watchdog
   The choice is read back on init, so a full app restart restores it.
   ================================================================= */
(function () {
    'use strict';
    let initialized = false;
    let backend = 'self';
    const STATUS_POLL_MS = 4000;

    function surface(route, kind) {
        const bridge = window.plutus && window.plutus.display;
        if (!bridge) return Promise.resolve({ success: false, error: 'display bridge absent' });
        return bridge.surface(kind || 'chart', route);
    }

    function settings() {
        return (window.plutus && window.plutus.settings) || null;
    }

    function init() {
        if (initialized) return;
        initialized = true;
        console.log('[Plutus] Trade tab initialized (embedded agent display + the chart toggle)');

        initToggle();
        initControlBar();
        initTracker();
        initChat();

        refreshStatus();
        setInterval(refreshStatus, STATUS_POLL_MS);
    }

    /* ── THE TOGGLE ─────────────────────────────────────────────── */

    async function readPersisted() {
        const s = settings();
        if (!s) return 'self';
        try {
            const r = await s.get('chart_backend');
            const v = r && r.success && r.data ? r.data.value : null;
            return v === 'tv' ? 'tv' : 'self';
        } catch (e) { return 'self'; }
    }

    async function writePersisted(be) {
        const s = settings();
        if (!s) return { success: false, error: 'settings bridge absent' };
        try { return await s.set('chart_backend', be); }
        catch (e) { return { success: false, error: e.message }; }
    }

    function paintToggle() {
        const tv = document.getElementById('cb-tv');
        const self = document.getElementById('cb-self');
        const note = document.getElementById('cb-note');
        if (tv) tv.dataset.active = backend === 'tv' ? '1' : '0';
        if (self) self.dataset.active = backend === 'self' ? '1' : '0';
        if (note) note.textContent = ''; // the ACTIVE button names the backend; the note carries only transient state
    }

    async function setBackend(next, { persist = true } = {}) {
        const be = next === 'tv' ? 'tv' : 'self';
        backend = be;
        paintToggle();
        const note = document.getElementById('cb-note');
        if (note) note.textContent = 'switching…';

        // Steps 1-3 + 5 live in DisplaySurface.setBackend (the surface machine).
        const res = window.DisplaySurface
            ? await window.DisplaySurface.setBackend(be)
            : { backend: be, refreshed: false, error: { code: 'DISPLAY_SURFACE_ABSENT' } };

        // Step 4: persist + emit (the main process emits CHART_BACKEND_CHANGED).
        if (persist) await writePersisted(be);

        if (note) {
            const err = res && res.error;
            note.textContent = err ? err.code : '';   // a failure stays named; success needs no echo
        }
        refreshStatus();
        return res;
    }

    async function initToggle() {
        const tv = document.getElementById('cb-tv');
        const self = document.getElementById('cb-self');
        if (tv) tv.addEventListener('click', () => setBackend('tv'));
        if (self) self.addEventListener('click', () => setBackend('self'));

        // The persisted choice (SHELL_ANCHOR §10: "a restart restores the
        // operator's last choice") — applied WITHOUT a rewrite, so a boot never
        // mutates the DB.
        backend = await readPersisted();
        paintToggle();
        await setBackend(backend, { persist: false });
    }

    /* ── the control bar (drives whichever backend is showing) ──── */

    function initControlBar() {
        document.getElementById('tv-reframe')?.addEventListener('click', () => {
            surface(backend === 'tv' ? 'navigate?url=https://www.tradingview.com/chart/' : 'frame-week', backend === 'tv' ? 'tv' : 'chart').then(refreshStatus);
        });
        document.getElementById('tv-reload')?.addEventListener('click', () => {
            const kind = backend === 'tv' ? 'tv' : 'chart';
            const route = backend === 'tv' ? 'reload' : 'rerun';
            surface(route, kind).then(refreshStatus);
        });
        document.getElementById('tv-clear')?.addEventListener('click', () => {
            surface('clear', 'chart').then(refreshStatus);
        });
        document.getElementById('tv-pair')?.addEventListener('change', function () {
            const pair = this.value;
            if (backend === 'tv') {
                const sym = { EURUSD: 'OANDA:EURUSD', GBPUSD: 'OANDA:GBPUSD', DXY: 'TVC:DXY' }[pair] || pair;
                surface('navigate?url=' + encodeURIComponent('https://www.tradingview.com/chart/?symbol=' + sym), 'tv').then(refreshStatus);
            } else {
                surface('pair?symbol=' + encodeURIComponent(pair), 'chart').then(refreshStatus);
            }
        });
        document.getElementById('tv-tf')?.addEventListener('change', function () {
            if (backend === 'tv') return;   // the TV page owns its own timeframe
            surface('tf?tf=' + encodeURIComponent(this.value), 'chart').then(refreshStatus);
        });
    }

    function initTracker() {
        const container = document.getElementById('trade-tracker-container');
        if (!container) return;
        if (window.TradeTracker && typeof window.TradeTracker.init === 'function') {
            window.TradeTracker.init(container);
        }
    }

    function initChat() {
        const container = document.getElementById('trade-chat-container');
        if (!container) return;
        if (window.TradeChat && typeof window.TradeChat.init === 'function') {
            window.TradeChat.init(container);
        }
    }

    /** The status line reports the REAL chain: compositor → surface → bars. */
    async function refreshStatus() {
        const el = document.getElementById('tv-status');
        if (!el) return;
        try {
            const [disp, st] = await Promise.all([
                window.DisplaySurface.status(),
                surface('status', backend === 'tv' ? 'tv' : 'chart'),
            ]);
            const present = disp && disp.success && disp.data && disp.data.present;
            const kind = backend === 'tv' ? 'tv' : 'chart';
            const alive = disp && disp.data && disp.data.surfaces && disp.data.surfaces[kind]
                ? disp.data.surfaces[kind].alive : false;
            const surf = st && st.success ? st.data : null;

            if (!present) {
                el.textContent = '● AGENT_DISPLAY_ABSENT';
                el.classList.remove('online');
                return;
            }
            if (!alive) {
                el.textContent = '● ' + (backend === 'tv' ? 'TV_UNREACHABLE' : 'CHART_VIEW_DOWN');
                el.classList.remove('online');
                return;
            }
            if (backend === 'tv') {
                el.textContent = '● TRADINGVIEW · ' + (surf && surf.title ? String(surf.title).slice(0, 34) : 'loading');
                el.classList.add('online');
                return;
            }
            // the self-hosted chart is the workbench on the live feed: pair · tf · bars · LIVE (or the feed's NAMED error)
            const s = surf && surf.state ? surf.state : null;
            if (s && s.cell) {
                const live = s.feed === 'LIVE';
                el.textContent = '● ' + s.cell + ' ' + (s.timeframe || '') + ' · ' + s.bars + ' BARS · ' + (live ? 'LIVE' : s.feed);
                el.classList.toggle('online', live);
            } else {
                el.textContent = '● SELF-HOSTED · LOADING';
                el.classList.remove('online');
            }
        } catch (e) {
            el.textContent = '● AGENT_DISPLAY_ABSENT';
            el.classList.remove('online');
        }
    }

    function navigateToPair(pair) {
        return surface('pair?symbol=' + encodeURIComponent(pair), 'chart');
    }

    window.TradeTab = Object.freeze({
        init,
        navigateToPair,
        updateStatus: refreshStatus,
        surface,
        setBackend,
        backend: function () { return backend; },
    });
})();
