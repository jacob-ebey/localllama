import { Form, useFetcher, useLoaderData } from "@remix-run/react";
import { Ollama } from "ollama";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/server-runtime";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { getGlobalSettings, updateGlobalSettings } from "@/lib/settings.server";

export const handle = {
  breadcrumbs: ["Global Settings", "General"],
};

export async function loader({ request }: LoaderFunctionArgs) {
  const ollama = new Ollama({
    host: process.env.OLLAMA_HOST,
    fetch: (input, init) => fetch(input, { ...init, signal: request.signal }),
  });

  const [models, settings] = await Promise.all([
    ollama.list().then((r) => Array.from(new Set(r.models.map((m) => m.name)))),
    getGlobalSettings(),
  ]);

  return { models, settings };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = new URLSearchParams(await request.text());
  const intent = formData.get("intent");
  switch (intent) {
    case "defaultModel": {
      const defaultModel = formData.get("defaultModel");
      await updateGlobalSettings({ defaultModel });
      break;
    }
    case "defaultTemperature": {
      const defaultTemperature = Number(formData.get("defaultTemperature"));
      if (!Number.isFinite(defaultTemperature)) {
        throw new Error("Invalid temperature.");
      }
      await updateGlobalSettings({ defaultTemperature });
      break;
    }
    case "defaultSystemPrompt": {
      const defaultSystemPrompt = formData.get("defaultSystemPrompt");
      await updateGlobalSettings({ defaultSystemPrompt });
      break;
    }
    default:
      throw new Error(`Invalid intent: ${intent}`);
  }
  return null;
}

export default function GeneralSettings() {
  const { models, settings } = useLoaderData<typeof loader>();
  const defaultModelRef = useRef<HTMLInputElement>(null);

  const [defaultTemperature, setDefaultTemperature] = useState(
    settings.defaultTemperature
  );
  useEffect(() => {
    setDefaultTemperature(settings.defaultTemperature);
  }, [settings]);

  const defaultModelFetcher = useFetcher<typeof action>();
  const defaultTemperatureFetcher = useFetcher<typeof action>();
  const defaultSystemPromptFetcher = useFetcher<typeof action>();

  return (
    <div className="grid gap-6">
      <defaultModelFetcher.Form method="post">
        <input type="hidden" name="intent" value="defaultModel" />
        <Card>
          <CardHeader>
            <CardTitle id="default-model-title">Default Model</CardTitle>
            <CardDescription>
              Changes the default model used for inference.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              key={`hidden|${settings.defaultModel}`}
              defaultValue={settings.defaultModel}
              type="hidden"
              name="defaultModel"
              ref={defaultModelRef}
            />
            <Select
              key={`select|${settings.defaultModel}`}
              defaultValue={settings.defaultModel}
              onValueChange={(model) => {
                if (defaultModelRef.current) {
                  defaultModelRef.current.value = model;
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={settings.defaultModel} />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button
              type="submit"
              disabled={defaultModelFetcher.state !== "idle"}
            >
              Save
            </Button>
          </CardFooter>
        </Card>
      </defaultModelFetcher.Form>

      <defaultTemperatureFetcher.Form method="post">
        <input type="hidden" name="intent" value="defaultTemperature" />
        <Card>
          <CardHeader>
            <CardTitle>Default Temperature</CardTitle>
            <CardDescription>
              Changes the default temperature used for inference.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Slider
                value={[defaultTemperature]}
                max={1}
                step={0.1}
                onValueChange={(value) => {
                  setDefaultTemperature(value[0]);
                }}
              />
              <Input
                id="default-temperature"
                name="defaultTemperature"
                type="number"
                min={0}
                max={1}
                step={0.1}
                className="w-20"
                value={defaultTemperature}
                onChange={(event) => {
                  setDefaultTemperature(Number(event.target.value));
                }}
              />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit">Save</Button>
          </CardFooter>
        </Card>
      </defaultTemperatureFetcher.Form>

      <defaultSystemPromptFetcher.Form method="post">
        <input type="hidden" name="intent" value="defaultSystemPrompt" />
        <Card>
          <CardHeader>
            <CardTitle id="system-prompt-title">
              Default System Prompt
            </CardTitle>
            <CardDescription>
              Changes how the assistant responds.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              aria-labelledby="system-prompt-title"
              name="defaultSystemPrompt"
              placeholder="You are a helpful assistant."
              defaultValue={settings.defaultSystemPrompt}
            />
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit">Save</Button>
          </CardFooter>
        </Card>
      </defaultSystemPromptFetcher.Form>
    </div>
  );
}
