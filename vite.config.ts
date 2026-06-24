import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// Build léger, portable (base relative pour Vercel/Netlify/GitHub Pages).
export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2021',
    cssMinify: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        // Isole les libs tierces (gsap/lenis) dans un chunk cache-friendly.
        manualChunks: {
          vendor: ['gsap', 'lenis'],
        },
      },
    },
  },
})
