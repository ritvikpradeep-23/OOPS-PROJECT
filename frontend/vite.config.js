import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // The dev server forwards /api to the Spring Boot backend, so the browser
  // only ever talks to this server: no CORS, and it works from other devices.
  const backend = env.BACKEND_URL || 'http://localhost:8080'

  return {
    plugins: [react()],
    server: {
      host: true,
      proxy: {
        '/api': {
          target: backend,
          changeOrigin: true,
          configure: proxy => {
            proxy.on('error', (err, req, res) => {
              if (res.headersSent || res.writableEnded) return
              res.writeHead(503, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({
                message: `Cannot reach the backend at ${backend}. Start it with "mvn spring-boot:run" in the backend folder and check its console for errors.`
              }))
            })
          }
        }
      }
    }
  }
})
