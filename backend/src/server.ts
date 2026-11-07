import { createApp } from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { env } from "./config/env.js";

async function start() {
  await connectDB();
  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`API ready at ${env.API_BASE_URL}`);
    console.log(`Allowed frontend origin(s): ${env.corsOrigins.join(", ")}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`${signal} received. Shutting down.`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

start().catch((error) => {
  console.error("Failed to start API", error instanceof Error ? error.message : error);
  process.exit(1);
});
