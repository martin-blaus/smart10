import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon-180x180.png"],
      manifest: {
        name: "Smart10",
        short_name: "Smart10",
        description:
          "El juego de preguntas con 10 respuestas por carta. Jugá en familia o con amigos, pasando el dispositivo.",
        lang: "es",
        display: "standalone",
        orientation: "portrait",
        background_color: "#1b3a2c",
        theme_color: "#1b3a2c",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // woff2 only: every installable browser supports it, and precaching
        // the ~20 woff fallbacks @fontsource ships would double the offline
        // cache for zero benefit.
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
      },
    }),
  ],
});
