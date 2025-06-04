// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // if your Express route is app.post('/chat', …)
      '/api': {
        target: 'http://localhost:3000',   // ← use your server port
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),  
        secure: false,
      },
    },
  },
})
