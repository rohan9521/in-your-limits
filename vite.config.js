import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiPort = Number(env.API_PORT || 8787)
  const frontendPort = Number(env.VITE_PORT || 5174)

  return {
    plugins: [react()],
    server: {
      port: frontendPort,
      proxy: { '/api': `http://localhost:${apiPort}` },
    },
  }
})
