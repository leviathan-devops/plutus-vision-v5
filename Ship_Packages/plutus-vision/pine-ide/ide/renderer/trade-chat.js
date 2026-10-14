/* =================================================================
   PLUTUS DASHBOARD — TRADE CHAT
   Agent chat panel for the TRADE tab. Talks to plutus-fang
   (:4200/api/chat) through the Electron IPC bridge when present
   (window.plutus.agentChat) and falls back to direct HTTP + SSE
   streaming when not. Standalone IIFE — exposes window.TradeChat.
   No dependencies on app.js.
   ================================================================= */

(function () {
    'use strict';

    const STYLE_ID = 'trade-chat-styles';
    const FANG_CHAT_URL = 'http://127.0.0.1:4200/api/chat';
    const MAX_HISTORY = 200;              // in-memory cap — DOM pruned to match
    const RUN_TIMEOUT_MS = 5 * 60 * 1000; // watchdog: unlock input if the agent goes silent
    const TOOL_SUMMARY_MAX = 100;
    const INPUT_MAX_HEIGHT = 96;

    const state = {
        initialized: false,
        collapsed: false,
        running: false,        // agent turn in flight — input locked
        ipcBound: false,       // onMessage callback registered on the bridge
        mode: 'http',          // 'ipc' | 'http'
        container: null,
        history: [],           // { role, content, timestamp }
        pendingToolRow: null,  // tool row awaiting its completion event
        abort: null,           // AbortController for the active HTTP stream
        watchdog: null,
        els: {},
    };

    // ==================== CSS INJECTION ====================
    const CSS = `
/* Layout: canvas+tracker in a left column, chat panel on the right.
   Higher specificity than trade-tracker.js's flex-direction:column rule
   so the override is deterministic regardless of style injection order. */
.app-shell > .tab-panel[data-panel="trade"]{flex-direction:row;}
#trade-left{flex:1 1 0;min-width:0;display:flex;flex-direction:column;}
#trade-chat-container{flex:0 0 360px;min-width:0;display:flex;transition:flex-basis var(--transition-base,200ms ease);}
#trade-chat-container.tc-collapsed{flex:0 0 40px;}

.tc-root{display:flex;flex-direction:column;width:100%;height:100%;min-width:0;background:var(--bg-panel,#0a0f17);border-left:1px solid var(--border-base,#1a2332);font-family:var(--font-mono,'SF Mono','Fira Code','Consolas',monospace);color:var(--text-primary,#e6f1ff);}
.tc-collapsed .tc-root{display:none;}

.tc-rail{display:none;flex-direction:column;align-items:center;padding-top:12px;width:100%;height:100%;background:var(--bg-panel,#0a0f17);border-left:1px solid var(--border-base,#1a2332);cursor:pointer;transition:background var(--transition-fast,120ms ease);}
.tc-collapsed .tc-rail{display:flex;}
.tc-rail:hover{background:var(--bg-panel-hover,#131a27);}
.tc-rail-icon{font-size:16px;filter:grayscale(.3);}
.tc-rail-label{margin-top:10px;writing-mode:vertical-rl;font-size:9px;font-weight:700;letter-spacing:3px;color:var(--text-muted,#5a6d8a);transition:color var(--transition-fast,120ms ease);}
.tc-rail:hover .tc-rail-label{color:var(--accent-cyan,#00f0ff);}

.tc-header{flex:0 0 auto;height:48px;display:flex;align-items:center;gap:8px;padding:0 10px;background:var(--bg-panel-elevated,#101621);border-bottom:1px solid var(--border-base,#1a2332);user-select:none;}
.tc-title{font-size:11px;font-weight:700;letter-spacing:2px;color:var(--accent-cyan,#00f0ff);text-shadow:var(--glow-cyan,0 0 10px rgba(0,240,255,.25));white-space:nowrap;}
.tc-mode{font-size:8px;font-weight:700;letter-spacing:1px;color:var(--text-muted,#5a6d8a);border:1px solid var(--border-base,#1a2332);border-radius:var(--radius-sm,4px);padding:1px 5px;}
.tc-spacer{flex:1;}
.tc-btn{background:none;border:1px solid var(--border-base,#1a2332);border-radius:var(--radius-sm,4px);color:var(--text-secondary,#8b9bb4);width:24px;height:20px;font-size:10px;line-height:1;cursor:pointer;font-family:inherit;transition:color var(--transition-fast,120ms ease),border-color var(--transition-fast,120ms ease);}
.tc-btn:hover{border-color:var(--accent-cyan,#00f0ff);color:var(--accent-cyan,#00f0ff);}

.tc-messages{flex:1 1 0;min-height:0;overflow-y:auto;padding:10px 0;scrollbar-width:thin;scrollbar-color:var(--border-base,#1a2332) transparent;}
.tc-messages::-webkit-scrollbar{width:6px;}
.tc-messages::-webkit-scrollbar-button{display:none;height:0;}
.tc-input::-webkit-scrollbar-button{display:none;height:0;}
.tc-messages::-webkit-scrollbar-thumb{background:var(--border-base,#1a2332);border-radius:3px;}

.tc-msg{margin:6px 10px;padding:7px 10px;border-radius:var(--radius-sm,4px);font-size:11.5px;line-height:1.55;white-space:pre-wrap;word-break:break-word;animation:tc-slide-in 220ms ease-out;}
.tc-msg-user{margin-left:44px;border:1px solid rgba(0,240,255,.4);border-right:3px solid var(--accent-cyan,#00f0ff);background:rgba(0,240,255,.05);}
.tc-msg-assistant{margin-right:20px;background:var(--bg-panel-elevated,#101621);border:1px solid var(--border-base,#1a2332);}
.tc-msg-tool{margin:4px 14px;padding:3px 8px;font-size:10px;color:var(--text-muted,#5a6d8a);border-left:2px solid var(--border-base,#1a2332);animation:none;}
.tc-msg-error{margin:8px 18px;padding:6px 10px;text-align:center;font-size:10.5px;color:var(--accent-red,#ff3860);background:rgba(255,56,96,.07);border:1px solid rgba(255,56,96,.45);}

.tc-thinking{display:flex;gap:5px;margin:6px 12px;padding:6px 0;animation:tc-fade 200ms ease-out;}
.tc-dot{font-size:8px;color:var(--accent-cyan,#00f0ff);animation:tc-blink 1.2s infinite;}
.tc-dot:nth-child(2){animation-delay:.2s;}
.tc-dot:nth-child(3){animation-delay:.4s;}

.tc-statebar{flex:0 0 auto;padding:4px 10px;font-size:9.5px;letter-spacing:1px;color:var(--text-muted,#5a6d8a);background:var(--bg-panel,#0a0f17);border-top:1px solid var(--border-base,#1a2332);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.tc-statebar.tc-busy{color:var(--accent-gold,#ffd166);}

.tc-input-row{flex:0 0 auto;display:flex;align-items:flex-end;gap:6px;padding:8px;background:var(--bg-panel-elevated,#101621);border-top:1px solid var(--border-base,#1a2332);}
.tc-input{flex:1;resize:none;background:var(--bg-base,#05070a);border:1px solid var(--border-base,#1a2332);border-radius:var(--radius-sm,4px);color:var(--text-primary,#e6f1ff);font-family:inherit;font-size:12px;line-height:1.5;padding:8px 10px;min-height:34px;max-height:${INPUT_MAX_HEIGHT}px;scrollbar-width:thin;}
.tc-input:focus{outline:none;border-color:var(--accent-cyan,#00f0ff);box-shadow:var(--glow-cyan,0 0 10px rgba(0,240,255,.25));}
.tc-input:disabled{opacity:.4;cursor:not-allowed;}
.tc-send{flex:0 0 auto;height:30px;padding:0 14px;background:rgba(0,240,255,.1);border:1px solid var(--accent-cyan,#00f0ff);border-radius:var(--radius-sm,4px);color:var(--accent-cyan,#00f0ff);font-family:inherit;font-size:10px;font-weight:700;letter-spacing:1.5px;cursor:pointer;transition:background var(--transition-fast,120ms ease),box-shadow var(--transition-fast,120ms ease);}
.tc-send:hover:not(:disabled){background:rgba(0,240,255,.2);box-shadow:var(--glow-cyan,0 0 10px rgba(0,240,255,.25));}
.tc-send:disabled{opacity:.35;cursor:not-allowed;}

@keyframes tc-slide-in{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}
@keyframes tc-fade{from{opacity:0;}to{opacity:1;}}
@keyframes tc-blink{0%,80%,100%{opacity:.15;}40%{opacity:1;}}
`;

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;
        const s = document.createElement('style');
        s.id = STYLE_ID;
        s.textContent = CSS;
        document.head.appendChild(s);
    }

    // ==================== DOM ====================
    // Static markup only — all dynamic content is set via textContent,
    // never innerHTML, so user/agent text cannot inject HTML.
    function buildDOM(container) {
        container.innerHTML =
            '<div class="tc-root">' +
                '<div class="tc-header">' +
                    '<span class="tc-title">💬 PLUTUS AGENT</span>' +
                    '<span class="tc-mode">HTTP</span>' +
                    '<div class="tc-spacer"></div>' +
                    '<button type="button" class="tc-btn tc-reset-btn" title="Clear chat history">⟲</button>' +
                    '<button type="button" class="tc-btn tc-collapse-btn" title="Collapse chat panel">▸</button>' +
                '</div>' +
                '<div class="tc-messages"></div>' +
                '<div class="tc-statebar">State: idle</div>' +
                '<div class="tc-input-row">' +
                    '<textarea class="tc-input" rows="1" spellcheck="false" placeholder="Message the agent… (Enter to send, Shift+Enter for newline)"></textarea>' +
                    '<button type="button" class="tc-send">SEND</button>' +
                '</div>' +
            '</div>' +
            '<div class="tc-rail" title="Expand chat panel">' +
                '<span class="tc-rail-icon">💬</span>' +
                '<span class="tc-rail-label">CHAT</span>' +
            '</div>';

        const q = sel => container.querySelector(sel);
        state.els = {
            root: q('.tc-root'), modeTag: q('.tc-mode'), messages: q('.tc-messages'),
            statebar: q('.tc-statebar'), input: q('.tc-input'), sendBtn: q('.tc-send'), rail: q('.tc-rail'),
        };
        state.els.sendBtn.addEventListener('click', () => send(state.els.input.value));
        state.els.input.addEventListener('keydown', onInputKeydown);
        state.els.input.addEventListener('input', autosizeInput);
        q('.tc-collapse-btn').addEventListener('click', toggle);
        q('.tc-reset-btn').addEventListener('click', clear);
        state.els.rail.addEventListener('click', toggle);
    }

    function onInputKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // newline only on Shift+Enter
            send(state.els.input.value);
        }
    }

    function autosizeInput() {
        const ta = state.els.input;
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, INPUT_MAX_HEIGHT) + 'px';
    }

    // ==================== MESSAGES ====================
    function appendMessage(kind, text) {
        const div = document.createElement('div');
        div.className = 'tc-msg tc-msg-' + kind;
        div.textContent = kind === 'user' ? '> ' + text : text;
        state.els.messages.appendChild(div);
        pruneMessages();
        scrollBottom();
        return div;
    }

    function pruneMessages() {
        const nodes = state.els.messages.querySelectorAll('.tc-msg');
        const excess = nodes.length - MAX_HISTORY;
        for (let i = 0; i < excess; i++) nodes[i].remove();
    }

    function pushHistory(role, content) {
        state.history.push({ role, content, timestamp: Date.now() });
        if (state.history.length > MAX_HISTORY) state.history.shift();
    }

    function scrollBottom() {
        state.els.messages.scrollTop = state.els.messages.scrollHeight;
    }

    function setState(label) {
        state.els.statebar.textContent = 'State: ' + label;
    }

    function showThinking() {
        if (state.els.messages.querySelector('.tc-thinking')) return;
        const div = document.createElement('div');
        div.className = 'tc-thinking';
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            dot.className = 'tc-dot';
            dot.textContent = '●';
            div.appendChild(dot);
        }
        state.els.messages.appendChild(div);
        scrollBottom();
    }

    function removeThinking() {
        const el = state.els.messages.querySelector('.tc-thinking');
        if (el) el.remove();
    }

    function summarizeResult(result) {
        if (result == null) return 'ok';
        const s = typeof result === 'string' ? result : JSON.stringify(result);
        if (!s) return 'ok';
        const first = String(s).split('\n')[0].trim();
        if (!first) return 'ok';
        return first.length > TOOL_SUMMARY_MAX ? first.slice(0, TOOL_SUMMARY_MAX - 3) + '…' : first;
    }

    // Tool rows update in place: "⚙ name: running…" → "✅ name: summary (Nms)"
    function startToolRow(name) {
        if (state.pendingToolRow) {
            state.pendingToolRow.textContent = '⚙ ' + (state.pendingToolRow.dataset.name || 'tool') + ': interrupted';
            state.pendingToolRow = null;
        }
        const row = appendMessage('tool', '⚙ ' + (name || 'tool') + ': running…');
        row.dataset.name = name || 'tool';
        state.pendingToolRow = row;
    }

    function completeToolRow(evt) {
        const name = evt.name || 'tool';
        const summary = summarizeResult(evt.result);
        const dur = Number.isFinite(evt.durationMs) ? ' (' + Math.round(evt.durationMs) + 'ms)' : '';
        const text = '✅ ' + name + ': ' + summary + dur;
        if (state.pendingToolRow) {
            state.pendingToolRow.textContent = text;
            state.pendingToolRow = null;
        } else {
            appendMessage('tool', text); // completion without a start event
        }
        pushHistory('tool', name + ': ' + summary);
        scrollBottom();
    }

    // ==================== RUN LIFECYCLE ====================
    function setRunning(on) {
        state.running = on;
        state.els.input.disabled = on;
        state.els.sendBtn.disabled = on;
        state.els.statebar.classList.toggle('tc-busy', on);
        if (state.watchdog) { clearTimeout(state.watchdog); state.watchdog = null; }
        if (on) {
            kickWatchdog();
        } else {
            state.pendingToolRow = null;
            if (state.initialized && !state.collapsed) state.els.input.focus();
        }
    }

    // A silent agent (crash, dropped stream, bridge bug) must not lock the
    // input forever — every event kicks the watchdog; expiry unlocks with
    // an error bubble.
    function kickWatchdog() {
        if (!state.running) return;
        if (state.watchdog) clearTimeout(state.watchdog);
        state.watchdog = setTimeout(() => {
            state.watchdog = null;
            if (!state.running) return;
            if (state.abort) state.abort.abort(); // spec-guaranteed not to throw
            appendMessage('error', 'Agent timed out — no events for ' + (RUN_TIMEOUT_MS / 60000) + ' min');
            pushHistory('error', 'watchdog timeout');
            setRunning(false);
            setState('idle');
        }, RUN_TIMEOUT_MS);
    }

    function failRun(message) {
        handleEvent({ type: 'error', message, timestamp: Date.now() });
        handleEvent({ type: 'done', timestamp: Date.now() });
    }

    // ==================== EVENT HANDLING ====================
    // Single handler for both transports — plutus-fang SSE event format:
    // started | thinking | tool_call_start | tool_call_complete |
    // response | error | done
    function handleEvent(evt) {
        if (!evt || typeof evt !== 'object' || !evt.type) return;
        if (state.running) kickWatchdog();
        switch (evt.type) {
            case 'started':
            case 'thinking':
                setState('thinking...');
                showThinking();
                break;
            case 'tool_call_start':
                removeThinking();
                setState((evt.name || 'tool') + '(...)');
                startToolRow(evt.name);
                break;
            case 'tool_call_complete':
                removeThinking();
                completeToolRow(evt);
                setState('thinking...');
                break;
            case 'response': {
                removeThinking();
                const content = evt.content == null ? ''
                    : (typeof evt.content === 'string' ? evt.content : JSON.stringify(evt.content, null, 2));
                if (content) {
                    appendMessage('assistant', content);
                    pushHistory('assistant', content);
                }
                break;
            }
            case 'error':
                removeThinking();
                appendMessage('error', String(evt.message || 'Unknown agent error'));
                pushHistory('error', String(evt.message || 'Unknown agent error'));
                break;
            case 'done':
                removeThinking();
                setRunning(false);
                setState('idle');
                break;
            default:
                break; // unknown event types are protocol noise — ignore
        }
    }

    // ==================== TRANSPORT — IPC BRIDGE ====================
    function getBridge() {
        const b = window.plutus && window.plutus.agentChat;
        return (b && typeof b.sendMessage === 'function') ? b : null;
    }

    function bindIpc() {
        if (state.ipcBound) return true;
        const bridge = getBridge();
        if (!bridge) return false;
        if (typeof bridge.onMessage === 'function') {
            bridge.onMessage(handleEvent);
        } else {
            console.warn('[Plutus] TradeChat: bridge has sendMessage but no onMessage — streaming events will not arrive');
        }
        state.ipcBound = true;
        state.mode = 'ipc';
        updateModeTag();
        return true;
    }

    function updateModeTag() {
        if (state.els.modeTag) state.els.modeTag.textContent = state.mode.toUpperCase();
    }

    // ==================== TRANSPORT — DIRECT HTTP + SSE ====================
    async function sendViaHttp(text) {
        state.abort = new AbortController();
        try {
            const resp = await fetch(FANG_CHAT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
                body: JSON.stringify({ message: text }),
                signal: state.abort.signal,
            });
            if (!resp.ok) throw new Error('HTTP ' + resp.status + ' from plutus-fang');
            if (!resp.body) throw new Error('plutus-fang returned no stream body');

            const reader = resp.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const frames = buffer.split(/\r?\n\r?\n/); // SSE frames end at a blank line
                buffer = frames.pop();                     // trailing partial frame stays buffered
                frames.forEach(parseSseFrame);
            }
            buffer += decoder.decode(); // flush multi-byte remainder
            if (buffer.trim()) parseSseFrame(buffer);
        } catch (err) {
            if (err && err.name === 'AbortError') return; // user cleared history mid-run
            failRun('plutus-fang unreachable: ' + (err && err.message ? err.message : String(err)));
            return;
        } finally {
            state.abort = null;
            if (state.running) {
                // Server closed the stream without a 'done' event — unlock quietly.
                console.warn('[Plutus] TradeChat: SSE stream ended without done event — unlocking input');
                removeThinking();
                setRunning(false);
                setState('idle');
            }
        }
    }

    function parseSseFrame(frame) {
        if (!frame) return;
        const dataLines = [];
        for (const line of frame.split(/\r?\n/)) {
            if (line.startsWith('data:')) dataLines.push(line.slice(5).replace(/^ /, ''));
        }
        if (!dataLines.length) return; // comment / keepalive frame
        const payload = dataLines.join('\n').trim();
        if (!payload || payload === '[DONE]') return;
        try {
            handleEvent(JSON.parse(payload));
        } catch (err) {
            console.warn('[Plutus] TradeChat: dropping unparseable SSE frame:', payload.slice(0, 120));
        }
    }

    // ==================== PUBLIC API ====================
    function init(container) {
        if (state.initialized) return;
        if (!container || typeof container.appendChild !== 'function') {
            console.error('[Plutus] TradeChat.init: a valid container element is required');
            return;
        }
        state.container = container;
        injectStyles();
        buildDOM(container);
        state.initialized = true;
        bindIpc(); // grab the IPC bridge if preload already exposed it
        updateModeTag();
        console.log('[Plutus] TradeChat initialized (' + state.mode + ' transport)');
    }

    function send(raw) {
        if (!state.initialized) { console.warn('[Plutus] TradeChat.send: not initialized'); return false; }
        const text = String(raw == null ? '' : raw).trim();
        if (!text || state.running) return false;

        appendMessage('user', text);
        pushHistory('user', text);
        state.els.input.value = '';
        autosizeInput();
        setRunning(true);
        setState('thinking...');
        showThinking();

        if (bindIpc()) {
            try {
                const result = getBridge().sendMessage(text);
                if (result && typeof result.catch === 'function') {
                    result.catch(err => failRun('IPC send failed: ' + (err && err.message ? err.message : String(err))));
                }
            } catch (err) {
                failRun('IPC send failed: ' + (err && err.message ? err.message : String(err)));
            }
        } else {
            sendViaHttp(text);
        }
        return true;
    }

    function toggle() {
        if (!state.initialized) return;
        state.collapsed = !state.collapsed;
        state.container.classList.toggle('tc-collapsed', state.collapsed);
        if (!state.collapsed && !state.running) state.els.input.focus();
    }

    function clear() {
        if (!state.initialized) return;
        if (state.abort) state.abort.abort(); // spec-guaranteed not to throw
        state.history = [];
        state.pendingToolRow = null;
        removeThinking();
        state.els.messages.textContent = '';
        setRunning(false);
        setState('idle');
        console.log('[Plutus] TradeChat: history cleared');
    }

    function isOpen() { return state.initialized && !state.collapsed; }

    window.TradeChat = Object.freeze({
        init,   // Initialize with container element
        toggle, // Collapse/expand
        send,   // Programmatically send a message
        clear,  // Clear chat history
        isOpen  // Returns whether chat is expanded
    });
})();
