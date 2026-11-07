import fs from "node:fs";
import path from "node:path";

const dbPath = process.env.IN_MEMORY_DB_PATH;
if (dbPath) {
  fs.rmSync(path.resolve(process.cwd(), dbPath), { recursive: true, force: true });
}
