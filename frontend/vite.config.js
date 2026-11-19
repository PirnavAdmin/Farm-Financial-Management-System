import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = env.VITE_API_BASE_URL || 'http://localhost:5147'

  return {
    plugins: [react()],
    cacheDir: '.vite-cache',
    server: {
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        }
      }
    }
  }
})
