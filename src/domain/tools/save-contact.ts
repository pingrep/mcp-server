/**
 * MCP tool definition: save_contact
 *
 * Layer: Domain
 * Purpose: Define the schema and metadata for the save_contact tool
 * Dependencies: zod
 * Exports: saveContactTool
 * Target: <=50 lines
 */

import { z } from "zod";

export const saveContactTool = {
  name: "save_contact",
  description:
    "Save your contact information after interacting with a " +
    "PingRep AI Representative. This lets the profile owner " +
    "know you are interested in connecting. Requires name and " +
    "email at minimum.",
  inputSchema: z.object({
    profileId: z
      .string()
      .min(1)
      .describe("The profile identifier (UUID or username slug)"),
    name: z
      .string()
      .min(1)
      .max(200)
      .describe("Your full name"),
    email: z
      .string()
      .email()
      .describe("Your email address"),
    phone: z
      .string()
      .max(30)
      .optional()
      .describe("Your phone number (optional)"),
    notes: z
      .string()
      .max(500)
      .optional()
      .describe("A short note for the profile owner (optional)"),
  }),
} as const;

export type SaveContactInput = z.infer<typeof saveContactTool.inputSchema>;
