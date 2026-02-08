
declare const __APP_ENV__: string;

/**
 * Renders a visual environment badge for non-production environments.
 */
export function injectEnvironmentBadge() {
    // Determine Environment
    const env = (__APP_ENV__ || 'development').toLowerCase();

    // Do not show in production
    if (env === 'production') return;

    // Badge Config
    const badge = document.createElement('div');
    badge.id = 'env-badge';
    badge.innerText = env.toUpperCase();

    // Style
    Object.assign(badge.style, {
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        padding: '4px 8px',
        fontSize: '11px',
        fontWeight: 'bold',
        color: '#fff',
        borderRadius: '4px',
        zIndex: '99999',
        pointerEvents: 'none',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        fontFamily: 'system-ui, sans-serif'
    });

    // Color Coding
    if (env === 'staging') {
        badge.style.backgroundColor = '#f59e0b'; // Amber
    } else {
        badge.style.backgroundColor = '#10b981'; // Emerald (Development)
    }

    document.body.appendChild(badge);
}
