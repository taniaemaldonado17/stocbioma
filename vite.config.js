import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // El service worker se actualiza solo cuando despliegas una nueva versión
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],

      // ── manifest.json de StocBioma ──────────────────────────
      manifest: {
        name: 'StocBioma — Inventario Forestal',
        short_name: 'StocBioma',
        description:
          'Inventario forestal y mediciones en campo para proyectos de bonos de carbono. Consultora Stoc.',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        background_color: '#18181b', // zinc-900
        theme_color: '#065f46',      // emerald-800
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },

      // ── Service Worker (Workbox) ────────────────────────────
      workbox: {
        // Precachea TODO el shell de la app: HTML, JS, CSS, íconos.
        // Con esto la app abre y funciona al 100% sin internet.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Tiles del mapa: CacheFirst → si el ingeniero abrió el mapa
            // de la zona con señal (p. ej. antes de salir al campo),
            // los tiles quedan guardados y el mapa se ve offline.
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 800, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // Las llamadas a Supabase nunca se cachean: la fuente de
            // verdad offline es IndexedDB, no el cache HTTP.
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ]
});
