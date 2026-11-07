import path from "node:path";
import fs from "node:fs";
import mongoose from "mongoose";
import { env } from "./env.js";

let memoryServer: { stop: () => Promise<boolean> } | null = null;

export async function connectDB(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) return mongoose;

  let uri = env.MONGODB_URI;

  if (env.useInMemoryDb) {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const dbPath = path.resolve(process.cwd(), env.IN_MEMORY_DB_PATH);
    fs.mkdirSync(dbPath, { recursive: true });
    const instance = await MongoMemoryServer.create({
      instance: {
        dbPath,
        storageEngine: "wiredTiger"
      }
    });
    memoryServer = instance;
    uri = instance.getUri("madrasa_miftah");
    if (!env.isTest) {
      console.log(`Local development MongoDB started at ${uri} (data: ${dbPath})`);
    }
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
  return mongoose;
}

export async function disconnectDB(): Promise<void> {
  if (memoryServer) {
    try {
      await mongoose.connection.db?.admin().command({ shutdown: 1, force: true });
    } catch {
      void 0;
    }
  }
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
