import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // Percorsi relativi: indispensabili perché Electron carica la build via file://
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0', // Allow connections from LAN
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      // Build multi-pagina: gioco vecchio (index) + nuova UI (newui, quella impacchettata)
      input: {
        main: 'index.html',
        newui: 'newui.html',
      },
    },
  },
});
