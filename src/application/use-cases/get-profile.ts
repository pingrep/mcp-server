/**
 * Use case: Get a public PingRep profile.
 *
 * Layer: Application
 * Purpose: Fetch a profile via the API client and map it to the
 *          slim McpProfileData shape that MCP consumers receive.
 * Dependencies: ApiClient (domain port), domain types
 * Exports: getProfile
 * Target: <=80 lines
 */

import type {
  ApiClient,
  ApiProfileResponse,
  McpProfileData,
} from "../../domain/types/index.js";
import type { GetProfileInput } from "../../domain/tools/index.js";

/**
 * Map the raw API response to the slim MCP profile shape.
 *
 * Strips internal fields (IDs, display orders, showEmail/showPhone flags)
 * and normalises field names so MCP consumers get a clean, predictable type.
 */
function toMcpProfile(raw: ApiProfileResponse): McpProfileData {
  return {
    name: raw.name,
    title: raw.title,
    company: raw.company,
    bio: raw.bio,
    location: raw.location,
    contactEmail: raw.showEmail ? raw.contactEmail : null,
    contactPhone: raw.showPhone ? raw.contactPhone : null,
    socialLinks: raw.socialLinks.map((link) => ({
      platform: link.platform,
      url: link.url,
    })),
    skills: raw.skills.map((skill) => skill.name),
    workExperience: raw.workExperience.map((exp) => ({
      title: exp.jobTitle,
      company: exp.company,
      startDate: exp.startDate,
      endDate: exp.endDate,
    })),
    education: raw.education.map((edu) => ({
      school: edu.institution,
      degree: edu.degree,
      startDate: edu.startDate,
      endDate: edu.endDate,
    })),
  };
}

/**
 * Execute the get-profile use case.
 *
 * @param client  - API client instance (injected, not imported)
 * @param input   - Validated tool input with profileId
 * @returns Slim profile data for MCP consumers
 */
export async function getProfile(
  client: ApiClient,
  input: GetProfileInput,
): Promise<McpProfileData> {
  const raw = await client.getProfile(input.profileId);
  return toMcpProfile(raw);
}
