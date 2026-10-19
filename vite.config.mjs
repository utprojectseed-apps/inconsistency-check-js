import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Served from utprojectseed-apps.github.io/inconsistency-check-js
  base: "/inconsistency-check-js/",
  plugins: [react()],
  // The REDCap data dictionaries are imported as URLs and fetched by danfo.
  assetsInclude: ["**/*.csv"],
  build: { outDir: "build" },
  server: { port: 3000 },
  test: {
    // The study runs on Central time and much of the date logic reads the
    // machine's own zone, so pin it for the same results on any machine.
    env: { TZ: "America/Chicago" },
  },
});
