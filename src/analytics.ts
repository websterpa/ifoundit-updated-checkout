import { ANALYTICS_VERSION, type AnalyticsEventMap, type AnalyticsEventName, type AnalyticsEventEnvelope } from './analytics.contract';

export function trackEvent<K extends AnalyticsEventName>(name: K, payload: AnalyticsEventMap[K]) {
    try {
        // Deterministic version attachment - enforced at runtime and compile time
        const event: AnalyticsEventEnvelope<K> = {
            version: ANALYTICS_VERSION,
            name,
            payload
        };

        // Output or transmission would happen here.
        // For now, we ensure 'event' is constructed and used (silently).
        void event;

    } catch (e) {
        // Fail silently per requirements
    }
}

