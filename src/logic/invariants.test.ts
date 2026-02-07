
import { describe, it, expect } from 'vitest';
import { calculateTotal, INITIAL_STATE, type CartState } from './pricing';

describe('Pricing Logic Invariants', () => {

    describe('When Tag Capacity > 1', () => {
        it('should apply implicit Halo tag when selectedTags is empty', () => {
            const state: CartState = {
                ...INITIAL_STATE,
                tagCapacity: 3,
                selectedTags: {}
            };
            const result = calculateTotal(state);

            // Should apply 1 Halo implicitly
            expect(result.tagItems).toHaveLength(1);
            expect(result.tagItems[0].name).toContain('Halo');
            expect(result.totalSelectedQuantity).toBe(1);

            // Base 0.99 + Halo 3.99 = 4.98
            expect(result.total).toBe(4.98);
        });

        it('should require explicit selection for Halo', () => {
            const state: CartState = {
                ...INITIAL_STATE,
                tagCapacity: 3,
                selectedTags: { 'halo': 1 }
            };
            const result = calculateTotal(state);

            expect(result.tagItems).toHaveLength(1);
            expect(result.tagItems[0].name).toContain('Halo');
            expect(result.totalSelectedQuantity).toBe(1);

            // Base 0.99 + Halo 3.99 = 4.98
            expect(result.total).toBe(4.98);
        });
    });

    describe('When Tag Capacity === 1', () => {
        it('should implicitly apply Halo when selectedTags is empty', () => {
            const state: CartState = {
                ...INITIAL_STATE,
                tagCapacity: 1,
                selectedTags: {}
            };
            const result = calculateTotal(state);

            expect(result.tagItems).toHaveLength(1);
            expect(result.tagItems[0].name).toContain('Halo');
            expect(result.tagItems[0].quantity).toBe(1);
            expect(result.totalSelectedQuantity).toBe(1);
            expect(result.total).toBe(3.99);
        });

        it('should NOT implicitly apply Halo if another tag is selected', () => {
            // If user selects Orbit (4.99), it should be the only tag.
            // Capacity 1 (Base 0) + Tag 4.99 = 4.99.
            const state: CartState = {
                ...INITIAL_STATE,
                tagCapacity: 1,
                selectedTags: { 'orbit': 1 }
            };
            const result = calculateTotal(state);

            expect(result.tagItems).toHaveLength(1);
            expect(result.tagItems[0].name).toContain('Orbit'); // Not Halo
            expect(result.totalSelectedQuantity).toBe(1);
            expect(result.total).toBe(4.99);
        });
    });

    describe('Order Independence', () => {
        it('should calculate same total regardless of selection order', () => {
            // Capacity 10 (Base 1.99)
            // Halo (3.99) x 1
            // Orbit (4.99) x 1
            // Total = 1.99 + 3.99 + 4.99 = 10.97

            const stateA: CartState = {
                ...INITIAL_STATE,
                tagCapacity: 10,
                selectedTags: { 'halo': 1, 'orbit': 1 }
            };

            // JS object key order is generally insertion order for non-integer keys, 
            // but logic should not rely on it.
            const stateB: CartState = {
                ...INITIAL_STATE,
                tagCapacity: 10,
                selectedTags: { 'orbit': 1, 'halo': 1 }
            };

            const resultA = calculateTotal(stateA);
            const resultB = calculateTotal(stateB);

            expect(resultA.total).toBe(10.97);
            expect(resultB.total).toBe(10.97);
            expect(resultA.total).toBe(resultB.total);
        });
    });
});
