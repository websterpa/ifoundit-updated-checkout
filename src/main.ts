
import './style.css';
import {
  INITIAL_STATE,
  calculateTotal,
  PRICING,
  type CartState,
  type TagCapacity,
  type FinderRewardTier,
  type ReturnCreditTier,
  type ContactTier
} from './logic/pricing';

// Current state
let state: CartState = { ...INITIAL_STATE };

import { trackEvent } from './analytics';
import { EVENTS } from './analytics.contract';
import { UX_COPY } from './copy';

// Check initial implicit state
if (Object.keys(state.selectedTags).length === 0) {
  trackEvent(EVENTS.FREE_HALO_IMPLICIT_APPLIED, {
    capacity: state.tagCapacity,
    tagType: 'halo'
  });
}

// DOM Elements
const form = document.getElementById('checkout-form') as HTMLFormElement;
const tagTypesGrid = document.getElementById('tag-types-grid')!;
const currentSelectionCounter = document.getElementById('current-selection-count')!;
const maxCapacityCounter = document.getElementById('max-capacity-count')!;
const summaryTagItems = document.getElementById('summary-tag-items')!;

const summaryBoltOnItems = document.getElementById('summary-bolt-on-items')!;
const summaryBasePlan = document.getElementById('summary-base-plan-cost')!;
const summaryTagsSubtotal = document.getElementById('summary-tags-subtotal')!;
const summaryAddons = document.getElementById('summary-addons-cost')!;
const summaryTotal = document.getElementById('summary-total')!;
const stickyTotal = document.getElementById('sticky-total')!;
const ctaButton = document.getElementById('cta-button') as HTMLButtonElement;
const checkoutError = document.getElementById('checkout-error')!;



// Format currency
const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`;

const TAG_METADATA: Record<string, { size: string; material: string; howItWorks: string }> = {
  halo: {
    size: '29mm',
    material: 'PET plastic construction, water resistant',
    howItWorks: 'Attach the sticker to your item, and if found, anyone with a smartphone can scan it to notify you securely.'
  },
  orbit: {
    size: '30mm Diameter',
    material: 'Durable, scratch-resistant double sided epoxy',
    howItWorks: 'Attach it to your valuables, giving the person who finds your items the best chance of returning them to you.'
  },
  pulse: {
    size: '54mm x 85.6mm (Standard CR80 size)',
    material: 'High quality PVC',
    "howItWorks": 'Finders can scan the card to reach you via our secure iFoundIt reporting system, without needing to expose your personal details.'
  },
  echo: {
    size: '18mm x 50mm',
    material: 'Durable, scratch-resistant double sided epoxy',
    howItWorks: 'Attach to your keyring. If lost, anyone who finds your keys can scan the fob to securely contact you.'
  },
  trek: {
    size: '55mm x 27mm',
    material: '1mm thick, weatherproof, heavy duty PVC',
    howItWorks: 'Attach to your bag’s handle or zipper, and a simple smartphone scan allows finders to connect with you indirectly.'
  },
  roam: {
    size: '56mm x 28mm',
    material: '1.2mm thick, weatherproof, heavy duty PVC',
    howItWorks: 'Attach to your bag’s handle or zipper, and a simple smartphone scan allows finders to connect with you indirectly.'
  }
};

// Inject Copy Updates
function updateStaticCopy() {
  // Update Tag Selection Helper
  const tagHelperText = document.getElementById('tag-selection-helper-text');
  if (tagHelperText) {
    tagHelperText.textContent = UX_COPY.TAG_SELECTION_HELPER;
  }

  // Enforce Mandatory Minimum Tag Copy at Source
  // (Disabled: Static HTML is now source of truth)
  const capacityRadio1 = document.querySelector('input[name="tagCapacity"][value="1"]');
  if (capacityRadio1) {
    // Logic removed to respect static HTML "Up to 1 tag"
  }
}

// Render Tag Types Grid
function renderTagTypes() {
  // Determine effective selections for UI (mirroring pricing logic)
  let effectiveSelectedTags = { ...state.selectedTags };
  const hasSelections = Object.values(state.selectedTags).some(qty => qty > 0);
  if (!hasSelections) {
    effectiveSelectedTags['halo'] = 1;
  }

  // Recalculate total quantity for the effective set
  // (Note: calculateTotal returns this, but we want to be explicit about what the UI shows)
  const effectiveTotalQty = Object.values(effectiveSelectedTags).reduce((a, b) => a + b, 0);
  const isAtCapacity = effectiveTotalQty >= state.tagCapacity;

  tagTypesGrid.innerHTML = PRICING.TAG_TYPES.map(tag => {
    const qty = effectiveSelectedTags[tag.id] || 0;
    const canIncrement = !isAtCapacity;

    // Lock decrement if this is the last Halo tag and it's the only Thing selected
    const isMandatoryHalo = tag.id === 'halo' && effectiveTotalQty === 1 && qty === 1;
    const canDecrement = qty > 0 && !isMandatoryHalo;

    return `
      <div class="tag-card ${isAtCapacity ? 'at-capacity' : ''} ${qty > 0 ? 'has-qty' : ''}" data-id="${tag.id}">
        <div class="tag-info">
          <div class="tag-image-container">
            <img src="/assets/tag-${tag.id}.png" alt="${tag.name} Tag" class="tag-image">
            <div class="disclosure-panel">
              <h4>${tag.name}</h4>
              <p><strong>Size:</strong> ${TAG_METADATA[tag.id]?.size}</p>
              <p><strong>Material:</strong> ${TAG_METADATA[tag.id]?.material}</p>
              <p><strong>How it works:</strong> ${TAG_METADATA[tag.id]?.howItWorks}</p>
            </div>
          </div>
          <h3>${tag.name}</h3>
          <p>${tag.descriptor}</p>
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


  // Add event listeners to buttons
  tagTypesGrid.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = (e.target as HTMLElement).dataset.id!;
      const isIncrement = (e.target as HTMLElement).classList.contains('increment');

      const currentQty = state.selectedTags[id] || 0;
      const { totalSelectedQuantity } = calculateTotal(state);
      const isAtCapacity = totalSelectedQuantity >= state.tagCapacity;

      if (isIncrement && !isAtCapacity) {
        state.selectedTags[id] = currentQty + 1;
      } else if (!isIncrement && currentQty > 0) {
        state.selectedTags[id] = currentQty - 1;

        // Auto-Reinsertion Rule:
        // If we remove the last tag (total quantity becomes 0),
        // we must immediately re-insert the baseline Halo tag (qty=1).
        const remainingQty = Object.values(state.selectedTags).reduce((a, b) => a + b, 0);

        if (remainingQty === 0) {
          state.selectedTags = { 'halo': 1 };

          trackEvent(EVENTS.FREE_HALO_IMPLICIT_APPLIED, {
            capacity: state.tagCapacity,
            tagType: 'halo'
          });
        }
      }

      // Track Tag Mix Selected
      try {
        // Filter out zero quantities for cleaner analytics
        const activeTags = Object.entries(state.selectedTags)
          .filter(([_, qty]) => qty > 0)
          .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

        const totalQty = Object.values(state.selectedTags).reduce((a, b) => a + b, 0);

        if (totalQty > 0) {
          trackEvent(EVENTS.TAG_MIX_SELECTED, {
            tagTypes: Object.keys(activeTags),
            quantities: activeTags,
            totalTagCount: totalQty
          });
        }
      } catch (e) {
        // Silent fail
      }

      updateUI();
    });
  });
}

// Update UI based on state
function updateUI() {
  const { basePlanCost, rawTagsCost, tagItems, boltOnItems, addOnsCost, total, totalSelectedQuantity } = calculateTotal(state);

  // Update counters
  currentSelectionCounter.textContent = totalSelectedQuantity.toString();
  maxCapacityCounter.textContent = state.tagCapacity.toString();

  if (totalSelectedQuantity > state.tagCapacity) {
    currentSelectionCounter.parentElement?.classList.add('warning');
  } else {
    currentSelectionCounter.parentElement?.classList.remove('warning');
  }

  // Render tag types grid
  renderTagTypes();

  // Update Summary Tag Items
  summaryTagItems.innerHTML = tagItems.map(item => `
    <div class="summary-item">
      <span>${item.quantity} × ${item.name}</span>
      <span>${formatCurrency(item.quantity * item.price)}</span>
    </div>
  `).join('');





  // Update Summary Bolt-ons
  summaryBoltOnItems.innerHTML = boltOnItems.map(item => `
    <div class="summary-item">
      <span>${item.name}</span>
      <span>${formatCurrency(item.price)}</span>
    </div>
  `).join('');

  summaryBasePlan.textContent = formatCurrency(basePlanCost);
  summaryTagsSubtotal.textContent = formatCurrency(rawTagsCost);
  summaryAddons.textContent = formatCurrency(addOnsCost);

  const formattedTotal = formatCurrency(total);
  summaryTotal.textContent = formattedTotal;
  stickyTotal.textContent = formattedTotal;

  // Validation: User must not proceed if X < 1 or X > Y
  const isValid = totalSelectedQuantity >= 1 && totalSelectedQuantity <= state.tagCapacity;
  ctaButton.disabled = !isValid;

  if (!isValid) {
    ctaButton.title = totalSelectedQuantity < 1 ? 'Select at least one tag' : 'Selected tags exceed capacity';
  } else {
    ctaButton.title = '';
  }
}

// Handle changes
function handleChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target || target.type !== 'radio') return;

  const value = parseInt(target.value, 10);
  const name = target.name;

  switch (name) {
    case 'tagCapacity':
      const newCapacity = value as TagCapacity;

      // Transition Rule: 1 -> >1
      // If we are currently on Capacity 1 AND rely on implicit Halo (no explicit selections),
      // we must make that Halo explicit so the user starts with 1 Halo selected.
      const hasExplicitSelections = Object.values(state.selectedTags).some(qty => qty > 0);

      if (state.tagCapacity === 1 && newCapacity > 1 && !hasExplicitSelections) {
        state.selectedTags = { 'halo': 1 };

        trackEvent(EVENTS.FREE_TO_PAID_UPGRADE, {
          previousCapacity: 1,
          newCapacity: newCapacity,
          preservedTags: { 'halo': 1 }
        });
      }

      state.tagCapacity = newCapacity;

      // Check for Implicit Halo Applied (downgrade or change to 1 with no tags)
      // Note: If we just downgraded to 1, we might have selections, so this only fires if empty.
      const hasSelectionsAfterChange = Object.values(state.selectedTags).some(qty => qty > 0);
      if (!hasSelectionsAfterChange) {
        trackEvent(EVENTS.FREE_HALO_IMPLICIT_APPLIED, {
          capacity: state.tagCapacity,
          tagType: 'halo'
        });
      }
      break;
    case 'finderRewards':
      state.finderRewards = value as FinderRewardTier;
      break;
    case 'returnCredits':
      state.returnCredits = value as ReturnCreditTier;
      break;
    case 'extraContacts':
      state.extraContacts = value as ContactTier;
      break;
  }

  updateUI();
}

// Initialize
function init() {
  if (form) {
    form.addEventListener('change', handleChange);
  }

  updateStaticCopy();

  ctaButton.addEventListener('click', async () => {
    if (ctaButton.disabled) return;
    checkoutError.hidden = true;

    // Guardrail: Prevent £0 checkout
    const { total } = calculateTotal(state);
    if (total <= 0) {
      console.error("Attempted checkout with £0 total. At least one physical tag is required.");
      return;
    }

    // Mock processing state
    const originalText = ctaButton.textContent || 'Complete Protection';
    ctaButton.innerHTML = 'Processing... <div class="btn-shine"></div>';
    ctaButton.style.opacity = '0.7';
    ctaButton.setAttribute('disabled', 'true');

    // --- Stripe Integration ---
    try {
      // 1. Prepare items from state (using logic/pricing PRICING constant)
      const { basePlanCost, boltOnItems } = calculateTotal(state);

      const payloadItems: { name: string, description?: string, amount: number, quantity: number }[] = [];

      // Base Plan
      if (basePlanCost > 0) {
        payloadItems.push({
          name: `Capacity Plan: Up to ${state.tagCapacity}`,
          amount: basePlanCost,
          quantity: 1
        });
      }

      // Reconstruct tag items with metadata
      const effectiveSelectedTags = { ...state.selectedTags };

      // Implicit selection check (match pricing.ts)
      const hasSelections = Object.values(state.selectedTags).some(qty => qty > 0);
      if (!hasSelections) {
        effectiveSelectedTags['halo'] = 1;
      }

      PRICING.TAG_TYPES.forEach(tag => {
        const qty = effectiveSelectedTags[tag.id] || 0;
        if (qty > 0) {
          payloadItems.push({
            name: tag.name,
            description: tag.descriptor,
            amount: tag.price,
            quantity: qty
          });
        }
      });

      // Bolt-ons
      boltOnItems.forEach(b => {
        payloadItems.push({
          name: b.name,
          amount: b.price,
          quantity: 1
        });
      });

      // 2. Call Stripe Endpoint
      const response = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: payloadItems,
          metadata: {
            tagCapacity: String(state.tagCapacity),
            freeHaloApplied: String(state.tagCapacity === 1 && effectiveSelectedTags['halo'] === 1 && !hasSelections),
            selectedTags: JSON.stringify(state.selectedTags)
          },
          successUrl: window.location.origin + '/confirmation.html',
          cancelUrl: window.location.href, // Stay on page
        }),
      });

      const { sessionId, error } = await response.json();

      if (error) {
        console.error(error);
        checkoutError.textContent = "Payment init failed: " + error;
        checkoutError.hidden = false;
        if (originalText) ctaButton.textContent = originalText;
        ctaButton.style.opacity = '1';
        ctaButton.removeAttribute('disabled');
        return;
      }

      // 3. Redirect
      const stripeModule = await import('@stripe/stripe-js');
      const stripe = await stripeModule.loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

      if (stripe) {
        const result = await (stripe as any).redirectToCheckout({ sessionId });
        if (result.error) {
          checkoutError.textContent = result.error.message;
          checkoutError.hidden = false;
          if (originalText) ctaButton.textContent = originalText;
          ctaButton.style.opacity = '1';
          ctaButton.removeAttribute('disabled');
        }
      }

    } catch (e) {
      console.error(e);
      checkoutError.textContent = 'An error occurred. Please try again.';
      checkoutError.hidden = false;
      if (originalText) ctaButton.textContent = originalText;
      ctaButton.style.opacity = '1';
      ctaButton.removeAttribute('disabled');
    }
  });

  updateUI();
}

// Theme Switching
function initThemeSwitcher() {
  const themeButtons = document.querySelectorAll('.theme-btn');
  const body = document.body;

  // Load saved theme or use default
  const savedTheme = localStorage.getItem('ifoundit-theme') || 'default';
  if (savedTheme !== 'default') {
    body.setAttribute('data-theme', savedTheme);
  }

  // Update active button
  themeButtons.forEach(btn => {
    const btnTheme = (btn as HTMLElement).dataset.theme;
    if (btnTheme === savedTheme) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Handle theme button clicks
  themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = (btn as HTMLElement).dataset.theme!;

      // Update active state
      themeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Apply theme
      if (theme === 'default') {
        body.removeAttribute('data-theme');
      } else {
        body.setAttribute('data-theme', theme);
      }

      // Save to localStorage
      localStorage.setItem('ifoundit-theme', theme);
    });
  });
}

init();
initThemeSwitcher();
