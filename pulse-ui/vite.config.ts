import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  base: '/ui/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../pulse/ui'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        marketplace: path.resolve(__dirname, 'marketplace.html'),
        'island-nav': path.resolve(__dirname, 'islands/nav.html'),
        'island-chrome': path.resolve(__dirname, 'islands/chrome.html'),
        'island-account': path.resolve(__dirname, 'islands/account.html'),
        'island-intelligence': path.resolve(__dirname, 'islands/intelligence.html'),
        'island-globe': path.resolve(__dirname, 'islands/globe.html'),
        'island-architecture': path.resolve(__dirname, 'islands/architecture.html'),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name.startsWith('island-')
            ? 'islands/[name].js'
            : 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4173',
      '/tools': {
        target: 'http://localhost:4173',
        rewrite: (p) => `/pulse${p}`,
      },
      '/assets': {
        target: 'http://localhost:4173',
        rewrite: (p) => `/pulse${p}`,
      },
      '/design-system': {
        target: 'http://localhost:4173',
        rewrite: (p) => `/pulse${p}`,
      },
      '/favicon-pulse.js': {
        target: 'http://localhost:4173',
        rewrite: () => '/pulse/favicon-pulse.js',
      },
    },
  },
});
