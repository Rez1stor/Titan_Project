import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      // Proxy API calls to the app service. Default to local backend when env vars are not set.
      '/api': {
        target: process.env.SERVER_HTTPS || process.env.SERVER_HTTP || 'http://localhost:5542',
        changeOrigin: true
      },
      '/product-images': {
        target: process.env.SERVER_HTTPS || process.env.SERVER_HTTP || 'http://localhost:5542',
        changeOrigin: true
      }
    }
  }
})
