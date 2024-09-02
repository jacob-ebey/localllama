import { chats, db, messages } from "@/lib/db.server";
import { asc, desc, eq } from "drizzle-orm";

export async function createChat({
  name,
  prompt,
  temperature,
}: {
  name: string | null;
  prompt: string | null;
  temperature: number | null;
}) {
  const rows = await db
    .insert(chats)
    .values({ name, prompt, temperature })
    .returning({ id: chats.id });
  const id = rows[0]?.id;
  if (typeof id !== "number") throw new Error("Failed to create chat");
  return id;
}

export async function getChat(id: number): Promise<Chat | null> {
  const chat = await db.query.chats.findFirst({
    where: eq(chats.id, id),
    columns: {
      id: true,
      name: true,
      model: true,
      prompt: true,
      temperature: true,
    },
    with: {
      messages: {
        orderBy: asc(messages.id),
        columns: {
          id: true,
          from: true,
          content: true,
        },
      },
    },
  });
  return chat ?? null;
}

export async function getChats({ limit = 10 }: { limit?: number } = {}) {
  return await db
    .select({
      id: chats.id,
      name: chats.name,
    })
    .from(chats)
    .orderBy(desc(chats.id))
    .limit(limit);
}

export async function updateChat(
  id: number,
  {
    model,
    prompt,
    temperature,
  }: {
    model: string | null;
    prompt: string | null;
    temperature: number | null;
  }
) {
  await db
    .update(chats)
    .set({ model, prompt, temperature })
    .where(eq(chats.id, id));
}

export async function createMessage(
  chatId: number,
  { from, content }: { from: "assistant" | "user"; content: string }
) {
  const rows = await db
    .insert(messages)
    .values({ chatId, from, content })
    .returning({
      id: messages.id,
    });
  const id = rows[0]?.id;
  if (typeof id !== "number") throw new Error("Failed to create message");
  return id;
}

export type Chat = {
  id: number;
  name: string | null;
  messages: ChatMessage[];
  model: string | null;
  prompt: string | null;
  temperature: number | null;
};

export type ChatMessage = {
  id: number;
  from: "assistant" | "user";
  content: string;
};
