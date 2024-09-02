import * as os from "node:os";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

import { defineConfig } from "drizzle-kit";

const url = pathToFileURL(
  path.join(os.homedir(), ".localllama", "db.sqlite")
).href;

export default defineConfig({
  dialect: "sqlite",
  schema: "./app/lib/db.server.ts",
  out: "./migrations",
  dbCredentials: {
    url,
  },
});
