// vite.config.js — React Native (web) preview.
// App agent-ийн туршиж баталсан жор (vite build 311 модуль амжилттай) дээр
// суурилсан. Нэмэлт: sandbox-д зориулж порт 3000, бүх host, HMR тохиргоо.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: { global: "window", __DEV__: JSON.stringify(true) },
  resolve: {
    // Хэрэглэгч "react-native"-ээс import хийнэ → react-native-web руу чиглүүлнэ
    alias: { "react-native": "react-native-web" },
    extensions: [".web.js", ".web.tsx", ".web.ts", ".js", ".jsx", ".ts", ".tsx"],
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    // Sandbox proxy нь Host-ыг 127.0.0.1 болгож дамжуулдаг (changeOrigin) тул
    // vite-ийн host-шалгалт саад болохгүй. HMR нь HTTPS (Caddy, 443)-аар холбогдоно.
    hmr: { clientPort: 443, protocol: "wss" },
  },
});
