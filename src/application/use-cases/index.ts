/**
 * Barrel export for all MCP use cases.
 *
 * Layer: Application
 * Purpose: Single import point for use case functions
 * Dependencies: Individual use case modules
 * Exports: All use case functions
 * Target: <=20 lines
 */

export { askAiRep } from "./ask-ai-rep.js";
export { getProfile } from "./get-profile.js";
export {
  askContactAiRep,
  askMyAiRep,
  draftMessageToContact,
  getContact,
  getMyProfile,
  getRepAnalyticsSummary,
  listMyContacts,
  sendMessageToContact,
} from "./owner-tools.js";
export { saveContact } from "./save-contact.js";
export { searchProfiles } from "./search-profiles.js";
