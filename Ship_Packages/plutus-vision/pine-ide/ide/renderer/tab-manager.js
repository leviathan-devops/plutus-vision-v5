/* =================================================================
   PLUTUS DASHBOARD — TAB MANAGER
   8-tab switcher (DATA / AGENT / TRADE / BROWSER / MT5 / JOURNAL / BACKTEST / PINE SHELL)
   Standalone IIFE — exposes window.TabManager. No dependencies.
   ================================================================= */

(function () {
    'use strict';

    // ==================== CONSTANTS & STATE ====================
    const TABS = Object.freeze(['data', 'agent', 'trade', 'browser', 'mt5', 'journal', 'backtest', 'pine']);
    const STORAGE_KEY = 'plutus-active-tab';
    const DEFAULT_TAB = 'data';

    const initializedTabs = new Set(); // tabs that ran their one-time init
    let activeTab = DEFAULT_TAB;

    // ==================== LAZY INITIALIZATION ====================
    // Runs a tab's one-time init hook on first activation. 'data' needs no
    // hook (default tab); the others call window.<X>Tab.init() if present.
    function initTab(tabName) {
        if (initializedTabs.has(tabName)) return;
        initializedTabs.add(tabName);
        switch (tabName) {
            case 'agent':
                if (typeof window.AgentTab?.init === 'function') window.AgentTab.init();
                break;
            case 'trade':
                if (typeof window.TradeTab?.init === 'function') window.TradeTab.init();
                break;
            case 'browser':
                if (typeof window.BrowserTab?.init === 'function') window.BrowserTab.init();
                break;
            case 'mt5':
                if (typeof window.MT5Tab?.init === 'function') window.MT5Tab.init();
                break;
            case 'data':
            default:
                break; // 'data' is always initialized — no lazy hook.
        }
    }

    // ==================== TAB SWITCHING ====================
    // Swaps panels, updates button states, runs lazy init, persists the
    // selection, and broadcasts 'tab-switched'. Scoped to [data-tab] so the
    // pair/agent sub-tabs in app.js (which reuse .tab-btn) stay untouched.
    function switchTab(tabName) {
        if (!TABS.includes(tabName)) return;
        document.querySelectorAll('.tab-panel').forEach((panel) => {
            panel.style.display = 'none';
        });
        const target = document.querySelector(`.tab-panel[data-panel="${tabName}"]`);
        if (target) target.style.display = 'flex';

        document.querySelectorAll('.tab-btn[data-tab]').forEach((btn) => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        activeTab = tabName;
        initTab(tabName);
        try {
            localStorage.setItem(STORAGE_KEY, tabName);
        } catch (err) {
            console.warn('[Plutus] Failed to persist active tab:', err.message);
        }
        // ── D3 (measured 2026-09-29): the compositor surface must follow the tab
        // on EVERY switch path, not only a click on the legacy inline handler.
        // The top rail switches through THIS function, and it never told
        // DisplaySurface — so the WEB RESEARCH tab showed "SURFACE PENDING" over
        // black and `startSurface('browser')` was never called (no "surface
        // browser up" in the log). One notification, after the panel is visible.
        try {
            if (window.DisplaySurface && typeof window.DisplaySurface.onTabSwitch === 'function') {
                Promise.resolve(window.DisplaySurface.onTabSwitch(tabName)).catch(function (err) {
                    console.warn('[Plutus] DisplaySurface.onTabSwitch rejected:', err && err.message ? err.message : String(err));
                });
            }
        } catch (err) {
            console.warn('[Plutus] DisplaySurface.onTabSwitch failed:', err && err.message ? err.message : String(err));
        }
        document.dispatchEvent(
            new CustomEvent('tab-switched', { detail: { tab: tabName } })
        );
    }

    function getActiveTab() {
        return activeTab;
    }

    // ==================== BADGE API ====================
    // Shows/updates a numeric badge in a tab button; a falsy count removes it.
    function setBadge(tabName, count) {
        const btn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
        if (!btn) return;
        let badge = btn.querySelector('.tab-badge');
        if (!count) {
            if (badge) badge.remove();
            return;
        }
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'tab-badge';
            btn.appendChild(badge);
        }
        badge.textContent = String(count);
    }

    function clearBadge(tabName) {
        const btn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
        if (!btn) return;
        const badge = btn.querySelector('.tab-badge');
        if (badge) badge.remove();
    }

    // ==================== KEYBOARD SHORTCUTS ====================
    // Ctrl+1..8 → data / agent / trade / browser / mt5 / journal / backtest / pine. Skipped while typing
    // in a form control, or when another modifier is held.
    document.addEventListener('keydown', (event) => {
        if (!event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;
        const el = event.target;
        if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) {
            return;
        }
        const index = parseInt(event.key, 10) - 1; // '1'..'4' → 0..3
        if (index >= 0 && index < TABS.length) {
            event.preventDefault();
            switchTab(TABS[index]);
        }
    });

    // ==================== WIRING & STATE RESTORATION ====================
    function wireTabButtons() {
        document.querySelectorAll('.tab-btn[data-tab]').forEach((btn) => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });
    }

    function restoreState() {
        let saved = null;
        try {
            saved = localStorage.getItem(STORAGE_KEY);
        } catch (err) {
            console.warn('[Plutus] Failed to read persisted tab:', err.message);
        }
        switchTab(TABS.includes(saved) ? saved : DEFAULT_TAB);
    }

    function bootstrap() {
        wireTabButtons();
        restoreState();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap(); // loaded after DOMContentLoaded (defer / end-of-body)
    }

    // ==================== PUBLIC API ====================
    window.TabManager = Object.freeze({
        switchTab,
        setBadge,
        clearBadge,
        getActiveTab,
    });
})();
