/**
 * Purpose: HTTP client wrapping fetch for PingRep API communication
 * Layer: Infrastructure
 * Dependencies: ApiError from errors/error-mapper
 * Exports: PingRepApiClient, ApiClientConfig
 * Size Target: 120 lines
 */

import { ApiError } from '../errors/error-mapper.js';

const DEFAULT_BASE_URL = 'https://api.pingrep.com';
const DEFAULT_TIMEOUT_MS = 30_000;
const USER_AGENT = 'pingrep-mcp-server/0.1.0';

export interface ApiClientConfig {
  readonly baseUrl?: string;
  readonly apiKey?: string;
  readonly bearerToken?: string;
}

/**
 * Thin HTTP client for the PingRep API.
 *
 * Responsibilities:
 * - Constructs full URLs from path segments
 * - Sets required headers (Content-Type, User-Agent, optional API key)
 * - Enforces a 30-second timeout via AbortController
 * - Throws ApiError on non-2xx responses for the error mapper to handle
 *
 * This client intentionally has no retry logic or caching (YAGNI).
 */
export class PingRepApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;
  private readonly bearerToken: string | undefined;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.apiKey = config.apiKey;
    this.bearerToken = config.bearerToken;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  private async request<T>(
    path: string,
    init: RequestInit,
  ): Promise<T> {
    const url = this.buildUrl(path);
    const headers = this.buildHeaders();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...init,
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await this.parseResponseBody(response);
        throw new ApiError(response.status, body);
      }

      return await response.json() as T;
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError(504, undefined, 'Request timed out');
      }

      throw new ApiError(
        503,
        undefined,
        error instanceof Error
          ? `Network error: ${error.message}`
          : 'Network error: unknown failure',
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private buildUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${normalizedPath}`;
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
    };

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }
    if (this.bearerToken) {
      headers.Authorization = `Bearer ${this.bearerToken}`;
    }

    return headers;
  }

  private async parseResponseBody(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      return undefined;
    }
  }
}
