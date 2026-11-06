import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // Bind mounts on Windows/macOS do not propagate file events into the container.
    watch: { usePolling: true },
  },
  test: {
    environment: 'node',
  },
});
