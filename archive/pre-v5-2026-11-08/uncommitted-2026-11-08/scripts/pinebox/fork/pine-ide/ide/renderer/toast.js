/* =================================================================
   PLUTUS DASHBOARD — TOAST NOTIFICATIONS
   Lightweight global toast system. Exposes window.showToast.
   No dependencies. Styles injected once on first use.
   ================================================================= */

(function () {
    'use strict';

    function showToast(message, type, duration) {
        type = type || 'info';
        duration = duration || 4000;

        const toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
        toast.textContent = message;

        // Inject styles once
        if (!document.getElementById('toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
        .toast { position: fixed; bottom: 20px; right: 20px; padding: 12px 20px; border-radius: 8px;
          font-family: var(--font-mono, monospace); font-size: 12px; z-index: 10000;
          animation: toast-in 0.3s ease; max-width: 400px; }
        .toast-info { background: var(--bg-panel-elevated, #101621); border: 1px solid var(--border-base, #1a2332); color: var(--text-primary, #e6f1ff); }
        .toast-error { background: rgba(255,56,96,0.1); border: 1px solid rgba(255,56,96,0.3); color: var(--accent-red, #ff3860); }
        .toast-success { background: rgba(0,255,136,0.1); border: 1px solid rgba(0,255,136,0.3); color: var(--accent-green, #00ff88); }
        @keyframes toast-in { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    window.showToast = showToast;
})();
