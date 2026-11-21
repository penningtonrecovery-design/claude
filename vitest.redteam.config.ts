import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { defineConfig } from "vitest/config";

// Loads .env.local the same way Next.js does, so the red-team uses the same
// OpenAI key and model as the app.
loadEnvConfig(process.cwd());

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "test/server-only-stub.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/lib/safety/redteam/redteam.live.ts"],
    testTimeout: 30 * 60 * 1000,
  },
});
