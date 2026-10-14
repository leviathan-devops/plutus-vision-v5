(function() {
    'use strict';
    let initialized = false;

    function init() {
        if (initialized) return;
        initialized = true;
        console.log('[Plutus] Agent tab initialized');
        checkAgentStatus();
        setInterval(checkAgentStatus, 30000);
    }

    async function checkAgentStatus() {
        const statusEl = document.getElementById('agent-status');
        const placeholder = document.getElementById('agent-placeholder');
        if (!statusEl) return;

        try {
            let online = false;
            if (window.plutus?.agentChat?.getState) {
                const result = await window.plutus.agentChat.getState();
                online = result && result.success;
            } else {
                const resp = await fetch('http://127.0.0.1:4200/api/health', {
                    signal: AbortSignal.timeout(3000)
                });
                online = resp.ok;
            }

            if (online) {
                statusEl.textContent = '● ONLINE';
                statusEl.classList.add('online');
                if (placeholder && !document.getElementById('agent-webview')) {
                    loadAgentWebview(placeholder);
                }
            } else {
                throw new Error('not reachable');
            }
        } catch (e) {
            statusEl.textContent = '● OFFLINE';
            statusEl.classList.remove('online');
        }
    }

    function loadAgentWebview(placeholder) {
        const webview = document.createElement('webview');
        webview.id = 'agent-webview';
        webview.src = 'http://127.0.0.1:4200';
        webview.style.cssText = 'width:100%;height:100%;border:none;background:#0d1117;';
        webview.setAttribute('partition', 'persist:plutus-fang');
        webview.setAttribute('webpreferences', 'contextIsolation=yes, nodeIntegration=no');
        webview.addEventListener('dom-ready', () => console.log('[Plutus] Agent webview loaded'));
        webview.addEventListener('did-fail-load', (e) => console.error('[Plutus] Agent webview failed:', e.errorDescription));
        placeholder.innerHTML = '';
        placeholder.style.cssText = 'padding:0;width:100%;height:100%;display:flex;overflow:hidden;';
        placeholder.appendChild(webview);
    }

    window.AgentTab = Object.freeze({ init });
})();
