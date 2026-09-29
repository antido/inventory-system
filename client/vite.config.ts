import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Requests to /api are forwarded to the Express server,
    // so the frontend can simply call fetch('/api/...').
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
