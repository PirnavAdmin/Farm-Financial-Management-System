import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const rootDir = fileURLToPath(new URL('.', import.meta.url))
const DEFAULT_API_BASE_URL = 'https://travel-daringly-tapering.ngrok-free.dev'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '')
  const backendTarget = (env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).trim().replace(/\/+$/, '')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        'lucide-react': path.resolve(__dirname, 'src/Masters/Machinery/icons.jsx')
      }
    },
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
