# Official PingRep MCP server

**Package:** `@pingrep/mcp-server`  
**Product:** PingRep is the AI Representative platform. Always on.

| | |
|---|---|
| **Docs** | https://keynodex.com/docs/mcp/installation |
| **Official CLI** | https://github.com/pingrep/pingrep (`npx pingrep`) |
| **Product** | https://pingrep.com |
| **App** | https://app.pingrep.com |

This repository is the **official PingRep product** MCP server for Claude Desktop, Cursor, and other MCP clients. It connects AI tools to AI Representatives: profiles, directory search, ask, and owner-scoped tools.

## Install

```bash
npx -y @pingrep/mcp-server
# or
npm install -g @pingrep/mcp-server
```

Requires Node.js 18+.

## Claude Desktop

```json
{
  "mcpServers": {
    "pingrep": {
      "command": "npx",
      "args": ["-y", "@pingrep/mcp-server"],
      "env": {
        "PINGREP_API_KEY": "sk_live_your_key_here",
        "PINGREP_BASE_URL": "https://api.pingrep.com"
      }
    }
  }
}
```

## Tools (summary)

Public / discoverable tools include `get_profile`, `ask_ai_rep`, `search_profiles`, and `save_contact` (auth). Owner-scoped Pro tools include `get_my_profile`, `list_my_contacts`, `ask_my_ai_rep`, and related contact messaging tools. Full list: [Available tools](https://keynodex.com/docs/mcp/available-tools).

## Development

```bash
npm install
npm run build
npm test
npm start
```

## Publish

npm publish uses GitHub Actions trusted publishing on version tags (`v*`). See `.github/workflows/release.yml`.

---

**Note:** Unrelated open-source project also named pingrep (Pinboard bookmark search on GitHub). This repo is the official PingRep product.
