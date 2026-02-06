
import { describe, it, expect } from 'vitest';
import { calculateTotal, INITIAL_STATE, type CartState } from './pricing';

describe('Pricing Engine', () => {
    it('should calculate £0.00 for initial state', () => {
        const result = calculateTotal(INITIAL_STATE);
        expect(result.total).toBe(0);
        expect(result.tagsCost).toBe(0);
        expect(result.addOnsCost).toBe(0);
    });

    it('should calculate cost for 3 tags', () => {
        const state: CartState = {
            ...INITIAL_STATE,
            tagCapacity: 3
        };
        const result = calculateTotal(state);
        expect(result.tagsCost).toBe(0.99);
        expect(result.total).toBe(0.99);
    });

    it('should sum tags and bolt-ons correctly', () => {
        // 10 tags (£1.99) + 1 Contact (£0.99)
        const state: CartState = {
            ...INITIAL_STATE,
            tagCapacity: 10,
            extraContacts: 1
        };
        const result = calculateTotal(state);
        expect(result.tagsCost).toBe(1.99);
        expect(result.addOnsCost).toBe(0.99);
        expect(result.total).toBe(2.98); // 1.99 + 0.99
    });

    it('should handle max config', () => {
        // 20 tags (£3.99) + 2 Finder Rewards (£3.99) + 3 Returns (£6.99) + 2 Contacts (£1.99)
        const state: CartState = {
            tagCapacity: 20,
            finderRewards: 2,
            returnCredits: 3,
            extraContacts: 2
        };
        const result = calculateTotal(state);
        expect(result.tagsCost).toBe(3.99);
        // 3.99 + 6.99 + 1.99 = 12.97
        expect(result.addOnsCost).toBe(12.97);
        expect(result.total).toBe(16.96);
    });
});
