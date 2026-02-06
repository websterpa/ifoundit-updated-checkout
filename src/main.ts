
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

// DOM Elements
const form = document.getElementById('checkout-form') as HTMLFormElement;
const tagTypesGrid = document.getElementById('tag-types-grid')!;
const currentSelectionCounter = document.getElementById('current-selection-count')!;
const maxCapacityCounter = document.getElementById('max-capacity-count')!;
const summaryTagItems = document.getElementById('summary-tag-items')!;
const summaryCredits = document.getElementById('summary-credits')!;
const summaryBoltOnItems = document.getElementById('summary-bolt-on-items')!;
const summaryBasePlan = document.getElementById('summary-base-plan-cost')!;
const summaryTagsSubtotal = document.getElementById('summary-tags-subtotal')!;
const summaryAddons = document.getElementById('summary-addons-cost')!;
const summaryTotal = document.getElementById('summary-total')!;
const stickyTotal = document.getElementById('sticky-total')!;
const ctaButton = document.getElementById('cta-button') as HTMLButtonElement;

// Format currency
const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`;

// Render Tag Types Grid
function renderTagTypes() {
  const { totalSelectedQuantity } = calculateTotal(state);
  const isAtCapacity = totalSelectedQuantity >= state.tagCapacity;

  tagTypesGrid.innerHTML = PRICING.TAG_TYPES.map(tag => {
    const qty = state.selectedTags[tag.id] || 0;
    const canIncrement = !isAtCapacity;
    const canDecrement = qty > 0;

    return `
      <div class="tag-card ${isAtCapacity ? 'at-capacity' : ''} ${qty > 0 ? 'has-qty' : ''}" data-id="${tag.id}">
        <div class="tag-info">
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
      }

      updateUI();
    });
  });
}

// Update UI based on state
function updateUI() {
  const { basePlanCost, rawTagsCost, tagItems, freeTagCredit, boltOnItems, addOnsCost, total, totalSelectedQuantity } = calculateTotal(state);

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

  // Update Summary Credits
  summaryCredits.innerHTML = freeTagCredit > 0 ? `
    <div class="summary-item credit">
      <span>Free Tag Credit</span>
      <span>-${formatCurrency(freeTagCredit)}</span>
    </div>
  ` : '';

  // Update Summary Bolt-ons
  summaryBoltOnItems.innerHTML = boltOnItems.map(item => `
    <div class="summary-item">
      <span>${item.name}</span>
      <span>${formatCurrency(item.price)}</span>
    </div>
  `).join('');

  summaryBasePlan.textContent = formatCurrency(basePlanCost);
  summaryTagsSubtotal.textContent = formatCurrency(rawTagsCost - freeTagCredit);
  summaryAddons.textContent = formatCurrency(addOnsCost);

  const formattedTotal = formatCurrency(total);
  summaryTotal.textContent = formattedTotal;
  stickyTotal.textContent = formattedTotal;

  // Validation: User must not proceed if X < 1 or X > Y
  const isValid = totalSelectedQuantity >= 1 && totalSelectedQuantity <= state.tagCapacity;
  ctaButton.disabled = !isValid;

  if (!isValid) {
    ctaButton.title = totalSelectedQuantity < 1 ? 'Please select at least one tag' : 'Selected tags exceed capacity';
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
      state.tagCapacity = value as TagCapacity;
      // When capacity changes, we might need to reset tags if they exceed new capacity?
      // For now, keep them but updateUI will block checkout.
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

  ctaButton.addEventListener('click', () => {
    if (ctaButton.disabled) return;

    // Mock processing state
    const originalText = ctaButton.textContent;
    ctaButton.innerHTML = 'Processing... <div class="btn-shine"></div>';
    ctaButton.style.opacity = '0.7';
    ctaButton.setAttribute('disabled', 'true');

    setTimeout(() => {
      alert(`Order processed for ${formatCurrency(calculateTotal(state).total)}!\nThank you for choosing iFoundIt.`);
      ctaButton.textContent = originalText;
      ctaButton.style.opacity = '1';
      ctaButton.removeAttribute('disabled');
      updateUI(); // Reset state or just refresh UI
    }, 1500);
  });

  updateUI();
}

init();
