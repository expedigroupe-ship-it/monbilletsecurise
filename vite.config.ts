import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  // Supprimez ou simplifiez la section 'define' pour le build
  // Vercel gère les variables d'environnement via son propre tableau de bord
});
