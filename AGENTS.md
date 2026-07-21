# MCP Server Guidance

Applies to `mcp-server/` and its subtree.

## Stack

- TypeScript package `@pingrep/mcp-server`.
- Clean Architecture layout:
  - `src/domain/`: tool definitions and domain types.
  - `src/application/`: use cases.
  - `src/infrastructure/`: API client, auth, and error mapping.
  - `src/presentation/`: MCP server setup and tool routing.
  - `src/cli.ts`: package entry point.
- Public API defaults to `https://api.pingrep.com`; `PINGREP_BASE_URL` can override it.

## Commands

- Install deps: `npm install`
- Build: `npm run build`
- Typecheck/lint: `npm run lint`
- Tests: `npm test`
- Watch build: `npm run dev`
- Run compiled CLI: `npm start`

Run these from `mcp-server/`.

## Rules

- Keep tool schemas and domain types close to `src/domain/tools/`.
- Keep HTTP details in the API client and adapter. Use cases should not know transport details beyond interfaces.
- Preserve public unauthenticated behavior for safe read tools. `save_contact` and other write/private actions must require auth where the existing contract requires it.
- Map API errors through the existing error mapper rather than throwing raw HTTP errors.
- Maintain the privacy rule from the README: MCP tools only expose profiles that are public and MCP-discoverable.

## Verification

- For tool changes, run `npm run lint` and `npm test`.
- For CLI or packaging changes, also run `npm run build` and a minimal initialize request against `node dist/cli.js` if practical.
