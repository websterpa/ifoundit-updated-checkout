
import { describe, it, expect } from 'vitest';
import { calculateTotal, INITIAL_STATE, type CartState } from './pricing';

describe('Pricing Engine', () => {
    it('should calculate cost for implicit Halo tag', () => {
        // Initial state capacity is 1. We must select 1 tag for valid state.
        // Base Cost (1): 0.00
        // Tag Cost (1 x 3.99): 3.99
        // Total: 3.99
        const state: CartState = {
            ...INITIAL_STATE,
            selectedTags: { 'halo': 1 }
        };
        const result = calculateTotal(state);
        expect(result.total).toBe(3.99);
        expect(result.rawTagsCost).toBe(3.99);
        expect(result.addOnsCost).toBe(0);
    });

    it('should implicitly select Halo tag when capacity is 1 and no tags selected', () => {
        const state: CartState = {
            ...INITIAL_STATE,
            tagCapacity: 1,
            selectedTags: {} // Empty
        };
        const result = calculateTotal(state);
        expect(result.total).toBe(3.99);
        expect(result.rawTagsCost).toBe(3.99); // Halo price
        expect(result.totalSelectedQuantity).toBe(1);
        expect(result.tagItems[0].name).toContain('Halo');
    });

    it('should calculate cost for 3 tags', () => {
        // Capacity 3
        // Base Cost: 0.99
        // Select 3 Halo tags (3 * 3.99 = 11.97)
        // Total = 0.99 + 11.97 = 12.96
        const state: CartState = {
            ...INITIAL_STATE,
            tagCapacity: 3,
            selectedTags: { 'halo': 3 }
        };
        const result = calculateTotal(state);
        expect(result.rawTagsCost).toBe(11.97);
        expect(result.total).toBe(12.96);
        expect(result.totalSelectedQuantity).toBe(3);
    });

    it('should sum tags and bolt-ons correctly', () => {
        // Capacity 10
        // Base Cost: 1.99
        // Select 10 Halo tags (10 * 3.99 = 39.90)
        // Extra Contacts: 1 (0.99)
        // Total = 1.99 + 39.90 + 0.99 = 42.88
        const state: CartState = {
            ...INITIAL_STATE,
            tagCapacity: 10,
            extraContacts: 1,
            selectedTags: { 'halo': 10 }
        };
        const result = calculateTotal(state);
        expect(result.rawTagsCost).toBe(39.90);
        expect(result.addOnsCost).toBe(0.99);
        expect(result.total).toBe(42.88);
        expect(result.totalSelectedQuantity).toBe(10);
    });

    it('should handle max config', () => {
        // Capacity 20
        // Base Cost: 3.99
        // Select 20 Halo tags (20 * 3.99 = 79.80)
        // Finder Rewards: 2 (3.99)
        // Return Credits: 3 (6.99)
        // Extra Contacts: 2 (1.99)
        // Addons Total = 3.99 + 6.99 + 1.99 = 12.97
        // Grand Total = 3.99 + 79.80 + 12.97 = 96.76
        const state: CartState = {
            tagCapacity: 20,
            finderRewards: 2,
            returnCredits: 3,
            extraContacts: 2,
            selectedTags: { 'halo': 20 }
        };
        const result = calculateTotal(state);
        expect(result.rawTagsCost).toBe(79.80);
        expect(result.addOnsCost).toBe(12.97);
        expect(result.total).toBe(96.76);
        expect(result.totalSelectedQuantity).toBe(20);
    });
});
