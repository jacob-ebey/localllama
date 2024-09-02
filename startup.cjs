#!/usr/bin/env node

const os = require("node:os");
const path = require("node:path");

const Database = require("better-sqlite3");
const { exec } = require("child_process");
const { drizzle } = require("drizzle-orm/better-sqlite3");
const { migrate } = require("drizzle-orm/better-sqlite3/migrator");

const sqlite = new Database(
  path.join(os.homedir(), ".localllama", "db.sqlite")
);
const db = drizzle(sqlite);

migrate(db, {
  migrationsFolder: path.join(__dirname, "migrations"),
});

const child = exec("node_modules/.bin/remix-serve build/server/index.js");

child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);
process.stdin.pipe(child.stdin);
