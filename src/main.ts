import './style.css';
import './accordion.css';
import './accordion-enhancements.css';
import './desktop.css';
import './loading.css';
import { LoadingState } from './loading';
import {
  INITIAL_STATE,
  calculateTotal,
  PRICING,
  CAPACITY_CONFIG,
  type CartState,
  type TagCapacity,
  type FinderRewardTier,
  type ReturnCreditTier,
  type ContactTier
} from './logic/pricing';
import { trackEvent } from './analytics';
import { EVENTS } from './analytics.contract';
import { UX_COPY } from './copy';
import { debounce } from './debounce';
import { isCheckoutEnabled, disableCheckoutUI } from './killswitch';
import { initGlobalErrorBoundary } from './error-boundary';
import { injectBuildMetadata } from './metadata';
import { injectEnvironmentBadge } from './env-badge';
import { renderPaymentErrorState, renderStripeCancelState } from './error-states';

// --- State ---
let state: CartState = { ...INITIAL_STATE };
let currentStep = 1;

// --- DOM Elements ---
const tagTypesGrid = document.getElementById('tag-types-grid');
const currentSelectionCounter = document.getElementById('current-selection-count');
const maxCapacityCounter = document.getElementById('max-capacity-count');
const stickyTotal = document.getElementById('sticky-total');
const ctaButton = document.getElementById('cta-button') as HTMLButtonElement | null;

// --- Helpers ---
const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`;

// --- Core Logic ---

// Render Tag Types Grid
function renderTagTypes() {
  if (!tagTypesGrid) return;

  // Determine effective selections for UI (mirroring pricing logic)
  let effectiveSelectedTags = { ...state.selectedTags };
  const hasSelections = Object.values(state.selectedTags).some(qty => qty > 0);
  if (!hasSelections) {
    effectiveSelectedTags['halo'] = 1;
  }

  // Recalculate total quantity for the effective set
  const effectiveTotalQty = Object.values(effectiveSelectedTags).reduce((a, b) => a + b, 0);
  const isAtCapacity = effectiveTotalQty >= state.tagCapacity;

  tagTypesGrid.innerHTML = PRICING.TAG_TYPES.map(tag => {
    const qty = effectiveSelectedTags[tag.id] || 0;
    const canIncrement = !isAtCapacity;

    // Lock decrement if this is the last Halo tag and it's the only Thing selected
    const isMandatoryHalo = tag.id === 'halo' && effectiveTotalQty === 1 && qty === 1;
    const canDecrement = qty > 0 && !isMandatoryHalo;

    // Added visual cue for selected state
    const selectionFeedback = qty > 0 ? '<span class="selection-feedback">Added to your order</span>' : '';

    return `
      <div class="tag-card ${isAtCapacity ? 'at-capacity' : ''} ${qty > 0 ? 'has-qty' : ''}" data-id="${tag.id}">
        <div class="tag-info">
          <h3>${tag.name}</h3>
          <p>${tag.descriptor}</p>
          ${selectionFeedback}
        </div>

        <div class="tag-price-row">
          <span class="tag-unit-price">${formatCurrency(tag.price)}</span>
          <div class="qty-selector">
            <button type="button" class="qty-btn decrement" ${!canDecrement ? 'disabled' : ''} data-id="${tag.id}">-</button>
            <span class="qty-value">${qty}</span>
            <button type="button" class="qty-btn increment" ${!canIncrement ? 'disabled' : ''} data-id="${tag.id}">+</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Upgrade Reassurance Note
  if (state.tagCapacity === 1) {
    tagTypesGrid.innerHTML += `
      <div style="grid-column: 1 / -1; margin-top: 16px; font-size: 0.85rem; color: #666; text-align: center; font-style: italic;">
        ${UX_COPY.UPGRADE_REASSURANCE}
      </div>
    `;
  }

  // Empty state reassurance: "At least one tag is required to continue."
  // We can show this if totalQty is very low or just as a static hint?
  // The spec says "Empty state reassurance: 'At least one tag is required to continue.'"
  // This implies if they somehow have 0 tags (which strict logic mostly prevents, but good to show).
  // Or just always visible as a footer in the grid?
  // I will add it if they are at 0 (or close) or just as a general note.
  // Actually, we enforce 1 tag (Halo) by default. 
  // Let's add it if 0 tags are technically selected (though logic overrides).
  // Or just append it as a helpful note if they try to go below 1.
  // I'll add it as a static footer in the grid for clarity.
  tagTypesGrid.innerHTML += `
      <div style="grid-column: 1 / -1; margin-top: 8px; font-size: 0.85rem; color: #666; text-align: center;">
        At least one tag is required to continue.
      </div>
    `;

  // Add event listeners to buttons
  tagTypesGrid.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation(); // prevent accordion toggle if it bubbles
      const target = e.target as HTMLElement;
      // Handle click on icon inside button just in case, though styling usually prevents
      const btnEl = target.closest('.qty-btn') as HTMLElement;
      if (!btnEl) return;

      const id = btnEl.dataset.id!;
      const isIncrement = btnEl.classList.contains('increment');

      const currentQty = state.selectedTags[id] || 0;
      const { totalSelectedQuantity } = calculateTotal(state);
      const isAtCapacity = totalSelectedQuantity >= state.tagCapacity;

      const newTags = { ...state.selectedTags };

      if (isIncrement && !isAtCapacity) {
        newTags[id] = currentQty + 1;
        updateState({ selectedTags: newTags });
      } else if (!isIncrement && currentQty > 0) {
        newTags[id] = currentQty - 1;
        updateState({ selectedTags: newTags });
      }
    });
  });
}

function renderCapacityOptions() {
  const container = document.getElementById('capacity-options-container');
  if (!container) return;

  const options = [1, 3, 10, 20];

  container.innerHTML = options.map(val => {
    const config = CAPACITY_CONFIG[val];
    const isChecked = state.tagCapacity === val ? 'checked' : '';

    let labelText = config.label;
    let helperText = "Upgrade anytime. No long-term commitment.";

    if (val === 1) {
      labelText = "Essential Plan — included at no cost";
      helperText = ""; // Or "Included" if we want to confirm, but spec says "For paid options: Upgrade anytime"
    }

    // Spec: "For paid options: 'Upgrade anytime. No long-term commitment.'"
    // Spec: "For free option: 'Essential Plan — included at no cost'"

    return `
          <label class="radio-label">
            <input type="radio" name="tagCapacity" value="${val}" ${isChecked}>
            <div style="flex:1">
                <span style="font-weight:600; display:block;">${labelText}</span>
                <span class="microcopy-helper">${helperText}</span>
            </div>
            <span class="price-tag">${config.price > 0 ? formatCurrency(config.price) + ' / yr' : 'Included'}</span>
          </label>
      `;
  }).join('');

  container.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', handleChange);
  });
}

function renderAddons() {
  const container = document.getElementById('addons-container');
  if (!container) return;

  // Toggle microcopy logic implemented inline below

  container.innerHTML = `
      <section class="card" style="border:none; box-shadow:none; background:transparent; padding:0;">
          <h3 style="font-size:1rem; margin-bottom:8px;">Finder Rewards</h3>
          <fieldset style="display:flex; flex-direction:column; gap:8px;">
              <label class="radio-label">
                  <input type="radio" name="finderRewards" value="0" ${state.finderRewards === 0 ? 'checked' : ''}>
                  <div style="flex:1">
                    <span>None</span>
                    <span class="microcopy-helper">${state.finderRewards === 0 ? 'Not added' : ''}</span>
                  </div>
              </label>
              <label class="radio-label">
                  <input type="radio" name="finderRewards" value="1" ${state.finderRewards === 1 ? 'checked' : ''}>
                  <div style="flex:1">
                    <span>1 × £20 credit</span>
                    <span class="microcopy-helper selection-feedback">${state.finderRewards === 1 ? 'Added to your order' : ''}</span>
                  </div>
                  <span class="price-tag">£2.99</span>
              </label>
          </fieldset>
      </section>

      <section class="card" style="border:none; box-shadow:none; background:transparent; padding:0;">
          <h3 style="font-size:1rem; margin-bottom:8px;">Return Credits</h3>
           <fieldset style="display:flex; flex-direction:column; gap:8px;">
              <label class="radio-label">
                  <input type="radio" name="returnCredits" value="0" ${state.returnCredits === 0 ? 'checked' : ''}>
                   <div style="flex:1">
                    <span>None</span>
                    <span class="microcopy-helper">${state.returnCredits === 0 ? 'Not added' : ''}</span>
                  </div>
              </label>
              <label class="radio-label">
                  <input type="radio" name="returnCredits" value="1" ${state.returnCredits === 1 ? 'checked' : ''}>
                  <div style="flex:1">
                    <span>1 × return</span>
                    <span class="microcopy-helper selection-feedback">${state.returnCredits === 1 ? 'Added to your order' : ''}</span>
                  </div>
                  <span class="price-tag">£3.99</span>
              </label>
          </fieldset>
      </section>
  `;

  container.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', handleChange);
  });
}

function renderReview() {
  const containerMobile = document.getElementById('final-review-content-mobile'); // Renamed ID in HTML
  // Fallback for previous ID if replaced or if mobile view uses it
  const containerOld = document.getElementById('final-review-content');
  const containerDesktop = document.getElementById('desktop-summary-content');

  const { total, tagItems } = calculateTotal(state);

  const itemsHtml = tagItems.map(i => `
      <div class="review-row">
          <span>${i.quantity} × ${i.name}</span>
          <span>${formatCurrency(i.quantity * i.price)}</span>
      </div>
  `).join('');

  const capacityRow = `
      <div class="review-row">
          <span>Capacity Plan (${state.tagCapacity})</span>
          <span>${calculateTotal(state).basePlanCost > 0 ? formatCurrency(calculateTotal(state).basePlanCost) : 'Included'}</span>
      </div>
  `;

  const content = `
      ${capacityRow}
      ${itemsHtml}
  `;

  // Update all instances
  if (containerMobile) {
    containerMobile.innerHTML = content + `
        <div class="review-row">
          <span>Total to Pay</span>
          <span>${formatCurrency(total)}</span>
        </div>
      `;
  }
  if (containerOld) { // legacy support if ID wasn't updated in DOM yet
    containerOld.innerHTML = content + `
        <div class="review-row">
          <span>Total to Pay</span>
          <span>${formatCurrency(total)}</span>
        </div>
      `;
  }

  if (containerDesktop) {
    containerDesktop.innerHTML = content;
    // Desktop total is separate
    const desktopTotalEl = document.getElementById('desktop-sticky-total');
    if (desktopTotalEl) {
      desktopTotalEl.textContent = formatCurrency(total);
    }
  }
}


function updateUI() {
  if (!ctaButton) return;
  const { total, totalSelectedQuantity } = calculateTotal(state);

  // Update counters if they exist
  if (currentSelectionCounter) currentSelectionCounter.textContent = totalSelectedQuantity.toString();
  if (maxCapacityCounter) maxCapacityCounter.textContent = state.tagCapacity.toString();

  // Sticky Total (Mobile)
  if (stickyTotal) {
    const prevTotal = stickyTotal.textContent;
    const newTotal = formatCurrency(total);
    if (prevTotal !== newTotal) {
      stickyTotal.textContent = newTotal;
      // Trigger reflow for animation restart
      stickyTotal.classList.remove('pulse');
      void stickyTotal.offsetWidth;
      stickyTotal.classList.add('pulse');
    }
  }

  // Rerender grids
  renderTagTypes();
  renderReview(); // Updates both mobile and desktop summaries

  // Button State Validation
  const isValid = totalSelectedQuantity >= 1 && totalSelectedQuantity <= state.tagCapacity;

  if (!isValid) {
    ctaButton.disabled = true;
    ctaButton.style.opacity = '0.5';
    // 1. No Tag Selected (Step 1) Tooltip
    // Spec: "Select a tag to continue"
    ctaButton.title = 'Select a tag to continue';
  } else {
    ctaButton.disabled = false;
    ctaButton.style.opacity = '1';
  }

  updateCTA();
}


// --- Logic/Update Handling ---

const debouncedUpdateUI = debounce(() => {
  updateUI();
}, 75);

function updateState(updates: Partial<CartState>) {
  // 1. Apply updates (Synchronous)
  state = { ...state, ...updates };

  // 2. Enforce logic rules (Synchronous)
  const hasSelections = Object.values(state.selectedTags).some(qty => qty > 0);

  // Transition: 1 -> >1 with no explicit selections -> Force Halo 1
  if (state.tagCapacity > 1 && updates.tagCapacity && !hasSelections) {
    state.selectedTags = { 'halo': 1 };
  }

  // Rule: Auto-Reinsertion (Downgrade to 0 selections -> Force Halo 1)
  const totalQty = Object.values(state.selectedTags).reduce((a, b) => a + b, 0);
  if (totalQty === 0) {
    state.selectedTags = { 'halo': 1 };
  }

  // 3. Update UI (Debounced)
  debouncedUpdateUI();
}

function handleChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target || target.type !== 'radio') return;

  const value = parseInt(target.value, 10);
  const name = target.name;

  if (name === 'tagCapacity') {
    updateState({ tagCapacity: value as TagCapacity });
    // If capacity changes, we might need to re-render capacity options to update check state visually immediately?
    // updateUI calls renderTagTypes but NOT renderCapacityOptions/renderAddons implicitly every time?
    // Actually renderCapacityOptions is called on step activation.
    // We should probably rely on the radio button's native change first, but if state logic overrides it...
    // Let's assume native UI feedback is fine for now.
  } else if (name === 'finderRewards') {
    updateState({ finderRewards: value as FinderRewardTier });
  } else if (name === 'returnCredits') {
    updateState({ returnCredits: value as ReturnCreditTier });
  } else if (name === 'extraContacts') {
    updateState({ extraContacts: value as ContactTier });
  }
}

// --- Accordion Logic ---

// Expose toggle to window
(window as any).accordion = {
  toggle: (stepId: number) => {
    if (stepId < currentStep) {
      activateStep(stepId);
    }
  }
};

function activateStep(step: number) {
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`step-${i}`);
    if (!el) continue;

    if (i === step) {
      el.classList.add('active');
      el.classList.remove('locked', 'completed');
    } else if (i < step) {
      el.classList.add('completed');
      el.classList.remove('active', 'locked');
    } else {
      el.classList.add('locked');
      el.classList.remove('active', 'completed');
    }
  }

  currentStep = step;
  updateCTA();

  // Lazy refresh of step content
  if (step === 2) renderCapacityOptions();
  if (step === 3) renderAddons();
}

function updateCTA() {
  if (!ctaButton) return;
  const { total } = calculateTotal(state);

  if (currentStep === 1) {
    ctaButton.textContent = 'Continue to Capacity';
  } else if (currentStep === 2) {
    ctaButton.textContent = 'Continue to Add-ons';
  } else if (currentStep === 3) {
    ctaButton.textContent = 'Continue to Payment';
  } else if (currentStep === 4) {
    ctaButton.textContent = `Complete Order & Pay ${formatCurrency(total)}`;
  }
}

async function handleCTAClick() {
  const { totalSelectedQuantity } = calculateTotal(state);
  const isValid = totalSelectedQuantity >= 1 && totalSelectedQuantity <= state.tagCapacity;

  if (!isValid) return;

  if (currentStep < 4) {
    activateStep(currentStep + 1);
  } else {
    await handleSubmit();
  }
}


async function handleSubmit() {
  if (!ctaButton) return;
  // 4. Network Delay / Waiting State: "Preparing secure payment…" with spinner
  ctaButton.innerHTML = 'Preparing secure payment… <div class="spinner" style="width:20px;height:20px;display:inline-block;vertical-align:middle;border-color:white;border-top-color:transparent;margin-left:8px;"></div>';
  ctaButton.disabled = true;

  try {
    const { basePlanCost, boltOnItems } = calculateTotal(state);
    const payloadItems: any[] = [];

    // Items
    if (basePlanCost > 0) {
      payloadItems.push({ name: `Capacity Plan: Up to ${state.tagCapacity}`, amount: basePlanCost, quantity: 1 });
    }

    const effectiveSelectedTags = { ...state.selectedTags };
    const hasSelections = Object.values(state.selectedTags).some(qty => qty > 0);
    if (!hasSelections) effectiveSelectedTags['halo'] = 1;

    PRICING.TAG_TYPES.forEach(tag => {
      const qty = effectiveSelectedTags[tag.id] || 0;
      if (qty > 0) {
        payloadItems.push({ name: tag.name, description: tag.descriptor, amount: tag.price, quantity: qty });
      }
    });

    boltOnItems.forEach(b => payloadItems.push({ name: b.name, amount: b.price, quantity: 1 }));

    LoadingState.set('stripe-checkout', true);

    // Append ?canceled=true to cancelUrl for state detection on return
    const cancelUrl = new URL(window.location.href);
    cancelUrl.searchParams.set('canceled', 'true');

    const response = await fetch('/.netlify/functions/create-checkout', {
      method: 'POST',
      body: JSON.stringify({
        items: payloadItems,
        metadata: { tagCapacity: String(state.tagCapacity), selectedTags: JSON.stringify(state.selectedTags) },
        successUrl: window.location.origin + '/confirmation.html',
        cancelUrl: cancelUrl.toString()
      })
    });

    if (response.status === 503) {
      disableCheckoutUI();
      LoadingState.set('stripe-checkout', false);
      return;
    }

    const { sessionId, error } = await response.json();

    if (error) throw new Error(error);

    const stripeModule = await import('@stripe/stripe-js');
    const stripe = await stripeModule.loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
    // Fix TS error by assuming Stripe type generic or specific
    if (stripe) await (stripe as any).redirectToCheckout({ sessionId });

  } catch (e: any) {
    console.error(e);
    // 3. Payment Redirect Failure (Pre-Stripe)
    // Replace Step 4 content with calm message
    renderPaymentErrorState();

    ctaButton.textContent = "Retry Payment";
    ctaButton.disabled = false;
    LoadingState.set('stripe-checkout', false);
  }
}

// --- Init ---

function init() {
  initGlobalErrorBoundary();
  injectBuildMetadata();
  injectEnvironmentBadge();

  // Check Implicit State
  if (Object.keys(state.selectedTags).length === 0) {
    trackEvent(EVENTS.FREE_HALO_IMPLICIT_APPLIED, {
      capacity: state.tagCapacity,
      tagType: 'halo'
    });
  }

  if (!isCheckoutEnabled()) {
    disableCheckoutUI();
    return;
  }

  // 5. Return From Stripe — Failure Check
  const urlParams = new URL(window.location.href).searchParams;
  if (urlParams.get('canceled') === 'true') {
    renderStripeCancelState();
    return; // Stop normal init
  }

  if (ctaButton) {
    ctaButton.addEventListener('click', handleCTAClick);
  }

  // Initial Renders
  renderTagTypes();
  renderCapacityOptions();
  renderAddons();
  renderReview();

  updateUI();
}

// Start
init();
