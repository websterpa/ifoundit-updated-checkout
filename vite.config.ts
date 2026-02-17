import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                checkout: resolve(__dirname, 'checkout.html'),
                confirmation: resolve(__dirname, 'confirmation.html'),
                tags: resolve(__dirname, 'tags.html'),
                howItWorks: resolve(__dirname, 'how-it-works.html'),
                whyIFoundit: resolve(__dirname, 'why-ifoundit.html'),
            },
        },
    },
});
