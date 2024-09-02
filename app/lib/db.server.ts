import * as os from "node:os";
import * as path from "node:path";

import Database from "better-sqlite3";
import { relations } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { text, integer, real, sqliteTable } from "drizzle-orm/sqlite-core";

export const chats = sqliteTable("chats", {
  id: integer("id").notNull().primaryKey({ autoIncrement: true }),
  name: text("name"),
  model: text("model"),
  prompt: text("prompt"),
  temperature: real("temperature"),
});

const chatsRelations = relations(chats, ({ many }) => ({
  messages: many(messages),
}));

export const messages = sqliteTable("messages", {
  id: integer("id").notNull().primaryKey({ autoIncrement: true }),
  chatId: integer("chat_id")
    .notNull()
    .references(() => chats.id),
  from: text("from", { enum: ["assistant", "user"] }).notNull(),
  content: text("content").notNull(),
});

const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
}));

const sqlite = new Database(
  path.join(os.homedir(), ".localllama", "db.sqlite")
);
export const db = drizzle(sqlite, {
  schema: { chats, chatsRelations, messages, messagesRelations },
});
