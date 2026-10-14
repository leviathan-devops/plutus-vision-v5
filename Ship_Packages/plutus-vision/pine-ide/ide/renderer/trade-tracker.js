/* =================================================================
   PLUTUS DASHBOARD — TRADE TRACKER
   Real-time active-trade tracker mounted below the TradingView
   canvas in the TRADE tab. Standalone IIFE — exposes
   window.TradeTracker. No dependencies on app.js.
   ================================================================= */

(function () {
    'use strict';

    const MAX_VISIBLE_ROWS = 20;
    const CLOSED_FADE_DELAY_MS = 3000;
    const FADE_DURATION_MS = 460;
    const STYLE_ID = 'trade-tracker-styles';
    const COLUMNS = ['PAIR', 'DIR', 'ENTRY', 'SL', 'TP', 'STATUS', 'R-MULT', 'P&L', 'TIME'];
    const NUMERIC_COLS = [2, 3, 4, 6, 7]; // ENTRY, SL, TP, R-MULT, P&L

    const state = {
        initialized: false, collapsed: false, container: null,
        trades: new Map(),         // trade_uid -> normalized trade
        rowMap: new Map(),         // trade_uid -> <tr> element
        fadeTimers: new Map(),     // trade_uid -> setTimeout id
        closedToday: [],           // { result, closedAt } for win-rate
        closedRecorded: new Set(), // uids already counted in closedToday
        selectedUid: null, wsHandle: null, els: {},
    };

    // ==================== CSS INJECTION ====================
    const CSS = `
/* Stack canvas + tracker vertically: .tab-panel defaults to flex-row
   and #trade-placeholder uses height:100% — both would misplace the tracker. */
.tab-panel[data-panel="trade"]{flex-direction:column;}
#trade-placeholder{flex:1 1 0;min-height:0;height:auto;}
#trade-tracker-container{flex:0 0 auto;}
.tt-root{font-family:var(--font-mono,'SF Mono','Fira Code','Consolas',monospace);background:var(--bg-panel,#0a0f17);border-top:1px solid var(--border-base,#1a2332);color:var(--text-primary,#e6f1ff);}
.tt-header{height:32px;display:flex;align-items:center;gap:14px;padding:0 12px;background:var(--bg-panel-elevated,#101621);border-bottom:1px solid var(--border-base,#1a2332);user-select:none;}
.tt-collapsed .tt-header{border-bottom-color:transparent;}
.tt-title{font-size:11px;font-weight:700;letter-spacing:2px;color:var(--accent-cyan,#00f0ff);text-shadow:var(--glow-cyan,0 0 10px rgba(0,240,255,.25));white-space:nowrap;}
.tt-stats{display:flex;gap:16px;margin-left:6px;}
.tt-stat{display:flex;align-items:baseline;gap:5px;font-size:10px;}
.tt-stat-label{color:var(--text-muted,#5a6d8a);letter-spacing:1px;}
.tt-stat-value{font-size:11px;font-weight:700;color:var(--text-primary,#e6f1ff);}
.tt-spacer{flex:1;}
.tt-ws{font-size:9px;font-weight:700;letter-spacing:1px;color:var(--accent-red,#ff3860);}
.tt-ws.tt-ws-on{color:var(--accent-green,#00ff88);}
.tt-collapse-btn{background:none;border:1px solid var(--border-base,#1a2332);border-radius:var(--radius-sm,4px);color:var(--text-secondary,#8b9bb4);width:24px;height:20px;font-size:9px;line-height:1;cursor:pointer;font-family:inherit;transition:color var(--transition-fast,120ms ease),border-color var(--transition-fast,120ms ease);}
.tt-collapse-btn:hover{border-color:var(--accent-cyan,#00f0ff);color:var(--accent-cyan,#00f0ff);}
.tt-body{max-height:340px;overflow-y:auto;}
.tt-table{width:100%;border-collapse:collapse;font-size:11px;}
.tt-table thead th{position:sticky;top:0;z-index:1;background:var(--bg-panel,#0a0f17);color:var(--text-muted,#5a6d8a);font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;text-align:left;padding:6px 10px;border-bottom:1px solid var(--border-base,#1a2332);}
.tt-table thead th.tt-num{text-align:right;}
.tt-table td{padding:5px 10px;border-bottom:1px solid var(--border-muted,#111820);white-space:nowrap;}
.tt-num{text-align:right;font-variant-numeric:tabular-nums;}
.tt-pair{color:var(--text-primary,#e6f1ff);font-weight:700;letter-spacing:.5px;}
.tt-row{cursor:pointer;transition:opacity var(--transition-base,200ms ease);}
.tt-row:hover td{background:var(--bg-panel-hover,#131a27);}
.tt-row.tt-selected td{background:rgba(0,240,255,.06);box-shadow:inset 0 0 0 1px var(--accent-cyan,#00f0ff);}
.tt-long{color:var(--accent-green,#00ff88);font-weight:700;}
.tt-short{color:var(--accent-red,#ff3860);font-weight:700;}
.tt-muted{color:var(--text-muted,#5a6d8a);}
.tt-pos{color:var(--accent-green,#00ff88);}
.tt-neg{color:var(--accent-red,#ff3860);}
.tt-badge{display:inline-block;padding:1px 7px;border-radius:var(--radius-sm,4px);font-size:9px;font-weight:700;letter-spacing:1px;}
.tt-badge-open{color:var(--accent-green,#00ff88);background:rgba(0,255,136,.08);border:1px solid rgba(0,255,136,.3);}
.tt-badge-pending{color:var(--accent-gold,#ffd166);background:rgba(255,209,102,.08);border:1px solid rgba(255,209,102,.3);}
.tt-badge-closed{color:var(--text-secondary,#8b9bb4);background:rgba(139,155,180,.08);border:1px solid rgba(139,155,180,.25);}
.tt-empty{padding:18px;text-align:center;color:var(--text-muted,#5a6d8a);font-size:10px;letter-spacing:1px;}
.tt-row-new{animation:tt-slide-in 240ms ease-out;}
@keyframes tt-slide-in{from{opacity:0;transform:translateX(-14px);}to{opacity:1;transform:none;}}
.tt-row-closing{opacity:0;}
`;

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;
        const s = document.createElement('style');
        s.id = STYLE_ID;
        s.textContent = CSS;
        document.head.appendChild(s);
    }

    // ==================== HELPERS ====================
    function num(v) { if (v == null || v === '') return null; const n = Number(v); return Number.isFinite(n) ? n : null; }
    function tsOf(t) { const ms = new Date(t.entry_timestamp).getTime(); return Number.isFinite(ms) ? ms : 0; }
    function isToday(ts) {
        const d = ts ? new Date(ts) : null;
        if (!d || isNaN(d.getTime())) return false;
        const now = new Date();
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    }

    // The WS/API push snake_case fields; app.js-style normalized
    // fields (entry/sl/tp/pnl) are accepted as fallbacks.
    function normalizeTrade(raw) {
        if (!raw || typeof raw !== 'object') return null;
        const uid = raw.trade_uid || raw.uid || raw.id;
        if (!uid) return null;
        return {
            trade_uid: String(uid),
            pair: raw.pair || '—',
            direction: String(raw.direction || '').toUpperCase(),
            entry_price: num(raw.entry_price != null ? raw.entry_price : raw.entry),
            sl_price: num(raw.sl_price != null ? raw.sl_price : raw.sl),
            tp_price: num(raw.tp_price != null ? raw.tp_price : raw.tp),
            status: String(raw.status || 'PENDING').toUpperCase(),
            result: raw.result ? String(raw.result).toUpperCase() : null,
            pnl_usd: num(raw.pnl_usd != null ? raw.pnl_usd : raw.pnl),
            r_multiple: num(raw.r_multiple != null ? raw.r_multiple : raw.rrr_actual),
            entry_timestamp: raw.entry_timestamp || raw.timestamp || raw.created_at || Date.now(),
        };
    }

    function formatPrice(pair, p) { return p == null ? '—' : (pair === 'DXY' ? p.toFixed(2) : p.toFixed(5)); }
    function formatPnl(v) { return v == null ? '—' : (v >= 0 ? '+$' : '-$') + Math.abs(v).toFixed(2); }
    function formatR(v) { return v == null ? '—' : (v >= 0 ? '+' : '') + v.toFixed(1) + 'R'; }
    function formatTime(ts) {
        const d = ts ? new Date(ts) : null;
        return d && !isNaN(d.getTime())
            ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
            : '—';
    }
    function valueClass(v) { return v > 0 ? 'tt-pos' : v < 0 ? 'tt-neg' : 'tt-muted'; }

    // ==================== DOM ====================
    // Static markup only — no dynamic values are interpolated.
    function buildDOM(container) {
        container.innerHTML =
            '<div class="tt-root">' +
                '<div class="tt-header">' +
                    '<span class="tt-title">▮ TRADE TRACKER</span>' +
                    '<div class="tt-stats">' +
                        statHTML('OPEN') + statHTML('NET P&L') + statHTML('WIN RATE') +
                    '</div>' +
                    '<div class="tt-spacer"></div>' +
                    '<span class="tt-ws">● WS OFF</span>' +
                    '<button type="button" class="tt-collapse-btn" title="Collapse / expand trade tracker">▼</button>' +
                '</div>' +
                '<div class="tt-body"><table class="tt-table">' +
                    '<thead><tr>' +
                        COLUMNS.map((label, i) => '<th' + (NUMERIC_COLS.includes(i) ? ' class="tt-num"' : '') + '>' + label + '</th>').join('') +
                    '</tr></thead>' +
                    '<tbody><tr class="tt-empty-row"><td colspan="' + COLUMNS.length + '" class="tt-empty">NO ACTIVE TRADES — WAITING FOR ENTRIES</td></tr></tbody>' +
                '</table></div>' +
            '</div>';
        const q = sel => container.querySelector(sel);
        const statVals = container.querySelectorAll('.tt-stat-value');
        state.els = {
            root: q('.tt-root'), body: q('.tt-body'), tbody: q('tbody'), emptyRow: q('.tt-empty-row'),
            openCountEl: statVals[0], totalPnlEl: statVals[1], winRateEl: statVals[2],
            wsDot: q('.tt-ws'), collapseBtn: q('.tt-collapse-btn'),
        };
        state.els.collapseBtn.addEventListener('click', toggle);
    }

    function statHTML(label) {
        return '<span class="tt-stat"><span class="tt-stat-label">' + label + '</span><span class="tt-stat-value">—</span></span>';
    }

    function buildRow(trade) {
        const tr = document.createElement('tr');
        tr.className = 'tt-row';
        tr.dataset.uid = trade.trade_uid;
        for (let i = 0; i < COLUMNS.length; i++) {
            const td = document.createElement('td');
            if (NUMERIC_COLS.includes(i)) td.className = 'tt-num';
            tr.appendChild(td);
        }
        tr.children[0].className = 'tt-pair';
        fillRow(tr, trade);
        tr.addEventListener('click', () => selectTrade(trade.trade_uid));
        return tr;
    }

    // Fills all 9 cells in place — used on creation AND on live
    // TRADE_UPDATE patches (targeted update, no rebuild flicker).
    function fillRow(tr, t) {
        const c = tr.children;
        c[0].textContent = t.pair;
        const isLong = t.direction === 'LONG' || t.direction === 'BUY';
        const isShort = t.direction === 'SHORT' || t.direction === 'SELL';
        c[1].textContent = isLong ? '▲ LONG' : isShort ? '▼ SHORT' : (t.direction || '—');
        c[1].className = isLong ? 'tt-long' : isShort ? 'tt-short' : 'tt-muted';
        c[2].textContent = formatPrice(t.pair, t.entry_price);
        c[3].textContent = formatPrice(t.pair, t.sl_price);
        c[4].textContent = formatPrice(t.pair, t.tp_price);
        const badgeClass = t.status === 'OPEN' ? 'tt-badge-open' : t.status === 'PENDING' ? 'tt-badge-pending' : 'tt-badge-closed';
        c[5].textContent = '';
        c[5].appendChild(el('span', 'tt-badge ' + badgeClass, [t.status]));
        c[6].textContent = formatR(t.r_multiple);
        c[6].className = 'tt-num ' + valueClass(t.r_multiple);
        c[7].textContent = formatPnl(t.pnl_usd);
        c[7].className = 'tt-num ' + valueClass(t.pnl_usd);
        c[8].textContent = formatTime(t.entry_timestamp);
    }

    function el(tag, className, children) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        (children || []).forEach(ch => node.appendChild(typeof ch === 'string' ? document.createTextNode(ch) : ch));
        return node;
    }

    // Inserts at sorted position (entry_timestamp desc, newest first).
    function insertRow(trade, animate) {
        const existing = state.rowMap.get(trade.trade_uid);
        if (existing) { fillRow(existing, trade); return; }
        const tr = buildRow(trade);
        if (animate) tr.classList.add('tt-row-new');
        const ts = tsOf(trade);
        let ref = state.els.emptyRow; // data rows always sit above the empty-state row
        for (const row of state.els.tbody.querySelectorAll('tr.tt-row')) {
            const other = state.trades.get(row.dataset.uid);
            if (other && tsOf(other) < ts) { ref = row; break; }
        }
        state.els.tbody.insertBefore(tr, ref);
        state.rowMap.set(trade.trade_uid, tr);
        toggleEmptyState();
    }

    function removeRow(uid, animate) {
        const timer = state.fadeTimers.get(uid);
        if (timer) { clearTimeout(timer); state.fadeTimers.delete(uid); }
        const row = state.rowMap.get(uid);
        const finish = () => {
            if (row && row.parentNode) row.parentNode.removeChild(row);
            state.rowMap.delete(uid);
            state.trades.delete(uid);
            toggleEmptyState();
        };
        if (animate && row) { row.classList.add('tt-row-closing'); setTimeout(finish, FADE_DURATION_MS); }
        else finish();
    }

    function pruneOverflow() {
        while (state.rowMap.size > MAX_VISIBLE_ROWS) {
            let oldestUid = null, oldestTs = Infinity;
            state.trades.forEach((t, uid) => {
                if (!state.rowMap.has(uid)) return;
                const ts = tsOf(t);
                if (ts < oldestTs) { oldestTs = ts; oldestUid = uid; }
            });
            if (!oldestUid) break;
            removeRow(oldestUid, false); // evicted, not closed — no win-rate accounting
        }
    }

    function toggleEmptyState() {
        state.els.emptyRow.style.display = state.rowMap.size > 0 ? 'none' : '';
    }

    // ==================== SUMMARY BAR ====================
    function recordClosed(trade) {
        if (state.closedRecorded.has(trade.trade_uid)) return;
        state.closedRecorded.add(trade.trade_uid);
        state.closedToday.push({ result: trade.result, closedAt: Date.now() });
    }

    function computeWinRate() {
        const decided = state.closedToday.filter(e => e.result === 'WIN' || e.result === 'LOSS' || e.result === 'BREAKEVEN' || e.result === 'BE');
        if (decided.length === 0) return null;
        return (decided.filter(e => e.result === 'WIN').length / decided.length) * 100;
    }

    function updateSummary() {
        const open = Array.from(state.trades.values()).filter(t => t.status === 'OPEN');
        const openPnl = open.reduce((sum, t) => sum + (t.pnl_usd || 0), 0);
        state.els.openCountEl.textContent = String(open.length);
        state.els.totalPnlEl.textContent = formatPnl(openPnl);
        state.els.totalPnlEl.className = 'tt-stat-value ' + valueClass(openPnl);
        const wr = computeWinRate();
        state.els.winRateEl.textContent = wr == null ? '—' : wr.toFixed(0) + '%';
        state.els.winRateEl.className = 'tt-stat-value ' + (wr == null ? '' : wr >= 50 ? 'tt-pos' : 'tt-neg');
    }

    // ==================== TRADE LIFECYCLE ====================
    function addTrade(raw) {
        const trade = normalizeTrade(raw);
        if (!trade) { console.warn('[Plutus] TradeTracker: rejected malformed trade payload', raw); return false; }
        if (state.trades.has(trade.trade_uid)) return updateTrade(trade.trade_uid, trade); // duplicate NEW_TRADE → update path
        if (trade.status === 'CLOSED') { recordClosed(trade); updateSummary(); return true; } // closed before first sight — win-rate only
        state.trades.set(trade.trade_uid, trade);
        insertRow(trade, true);
        pruneOverflow();
        updateSummary();
        return true;
    }

    function updateTrade(uid, patch) {
        if (!uid || !patch || typeof patch !== 'object') return false;
        const existing = state.trades.get(String(uid));
        if (!existing) return addTrade(Object.assign({}, patch, { trade_uid: uid })); // late arrival — synthesize row
        const merged = normalizeTrade(Object.assign({}, existing, patch, { trade_uid: String(uid) }));
        if (!merged) return false;
        const prevStatus = existing.status;
        state.trades.set(merged.trade_uid, merged);
        if (merged.status === 'CLOSED' && prevStatus !== 'CLOSED') {
            scheduleCloseFade(merged);
        } else if (merged.status !== 'CLOSED') {
            // Cancel a pending close-fade — the trade was resurrected
            // (CLOSED → OPEN/PENDING patch arrived before the 3s fade fired).
            const timer = state.fadeTimers.get(merged.trade_uid);
            if (timer) { clearTimeout(timer); state.fadeTimers.delete(merged.trade_uid); }
            const row = state.rowMap.get(merged.trade_uid);
            if (row) fillRow(row, merged);
            else insertRow(merged, false); // e.g. re-appearing after prune eviction
        }
        updateSummary();
        return true;
    }

    // CLOSED trades stay visible 3s (badge flips gray), then fade out;
    // the result feeds the win-rate stat.
    function scheduleCloseFade(trade) {
        const row = state.rowMap.get(trade.trade_uid);
        if (row) fillRow(row, trade);
        if (state.fadeTimers.has(trade.trade_uid)) clearTimeout(state.fadeTimers.get(trade.trade_uid));
        state.fadeTimers.set(trade.trade_uid, setTimeout(() => {
            state.fadeTimers.delete(trade.trade_uid);
            recordClosed(trade);
            removeRow(trade.trade_uid, true);
            updateSummary();
        }, CLOSED_FADE_DELAY_MS));
    }

    // ==================== ROW SELECTION ====================
    function selectTrade(uid) {
        const trade = state.trades.get(uid);
        if (!trade) return;
        state.rowMap.forEach(row => row.classList.remove('tt-selected'));
        const row = state.rowMap.get(uid);
        if (row) row.classList.add('tt-selected');
        state.selectedUid = uid;
        if (window.TradeTab && typeof window.TradeTab.navigateToPair === 'function') {
            try { window.TradeTab.navigateToPair(trade.pair); }
            catch (err) { console.warn('[Plutus] TradeTracker: navigateToPair failed:', err.message); }
        }
        document.dispatchEvent(new CustomEvent('trade-selected', { detail: Object.assign({}, trade) }));
    }

    // ==================== WEBSOCKET ====================
    function setWsStatus(on) {
        if (!state.els.wsDot) return;
        state.els.wsDot.textContent = on ? '● WS LIVE' : '● WS OFF';
        state.els.wsDot.classList.toggle('tt-ws-on', on);
    }

    function handleWsMessage(msg) {
        if (!msg || typeof msg !== 'object') return; // bridge passes raw strings through on parse failure
        switch (msg.type) {
            case 'NEW_TRADE':
                if (msg.trade) addTrade(msg.trade);
                break;
            case 'TRADE_UPDATE':
                if (msg.uid && msg.patch) updateTrade(msg.uid, msg.patch);
                break;
            case 'CONNECTION_ACK': case 'SUBSCRIBE_ACK': case 'PONG': case 'HEARTBEAT':
                break; // protocol noise — nothing to render
            default:
                break; // POSEIDON_UPDATE / SPLIT_TEST_UPDATE belong to app.js
        }
    }

    function connectWS() {
        // Preload bridge exposes the factory as `connect` (the internal
        // function is named createWebSocket) — accept both keys.
        const bridge = window.dashboardWs;
        const connectFn = bridge && (typeof bridge.connect === 'function' ? bridge.connect : bridge.createWebSocket);
        if (typeof connectFn !== 'function') {
            console.warn('[Plutus] TradeTracker: dashboardWs bridge unavailable — running in manual mode');
            setWsStatus(false);
            return;
        }
        try {
            state.wsHandle = connectFn({
                onOpen: () => {
                    setWsStatus(true);
                    if (state.wsHandle && typeof state.wsHandle.send === 'function') {
                        state.wsHandle.send({ type: 'SUBSCRIBE', channels: ['trades'] });
                    }
                },
                onClose: () => setWsStatus(false),
                onError: () => setWsStatus(false),
                onMessage: handleWsMessage,
            });
        } catch (err) {
            console.warn('[Plutus] TradeTracker: WebSocket connect failed:', err.message);
            setWsStatus(false);
        }
    }

    // ==================== INITIAL SEED ====================
    // Populate from REST so the table is not empty until the first push.
    async function seedFromApi() {
        const api = window.dashboardApi;
        if (!api || typeof api.getTrades !== 'function') return;
        try {
            const resp = await api.getTrades({ limit: 100 });
            if (!resp || !resp.success || !resp.data || !Array.isArray(resp.data.trades)) return;
            resp.data.trades.forEach(raw => {
                const t = normalizeTrade(raw);
                if (!t) return;
                if (t.status === 'OPEN' || t.status === 'PENDING') {
                    if (!state.trades.has(t.trade_uid)) { state.trades.set(t.trade_uid, t); insertRow(t, false); }
                } else if (t.status === 'CLOSED' && isToday(raw.close_timestamp || raw.exit_timestamp || raw.updated_at || t.entry_timestamp)) {
                    recordClosed(t);
                }
            });
            pruneOverflow();
            updateSummary();
            console.log('[Plutus] TradeTracker: seeded ' + state.trades.size + ' active trades from API');
        } catch (err) {
            console.warn('[Plutus] TradeTracker: seed fetch failed:', err.message);
        }
    }

    // ==================== PUBLIC API ====================
    function init(container) {
        if (state.initialized) return;
        if (!container || typeof container.appendChild !== 'function') {
            console.error('[Plutus] TradeTracker.init: a valid container element is required');
            return;
        }
        state.container = container;
        injectStyles();
        buildDOM(container);
        state.initialized = true;
        updateSummary();
        connectWS();
        seedFromApi();
        console.log('[Plutus] TradeTracker initialized');
    }

    function toggle() {
        if (!state.initialized) return;
        state.collapsed = !state.collapsed;
        state.els.body.style.display = state.collapsed ? 'none' : '';
        state.els.collapseBtn.textContent = state.collapsed ? '▲' : '▼';
        state.els.root.classList.toggle('tt-collapsed', state.collapsed);
        // ACTUALLY collapse: shrink the parent container to just the header height.
        if (state.els.root.parentElement) {
            state.els.root.parentElement.style.height = state.collapsed ? '32px' : '';
        }
    }

    function getOpenCount() {
        let count = 0;
        state.trades.forEach(t => { if (t.status === 'OPEN') count++; });
        return count;
    }

    window.TradeTracker = Object.freeze({
        init,        // Initialize with container element
        toggle,      // Collapse/expand
        addTrade,    // Manually add a trade (for testing)
        updateTrade, // Manually update a trade
        getOpenCount // Return number of open trades
    });
})();
