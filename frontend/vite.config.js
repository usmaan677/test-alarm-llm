import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Requests to /query and /health are forwarded to the FastAPI service on :8000,
// so the browser never makes a cross-origin call and the backend needs no CORS setup.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/query': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
    },
  },
})
