import "server-only";
import OpenAI from "openai";
import type { ChatProvider, GenerateRequest } from "./types";

export class OpenAIChatProvider implements ChatProvider {
  readonly name = "openai";
  private client: OpenAI;

  constructor(
    apiKey: string,
    private model: string,
  ) {
    this.client = new OpenAI({ apiKey });
  }

  async generate({ system, messages }: GenerateRequest): Promise<string> {
    const response = await this.client.responses.create({
      model: this.model,
      instructions: system,
      input: messages.map((m) => ({ role: m.role, content: m.content })),
      // Ask OpenAI not to retain this response for later retrieval.
      store: false,
    });
    return response.output_text.trim();
  }
}
