import { defineConfig } from "vitest/config";

// Standalone config (not merged with vite.config.ts) so tests don't pull in
// the Tailwind plugin. Pure-logic tests only — no jsdom.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}", "data/**/*.test.{ts,tsx}"],
  },
});
