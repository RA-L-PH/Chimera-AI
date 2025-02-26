import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(),
    tailwindcss()],
  server: {
    port: 5007,
  },
  build: {
    rollupOptions: {
      external: ['@rollup/rollup-linux-x64-gnu']
    }
  }
})
