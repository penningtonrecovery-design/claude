import "server-only";
import { getAiConfig } from "@/lib/config";
import { OpenAIChatProvider } from "./openai";
import type { ChatProvider } from "./types";

export function getChatProvider(): ChatProvider | null {
  const config = getAiConfig();
  if (!config) return null;
  switch (config.provider) {
    case "openai":
      return new OpenAIChatProvider(config.apiKey, config.model);
  }
}
