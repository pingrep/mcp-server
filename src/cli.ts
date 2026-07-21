#!/usr/bin/env node
/**
 * Purpose: CLI entry point for the PingRep MCP server
 * Layer: Presentation (entry point)
 * Dependencies: presentation/server
 * Exports: None (executable)
 * Size Target: 25 lines
 */

import { startServer } from './presentation/server.js';

startServer().catch((error: unknown) => {
  console.error('Failed to start PingRep MCP server:', error);
  process.exit(1);
});
