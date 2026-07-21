/**
 * Purpose: Creates and configures the MCP server with tool registration
 * Layer: Presentation
 * Dependencies: MCP SDK (McpServer), domain tools, infrastructure
 * Exports: createServer, startServer
 * Size Target: 80 lines
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

import {
  askContactAiRepTool,
  getProfileTool,
  askAiRepTool,
  askMyAiRepTool,
  draftMessageToContactTool,
  getContactTool,
  getMyProfileTool,
  getRepAnalyticsSummaryTool,
  listMyContactsTool,
  saveContactTool,
  searchProfilesTool,
  sendMessageToContactTool,
} from '../domain/tools/index.js';
import type { ApiClient } from '../domain/types/index.js';
import {
  PingRepApiClient,
  PingRepApiAdapter,
  getAuthConfig,
} from '../infrastructure/index.js';
import { handleToolCall } from './handlers/tool-handler.js';

const SERVER_NAME = 'pingrep';
const SERVER_VERSION = '0.1.0';

// ── Server Factory ───────────────────────────────────────────────

export function createServer(apiClient: ApiClient): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
  );

  registerTool(server, apiClient, getMyProfileTool, { readOnlyHint: true });
  registerTool(server, apiClient, listMyContactsTool, { readOnlyHint: true });
  registerTool(server, apiClient, getContactTool, { readOnlyHint: true });
  registerTool(server, apiClient, askMyAiRepTool, { readOnlyHint: true });
  registerTool(server, apiClient, askContactAiRepTool, { readOnlyHint: true });
  registerTool(server, apiClient, draftMessageToContactTool, { readOnlyHint: false });
  registerTool(server, apiClient, sendMessageToContactTool, {
    destructiveHint: true,
    openWorldHint: true,
  });
  registerTool(server, apiClient, getRepAnalyticsSummaryTool, { readOnlyHint: true });

  // Backward-compatible public directory tools from the npm package.
  registerTool(server, apiClient, getProfileTool, { readOnlyHint: true });
  registerTool(server, apiClient, askAiRepTool, { readOnlyHint: true });
  registerTool(server, apiClient, saveContactTool, { openWorldHint: true });
  registerTool(server, apiClient, searchProfilesTool, { readOnlyHint: true });

  return server;
}

// ── Server Startup ───────────────────────────────────────────────

export async function startServer(): Promise<void> {
  const authConfig = getAuthConfig();
  const baseUrl = process.env.PINGREP_BASE_URL;

  const httpClient = new PingRepApiClient({
    baseUrl,
    apiKey: authConfig.apiKey,
    bearerToken: authConfig.bearerToken,
  });
  const apiClient = new PingRepApiAdapter(httpClient);

  const server = createServer(apiClient);
  const transport = new StdioServerTransport();

  console.error(`Starting ${SERVER_NAME} MCP server v${SERVER_VERSION}`);

  if (authConfig.isAuthenticated) {
    console.error('Authenticated mode: API key or bearer token configured');
  } else {
    console.error('Unauthenticated mode: only public endpoints available');
  }

  if (baseUrl) {
    console.error(`Base URL: ${baseUrl}`);
  }

  await server.connect(transport);
}

function registerTool(server: McpServer, apiClient: ApiClient, tool: {
  name: string;
  description: string;
  inputSchema: { shape: ZodRawShapeCompat };
}, annotations?: ToolAnnotations): void {
  server.registerTool(tool.name, {
    description: tool.description,
    inputSchema: tool.inputSchema.shape,
    annotations,
  }, async (args: Record<string, unknown> | undefined) => handleToolCall(apiClient, tool.name, args));
}
