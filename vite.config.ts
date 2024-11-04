import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';

export default defineConfig({
    plugins: [react(), tsconfigPaths()],
    server: {
        open: true,
    },
    build: {
        rollupOptions: {
            plugins: [
                NodeGlobalsPolyfillPlugin({
                    buffer: true,
                }),
            ],
        },
    },
    define: {
        global: {},
    },
    optimizeDeps: {
        exclude: ["ecies-wasm"],
    },
});
