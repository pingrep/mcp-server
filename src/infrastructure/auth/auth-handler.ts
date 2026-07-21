/**
 * Purpose: Reads API key from environment and provides auth configuration
 * Layer: Infrastructure
 * Dependencies: None (reads process.env)
 * Exports: AuthConfig, getAuthConfig
 * Size Target: 40 lines
 */

export interface AuthConfig {
  readonly apiKey: string | undefined;
  readonly bearerToken: string | undefined;
  readonly isAuthenticated: boolean;
}

/**
 * Reads the PingRep API key from the PINGREP_API_KEY environment variable.
 *
 * When no API key is set, the MCP server operates in unauthenticated mode.
 * Public endpoints (profile lookup, AI chat) work without authentication.
 * Authenticated endpoints (lead capture) require the key to be present.
 */
export function getAuthConfig(): AuthConfig {
  const apiKey = process.env.PINGREP_API_KEY;
  const bearerToken = process.env.PINGREP_BEARER_TOKEN;

  return {
    apiKey,
    bearerToken,
    isAuthenticated: Boolean(apiKey || bearerToken),
  };
}
