/**
 * MCP tool definition: get_profile
 *
 * Layer: Domain
 * Purpose: Define the schema and metadata for the get_profile tool
 * Dependencies: zod
 * Exports: getProfileTool
 * Target: <=50 lines
 */

import { z } from "zod";

export const getProfileTool = {
  name: "get_profile",
  description:
    "Get a PingRep professional profile by ID or username slug. " +
    "Returns the person's name, title, company, bio, skills, " +
    "work experience, education, and social links.",
  inputSchema: z.object({
    profileId: z
      .string()
      .min(1)
      .describe(
        "The profile identifier — either a UUID or a username slug (e.g. 'marcus')"
      ),
  }),
} as const;

export type GetProfileInput = z.infer<typeof getProfileTool.inputSchema>;
