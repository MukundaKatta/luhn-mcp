# luhn-mcp

[![npm](https://img.shields.io/npm/v/@mukundakatta/luhn-mcp.svg)](https://www.npmjs.com/package/@mukundakatta/luhn-mcp)
[![mcp](https://img.shields.io/badge/protocol-MCP-blue.svg)](https://modelcontextprotocol.io)

MCP server: Luhn (mod-10) checksum tools. Used by credit cards, IMEIs,
Canadian SIN, US NPI, and many other ID schemes. No deps.

## Tools

- `verify` — `{ input: "4532015112830366" }` → `{ valid: true }`
- `checksum` — compute the check digit for an input that lacks one
- `complete` — append the check digit

Spaces and dashes in input are ignored.

## Configure

```json
{ "mcpServers": { "luhn": { "command": "npx", "args": ["-y", "@mukundakatta/luhn-mcp"] } } }
```

## License

MIT.
