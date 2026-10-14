/* =================================================================
   PLUTUS DASHBOARD — APPLICATION LOGIC
   Vanilla JS SPA — Phase 1
   ================================================================= */

(function () {
    'use strict';

    // ==================== CONFIG ====================
    // Values are read from the preload bridge (window.dashboardConfig)
    // which loads them from ~/.plutus-dashboard/config.json. Hardcoded
    // fallbacks are only used when running outside Electron.
    const _dc = window.dashboardConfig || {};
    const CONFIG = {
        // FIX (W6R): this was hardcoded to :9420 (a port nothing serves) while
        // the comment claimed the preload bridge — so EVERY data page
        // (DATA/ANALYTICS/OVERVIEW/JOURNAL) died with "Failed to fetch".
        // The dashboard's own API is the preload bridge's apiBase (:9430).
        API_BASE: (_dc.apiBase || 'http://127.0.0.1:9851') + '/api/v1',
        WS_URL: _dc.wsUrl || 'ws://127.0.0.1:9431',
        // Bearer token for the dashboard API (rw = read+write scoped).
        AUTH_TOKEN: _dc.authToken || 'rw_dev_plutus_backtest',
        RECONNECT_MIN: 1000,
        RECONNECT_MAX: 30000,
        REFRESH_INTERVAL: 30000,
        TRADE_LIMIT: 100,
        // Map sidebar nav IDs -> API macro_page values.
        MACRO_PAGE_MAP: {
            'live-funded': 'live_funded',
            'live-demo': 'live_demo',
            'backtesting': 'backtest',
        },
    };

    // ==================== STATE ====================
    const State = {
        currentPage: 'overview',
        currentMacroPage: null,
        currentPair: null,
        currentAgent: null,
        trades: [],
        agents: [],
        ofHands: [],
        poseidonCycles: [],
        splitTests: [],
        health: {},
        offline: false,
        sortColumn: 'timestamp',
        sortDirection: 'desc',
        expandedRow: null,
        ws: null,
        wsConnected: false,
        wsReconnectAttempts: 0,
        wsReconnectTimer: null,
        refreshTimer: null,
        currentCalendarDate: null,
        calendarViewMonth: null,
        tradeDays: [],
        tradeDaysMap: {},
        calendarOpen: false,
    };

    const PAIRS = ['EURUSD', 'GBPUSD', 'AUDUSD', 'DXY'];

    // ==================== DOM HELPERS ====================
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    function el(tag, attrs = {}, children = []) {
        const node = document.createElement(tag);
        for (const key in attrs) {
            if (key === 'class') node.className = attrs[key];
            else if (key === 'html') node.innerHTML = attrs[key];
            else if (key === 'text') node.textContent = attrs[key];
            else if (key.startsWith('on') && typeof attrs[key] === 'function') {
                node.addEventListener(key.slice(2).toLowerCase(), attrs[key]);
            } else if (key === 'dataset') {
                Object.assign(node.dataset, attrs[key]);
            } else {
                node.setAttribute(key, attrs[key]);
            }
        }
        const kids = Array.isArray(children) ? children : [children];
        kids.forEach(c => {
            if (c == null) return;
            node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
        });
        return node;
    }

    function clearNode(node) {
        while (node.firstChild) node.removeChild(node.firstChild);
    }

    function formatPrice(pair, price) {
        if (price == null) return '—';
        if (pair === 'DXY') return price.toFixed(2);
        return price.toFixed(5);
    }

    function formatPnL(val) {
        if (val == null) return '—';
        const sign = val >= 0 ? '+' : '';
        return `${sign}$${val.toFixed(2)}`;
    }

    function formatR(val) {
        if (val == null) return '—';
        const sign = val >= 0 ? '+' : '';
        return `${sign}${val.toFixed(1)}R`;
    }

    function formatTimestamp(ts) {
        if (!ts) return '—';
        const d = new Date(ts);
        return d.toLocaleString('en-US', {
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
    }

    function formatTimeShort(ts) {
        if (!ts) return '—';
        const d = new Date(ts);
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    }

    // ==================== DATA NORMALIZERS ====================
    // The dashboard UI expects a stable set of field names. The real API
    // stores trades with richer snake_case fields (pnl_usd, entry_price,
    // entry_timestamp, setup_type, rrr_planned...). These mappers adapt the
    // live API payload to the shape the render code consumes.

    function normalizeTrade(t) {
        if (!t) return t;
        return Object.assign({}, t, {
            id: t.id || t.trade_uid,
            trade_uid: t.trade_uid || t.id,
            timestamp: t.entry_timestamp || t.timestamp || t.created_at,
            entry_timestamp: t.entry_timestamp || t.timestamp,
            entry: t.entry_price != null ? t.entry_price : t.entry,
            sl: t.sl_price != null ? t.sl_price : t.sl,
            tp: t.tp_price != null ? t.tp_price : t.tp,
            exit: t.exit_price != null ? t.exit_price : t.exit,
            setup: t.setup_type || t.setup_category || t.setup,
            rrr: t.rrr_planned != null ? t.rrr_planned : t.rrr,
            // The UI displays P&L in USD; pnl_usd is the source of truth.
            pnl: t.pnl_usd != null ? t.pnl_usd : t.pnl,
            r_multiple: t.r_multiple != null ? t.r_multiple : t.rrr_actual,
            confidence_tier: t.confidence_tier,
            confidence_score: t.confidence_score,
            result: t.result,
            status: t.status,
            pair: t.pair,
            direction: t.direction,
            shape: t.shape,
            session: t.session,
            macro_page: t.macro_page,
            agent_id: t.agent_id,
            agent_version: t.agent_version,
            entry_reasoning: t.entry_reasoning,
            exit_reasoning: t.exit_reasoning,
        });
    }

    function normalizeAgent(a) {
        if (!a) return a;
        const rawStatus = String(a.status || '').toLowerCase();
        // Map API status ("ACTIVE") to UI expectation ("active").
        const status = rawStatus === 'active' || rawStatus === 'healthy'
            ? 'active'
            : rawStatus === 'degraded' ? 'degraded'
            : rawStatus === 'down' || rawStatus === 'offline' ? 'down'
            : (rawStatus || 'unknown');
        // API win_rate is a decimal (0.6); UI expects a percentage (60).
        let winRate = a.win_rate;
        if (winRate != null && winRate <= 1) winRate = winRate * 100;
        return Object.assign({}, a, {
            id: a.agent_id || a.id,
            name: a.name || a.agent_id,
            version: a.agent_version || a.version,
            status: status,
            total_trades: a.trade_count != null ? a.trade_count : a.total_trades,
            win_rate: winRate,
            pnl: a.net_pnl_usd != null ? a.net_pnl_usd : a.pnl,
            avg_r: a.avg_r_multiple != null ? a.avg_r_multiple : a.avg_r,
            pair: a.macro_page || a.pair || 'ALL',
            last_active: a.last_trade || a.last_active,
            strategy: a.strategy || a.setup,
        });
    }

    function normalizeCycle(c) {
        if (!c) return c;
        // API stores findings/improvement_plan as JSON-encoded strings.
        let findings = [];
        if (Array.isArray(c.findings)) findings = c.findings;
        else if (typeof c.findings === 'string' && c.findings.trim()) {
            try { findings = JSON.parse(c.findings); } catch (e) { findings = [c.findings]; }
        }
        // Promote plain-string findings into { text, severity } objects and
        // infer a severity from LP-* tags (HIGH/MED/LOW).
        findings = (Array.isArray(findings) ? findings : []).map(function (f) {
            if (f && typeof f === 'object') return f;
            const text = String(f);
            let severity = 'info';
            if (/HIGH|CRIT|DANGER/i.test(text)) severity = 'danger';
            else if (/MED|WARN/i.test(text)) severity = 'warning';
            else if (/LOW|INFO|PASS/i.test(text)) severity = 'success';
            return { text: text, severity: severity };
        });
        let plan = c.improvement_plan;
        if (typeof plan === 'string' && plan.trim()) {
            try { plan = JSON.parse(plan); } catch (e) { /* keep raw */ }
        }
        const actionTaken = String(c.action_taken || '').toLowerCase();
        return Object.assign({}, c, {
            timestamp: c.triggered_at || c.timestamp || c.created_at,
            // ANALYSIS_ONLY etc. are terminal states in this dashboard view.
            status: c.status || (actionTaken ? 'complete' : 'analyzing'),
            title: c.title || ('Cycle #' + c.id + ' — ' + (c.analysis_type || 'Deep') + ' Analysis'),
            pair: c.pair,
            score: c.score != null ? c.score : null,
            findings: findings,
            improvement_plan: plan,
            recommendation: c.action_reasoning || c.recommendation || null,
        });
    }

    function normalizeOFHand(h) {
        if (!h) return h;
        let status;
        if (h.status) status = String(h.status).toLowerCase();
        else if (h.active === false) status = 'inactive';
        else if (h.degraded === true) status = 'paused';
        else if (h.active === true) status = 'active';
        else status = 'unknown';
        return Object.assign({}, h, {
            status: status,
            last_active: h.last_active,
            pair: h.pair,
            account: h.account,
        });
    }

    // ==================== OFFLINE BANNER ====================
    // Global visual indicator shown when the live API cannot be reached.
    // In production we never fall back to mock data; we surface the
    // connection failure prominently.
    function showOfflineBanner(show) {
        let banner = $('#offline-banner');
        if (show) {
            State.offline = true;
            if (!banner) {
                banner = el('div', { id: 'offline-banner', class: 'offline-banner' }, [
                    el('span', { class: 'offline-banner-icon', text: '' }),
                    el('span', { text: 'Dashboard API unreachable. Is the dashboard running?' }),
                ]);
                // Fixed-position overlay so it survives page navigations
                // without disturbing the sidebar/main flex layout.
                document.body.appendChild(banner);
            }
        } else {
            State.offline = false;
            if (banner) banner.remove();
        }
    }

    // ==================== API CLIENT ====================
    const API = {
        async request(path, params = {}) {
            const url = new URL(CONFIG.API_BASE + path);
            for (const key in params) {
                if (params[key] != null) url.searchParams.set(key, params[key]);
            }
            try {
                const resp = await fetch(url.toString(), {
                    headers: {
                        'Authorization': 'Bearer ' + CONFIG.AUTH_TOKEN,
                        'Accept': 'application/json',
                    },
                });
                if (!resp.ok) throw new Error('API ' + resp.status + ': ' + resp.statusText);
                const json = await resp.json();
                if (json && json.success === false) {
                    throw new Error(json.error || json.message || 'API request failed');
                }
                // Unwrap the { success, data } envelope so callers receive the
                // payload directly (e.g. { trades, total } / { agents }).
                showOfflineBanner(false);
                if (json && json.data != null) return json.data;
                return json;
            } catch (err) {
                // PRODUCTION: surface the connection error and raise the
                // offline banner. Never silently degrade.
                console.error('[Plutus] API request failed for ' + path + ':', err.message);
                showOfflineBanner(true);
                throw err;
            }
        },

        async getTrades(macroPage, pair, agentId, limit, offset, date) {
            // Translate the sidebar nav id into the API macro_page value and
            // drop "ALL" sentinels — the API filters these literally.
            const apiMacroPage = macroPage ? (CONFIG.MACRO_PAGE_MAP[macroPage] || macroPage) : null;
            const data = await this.request('/trades', {
                macro_page: apiMacroPage,
                pair: (pair && pair !== 'ALL') ? pair : null,
                agent_id: (agentId && agentId !== 'ALL') ? agentId : null,
                limit: limit || CONFIG.TRADE_LIMIT,
                offset: offset || 0,
                date: date || null,
            });
            const trades = (data && Array.isArray(data.trades) ? data.trades : []).map(normalizeTrade);
            return { trades: trades, total: (data && data.total != null) ? data.total : trades.length };
        },

        async getAgents() {
            const data = await this.request('/agents');
            const agents = (data && Array.isArray(data.agents) ? data.agents : []).map(normalizeAgent);
            return { agents: agents };
        },

        async getTradeDays(macroPage) {
            const apiMacroPage = macroPage ? (CONFIG.MACRO_PAGE_MAP[macroPage] || macroPage) : null;
            const data = await this.request('/trades/calendar', { macro_page: apiMacroPage });
            return (data && Array.isArray(data.days)) ? data.days : [];
        },

        async getPoseidonCycles() {
            const data = await this.request('/poseidon/cycles');
            const cycles = (data && Array.isArray(data.cycles) ? data.cycles : []).map(normalizeCycle);
            return { cycles: cycles };
        },

        async getSplitTests() {
            const data = await this.request('/split-tests');
            // API key is split_tests; legacy mock used "tests".
            const tests = (data && (data.split_tests || data.tests)) || [];
            return { tests: tests };
        },

        async getHealth() {
            return this.request('/health');
        },

        async getOFHands() {
            const data = await this.request('/of/hands');
            const hands = (data && Array.isArray(data.hands) ? data.hands : (Array.isArray(data) ? data : []))
                .map(normalizeOFHand);
            return { hands: hands };
        },

        async controlOFHand(handId, action) {
            try {
                const resp = await fetch(CONFIG.API_BASE + '/of/hands/' + handId + '/control', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + CONFIG.AUTH_TOKEN,
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({ action: action }),
                });
                const json = await resp.json();
                if (!json.success) throw new Error(json.error || 'Control request failed');
                return json;
            } catch (err) {
                console.warn('OF control request failed for hand ' + handId + ':', err.message);
                showOfflineBanner(true);
                return { success: false, error: err.message, data: {} };
            }
        },
    };

    // ==================== WEBSOCKET CLIENT ====================
    const WS = {
        connect() {
            if (State.ws && (State.ws.readyState === WebSocket.OPEN || State.ws.readyState === WebSocket.CONNECTING)) {
                return;
            }
            updateWSStatus('connecting');

            try {
                State.ws = new WebSocket(CONFIG.WS_URL);
            } catch (err) {
                console.warn('[Plutus] WebSocket creation failed:', err.message);
                this._scheduleReconnect();
                return;
            }

            State.ws.onopen = () => {
                console.log('[Plutus] WebSocket connected');
                State.wsConnected = true;
                State.wsReconnectAttempts = 0;
                updateWSStatus('connected');
            };

            State.ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    this.handleMessage(msg);
                } catch (err) {
                    console.warn('[Plutus] WS message parse error:', err.message);
                }
            };

            State.ws.onerror = (err) => {
                console.warn('[Plutus] WebSocket error');
            };

            State.ws.onclose = () => {
                console.log('[Plutus] WebSocket disconnected');
                State.wsConnected = false;
                updateWSStatus('disconnected');
                this._scheduleReconnect();
            };
        },

        _scheduleReconnect() {
            if (State.wsReconnectTimer) clearTimeout(State.wsReconnectTimer);
            const attempt = State.wsReconnectAttempts;
            const delay = Math.min(CONFIG.RECONNECT_MIN * Math.pow(2, attempt), CONFIG.RECONNECT_MAX);
            const jitter = delay * 0.2 * Math.random();
            const finalDelay = Math.round(delay + jitter);
            console.log(`[Plutus] Reconnecting in ${finalDelay}ms (attempt ${attempt + 1})`);
            updateWSStatus('connecting', `${finalDelay}ms`);
            State.wsReconnectTimer = setTimeout(() => {
                State.wsReconnectAttempts++;
                this.connect();
            }, finalDelay);
        },

        handleMessage(msg) {
            if (!msg || !msg.type) return;

            switch (msg.type) {
                case 'NEW_TRADE':
                    this._handleNewTrade(msg.data || msg.payload || msg.trade);
                    break;
                case 'POSEIDON_UPDATE':
                    this._handlePoseidonUpdate(msg.data || msg.payload || msg.cycle);
                    break;
                case 'SPLIT_TEST_UPDATE':
                    this._handleSplitTestUpdate(msg.data || msg.payload || msg.test);
                    break;
                case 'TRADE_UPDATE':
                    this._handleTradeUpdate(msg.data || msg.payload || msg.trade);
                    break;
                case 'HEARTBEAT':
                    // keep-alive, no action needed
                    break;
                default:
                    console.log('[Plutus] Unknown WS message type:', msg.type);
            }
        },

        _handleNewTrade(trade) {
            if (!trade || !trade.id) return;
            console.log('[Plutus] New trade received:', trade.id);
            State.trades.unshift(trade);
            // Keep reasonable limit
            if (State.trades.length > 500) State.trades.pop();

            if (isMacroPage(State.currentPage)) {
                renderCurrentPage();
                // Flash the new row
                setTimeout(() => {
                    const firstRow = $('.trade-table tbody tr');
                    if (firstRow) firstRow.classList.add('new-flash');
                }, 50);
            }
        },

        _handleTradeUpdate(trade) {
            if (!trade || !trade.id) return;
            const idx = State.trades.findIndex(t => t.id === trade.id);
            if (idx >= 0) {
                State.trades[idx] = { ...State.trades[idx], ...trade };
                if (isMacroPage(State.currentPage)) renderCurrentPage();
            }
        },

        _handlePoseidonUpdate(cycle) {
            if (!cycle || !cycle.id) return;
            const idx = State.poseidonCycles.findIndex(c => c.id === cycle.id);
            if (idx >= 0) {
                State.poseidonCycles[idx] = { ...State.poseidonCycles[idx], ...cycle };
            } else {
                State.poseidonCycles.unshift(cycle);
            }
            if (State.currentPage === 'poseidon') renderPoseidonPage();
        },

        _handleSplitTestUpdate(test) {
            if (!test || !test.id) return;
            const idx = State.splitTests.findIndex(t => t.id === test.id);
            if (idx >= 0) {
                State.splitTests[idx] = { ...State.splitTests[idx], ...test };
            } else {
                State.splitTests.push(test);
            }
            if (State.currentPage === 'split-tests') renderSplitTestsPage();
        },

        disconnect() {
            if (State.wsReconnectTimer) clearTimeout(State.wsReconnectTimer);
            if (State.ws) {
                State.ws.onclose = null; // prevent reconnect
                State.ws.close();
                State.ws = null;
            }
        }
    };

    // ==================== NAVIGATION ====================
    function isMacroPage(page) {
        return ['live-funded', 'live-demo', 'backtesting'].includes(page);
    }

    async function navigateToPage(page) {
        State.currentPage = page;
        State.expandedRow = null;

        if (isMacroPage(page)) {
            if (State.currentMacroPage !== page) {
                State.currentMacroPage = page;
                State.currentPair = PAIRS[0];
                State.currentAgent = 'ALL';
                State.currentCalendarDate = null;
                State.calendarViewMonth = null;
                State.calendarOpen = false;
                State.tradeDays = [];
                State.tradeDaysMap = {};
            }
        }

        // Update active nav button
        $$('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });

        await renderCurrentPage();
    }

    async function renderCurrentPage() {
        const main = $('#main-content');
        clearNode(main);

        const page = State.currentPage;

        if (page === 'overview') {
            return renderOverviewPage(main);
        }
        if (page === 'analytics') {
            return renderAnalyticsPage(main);
        }
        if (page === 'journal') {
            return renderJournalPage(main);
        }
        if (isMacroPage(page)) {
            return renderMacroPage(main);
        }
        if (page === 'poseidon') {
            return renderPoseidonPage();
        }
        if (page === 'split-tests') {
            return renderSplitTestsPage();
        }
        if (page === 'agents') {
            return renderAgentsPage();
        }
    }

    // ==================== PAGE: OVERVIEW ====================
    async function renderOverviewPage(container) {
        clearNode(container);
        container.appendChild(el('div', { class: 'page-header' }, [
            el('div', {}, [
                el('div', { class: 'page-title', text: 'Overview' }),
                el('div', { class: 'page-subtitle', text: 'Live system metrics across all agents and pairs' }),
            ]),
            el('div', { class: 'page-actions' }, [
                el('button', { class: 'nav-btn', text: 'REFRESH', onclick: () => renderCurrentPage() }),
            ]),
        ]));

        const loading = el('div', { class: 'loading' }, [el('div', { class: 'spinner' }), el('span', { text: 'Loading metrics...' })]);
        container.appendChild(loading);

        try {
            // Fetch all trades across pairs/agents for overview, plus OF Hands
            // (the authoritative source of "active agents") and health.
            const [tradesResp, agentsResp, splitResp, healthResp, ofResp] = await Promise.all([
                API.getTrades(null, 'ALL', 'ALL', 500, 0),
                API.getAgents(),
                API.getSplitTests(),
                API.getHealth(),
                API.getOFHands().catch(function () { return { hands: [] }; }),
            ]);

            State.trades = tradesResp.trades || [];
            State.agents = agentsResp.agents || [];
            State.splitTests = splitResp.tests || [];
            State.health = healthResp || {};
            State.ofHands = (ofResp && ofResp.hands) || [];

            container.removeChild(loading);
            renderOverviewContent(container);
        } catch (err) {
            if (container.contains(loading)) {
                loading.innerHTML = '<div class="empty-state"><div class="empty-state-icon"></div>'
                    + '<div class="empty-state-text">Dashboard API unreachable. '
                    + 'Is the dashboard running?</div>'
                    + '<div style="margin-top:8px;font-size:11px;color:#9A958C;">'
                    + escapeHTML(err.message) + '</div></div>';
            }
        }
    }

    function renderOverviewContent(container) {
        const trades = State.trades;
        const wins = trades.filter(t => t.result === 'WIN').length;
        const losses = trades.filter(t => t.result === 'LOSS').length;
        const bes = trades.filter(t => t.result === 'BE').length;
        const decided = wins + losses + bes;
        const winRate = decided > 0 ? ((wins / decided) * 100) : 0;
        const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const totalR = trades.reduce((sum, t) => sum + (t.r_multiple || 0), 0);
        const avgR = trades.length > 0 ? totalR / trades.length : 0;
        const godTier = trades.filter(t => t.confidence_tier === 'God-Tier').length;
        // Active agents = OpenFang Hands that are currently active (STEP 4).
        const activeAgents = State.ofHands.filter(h => h.status === 'active').length;
        const totalAgents = State.ofHands.length || State.agents.length;
        const activeSplitTests = State.splitTests.filter(t => t.status === 'running').length;

        const metricsGrid = el('div', { class: 'metrics-grid' });

        metricsGrid.appendChild(makeMetric('Total Trades', trades.length, `${decided} decided`, 'blue'));
        metricsGrid.appendChild(makeMetric('Win Rate', `${winRate.toFixed(1)}%`, `${wins}W / ${losses}L / ${bes}BE`, winRate >= 50 ? 'positive' : 'negative'));
        metricsGrid.appendChild(makeMetric('Net P&L', formatPnL(totalPnL), 'All time', totalPnL >= 0 ? 'positive' : 'negative'));
        metricsGrid.appendChild(makeMetric('Avg R-Multiple', formatR(avgR), `Total ${formatR(totalR)}`, avgR >= 0 ? 'positive' : 'negative'));
        metricsGrid.appendChild(makeMetric('God-Tier Trades', godTier, `${((godTier/Math.max(trades.length,1))*100).toFixed(0)}% of total`, 'gold'));
        metricsGrid.appendChild(makeMetric('Active Agents', activeAgents, `${totalAgents} total`, 'blue'));
        metricsGrid.appendChild(makeMetric('Active Split Tests', activeSplitTests, `${State.splitTests.length} total`, 'blue'));

        // Health status mini-grid — map the real /health payload fields.
        const h = State.health || {};
        const dbOk = h.db ? h.db.connected : true;
        const apiStatus = h.status === 'healthy' ? 'online' : (h.status || 'online');
        const wsInfo = h.websocket || {};
        const agentsInfo = h.agents || {};
        const healthCard = el('div', { class: 'detail-section detail-full', style: 'margin-top:8px;' }, [
            el('div', { class: 'detail-section-title', text: '🩺 System Health' }),
            el('div', { class: 'agent-metrics' }, [
                makeHealthRow('API Server', apiStatus),
                makeHealthRow('WebSocket Server', State.wsConnected ? 'connected' : (wsInfo.port ? 'configured' : 'disconnected')),
                makeHealthRow('Database', dbOk ? 'connected' : 'disconnected'),
                makeHealthRow('Tracked Agents', agentsInfo.active != null ? `${agentsInfo.active} active` : 'idle'),
                makeHealthRow('API Version', h.version || '—'),
            ]),
        ]);

        container.appendChild(metricsGrid);
        container.appendChild(el('div', { style: 'margin-top: 8px;' }, [healthCard]));

        // Recent trades preview
        container.appendChild(el('div', { class: 'page-title', style: 'font-size:18px; margin-top:28px; margin-bottom:12px;', text: 'Recent Trades' }));
        const recentTrades = [...trades].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 15);
        if (recentTrades.length === 0) {
            container.appendChild(makeEmptyState('', 'No trades yet'));
        } else {
            container.appendChild(renderTradeTable(recentTrades, true));
        }
    }

    function makeMetric(label, value, subtext, colorClass = '') {
        return el('div', { class: 'metric-card' }, [
            el('div', { class: 'metric-label', text: label }),
            el('div', { class: `metric-value ${colorClass}`, text: String(value) }),
            el('div', { class: 'metric-subtext', text: subtext }),
        ]);
    }

    function makeHealthRow(label, status) {
        const isOk = ['online', 'connected', 'healthy', 'active', 'idle'].includes(status);
        return el('div', { class: 'agent-metric' }, [
            el('span', { class: 'agent-metric-label', text: label }),
            el('span', { class: 'agent-metric-value', style: `color: ${isOk ? 'var(--accent-green)' : 'var(--accent-red)'};`, text: status }),
        ]);
    }

    // ==================== CALENDAR DROPDOWN ====================
    function renderCalendarWidget() {
        if (!State.calendarViewMonth) {
            var now = new Date();
            State.calendarViewMonth = { year: now.getFullYear(), month: now.getMonth() };
        }

        var filterLabel = 'All Days';
        if (State.currentCalendarDate) {
            var d = State.currentCalendarDate;
            var parts = d.split('-');
            var mn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            filterLabel = mn[parseInt(parts[1])-1] + ' ' + parseInt(parts[2]) + ', ' + parts[0];
        }

        var container = el('div', { id: 'cal-dropdown', style: 'margin-bottom:16px;' });

        var btn = el('button', { id: 'cal-toggle', style: 'width:100%;padding:8px 14px;background:#141416;border:1px solid #26262A;border-radius:6px;color:#E8E4DC;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:8px;font-family:inherit;' }, [
            el('span', { text: '\uD83D\uDCC5' }),
            el('span', { id: 'cal-label', text: filterLabel, style: 'flex:1;text-align:left;' }),
            el('span', { id: 'cal-arrow', text: '\u25BC', style: 'font-size:10px;color:#6A675F;' }),
        ]);

        var panel = el('div', { id: 'cal-panel', style: 'display:none;background:#141416;border:1px solid #B99A5B;border-top:none;border-radius:0 0 6px 6px;padding:10px 14px 14px;' });

        var nav = el('div', { style: 'display:flex;align-items:center;gap:8px;margin-bottom:10px;' }, [
            el('button', { id: 'cal-prev', text: '\u2039', style: 'background:transparent;border:1px solid #26262A;color:#9A958C;padding:3px 10px;border-radius:4px;cursor:pointer;font-size:13px;', onclick: function() { shiftCalendarMonth(-1); } }),
            el('span', { id: 'cal-month', text: getCalendarMonthLabel(State.calendarViewMonth), style: 'font-size:13px;font-weight:700;color:#E8E4DC;min-width:120px;text-align:center;' }),
            el('button', { id: 'cal-next', text: '\u203A', style: 'background:transparent;border:1px solid #26262A;color:#9A958C;padding:3px 10px;border-radius:4px;cursor:pointer;font-size:13px;', onclick: function() { shiftCalendarMonth(1); } }),
            el('button', { id: 'cal-all', text: 'ALL DAYS', style: 'background:transparent;border:1px solid ' + (State.currentCalendarDate === null ? '#B99A5B' : '#26262A') + ';color:' + (State.currentCalendarDate === null ? '#B99A5B' : '#9A958C') + ';padding:3px 10px;border-radius:4px;cursor:pointer;font-size:10px;font-weight:600;margin-left:auto;', onclick: function() { State.currentCalendarDate = null; State.expandedRow = null; renderCurrentPage(); } }),
        ]);
        panel.appendChild(nav);
        panel.appendChild(renderCalendarGrid());

        btn.onclick = function() {
            var isOpen = panel.style.display === 'block';
            panel.style.display = isOpen ? 'none' : 'block';
            var arrow = document.getElementById('cal-arrow');
            if (arrow) arrow.textContent = isOpen ? '\u25BC' : '\u25B2';
        };

        container.appendChild(btn);
        container.appendChild(panel);
        return container;
    }

    function shiftCalendarMonth(delta) {
        var m = State.calendarViewMonth;
        var newMonth = m.month + delta;
        var newYear = m.year;
        if (newMonth < 0) { newMonth = 11; newYear--; }
        if (newMonth > 11) { newMonth = 0; newYear++; }
        State.calendarViewMonth = { year: newYear, month: newMonth };
        var title = $('#cal-month');
        if (title) title.textContent = getCalendarMonthLabel(State.calendarViewMonth);
        var panel = $('#cal-panel');
        if (panel) {
            var oldGrid = panel.querySelector('.calendar-grid-wrap');
            if (oldGrid) oldGrid.remove();
            panel.appendChild(renderCalendarGrid());
        }
    }

    function renderCalendarGrid() {
        var wrap = el('div', { class: 'calendar-grid-wrap' });
        var grid = el('div', { class: 'calendar-grid' });
        ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(function(d) {
            grid.appendChild(el('div', { class: 'calendar-day-header', text: d }));
        });
        var vm = State.calendarViewMonth;
        var firstDay = new Date(vm.year, vm.month, 1);
        var daysInMonth = new Date(vm.year, vm.month + 1, 0).getDate();
        var startWeekday = (firstDay.getDay() + 6) % 7;
        var prevMonthLastDay = new Date(vm.year, vm.month, 0).getDate();
        for (var i = startWeekday - 1; i >= 0; i--) {
            grid.appendChild(el('div', { class: 'calendar-day other-month' }, [
                el('span', { class: 'calendar-day-num', text: String(prevMonthLastDay - i) }),
            ]));
        }
        var todayStr = new Date().toISOString().slice(0, 10);
        for (var day = 1; day <= daysInMonth; day++) {
            var dateStr = vm.year + '-' + String(vm.month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
            var tradeCount = State.tradeDaysMap[dateStr] || 0;
            var classes = 'calendar-day';
            if (tradeCount > 0) classes += ' has-trades';
            if (dateStr === State.currentCalendarDate) classes += ' selected';
            if (dateStr === todayStr) classes += ' today';
            var children = [el('span', { class: 'calendar-day-num', text: String(day) })];
            if (tradeCount > 0) {
                children.push(el('div', { class: 'calendar-day-trade-dot' }));
                children.push(el('span', { class: 'calendar-day-trade-count', text: String(tradeCount) }));
            }
            (function(d) {
                grid.appendChild(el('div', {
                    class: classes,
                    onclick: function(e) {
                        State.currentCalendarDate = (State.currentCalendarDate === d) ? null : d;
                        State.expandedRow = null;
                        renderCurrentPage();
                    },
                }, children));
            })(dateStr);
        }
        var totalCells = startWeekday + daysInMonth;
        var trailing = (7 - (totalCells % 7)) % 7;
        for (var t = 1; t <= trailing; t++) {
            grid.appendChild(el('div', { class: 'calendar-day other-month' }, [
                el('span', { class: 'calendar-day-num', text: String(t) }),
            ]));
        }
        wrap.appendChild(grid);
        return wrap;
    }

    function getCalendarMonthLabel(vm) {
        var names = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        return names[vm.month] + ' ' + vm.year;
    }

    // ==================== PAGE: MACRO (Funded/Demo/Backtest) ====================
    async function renderMacroPage(container) {
        const page = State.currentPage;
        const titles = {
            'live-funded': { title: 'Live — Funded', sub: 'Real capital execution trades' },
            'live-demo': { title: 'Live — Demo', sub: 'Paper trading / forward test trades' },
            'backtesting': { title: 'Backtesting', sub: 'Historical simulation results' },
        };
        const meta = titles[page] || titles['live-funded'];

        container.appendChild(el('div', { class: 'page-header' }, [
            el('div', {}, [
                el('div', { class: 'page-title', text: meta.title }),
                el('div', { class: 'page-subtitle', text: meta.sub }),
            ]),
            el('div', { class: 'page-actions' }, [
                el('button', { class: 'nav-btn', text: 'REFRESH', onclick: () => renderCurrentPage() }),
            ]),
        ]));

        container.appendChild(renderCalendarWidget());

        // Pair tabs
        const tabBar = el('div', { class: 'tab-bar' });
        PAIRS.forEach(pair => {
            const btn = el('button', {
                class: `tab-btn pair-${pair.toLowerCase()} ${State.currentPair === pair ? 'active' : ''}`,
                text: pair,
                onclick: () => {
                    State.currentPair = pair;
                    State.currentAgent = 'ALL';
                    State.expandedRow = null;
                    renderCurrentPage();
                },
            });
            tabBar.appendChild(btn);
        });
        container.appendChild(tabBar);

        // Agent sub-tabs (dynamic)
        const agentBar = el('div', { class: 'tab-bar', id: 'agent-tab-bar' });
        agentBar.appendChild(el('button', {
            class: `tab-btn ${State.currentAgent === 'ALL' ? 'active' : ''}`,
            text: 'ALL AGENTS',
            onclick: () => { State.currentAgent = 'ALL'; State.expandedRow = null; renderCurrentPage(); },
        }));
        container.appendChild(agentBar);

        // Trade content area — loadAndRenderTrades() targets this container,
        // NOT #main-content, so the page header (with refresh button) and
        // tab bars survive trade re-renders / auto-refresh.
        const tradeContent = el('div', { id: 'trade-content' });
        tradeContent.appendChild(el('div', { class: 'loading' }, [el('div', { class: 'spinner' }), el('span', { text: 'Loading trades...' })]));
        container.appendChild(tradeContent);

        // Load agents and trades
        try {
            const [agentsResp, daysResp] = await Promise.all([
                API.getAgents(),
                API.getTradeDays(State.currentMacroPage).catch(function() { return []; }),
            ]);
            State.agents = agentsResp.agents || [];
            State.tradeDays = daysResp;
            State.tradeDaysMap = {};
            daysResp.forEach(function(d) { State.tradeDaysMap[d.date] = d.count; });
            renderAgentTabs(State.agents);

            await loadAndRenderTrades();
        } catch (err) {
            const tc = $('#trade-content') || container;
            clearNode(tc);
            tc.appendChild(makeEmptyState('', `Error loading data: ${err.message}`));
        }
    }

    function renderAgentTabs(agents) {
        const bar = $('#agent-tab-bar');
        if (!bar) return;

        // Clear non-ALL buttons
        $$('.tab-btn', bar).forEach(b => b.remove());

        // Agent display names mapping
        var agentNames = {
            'plutus-1': '\u26A1 Plutus',
            'plutus-backtest': '\uD83C\uDCCF Backtest',
            'plutus-live': '\uD83D\uDC8E Live',
            'plutus-demo': '\uD83D\uDCB0 Demo',
            'manual_paper': '\u270B Manual',
        };

        // Dedup by agent.id — the API may still return one row per version/
        // page for legacy data; never render duplicate agent tabs (Wave D).
        var seen = {};
        agents.forEach(agent => {
            if (!agent || !agent.id || seen[agent.id]) return;
            seen[agent.id] = true;
            var displayName = agentNames[agent.id] || agent.name || agent.id;
            bar.appendChild(el('button', {
                class: `tab-btn ${State.currentAgent === agent.id ? 'active' : ''}`,
                text: displayName,
                title: agent.id,
                onclick: () => { State.currentAgent = agent.id; State.expandedRow = null; renderCurrentPage(); },
            }));
        });
    }

    async function loadAndRenderTrades() {
        const container = $('#trade-content') || $('#main-content');
        clearNode(container);

        try {
            const resp = await API.getTrades(
                State.currentMacroPage, State.currentPair, State.currentAgent,
                CONFIG.TRADE_LIMIT, 0, State.currentCalendarDate
            );
            State.trades = resp.trades || resp || [];

            // Quick metrics for this pair/agent view
            const metricsRow = el('div', { class: 'metrics-grid', style: 'grid-template-columns: repeat(4, 1fr); margin-bottom:20px;' });
            const trades = State.trades;
            const wins = trades.filter(t => t.result === 'WIN').length;
            const losses = trades.filter(t => t.result === 'LOSS').length;
            const decided = wins + losses + trades.filter(t => t.result === 'BE').length;
            const winRate = decided > 0 ? (wins / decided) * 100 : 0;
            const pnl = trades.reduce((s, t) => s + (t.pnl || 0), 0);
            const avgR = trades.length > 0 ? trades.reduce((s, t) => s + (t.r_multiple || 0), 0) / trades.length : 0;

            metricsRow.appendChild(makeMetric('Trades', trades.length, `${State.currentPair}`, 'blue'));
            metricsRow.appendChild(makeMetric('Win Rate', `${winRate.toFixed(1)}%`, `${wins}W / ${losses}L`, winRate >= 50 ? 'positive' : 'negative'));
            metricsRow.appendChild(makeMetric('Net P&L', formatPnL(pnl), State.currentAgent, pnl >= 0 ? 'positive' : 'negative'));
            metricsRow.appendChild(makeMetric('Avg R', formatR(avgR), `${trades.length} trades`, avgR >= 0 ? 'positive' : 'negative'));
            container.appendChild(metricsRow);

            // Trade table
            if (trades.length === 0) {
                container.appendChild(makeEmptyState('', `No trades for ${State.currentPair}`));
            } else {
                container.appendChild(renderTradeTable(trades, false));
            }
        } catch (err) {
            container.appendChild(makeEmptyState('', `Error: ${err.message}`));
        }
    }

    // ==================== TRADE TABLE ====================
    const COLUMNS = [
        { key: 'timestamp', label: 'Timestamp', sortable: true, type: 'date' },
        { key: 'pair', label: 'Pair', sortable: true, type: 'pair' },
        { key: 'direction', label: 'Dir', sortable: true, type: 'direction' },
        { key: 'setup', label: 'Setup', sortable: true, type: 'text' },
        { key: 'shape', label: 'Shape', sortable: true, type: 'text' },
        { key: 'entry', label: 'Entry', sortable: true, type: 'price' },
        { key: 'sl', label: 'SL', sortable: true, type: 'price' },
        { key: 'tp', label: 'TP', sortable: true, type: 'price' },
        { key: 'rrr', label: 'RRR', sortable: true, type: 'num' },
        { key: 'confidence_tier', label: 'Conf', sortable: true, type: 'confidence' },
        { key: 'result', label: 'Result', sortable: true, type: 'result' },
        { key: 'r_multiple', label: 'R-Mult', sortable: true, type: 'r' },
        { key: 'pnl', label: 'P&L', sortable: true, type: 'pnl' },
    ];

    function renderTradeTable(trades, compact) {
        // Sort trades
        const sorted = sortTrades([...trades], State.sortColumn, State.sortDirection);

        const tableWrap = el('div', { class: 'table-container' });
        const table = el('table', { class: 'trade-table' });

        // Header
        const thead = el('thead');
        const headerRow = el('tr');
        const cols = compact ? COLUMNS.filter(c => !['shape', 'sl', 'tp', 'rrr'].includes(c.key)) : COLUMNS;
        cols.forEach(col => {
            const th = el('th', {
                class: `${col.type === 'num' || col.type === 'price' || col.type === 'r' || col.type === 'pnl' ? 'num' : ''}`,
                text: col.label,
                onclick: () => {
                    if (State.sortColumn === col.key) {
                        State.sortDirection = State.sortDirection === 'asc' ? 'desc' : 'asc';
                    } else {
                        State.sortColumn = col.key;
                        State.sortDirection = 'desc';
                    }
                    renderCurrentPage();
                },
            });
            if (State.sortColumn === col.key) {
                th.classList.add(State.sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc');
            }
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Body
        const tbody = el('tbody');
        sorted.forEach((trade, idx) => {
            const row = el('tr', { class: 'trade-row', dataset: { tradeId: trade.id } });
            row.addEventListener('click', () => toggleRowExpansion(trade.id, trade));

            cols.forEach(col => {
                row.appendChild(renderTradeCell(trade, col));
            });

            tbody.appendChild(row);

            // Expansion row (hidden by default)
            const detailRow = el('tr', { class: 'detail-row', id: `detail-${trade.id}`, style: 'display:none;' });
            detailRow.appendChild(el('td', { colspan: String(cols.length) }));
            tbody.appendChild(detailRow);
        });

        table.appendChild(tbody);
        tableWrap.appendChild(table);
        return tableWrap;
    }

    function renderTradeCell(trade, col) {
        const val = trade[col.key];
        const isNum = ['num', 'price', 'r', 'pnl'].includes(col.type);
        const td = el('td', { class: isNum ? 'num' : '' });

        switch (col.type) {
            case 'date':
                td.textContent = formatTimestamp(val);
                break;
            case 'pair':
                td.appendChild(el('span', { class: `pair-label pair-${(val || '').toLowerCase()}`, text: val || '—' }));
                break;
            case 'direction': {
                const isLong = val === 'LONG' || val === 'BUY';
                td.appendChild(el('span', { class: `badge ${isLong ? 'badge-long' : 'badge-short'}`, text: val || '—' }));
                break;
            }
            case 'confidence':
                const confClass = val === 'God-Tier' ? 'badge-conf-god' : val === 'High' ? 'badge-conf-high' : 'badge-conf-standard';
                td.appendChild(el('span', { class: `badge ${confClass}`, text: val || '—' }));
                break;
            case 'result':
                const resClass = val === 'WIN' ? 'badge-win' : val === 'LOSS' ? 'badge-loss' : val === 'BE' ? 'badge-be' : 'badge-pending';
                td.appendChild(el('span', { class: `badge ${resClass}`, text: val || 'PENDING' }));
                break;
            case 'price':
                td.textContent = formatPrice(trade.pair, val);
                break;
            case 'r':
                td.textContent = formatR(val);
                td.className = `num ${val >= 0 ? 'r-positive' : val < 0 ? 'r-negative' : 'r-neutral'}`;
                break;
            case 'pnl':
                td.textContent = formatPnL(val);
                td.className = `num ${val > 0 ? 'pnl-positive' : val < 0 ? 'pnl-negative' : 'pnl-neutral'}`;
                break;
            default:
                td.textContent = val != null ? val : '—';
        }

        return td;
    }

    function sortTrades(trades, column, direction) {
        const col = COLUMNS.find(c => c.key === column) || COLUMNS[0];
        const dir = direction === 'asc' ? 1 : -1;

        return trades.sort((a, b) => {
            let va = a[column];
            let vb = b[column];

            if (column === 'timestamp') {
                va = new Date(va).getTime();
                vb = new Date(vb).getTime();
            }
            if (typeof va === 'number' && typeof vb === 'number') {
                return (va - vb) * dir;
            }
            // Handle nulls
            if (va == null) return 1;
            if (vb == null) return -1;
            return String(va).localeCompare(String(vb)) * dir;
        });
    }

    function toggleRowExpansion(tradeId, trade) {
        const detailRow = $(`#detail-${tradeId}`);
        const dataRow = $(`.trade-row[data-trade-id="${tradeId}"]`);

        if (!detailRow || !dataRow) return;

        // Collapse if clicking same row
        if (State.expandedRow === tradeId) {
            detailRow.style.display = 'none';
            dataRow.classList.remove('expanded-row');
            State.expandedRow = null;
            return;
        }

        // Collapse previously expanded
        if (State.expandedRow) {
            const prevDetail = $(`#detail-${State.expandedRow}`);
            const prevRow = $(`.trade-row[data-trade-id="${State.expandedRow}"]`);
            if (prevDetail) prevDetail.style.display = 'none';
            if (prevRow) prevRow.classList.remove('expanded-row');
        }

        // Render detail content
        const td = detailRow.querySelector('td');
        clearNode(td);
        td.appendChild(renderTradeDetail(trade));
        detailRow.style.display = '';
        dataRow.classList.add('expanded-row');
        State.expandedRow = tradeId;
    }

    function renderTradeDetail(trade) {
        const content = el('div', { class: 'detail-content' });

        // Entry Reasoning
        content.appendChild(makeDetailSection('Entry Reasoning', trade.entry_reasoning || 'No entry reasoning recorded.'));

        // Exit Reasoning
        if (trade.exit_reasoning) {
            content.appendChild(makeDetailSection('🚪 Exit Reasoning', trade.exit_reasoning));
        }

        // Guardrails Passed
        if (trade.guardrails_passed && trade.guardrails_passed.length > 0) {
            content.appendChild(makeDetailList('Guardrails Passed', trade.guardrails_passed, false));
        }

        // Guardrails Blocked
        if (trade.guardrails_blocked && trade.guardrails_blocked.length > 0) {
            content.appendChild(makeDetailList('🚫 Guardrails Blocked', trade.guardrails_blocked, true));
        }

        // 6-Check Direction Validation
        if (trade.direction_validation_6check) {
            content.appendChild(renderSixCheck(trade.direction_validation_6check));
        }

        // VLM Entry Analysis
        if (trade.vlm_entry_analysis) {
            content.appendChild(makeDetailSection('👁VLM Entry Analysis', trade.vlm_entry_analysis));
        }

        // Screenshots
        const screenshots = [];
        if (trade.screenshot_entry) screenshots.push({ label: 'Entry', path: trade.screenshot_entry });
        if (trade.screenshot_exit) screenshots.push({ label: 'Exit', path: trade.screenshot_exit });
        if (trade.screenshot_management) screenshots.push({ label: 'Management', path: trade.screenshot_management });
        if (screenshots.length > 0) {
            content.appendChild(renderScreenshots(screenshots));
        }

        // Trade metadata
        content.appendChild(renderTradeMeta(trade));

        return content;
    }

    function makeDetailSection(title, text) {
        return el('div', { class: 'detail-section' }, [
            el('div', { class: 'detail-section-title', text: title }),
            el('div', { class: 'detail-text', text }),
        ]);
    }

    function makeDetailList(title, items, blocked) {
        const list = el('ul', { class: `guardrail-list ${blocked ? 'blocked' : ''}` });
        items.forEach(item => list.appendChild(el('li', { text: item })));
        return el('div', { class: 'detail-section' }, [
            el('div', { class: 'detail-section-title', text: title }),
            list,
        ]);
    }

    function renderSixCheck(checks) {
        const wrap = el('div', { class: 'detail-section' }, [
            el('div', { class: 'detail-section-title', text: '6-Check Direction Validation' }),
        ]);
        const grid = el('div', { class: 'check-grid' });
        const labels = [
            'HTF Trend Alignment',
            'LTF Structure',
            'Liquidity Sweep',
            'Fair Value Gap',
            'Session Timing',
            'Confluence Stack',
        ];
        checks.forEach((check, i) => {
            const passed = check === true || check === 'pass' || check === 1 || (typeof check === 'object' && check.passed);
            const label = typeof check === 'object' ? (check.label || labels[i] || `Check ${i + 1}`) : (labels[i] || `Check ${i + 1}`);
            grid.appendChild(el('div', { class: `check-item ${passed ? 'pass' : 'fail'}` }, [
                el('span', { text: passed ? '✓' : '✗' }),
                el('span', { text: label }),
            ]));
        });
        wrap.appendChild(grid);
        return wrap;
    }

    function renderScreenshots(screenshots) {
        const wrap = el('div', { class: 'detail-section' }, [
            el('div', { class: 'detail-section-title', text: '📸 Screenshots' }),
        ]);
        screenshots.forEach(s => {
            wrap.appendChild(el('a', {
                class: 'screenshot-link',
                text: `🖼${s.label}: ${s.path}`,
                onclick: (e) => {
                    e.stopPropagation();
                    console.log('[Plutus] Opening screenshot:', s.path);
                    // In Electron this would call shell.openPath
                },
            }));
        });
        return wrap;
    }

    function renderTradeMeta(trade) {
        const meta = el('div', { class: 'detail-section detail-full' }, [
            el('div', { class: 'detail-section-title', text: 'Trade Details' }),
        ]);
        const rows = [
            ['Agent', trade.agent_id || '—'],
            ['Session', trade.session || '—'],
            ['Macro Page', trade.macro_page || '—'],
            ['Confidence Score', trade.confidence_score != null ? `${trade.confidence_score}/100` : '—'],
            ['Entry Time', formatTimestamp(trade.entry_time || trade.timestamp)],
            ['Exit Time', trade.exit_time ? formatTimestamp(trade.exit_time) : '—'],
            ['Hold Duration', trade.hold_duration || '—'],
            ['Risk Amount', trade.risk_amount != null ? `$${trade.risk_amount}` : '—'],
            ['Position Size', trade.position_size || '—'],
        ];
        const grid = el('div', { class: 'check-grid' });
        rows.forEach(([label, val]) => {
            grid.appendChild(el('div', { class: 'agent-metric' }, [
                el('span', { class: 'agent-metric-label', text: label }),
                el('span', { class: 'agent-metric-value', text: String(val) }),
            ]));
        });
        meta.appendChild(grid);
        return meta;
    }

    // ==================== PAGE: POSEIDON ====================
    async function renderPoseidonPage() {
        const container = $('#main-content');
        clearNode(container);

        container.appendChild(el('div', { class: 'page-header' }, [
            el('div', {}, [
                el('div', { class: 'page-title', text: 'Poseidon Engine' }),
                el('div', { class: 'page-subtitle', text: 'Deep market structure analysis cycles' }),
            ]),
            el('div', { class: 'page-actions' }, [
                el('button', { class: 'nav-btn', text: 'REFRESH', onclick: () => renderCurrentPage() }),
            ]),
        ]));

        const loading = el('div', { class: 'loading' }, [el('div', { class: 'spinner' }), el('span', { text: 'Loading cycles...' })]);
        container.appendChild(loading);

        try {
            const resp = await API.getPoseidonCycles();
            State.poseidonCycles = resp.cycles || [];
            loading.remove();
            renderPoseidonFeed(State.poseidonCycles, container);
        } catch (err) {
            loading.innerHTML = `Error: ${err.message}`;
        }
    }

    function renderPoseidonFeed(cycles, container) {
        if (!cycles || cycles.length === 0) {
            container.appendChild(makeEmptyState('', 'No Poseidon cycles yet'));
            return;
        }

        const feed = el('div', { class: 'poseidon-feed' });

        cycles.forEach(cycle => {
            feed.appendChild(renderCycleCard(cycle));
        });

        container.appendChild(feed);
    }

    function renderCycleCard(cycle) {
        const scoreClass = cycle.score >= 80 ? 'high' : cycle.score >= 50 ? 'medium' : 'low';
        const card = el('div', { class: 'cycle-card' });

        card.appendChild(el('div', { class: 'cycle-header' }, [
            el('div', {}, [
                el('div', { class: 'cycle-title', text: cycle.title || cycle.pair || 'Analysis Cycle' }),
                el('div', { class: 'cycle-meta', text: `${cycle.id} • ${formatTimestamp(cycle.timestamp)}` }),
            ]),
            el('div', { style: 'display:flex; align-items:center; gap:10px;' }, [
                cycle.status ? el('span', { class: `badge ${cycle.status === 'complete' ? 'badge-win' : cycle.status === 'analyzing' ? 'badge-pending' : 'badge-be'}`, text: cycle.status }) : null,
                el('span', { class: `cycle-score ${scoreClass}`, text: `${cycle.score || 0}/100` }),
            ].filter(Boolean)),
        ]));

        if (cycle.findings && cycle.findings.length > 0) {
            const list = el('ul', { class: 'finding-list' });
            cycle.findings.forEach(finding => {
                const iconClass = finding.severity === 'danger' ? 'danger' : finding.severity === 'warning' ? 'warning' : finding.severity === 'success' ? 'success' : 'info';
                const icon = finding.severity === 'danger' ? '🔴' : finding.severity === 'warning' ? '🟡' : finding.severity === 'success' ? '🟢' : '🔵';
                list.appendChild(el('li', { class: 'finding-item' }, [
                    el('span', { class: `finding-icon ${iconClass}`, text: icon }),
                    el('span', { text: finding.text || finding.message || String(finding) }),
                ]));
            });
            card.appendChild(list);
        }

        if (cycle.recommendation) {
            card.appendChild(el('div', { class: 'detail-section detail-full', style: 'margin-top:12px;' }, [
                el('div', { class: 'detail-section-title', text: 'Recommendation' }),
                el('div', { class: 'detail-text', text: cycle.recommendation }),
            ]));
        }

        return card;
    }

    // ==================== PAGE: SPLIT TESTS ====================
    async function renderSplitTestsPage() {
        const container = $('#main-content');
        clearNode(container);

        container.appendChild(el('div', { class: 'page-header' }, [
            el('div', {}, [
                el('div', { class: 'page-title', text: 'Split Tests' }),
                el('div', { class: 'page-subtitle', text: 'Champion vs Challenger A/B experiments' }),
            ]),
            el('div', { class: 'page-actions' }, [
                el('button', { class: 'nav-btn', text: 'REFRESH', onclick: () => renderCurrentPage() }),
            ]),
        ]));

        const loading = el('div', { class: 'loading' }, [el('div', { class: 'spinner' }), el('span', { text: 'Loading split tests...' })]);
        container.appendChild(loading);

        try {
            const resp = await API.getSplitTests();
            State.splitTests = resp.tests || [];
            loading.remove();
            renderSplitTestsFeed(State.splitTests, container);
        } catch (err) {
            loading.innerHTML = `Error: ${err.message}`;
        }
    }

    function renderSplitTestsFeed(tests, container) {
        if (!tests || tests.length === 0) {
            container.appendChild(makeEmptyState('', 'No split tests configured'));
            return;
        }

        const grid = el('div', { class: 'split-test-grid' });
        tests.forEach(test => grid.appendChild(renderSplitTestCard(test)));
        container.appendChild(grid);
    }

    function renderSplitTestCard(test) {
        const card = el('div', { class: 'split-test-card' });
        card.appendChild(el('div', { class: 'split-test-header' }, [
            el('div', {}, [
                el('div', { class: 'split-test-name', text: test.name || test.id }),
                el('div', { class: 'cycle-meta', text: `${test.id} • Started ${formatTimestamp(test.start_date)}` }),
            ]),
            el('span', { class: `split-test-status ${test.status || 'running'}`, text: (test.status || 'running').toUpperCase() }),
        ]));

        if (test.description) {
            card.appendChild(el('div', { class: 'detail-text', style: 'margin-bottom:14px;', text: test.description }));
        }

        const variants = el('div', { class: 'split-variants' });

        // Champion
        if (test.champion) {
            variants.appendChild(renderVariant(test.champion, 'champion'));
        }
        // Challenger
        if (test.challenger) {
            variants.appendChild(renderVariant(test.challenger, 'challenger'));
        }

        card.appendChild(variants);

        // Significance / conclusion
        if (test.conclusion) {
            card.appendChild(el('div', { class: 'detail-section detail-full', style: 'margin-top:14px;' }, [
                el('div', { class: 'detail-section-title', text: 'Conclusion' }),
                el('div', { class: 'detail-text', text: test.conclusion }),
            ]));
        }
        if (test.significance) {
            card.appendChild(el('div', { class: 'detail-text', style: 'margin-top:8px; font-size:11px;', text: `Statistical significance: ${test.significance}` }));
        }

        return card;
    }

    function renderVariant(variant, role) {
        const card = el('div', { class: `variant-card ${role}` });
        card.appendChild(el('div', { class: 'variant-label', text: role === 'champion' ? '👑 CHAMPION' : 'CHALLENGER' }));
        card.appendChild(el('div', { class: 'variant-name', text: variant.name || variant.id }));

        const stats = el('div', { class: 'variant-stats' });
        stats.appendChild(makeVariantStat(variant.trades || variant.sample_size || 0, 'Trades'));
        stats.appendChild(makeVariantStat(`${(variant.win_rate || 0).toFixed(1)}%`, 'Win Rate'));
        const pnlColor = (variant.pnl || 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
        const pnlStat = makeVariantStat(formatPnL(variant.pnl || 0), 'Net P&L');
        const pnlVal = pnlStat.querySelector('.variant-stat-value');
        if (pnlVal) pnlVal.style.color = pnlColor;
        stats.appendChild(pnlStat);
        stats.appendChild(makeVariantStat(formatR(variant.avg_r || 0), 'Avg R'));
        stats.appendChild(makeVariantStat(`${(variant.profit_factor || 0).toFixed(2)}`, 'PF'));

        card.appendChild(stats);
        return card;
    }

    function makeVariantStat(value, label) {
        return el('div', { class: 'variant-stat' }, [
            el('div', { class: 'variant-stat-value', text: String(value) }),
            el('div', { class: 'variant-stat-label', text: label }),
        ]);
    }

    // ==================== PAGE: AGENTS ====================
    async function renderAgentsPage() {
        const container = $('#main-content');
        clearNode(container);

        container.appendChild(el('div', { class: 'page-header' }, [
            el('div', {}, [
                el('div', { class: 'page-title', text: 'Agents' }),
                el('div', { class: 'page-subtitle', text: 'Trading agent health and status' }),
            ]),
            el('div', { class: 'page-actions' }, [
                el('button', { class: 'nav-btn', text: 'REFRESH', onclick: () => renderCurrentPage() }),
            ]),
        ]));

        const loading = el('div', { class: 'loading' }, [el('div', { class: 'spinner' }), el('span', { text: 'Loading agents...' })]);
        container.appendChild(loading);

        try {
            const resp = await API.getAgents();
            State.agents = resp.agents || [];
            loading.remove();
            renderAgentCards(State.agents, container);

            // OpenFang Hands section
            renderOFHandsSection(container);
        } catch (err) {
            loading.innerHTML = `Error: ${err.message}`;
        }
    }

    // ==================== OPENFANG HANDS ====================
    let ofHandsRefreshTimer = null;

    function renderOFHandsSection(container) {
        const section = el('div', { class: 'detail-section', id: 'of-hands-section' }, [
            el('div', { class: 'detail-section-title', text: '🦾 OpenFang Hands' }),
            el('div', { class: 'of-hands-loading', text: 'Loading OpenFang Hands...' }),
        ]);
        container.appendChild(section);

        // Initial load
        loadOFHands();

        // Auto-refresh every 30s
        if (ofHandsRefreshTimer) clearInterval(ofHandsRefreshTimer);
        ofHandsRefreshTimer = setInterval(loadOFHands, 30000);
    }

    async function loadOFHands() {
        const section = $('#of-hands-section');
        if (!section) {
            // Section was navigated away — stop refreshing
            if (ofHandsRefreshTimer) {
                clearInterval(ofHandsRefreshTimer);
                ofHandsRefreshTimer = null;
            }
            return;
        }

        let resp;
        try {
            resp = await API.getOFHands();
        } catch (err) {
            renderOFHandsError(section, err.message);
            return;
        }

        // getOFHands normalizes the envelope to { hands: [...] }.
        let hands = [];
        if (resp && resp.success === false) {
            renderOFHandsError(section, resp.error || 'OpenFang API unreachable');
            return;
        }
        if (resp && Array.isArray(resp.hands)) {
            hands = resp.hands;
        } else if (resp && resp.data && Array.isArray(resp.data.hands)) {
            hands = resp.data.hands;
        } else if (resp && resp.data && Array.isArray(resp.data)) {
            hands = resp.data;
        } else if (Array.isArray(resp)) {
            hands = resp;
        }

        State.ofHands = hands;
        renderOFHandsList(section, hands);
    }

    function renderOFHandsError(section, message) {
        const body = section.querySelector('.of-hands-body') || el('div', { class: 'of-hands-body' });
        clearNode(body);
        body.appendChild(el('div', {
            class: 'empty-state',
            html: '<div class="empty-state-icon"></div><div class="empty-state-text">' +
                  escapeHTML(message) + '</div>',
        }));
        if (!section.contains(body)) section.appendChild(body);
    }

    function renderOFHandsList(section, hands) {
        let body = section.querySelector('.of-hands-body');
        if (body) clearNode(body);
        else body = el('div', { class: 'of-hands-body' });

        // Remove loading text
        const loadingEl = section.querySelector('.of-hands-loading');
        if (loadingEl) loadingEl.remove();

        if (!hands || hands.length === 0) {
            body.appendChild(makeEmptyState('', 'No OpenFang Hands registered'));
            section.appendChild(body);
            return;
        }

        const grid = el('div', { class: 'agents-grid' });

        hands.forEach(function (hand) {
            grid.appendChild(renderOFHandCard(hand));
        });

        body.appendChild(grid);
        section.appendChild(body);
    }

    function renderOFHandCard(hand) {
        const status = hand.status || 'unknown';
        const statusClass = status === 'active' ? 'healthy' :
                            status === 'paused' ? 'degraded' : 'down';
        const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

        const card = el('div', { class: 'agent-card' });

        // Header with name + status
        card.appendChild(el('div', { class: 'agent-header' }, [
            el('div', { class: 'agent-name', text: hand.name || hand.id || 'Unknown Hand' }),
            el('div', { class: 'agent-status' }, [
                el('span', { class: 'status-dot ' + statusClass }),
                el('span', { text: statusLabel }),
            ]),
        ]));

        // Metrics
        const metrics = el('div', { class: 'agent-metrics' });
        if (hand.id) metrics.appendChild(makeAgentMetric('Hand ID', hand.id));
        metrics.appendChild(makeAgentMetric('Status', statusLabel));
        if (hand.last_active) {
            metrics.appendChild(makeAgentMetric('Last Active', formatTimestamp(hand.last_active)));
        }
        if (hand.pair) metrics.appendChild(makeAgentMetric('Pair', hand.pair));
        if (hand.account) metrics.appendChild(makeAgentMetric('Account', hand.account));
        card.appendChild(metrics);

        // Control buttons
        const controls = el('div', {
            class: 'of-hand-controls',
            style: 'display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;',
        });

        const actions = [
            { label: '▶ Activate', action: 'activate', showWhen: ['inactive', 'paused'] },
            { label: '⏸ Pause',    action: 'pause',    showWhen: ['active'] },
            { label: '▶ Resume',   action: 'resume',   showWhen: ['paused'] },
            { label: '⏹ Deactivate', action: 'deactivate', showWhen: ['active', 'paused'] },
        ];

        actions.forEach(function (a) {
            if (a.showWhen.indexOf(status) === -1) return;
            const btn = el('button', {
                class: 'nav-btn',
                style: 'font-size:12px;padding:6px 12px;',
                text: a.label,
                onclick: async function () {
                    btn.textContent = '⏳ Working...';
                    btn.disabled = true;
                    try {
                        await API.controlOFHand(hand.id, a.action);
                        await loadOFHands();
                    } catch (err) {
                        btn.textContent = 'Failed';
                        console.error('OF hand control failed:', err);
                    }
                },
            });
            controls.appendChild(btn);
        });

        card.appendChild(controls);
        return card;
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    }

    function renderAgentCards(agents, container) {
        if (!agents || agents.length === 0) {
            container.appendChild(makeEmptyState('', 'No agents registered'));
            return;
        }

        // Deduplicate by agent id and aggregate per-agent metrics across pairs/pages.
        const seen = new Map();
        agents.forEach(agent => {
            const id = agent.id || agent.agent_id || 'unknown';
            if (!seen.has(id)) {
                seen.set(id, {
                    ...agent,
                    pairs: new Set(),
                    totalPnL: 0,
                    totalTrades: 0,
                    wins: 0,
                    losses: 0,
                    lastActive: null
                });
            }
            const agg = seen.get(id);
            if (agent.pair && agent.pair !== 'ALL') agg.pairs.add(agent.pair);
            agg.totalPnL += agent.pnl || 0;
            agg.totalTrades += agent.total_trades || 0;
            if (agent.win_rate != null) {
                agg.wins += Math.round((agent.win_rate / 100) * (agent.total_trades || 0));
                agg.losses += (agent.total_trades || 0) - Math.round((agent.win_rate / 100) * (agent.total_trades || 0));
            }
            const la = agent.last_active || agent.last_trade;
            if (la && (!agg.lastActive || new Date(la) > new Date(agg.lastActive))) agg.lastActive = la;
        });

        const aggregated = Array.from(seen.values()).map(agg => {
            const winRate = agg.totalTrades > 0 ? (agg.wins / agg.totalTrades) * 100 : 0;
            return {
                ...agg,
                pair: agg.pairs.size > 1 ? `${agg.pairs.size} pairs` : (agg.pairs.values().next().value || 'ALL'),
                pnl: agg.totalPnL,
                total_trades: agg.totalTrades,
                win_rate: winRate,
                last_active: agg.lastActive
            };
        });

        const grid = el('div', { class: 'agents-grid' });
        aggregated.forEach(agent => grid.appendChild(renderAgentCard(agent)));
        container.appendChild(grid);
    }

    function renderAgentCard(agent) {
        const status = agent.status || 'unknown';
        const statusLabel = status === 'healthy' || status === 'active' ? 'Healthy' : status === 'degraded' ? 'Degraded' : status === 'down' || status === 'offline' ? 'Down' : status;

        const card = el('div', { class: 'agent-card' });
        card.appendChild(el('div', { class: 'agent-header' }, [
            el('div', { class: 'agent-name', text: agent.id }),
            el('div', { class: 'agent-status' }, [
                el('span', { class: `status-dot ${status === 'healthy' || status === 'active' ? 'healthy' : status === 'degraded' ? 'degraded' : 'down'}` }),
                el('span', { text: statusLabel }),
            ]),
        ]));

        const metrics = el('div', { class: 'agent-metrics' });

        if (agent.name) metrics.appendChild(makeAgentMetric('Name', agent.name));
        metrics.appendChild(makeAgentMetric('Pair', agent.pair || 'ALL'));
        metrics.appendChild(makeAgentMetric('Strategy', agent.strategy || agent.setup || 'TTE'));
        metrics.appendChild(makeAgentMetric('Total Trades', agent.total_trades || '—'));
        if (agent.win_rate != null) metrics.appendChild(makeAgentMetric('Win Rate', `${agent.win_rate.toFixed(1)}%`));
        if (agent.pnl != null) metrics.appendChild(makeAgentMetric('Net P&L', formatPnL(agent.pnl)));
        metrics.appendChild(makeAgentMetric('Last Active', agent.last_active ? formatTimeShort(agent.last_active) : '—'));
        if (agent.version) metrics.appendChild(makeAgentMetric('Version', agent.version));
        if (agent.uptime) metrics.appendChild(makeAgentMetric('Uptime', agent.uptime));

        card.appendChild(metrics);
        return card;
    }

    function makeAgentMetric(label, value) {
        return el('div', { class: 'agent-metric' }, [
            el('span', { class: 'agent-metric-label', text: label }),
            el('span', { class: 'agent-metric-value', text: String(value) }),
        ]);
    }

    // ==================== HELPERS ====================
    function makeEmptyState(icon, text) {
        return el('div', { class: 'empty-state' }, [
            el('div', { class: 'empty-state-icon', text: icon }),
            el('div', { class: 'empty-state-text', text }),
        ]);
    }

    function updateWSStatus(status, extra = '') {
        const dot = $('#ws-dot');
        const label = $('#ws-label');
        if (!dot || !label) return;

        dot.className = 'ws-dot';
        switch (status) {
            case 'connected':
                dot.classList.add('ws-dot-connected');
                label.textContent = 'Connected';
                break;
            case 'connecting':
                dot.classList.add('ws-dot-connecting');
                label.textContent = extra ? `Reconnecting (${extra})` : 'Connecting...';
                break;
            default:
                dot.classList.add('ws-dot-disconnected');
                label.textContent = 'Disconnected';
        }
    }

    async function checkAPIHealth() {
        const dot = $('#api-dot');
        const label = $('#api-label');
        try {
            await API.getHealth();
            dot.className = 'api-dot api-dot-ok';
            label.textContent = 'API: Online';
        } catch {
            dot.className = 'api-dot api-dot-error';
            label.textContent = 'API: Offline';
        }
    }

    // ==================== AUTO-REFRESH ====================
    function startAutoRefresh() {
        if (State.refreshTimer) clearInterval(State.refreshTimer);
        State.refreshTimer = setInterval(() => {
            if (isMacroPage(State.currentPage)) {
                loadAndRenderTrades();
            }
        }, CONFIG.REFRESH_INTERVAL);
    }

    const SVG_NS = 'http://www.w3.org/2000/svg';

    function svgEl(tag, attrs = {}, children = []) {
        const node = document.createElementNS(SVG_NS, tag);
        for (const key in attrs) {
            if (key === 'class') node.setAttribute('class', attrs[key]);
            else if (key === 'html') node.innerHTML = attrs[key];
            else if (key === 'text') node.textContent = attrs[key];
            else if (key === 'style') node.style.cssText = attrs[key];
            else node.setAttribute(key, attrs[key]);
        }
        const kids = Array.isArray(children) ? children : [children];
        kids.forEach(c => {
            if (c == null) return;
            node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
        });
        return node;
    }

    // ==================== PAGE: JOURNAL (W6R · T5) ====================
    // THE TRADE JOURNAL — the record of every trade the system took, with the
    // edge computed from it. Sourced from the dashboard's own trades store
    // (/api/v1/trades) — the journal for this build (the ARCHIVE/dash checkpoints
    // carry no journal UI: measured, see the W6R report).
    async function renderJournalPage(container) {
        clearNode(container);
        container.appendChild(el('div', { class: 'page-header' }, [
            el('div', {}, [
                el('div', { class: 'page-title', text: 'Journal' }),
                el('div', { class: 'page-subtitle', text: 'Every recorded trade — the primary record and its edge' }),
            ]),
            el('div', { class: 'page-actions' }, [
                el('button', { class: 'nav-btn refresh', text: 'REFRESH', onclick: () => renderCurrentPage() }),
            ]),
        ]));

        const loading = el('div', { class: 'loading' }, [el('div', { class: 'spinner' }), el('span', { text: 'Loading the journal...' })]);
        container.appendChild(loading);

        try {
            const resp = await API.getTrades(null, 'ALL', 'ALL', 5000, 0);
            const trades = resp.trades || [];
            container.removeChild(loading);
            if (!trades.length) {
                container.appendChild(makeEmptyState('', 'No journaled trades yet'));
                return;
            }

            const decided = trades.filter(t => t.result === 'WIN' || t.result === 'LOSS');
            const wins = decided.filter(t => t.result === 'WIN');
            const losses = decided.filter(t => t.result === 'LOSS');
            const sumR = decided.reduce((a, t) => a + (Number(t.r_multiple) || 0), 0);
            const pnl = trades.reduce((a, t) => a + (Number(t.pnl_usd) || 0), 0);
            const winRate = decided.length ? (wins.length / decided.length) * 100 : 0;
            const expectancy = decided.length ? sumR / decided.length : 0;
            const avgWin = wins.length ? wins.reduce((a, t) => a + (Number(t.r_multiple) || 0), 0) / wins.length : 0;
            const avgLoss = losses.length ? losses.reduce((a, t) => a + (Number(t.r_multiple) || 0), 0) / losses.length : 0;

            const cells = [
                ['Trades', String(trades.length), ''],
                ['Decided', String(decided.length), ''],
                ['Win rate', winRate.toFixed(1) + '%', winRate >= 50 ? 'pos' : 'neg'],
                ['Expectancy', expectancy.toFixed(2) + ' R', expectancy >= 0 ? 'pos' : 'neg'],
                ['Total P&L', (pnl >= 0 ? '+' : '') + pnl.toFixed(2), pnl >= 0 ? 'pos' : 'neg'],
                ['Avg win / loss', avgWin.toFixed(2) + ' / ' + avgLoss.toFixed(2), avgWin + avgLoss >= 0 ? 'pos' : 'neg'],
            ];
            const grid = el('div', { class: 'edge-grid', style: 'grid-template-columns:repeat(6,1fr);' });
            cells.forEach(([label, value, cls]) => {
                grid.appendChild(el('div', { class: 'edge-cell' }, [
                    el('div', { class: 'edge-label', text: label }),
                    el('div', { class: 'edge-value' + (cls ? ' ' + cls : ''), text: value }),
                ]));
            });
            container.appendChild(grid);

            // By pair
            const byPair = {};
            decided.forEach(t => {
                const k = t.pair || '—';
                byPair[k] = byPair[k] || { n: 0, w: 0, r: 0, pnl: 0 };
                byPair[k].n++;
                if (t.result === 'WIN') byPair[k].w++;
                byPair[k].r += Number(t.r_multiple) || 0;
                byPair[k].pnl += Number(t.pnl_usd) || 0;
            });
            container.appendChild(el('div', { class: 'section-rule' }));
            container.appendChild(el('div', { class: 'page-subtitle', text: 'EDGE BY PAIR' }));
            const pg = el('div', { class: 'edge-grid', style: 'grid-template-columns:repeat(' + Math.max(1, Object.keys(byPair).length) + ',1fr);margin-top:10px;' });
            Object.keys(byPair).sort().forEach(k => {
                const v = byPair[k];
                pg.appendChild(el('div', { class: 'edge-cell' }, [
                    el('div', { class: 'edge-label', text: k }),
                    el('div', { class: 'edge-value' + (v.pnl >= 0 ? ' pos' : ' neg'), text: (v.pnl >= 0 ? '+' : '') + v.pnl.toFixed(2) }),
                    el('div', { class: 'edge-label', style: 'margin-top:6px;', text: v.w + '/' + v.n + ' · ' + (v.n ? (v.r / v.n).toFixed(2) : '0.00') + ' R avg' }),
                ]));
            });
            container.appendChild(pg);

            // The record itself
            container.appendChild(el('div', { class: 'section-rule' }));
            container.appendChild(el('div', { class: 'page-subtitle', text: 'THE RECORD' }));
            const table = el('table', { style: 'width:100%;margin-top:10px;font-size:11px;' });
            table.appendChild(el('thead', {}, [el('tr', {}, ['UID', 'PAIR', 'DIR', 'SESSION', 'DAY', 'SETUP', 'ENTRY', 'EXIT', 'R', 'P&L', 'RESULT']
                .map(h => el('th', { style: 'text-align:left;padding:7px 10px;', text: h })))]));
            const tbody = el('tbody');
            trades.slice(0, 400).forEach(t => {
                tbody.appendChild(el('tr', {}, [
                    el('td', { class: 'num', style: 'padding:6px 10px;', text: String(t.trade_uid || '').slice(0, 22) }),
                    el('td', { style: 'padding:6px 10px;', text: t.pair || '' }),
                    el('td', { style: 'padding:6px 10px;' }, [el('span', { class: 'tag ' + (t.direction === 'BUY' ? 'long' : 'short'), text: t.direction || '' })]),
                    el('td', { style: 'padding:6px 10px;', text: t.session || '' }),
                    el('td', { style: 'padding:6px 10px;', text: t.day_of_week || '' }),
                    el('td', { style: 'padding:6px 10px;', text: (t.setup_category || '') + (t.setup_type ? ' · ' + t.setup_type : '') }),
                    el('td', { class: 'num', style: 'padding:6px 10px;', text: String(t.entry_timestamp || '').slice(0, 16) }),
                    el('td', { class: 'num', style: 'padding:6px 10px;', text: String(t.exit_timestamp || '—').slice(0, 16) }),
                    el('td', { class: 'num', style: 'padding:6px 10px;', text: t.r_multiple != null ? Number(t.r_multiple).toFixed(2) : '—' }),
                    el('td', { class: 'num', style: 'padding:6px 10px;', text: t.pnl_usd != null ? Number(t.pnl_usd).toFixed(2) : '—' }),
                    el('td', { style: 'padding:6px 10px;', text: t.result || t.status || '' }),
                ]));
            });
            table.appendChild(tbody);
            container.appendChild(table);
        } catch (err) {
            if (container.contains(loading)) {
                loading.innerHTML = '<div class="empty-state"><div class="empty-state-text">Failed to load the journal. ' + escapeHTML(err.message) + '</div></div>';
            }
        }
    }

    // ==================== PAGE: ANALYTICS / HEATMAP ====================
    async function renderAnalyticsPage(container) {
        clearNode(container);
        container.appendChild(el('div', { class: 'page-header' }, [
            el('div', {}, [
                el('div', { class: 'page-title', text: 'Analytics' }),
                el('div', { class: 'page-subtitle', text: 'The data-tracking surface — performance, edge and defect history across every dimension' }),
            ]),
            el('div', { class: 'page-actions' }, [
                el('button', { class: 'nav-btn', text: 'REFRESH', onclick: () => renderCurrentPage() }),
            ]),
        ]));

        const loading = el('div', { class: 'loading' }, [el('div', { class: 'spinner' }), el('span', { text: 'Loading quant analytics...' })]);
        container.appendChild(loading);

        try {
            const resp = await API.getTrades(null, 'ALL', 'ALL', 5000, 0);
            const trades = resp.trades || [];
            container.removeChild(loading);

            if (trades.length === 0) {
                container.appendChild(makeEmptyState('', 'No trades to analyze yet'));
                return;
            }

            const metrics = computeQuantAnalytics(trades);
            renderAnalyticsWorkspace(container, metrics, trades);
        } catch (err) {
            if (container.contains(loading)) {
                loading.innerHTML = '<div class="empty-state"><div class="empty-state-icon"></div><div class="empty-state-text">Failed to load analytics. ' + escapeHTML(err.message) + '</div></div>';
            }
        }
    }

    // ==================== QUANT ANALYTICS ENGINE ====================
    function computeQuantAnalytics(trades) {
        const decided = t => t.result === 'WIN' || t.result === 'LOSS';

        function analyzeGroup(items) {
            const dec = items.filter(decided);
            const wins = dec.filter(t => t.result === 'WIN');
            const losses = dec.filter(t => t.result === 'LOSS');
            const bes = items.filter(t => t.result === 'BE');
            const grossProfit = wins.reduce((s, t) => s + Math.max(0, t.pnl_usd || 0), 0);
            const grossLoss = Math.abs(losses.reduce((s, t) => s + Math.min(0, t.pnl_usd || 0), 0));
            const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 999 : 0);
            const expectancy = items.length > 0 ? items.reduce((s, t) => s + (t.pnl_usd || 0), 0) / items.length : 0;
            const avgR = dec.length > 0 ? dec.reduce((s, t) => s + (t.r_multiple || 0), 0) / dec.length : 0;
            const winRate = dec.length > 0 ? (wins.length / dec.length) * 100 : 0;

            let maxConsLoss = 0, curLoss = 0;
            items.forEach(t => {
                if (t.result === 'LOSS') { curLoss++; maxConsLoss = Math.max(maxConsLoss, curLoss); }
                else curLoss = 0;
            });

            const sortedByPnl = [...items].sort((a, b) => (b.pnl_usd || 0) - (a.pnl_usd || 0));

            return {
                count: items.length,
                decided: dec.length,
                wins: wins.length,
                losses: losses.length,
                bes: bes.length,
                winRate,
                grossProfit,
                grossLoss,
                profitFactor: Math.min(profitFactor, 999),
                expectancy,
                avgR,
                totalPnl: items.reduce((s, t) => s + (t.pnl_usd || 0), 0),
                maxConsLoss,
                bestTrade: sortedByPnl[0] || null,
                worstTrade: sortedByPnl[sortedByPnl.length - 1] || null,
                items
            };
        }

        function byKey(key) {
            const map = {};
            trades.forEach(t => {
                const k = t[key] || 'Unknown';
                if (!map[k]) map[k] = [];
                map[k].push(t);
            });
            return map;
        }

        const build = (key) => Object.entries(byKey(key)).map(([label, items]) => ({
            label,
            ...analyzeGroup(items)
        }));

        const pairs = build('pair').sort((a, b) => b.expectancy - a.expectancy);
        const days = build('day_of_week').sort((a, b) => b.winRate - a.winRate);
        const sessions = build('session').sort((a, b) => b.expectancy - a.expectancy);
        const shapes = build('shape').sort((a, b) => b.profitFactor - a.profitFactor);
        const timeframes = build('timeframe').sort((a, b) => b.winRate - a.winRate);

        const rrrByShape = build('shape').map(g => ({
            label: g.label,
            value: g.avgR,
            count: g.count
        })).sort((a, b) => b.value - a.value).filter(g => g.value > 0);

        const rrrByTimeframe = build('timeframe').map(g => ({
            label: g.label,
            value: g.avgR,
            count: g.count
        })).sort((a, b) => b.value - a.value).filter(g => g.value > 0);

        const wins = trades.filter(t => t.result === 'WIN');
        const losses = trades.filter(t => t.result === 'LOSS');

        const avgSlTp = (dataset) => {
            const avgSl = dataset.length ? dataset.reduce((s, t) => s + (t.sl_pips || 0), 0) / dataset.length : 0;
            const avgTp = dataset.length ? dataset.reduce((s, t) => s + (t.tp_pips || 0), 0) / dataset.length : 0;
            return [
                { label: 'Avg SL', value: avgSl },
                { label: 'Avg TP', value: avgTp }
            ];
        };

        const lossMap = {};
        losses.forEach(t => {
            const key = `${t.shape || 'Unknown'} · ${t.timeframe || 'Unknown'}`;
            if (!lossMap[key]) lossMap[key] = { count: 0, totalPnl: 0 };
            lossMap[key].count++;
            lossMap[key].totalPnl += t.pnl_usd || 0;
        });
        const lossEntries = Object.entries(lossMap)
            .map(([label, data]) => ({ label, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);

        return {
            pairs,
            days,
            sessions,
            shapes,
            timeframes,
            rrrByShape,
            rrrByTimeframe,
            winSlTp: avgSlTp(wins),
            lossSlTp: avgSlTp(losses),
            losses: lossEntries,
            overall: analyzeGroup(trades)
        };
    }

    const QUANT_CYA = '#B99A5B';
    const QUANT_GREEN = '#7E9C82';
    const QUANT_RED = '#9C6B6B';
    const QUANT_SLATE = '#6A675F';
    const QUANT_GOLD = '#C8A96A';

    // W6R · OLD MONEY (32 §1): the donut/strip palette is a dusty, low-chroma
    // set — brass, sage, oxblood, slate, taupe, ochre, moss, wine. No neon,
    // no saturated primaries; the segments are told apart by value, not by
    // shouting. Ten shades cycling.
    const DONUT_PALETTE = [
        '#B99A5B', '#7E9C82', '#9C6B6B', '#6E7E8F', '#A8804F',
        '#7A7488', '#8A8F6B', '#8E6B7A', '#5F6E72', '#C8A96A',
        '#9A958C', '#6F7F6A', '#8C6F5A', '#6B6F8A', '#A3876B',
        '#7E9C82', '#B99A5B', '#9C6B6B', '#6E7E8F', '#A8804F',
    ];

    function getDonutColor(i) {
        return DONUT_PALETTE[i % DONUT_PALETTE.length];
    }

    function renderAnalyticsWorkspace(container, metrics, trades) {
        clearNode(container);
        container.appendChild(el('div', { class: 'page-header' }, [
            el('div', {}, [
                el('div', { class: 'page-title', text: 'Quant Analytics' }),
                el('div', { class: 'page-subtitle', text: 'Statistical edge by every trading dimension' }),
            ]),
            el('div', { class: 'page-actions' }, [
                el('button', { class: 'nav-btn', text: 'REFRESH', onclick: () => renderCurrentPage() }),
            ]),
        ]));

        const overall = metrics.overall;
        container.appendChild(el('div', { class: 'quant-summary-bar' }, [
            renderQuantSummary('Total Trades', overall.count, ''),
            renderQuantSummary('Win Rate', overall.winRate.toFixed(1) + '%', `${overall.wins}W / ${overall.losses}L / ${overall.bes}BE`),
            renderQuantSummary('Expectancy', '$' + overall.expectancy.toFixed(2), 'avg per trade'),
            renderQuantSummary('Profit Factor', overall.profitFactor.toFixed(2), 'gross profit / loss'),
            renderQuantSummary('Avg R', overall.avgR.toFixed(2) + 'R', 'per decided trade'),
            renderQuantSummary('Net P&L', formatPnL(overall.totalPnl), 'all trades'),
        ]));

        const focusArea = el('div', { id: 'analytics-focus', class: 'analytics-focus' });
        const gridArea = el('div', { class: 'donut-grid' });

        let selectedChart = null;

        const chartDefs = [
            { id: 'pairs', title: 'Pair Edge', data: metrics.pairs, metric: 'expectancy', colorBy: 'winRate', fmt: v => `$${v.toFixed(0)}`, label: 'EXPECTANCY', unit: '$/trade' },
            { id: 'days', title: 'Day Win Rate', data: metrics.days, metric: 'winRate', colorBy: 'expectancy', fmt: v => `${v.toFixed(1)}%`, label: 'WIN RATE', unit: '%' },
            { id: 'sessions', title: 'Session Edge', data: metrics.sessions, metric: 'expectancy', colorBy: 'winRate', fmt: v => `$${v.toFixed(0)}`, label: 'EXPECTANCY', unit: '$/trade' },
            { id: 'shapes', title: 'Setup Profit Factor', data: metrics.shapes, metric: 'profitFactor', colorBy: 'winRate', fmt: v => `${v.toFixed(2)}`, label: 'PROFIT FACTOR', unit: 'x' },
            { id: 'timeframes', title: 'Timeframe Win Rate', data: metrics.timeframes, metric: 'winRate', colorBy: 'expectancy', fmt: v => `${v.toFixed(1)}%`, label: 'WIN RATE', unit: '%' },
            { id: 'rrrByShape', title: 'Avg R by Setup', data: metrics.rrrByShape, isSimple: true, metric: 'value', colorBy: 'value', fmt: v => `${v.toFixed(2)}R`, label: 'AVG R', unit: 'R' },
            { id: 'rrrByTimeframe', title: 'Avg R by Timeframe', data: metrics.rrrByTimeframe, isSimple: true, metric: 'value', colorBy: 'value', fmt: v => `${v.toFixed(2)}R`, label: 'AVG R', unit: 'R' },
            { id: 'winSlTp', title: 'Win SL / TP', data: metrics.winSlTp, isSimple: true, metric: 'value', colorBy: 'fixed', fmt: v => `${v.toFixed(1)}p`, label: 'PIPS', unit: 'pips' },
            { id: 'lossSlTp', title: 'Loss SL / TP', data: metrics.lossSlTp, isSimple: true, metric: 'value', colorBy: 'fixed', fmt: v => `${v.toFixed(1)}p`, label: 'PIPS', unit: 'pips' },
            { id: 'losses', title: 'Loss Frequency', data: metrics.losses, isSimple: true, metric: 'count', colorBy: 'loss', fmt: v => `${v}`, label: 'LOSSES', unit: 'trades' },
        ];

        function renderGrid() {
            clearNode(gridArea);
            chartDefs.forEach(def => {
                if (selectedChart && selectedChart.id === def.id) return;
                const card = renderQuantDonut(def, (clickedDef) => {
                    if (selectedChart && selectedChart.id === clickedDef.id) {
                        selectedChart = null;
                    } else {
                        selectedChart = clickedDef;
                    }
                    renderFocus();
                    renderGrid();
                });
                gridArea.appendChild(card);
            });
        }

        function renderFocus() {
            clearNode(focusArea);
            if (!selectedChart) {
                focusArea.style.display = 'none';
                return;
            }
            focusArea.style.display = 'block';
            focusArea.appendChild(el('div', { class: 'focus-close' }, [
                el('button', { class: 'btn-secondary', text: '✕ Close Focus', onclick: () => {
                    selectedChart = null;
                    renderFocus();
                    renderGrid();
                } })
            ]));
            focusArea.appendChild(renderExpandedChart(selectedChart, metrics, trades, () => {
                selectedChart = null;
                renderFocus();
                renderGrid();
            }));
        }

        renderFocus();
        renderGrid();

        container.appendChild(focusArea);
        container.appendChild(gridArea);
    }

    function renderQuantSummary(label, value, sub) {
        return el('div', { class: 'quant-summary-item' }, [
            el('div', { class: 'quant-summary-label', text: label }),
            el('div', { class: 'quant-summary-value', text: value }),
            el('div', { class: 'quant-summary-sub', text: sub }),
        ]);
    }

    function renderQuantDonut(def, onClick) {
        const card = el('div', { class: 'donut-card', style: 'cursor:pointer;' });
        card.appendChild(el('div', { class: 'donut-title', text: def.title }));

        const data = def.data || [];
        const isSimple = def.isSimple;

        const size = 180;
        const stroke = 28;
        const radius = (size - stroke) / 2;
        const circumference = 2 * Math.PI * radius;
        const center = size / 2;

        const values = data.map(d => isSimple ? d.value : d[def.metric]);
        const total = values.reduce((s, v) => s + Math.abs(v), 0) || 1;
        let offset = 0;

        const svg = svgEl('svg', { class: 'donut-svg', width: size, height: size, viewBox: `0 0 ${size} ${size}` });
        svg.appendChild(svgEl('circle', { cx: center, cy: center, r: radius, fill: 'none', stroke: 'rgba(255,255,255,0.05)', 'stroke-width': stroke }));

        data.forEach((item, i) => {
            const val = values[i];
            const segment = Math.abs(val) / total;
            const dash = segment * circumference;
            const color = getDonutColor(i);

            const circle = svgEl('circle', {
                class: 'donut-segment',
                cx: center, cy: center, r: radius,
                fill: 'none', stroke: color, 'stroke-width': stroke,
                'stroke-dasharray': `${dash} ${circumference - dash}`,
                'stroke-dashoffset': -offset,
                'stroke-linecap': 'butt',
                style: 'transform: rotate(-90deg); transform-origin: center;'
            });
            circle.addEventListener('mousemove', e => showDonutTooltip(e, item, def.fmt, color));
            circle.addEventListener('mouseleave', hideDonutTooltip);
            svg.appendChild(circle);
            offset += dash;
        });

        svg.appendChild(svgEl('circle', { cx: center, cy: center, r: radius - stroke / 2 - 2, fill: 'var(--bg-panel)', stroke: 'rgba(255,255,255,0.08)', 'stroke-width': 1 }));

        const centerValue = values.reduce((s, v) => s + v, 0);
        svg.appendChild(svgEl('text', { class: 'donut-center-value', x: center, y: center - 2, 'text-anchor': 'middle', 'dominant-baseline': 'middle', text: def.fmt(centerValue) }));
        svg.appendChild(svgEl('text', { class: 'donut-center-label', x: center, y: center + 14, 'text-anchor': 'middle', 'dominant-baseline': 'middle', text: def.label }));

        card.appendChild(svg);

        const legend = el('div', { class: 'donut-legend' });
        data.slice(0, 5).forEach((item, i) => {
            const val = values[i];
            const color = getDonutColor(i);
            legend.appendChild(el('div', { class: 'donut-legend-item' }, [
                el('span', { class: 'donut-legend-dot', style: `background:${color};` }),
                el('span', { text: `${item.label}: ${def.fmt(val)}` })
            ]));
        });
        card.appendChild(legend);

        card.addEventListener('click', () => onClick(def));
        return card;
    }

    function renderExpandedChart(def, metrics, trades, onClose) {
        const wrapper = el('div', { class: 'expanded-chart-wrapper' });
        const data = def.data || [];
        const isSimple = def.isSimple;

        const left = el('div', { class: 'expanded-chart-left' });
        const largeCard = renderQuantDonut({ ...def, title: '' }, () => {
            if (typeof onClose === 'function') onClose();
        });
        largeCard.style.transform = 'scale(1.3)';
        largeCard.style.cursor = 'pointer';
        left.appendChild(largeCard);
        left.appendChild(el('div', { class: 'expanded-chart-metric', text: def.title.toUpperCase() }));
        wrapper.appendChild(left);

        const right = el('div', { class: 'expanded-chart-right' });
        right.appendChild(el('div', { class: 'detail-section-title', text: 'Quantitative Breakdown' }));

        const table = el('table', { class: 'quant-table' });
        table.appendChild(el('thead', {}, [el('tr', {}, [
            el('th', { text: 'Category' }),
            el('th', { text: 'Trades' }),
            el('th', { text: 'Win Rate' }),
            el('th', { text: 'Expectancy' }),
            el('th', { text: 'Profit Factor' }),
            el('th', { text: 'Avg R' }),
            el('th', { text: 'Max Cons Loss' }),
            el('th', { text: 'Net P&L' }),
        ])]));

        const tbody = el('tbody');
        data.forEach(item => {
            if (isSimple) return;
            const row = el('tr', {}, [
                el('td', { text: item.label }),
                el('td', { text: item.count }),
                el('td', { text: item.winRate.toFixed(1) + '%' }),
                el('td', { text: '$' + item.expectancy.toFixed(2) }),
                el('td', { text: item.profitFactor.toFixed(2) }),
                el('td', { text: item.avgR.toFixed(2) + 'R' }),
                el('td', { text: item.maxConsLoss }),
                el('td', { text: formatPnL(item.totalPnl) }),
            ]);
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        right.appendChild(table);

        if (!isSimple && data.length > 0) {
            const best = data[0];
            const worst = data[data.length - 1];
            const edgeInsight = el('div', { class: 'quant-insight' }, [
                el('div', { class: 'quant-insight-title', text: 'Edge Insight' }),
                el('div', { text: `Strongest edge: ${best.label} — $${best.expectancy.toFixed(2)}/trade expectancy, ${best.winRate.toFixed(1)}% win rate, ${best.profitFactor.toFixed(2)} profit factor.` }),
                el('div', { text: `Weakest edge: ${worst.label} — $${worst.expectancy.toFixed(2)}/trade expectancy, ${worst.winRate.toFixed(1)}% win rate.` }),
            ]);
            right.appendChild(edgeInsight);
        }

        wrapper.appendChild(right);
        return wrapper;
    }

    let activeTooltip = null;

    function showDonutTooltip(e, item, valueFormat, color) {
        hideDonutTooltip();
        const tooltip = el('div', { class: 'donut-tooltip' }, [
            el('div', { style: 'font-weight:700;color:' + color, text: item.label }),
            el('div', { text: valueFormat ? valueFormat(item.value || item.count) : (item.value || item.count) })
        ]);
        tooltip.style.left = e.clientX + 12 + 'px';
        tooltip.style.top = e.clientY + 12 + 'px';
        document.body.appendChild(tooltip);
        activeTooltip = tooltip;
    }

    function hideDonutTooltip() {
        if (activeTooltip) {
            activeTooltip.remove();
            activeTooltip = null;
        }
    }

    // T3MP3ST cyberpunk scanline overlay for the main content area
    // T3MP3ST cyberpunk scanline + grid overlay for the main content area
    const overlay = el('div', { id: 'crt-overlay', style: 'pointer-events:none;position:fixed;inset:0;z-index:9999;opacity:0.04;background:repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,240,255,0.15) 2px, rgba(0,240,255,0.15) 3px);' });
    document.body.appendChild(overlay);

    // ==================== INIT ====================
    async function init() {
        console.log('[Plutus] Dashboard initializing...');

        // Production: always use the live API. No mock data, ever.

        // Bind nav buttons
        $$('.nav-btn').forEach(btn => {
            if (btn.dataset.page) {
                btn.addEventListener('click', () => navigateToPage(btn.dataset.page));
            }
        });

        // Check API health
        checkAPIHealth();
        setInterval(checkAPIHealth, 15000);

        // Connect WebSocket
        WS.connect();

        // Navigate to overview
        navigateToPage('overview');

        // Start auto-refresh
        startAutoRefresh();

        console.log('[Plutus] Dashboard ready');
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose for debugging
    window.PLUTUS = { State, API, WS, navigateToPage };

    // ══════════════════════════════════════════════════════════
    // TAB SYSTEM INTEGRATION (v2 Mission Control)
    // ══════════════════════════════════════════════════════════
    // TabManager is loaded via separate script tag (tab-manager.js).
    // It handles tab switching, keyboard shortcuts, and state persistence.
    // The existing SPA continues to work as the DATA tab content.
    // No changes needed to the existing init() or page rendering logic.
})();
