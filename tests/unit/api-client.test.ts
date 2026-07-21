/**
 * Purpose: Unit tests for the PingRepApiClient HTTP client
 * Layer: Infrastructure (testing)
 * Dependencies: PingRepApiClient, ApiError
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { PingRepApiClient } from '../../src/infrastructure/api-client/client.js';
import { ApiError } from '../../src/infrastructure/errors/error-mapper.js';

const originalFetch = globalThis.fetch;

function mockFetch(impl: typeof globalThis.fetch): void {
  globalThis.fetch = impl;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('PingRepApiClient', () => {
  it('sends correct headers on GET requests', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    mockFetch(fetchSpy);

    const client = new PingRepApiClient({ baseUrl: 'https://api.test' });
    await client.get('/profiles/1');

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.test/profiles/1');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.headers['User-Agent']).toBe('pingrep-mcp-server/0.1.0');
  });

  it('sends JSON body on POST requests', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ saved: true }), { status: 200 }),
    );
    mockFetch(fetchSpy);

    const client = new PingRepApiClient({ baseUrl: 'https://api.test' });
    await client.post('/contacts', { name: 'Jane', email: 'jane@test.com' });

    const [, init] = fetchSpy.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ name: 'Jane', email: 'jane@test.com' }));
  });

  it('includes X-API-Key header when apiKey is provided', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );
    mockFetch(fetchSpy);

    const client = new PingRepApiClient({
      baseUrl: 'https://api.test',
      apiKey: 'secret-key-123',
    });
    await client.get('/data');

    const [, init] = fetchSpy.mock.calls[0];
    expect(init.headers['X-API-Key']).toBe('secret-key-123');
  });

  it('includes bearer authorization header when bearerToken is provided', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );
    mockFetch(fetchSpy);

    const client = new PingRepApiClient({
      baseUrl: 'https://api.test',
      bearerToken: 'jwt-token-123',
    });
    await client.get('/data');

    const [, init] = fetchSpy.mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer jwt-token-123');
  });

  it('throws ApiError with status on non-2xx response', async () => {
    mockFetch(vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: 'Not found' }), { status: 404 }),
    ));

    const client = new PingRepApiClient({ baseUrl: 'https://api.test' });

    try {
      await client.get('/missing');
      expect.unreachable('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(404);
      expect((error as ApiError).body).toEqual({ detail: 'Not found' });
    }
  });

  it('throws ApiError on abort (timeout)', async () => {
    mockFetch(vi.fn().mockImplementation((_url: string, init: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted', 'AbortError'));
        });
      });
    }));

    const client = new PingRepApiClient({ baseUrl: 'https://api.test' });

    try {
      await client.get('/slow-endpoint');
      expect.unreachable('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      const apiError = error as ApiError;
      expect(apiError.status).toBe(504);
      expect(apiError.message).toContain('timed out');
    }
  }, 35_000);
});
