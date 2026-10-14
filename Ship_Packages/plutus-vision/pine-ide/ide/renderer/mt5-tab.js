/* =================================================================
   PLUTUS DASHBOARD — MT5 TERMINAL TAB
   Standalone IIFE — exposes window.MT5Tab. No dependencies.
   MetaTrader 5 bridge: account info, open positions, quick order entry.
   Communicates via window.plutus.mt5Bridge (IPC → mt5_bridge.py).
   ================================================================= */

(function () {
    'use strict';

    // ==================== CONSTANTS & STATE ====================
    const REFRESH_MS = 5000;          // poll cadence for account + positions
    const PAIRS = Object.freeze(['EURUSD+', 'GBPUSD+', 'AUDUSD+']);
    const ACCOUNT_FIELDS = Object.freeze([
        ['balance', 'Balance'],
        ['equity', 'Equity'],
        ['margin', 'Margin'],
        ['free_margin', 'Free Margin'],
        ['margin_level', 'Margin Level'],
    ]);

    let initialized = false;
    let accountTimer = null;
    let positionsTimer = null;
    let statusOnline = false;

    // ==================== CSS (injected once) ====================
    // Mirrors the block appended to styles.css; injected here so the tab
    // is self-contained even before the stylesheet reloads.
    const STYLE_BLOCK = `
<style id="mt5-tab-styles">
.mt5-root{display:flex;flex-direction:column;height:100%;background:var(--bg-base,#05070a);overflow:hidden;}
.mt5-account{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;padding:16px;background:var(--bg-panel,#0a0f17);border-bottom:1px solid var(--border-base,#1a2332);align-items:center;}
.mt5-account-item{display:flex;flex-direction:column;gap:4px;}
.mt5-account-label{font-family:var(--font-mono,monospace);font-size:10px;letter-spacing:1px;color:var(--text-muted,#5a6d8a);text-transform:uppercase;}
.mt5-account-value{font-family:var(--font-mono,monospace);font-size:16px;font-weight:700;color:var(--text-primary,#e6f1ff);}
.mt5-status-badge{font-size:12px;letter-spacing:1px;color:var(--accent-red,#ff3860);}
.mt5-status-badge.online{color:var(--accent-green,#00ff88);}
.mt5-positions{flex:1;overflow-y:auto;padding:8px;}
.mt5-positions table{width:100%;border-collapse:collapse;font-family:var(--font-mono,monospace);font-size:12px;}
.mt5-positions th{position:sticky;top:0;background:var(--bg-panel-elevated,#101621);padding:6px 8px;text-align:left;font-size:10px;letter-spacing:1px;color:var(--text-muted,#5a6d8a);}
.mt5-positions td{padding:6px 8px;color:var(--text-primary,#e6f1ff);border-bottom:1px solid var(--border-muted,#111820);}
.mt5-positions tbody tr:hover td{background:var(--bg-panel-hover,#131a27);}
.mt5-pos-pnl-pos{color:var(--accent-green,#00ff88);font-weight:700;}
.mt5-pos-pnl-neg{color:var(--accent-red,#ff3860);font-weight:700;}
.mt5-dir-badge{display:inline-block;padding:2px 8px;border-radius:var(--radius-sm,4px);font-size:10px;font-weight:700;letter-spacing:1px;}
.mt5-dir-buy{background:rgba(0,255,136,0.1);color:var(--accent-green,#00ff88);}
.mt5-dir-sell{background:rgba(255,56,96,0.1);color:var(--accent-red,#ff3860);}
.mt5-empty{color:var(--text-muted,#5a6d8a);text-align:center;padding:24px 8px!important;}
.mt5-order-form{display:flex;gap:8px;padding:12px;background:var(--bg-panel,#0a0f17);border-top:1px solid var(--border-base,#1a2332);flex-wrap:wrap;align-items:center;}
.mt5-input{padding:6px 10px;background:var(--bg-panel-elevated,#101621);border:1px solid var(--border-base,#1a2332);border-radius:var(--radius-sm,4px);color:var(--text-primary,#e6f1ff);font-family:var(--font-mono,monospace);font-size:12px;outline:none;}
.mt5-input:focus{border-color:var(--accent-cyan,#00f0ff);}
.mt5-btn{padding:6px 16px;border-radius:var(--radius-sm,4px);font-family:var(--font-mono,monospace);font-size:12px;font-weight:700;cursor:pointer;border:1px solid;transition:opacity 120ms ease;background:transparent;}
.mt5-btn-buy{background:rgba(0,255,136,0.1);border-color:rgba(0,255,136,0.3);color:var(--accent-green,#00ff88);}
.mt5-btn-sell{background:rgba(255,56,96,0.1);border-color:rgba(255,56,96,0.3);color:var(--accent-red,#ff3860);}
.mt5-btn-close{background:var(--bg-panel-elevated,#101621);border-color:var(--border-base,#1a2332);color:var(--text-secondary,#8b9bb4);}
.mt5-btn:hover{opacity:0.85;}
.mt5-btn:disabled{opacity:0.4;cursor:not-allowed;}
.mt5-err{color:var(--accent-red,#ff3860);font-family:var(--font-mono,monospace);font-size:11px;padding:4px 16px;}
</style>`;

    // ==================== HELPERS ====================
    function injectStyles() {
        if (document.getElementById('mt5-tab-styles')) return;
        document.head.insertAdjacentHTML('beforeend', STYLE_BLOCK);
    }

    function fmtMoney(v) {
        const n = Number(v);
        if (!isFinite(n)) return '--';
        return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function fmtPrice(v) {
        const n = Number(v);
        if (!isFinite(n)) return '--';
        return n.toFixed(5);
    }

    // THE NAMED STATES — the tab says exactly what is wrong and what fixes it (never a bare OFFLINE).
    const REMEDY = {
        MT5_NOT_LOGGED_IN: 'the MT5 terminal is not authorized — log it in, or put MT5_LOGIN / MT5_PASSWORD / MT5_SERVER in ~/.plutus-dashboard/brokers.mt5.env (a 0600 file) and restart the dashboard',
        MT5_RPYC_DOWN: 'the mt5linux RPyC server (wine, :2222) is not answering — start it, then this tab reconnects on its own',
        MT5_BRIDGE_DOWN: 'the MT5 bridge is not running — the dashboard starts it at boot; see ~/.plutus-dashboard/logs/mt5-bridge.log',
        MT5_BRIDGE_ABSENT: 'the MT5 bridge (plutus-mt5-bridge) is not installed next to the dashboard',
        MT5_DISCONNECTED: 'the MT5 terminal is not connected yet — retrying',
    };
    let mt5State = { code: 'CHECKING', detail: null };
    function stateOf(h) {
        if (!h) return { code: 'MT5_BRIDGE_DOWN', detail: null };
        if (!h.success) return { code: h.code === 'MT5_BRIDGE_ABSENT' ? 'MT5_BRIDGE_ABSENT' : 'MT5_BRIDGE_DOWN', detail: h.error || null };
        const d = h.data || {};
        if (d.connected) return { code: 'CONNECTED', detail: (d.account_id ? d.account_id + '@' + (d.server || '?') : null) };
        const st = d.state === 'NOT_AUTHORIZED' ? 'MT5_NOT_LOGGED_IN' : d.state === 'RPYC_DOWN' ? 'MT5_RPYC_DOWN' : 'MT5_DISCONNECTED';
        return { code: st, detail: d.last_error || null };
    }
    function setStatus(state) {
        mt5State = state;
        statusOnline = state.code === 'CONNECTED';
        const badge = document.getElementById('mt5-status-badge');
        const note = document.getElementById('mt5-state-note');
        if (badge) {
            badge.textContent = '● ' + (statusOnline ? 'CONNECTED' + (state.detail ? ' · ' + state.detail : '') : state.code);
            badge.classList.toggle('online', statusOnline);
        }
        if (note) {
            note.textContent = statusOnline ? '' : ((REMEDY[state.code] || '') + (state.detail ? ' — ' + state.detail : ''));
            note.style.display = statusOnline ? 'none' : 'block';
        }
        ['mt5-market', 'mt5-limit', 'mt5-close-all'].forEach(function (id) { const b = document.getElementById(id); if (b) b.disabled = !statusOnline; });
    }

    // ==================== LAYOUT BUILD ====================
    // Replaces the placeholder inside the MT5 panel with the full terminal.
    function buildLayout() {
        const panel = document.querySelector('.tab-panel[data-panel="mt5"]');
        if (!panel) return;

        const pairOpts = PAIRS.map((p) => `<option value="${p}">${p}</option>`).join('');

        panel.innerHTML =
            '<div class="mt5-root">' +
            // ── Account info (compact) ──
            '<div class="mt5-account" id="mt5-account">' +
            ACCOUNT_FIELDS.map(function (f) {
                return '<div class="mt5-account-item">' +
                    '<span class="mt5-account-label">' + f[1] + '</span>' +
                    '<span class="mt5-account-value" data-acct="' + f[0] + '">--</span>' +
                    '</div>';
            }).join('') +
            '<div class="mt5-account-item">' +
                '<span class="mt5-account-label">STATUS</span>' +
                '<span class="mt5-account-value mt5-status-badge" id="mt5-status-badge">● CHECKING</span>' +
            '</div>' +
            '</div>' +
            '<div class="mt5-err" id="mt5-state-note" style="display:none"></div>' +
            // ── Open positions (scrollable) ──
            '<div class="mt5-positions">' +
                '<table>' +
                    '<thead><tr>' +
                        '<th>PAIR</th><th>DIR</th><th>VOLUME</th><th>ENTRY</th><th>SL</th><th>TP</th><th>CURRENT</th><th>P&amp;L</th><th>TICKET</th><th>CLOSE</th>' +
                    '</tr></thead>' +
                    '<tbody id="mt5-positions-body">' +
                        '<tr><td colspan="10" class="mt5-empty">checking the MT5 bridge…</td></tr>' +
                    '</tbody>' +
                '</table>' +
            '</div>' +
            // ── Order entry form (compact) ──
            '<div class="mt5-order-form">' +
                '<select id="mt5-pair" class="mt5-input">' + pairOpts + '</select>' +
                '<select id="mt5-direction" class="mt5-input">' +
                    '<option value="BUY">BUY</option>' +
                    '<option value="SELL">SELL</option>' +
                '</select>' +
                '<input id="mt5-volume" class="mt5-input" type="number" step="0.01" min="0.01" value="0.01" title="Volume (lots)" />' +
                '<input id="mt5-entry" class="mt5-input" type="number" step="0.00001" placeholder="Entry" title="Limit order entry price" />' +
                '<input id="mt5-sl" class="mt5-input" type="number" step="0.00001" placeholder="SL" title="Stop loss (optional)" />' +
                '<input id="mt5-tp" class="mt5-input" type="number" step="0.00001" placeholder="TP" title="Take profit (optional)" />' +
                '<button id="mt5-market" class="mt5-btn mt5-btn-buy">Market Order</button>' +
                '<button id="mt5-limit" class="mt5-btn mt5-btn-sell">Limit Order</button>' +
                '<button id="mt5-close-all" class="mt5-btn mt5-btn-close">Close All</button>' +
            '</div>';

        wireForm();
        setStatus({ code: 'CHECKING', detail: null }); // orders stay DISABLED until a health read says CONNECTED
    }

    // ==================== FORM WIRING ====================
    function readForm() {
        const el = function (id) { return document.getElementById(id); };
        const slRaw = el('mt5-sl').value.trim();
        const tpRaw = el('mt5-tp').value.trim();
        return {
            pair: el('mt5-pair').value,
            direction: el('mt5-direction').value,
            lots: parseFloat(el('mt5-volume').value) || 0.01,
            entry: parseFloat(el('mt5-entry').value) || null,
            sl: slRaw ? parseFloat(slRaw) : null,
            tp: tpRaw ? parseFloat(tpRaw) : null,
        };
    }

    function wireForm() {
        const btn = function (id) { return document.getElementById(id); };

        btn('mt5-market').addEventListener('click', async function () {
            const order = readForm();
            delete order.entry;
            this.disabled = true;
            try {
                const res = await window.plutus.mt5Bridge.marketOrder(order);
                if (!res || !res.success) {
                    window.PlutusToast?.error?.('Market order failed: ' + (res?.error || 'unknown'));
                } else {
                    window.PlutusToast?.success?.('Market order placed: ' + (res.data?.symbol || order.pair) + ' @ ' + (res.data?.price || '?'));
                }
            } catch (e) {
                window.PlutusToast?.error?.('Market order error: ' + e.message);
            } finally {
                this.disabled = false;
                refreshPositions();
            }
        });

        btn('mt5-limit').addEventListener('click', async function () {
            const order = readForm();
            if (!order.entry) {
                window.PlutusToast?.error?.('Limit order requires an entry price');
                return;
            }
            this.disabled = true;
            try {
                const res = await window.plutus.mt5Bridge.limitOrder(order);
                if (!res || !res.success) {
                    window.PlutusToast?.error?.('Limit order failed: ' + (res?.error || 'unknown'));
                } else {
                    window.PlutusToast?.success?.('Limit order placed');
                }
            } catch (e) {
                window.PlutusToast?.error?.('Limit order error: ' + e.message);
            } finally {
                this.disabled = false;
                refreshPositions();
            }
        });

        btn('mt5-close-all').addEventListener('click', async function () {
            if (!confirm('Close ALL open positions?')) return;
            this.disabled = true;
            try {
                const res = await window.plutus.mt5Bridge.closeAll();
                if (!res || !res.success) {
                    window.PlutusToast?.error?.('Close-all failed: ' + (res?.error || 'unknown'));
                } else {
                    window.PlutusToast?.success?.('Closed ' + (res.closed || 0) + ' positions');
                }
            } catch (e) {
                window.PlutusToast?.error?.('Close-all error: ' + e.message);
            } finally {
                this.disabled = false;
                refreshPositions();
            }
        });
    }

    // ==================== DATA REFRESH ====================
    async function refreshAccount() {
        const bridge = window.plutus && window.plutus.mt5Bridge;
        if (!bridge) { setStatus({ code: 'MT5_BRIDGE_ABSENT', detail: 'the preload exposes no mt5Bridge' }); return; }
        try {
            const st = stateOf(await bridge.health());
            if (st.code !== 'CONNECTED') { setStatus(st); return; }
            const res = await bridge.getAccount();
            if (res && res.success && res.data) {
                const d = res.data;
                ACCOUNT_FIELDS.forEach(function (f) {
                    const el = document.querySelector('[data-acct="' + f[0] + '"]');
                    if (el) {
                        el.textContent = (f[0] === 'margin_level')
                            ? (d[f[0]] != null ? Number(d[f[0]]).toFixed(2) + '%' : '--')
                            : fmtMoney(d[f[0]]);
                    }
                });
                setStatus(st);
            } else {
                setStatus({ code: (res && res.code) || 'MT5_BRIDGE_DOWN', detail: (res && res.error) || null });
            }
        } catch (err) {
            setStatus({ code: 'MT5_BRIDGE_DOWN', detail: err.message });
        }
    }

    async function refreshPositions() {
        const body = document.getElementById('mt5-positions-body');
        if (!body) return;
        try {
            if (mt5State.code !== 'CONNECTED') {
                // never "No open positions" while the positions are unknowable
                body.innerHTML = '<tr><td colspan="10" class="mt5-empty mt5-err">positions unknown — ' + mt5State.code + '</td></tr>';
                return;
            }
            const res = await window.plutus.mt5Bridge.getPositions();
            if (!res || !res.success || !Array.isArray(res.data)) {
                body.innerHTML = '<tr><td colspan="10" class="mt5-empty mt5-err">positions unreadable — ' + ((res && (res.code || res.error)) || 'no answer') + '</td></tr>';
                return;
            }
            const positions = res.data;
            if (positions.length === 0) {
                body.innerHTML = '<tr><td colspan="10" class="mt5-empty">No open positions</td></tr>';
                return;
            }
            body.innerHTML = positions.map(function (p) {
                const isBuy = String(p.direction || p.type || '').toUpperCase().indexOf('BUY') >= 0;
                const dirCls = isBuy ? 'mt5-dir-buy' : 'mt5-dir-sell';
                const dirTxt = isBuy ? 'BUY' : 'SELL';
                const pnl = Number(p.profit != null ? p.profit : p.pnl);
                const pnlCls = pnl >= 0 ? 'mt5-pos-pnl-pos' : 'mt5-pos-pnl-neg';
                const ticket = p.ticket != null ? p.ticket : '--';
                return '<tr>' +
                    '<td>' + (p.pair || p.symbol || '--') + '</td>' +
                    '<td><span class="mt5-dir-badge ' + dirCls + '">' + dirTxt + '</span></td>' +
                    '<td>' + fmtMoney(p.volume != null ? p.volume : p.lots) + '</td>' +
                    '<td>' + fmtPrice(p.entry != null ? p.entry : p.price_open) + '</td>' +
                    '<td>' + (p.sl != null ? fmtPrice(p.sl) : '--') + '</td>' +
                    '<td>' + (p.tp != null ? fmtPrice(p.tp) : '--') + '</td>' +
                    '<td>' + fmtPrice(p.current != null ? p.current : p.price_current) + '</td>' +
                    '<td class="' + pnlCls + '">' + (isFinite(pnl) ? (pnl >= 0 ? '+' : '') + fmtMoney(pnl) : '--') + '</td>' +
                    '<td>' + ticket + '</td>' +
                    '<td><button class="mt5-btn mt5-btn-close" data-close="' + ticket + '">Close</button></td>' +
                '</tr>';
            }).join('');

            // Wire each Close button.
            body.querySelectorAll('[data-close]').forEach(function (btn) {
                btn.addEventListener('click', async function () {
                    const ticket = this.getAttribute('data-close');
                    this.disabled = true;
                    try {
                        const res = await window.plutus.mt5Bridge.closePosition(ticket);
                        if (!res || !res.success) {
                            window.PlutusToast?.error?.('Close failed: ' + (res?.error || 'unknown'));
                        } else {
                            window.PlutusToast?.success?.('Position ' + ticket + ' closed');
                        }
                    } catch (e) {
                        window.PlutusToast?.error?.('Close error: ' + e.message);
                    } finally {
                        refreshPositions();
                    }
                });
            });
        } catch (err) {
            body.innerHTML = '<tr><td colspan="10" class="mt5-empty mt5-err">Failed to load positions: ' +
                (err.message || 'unknown') + '</td></tr>';
        }
    }

    // ==================== INIT (lazy, called by TabManager) ====================
    function init() {
        if (initialized) return;
        initialized = true;
        injectStyles();
        buildLayout();
        // health first, then the positions it gates (one ordered tick; the bridge may still be starting)
        const tick = function () { return refreshAccount().then(refreshPositions); };
        tick();
        accountTimer = setInterval(tick, REFRESH_MS);
    }

    // ==================== PUBLIC API ====================
    window.MT5Tab = Object.freeze({
        init,
        refreshAccount,
        refreshPositions,
    });
})();
