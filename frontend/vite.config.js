import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const dashboardTarget = env.VITE_DASHBOARD_API_URL || 'https://lesser-chomp-stomp.ngrok-free.dev'
  const farmersTarget = env.VITE_FARMERS_API_URL || dashboardTarget
  const backendTarget = env.VITE_BACKEND_TARGET || env.VITE_API_BASE_URL || 'https://mushiness-rehab-fanatic.ngrok-free.dev'

  return {
    plugins: [react()],
    cacheDir: '.vite-cache',
    server: {
      proxy: {
        '/api/Dashboard': {
          target: dashboardTarget,
          changeOrigin: true,
          secure: false,
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        },
        '/api/Farmers': {
          target: farmersTarget,
          changeOrigin: true,
          secure: false,
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        },
        '/api/FarmerAddresses': {
          target: farmersTarget,
          changeOrigin: true,
          secure: false,
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        },
        '/api/FarmerBankAccounts': {
          target: farmersTarget,
          changeOrigin: true,
          secure: false,
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        },
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
