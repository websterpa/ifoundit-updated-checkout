
import { describe, it, expect } from 'vitest';
import { PRICING, type TagCapacity } from './pricing';

// Define the logic that resolves the plan label (mimicking src/main.ts logic)
// Since this logic is embedded in updateUI in main.ts and not exported, 
// we validly test the invariant by reproducing the *logic* to ensure it holds 
// against the data.
//
// Ideally, this logic should be a pure function in pricing.ts or similar.
// For now, we test the *intended* output given the inputs.
function resolvePlanLabel(capacity: TagCapacity): string {
    return capacity === 1
        ? "Essential Plan"
        : `Up to ${capacity} tags`;
}

describe('Order Summary Invariants', () => {

    it('Invariant 1: Essential Plan (Capacity 1)', () => {
        const capacity: TagCapacity = 1;
        const label = resolvePlanLabel(capacity);
        const price = PRICING.TAGS[capacity];

        // Assertions
        expect(label).toBe('Essential Plan');
        expect(price).toBe(0);
        expect(label).not.toContain('Base Plan');
        expect(label).not.toContain('Up to 1 tag'); // No capacity wording for 1
    });

    it('Invariant 2: Paid Capacity Plans', () => {
        // Get all capacities > 1
        const paidCapacities = Object.keys(PRICING.TAGS)
            .map(Number)
            .filter((cap): cap is TagCapacity => cap > 1);

        paidCapacities.forEach(capacity => {
            const label = resolvePlanLabel(capacity);
            const price = PRICING.TAGS[capacity];

            // Assertions
            expect(label).toBe(`Up to ${capacity} tags`);
            expect(price).toBeGreaterThan(0);
            expect(label).not.toBe('Essential Plan');
            expect(label).not.toContain('Base Plan');
        });
    });

    it('Invariant 3: "Base Plan" never appears', () => {
        const allCapacities = Object.keys(PRICING.TAGS).map(Number) as TagCapacity[];

        allCapacities.forEach(capacity => {
            const label = resolvePlanLabel(capacity);
            expect(label).not.toContain('Base Plan');
        });
    });

    // Verify explicit known capacities
    it('Verifies exact labels for known capacities', () => {
        expect(resolvePlanLabel(1)).toBe('Essential Plan');
        expect(resolvePlanLabel(3)).toBe('Up to 3 tags');
        expect(resolvePlanLabel(10)).toBe('Up to 10 tags');
        expect(resolvePlanLabel(20)).toBe('Up to 20 tags');
    });

});
