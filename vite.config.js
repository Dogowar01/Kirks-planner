import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/Kirks-planner/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'Signal9 Life Planner',
        short_name: 'S9 Planner',
        description: "Kirk's daily operational hub",
        start_url: '/Kirks-planner/',
        display: 'standalone',
        background_color: '#141413',
        theme_color: '#D85A30',
        orientation: 'portrait-primary',
        icons: [
          { src: '/Kirks-planner/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/Kirks-planner/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/Kirks-planner/icons/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
        globIgnores: ['**/art-*.png'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.frankfurter\.app\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 31536000 } },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'gstatic-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 31536000 } },
          },
        ],
      },
    }),
  ],
  build: { outDir: 'docs' },
})
