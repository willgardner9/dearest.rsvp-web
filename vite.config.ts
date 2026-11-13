import { defineConfig, loadEnv } from 'vite-plus'
import react from '@vitejs/plugin-react'

// https://viteplus.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Local dev: the browser calls /api. Vite forwards the call to the API
  // and removes the /api prefix. This avoids CORS in local dev.
  const proxyTarget = env.DEV_API_PROXY_TARGET || 'http://localhost:3000'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})
