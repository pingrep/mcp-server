/**
 * Purpose: Unit tests for the MCP tool-handler dispatch and formatting logic
 * Layer: Presentation (testing)
 * Dependencies: tool-handler, domain types, MCP SDK error codes
 */

import { describe, it, expect, vi } from 'vitest';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';

import { handleToolCall } from '../../src/presentation/handlers/tool-handler.js';
import type {
  ApiClient,
  ApiProfileResponse,
  ApiAskResponse,
  ApiSaveContactResponse,
} from '../../src/domain/types/index.js';
import { ApiError } from '../../src/infrastructure/errors/error-mapper.js';

function createMockApiClient(overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    getProfile: vi.fn(),
    askAiRep: vi.fn(),
    saveContact: vi.fn(),
    searchProfiles: vi.fn(),
    getMyProfile: vi.fn(),
    listMyContacts: vi.fn(),
    getContact: vi.fn(),
    askMyAiRep: vi.fn(),
    askContactAiRep: vi.fn(),
    draftMessageToContact: vi.fn(),
    sendMessageToContact: vi.fn(),
    getRepAnalyticsSummary: vi.fn(),
    ...overrides,
  };
}

const fullProfileResponse: ApiProfileResponse = {
  id: 'uuid-123',
  name: 'Jane Doe',
  title: 'Software Engineer',
  company: 'Keynodex',
  bio: 'Building great products.',
  location: 'New York',
  contactEmail: 'jane@example.com',
  contactPhone: '+1-555-0100',
  showEmail: true,
  showPhone: true,
  socialLinks: [{ platform: 'LinkedIn', url: 'https://linkedin.com/in/jane' }],
  workExperience: [{
    jobTitle: 'Senior Engineer',
    company: 'Keynodex',
    startDate: '2022-01',
    endDate: null,
  }],
  education: [{
    institution: 'MIT',
    degree: 'BS Computer Science',
    startDate: '2014',
    endDate: '2018',
  }],
  skills: [{ name: 'TypeScript' }, { name: 'Python' }],
};

describe('handleToolCall', () => {
  it('formats a full profile correctly', async () => {
    const client = createMockApiClient({
      getProfile: vi.fn().mockResolvedValue(fullProfileResponse),
    });

    const result = await handleToolCall(client, 'get_profile', { profileId: 'jane' });

    expect(result.content).toHaveLength(1);
    const text = result.content[0].text;
    expect(text).toContain('# Jane Doe');
    expect(text).toContain('**Title:** Software Engineer');
    expect(text).toContain('**Company:** Keynodex');
    expect(text).toContain('**Location:** New York');
    expect(text).toContain('Building great products.');
    expect(text).toContain('Email: jane@example.com');
    expect(text).toContain('Phone: +1-555-0100');
    expect(text).toContain('TypeScript, Python');
    expect(text).toContain('LinkedIn: https://linkedin.com/in/jane');
    expect(text).toContain('**Senior Engineer** at Keynodex (2022-01 - Present)');
    expect(text).toContain('**BS Computer Science** at MIT (2014 - 2018)');
  });

  it('formats an AI Rep answer with suggested questions', async () => {
    const aiResponse: ApiAskResponse = {
      answer: 'I specialize in distributed systems.',
      suggested_questions: ['What projects have you led?', 'What is your tech stack?'],
      remaining_questions: 3,
    };
    const client = createMockApiClient({
      askAiRep: vi.fn().mockResolvedValue(aiResponse),
    });

    const result = await handleToolCall(client, 'ask_ai_rep', {
      profileId: 'jane',
      question: 'What do you specialize in?',
    });

    const text = result.content[0].text;
    expect(text).toContain('I specialize in distributed systems.');
    expect(text).toContain('**Suggested follow-up questions:**');
    expect(text).toContain('- What projects have you led?');
    expect(text).toContain('- What is your tech stack?');
    expect(text).toContain('3 questions remaining.');
  });

  it('formats a save-contact success message', async () => {
    const saveResponse: ApiSaveContactResponse = { contactSaved: true };
    const client = createMockApiClient({
      saveContact: vi.fn().mockResolvedValue(saveResponse),
    });

    const result = await handleToolCall(client, 'save_contact', {
      profileId: 'jane',
      name: 'John Smith',
      email: 'john@example.com',
    });

    const text = result.content[0].text;
    expect(text).toContain('Contact saved successfully');
  });

  it('formats authenticated contact list results', async () => {
    const client = createMockApiClient({
      listMyContacts: vi.fn().mockResolvedValue({
        total: 1,
        hasMore: false,
        contacts: [{
          id: '11111111-1111-4111-8111-111111111111',
          profileId: '22222222-2222-4222-8222-222222222222',
          userId: '33333333-3333-4333-8333-333333333333',
          name: 'Morgan Lee',
          title: 'Founder',
          company: 'Studio',
          email: 'morgan@example.com',
          phone: null,
          socialLinks: [],
          profileAvailable: true,
        }],
      }),
    });

    const result = await handleToolCall(client, 'list_my_contacts', { limit: 10, offset: 20 });

    const text = result.content[0].text;
    expect(text).toContain('1 saved contact');
    expect(text).toContain('Morgan Lee');
    expect(text).toContain('Contact ID');
    expect(text).toContain('Messaging: available');
    expect(client.listMyContacts).toHaveBeenCalledWith({ limit: 10, offset: 20 });
  });

  it('throws McpError with InvalidParams for unknown tool', async () => {
    const client = createMockApiClient();

    await expect(
      handleToolCall(client, 'nonexistent_tool', {}),
    ).rejects.toThrow(McpError);

    try {
      await handleToolCall(client, 'nonexistent_tool', {});
    } catch (error) {
      expect(error).toBeInstanceOf(McpError);
      expect((error as McpError).code).toBe(ErrorCode.InvalidParams);
      expect((error as McpError).message).toContain('Unknown tool');
    }
  });

  it('maps ApiError to McpError', async () => {
    const client = createMockApiClient({
      getProfile: vi.fn().mockRejectedValue(new ApiError(404, { detail: 'Not found' })),
    });

    await expect(
      handleToolCall(client, 'get_profile', { profileId: 'missing' }),
    ).rejects.toThrow(McpError);

    try {
      await handleToolCall(client, 'get_profile', { profileId: 'missing' });
    } catch (error) {
      expect(error).toBeInstanceOf(McpError);
      expect((error as McpError).code).toBe(ErrorCode.InvalidParams);
    }
  });
});
