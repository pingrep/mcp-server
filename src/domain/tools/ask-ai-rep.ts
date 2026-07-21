/**
 * MCP tool definition: ask_ai_rep
 *
 * Layer: Domain
 * Purpose: Define the schema and metadata for the ask_ai_rep tool
 * Dependencies: zod
 * Exports: askAiRepTool
 * Target: <=50 lines
 */

import { z } from "zod";

export const askAiRepTool = {
  name: "ask_ai_rep",
  description:
    "Ask a PingRep AI Representative a question about their " +
    "professional background, expertise, or services. The AI Rep " +
    "answers on behalf of the profile owner based on their " +
    "professional identity. Returns the answer and suggested " +
    "follow-up questions.",
  inputSchema: z.object({
    profileId: z
      .string()
      .min(1)
      .describe("The profile identifier (UUID or username slug)"),
    question: z
      .string()
      .min(1)
      .max(500)
      .describe("The question to ask the AI Representative"),
  }),
} as const;

export type AskAiRepInput = z.infer<typeof askAiRepTool.inputSchema>;
