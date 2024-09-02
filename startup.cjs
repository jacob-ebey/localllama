#!/usr/bin/env node

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { createRequestHandler } = require("@remix-run/express");
const Database = require("better-sqlite3");
const { drizzle } = require("drizzle-orm/better-sqlite3");
const { migrate } = require("drizzle-orm/better-sqlite3/migrator");
const express = require("express");

fs.mkdirSync(path.join(os.homedir(), ".localllama"), { recursive: true });

const sqlite = new Database(
  path.join(os.homedir(), ".localllama", "db.sqlite")
);
const db = drizzle(sqlite);

migrate(db, {
  migrationsFolder: path.join(__dirname, "migrations"),
});

const remixHandler = createRequestHandler({
  build: () => import("./build/server/index.js"),
});

const app = express();
app.disable("x-powered-by");

app.use(
  "/assets",
  express.static(path.resolve(__dirname, "build/client/assets"), {
    immutable: true,
    maxAge: "1y",
  })
);
app.use(
  express.static(path.resolve(__dirname, "build/client"), { maxAge: "1h" })
);
app.all("*", remixHandler);

const port = Number.parseInt(process.env.PORT || "3000");
app.listen(port, () =>
  console.log(`Local Llama server listening at http://localhost:${port}`)
);
