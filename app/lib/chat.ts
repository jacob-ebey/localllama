import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatChunk } from "@/lib/utils.server";

interface UseChatChunkOptions {
  onDone?: () => void;
  onError?: (reason: unknown) => void;
}

export function useChatChunk(
  initialChunk?: ChatChunk,
  options: UseChatChunkOptions = {}
) {
  const [state, setState] = useState<{ done: boolean; content: string }>({
    done: false,
    content: "",
  });
  const processingRef = useRef<boolean>(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const processChunks = useCallback(async (startChunk: ChatChunk) => {
    if (processingRef.current) return;
    processingRef.current = true;

    let currentChunk: ChatChunk | null = startChunk;

    while (currentChunk) {
      switch (currentChunk.type) {
        case "text":
          const content = currentChunk.content;
          setState((prevState) => ({
            ...prevState,
            content: prevState.content + content,
          }));
          if (currentChunk.next) {
            try {
              currentChunk = await currentChunk.next;
            } catch (err) {
              setState((prevState) => ({ ...prevState, done: true }));
              if (processingRef.current) {
                optionsRef.current.onError?.(err);
              }
              processingRef.current = false;
              return;
            }
          } else {
            currentChunk = null;
          }
          break;
        case "done":
          setState((prevState) => ({ ...prevState, done: true }));
          if (processingRef.current) {
            optionsRef.current.onDone?.();
          }
          currentChunk = null;
          processingRef.current = false;
          return;
        case "error":
          if (processingRef.current) {
            setState((prevState) => ({ ...prevState, done: true }));
          }
          optionsRef.current.onError?.(currentChunk.reason);
          currentChunk = null;
          processingRef.current = false;
          return;
      }
    }

    processingRef.current = false;
  }, []);

  useEffect(() => {
    setState({ content: "", done: false }); // Reset content when starting to process a new chunk

    if (initialChunk) {
      processChunks(initialChunk);
    }

    return () => {
      processingRef.current = false;
    };
  }, [initialChunk, processChunks]);

  return [
    state.content.replace(/\r?\n/g, "").trim() ? state.content : "...",
    state.done,
    () => setState({ content: "", done: false }),
  ] as const;
}
