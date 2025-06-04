// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // if your Express route is app.post('/chat', …)
      '/api': {
        target: 'http://localhost:8787',   // ← use your server port
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
