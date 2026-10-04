import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The study runs on Central time and much of the date logic reads the
    // machine's own zone, so pin it for the same results on any machine.
    env: { TZ: "America/Chicago" },
  },
});
