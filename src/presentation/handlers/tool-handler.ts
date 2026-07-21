/**
 * Purpose: Dispatches MCP tool calls to use cases and formats responses
 * Layer: Presentation
 * Dependencies: Application use cases, domain tools, infrastructure errors
 * Exports: handleToolCall
 * Size Target: 100 lines
 */

import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { ZodError } from 'zod';

import {
  askAiRep,
  askContactAiRep,
  askMyAiRep,
  draftMessageToContact,
  getContact,
  getMyProfile,
  getProfile,
  getRepAnalyticsSummary,
  listMyContacts,
  saveContact,
  searchProfiles,
  sendMessageToContact,
} from '../../application/use-cases/index.js';
import {
  askContactAiRepTool,
  getProfileTool,
  askMyAiRepTool,
  askAiRepTool,
  draftMessageToContactTool,
  getContactTool,
  getMyProfileTool,
  getRepAnalyticsSummaryTool,
  listMyContactsTool,
  saveContactTool,
  searchProfilesTool,
  sendMessageToContactTool,
} from '../../domain/tools/index.js';
import type {
  ApiClient,
  AskAiRepResponse,
  DirectorySearchResponse,
  McpProfileData,
  MessageDraftResponse,
  OwnerContactData,
  OwnerContactListResponse,
  OwnerProfileData,
  RepAnalyticsSummary,
  SaveContactResponse,
  SendMessageResponse,
} from '../../domain/types/index.js';
import { ApiError, mapHttpErrorToMcp } from '../../infrastructure/index.js';

// ── Response Formatters ──────────────────────────────────────────

function formatProfile(profile: McpProfileData): string {
  const sections: string[] = [`# ${profile.name}`];

  if (profile.title) sections.push(`**Title:** ${profile.title}`);
  if (profile.company) sections.push(`**Company:** ${profile.company}`);
  if (profile.location) sections.push(`**Location:** ${profile.location}`);
  if (profile.bio) sections.push(`\n**Bio:**\n${profile.bio}`);

  if (profile.contactEmail || profile.contactPhone) {
    sections.push('\n## Contact');
    if (profile.contactEmail) sections.push(`- Email: ${profile.contactEmail}`);
    if (profile.contactPhone) sections.push(`- Phone: ${profile.contactPhone}`);
  }

  if (profile.skills.length > 0) {
    sections.push(`\n## Skills\n${profile.skills.join(', ')}`);
  }

  if (profile.socialLinks.length > 0) {
    sections.push('\n## Social Links');
    for (const link of profile.socialLinks) {
      sections.push(`- ${link.platform}: ${link.url}`);
    }
  }

  if (profile.workExperience.length > 0) {
    sections.push('\n## Work Experience');
    for (const exp of profile.workExperience) {
      const period = exp.endDate ? `${exp.startDate} - ${exp.endDate}` : `${exp.startDate} - Present`;
      sections.push(`- **${exp.title}** at ${exp.company} (${period})`);
    }
  }

  if (profile.education.length > 0) {
    sections.push('\n## Education');
    for (const edu of profile.education) {
      const period = [edu.startDate, edu.endDate].filter(Boolean).join(' - ');
      const periodSuffix = period ? ` (${period})` : '';
      sections.push(`- **${edu.degree}** at ${edu.school}${periodSuffix}`);
    }
  }

  return sections.join('\n');
}

function formatAiRepResponse(response: AskAiRepResponse): string {
  const parts: string[] = [response.answer];

  if (response.suggestedQuestions.length > 0) {
    parts.push('\n---\n**Suggested follow-up questions:**');
    for (const question of response.suggestedQuestions) {
      parts.push(`- ${question}`);
    }
  }

  if (response.remainingQuestions > 0) {
    parts.push(`\n_${response.remainingQuestions} questions remaining._`);
  }

  return parts.join('\n');
}

function formatSaveContact(response: SaveContactResponse): string {
  return response.message;
}

function formatSearchResults(response: DirectorySearchResponse): string {
  if (response.results.length === 0) {
    return 'No professionals found matching your search criteria. Try broadening your search.';
  }

  const lines: string[] = [
    `Found ${response.total} professional${response.total !== 1 ? 's' : ''}:\n`,
  ];

  for (const result of response.results) {
    const parts: string[] = [`**${result.name}**`];
    if (result.title) parts.push(`*${result.title}*`);
    if (result.company) parts.push(`at ${result.company}`);
    if (result.location) parts.push(`(${result.location})`);
    lines.push(`- ${parts.join(' \u2014 ')}`);
    if (result.activeIdentities.length > 0) {
      lines.push(`  Roles: ${result.activeIdentities.join(', ')}`);
    }
    lines.push(`  Profile: \`${result.slug}\``);
    lines.push('');
  }

  lines.push(
    'Use `get_profile` with the slug to see full details, or `ask_ai_rep` to chat with their AI representative.',
  );
  return lines.join('\n');
}

function formatOwnerProfile(profile: OwnerProfileData): string {
  const lines = [`# ${profile.name}`];
  if (profile.title) lines.push(`**Title:** ${profile.title}`);
  if (profile.company) lines.push(`**Company:** ${profile.company}`);
  if (profile.location) lines.push(`**Location:** ${profile.location}`);
  if (profile.bio) lines.push(`\n${profile.bio}`);
  if (profile.slug) lines.push(`\n**Public URL:** https://app.pingrep.com/p/${profile.slug}`);
  lines.push(`**Public:** ${profile.isPublic ? 'yes' : 'no'}`);
  lines.push(`**MCP Discoverable:** ${profile.mcpDiscoverable ? 'yes' : 'no'}`);
  if (profile.contactEmail) lines.push(`**Email:** ${profile.contactEmail}`);
  if (profile.contactPhone) lines.push(`**Phone:** ${profile.contactPhone}`);
  if (profile.skills.length > 0) lines.push(`\n**Skills:** ${profile.skills.join(', ')}`);
  if (profile.socialLinks.length > 0) {
    lines.push('\n## Social Links');
    for (const link of profile.socialLinks) lines.push(`- ${link.platform}: ${link.url}`);
  }
  return lines.join('\n');
}

function formatContact(contact: OwnerContactData): string {
  const lines = [`# ${contact.name}`];
  if (contact.title) lines.push(`**Title:** ${contact.title}`);
  if (contact.company) lines.push(`**Company:** ${contact.company}`);
  if (contact.email) lines.push(`**Email:** ${contact.email}`);
  if (contact.phone) lines.push(`**Phone:** ${contact.phone}`);
  lines.push(`**Contact ID:** ${contact.id}`);
  lines.push(`**Messaging available:** ${contact.userId ? 'yes' : 'no'}`);
  if (contact.socialLinks.length > 0) {
    lines.push('\n## Social Links');
    for (const link of contact.socialLinks) lines.push(`- ${link.platform}: ${link.url}`);
  }
  return lines.join('\n');
}

function formatContactList(response: OwnerContactListResponse): string {
  if (response.contacts.length === 0) {
    return 'No saved contacts yet.';
  }
  const lines = [`${response.total} saved contact${response.total === 1 ? '' : 's'}:\n`];
  for (const contact of response.contacts) {
    const titleCompany = [contact.title, contact.company].filter(Boolean).join(' at ');
    lines.push(`- **${contact.name}**${titleCompany ? `, ${titleCompany}` : ''}`);
    lines.push(`  Contact ID: \`${contact.id}\``);
    lines.push(`  Messaging: ${contact.userId ? 'available' : 'not linked'}`);
  }
  if (response.hasMore) lines.push('\nMore contacts are available with a larger offset.');
  return lines.join('\n');
}

function formatDraft(response: MessageDraftResponse): string {
  return [
    `Draft ready for ${response.recipientName}.`,
    `Contact ID: ${response.contactId}`,
    `Recipient User ID: ${response.recipientUserId}`,
    '',
    response.message,
    '',
    'This has not been sent. Ask the user to confirm before calling send_message_to_contact.',
  ].join('\n');
}

function formatSendMessage(response: SendMessageResponse): string {
  return response.sent
    ? `Message sent to ${response.recipientName}. Conversation ID: ${response.conversationId}`
    : 'Message was not sent.';
}

function formatAnalytics(response: RepAnalyticsSummary): string {
  const sourceLines = Object.entries(response.bySource).map(
    ([source, count]) => `- ${source}: ${count}`,
  );
  return [
    `# Rep Analytics (${response.periodDays} days)`,
    `Total views: ${response.totalViews}`,
    `Unique viewers: ${response.uniqueViewers}`,
    `QR scans: ${response.qrScans}`,
    `Saved contacts: ${response.savedCount}`,
    `Views this week: ${response.viewsThisWeek}`,
    `QR scans this week: ${response.qrScansThisWeek}`,
    sourceLines.length > 0 ? `\n## By Source\n${sourceLines.join('\n')}` : '',
  ].filter(Boolean).join('\n');
}

// ── Tool Dispatcher ──────────────────────────────────────────────

export async function handleToolCall(
  apiClient: ApiClient,
  toolName: string,
  args: Record<string, unknown> | undefined,
) {
  try {
    const text = await dispatchTool(apiClient, toolName, args ?? {});
    return { content: [{ type: 'text' as const, text }] };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw mapHttpErrorToMcp(error.status, error.body);
    }
    if (error instanceof ZodError) {
      const details = error.errors.map((e) => e.message).join('; ');
      throw new McpError(ErrorCode.InvalidParams, `Invalid arguments: ${details}`);
    }
    throw error;
  }
}

async function dispatchTool(
  apiClient: ApiClient,
  toolName: string,
  args: Record<string, unknown>,
): Promise<string> {
  switch (toolName) {
    case getProfileTool.name: {
      const input = getProfileTool.inputSchema.parse(args);
      const profile = await getProfile(apiClient, input);
      return formatProfile(profile);
    }
    case askAiRepTool.name: {
      const input = askAiRepTool.inputSchema.parse(args);
      const response = await askAiRep(apiClient, input);
      return formatAiRepResponse(response);
    }
    case saveContactTool.name: {
      const input = saveContactTool.inputSchema.parse(args);
      const response = await saveContact(apiClient, input);
      return formatSaveContact(response);
    }
    case searchProfilesTool.name: {
      const input = searchProfilesTool.inputSchema.parse(args);
      const response = await searchProfiles(apiClient, input);
      return formatSearchResults(response);
    }
    case getMyProfileTool.name: {
      getMyProfileTool.inputSchema.parse(args);
      return formatOwnerProfile(await getMyProfile(apiClient));
    }
    case listMyContactsTool.name: {
      const input = listMyContactsTool.inputSchema.parse(args);
      return formatContactList(await listMyContacts(apiClient, input));
    }
    case getContactTool.name: {
      const input = getContactTool.inputSchema.parse(args);
      return formatContact(await getContact(apiClient, input));
    }
    case askMyAiRepTool.name: {
      const input = askMyAiRepTool.inputSchema.parse(args);
      return formatAiRepResponse(await askMyAiRep(apiClient, input));
    }
    case askContactAiRepTool.name: {
      const input = askContactAiRepTool.inputSchema.parse(args);
      return formatAiRepResponse(await askContactAiRep(apiClient, input));
    }
    case draftMessageToContactTool.name: {
      const input = draftMessageToContactTool.inputSchema.parse(args);
      return formatDraft(await draftMessageToContact(apiClient, input));
    }
    case sendMessageToContactTool.name: {
      const input = sendMessageToContactTool.inputSchema.parse(args);
      return formatSendMessage(await sendMessageToContact(apiClient, input));
    }
    case getRepAnalyticsSummaryTool.name: {
      const input = getRepAnalyticsSummaryTool.inputSchema.parse(args);
      return formatAnalytics(await getRepAnalyticsSummary(apiClient, input));
    }
    default:
      throw new McpError(
        ErrorCode.InvalidParams,
        `Unknown tool: ${toolName}`,
      );
  }
}
