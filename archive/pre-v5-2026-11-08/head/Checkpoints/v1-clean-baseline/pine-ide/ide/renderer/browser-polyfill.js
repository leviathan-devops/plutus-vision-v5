/**
 * browser-polyfill.js — Provides window.plutus IPC bridges in non-Electron context.
 * 
 * When running inside the container's Chrome (not Electron), this script provides
 * the same window.plutus.tvBridge, window.plutus.agentChat, and window.plutus.mt5Bridge
 * APIs that preload.js normally provides.
 * 
 * - tvBridge: connects directly to CDP on port 3690 for screencast + input forwarding
 * - agentChat: HTTP calls to plutus-fang on :4200
 * - mt5Bridge: HTTP calls to pipeline sidecar on :9420 which proxies to ZMQ bridge
 */

(function() {
    'use strict';
    
    if (window.plutus) {
        console.log('[Polyfill] window.plutus already exists, skipping');
        return;
    }
    
    console.log('[Polyfill] Initializing browser polyfill for non-Electron context');
    
    const CDP_PORT = 3690;
    const SIDECAR_URL = 'http://localhost:9420';  // All proxied through sidecar (CORS-safe)
    
    let cdpWs = null;
    let cdpMsgId = 1;
    let cdpPending = new Map();
    let tvTab = null;
    let screencastCallbacks = [];
    let screencastActive = false;
    let lastSessionId = null;
    
    // ─── CDP Connection ───
    async function connectCDP() {
        if (cdpWs && cdpWs.readyState === WebSocket.OPEN) return;
        
        // Discover the TV tab via sidecar proxy (avoids CORS)
        try {
            const resp = await fetch(`${SIDECAR_URL}/cdp/list`);
            const tabs = await resp.json();
            tvTab = tabs.find(t => t.type === 'page' && t.url && t.url.includes('tradingview'));
            
            if (!tvTab) {
                console.warn('[Polyfill] No TradingView tab found on CDP port', CDP_PORT);
                return false;
            }
            
            console.log('[Polyfill] Found TV tab:', tvTab.title);
            
            // Connect to browser-level WebSocket for screencast (via proxy for version)
            const verResp = await fetch(`${SIDECAR_URL}/cdp/version`);
            const ver = await verResp.json();
            
            cdpWs = new WebSocket(ver.webSocketDebuggerUrl);
            
            cdpWs.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.method === 'Page.screencastFrame') {
                        // Forward screencast frame to callbacks
                        const frameData = msg.params.data;
                        const sessionId = msg.params.sessionId;
                        const metadata = msg.params.metadata;
                        
                        screencastCallbacks.forEach(cb => {
                            try {
                                cb({
                                    data: frameData,
                                    width: metadata.deviceWidth || 1920,
                                    height: metadata.deviceHeight || 1080,
                                    sessionId
                                });
                            } catch(e) { console.error('[Polyfill] Frame callback error:', e); }
                        });
                        
                        // Acknowledge the frame
                        if (cdpWs && cdpWs.readyState === WebSocket.OPEN) {
                            cdpWs.send(JSON.stringify({
                                id: cdpMsgId++,
                                method: 'Page.screencastFrameAck',
                                params: { sessionId }
                            }));
                        }
                    } else if (msg.id && cdpPending.has(msg.id)) {
                        const { resolve, reject } = cdpPending.get(msg.id);
                        cdpPending.delete(msg.id);
                        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
                        else resolve(msg.result);
                    }
                } catch(e) {
                    // Non-JSON frame, ignore
                }
            };
            
            await new Promise((resolve, reject) => {
                cdpWs.onopen = resolve;
                cdpWs.onerror = reject;
                setTimeout(() => reject(new Error('CDP connect timeout')), 5000);
            });
            
            // Attach to the TV tab for screencast
            const attachResult = await cdpSend('Target.attachToTarget', {
                targetId: tvTab.id,
                flatten: true
            });
            lastSessionId = attachResult.sessionId;
            
            console.log('[Polyfill] CDP connected, TV tab session:', lastSessionId);
            return true;
            
        } catch(e) {
            console.error('[Polyfill] CDP connect failed:', e.message);
            return false;
        }
    }
    
    function cdpSend(method, params = {}) {
        return new Promise((resolve, reject) => {
            if (!cdpWs || cdpWs.readyState !== WebSocket.OPEN) {
                reject(new Error('CDP not connected'));
                return;
            }
            const id = cdpMsgId++;
            // Add sessionId for tab-level commands
            if (lastSessionId && !method.startsWith('Target.')) {
                params.sessionId = lastSessionId;
            }
            cdpPending.set(id, { resolve, reject });
            cdpWs.send(JSON.stringify({ id, method, params }));
            setTimeout(() => {
                if (cdpPending.has(id)) {
                    cdpPending.delete(id);
                    reject(new Error('CDP timeout: ' + method));
                }
            }, 10000);
        });
    }
    
    // ─── tvBridge ───
    const tvBridge = {
        onFrame: function(callback) {
            screencastCallbacks.push(callback);
        },
        
        sendInput: function(event) {
            if (!cdpWs || cdpWs.readyState !== WebSocket.OPEN) return;
            
            const params = {
                type: event.type || 'mouseMoved',
                x: Math.round(event.x || 0),
                y: Math.round(event.y || 0),
                button: event.button || 'none',
                buttons: event.buttons || 0,
                clickCount: event.clickCount || 0,
                pointerType: 'mouse'
            };
            
            // Send with sessionId
            cdpWs.send(JSON.stringify({
                id: cdpMsgId++,
                method: 'Input.dispatchMouseEvent',
                params: { ...params, sessionId: lastSessionId }
            }));
        },
        
        navigate: async function(url) {
            try {
                await cdpSend('Page.navigate', { url });
            } catch(e) { console.error('[Polyfill] Navigate failed:', e); }
        },
        
        switchPair: async function(pair) {
            const url = `https://www.tradingview.com/chart/?symbol=FX:${pair}`;
            await this.navigate(url);
        },
        
        screenshot: async function() {
            try {
                const result = await cdpSend('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
                return result?.data || null;
            } catch(e) { return null; }
        },
        
        evaluate: async function(expression) {
            try {
                const result = await cdpSend('Runtime.evaluate', {
                    expression,
                    returnByValue: true
                });
                return result?.result?.value;
            } catch(e) { return null; }
        },
        
        getStatus: async function() {
            const connected = cdpWs && cdpWs.readyState === WebSocket.OPEN && tvTab !== null;
            let viewport = null;
            try {
                const vp = await cdpSend('Runtime.evaluate', {
                    expression: 'JSON.stringify({w: window.innerWidth, h: window.innerHeight})',
                    returnByValue: true
                });
                if (vp?.result?.value) viewport = JSON.parse(vp.result.value);
            } catch(e) {}
            return { connected, tvTab: tvTab?.title || null, viewport };
        },
        
        activateTradeTab: async function() {
            console.log('[Polyfill] Activating trade tab — starting screencast');
            const connected = await connectCDP();
            if (!connected) {
                console.error('[Polyfill] Cannot activate trade tab — CDP not available');
                return;
            }
            
            if (!screencastActive) {
                screencastActive = true;
                try {
                    await cdpSend('Page.enable');
                    await cdpSend('Page.startScreencast', {
                        format: 'jpeg',
                        quality: 60,
                        maxWidth: 1920,
                        maxHeight: 1080
                    });
                    console.log('[Polyfill] Screencast started');
                } catch(e) {
                    console.error('[Polyfill] Screencast failed:', e);
                }
            }
        }
    };
    
    // ─── agentChat ───
    const agentChat = {
        sendMessage: async function(text) {
            try {
                const resp = await fetch(`${SIDECAR_URL}/fang/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'plutus-agent',
                        messages: [{ role: 'user', content: text }],
                        stream: false,
                        max_tokens: 4096
                    })
                });
                const data = await resp.json();
                return { success: true, response: data.choices?.[0]?.message?.content || '' };
            } catch(e) {
                return { success: false, error: e.message };
            }
        },
        
        getState: async function() {
            try {
                const resp = await fetch(`${SIDECAR_URL}/fang/health`, { signal: AbortSignal.timeout(3000) });
                const data = await resp.json();
                return { success: data.status === 'ok', ...data };
            } catch(e) {
                return { success: false };
            }
        },
        
        getHistory: async function() {
            return { messages: [] };
        },
        
        reset: function() {
            return { success: true };
        },
        
        onMessage: function(callback) {
            // SSE would go here for streaming
        }
    };
    
    // ─── mt5Bridge ───
    const mt5Bridge = {
        getAccount: async function() {
            try {
                const resp = await fetch(`${SIDECAR_URL}/mt5/account`);
                if (resp.ok) return await resp.json();
                return { success: false, error: 'Sidecar MT5 endpoint unavailable' };
            } catch(e) {
                return { success: false, error: e.message };
            }
        },
        
        getPositions: async function() {
            try {
                const resp = await fetch(`${SIDECAR_URL}/mt5/positions`);
                if (resp.ok) {
                    const data = await resp.json();
                    return { success: true, data: data.data?.positions || [] };
                }
                return { success: true, data: [] };
            } catch(e) {
                return { success: true, data: [] };
            }
        },
        
        marketOrder: async function(order) {
            return { success: false, error: 'Use MT5 tab or pipeline for orders' };
        },
        
        limitOrder: async function(order) {
            return { success: false, error: 'Not yet supported' };
        },
        
        closePosition: async function(ticket) {
            return { success: false, error: 'Use MT5 terminal' };
        },
        
        closeAll: async function() {
            return { success: false, error: 'Use MT5 terminal' };
        }
    };
    
    // ─── Install ───
    // NOTE: tvBridge intentionally NOT provided — trade-canvas.js uses
    // SSE screencast via sidecar proxy when no Electron bridge exists.
    window.plutus = Object.freeze({
        agentChat,
        mt5Bridge
    });
    
    console.log('[Polyfill] window.plutus installed');
})();
