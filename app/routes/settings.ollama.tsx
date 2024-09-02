import { useFetcher, useLoaderData } from "@remix-run/react";
import { Ollama } from "ollama";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ActionFunctionArgs } from "@remix-run/server-runtime";
import { Input } from "@/components/ui/input";
import { getGlobalSettings, updateGlobalSettings } from "@/lib/settings.server";

export const handle = {
  breadcrumbs: [{ to: "/settings", name: "Global Settings" }, "Ollama"],
};

export async function loader() {
  const settings = await getGlobalSettings();
  return { settings };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = new URLSearchParams(await request.text());
  const intent = formData.get("intent");
  if (intent === "ollamaHost") {
    const ollamaHost = formData.get("ollamaHost");
    await updateGlobalSettings({ ollamaHost });
  }
  return null;
}

export default function OllamaSettings() {
  const { settings } = useLoaderData() as Awaited<ReturnType<typeof loader>>;

  const ollamaHostFetcher = useFetcher();

  return (
    <div className="grid gap-6">
      <ollamaHostFetcher.Form method="post">
        <input type="hidden" name="intent" value="ollamaHost" />
        <Card>
          <CardHeader>
            <CardTitle id="default-model-title">Ollama Host</CardTitle>
            <CardDescription>
              Changes the default host used for inference.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              key={settings.ollamaHost}
              type="text"
              name="ollamaHost"
              placeholder={settings.defaultOllamaHost}
              defaultValue={settings.ollamaHost}
            />
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={ollamaHostFetcher.state !== "idle"}>
              Save
            </Button>
          </CardFooter>
        </Card>
      </ollamaHostFetcher.Form>
    </div>
  );
}
