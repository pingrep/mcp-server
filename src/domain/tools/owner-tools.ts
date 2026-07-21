/**
 * MCP tool definitions for authenticated owner-scoped PingRep tools.
 *
 * Layer: Domain
 * Purpose: Define schemas and metadata for paid MCP connector tools
 */

import { z } from "zod";

const contactId = z.string().uuid().describe("Saved contact ID from list_my_contacts");
const question = z.string().min(1).max(500).describe("Question for the AI Representative");
const message = z.string().min(1).max(2000).describe("Message text");

export const getMyProfileTool = {
  name: "get_my_profile",
  description: "Get the authenticated PingRep user's own AI Representative profile.",
  inputSchema: z.object({}),
} as const;

export const listMyContactsTool = {
  name: "list_my_contacts",
  description: "List the authenticated user's saved PingRep contacts.",
  inputSchema: z.object({
    limit: z.number().min(1).max(50).default(20).describe("Maximum contacts to return"),
    offset: z.number().min(0).default(0).describe("Number of contacts to skip"),
  }),
} as const;

export const getContactTool = {
  name: "get_contact",
  description: "Get details for one saved contact owned by the authenticated user.",
  inputSchema: z.object({ contactId }),
} as const;

export const askMyAiRepTool = {
  name: "ask_my_ai_rep",
  description: "Ask the authenticated user's own PingRep AI Representative a question.",
  inputSchema: z.object({ question }),
} as const;

export const askContactAiRepTool = {
  name: "ask_contact_ai_rep",
  description: "Ask a saved contact's PingRep AI Representative a question.",
  inputSchema: z.object({ contactId, question }),
} as const;

export const draftMessageToContactTool = {
  name: "draft_message_to_contact",
  description: "Draft a message to a saved contact. This does not send anything.",
  inputSchema: z.object({ contactId, message }),
} as const;

export const sendMessageToContactTool = {
  name: "send_message_to_contact",
  description:
    "Send a message to a saved contact only after explicit user confirmation. " +
    "Set confirmSend to true only after the user approves the exact message.",
  inputSchema: z.object({
    contactId,
    message,
    confirmSend: z.literal(true).describe("Must be true after explicit confirmation"),
  }),
} as const;

export const getRepAnalyticsSummaryTool = {
  name: "get_rep_analytics_summary",
  description: "Get the authenticated user's PingRep AI Representative analytics summary.",
  inputSchema: z.object({
    days: z.number().min(1).max(365).default(30).describe("Lookback window in days"),
  }),
} as const;

export type GetMyProfileInput = z.infer<typeof getMyProfileTool.inputSchema>;
export type ListMyContactsInput = z.infer<typeof listMyContactsTool.inputSchema>;
export type GetContactInput = z.infer<typeof getContactTool.inputSchema>;
export type AskMyAiRepInput = z.infer<typeof askMyAiRepTool.inputSchema>;
export type AskContactAiRepInput = z.infer<typeof askContactAiRepTool.inputSchema>;
export type DraftMessageToContactInput = z.infer<typeof draftMessageToContactTool.inputSchema>;
export type SendMessageToContactInput = z.infer<typeof sendMessageToContactTool.inputSchema>;
export type GetRepAnalyticsSummaryInput = z.infer<typeof getRepAnalyticsSummaryTool.inputSchema>;
