import { disableCheckoutUI } from './killswitch';

interface ErrorLog {
    timestamp: string;
    message: string;
    stack?: string;
    component: string;
}

export function initGlobalErrorBoundary() {
    window.addEventListener('error', (event) => {
        handleGlobalError(event.error, 'window:error');
    });

    window.addEventListener('unhandledrejection', (event) => {
        handleGlobalError(event.reason, 'window:unhandledrejection');
    });
}

function handleGlobalError(error: any, component: string) {
    const errorLog: ErrorLog = {
        timestamp: new Date().toISOString(),
        message: error?.message || String(error),
        stack: error?.stack,
        component: component
    };

    // 1. Log to console (Structured Operational Logging)
    console.error('[CRITICAL_FAILURE]', JSON.stringify(errorLog));

    // 2. Safe Fallback UI
    // Reuse the killswitch UI as it fits the "Neutral message" requirement
    disableCheckoutUI();
}
