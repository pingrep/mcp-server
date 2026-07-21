/**
 * Purpose: Unit tests for the HTTP-to-MCP error mapper
 * Layer: Infrastructure (testing)
 * Dependencies: mapHttpErrorToMcp, MCP SDK error codes
 */

import { describe, it, expect } from 'vitest';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';

import { mapHttpErrorToMcp } from '../../src/infrastructure/errors/error-mapper.js';

describe('mapHttpErrorToMcp', () => {
  it('maps 404 to InvalidParams', () => {
    const error = mapHttpErrorToMcp(404);

    expect(error).toBeInstanceOf(McpError);
    expect(error.code).toBe(ErrorCode.InvalidParams);
    expect(error.message).toContain('not found');
  });

  it('maps 429 to InvalidRequest with retryAfterSeconds', () => {
    const error = mapHttpErrorToMcp(429);

    expect(error).toBeInstanceOf(McpError);
    expect(error.code).toBe(ErrorCode.InvalidRequest);
    expect(error.message).toContain('Rate limit');

    const data = (error as McpError & { data: unknown }).data as
      Record<string, unknown> | undefined;
    expect(data).toBeDefined();
    expect(data?.retryAfterSeconds).toBe(60);
  });

  it('maps 500 to InternalError', () => {
    const error = mapHttpErrorToMcp(500);

    expect(error).toBeInstanceOf(McpError);
    expect(error.code).toBe(ErrorCode.InternalError);
  });

  it('maps 401 to InvalidParams', () => {
    const error = mapHttpErrorToMcp(401);

    expect(error).toBeInstanceOf(McpError);
    expect(error.code).toBe(ErrorCode.InvalidParams);
    expect(error.message).toContain('API key');
  });

  it('extracts detail from response body when present', () => {
    const error = mapHttpErrorToMcp(400, { detail: 'Email is required' });

    expect(error.code).toBe(ErrorCode.InvalidParams);
    expect(error.message).toContain('Email is required');
  });

  it('falls back to default message when body has no detail', () => {
    const error = mapHttpErrorToMcp(400, { error: 'something' });

    expect(error.code).toBe(ErrorCode.InvalidParams);
    expect(error.message).toContain('Bad request');
  });
});
