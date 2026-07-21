/**
 * Use case: Save a contact after interacting with an AI Representative.
 *
 * Layer: Application
 * Purpose: Forward contact details to the public save-contact endpoint
 *          and return a simple success/failure domain response.
 * Dependencies: ApiClient (domain port), domain types
 * Exports: saveContact
 * Target: <=50 lines
 */

import type {
  ApiClient,
  SaveContactResponse,
} from "../../domain/types/index.js";
import type { SaveContactInput } from "../../domain/tools/index.js";

/**
 * Execute the save-contact use case.
 *
 * Sends the visitor's contact details to the PingRep API so the
 * profile owner is notified of a new lead. The API creates/logs in
 * the user server-side; we only surface a boolean success to MCP.
 *
 * @param client  - API client instance (injected, not imported)
 * @param input   - Validated tool input with contact details
 * @returns Simple success/message response for MCP consumers
 */
export async function saveContact(
  client: ApiClient,
  input: SaveContactInput,
): Promise<SaveContactResponse> {
  const raw = await client.saveContact({
    profile_id: input.profileId,
    name: input.name,
    email: input.email,
    tos_consent: true,
  });

  return {
    success: raw.contactSaved,
    message: raw.contactSaved
      ? "Contact saved successfully. The profile owner will be notified."
      : "Could not save contact. Please try again.",
  };
}
