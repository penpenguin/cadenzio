import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://penpenguin.github.io',
  base: '/cadenzio',
  vite: {
    optimizeDeps: {
      exclude: ['@astrojs/check'],
      include: ['nouislider']
    },
    build: {
      rollupOptions: {
        output: {
          // Keep module files organized
          chunkFileNames: 'assets/js/[name].[hash].js',
          entryFileNames: 'assets/js/[name].[hash].js',
          assetFileNames: 'assets/[ext]/[name].[hash].[ext]'
        }
      }
    }
  }
});