import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite'

export default defineConfig({
  plugins: [
    UnoCSS(),
    sveltekit()
  ],
  server: {
    port: 5300,
    host: true,
  },
  optimizeDeps: {
    exclude: ['better-sqlite3']
  },
  build: {
    target: 'esnext'
  }
})
