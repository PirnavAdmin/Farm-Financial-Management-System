import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const rootDir = fileURLToPath(new URL('.', import.meta.url))
const DEFAULT_API_BASE_URL = 'http://localhost:5147'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '')
  const backendTarget = (env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).trim().replace(/\/+$/, '')

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
