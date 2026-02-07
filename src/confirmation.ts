
import './style.css';
// import { UX_COPY } from './copy';

// DOM Elements
const statusHeading = document.getElementById('status-heading');
const statusMessage = document.getElementById('status-message');
const actionContainer = document.getElementById('action-container');

async function init() {
    // 1. Get Session ID from URL
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    if (!sessionId) {
        // Fallback or generic view (e.g. if user navigates directly)
        // Keep default HTML static content
        return;
    }

    // 2. Show Verification State
    if (statusHeading) statusHeading.textContent = 'Verifying Payment...';
    if (statusMessage) statusMessage.textContent = 'Please wait while we confirm your secure order.';
    if (actionContainer) actionContainer.innerHTML = '<div class="btn-shine" style="height:4px; width:100%; border-radius:2px;"></div>';

    try {
        // 3. Call Backend to Verify & Get Handoff Link
        const response = await fetch('/.netlify/functions/create-handoff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
        });

        const data = await response.json();

        if (response.ok && data.handoffUrl) {
            // 4. Success State
            if (statusHeading) statusHeading.textContent = 'Payment Successful';
            if (statusMessage) statusMessage.textContent = 'Your order is confirmed. Continue to the iFoundIt app to complete your setup.';

            if (actionContainer) {
                actionContainer.innerHTML = `
                    <a href="${data.handoffUrl}" class="cta-button primary full-width" style="text-decoration:none; display:inline-block; text-align:center;">
                        Continue to App
                    </a>
                `;
            }
        } else {
            throw new Error(data.error || 'Verification failed');
        }

    } catch (error) {
        console.error(error);

        // 5. Error State
        if (statusHeading) statusHeading.textContent = 'Something went wrong';
        if (statusMessage) statusMessage.textContent = 'We received your payment but couldn\'t automatically redirect you. Please contact support.';

        if (actionContainer) {
            actionContainer.innerHTML = `
                <button class="cta-button secondary full-width" onclick="window.location.reload()">
                    Retry Verification
                </button>
            `;
        }
    }
}

init();
