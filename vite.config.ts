import { defineConfig } from 'vite';
import { resolve } from 'path';
import { execSync } from 'child_process';

// Capture Metadata
const commitSha = execSync('git rev-parse --short HEAD').toString().trim();
const buildTime = new Date().toISOString();
// Netlify provides default env vars but they need to be passed to client
// process.env.DEPLOY_ID is available in Netlify build context.

export default defineConfig({
    define: {
        '__COMMIT_SHA__': JSON.stringify(commitSha),
        '__BUILD_TIME__': JSON.stringify(buildTime),
        '__DEPLOY_ID__': JSON.stringify(process.env.DEPLOY_ID || 'local-dev'),
        '__CHECKOUT_ENABLED__': JSON.stringify(process.env.CHECKOUT_ENABLED ?? 'true'),
        '__APP_ENV__': JSON.stringify(process.env.APP_ENV || 'development'),
        '__ADMIN_MODE__': JSON.stringify(process.env.ADMIN_MODE || 'false'),
        '__PERFORMANCE_LOGGING_ENABLED__': JSON.stringify(process.env.PERFORMANCE_LOGGING_ENABLED || 'false'),
    },
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                checkout: resolve(__dirname, 'checkout.html'),
                confirmation: resolve(__dirname, 'confirmation.html'),
                admin: resolve(__dirname, 'admin.html'),
            },
        },
    },
});
