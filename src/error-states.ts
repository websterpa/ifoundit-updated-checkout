
// Helper to render error states directly into the DOM

export function renderPaymentErrorState() {
    const step4Content = document.querySelector('#step-4 .step-content');
    if (!step4Content) return;

    step4Content.innerHTML = `
        <div class="payment-handoff error-state">
            <div style="margin-bottom: 24px; color: var(--text-secondary);">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin:0 auto; display:block; opacity:0.7;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            </div>
            <h3 style="margin-top:0; color:var(--text-primary);">We couldn’t start secure payment just now.</h3>
            <p style="color:var(--text-secondary);">Please try again.</p>
            <!-- Retry handled by main CTA re-enabling -->
        </div>
    `;

    // Ensure step 4 is expanded if not already
    const step4 = document.getElementById('step-4');
    if (step4 && !step4.classList.contains('active')) {
        // Force active if it was somehow closed
        step4.classList.add('active');
        step4.classList.remove('locked', 'completed');
    }
}

export function renderStripeCancelState() {
    const checkoutFlow = document.getElementById('checkout-flow');
    if (!checkoutFlow) return;

    checkoutFlow.innerHTML = `
        <div class="step-card active" style="padding: 48px; text-align: center;">
             <h2 style="font-size: 1.5rem; margin-bottom: 8px; color: var(--text-primary);">Payment not completed</h2>
             <p style="color: var(--text-secondary); margin-bottom: 32px; font-size: 1rem;">No charges were made. You can try again when ready.</p>
             
             <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
                <button id="return-checkout-btn" class="primary-btn" style="flex: 0 1 auto; min-width: 200px;">Return to checkout</button>
                <button id="contact-support-btn" style="background: transparent; border: 1px solid var(--border-light); padding: 0 24px; border-radius: 99px; font-weight: 600; color: var(--text-secondary); cursor: pointer; height: 56px;">Contact support</button>
             </div>
        </div>
     `;

    // Bind actions
    document.getElementById('return-checkout-btn')?.addEventListener('click', () => {
        // Clear param and reload or reset state
        const url = new URL(window.location.href);
        url.searchParams.delete('canceled');
        window.history.replaceState({}, '', url.toString());
        window.location.reload(); // Simplest reset
    });

    document.getElementById('contact-support-btn')?.addEventListener('click', () => {
        window.location.href = 'mailto:support@ifoundit.co.uk';
    });

    // Hide sticky footer as it's redundant/confusing in this state
    const footer = document.querySelector('.sticky-footer') as HTMLElement;
    if (footer) footer.style.display = 'none';

    // Hide desktop sidebar if present?
    const sidebar = document.querySelector('.desktop-summary') as HTMLElement;
    if (sidebar) sidebar.style.display = 'none';

    // Expand grid logic if needed for desktop? 
    const layout = document.querySelector('.layout-wrapper') as HTMLElement;
    if (layout) {
        layout.style.display = 'block'; // Reset grid to block for centered message
        layout.style.maxWidth = '600px';
        layout.style.margin = '100px auto';
    }
}
