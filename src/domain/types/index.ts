/**
 * Domain types for the PingRep MCP server.
 *
 * Layer: Domain
 * Purpose: Define the slim data shapes MCP consumers receive.
 *          Also defines the ApiClient port (dependency inversion).
 * Dependencies: None (domain layer has zero external deps)
 * Exports: McpProfileData, SocialLinkData, WorkExperienceData,
 *          EducationData, AskAiRepResponse, SaveContactResponse,
 *          DirectorySearchResult, DirectorySearchResponse, ApiClient
 * Target: <=100 lines
 */

// ── Profile Data (slim — only what MCP consumers need) ──────────

export interface McpProfileData {
  name: string;
  title: string | null;
  company: string | null;
  bio: string | null;
  location: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  socialLinks: SocialLinkData[];
  skills: string[];
  workExperience: WorkExperienceData[];
  education: EducationData[];
}

export interface SocialLinkData {
  platform: string;
  url: string;
}

export interface WorkExperienceData {
  title: string;
  company: string;
  startDate: string;
  endDate: string | null;
}

export interface EducationData {
  school: string;
  degree: string;
  startDate: string | null;
  endDate: string | null;
}

// ── AI Representative Response ──────────────────────────────────

export interface AskAiRepResponse {
  answer: string;
  suggestedQuestions: string[];
  remainingQuestions: number;
}

// ── Save Contact Response ───────────────────────────────────────

export interface SaveContactResponse {
  success: boolean;
  message: string;
}

// ── Directory Search Data ────────────────────────────────────────

export interface DirectorySearchResult {
  name: string;
  slug: string;
  title: string | null;
  company: string | null;
  photoUrl: string | null;
  location: string | null;
  activeIdentities: string[];
}

export interface DirectorySearchResponse {
  results: DirectorySearchResult[];
  total: number;
}

// ── Authenticated Owner MCP Data ────────────────────────────────

export interface OwnerProfileData {
  id: string;
  name: string;
  title: string | null;
  company: string | null;
  bio: string | null;
  location: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  slug: string | null;
  isPublic: boolean;
  mcpDiscoverable: boolean;
  socialLinks: SocialLinkData[];
  skills: string[];
}

export interface OwnerContactData {
  id: string;
  profileId: string;
  userId: string | null;
  name: string;
  title: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  socialLinks: SocialLinkData[];
  profileAvailable: boolean;
}

export interface OwnerContactListResponse {
  contacts: OwnerContactData[];
  total: number;
  hasMore: boolean;
}

export interface MessageDraftResponse {
  contactId: string;
  recipientName: string;
  recipientUserId: string;
  message: string;
  requiresConfirmation: boolean;
}

export interface SendMessageResponse {
  sent: boolean;
  conversationId: string;
  recipientName: string;
}

export interface RepAnalyticsSummary {
  profileId: string;
  periodDays: number;
  totalViews: number;
  uniqueViewers: number;
  qrScans: number;
  savedCount: number;
  viewsThisWeek: number;
  qrScansThisWeek: number;
  bySource: Record<string, number>;
}

// ── API Client Port (dependency inversion) ──────────────────────

export interface ApiClient {
  /**
   * GET a public profile by identifier (UUID or slug).
   * Maps to: GET /api/v1/profiles/p/{profileId}
   */
  getProfile(profileId: string): Promise<ApiProfileResponse>;

  /**
   * Ask the AI Representative a question (synchronous, non-streaming).
   * Maps to: POST /api/v1/public/ai/ask-sync
   */
  askAiRep(profileId: string, question: string): Promise<ApiAskResponse>;

  /**
   * Save a contact after interacting with an AI Representative.
   * Maps to: POST /api/v1/public/save-contact
   */
  saveContact(input: ApiSaveContactInput): Promise<ApiSaveContactResponse>;

  /**
   * Search the professional directory for discoverable profiles.
   * Maps to: GET /api/v1/public/directory/search
   */
  searchProfiles(params: {
    role?: string;
    location?: string;
    query?: string;
    limit?: number;
  }): Promise<DirectorySearchResponse>;

  getMyProfile(): Promise<OwnerProfileData>;

  listMyContacts(params: { limit?: number; offset?: number }): Promise<OwnerContactListResponse>;

  getContact(contactId: string): Promise<OwnerContactData>;

  askMyAiRep(question: string): Promise<ApiAskResponse>;

  askContactAiRep(contactId: string, question: string): Promise<ApiAskResponse>;

  draftMessageToContact(contactId: string, message: string): Promise<MessageDraftResponse>;

  sendMessageToContact(
    contactId: string,
    message: string,
    confirmSend: true,
  ): Promise<SendMessageResponse>;

  getRepAnalyticsSummary(days?: number): Promise<RepAnalyticsSummary>;
}

// ── Raw API response shapes (what the backend actually returns) ─

export interface ApiProfileResponse {
  id: string;
  name: string;
  title: string | null;
  company: string | null;
  bio: string | null;
  location: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  showEmail: boolean;
  showPhone: boolean;
  socialLinks: Array<{ platform: string; url: string }>;
  workExperience: Array<{
    jobTitle: string;
    company: string;
    startDate: string;
    endDate: string | null;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    startDate: string | null;
    endDate: string | null;
  }>;
  skills: Array<{ name: string }>;
}

export interface ApiAskResponse {
  answer: string;
  suggested_questions?: string[];
  remaining_questions?: number | null;
  suggestedQuestions?: string[];
  remainingQuestions?: number | null;
}

export interface ApiSaveContactInput {
  profile_id: string;
  name: string;
  email: string;
  tos_consent: boolean;
  phone?: string;
  notes?: string;
}

export interface ApiSaveContactResponse {
  contactSaved: boolean;
}
