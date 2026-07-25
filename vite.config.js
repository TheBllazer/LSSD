import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

/**
 * Configuration Vite du LSSD RMS.
 *
 * Contraintes GitHub Pages :
 *  - `base` doit correspondre au nom du dépôt (`https://<user>.github.io/LSSD/`).
 *    Surchargeable via la variable d'environnement VITE_BASE_PATH (utile pour un
 *    domaine personnalisé, où la base devient simplement '/').
 *  - Aucun rewrite serveur n'étant possible, le routage utilise HashRouter
 *    (cf. src/app/router/AppRouter.jsx).
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.VITE_BASE_PATH || '/LSSD/';

  return {
    base,
    plugins: [react()],

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },

    server: {
      port: 5173,
      strictPort: false,
      open: false,
    },

    preview: {
      port: 4173,
    },

    build: {
      target: 'es2022',
      outDir: 'dist',
      sourcemap: mode !== 'production',
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          /**
           * Découpage manuel du bundle. Forme fonctionnelle volontaire : elle
           * n'échoue pas si une dépendance d'une phase ultérieure (TipTap, PDF,
           * Leaflet) n'est pas encore installée.
           */
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;

            if (id.includes('@tiptap') || id.includes('prosemirror')) return 'vendor-editor';
            if (id.includes('@react-pdf') || id.includes('pdfkit')) return 'vendor-pdf';
            if (id.includes('leaflet')) return 'vendor-map';
            if (id.includes('react-icons')) return 'vendor-icons';
            // `re2js` est tiré par firebase/auth (évaluation des politiques de
            // mot de passe à l'abri des expressions régulières pathologiques).
            if (id.includes('firebase') || id.includes('@firebase') || id.includes('re2js')) {
              return 'vendor-firebase';
            }
            // Satellites de MUI/Emotion : ils évoluent avec MUI, donc ils
            // partagent son chunk (invalidation de cache cohérente).
            if (
              id.includes('@mui') ||
              id.includes('@emotion') ||
              id.includes('@popperjs') ||
              id.includes('stylis') ||
              id.includes('react-transition-group') ||
              id.includes('hoist-non-react-statics') ||
              id.includes('react-is') ||
              id.includes('clsx')
            ) {
              return 'vendor-mui';
            }
            if (
              id.includes('framer-motion') ||
              id.includes('motion-dom') ||
              id.includes('motion-utils')
            ) {
              return 'vendor-motion';
            }
            if (id.includes('@tanstack')) return 'vendor-query';
            if (
              id.includes('react-router') ||
              id.includes('/react-dom/') ||
              id.includes('/react/') ||
              id.includes('scheduler')
            ) {
              return 'vendor-react';
            }
            return 'vendor';
          },
        },
      },
    },

    /** Pré-bundling explicite : évite les rechargements à froid en dev. */
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', '@mui/material'],
    },
  };
});
