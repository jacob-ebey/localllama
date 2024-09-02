import Markdown from "react-markdown";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ChatMessage({
  children,
  from,
  pending,
}: {
  children: string;
  from: "assistant" | "user";
  pending?: boolean;
}) {
  return (
    <Card className={cn(pending && "animate-pulse")}>
      <CardHeader>
        <CardTitle>{from}</CardTitle>
      </CardHeader>
      <CardContent className="prose prose-sm max-w-full">
        <Markdown>{children}</Markdown>
      </CardContent>
    </Card>
  );
}
