/**
 * Purpose: Adapts the generic HTTP client to the domain ApiClient port
 * Layer: Infrastructure
 * Dependencies: PingRepApiClient, domain types (ApiClient interface)
 * Exports: PingRepApiAdapter
 * Size Target: 50 lines
 */

import type {
  ApiClient,
  ApiProfileResponse,
  ApiAskResponse,
  ApiSaveContactInput,
  ApiSaveContactResponse,
  DirectorySearchResponse,
  OwnerProfileData,
  OwnerContactData,
  OwnerContactListResponse,
  MessageDraftResponse,
  SendMessageResponse,
  RepAnalyticsSummary,
} from '../../domain/types/index.js';
import type { PingRepApiClient } from './client.js';

interface ApiSkill {
  name: string;
}

interface ApiOwnerProfileResponse {
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
  socialLinks: Array<{ platform: string; url: string }>;
  skills: ApiSkill[];
}

/**
 * Adapts the generic HTTP client to the domain-defined ApiClient interface.
 *
 * This adapter maps domain method calls to concrete API paths, keeping
 * URL knowledge in the infrastructure layer (not in use cases).
 */
export class PingRepApiAdapter implements ApiClient {
  constructor(private readonly httpClient: PingRepApiClient) {}

  async getProfile(profileId: string): Promise<ApiProfileResponse> {
    return this.httpClient.get<ApiProfileResponse>(
      `/api/v1/profiles/p/${profileId}`,
    );
  }

  async askAiRep(profileId: string, question: string): Promise<ApiAskResponse> {
    return this.httpClient.post<ApiAskResponse>(
      '/api/v1/public/ai/ask-sync',
      { profileId, question },
    );
  }

  async saveContact(input: ApiSaveContactInput): Promise<ApiSaveContactResponse> {
    return this.httpClient.post<ApiSaveContactResponse>(
      '/api/v1/public/save-contact',
      {
        profile_id: input.profile_id,
        name: input.name,
        email: input.email,
        tos_consent: input.tos_consent,
      },
    );
  }

  async searchProfiles(params: {
    role?: string;
    location?: string;
    query?: string;
    limit?: number;
  }): Promise<DirectorySearchResponse> {
    const searchParams = new URLSearchParams();
    if (params.role) searchParams.set('role', params.role);
    if (params.location) searchParams.set('location', params.location);
    if (params.query) searchParams.set('query', params.query);
    if (params.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return this.httpClient.get<DirectorySearchResponse>(
      `/api/v1/public/directory/search${qs ? `?${qs}` : ''}`,
    );
  }

  async getMyProfile(): Promise<OwnerProfileData> {
    const raw = await this.httpClient.get<ApiOwnerProfileResponse>('/api/v1/mcp/profile');
    return {
      id: raw.id,
      name: raw.name,
      title: raw.title,
      company: raw.company,
      bio: raw.bio,
      location: raw.location,
      contactEmail: raw.contactEmail,
      contactPhone: raw.contactPhone,
      slug: raw.slug,
      isPublic: raw.isPublic,
      mcpDiscoverable: raw.mcpDiscoverable,
      socialLinks: raw.socialLinks,
      skills: raw.skills.map((skill) => skill.name),
    };
  }

  async listMyContacts(params: { limit?: number; offset?: number }): Promise<OwnerContactListResponse> {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));
    const qs = searchParams.toString();
    return this.httpClient.get<OwnerContactListResponse>(
      `/api/v1/mcp/contacts${qs ? `?${qs}` : ''}`,
    );
  }

  async getContact(contactId: string): Promise<OwnerContactData> {
    return this.httpClient.get<OwnerContactData>(`/api/v1/mcp/contacts/${contactId}`);
  }

  async askMyAiRep(question: string): Promise<ApiAskResponse> {
    return this.httpClient.post<ApiAskResponse>('/api/v1/mcp/ai/ask-my-rep', { question });
  }

  async askContactAiRep(contactId: string, question: string): Promise<ApiAskResponse> {
    return this.httpClient.post<ApiAskResponse>(
      `/api/v1/mcp/contacts/${contactId}/ask-ai-rep`,
      { question },
    );
  }

  async draftMessageToContact(
    contactId: string,
    message: string,
  ): Promise<MessageDraftResponse> {
    return this.httpClient.post<MessageDraftResponse>(
      `/api/v1/mcp/contacts/${contactId}/draft-message`,
      { message },
    );
  }

  async sendMessageToContact(
    contactId: string,
    message: string,
    confirmSend: true,
  ): Promise<SendMessageResponse> {
    return this.httpClient.post<SendMessageResponse>(
      `/api/v1/mcp/contacts/${contactId}/send-message`,
      { message, confirmSend },
    );
  }

  async getRepAnalyticsSummary(days = 30): Promise<RepAnalyticsSummary> {
    return this.httpClient.get<RepAnalyticsSummary>(
      `/api/v1/mcp/analytics-summary?days=${days}`,
    );
  }
}
