
export const ANALYTICS_VERSION = 'v1';

export const EVENTS = {
    FREE_HALO_IMPLICIT_APPLIED: 'FREE_HALO_IMPLICIT_APPLIED',
    FREE_TO_PAID_UPGRADE: 'FREE_TO_PAID_UPGRADE',
    TAG_MIX_SELECTED: 'TAG_MIX_SELECTED'
} as const;

export interface FreeHaloImplicitAppliedPayload {
    capacity: number;
    tagType: string;
}

export interface FreeToPaidUpgradePayload {
    previousCapacity: number;
    newCapacity: number;
    preservedTags: Record<string, number>;
}

export interface TagMixSelectedPayload {
    tagTypes: string[];
    quantities: Record<string, number>;
    totalTagCount: number;
}

export type AnalyticsEventMap = {
    [EVENTS.FREE_HALO_IMPLICIT_APPLIED]: FreeHaloImplicitAppliedPayload;
    [EVENTS.FREE_TO_PAID_UPGRADE]: FreeToPaidUpgradePayload;
    [EVENTS.TAG_MIX_SELECTED]: TagMixSelectedPayload;
};

export type AnalyticsEventName = keyof AnalyticsEventMap;

export interface AnalyticsEventEnvelope<K extends AnalyticsEventName> {
    version: typeof ANALYTICS_VERSION;
    name: K;
    payload: AnalyticsEventMap[K];
}
