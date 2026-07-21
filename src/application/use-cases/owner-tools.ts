/**
 * Use cases for authenticated owner-scoped PingRep MCP tools.
 *
 * Layer: Application
 * Purpose: Delegate paid connector tools through the ApiClient port
 */

import type {
  ApiClient,
  ApiAskResponse,
  AskAiRepResponse,
  MessageDraftResponse,
  OwnerContactData,
  OwnerContactListResponse,
  OwnerProfileData,
  RepAnalyticsSummary,
  SendMessageResponse,
} from "../../domain/types/index.js";
import type {
  AskContactAiRepInput,
  AskMyAiRepInput,
  DraftMessageToContactInput,
  GetContactInput,
  GetRepAnalyticsSummaryInput,
  ListMyContactsInput,
  SendMessageToContactInput,
} from "../../domain/tools/index.js";

function toAskAiRepResponse(raw: ApiAskResponse): AskAiRepResponse {
  return {
    answer: raw.answer,
    suggestedQuestions: raw.suggested_questions ?? raw.suggestedQuestions ?? [],
    remainingQuestions: raw.remaining_questions ?? raw.remainingQuestions ?? 0,
  };
}

export function getMyProfile(client: ApiClient): Promise<OwnerProfileData> {
  return client.getMyProfile();
}

export function listMyContacts(
  client: ApiClient,
  input: ListMyContactsInput,
): Promise<OwnerContactListResponse> {
  return client.listMyContacts({ limit: input.limit, offset: input.offset });
}

export function getContact(
  client: ApiClient,
  input: GetContactInput,
): Promise<OwnerContactData> {
  return client.getContact(input.contactId);
}

export async function askMyAiRep(
  client: ApiClient,
  input: AskMyAiRepInput,
): Promise<AskAiRepResponse> {
  return toAskAiRepResponse(await client.askMyAiRep(input.question));
}

export async function askContactAiRep(
  client: ApiClient,
  input: AskContactAiRepInput,
): Promise<AskAiRepResponse> {
  return toAskAiRepResponse(await client.askContactAiRep(input.contactId, input.question));
}

export function draftMessageToContact(
  client: ApiClient,
  input: DraftMessageToContactInput,
): Promise<MessageDraftResponse> {
  return client.draftMessageToContact(input.contactId, input.message);
}

export function sendMessageToContact(
  client: ApiClient,
  input: SendMessageToContactInput,
): Promise<SendMessageResponse> {
  return client.sendMessageToContact(input.contactId, input.message, input.confirmSend);
}

export function getRepAnalyticsSummary(
  client: ApiClient,
  input: GetRepAnalyticsSummaryInput,
): Promise<RepAnalyticsSummary> {
  return client.getRepAnalyticsSummary(input.days);
}
