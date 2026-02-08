
export const PRICING = {
    TAGS: {
        1: 0,
        3: 0.99,
        10: 1.99,
        20: 3.99,
    },
    TAG_TYPES: [
        { id: 'halo', name: 'Halo', price: 3.99, descriptor: 'Electronics and travel items.' },
        { id: 'orbit', name: 'Orbit', price: 4.99, descriptor: 'Keys, handbags, or backpacks.' },
        { id: 'pulse', name: 'Pulse', price: 4.99, descriptor: 'Wallets, purses, or clutches.' },
        { id: 'echo', name: 'Echo', price: 5.99, descriptor: 'Keys and pockets.' },
        { id: 'trek', name: 'Trek', price: 5.99, descriptor: 'Bags, laptop cases, and totes.' },
        { id: 'roam', name: 'Roam', price: 6.99, descriptor: 'Suitcases and baggage.' },
    ],
    FINDER_REWARDS: {
        0: 0,
        1: 2.99, // 1 x £20
        2: 3.99, // 2 x £20
    },
    RETURN_CREDITS: {
        0: 0,
        1: 3.99,
        3: 6.99,
    },
    EXTRA_CONTACTS: {
        0: 0,
        1: 0.99,
        2: 1.99,
    },
} as const;

export type TagCapacity = keyof typeof PRICING.TAGS;
export type FinderRewardTier = keyof typeof PRICING.FINDER_REWARDS;
export type ReturnCreditTier = keyof typeof PRICING.RETURN_CREDITS;
export type ContactTier = keyof typeof PRICING.EXTRA_CONTACTS;

export interface CartState {
    tagCapacity: TagCapacity;
    selectedTags: Record<string, number>;
    finderRewards: FinderRewardTier;
    returnCredits: ReturnCreditTier;
    extraContacts: ContactTier;
}

export const INITIAL_STATE: CartState = {
    tagCapacity: 1, // Default included
    selectedTags: {}, // Explicit choice required
    finderRewards: 0, // None
    returnCredits: 0, // None
    extraContacts: 0, // None (1 free)
};

export function calculateTotal(state: CartState): {
    basePlanCost: number;
    rawTagsCost: number;
    tagItems: { name: string, quantity: number, price: number }[];
    boltOnItems: { name: string, price: number }[];
    addOnsCost: number;
    total: number;
    totalSelectedQuantity: number;
} {
    const basePlanCost = PRICING.TAGS[state.tagCapacity];

    // IMPLICIT SELECTION RULE:
    // If no tags are explicitly selected, treat it as 1 'Halo' tag.
    // This applies to ALL capacities to ensure we never have a £0 / empty basket.
    let effectiveSelectedTags = { ...state.selectedTags };
    const hasSelections = Object.values(state.selectedTags).some(qty => qty > 0);
    if (!hasSelections) {
        effectiveSelectedTags['halo'] = 1;
    }

    let rawTagsCost = 0;
    let totalSelectedQuantity = 0;
    const tagItems: { name: string, quantity: number, price: number }[] = [];

    PRICING.TAG_TYPES.forEach(tag => {
        const qty = effectiveSelectedTags[tag.id] || 0;
        if (qty > 0) {
            const cost = qty * tag.price;
            rawTagsCost += cost;
            totalSelectedQuantity += qty;
            tagItems.push({ name: tag.name, quantity: qty, price: tag.price });
        }
    });

    const tagsTotalCost = basePlanCost + rawTagsCost;

    const finderCost = PRICING.FINDER_REWARDS[state.finderRewards];
    const returnsCost = PRICING.RETURN_CREDITS[state.returnCredits];
    const contactsCost = PRICING.EXTRA_CONTACTS[state.extraContacts];

    const boltOnItems: { name: string, price: number }[] = [];
    if (state.finderRewards > 0) {
        boltOnItems.push({
            name: `${state.finderRewards} × £20 Finder Credit${state.finderRewards > 1 ? 's' : ''}`,
            price: finderCost
        });
    }
    if (state.returnCredits > 0) {
        boltOnItems.push({
            name: `${state.returnCredits} × Return Shipping Credit${state.returnCredits > 1 ? 's' : ''}`,
            price: returnsCost
        });
    }
    if (state.extraContacts > 0) {
        boltOnItems.push({
            name: `${state.extraContacts} Additional Recovery Contact${state.extraContacts > 1 ? 's' : ''}`,
            price: contactsCost
        });
    }

    const addOnsCost = finderCost + returnsCost + contactsCost;

    // Floating point math handling
    const total = parseFloat((tagsTotalCost + addOnsCost).toFixed(2));

    return {
        basePlanCost,
        rawTagsCost: parseFloat(rawTagsCost.toFixed(2)),
        tagItems,
        boltOnItems,
        addOnsCost: parseFloat(addOnsCost.toFixed(2)),
        total,
        totalSelectedQuantity
    };
}
