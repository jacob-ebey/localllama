import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import type {
  MetaFunction,
  ShouldRevalidateFunctionArgs,
} from "@remix-run/react";
import {
  useFetcher,
  useLoaderData,
  useLocation,
  useNavigate,
  useNavigation,
} from "@remix-run/react";
import {
  CornerDownLeft,
  LoaderCircle,
  Settings,
  StopCircle,
} from "lucide-react";
import type { Message } from "ollama";
import { Ollama } from "ollama";
import { useEffect, useState } from "react";

import { ChatMessage } from "@/components/chat";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useChatChunk } from "@/lib/chat";
import type {
  Chat as ChatType,
  ChatMessage as ChatMessageType,
} from "@/lib/chat.server";
import {
  createChat,
  createMessage,
  getChat,
  updateChat,
} from "@/lib/chat.server";
import { ellipse } from "@/lib/utils";
import { Deferred, streamResponse } from "@/lib/utils.server";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { getGlobalSettings } from "@/lib/settings.server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const handle = {
  breadcrumbs: [
    { to: "/", name: "Dashboard" },
    "Chat",
    ({ chat }: Awaited<ReturnType<typeof loader>>) =>
      Number.isSafeInteger(chat.id)
        ? chat.name
          ? ellipse(chat.name, 40)
          : null ?? "Untitled"
        : "New Chat",
  ],
};

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: `${data?.chat.name ?? "New Chat"} | Local Llama` },
];

export async function loader({ params, request }: LoaderFunctionArgs) {
  const chatId = params.chatId ? Number.parseInt(params.chatId) : NaN;
  const ollama = new Ollama({
    host: process.env.OLLAMA_HOST,
    fetch: (input, init) => fetch(input, { ...init, signal: request.signal }),
  });

  const modelsPromise = ollama.list().then((r) => r.models.map((m) => m.name));
  const settingsPromise = getGlobalSettings();

  const chat: ChatType = (Number.isSafeInteger(chatId)
    ? await getChat(chatId)
    : null) ?? {
    id: NaN,
    name: null,
    model: null,
    prompt: null,
    temperature: null,
    messages: [],
  };

  return {
    chat,
    models: await modelsPromise,
    settings: await settingsPromise,
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = new URLSearchParams(await request.text());
  const message = formData.get("message")?.replace(/\r?\n/g, "").trim();
  if (!message) {
    return {
      error: "Message is required",
    };
  }
  let model = formData.get("model");
  if (model && typeof model !== "string") {
    return {
      error: "Invalid model",
    };
  }
  const settings = await getGlobalSettings();

  model = model || settings.defaultModel;
  let systemPrompt = formData.get("systemPrompt");
  if (systemPrompt && typeof systemPrompt !== "string") {
    return {
      error: "Invalid system prompt",
    };
  }
  const temperatureStr = formData.get("temperature");
  if (temperatureStr && typeof temperatureStr !== "string") {
    return {
      error: "Invalid temperature",
    };
  }
  let temperature = temperatureStr ? Number.parseFloat(temperatureStr) : NaN;

  const chatHistory: Message[] = [];
  let chatId: number | null = null;
  if (params.chatId) {
    const lookupId = Number.parseInt(params.chatId);
    if (!Number.isSafeInteger(lookupId)) {
      return {
        error: "Invalid chat ID",
      };
    }
    const chat = await getChat(lookupId);
    chatId = chat?.id ?? null;

    if (!systemPrompt && chat?.prompt) {
      systemPrompt = chat.prompt;
    }

    temperature = Number.isFinite(temperature)
      ? temperature
      : chat?.temperature ?? settings.defaultTemperature;
    for (const message of chat?.messages ?? []) {
      chatHistory.push({
        role: message.from,
        content: message.content,
      });
    }
  }
  if (systemPrompt) {
    chatHistory.unshift({
      role: "system",
      content: systemPrompt,
    });
  }

  const ollama = new Ollama({
    host: process.env.OLLAMA_HOST,
    fetch: (input, init) => fetch(input, { ...init, signal: request.signal }),
  });

  let newName: string | null = null;
  if (typeof chatId !== "number") {
    const titleResponse = await ollama
      .chat({
        model,
        options: {
          temperature: 0.1,
          num_predict: 12,
        },
        messages: [
          {
            role: "system",
            content: [
              "You are a summarization model. You accept a message and return a title appropriate for display in a constrained space.",
              "Keep the title short and sweet, idealy less than 60 characters.",
              "Respond with a title for the message you receive and nothing else.",
            ].join("\n"),
          },
          {
            role: "user",
            content: "What color is the sky?",
          },
          {
            role: "assistant",
            content: "Sky Color",
          },
          {
            role: "user",
            content: "Write a fib function in TS",
          },
          {
            role: "assistant",
            content: "Fibonacci in TypeScript",
          },
          {
            role: "user",
            content: "Write something long",
          },
          {
            role: "assistant",
            content: "Random long response",
          },
          {
            role: "user",
            content: message,
          },
        ],
      })
      .catch((reason) => {
        console.error("Failed to get title", reason);
        return null;
      });
    newName =
      titleResponse?.message.content?.replace(/\r?\n/g, "").trim() ||
      "Untitled";
  }

  const readyToSave = new Deferred<void>();
  try {
    const response = await ollama.chat({
      stream: true,
      model,
      options: {
        temperature,
      },
      messages: [
        ...chatHistory,
        {
          role: "user",
          content: message,
        },
      ],
    });

    const assistantResponse = await streamResponse(
      response,
      async (content) => {
        await readyToSave.promise;
        if (typeof chatId !== "number") throw new Error("Chat ID is missing");
        await createMessage(chatId, { from: "assistant", content });
      },
      console.error
    );
    let newChatId: number | null = null;
    if (!chatId) {
      newChatId = chatId = await createChat({
        name: newName,
        prompt: systemPrompt,
        temperature,
      });
    } else {
      await updateChat(chatId, {
        model,
        prompt: systemPrompt,
        temperature,
      });
    }

    await createMessage(chatId, { from: "user", content: message });

    readyToSave.resolve();
    return { newChatId, assistantResponse };
  } catch (reason) {
    readyToSave.reject(reason);

    return {
      error: "Failed to complete message",
    };
  }
}

export function shouldRevalidate({
  currentParams,
  nextParams,
}: ShouldRevalidateFunctionArgs) {
  return currentParams.chatId !== nextParams.chatId;
}

export default function Chat() {
  const { chat, models, settings } = useLoaderData<typeof loader>();
  const location = useLocation();
  const fetcher = useFetcher<typeof action>({ key: location.key });
  const { error, newChatId: newId, assistantResponse } = fetcher.data ?? {};
  const navigate = useNavigate();
  const navigation = useNavigation();

  const [{ messages, renderStream }, setState] = useState<
    Omit<ChatType, "messages"> & {
      messages: (Omit<ChatMessageType, "id"> & { id: string | number })[];
      renderStream: boolean;
    }
  >({
    ...chat,
    renderStream: false,
  });

  const [temperature, setTemperature] = useState(
    chat.temperature ?? settings.defaultTemperature
  );
  const [model, setModel] = useState(chat.model ?? settings.defaultModel);
  const [systemPrompt, setSystemPrompt] = useState(
    chat.prompt ?? settings.defaultSystemPrompt
  );

  const [assistantResponseText, assistantResponseDone, resetAssistantResponse] =
    useChatChunk(assistantResponse, {
      onDone() {
        resetAssistantResponse();

        setState((state) => ({
          ...state,
          renderStream: false,
          messages: [
            ...state.messages,
            {
              id: `assistant-${state.messages.length}`,
              from: "assistant",
              content: assistantResponseText ?? "",
            },
          ],
        }));

        if (typeof newId === "number") {
          navigate(`/chat/${newId}`, {
            preventScrollReset: true,
            replace: true,
          });
        }
      },
      onError(reason) {
        console.error(reason);
        resetAssistantResponse();
        setState((state) => ({
          ...state,
          renderStream: false,
        }));
      },
    });

  useEffect(() => {
    setTimeout(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    setState({
      ...chat,
      renderStream: false,
    });
    setTemperature(chat.temperature ?? settings.defaultTemperature);
    setModel(chat.model ?? settings.defaultModel);
    setSystemPrompt(chat.prompt ?? settings.defaultSystemPrompt);
  }, [chat.id, location.key, settings]);

  const isScrolledToBottom =
    typeof document !== "undefined" &&
    document.body.scrollHeight - window.scrollY <= window.innerHeight + 1;
  useEffect(() => {
    if (assistantResponseText && isScrolledToBottom) {
      setTimeout(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
    }
  }, [assistantResponseText, isScrolledToBottom]);

  const fetcherActive =
    fetcher.state !== "idle" ||
    (renderStream && !error && !assistantResponseDone);
  const formDisabled = navigation.state !== "idle" || fetcherActive;

  return (
    <>
      <Sheet>
        <main className="flex-1 px-4 pt-4 flex flex-col">
          <article
            className="flex flex-col gap-4 px-2"
            tabIndex={0}
            aria-label="Chat messages"
          >
            {messages.map((message) => (
              <section key={message.id}>
                <ChatMessage from={message.from}>{message.content}</ChatMessage>
              </section>
            ))}
            {renderStream && !error && (
              <section>
                <ChatMessage
                  from="assistant"
                  pending={!assistantResponseDone && !assistantResponseText}
                >
                  {assistantResponseText}
                </ChatMessage>
              </section>
            )}
            {error && (
              <Card>
                <CardHeader>
                  <CardTitle>Error</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-destructive text-sm">{error}</p>
                </CardContent>
              </Card>
            )}
          </article>
          <div className="flex-1 mb-4" />
          <TooltipProvider>
            <div className="sticky bottom-0 bg-background pb-4">
              <fetcher.Form
                method="POST"
                key={location.key}
                className="overflow-hidden rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring"
                onSubmit={(event) => {
                  if (formDisabled) {
                    event.preventDefault();
                    return;
                  }

                  const form = event.currentTarget;
                  const content = (
                    form.elements.namedItem("message") as HTMLTextAreaElement
                  ).value;
                  setTimeout(() => {
                    window.scrollTo(0, document.body.scrollHeight);
                  });
                  setState((state) => ({
                    ...state,
                    renderStream: true,
                    messages: [
                      ...state.messages,
                      {
                        id: `user-${state.messages.length}`,
                        from: "user",
                        content,
                      },
                    ],
                  }));
                  setTimeout(() => {
                    form.reset();
                  });
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && event.shiftKey) {
                    event.currentTarget.requestSubmit();
                    event.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="model" value={model} />
                <input type="hidden" name="temperature" value={temperature} />
                <input type="hidden" name="systemPrompt" value={systemPrompt} />

                <Label htmlFor="message" className="sr-only">
                  Message
                </Label>
                <Textarea
                  autoFocus
                  id="message"
                  placeholder="Type your message here..."
                  className="min-h-12 resize-none border-0 p-3 shadow-none focus-visible:ring-0"
                  name="message"
                />
                <div className="flex flex-row items-center p-3 pt-0 gap-2">
                  {fetcherActive ? (
                    // <Button
                    //   type="button"
                    //   size="icon"
                    //   variant="destructive"
                    //   className="ml-auto"
                    //   onClick={() => {
                    //     // TODO: cancel fetcher
                    //   }}
                    // >
                    //   <span className="sr-only">Cancel response</span>
                    //   <StopCircle className="size-3.5" />
                    // </Button>
                    <LoaderCircle className="size-4 ml-auto animate-spin" />
                  ) : (
                    <Button
                      disabled={formDisabled}
                      type="submit"
                      size="sm"
                      className="gap-1.5 ml-auto"
                    >
                      Send Message
                      <CornerDownLeft className="size-3.5" />
                    </Button>
                  )}

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SheetTrigger asChild>
                        <Button type="button" variant="ghost" size="icon">
                          <Settings className="size-4" />
                          <span className="sr-only">Chat settings</span>
                        </Button>
                      </SheetTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top">Chat Settings</TooltipContent>
                  </Tooltip>
                </div>
              </fetcher.Form>
            </div>
          </TooltipProvider>
        </main>
        <SheetContent
          side="right"
          className="flex flex-col px-4 overflow-y-auto"
        >
          <SheetTitle>Chat settings</SheetTitle>
          <SheetDescription className="sr-only">
            Access all the chat settings.
          </SheetDescription>

          <div className="flex flex-col gap-4">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="model">Model</Label>
              <Select
                value={model}
                onValueChange={(model) => {
                  setModel(model);
                }}
              >
                <SelectTrigger id="model">
                  <SelectValue placeholder="Model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid w-full gap-1.5">
              <Label htmlFor="temperature">Temperature</Label>
              <div className="flex gap-2">
                <Slider
                  value={[temperature]}
                  max={1}
                  step={0.1}
                  onValueChange={(value) => {
                    setTemperature(value[0]);
                  }}
                />
                <Input
                  id="temperature"
                  name="temperature"
                  type="number"
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-20"
                  value={temperature}
                  onChange={(event) => {
                    setTemperature(Number(event.target.value));
                  }}
                />
              </div>
            </div>
            <div className="grid w-full gap-1.5">
              <Label htmlFor="system-prompt">System Prompt</Label>
              <Textarea
                name="systemPrompt"
                required
                placeholder="You are a helpful assistant."
                id="system-prompt"
                value={systemPrompt}
                onChange={(event) => {
                  setSystemPrompt(event.target.value);
                }}
              />
              <p className="text-sm text-muted-foreground">
                Changes how the assistant responds.
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            try {
              let positions = JSON.parse(sessionStorage.getItem("positions") || "{}");
              positions[window.history.state.key] = undefined;
              sessionStorage.setItem("positions", JSON.stringify(positions));
            } catch (error) {
              console.error(error);
            }
            window.scrollTo(0, document.body.scrollHeight);
          `,
        }}
      />
    </>
  );
}
