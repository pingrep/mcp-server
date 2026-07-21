/**
 * Use case: Search the professional directory.
 *
 * Layer: Application
 * Purpose: Forward directory search parameters to the API client
 *          and return the results for MCP consumers.
 * Dependencies: ApiClient (domain port), domain types
 * Exports: searchProfiles
 * Target: <=50 lines
 */

import type {
  ApiClient,
  DirectorySearchResponse,
} from "../../domain/types/index.js";
import type { SearchProfilesInput } from "../../domain/tools/index.js";

/**
 * Execute the search-profiles use case.
 *
 * Queries the PingRep directory for professionals matching the
 * given filters. Only profiles that have opted into AI discoverability
 * are returned by the backend.
 *
 * @param client  - API client instance (injected, not imported)
 * @param input   - Validated tool input with optional filters
 * @returns Directory search results for MCP consumers
 */
export async function searchProfiles(
  client: ApiClient,
  input: SearchProfilesInput,
): Promise<DirectorySearchResponse> {
  return client.searchProfiles({
    role: input.role,
    location: input.location,
    query: input.query,
    limit: input.limit ?? 10,
  });
}
