/**
 * Streamable HTTP entrypoint for remote PingRep MCP connectors.
 *
 * Layer: Presentation
 * Purpose: Expose the MCP server over /mcp for Claude and MCP-compatible clients
 */

import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http';

import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

import { PingRepApiAdapter, PingRepApiClient } from '../infrastructure/index.js';
import { createServer } from './server.js';

const DEFAULT_PORT = 3000;

interface AuthHeaders {
  apiKey?: string;
  bearerToken?: string;
}

interface McpHttpRequest extends IncomingMessage {
  body?: unknown;
  headers: IncomingHttpHeaders;
}

interface McpHttpResponse extends ServerResponse {
  json(body: unknown): this;
  send(body: string): this;
  status(code: number): this;
}

interface McpSession {
  transport: StreamableHTTPServerTransport;
  server: ReturnType<typeof createServer>;
}

const sessions = new Map<string, McpSession>();
const DEFAULT_PUBLIC_MCP_URL = 'https://mcp.pingrep.com/mcp';
const DEFAULT_AUTH_SERVER_URL = 'https://api.pingrep.com';
const MCP_SCOPES = ['read:profile', 'read:contacts', 'write:contacts', 'read:analytics'];
const PROTECTED_TOOLS = new Set([
  'get_my_profile',
  'list_my_contacts',
  'get_contact',
  'ask_my_ai_rep',
  'ask_contact_ai_rep',
  'draft_message_to_contact',
  'send_message_to_contact',
  'get_rep_analytics_summary',
]);

function firstHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getAuthHeaders(headers: IncomingHttpHeaders): AuthHeaders {
  const explicitApiKey = firstHeader(headers['x-api-key']);
  if (explicitApiKey) return { apiKey: explicitApiKey };

  const authorization = firstHeader(headers.authorization);
  const bearerPrefix = 'Bearer ';
  if (!authorization?.startsWith(bearerPrefix)) return {};

  const token = authorization.slice(bearerPrefix.length).trim();
  if (!token) return {};
  return token.startsWith('kc_') ? { apiKey: token } : { bearerToken: token };
}

function createApiClient(auth: AuthHeaders): PingRepApiAdapter {
  const httpClient = new PingRepApiClient({
    baseUrl: process.env.PINGREP_BASE_URL,
    apiKey: auth.apiKey,
    bearerToken: auth.bearerToken,
  });
  return new PingRepApiAdapter(httpClient);
}

function publicMcpUrl(): URL {
  return new URL(process.env.MCP_PUBLIC_URL ?? DEFAULT_PUBLIC_MCP_URL);
}

function authServerUrl(): string {
  return (process.env.PINGREP_AUTH_SERVER_URL ?? DEFAULT_AUTH_SERVER_URL).replace(/\/+$/, '');
}

function protectedResourceMetadataPath(): string {
  const pathname = publicMcpUrl().pathname;
  return `/.well-known/oauth-protected-resource${pathname === '/' ? '' : pathname}`;
}

function protectedResourceMetadataUrl(): string {
  const url = publicMcpUrl();
  url.pathname = protectedResourceMetadataPath();
  url.search = '';
  url.hash = '';
  return url.href;
}

function protectedResourceMetadata(): object {
  return {
    resource: publicMcpUrl().href,
    authorization_servers: [authServerUrl()],
    scopes_supported: MCP_SCOPES,
    resource_name: 'PingRep AI Representative',
    resource_documentation: 'https://pingrep.com',
  };
}

function callsProtectedTool(body: unknown): boolean {
  const messages = Array.isArray(body) ? body : [body];
  for (const message of messages) {
    if (!message || typeof message !== 'object') continue;
    const rpc = message as { method?: unknown; params?: { name?: unknown } };
    if (
      rpc.method === 'tools/call' &&
      typeof rpc.params?.name === 'string' &&
      PROTECTED_TOOLS.has(rpc.params.name)
    ) {
      return true;
    }
  }
  return false;
}

async function bearerTokenIsValid(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${authServerUrl()}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.status !== 401;
  } catch {
    return true;
  }
}

async function authCanUseProtectedTools(auth: AuthHeaders): Promise<boolean> {
  if (auth.apiKey) return true;
  if (!auth.bearerToken) return false;
  return bearerTokenIsValid(auth.bearerToken);
}

function sendAuthChallenge(res: McpHttpResponse): void {
  const authenticate = [
    'Bearer error="invalid_token"',
    'error_description="Authentication required for PingRep MCP"',
    `resource_metadata="${protectedResourceMetadataUrl()}"`,
    `scope="${MCP_SCOPES.join(' ')}"`,
  ].join(', ');
  res
    .status(401)
    .setHeader('WWW-Authenticate', authenticate)
    .json({
      error: 'invalid_token',
      error_description: 'Authentication required for PingRep MCP',
    });
}

function jsonRpcError(message: string, code = -32000): object {
  return {
    jsonrpc: '2.0',
    error: { code, message },
    id: null,
  };
}

export function startHttpServer(): void {
  const app = createMcpExpressApp({ host: '0.0.0.0' });

  app.get('/health', (_req: McpHttpRequest, res: McpHttpResponse) => {
    res.json({ status: 'ok', endpoint: '/mcp' });
  });

  app.get('/.well-known/oauth-protected-resource', (_req: McpHttpRequest, res: McpHttpResponse) => {
    res.json(protectedResourceMetadata());
  });

  app.get(protectedResourceMetadataPath(), (_req: McpHttpRequest, res: McpHttpResponse) => {
    res.json(protectedResourceMetadata());
  });

  app.post('/mcp', async (req: McpHttpRequest, res: McpHttpResponse) => {
    try {
      const auth = getAuthHeaders(req.headers);
      if (callsProtectedTool(req.body) && !(await authCanUseProtectedTools(auth))) {
        sendAuthChallenge(res);
        return;
      }

      const sessionId = firstHeader(req.headers['mcp-session-id']);
      if (sessionId) {
        res.status(400).json(jsonRpcError('Bad Request: no valid MCP session'));
        return;
      }

      const apiClient = createApiClient(auth);
      const server = createServer(apiClient);
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      await server.close();
      await transport.close();
    } catch (error) {
      console.error('Error handling MCP HTTP request:', error);
      if (!res.headersSent) {
        res.status(500).json(jsonRpcError('Internal server error', -32603));
      }
    }
  });

  app.get('/mcp', async (req: McpHttpRequest, res: McpHttpResponse) => {
    const sessionId = firstHeader(req.headers['mcp-session-id']);
    const session = sessionId ? sessions.get(sessionId) : undefined;
    if (!session) {
      res.status(400).send('Invalid or missing MCP session ID');
      return;
    }
    await session.transport.handleRequest(req, res);
  });

  app.delete('/mcp', async (req: McpHttpRequest, res: McpHttpResponse) => {
    const sessionId = firstHeader(req.headers['mcp-session-id']);
    const session = sessionId ? sessions.get(sessionId) : undefined;
    if (session && sessionId) {
      await session.transport.close();
      await session.server.close();
      sessions.delete(sessionId);
    }
    res.status(204).end();
  });

  const port = Number.parseInt(process.env.PORT ?? String(DEFAULT_PORT), 10);
  app.listen(port, '0.0.0.0', (error?: Error) => {
    if (error) {
      console.error('Failed to start PingRep HTTP MCP server:', error);
      process.exit(1);
    }
    console.log(`PingRep MCP HTTP server listening on port ${port}`);
  });
}

export async function closeHttpSessions(): Promise<void> {
  for (const [sessionId, session] of sessions.entries()) {
    await session.transport.close();
    await session.server.close();
    sessions.delete(sessionId);
  }
}
