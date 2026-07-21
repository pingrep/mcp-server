# @pingrep/mcp-server

**Official PingRep MCP Server** for AI Representatives (Claude Desktop, Cursor, and other MCP clients).

| | |
|---|---|
| **npm** | `@pingrep/mcp-server` (publish in progress) |
| **Docs** | https://keynodex.com/docs/mcp/installation |
| **CLI** | https://github.com/pingrep/pingrep (`npx pingrep`) |
| **Product** | https://pingrep.com |

> Not the Pinboard bookmark CLI ([zoni/pingrep](https://github.com/zoni/pingrep)). This is the **PingRep AI Representative** platform MCP server.

---

## Quick Start

### Remote MCP Connector

Use the hosted connector URL in clients that support remote Streamable HTTP MCP connectors:

```text
https://mcp.pingrep.com/mcp
```

The remote connector is intended for PingRep Pro accounts. Owner-scoped tools require either a PingRep API key or a PingRep bearer token issued through an authenticated connector flow.

### Install

```bash
npx @pingrep/mcp-server
```

### Configure in Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "pingrep": {
      "command": "npx",
      "args": ["@pingrep/mcp-server"]
    }
  }
}
```

### Configure in VS Code (Copilot / Cline)

Add to `.vscode/mcp.json` in your project:

```json
{
  "servers": {
    "pingrep": {
      "command": "npx",
      "args": ["@pingrep/mcp-server"]
    }
  }
}
```

## Tools

### Owner-scoped Pro tools

These tools act through the authenticated PingRep user&apos;s relationship graph. They require Pro access and authentication.

| Tool | Description |
|------|-------------|
| `get_my_profile` | Return the authenticated user&apos;s PingRep profile |
| `list_my_contacts` | List saved contacts owned by the authenticated user |
| `get_contact` | Return one saved contact by ID |
| `ask_my_ai_rep` | Ask the authenticated user&apos;s own AI Representative |
| `ask_contact_ai_rep` | Ask a saved contact&apos;s AI Representative |
| `draft_message_to_contact` | Draft a message to a saved contact without sending |
| `send_message_to_contact` | Send a confirmed message to a saved contact with audit logging |
| `get_rep_analytics_summary` | Return a recent AI Rep analytics summary |

### get_profile

Get a professional profile by ID or username slug. Returns the person&apos;s name, title, company, bio, skills, work experience, education, and social links.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `profileId` | string | Yes | Profile identifier -- UUID or username slug (e.g. `"marcus"`) |

### ask_ai_rep

Ask an AI Representative about their professional background, expertise, or services. The AI Rep answers on behalf of the profile owner based on their professional identity.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `profileId` | string | Yes | Profile identifier -- UUID or username slug |
| `question` | string | Yes | Question to ask the AI Representative (max 500 chars) |

### save_contact

Save your contact information after interacting with an AI Representative. This lets the profile owner know you are interested in connecting.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `profileId` | string | Yes | Profile identifier -- UUID or username slug |
| `name` | string | Yes | Your full name |
| `email` | string | Yes | Your email address |
| `phone` | string | No | Your phone number |
| `notes` | string | No | A short note for the profile owner (max 500 chars) |

## Authentication

### Public Mode (default)

No API key needed. Public tools (`get_profile`, `ask_ai_rep`) work out of the box with standard rate limits.

### Authenticated Mode

Set the `PINGREP_API_KEY` environment variable for higher rate limits and access to all tools including `save_contact`.

```json
{
  "mcpServers": {
    "pingrep": {
      "command": "npx",
      "args": ["@pingrep/mcp-server"],
      "env": {
        "PINGREP_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Owner-scoped Pro tools can also use `PINGREP_BEARER_TOKEN` when running behind an OAuth-backed connector flow.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PINGREP_API_KEY` | No | -- | API key for authenticated mode |
| `PINGREP_BEARER_TOKEN` | No | -- | Bearer token for authenticated connector mode |
| `PINGREP_BASE_URL` | No | `https://api.pingrep.com` | Custom API URL |
| `PORT` | No | `3000` | Port for `npm run start:http` |

## Example Usage

Once configured, you can interact with public PingRep AI Representatives:

```
> Use the get_profile tool to look up the profile "marcus"

> Ask marcus's AI rep: "What services do you offer?"

> Save my contact info with marcus: John Doe, john@example.com
```

With a Pro-authenticated connector, you can also ask about your own profile, review saved contacts, draft outreach, and send contact messages after explicit confirmation.

## Message Send Safety

Current V1 behavior keeps message sending behind an explicit confirmation contract:

1. `draft_message_to_contact` returns the exact proposed message and does not send it.
2. Claude must ask the user to approve that exact message.
3. `send_message_to_contact` is rejected unless it includes `confirmSend: true`.
4. PingRep records the MCP tool call in the audit log.

Next safety step before broadly marketing send actions: replace direct connector sends with a PingRep-hosted pending-send flow. Claude should create a short-lived `pending_send`, return a secure PingRep approval link, and the PingRep UI should render a confirmation card with the exact message plus `Send` and `Cancel` buttons. The backend should deliver the message only after the authenticated user clicks `Send` in PingRep, with audit events for draft, approval, cancellation, expiration, and delivery.

## Architecture

The MCP server follows Clean Architecture with four layers:

```
src/
  domain/       # Tool definitions, types, interfaces
  application/  # Use cases (one per tool)
  infrastructure/
    api-client/ # HTTP client (PingRepApiClient) + adapter
    auth/       # API key handler
    errors/     # Error mapping (API errors -> MCP errors)
  presentation/ # MCP server setup, tool routing
  cli.ts        # Entry point
  http.ts       # Remote Streamable HTTP entry point
```

Key design decisions:
- Slug-or-UUID resolution happens server-side (users pass slugs from search results, backend resolves to UUIDs)
- Public tools work without authentication; owner-scoped tools require Pro authentication
- `send_message_to_contact` requires an explicit `confirmSend: true` argument before delivery; V2 should move final send approval into PingRep-hosted pending-send UI
- 30-second timeout on all API calls with AbortController
- Error mapper translates HTTP status codes to MCP error codes

## Testing

### Unit Tests

```bash
npm test          # Run all tests
npm run test:watch # Watch mode
```

Tests cover:
- `PingRepApiClient` -- URL building, headers, timeout handling, error mapping
- Tool handlers -- input validation, response formatting
- Error mapper -- HTTP-to-MCP error code translation

### E2E Verification (verified 2026-03-29)

All tools tested against the live API at `api.pingrep.com`:

| Tool | Status | Notes |
|------|--------|-------|
| `search_profiles` | Verified | Returns professionals by role/location/keyword |
| `get_profile` | Verified | Full profile with bio, skills, work history, social links |
| `ask_ai_rep` | Verified | AI Rep generates answers from professional context |
| `save_contact` | Verified | Correctly requires API key, validates input |

To run a manual e2e test:

```bash
npm run build

# Test server initialization
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | node dist/cli.js
# Expected: {"result":{"serverInfo":{"name":"pingrep","version":"0.1.0"},...}}
```

### Privacy and Discoverability

MCP tools only return profiles where BOTH settings are enabled:
- `is_public: true` -- profile is publicly visible
- `mcp_discoverable: true` -- owner opted into AI tool discovery

Profile owners control these from their PingRep dashboard.

## Development

```bash
npm install       # Install dependencies
npm run build     # Compile TypeScript
npm run dev       # Watch mode (tsc --watch)
npm run lint      # Type check (tsc --noEmit)
npm test          # Run tests
npm start         # Run the server
npm run start:http # Run the remote Streamable HTTP server
```

## Requirements

- Node.js 18 or later
- An MCP-compatible client (Claude Desktop, VS Code with Copilot, Cline, etc.)

## License

MIT
