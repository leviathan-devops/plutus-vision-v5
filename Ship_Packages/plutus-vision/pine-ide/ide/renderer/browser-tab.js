/* =================================================================
   PLUTUS DASHBOARD — BROWSER TAB  (W6R · defect 2 + defect 3)
   -----------------------------------------------------------------
   The agent browser is a WINDOW OF THIS SAME ELECTRON APP on the agent
   compositor display (32 §2: "we don't need an extra Chromium process
   — Electron IS Chromium"), embedded into this tab's content area.
   Its session is PERSISTENT (persist:w6r-browser in a persistent
   userData dir) and is seeded at boot from the operator's captured
   TradingView profile — the login survives restarts.

   The toolbar drives the surface through the loopback control contract
   on :9432. The old <webview partition="persist:browser"> path is gone:
   it was an EPHEMERAL-profile webview inside the dashboard, which is
   exactly the non-persistent behaviour the operator called out.
   ================================================================= */
(function () {
    'use strict';
    let initialized = false;

    function surface(route) {
        const bridge = window.plutus && window.plutus.display;
        if (!bridge) return Promise.resolve({ success: false, error: 'display bridge absent' });
        return bridge.surface('browser', route);
    }

    function normalizeInput(raw) {
        const v = (raw || '').trim();
        if (!v) return '';
        if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(v) && !v.includes(' ')) return 'https://' + v;
        if (/^https?:\/\//i.test(v)) return v;
        return 'https://www.google.com/search?q=' + encodeURIComponent(v);
    }

    function init() {
        if (initialized) return;
        initialized = true;
        console.log('[Plutus] Browser tab initialized (agent browser surface)');

        const urlInput = document.getElementById('browser-url');
        if (!urlInput) return;

        function navigate(url) {
            const target = normalizeInput(url);
            if (!target) return;
            urlInput.value = target;
            surface('navigate?url=' + encodeURIComponent(target)).then(refreshStatus);
        }

        document.getElementById('browser-go')?.addEventListener('click', () => navigate(urlInput.value));
        urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); navigate(urlInput.value); }
        });
        document.getElementById('browser-back')?.addEventListener('click', () => surface('back').then(refreshStatus));
        document.getElementById('browser-fwd')?.addEventListener('click', () => surface('forward').then(refreshStatus));
        document.getElementById('browser-reload')?.addEventListener('click', () => surface('reload').then(refreshStatus));
        document.getElementById('browser-home')?.addEventListener('click', () => navigate('https://www.forexfactory.com/calendar'));
        document.querySelectorAll('.browser-quick').forEach((btn) => {
            btn.addEventListener('click', () => navigate(btn.getAttribute('data-url')));
        });

        refreshStatus();
        setInterval(refreshStatus, 5000);
    }

    async function refreshStatus() {
        const el = document.getElementById('browser-status');
        const urlInput = document.getElementById('browser-url');
        if (!el) return;
        try {
            const [disp, st] = await Promise.all([window.DisplaySurface.status(), surface('status')]);
            const present = disp && disp.success && disp.data && disp.data.present;
            const live = st && st.success ? st.data : null;
            if (live && live.url) {
                if (urlInput && document.activeElement !== urlInput) urlInput.value = live.url;
                el.textContent = '● AGENT BROWSER · ' + (live.title || '').slice(0, 42);
                el.classList.add('online');
            } else if (present) {
                el.textContent = '● AGENT DISPLAY · SURFACE PENDING';
            } else {
                el.textContent = '● AGENT_DISPLAY_ABSENT';
            }
        } catch (e) {
            el.textContent = '● AGENT_DISPLAY_ABSENT';
        }
    }

    window.BrowserTab = Object.freeze({
        init: init,
        updateStatus: refreshStatus,
        onResearchTabReady: function () {},
        navigate: function (url) {
            const target = normalizeInput(url);
            if (target) surface('navigate?url=' + encodeURIComponent(target));
        },
        surface: surface,
    });
})();
