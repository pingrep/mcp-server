/**
 * Use case: Ask a PingRep AI Representative a question.
 *
 * Layer: Application
 * Purpose: Forward a question to the synchronous AI endpoint and
 *          map the response to the domain AskAiRepResponse shape.
 * Dependencies: ApiClient (domain port), domain types
 * Exports: askAiRep
 * Target: <=50 lines
 */

import type {
  ApiClient,
  AskAiRepResponse,
} from "../../domain/types/index.js";
import type { AskAiRepInput } from "../../domain/tools/index.js";

/**
 * Execute the ask-ai-rep use case.
 *
 * Calls the non-streaming /ask-sync endpoint (designed for MCP
 * consumers that cannot handle SSE) and normalises the response
 * from snake_case API fields to camelCase domain types.
 *
 * @param client  - API client instance (injected, not imported)
 * @param input   - Validated tool input with profileId and question
 * @returns AI Representative answer with follow-up suggestions
 */
export async function askAiRep(
  client: ApiClient,
  input: AskAiRepInput,
): Promise<AskAiRepResponse> {
  const raw = await client.askAiRep(input.profileId, input.question);

  return {
    answer: raw.answer,
    suggestedQuestions: raw.suggested_questions ?? raw.suggestedQuestions ?? [],
    remainingQuestions: raw.remaining_questions ?? raw.remainingQuestions ?? 0,
  };
}
