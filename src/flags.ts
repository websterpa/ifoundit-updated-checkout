
// Declare the build-time injected variables here to avoid redeclaration issues elsewhere
declare const __CHECKOUT_ENABLED__: string;
declare const __ADMIN_MODE__: string;
declare const __PERFORMANCE_LOGGING_ENABLED__: string;

export const FEATURE_FLAGS = {
    CHECKOUT_ENABLED: () => __CHECKOUT_ENABLED__ !== 'false',
    ADMIN_MODE: () => __ADMIN_MODE__ === 'true',
    PERFORMANCE_LOGGING_ENABLED: () => __PERFORMANCE_LOGGING_ENABLED__ === 'true',
};

// Type-safe accessor
export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

export function isFeatureEnabled(flag: FeatureFlagKey): boolean {
    return FEATURE_FLAGS[flag]();
}
