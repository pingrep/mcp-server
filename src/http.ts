#!/usr/bin/env node
/**
 * HTTP entry point for the PingRep remote MCP server.
 */

import { closeHttpSessions, startHttpServer } from './presentation/http-server.js';

startHttpServer();

process.on('SIGINT', () => {
  closeHttpSessions()
    .catch((error: unknown) => {
      console.error('Failed to close MCP sessions:', error);
    })
    .finally(() => process.exit(0));
});

process.on('SIGTERM', () => {
  closeHttpSessions()
    .catch((error: unknown) => {
      console.error('Failed to close MCP sessions:', error);
    })
    .finally(() => process.exit(0));
});
