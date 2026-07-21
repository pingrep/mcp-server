/**
 * MCP tool definition: search_profiles
 *
 * Layer: Domain
 * Purpose: Define the schema and metadata for the search_profiles tool
 * Dependencies: zod
 * Exports: searchProfilesTool
 * Target: <=50 lines
 */

import { z } from "zod";

export const searchProfilesTool = {
  name: "search_profiles",
  description:
    "Search the PingRep professional directory to find professionals by role, location, or keyword. " +
    "Only returns profiles that have opted into AI discoverability. " +
    "Use this to help users find real estate agents, attorneys, financial advisors, and other professionals.",
  inputSchema: z.object({
    role: z
      .string()
      .optional()
      .describe(
        "Professional role to filter by (e.g., 'real-estate-agent', 'attorney', 'financial-advisor')"
      ),
    location: z
      .string()
      .optional()
      .describe("Location to filter by (e.g., 'New York', 'San Francisco')"),
    query: z
      .string()
      .optional()
      .describe(
        "Free-text search query matching name, title, or company"
      ),
    limit: z
      .number()
      .min(1)
      .max(20)
      .default(10)
      .describe("Maximum number of results to return (default: 10)"),
  }),
} as const;

export type SearchProfilesInput = z.infer<typeof searchProfilesTool.inputSchema>;
