import { type ClassValue, clsx } from "clsx";
import { useSyncExternalStore } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ellipse(text: string, length: number) {
  if (text.length <= length) return text;
  return text.slice(0, length - 3) + "...";
}
