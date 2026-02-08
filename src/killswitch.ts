import { isFeatureEnabled } from './flags';

/**
 * Checks if checkout entry is permitted via build-time flag.
 * Used to disable the UI before any interaction occurs.
 */
export function isCheckoutEnabled(): boolean {
    return isFeatureEnabled('CHECKOUT_ENABLED');
}

/**
 * Disables the checkout UI with a maintenance message.
 */
export function disableCheckoutUI() {
    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; padding: 20px;">
                <img src="/logo_circle.png" alt="iFoundIt" width="80" style="margin-bottom: 2rem; opacity: 0.5;">
                <h1 style="font-size: 1.5rem; margin-bottom: 1rem;">Service Temporarily Unavailable</h1>
                <p style="color: var(--text-body); max-width: 400px; line-height: 1.6;">
                    Our checkout system is currently undergoing scheduled maintenance. 
                    Please check back shortly.
                </p>
                <a href="/" class="cta-button" style="margin-top: 2rem;">Return Home</a>
            </div>
        `;
    }
}
