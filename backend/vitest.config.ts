import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
    setupFiles: ["./src/test/setup.ts"],
    env: {
      NODE_ENV: "test",
      USE_IN_MEMORY_DB: "true",
      IN_MEMORY_DB_PATH: `.data/vitest-${process.pid}`,
      SESSION_SECRET: "vitest-session-secret-value-123",
      SEED_DEMO: "false"
    }
  }
});
