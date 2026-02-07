import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                checkout: resolve(__dirname, 'checkout.html'),
                confirmation: resolve(__dirname, 'confirmation.html'),
            },
        },
    },
});
