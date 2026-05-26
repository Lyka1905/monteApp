import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/monteApp': {
        target: 'http://itservicesph.com',
        changeOrigin: true,
        secure: false,
        // ✅ This rewrites /monteApp/... → /IT383/MONTE/monte/index.php/...
        rewrite: (path) => path.replace(/^\/monteApp/, '/IT383/MONTE/monte/index.php'),
      },
    },
  },
});