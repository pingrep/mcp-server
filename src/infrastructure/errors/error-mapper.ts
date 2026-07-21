/**
 * Purpose: Maps HTTP errors to MCP SDK error codes and defines API error type
 * Layer: Infrastructure
 * Dependencies: @modelcontextprotocol/sdk
 * Exports: ApiError, mapHttpErrorToMcp
 * Size Target: 60 lines
 */

import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

/**
 * Structured error thrown by the API client on non-2xx responses.
 * Carries the HTTP status and parsed response body so the error mapper
 * can produce a meaningful MCP error for the caller.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message?: string,
  ) {
    super(message ?? `API request failed with status ${status}`);
    this.name = 'ApiError';
  }
}

/**
 * Translates an HTTP status code into the appropriate MCP SDK error.
 *
 * The mapping follows MCP conventions:
 * - Client errors (4xx) map to InvalidParams or InvalidRequest
 * - Server errors (5xx) map to InternalError
 * - Rate limits include a retry hint in the error data
 */
export function mapHttpErrorToMcp(status: number, body?: unknown): McpError {
  const detail = extractDetail(body);

  switch (status) {
    case 400:
      return new McpError(ErrorCode.InvalidParams, detail ?? 'Bad request');
    case 401:
    case 403:
      return new McpError(ErrorCode.InvalidParams, 'Invalid or missing API key');
    case 404:
      return new McpError(ErrorCode.InvalidParams, detail ?? 'Profile not found');
    case 422:
      return new McpError(ErrorCode.InvalidParams, detail ?? 'Validation failed');
    case 429:
      return new McpError(
        ErrorCode.InvalidRequest,
        'Rate limit exceeded. Try again later.',
        { retryAfterSeconds: 60 },
      );
    case 502:
      return new McpError(ErrorCode.InternalError, 'AI agent could not generate a response');
    case 504:
      return new McpError(ErrorCode.InternalError, 'Request timed out. Please try again.');
    default:
      return new McpError(ErrorCode.InternalError, 'Service temporarily unavailable');
  }
}

function extractDetail(body: unknown): string | undefined {
  if (body !== null && typeof body === 'object' && 'detail' in body) {
    const detail = (body as { detail: unknown }).detail;
    return typeof detail === 'string' ? detail : undefined;
  }
  return undefined;
}
