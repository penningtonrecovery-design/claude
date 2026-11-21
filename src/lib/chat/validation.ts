import { z } from "zod";

export const MAX_MESSAGES = 40;
export const MAX_MESSAGE_CHARS = 4000;

export const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(MAX_MESSAGE_CHARS),
      }),
    )
    .min(1)
    .max(MAX_MESSAGES)
    .refine((messages) => messages.length > 0 && messages[messages.length - 1].role === "user", {
      message: "The last message must be from the user.",
    }),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
