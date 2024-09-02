import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getChats } from "@/lib/chat.server";
import { Link, MetaFunction, useLoaderData } from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/server-runtime";
import { PlusCircle } from "lucide-react";

export const handle = {
  breadcrumbs: ["Dashboard"],
};

export const meta: MetaFunction = () => [{ title: "Dashboard | Local Llama" }];

export async function loader({}: LoaderFunctionArgs) {
  const chats = await getChats();

  return { chats };
}

export default function Dashboard() {
  const { chats } = useLoaderData() as Awaited<ReturnType<typeof loader>>;

  return (
    <main className="flex flex-col flex-1 items-start gap-4 p-4">
      <div className="flex items-center w-full">
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" className="gap-1" asChild>
            <Link to="/chat">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="whitespace-nowrap">New Chat</span>
            </Link>
          </Button>
        </div>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Recent chats</CardTitle>
          {chats.length > 0 && (
            <CardDescription>Your last {chats.length} chats</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {chats.length > 0 ? (
              chats.map((chat) => (
                <li key={chat.id}>
                  <Link
                    to={`/chat/${chat.id}`}
                    className="block hover:bg-muted"
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <p className="text-sm font-medium truncate">
                        {chat.name}
                      </p>
                    </div>
                  </Link>
                </li>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No chats yet.</p>
            )}
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
