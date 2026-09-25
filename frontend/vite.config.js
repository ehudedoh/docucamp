import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Mise à jour automatique : le nouveau service worker prend la main dès la prochaine visite
      registerType: "autoUpdate",
      includeAssets: ["icons/apple-touch-icon.png", "icons/favicon-32.png", "icons/logo.png"],

      // Manifest unique (⚠️ ne pas recréer public/manifest.webmanifest : conflit)
      manifest: {
        id: "/",
        name: "DocuCamp",
        short_name: "DocuCamp",
        description: "Apprendre. Partager. S'équiper.",
        lang: "fr",
        dir: "ltr",
        categories: ["education", "productivity"],
        theme_color: "#0f172a",
        background_color: "#ffffff",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          // Icône adaptative Android (plein cadre) — purpose séparé, comme recommandé
          { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        // Raccourcis (appui long sur l'icône)
        shortcuts: [
          { name: "Documents", url: "/documents", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
          { name: "Matériel", url: "/materials", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
          { name: "Publier un document", url: "/documents/upload", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
        ],
      },

      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
        cleanupOutdatedCaches: true,
        // SPA : toute navigation retombe sur index.html (fonctionne hors-ligne),
        // SAUF l'API, qui ne doit jamais être interceptée
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/institutions/,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "api-institutions" },
          },
          {
            // Photos du matériel (bucket public Supabase) : visibles hors-ligne après une 1re visite
            urlPattern: /^https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\/material-images\//,
            handler: "CacheFirst",
            options: {
              cacheName: "material-images",
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
