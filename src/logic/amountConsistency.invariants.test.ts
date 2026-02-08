
import { describe, it, expect } from 'vitest';
import { PRICING, calculateTotal, type CartState, INITIAL_STATE, type TagCapacity } from './pricing';

// Simulate main.ts Stripe Item Construction Logic
// We must replicate the logic used in main.ts to build payloadItems
// to ensure the TOTALS match.
const buildStripePayloadItems = (state: CartState) => {
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

    // Reconstruct tag items with metadata logic from main.ts
    const effectiveSelectedTags = { ...state.selectedTags };
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

    return payloadItems;
};

// Helper to calculate total from Stripe items (in pence ideally, but data is floats)
// The prompt says "Sum Stripe amounts in minor units (pence)"
// But our inputs are floats (e.g. 3.99).
// We should strictly sum them and handle precision.
const calculateStripeTotal = (items: { amount: number, quantity: number }[]) => {
    const total = items.reduce((acc, item) => acc + (item.amount * item.quantity), 0);
    // Mimic the float handling in pricing.ts: parseFloat(total.toFixed(2))
    return parseFloat(total.toFixed(2));
};

describe('Amount Consistency Invariants', () => {

    const createCartState = (overrides: Partial<CartState>): CartState => ({
        ...INITIAL_STATE,
        selectedTags: {},
        ...overrides
    });

    it('Invariant 1: Capacity 1 (1 Halo, No Bolt-ons)', () => {
        const state = createCartState({ tagCapacity: 1, selectedTags: { halo: 1 } });

        const uiResult = calculateTotal(state);
        const stripeItems = buildStripePayloadItems(state);
        const stripeTotal = calculateStripeTotal(stripeItems);

        expect(uiResult.total).toBe(stripeTotal);
        expect(uiResult.basePlanCost).toBe(0);

        // Minor unit check (x100)
        expect(Math.round(uiResult.total * 100)).toBe(Math.round(stripeTotal * 100));
    });

    it('Invariant 2: Capacity 1 (Multiple tags, Bolt-ons)', () => {
        // Note: Capacity 1 shouldn't ostensibly have multiple tags if limit is 1,
        // but logic permits calculating cost even if invalid?
        // Actually main.ts guards checkout if invalid.
        // But let's assume valid case: 1 Halo tag (limit 1) + Bolt Ons.
        const state = createCartState({
            tagCapacity: 1,
            selectedTags: { halo: 1 },
            finderRewards: 1, // £2.99
            returnCredits: 1  // £3.99
        });

        const uiResult = calculateTotal(state);
        const stripeItems = buildStripePayloadItems(state);
        const stripeTotal = calculateStripeTotal(stripeItems);

        expect(uiResult.total).toBe(stripeTotal);
        expect(uiResult.basePlanCost).toBe(0);
    });

    it('Invariant 3: Capacity 3 (Mixed tags)', () => {
        const state = createCartState({
            tagCapacity: 3,
            selectedTags: { halo: 1, orbit: 1, pulse: 1 }
        });

        const uiResult = calculateTotal(state);
        const stripeItems = buildStripePayloadItems(state);
        const stripeTotal = calculateStripeTotal(stripeItems);

        expect(uiResult.total).toBe(stripeTotal);
        expect(uiResult.basePlanCost).toBeGreaterThan(0);

        // Ensure base plan IS included in Stripe items
        const basePlanItem = stripeItems.find(i => i.name.includes('Capacity Plan'));
        expect(basePlanItem).toBeDefined();
        expect(basePlanItem?.amount).toBe(PRICING.TAGS[3]);
    });

    it('Invariant 4: Capacity 10 (Mixed tags + Bolt-ons)', () => {
        const state = createCartState({
            tagCapacity: 10,
            selectedTags: { halo: 5, roam: 2 },
            extraContacts: 1
        });

        const uiResult = calculateTotal(state);
        const stripeItems = buildStripePayloadItems(state);
        const stripeTotal = calculateStripeTotal(stripeItems);

        expect(uiResult.total).toBe(stripeTotal);
    });

    it('Invariant 5: Capacity 20 (Full load)', () => {
        const state = createCartState({
            tagCapacity: 20,
            selectedTags: { halo: 10, echo: 5, roam: 5 },
            finderRewards: 2,
            returnCredits: 3,
            extraContacts: 2
        });

        const uiResult = calculateTotal(state);
        const stripeItems = buildStripePayloadItems(state);
        const stripeTotal = calculateStripeTotal(stripeItems);

        expect(uiResult.total).toBe(stripeTotal);
    });

    it('Invariant 6: Implicit Halo Handling', () => {
        // Tag Capacity 1, No explicit selection -> Should default to 1 Halo
        const state = createCartState({ tagCapacity: 1, selectedTags: {} });

        const uiResult = calculateTotal(state);
        const stripeItems = buildStripePayloadItems(state);
        const stripeTotal = calculateStripeTotal(stripeItems);

        expect(uiResult.total).toBe(stripeTotal);

        // Verify Stripe has the Halo item
        const haloItem = stripeItems.find(i => i.name === 'iFoundIt - Halo');
        expect(haloItem).toBeDefined();
        expect(haloItem?.quantity).toBe(1);
    });
});
