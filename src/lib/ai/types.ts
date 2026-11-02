export type ChatRole = "user" | "assistant";

export type ChatMessage = { role: ChatRole; content: string };

export type GenerateRequest = {
  system: string;
  messages: ChatMessage[];
};

// Any language model the app talks to implements this. Add a provider by
// implementing it and registering it in ./index.ts.
export interface ChatProvider {
  readonly name: string;
  generate(request: GenerateRequest): Promise<string>;
}
