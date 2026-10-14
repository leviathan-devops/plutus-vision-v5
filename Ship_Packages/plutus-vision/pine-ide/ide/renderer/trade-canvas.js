/* =================================================================
   PLUTUS DASHBOARD — TRADE CANVAS (TradingView Live View)
   Standalone IIFE — exposes window.TradeCanvas. No dependencies.

   Renders the CDP-bridge screencast (JPEG frames over IPC) onto a
   <canvas>, and forwards user input (mouse / wheel / keyboard) back
   to the main process so the remote TradingView chart is fully
   interactive. Replaces the placeholder canvas logic in trade-tab.js.

   IPC contract (see electron/preload.js → window.plutus.tvBridge):
     in : onFrame((event, frame) => drawFrame(frame.data))   'tv-frame'
     out: sendInput({type, x, y, ...})                        'tv-input'
     out: navigate(url)                                       'tv:navigate'
     out: screenshot()                                        'tv:screenshot'

   Input event shapes match CDPBridge.handleInput() in
   electron/cdp/cdp-bridge.js: click | mousemove | scroll |
   keypress | contextmenu.
   ================================================================= */

(function () {
    'use strict';

    // ==================== CONSTANTS ====================
    let CANVAS_W = 1920;
    let CANVAS_H = 1080;

    // Frame draw throttle — 90fps target (2026-08-01: Chrome runs with
    // --disable-frame-rate-limit so the screencast can exceed 60fps).
    const TARGET_FPS = 90;
    const FRAME_INTERVAL = 1000 / TARGET_FPS;          // ~11.1ms

    // Mousemove forwarding throttle: 30fps while hovering, 60fps while
    // dragging so chart pans feel responsive.
    const HOVER_INTERVAL = 1000 / 30;                  // ~33.3ms
    const DRAG_INTERVAL = 1000 / 60;                   // ~16.7ms

    // No frames for this long → declare the connection lost.
    const CONNECTION_TIMEOUT = 5000;
    const WATCHDOG_INTERVAL = 1000;

    // Pair → TradingView symbol mapping.
    const SYMBOL_MAP = Object.freeze({
        EURUSD: 'OANDA:EURUSD',
        GBPUSD: 'OANDA:GBPUSD',
        AUDUSD: 'OANDA:AUDUSD',
        DXY: 'TVC:DXY',
    });
    const CHART_URL = 'https://www.tradingview.com/chart/?symbol=';

    // ==================== STATE ====================
    let initialized = false;
    let bridgeAvailable = false;
    let container = null;
    let canvas = null;
    let ctx = null;
    let overlay = null;
    let overlayText = null;
    let watchdogTimer = null;

    let frameCount = 0;
    let lastFrameTime = 0;       // ms timestamp of last drawn frame
    let lastDrawTime = 0;        // ms timestamp of last drawImage (throttle)
    let lastMoveSend = 0;        // ms timestamp of last forwarded mousemove
    let isDragging = false;

    // ==================== IPC HELPERS ====================
    function bridge() {
        return window.plutus && window.plutus.tvBridge;
    }

    function sendInput(payload) {
        const b = bridge();
        if (b && typeof b.sendInput === 'function') {
            b.sendInput(payload);
        }
    }

    // ==================== COORDINATE MAPPING ====================
    // The canvas is CSS-scaled (width:100%) but has a fixed internal
    // resolution (1920x1080). Map a CSS-space client coordinate into
    // internal canvas pixels so clicks land on the correct chart pixel.
    function toCanvasCoords(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return null; // not laid out yet
        // Full-bleed (no object-fit:contain): the canvas content is stretched
        // per-axis into the pane box → per-axis mapping keeps clicks exact.
        // If contain ever returns (letterbox bars), the uniform-scale branch
        // handles it. Both branches verified sub-pixel in the container.
        const cs = getComputedStyle(canvas);
        if (cs.objectFit === 'contain') {
            const scale = Math.min(rect.width / canvas.width, rect.height / canvas.height);
            const ox = (rect.width - canvas.width * scale) / 2;
            const oy = (rect.height - canvas.height * scale) / 2;
            return {
                x: Math.round((clientX - rect.left - ox) / scale),
                y: Math.round((clientY - rect.top - oy) / scale),
            };
        }
        return {
            x: Math.round((clientX - rect.left) * (canvas.width / rect.width)),
            y: Math.round((clientY - rect.top) * (canvas.height / rect.height)),
        };
    }

    // ==================== OVERLAY (loading / lost / fallback) ====================
    function createOverlay() {
        overlay = document.createElement('div');
        overlay.className = 'tv-canvas-overlay';
        overlay.style.cssText =
            'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;' +
            'background:rgba(13,17,23,0.92);color:#8b949e;font-size:14px;font-family:monospace;' +
            'z-index:10;pointer-events:none;text-align:center;padding:20px;box-sizing:border-box;';

        overlayText = document.createElement('div');
        overlayText.textContent = 'Connecting to TradingView...';
        overlay.appendChild(overlayText);
        return overlay;
    }

    function showOverlay(message) {
        if (!overlay) return;
        if (message && overlayText) overlayText.textContent = message;
        overlay.style.display = 'flex';
    }

    function hideOverlay() {
        if (overlay) overlay.style.display = 'none';
    }

    // Non-Electron context (no preload bridge): show a static notice and
    // leave the canvas inert. Nothing to connect to, nothing to forward.
    function showFallback() {
        showOverlay(
            'TradingView bridge unavailable.\n' +
            'Run inside the Plutus Electron shell to enable the live chart.'
        );
    }

    // ==================== CANVAS CONSTRUCTION ====================
    function createCanvas() {
        canvas = document.createElement('canvas');
        canvas.id = 'tv-canvas';
        canvas.width = CANVAS_W;
        canvas.height = CANVAS_H;
        canvas.style.cssText =
            // NO object-fit:contain (2026-08-01): contain letterboxes the
            // viewport-aspect content inside the pane → black bars top/bottom
            // (operator: "screen dimensions are fucked"). Full-bleed instead;
            // the coordinate mapping is per-axis so clicks stay exact.
            'width:100%;height:100%;cursor:crosshair;' +
            'image-rendering:-webkit-optimize-contrast;display:block;';
        canvas.setAttribute('tabindex', '0'); // focusable → receives keydown
        ctx = canvas.getContext('2d', { alpha: false });
        return canvas;
    }

    // ==================== FRAME RENDERING ====================
    // Fast path (2026-08-01): off-main-thread decode via createImageBitmap
    // with single-flight + latest-wins. The old Image() path decoded on the
    // main thread and queued stale frames — the effective fps cap once the
    // container Chrome hit 44fps with SwiftShader.
    let _decodeInFlight = false;
    let _pendingFrame = null;
    function drawFrame(base64Data) {
        if (!ctx || !canvas || typeof base64Data !== 'string') return;

        if (_decodeInFlight) {
            _pendingFrame = base64Data;  // latest wins — drop intermediates
            return;
        }
        _decodeInFlight = true;

        try {
            const bin = atob(base64Data);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            createImageBitmap(new Blob([bytes], { type: 'image/jpeg' }))
                .then(function (bmp) {
                    _decodeInFlight = false;
                    if (_pendingFrame) {
                        const next = _pendingFrame;
                        _pendingFrame = null;
                        drawFrame(next);
                    }
                    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
                    bmp.close();
                    frameCount++;
                    lastFrameTime = Date.now();
                    hideOverlay(); // first frame (and every frame after) → live
                })
                .catch(function () {
                    _decodeInFlight = false; // corrupt frame — skip, keep last
                });
        } catch (e) {
            _decodeInFlight = false;
        }
    }

    // ==================== CONNECTION WATCHDOG ====================
    // Fires every second. Once we've seen at least one frame, a gap longer
    // than CONNECTION_TIMEOUT means the stream died → surface "Connection
    // lost" until frames resume (drawFrame hides the overlay on receipt).
    // NOTE: _viewportSynced + syncViewport are MODULE-scope (2026-08-01) —
    // they were declared inside init() while the watchdog lived at module
    // scope → "ReferenceError: _viewportSynced is not defined" every second
    // → the viewport NEVER synced → canvas stayed 1920x1080 vs the real
    // ~1919x926 → the persistent mouse-to-cursor gap. THE gap root cause.
    var _viewportSynced = false;
    var _initTime = 0;
    function syncViewport() {
        if (_viewportSynced) return;
        var _b = bridge();
        if (!_b || typeof _b.getStatus !== 'function') return;
        _b.getStatus().then(function(status) {
            // THE GAP ROOT CAUSE (2026-08-01, container-PROVEN via renderer
            // instrumentation): tv:status returns viewport as {w,h} — the
            // sync checked status.viewport.WIDTH/HEIGHT → undefined → early
            // return → the canvas NEVER synced (stayed 1920x1080 vs the real
            // 1919x926) → every click ~12% off vertically = the user's gap.
            // Accept BOTH field shapes; only mark synced when the canvas
            // actually holds the viewport dimensions.
            var vp = status && status.viewport;
            var vw = vp && (vp.width || vp.w);
            var vh = vp && (vp.height || vp.h);
            if (!(vw && vh && canvas)) return;
            if (canvas.width !== vw || canvas.height !== vh) {
                canvas.width = vw;
                canvas.height = vh;
                CANVAS_W = vw; CANVAS_H = vh;
                console.log('[TradeCanvas] Viewport synced:', vw + 'x' + vh);
            }
            _viewportSynced = true;
        // // RECORDED, not swallowed: a bridge that never answers left the canvas unscaled
        // with no trace while the watchdog retried forever.
        }).catch(function (e) {
            console.warn('[TradeCanvas] viewport sync failed:', (e && e.message) || e);
        })
    }
    function startWatchdog() {
        if (watchdogTimer) return;
        watchdogTimer = setInterval(function () {
            // Retry viewport sync until it lands (kills the click gap when
            // the init-time query ran before the bridge connected).
            if (!_viewportSynced) syncViewport();
            // AUDIT FIX (2026-08-01): the old check required frameCount > 0,
            // so if NO frame EVER arrived (stream dead from the start) the
            // overlay stayed "Connecting to TradingView..." forever — the
            // operator's "infinitely connecting". Show "Connection lost"
            // when the stream is silent from the start too.
            if (Date.now() - _initTime > CONNECTION_TIMEOUT &&
                (frameCount === 0 || Date.now() - lastFrameTime > CONNECTION_TIMEOUT)) {
                showOverlay('Connection lost');
            }
        }, WATCHDOG_INTERVAL);
    }

    // ==================== INPUT FORWARDING ====================
    function wireInput() {
        // mousedown → press (button held) so drags work. A 'click' type
        // (press+release in one shot) made pan/draw drags impossible.
        canvas.addEventListener('mousedown', function (e) {
            canvas.focus();
            canvas.setAttribute('tabindex', '0');
            const p = toCanvasCoords(e.clientX, e.clientY);
            if (!p) return;
            isDragging = true;
            sendInput({ type: 'mousePressed', x: p.x, y: p.y, button: e.button === 2 ? 'right' : 'left', buttons: 1 });
        });

        // mousemove → forward hover OR drag (button+buttons carried while
        // dragging so TradingView sees a held button).
        canvas.addEventListener('mousemove', function (e) {
            const interval = isDragging ? DRAG_INTERVAL : HOVER_INTERVAL;
            const now = Date.now();
            if (now - lastMoveSend < interval) return;
            const p = toCanvasCoords(e.clientX, e.clientY);
            if (!p) return;
            lastMoveSend = now;
            sendInput({
                type: 'mousemove', x: p.x, y: p.y,
                button: isDragging ? 'left' : 'none',
                buttons: isDragging ? 1 : 0,
            });
        });

        // mouseup → release the held button.
        canvas.addEventListener('mouseup', function (e) {
            const p = toCanvasCoords(e.clientX, e.clientY);
            if (p) sendInput({ type: 'mouseReleased', x: p.x, y: p.y, button: e.button === 2 ? 'right' : 'left', buttons: 0 });
            isDragging = false;
        });

        // mouseleave → end the drag.
        canvas.addEventListener('mouseleave', function () { isDragging = false; });

        // wheel → scroll. passive:false so preventDefault stops page scroll.
        canvas.addEventListener('wheel', function (e) {
            e.preventDefault();
            const p = toCanvasCoords(e.clientX, e.clientY);
            if (!p) return;
            sendInput({ type: 'scroll', x: p.x, y: p.y, deltaY: e.deltaY });
        }, { passive: false });

        // contextmenu → right-click; suppress the native browser menu.
        canvas.addEventListener('contextmenu', function (e) {
            e.preventDefault();
            const p = toCanvasCoords(e.clientX, e.clientY);
            if (!p) return;
            sendInput({ type: 'contextmenu', x: p.x, y: p.y });
        });

        // keydown → forward the key. Modifier combos (Ctrl+1..4 etc.) are
        // left alone so the dashboard's own tab shortcuts keep working.
        // TYPE BUFFER (2026-08-01): printable chars accumulate and flush as
        // ONE insertText string every 50ms — per-key IPCs under the screencast
        // flood dropped characters ("some letters work some don't").
        var _typeBuf = '';
        var _typeTimer = null;
        function flushTypeBuf() {
            if (_typeTimer) { clearTimeout(_typeTimer); _typeTimer = null; }
            if (!_typeBuf) return;
            var t = _typeBuf;
            _typeBuf = '';
            sendInput({ type: 'type', text: t });
        }
        function forwardKey(e) {
            if (e.ctrlKey || e.altKey || e.metaKey) return;
            // Modifier-ONLY keydowns (Shift/Control/Alt/Meta/CapsLock) carry
            // no character and no editing action — forwarding them as
            // keypresses dispatches bogus key events to the remote page that
            // can interfere with the following insertText. Skip them.
            if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' ||
                e.key === 'Meta' || e.key === 'CapsLock' || e.key === 'Dead') return;
            e.preventDefault();
            // Printable single characters → buffered insertText.
            if (e.key && e.key.length === 1) {
                _typeBuf += e.key;
                if (_typeTimer) clearTimeout(_typeTimer);
                _typeTimer = setTimeout(flushTypeBuf, 50);
            } else {
                flushTypeBuf(); // non-printable first, then the keypress
                // code matters: TradingView's handlers key off event.code
                // ('ArrowLeft' etc.) — empty code = ignored keypress.
                sendInput({ type: 'keypress', key: e.key, code: e.code || '' });
            }
        }
        canvas.addEventListener('keydown', forwardKey);

        // KEYBOARD SCOPING (2026-08-01, fable evidence round): the container
        // observation proved keys DIE when the canvas loses focus to neutral
        // ground (the body) — the operator's "30-40% of keys don't register".
        // The earlier document fallback fixed that but hijacked the
        // dashboard's OWN buttons (tab bar, control bar) — the "slides all
        // over". The correct scoping: forward keys from neutral ground in
        // the trade tab, but NEVER from the dashboard's interactive elements
        // (inputs, buttons, links, selects, the chat) — those keep their keys.
        document.addEventListener('keydown', function (e) {
            var t = e.target;
            if (t === canvas) return;                       // canvas listener handles it
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' ||
                      t.tagName === 'BUTTON' || t.tagName === 'A' ||
                      t.tagName === 'SELECT' || t.isContentEditable)) return;
            if (!canvas || !canvas.offsetParent) return;    // trade tab inactive
            if (e.ctrlKey || e.altKey || e.metaKey) return; // dashboard shortcuts
            if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' ||
                e.key === 'Meta' || e.key === 'CapsLock' || e.key === 'Dead') return;
            forwardKey(e);
        }, true);

        // Anchor: any click inside the trade pane re-focuses the canvas.
        if (container) {
            container.addEventListener('click', function () {
                if (canvas) { canvas.focus(); canvas.setAttribute('tabindex', '0'); }
            }, true);
        }
    }

    // ==================== NAVIGATION ====================
    function navigate(url) {
        const b = bridge();
        if (b && typeof b.navigate === 'function') {
            return b.navigate(url);
        }
        return Promise.resolve(null);
    }

    // Maps a pair to its TV symbol and navigates the remote chart there.
    // Symbol is appended raw (no encoding) to match main.js tv:switch-pair —
    // both navigation paths must produce identical URLs.
    function navigateToPair(pair) {
        const symbol = SYMBOL_MAP[pair] || ('FX:' + pair);
        return navigate(CHART_URL + symbol);
    }

    function screenshot() {
        const b = bridge();
        if (b && typeof b.screenshot === 'function') {
            return b.screenshot();
        }
        return Promise.resolve(null);
    }

    // ==================== SSE SCREENCAST (non-Electron mode) ====================
    let sseSource = null;
    
    function startSSE() {
        wireInputSSE();
        showOverlay('Connecting to TradingView...');
        // Use polling instead of SSE — more reliable
        startPolling();
        startWatchdog();
        console.log('[TradeCanvas] Screenshot polling started');
    }
    
    let pollTimer = null;
    
    function startPolling() {
        async function poll() {
            try {
                const resp = await fetch('http://localhost:9420/cdp/screenshot');
                const result = await resp.json();
                if (result.success && result.data) {
                    drawFrame(result.data);
                }
            } catch(e) {
                // Silently retry on next poll
            }
        }
        
        // Initial fetch
        poll();
        // Poll every 800ms (~1.25fps — reliable for trading charts)
        pollTimer = setInterval(poll, 800);
    }
    
    // Input forwarding via HTTP POST (non-Electron mode)
    function wireInputSSE() {
        canvas.addEventListener('mousedown', function(e) {
            canvas.focus();
            const p = toCanvasCoords(e.clientX, e.clientY);
            if (!p) return;
            isDragging = true;
            sendInputSSE('mousePressed', p.x, p.y, 'left', 1);
        });
        
        canvas.addEventListener('mousemove', function(e) {
            const interval = isDragging ? DRAG_INTERVAL : HOVER_INTERVAL;
            const now = Date.now();
            if (now - lastMoveSend < interval) return;
            const p = toCanvasCoords(e.clientX, e.clientY);
            if (!p) return;
            lastMoveSend = now;
            sendInputSSE('mouseMoved', p.x, p.y, 'none', 0);
        });
        
        canvas.addEventListener('mouseup', function(e) {
            const p = toCanvasCoords(e.clientX, e.clientY);
            if (p) sendInputSSE('mouseReleased', p.x, p.y, 'left', 0);
            isDragging = false;
        });
        
        canvas.addEventListener('mouseleave', function() { isDragging = false; });
        
        canvas.addEventListener('wheel', function(e) {
            e.preventDefault();
        }, { passive: false });
        
        canvas.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        });
    }
    
    function sendInputSSE(type, x, y, button, buttons) {
        fetch('http://localhost:9420/cdp/input', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, x, y, button, buttons })
        // // fire-and-forget, but NOT silently: a click that never reached the bridge is
        // indistinguishable from one the user never made.
        }).catch(function (e) {
            console.warn('[TradeCanvas] input dispatch failed:', (e && e.message) || e);
        }) // fire-and-forget
    }

    // ==================== INIT ====================
    function init(containerEl) {
        if (initialized) return;
        initialized = true;
        _initTime = Date.now();

        container = containerEl || document.getElementById('trade-placeholder');
        if (!container) {
            console.warn('[TradeCanvas] No container element — init aborted');
            return;
        }

        // The overlay is absolutely positioned; anchor it to the container.
        if (getComputedStyle(container).position === 'static') {
            container.style.position = 'relative';
        }

        // Hide the descriptive placeholder children (icon/title/text) so they
        // don't overlap the canvas. The #trade-status pill is left in place —
        // trade-tab.js owns it via updateStatus().
        container.querySelectorAll(
            '.placeholder-icon, .placeholder-title, .placeholder-text'
        ).forEach(function (el) { el.style.display = 'none'; });

        // Query the remote Chrome viewport size so the canvas matches 1:1
        // (eliminates the coordinate offset — the #1 interactivity bug).
        // syncViewport()/_viewportSynced live at MODULE scope (shared with
        // the watchdog + first-frame hook). First attempt here, then the
        // watchdog retries every second until it lands.
        syncViewport();

        // PANE-MATCHED VIEWPORT (2026-08-01): whenever the canvas box
        // resizes (chat panel toggle, window resize), tell Chrome to render
        // at the pane size → the screencast fills the pane 1:1 — no
        // letterbox bars, no squish, native resolution. Debounced 300ms.
        var _vpTimer = null;
        function reportPaneSize() {
            if (!canvas) return;
            var r = canvas.getBoundingClientRect();
            if (r.width < 50 || r.height < 50) return;
            var b = bridge();
            if (b && typeof b.setViewport === 'function') {
                b.setViewport(Math.round(r.width), Math.round(r.height)).then(function(ok) {
                    if (ok) {
                        _viewportSynced = false;  // re-sync to the new size
                        syncViewport();
                    }
                // // RECORDED: a pane resize that never reached the bridge left the chart at
                // the old scale with nothing to explain it.
                }).catch(function (e) {
                    console.warn('[TradeCanvas] setViewport failed:', (e && e.message) || e);
                })
            }
        }
        if (typeof ResizeObserver !== 'undefined' && container) {
            var ro = new ResizeObserver(function() {
                if (_vpTimer) clearTimeout(_vpTimer);
                _vpTimer = setTimeout(reportPaneSize, 300);
            });
            ro.observe(container);
        }
        // POLL fallback (2026-08-01, run 8): the observer can miss layout
        // shifts (flex transitions, chat toggle). A 500ms poll guarantees
        // the Chrome viewport always matches the pane — the chart fills the
        // space and re-adapts when tabs collapse/expand, undistorted.
        var _lastPaneW = 0, _lastPaneH = 0;
        setInterval(function() {
            if (!canvas) return;
            var r = canvas.getBoundingClientRect();
            var w = Math.round(r.width), h = Math.round(r.height);
            if ((w !== _lastPaneW || h !== _lastPaneH) && w > 50 && h > 50) {
                _lastPaneW = w; _lastPaneH = h;
                reportPaneSize();
            }
        }, 500);

        createCanvas();
        container.appendChild(canvas);
        container.appendChild(createOverlay());

        bridgeAvailable = !!(bridge());
        if (!bridgeAvailable) {
            // SSE mode — connect to sidecar's CDP screencast proxy
            console.log('[TradeCanvas] No Electron bridge — using SSE screencast proxy');
            startSSE();
        } else {
            wireInput();
            bridge().onFrame(function (event, frame) {
                if (frame && frame.data) {
                    // First frame ⇒ bridge is connected ⇒ viewport query
                    // will succeed (kills the click gap if init ran early).
                    if (!_viewportSynced) syncViewport();
                    drawFrame(frame.data);
                }
            });
        }

        showOverlay('Connecting to TradingView...');
        startWatchdog();
        console.log('[TradeCanvas] Initialized — awaiting first frame');
    }

    // ==================== STATUS ACCESSORS ====================
    function getFrameCount() {
        return frameCount;
    }

    // Live = we've drawn at least one frame AND the stream is fresh.
    function isLive() {
        return frameCount > 0 && (Date.now() - lastFrameTime < CONNECTION_TIMEOUT);
    }

    // ==================== PUBLIC API ====================
    window.TradeCanvas = Object.freeze({
        init,           // Initialize with a container element
        drawFrame,      // Draw a base64 JPEG frame
        navigateToPair, // Navigate to a pair's chart
        getFrameCount,  // Return frames drawn
        isLive,         // Return whether receiving frames
        // Convenience extras (non-breaking):
        navigate,       // Navigate to an arbitrary URL
        screenshot,     // Capture a screenshot via the bridge
    });
})();
