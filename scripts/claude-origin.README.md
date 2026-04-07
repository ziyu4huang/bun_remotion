# claude-origin — Setup & Reproducibility Notes

`claude-origin.sh` / `claude-origin.ps1` launch the stock Claude CLI with a
clean environment (all GLM/Z.AI overrides stripped, `CLAUDE_CONFIG_DIR` reset
to `~/.claude`).

---

## Z.AI MCP Servers (`~/.claude.json`)

Two Z.AI MCP servers are registered globally in `~/.claude.json` under
`"mcpServers"`. They authenticate via the `Z_AI_API_KEY` shell environment
variable — **no hardcoded token in the file**.

```json
"mcpServers": {
  "web-search-prime": {
    "type": "http",
    "url": "https://api.z.ai/api/mcp/web_search_prime/mcp",
    "headers": {
      "Authorization": "Bearer ${Z_AI_API_KEY}"
    }
  },
  "web-reader": {
    "type": "http",
    "url": "https://api.z.ai/api/mcp/web_reader/mcp",
    "headers": {
      "Authorization": "Bearer ${Z_AI_API_KEY}"
    }
  }
}
```

### To reproduce on a new machine

1. Obtain your Z.AI API key from the Z.AI dashboard.

2. Export it in your shell profile (`~/.zshrc` or `~/.bashrc`):

   ```sh
   export Z_AI_API_KEY=<your-z-ai-api-key>
   ```

3. Merge the `mcpServers` block above into `~/.claude.json` (or add it if
   `"mcpServers"` doesn't exist yet).

4. Restart Claude Code — it will interpolate `${Z_AI_API_KEY}` at startup.

### Notes

- `claude-origin.sh` **does not unset** `Z_AI_API_KEY` intentionally — the
  MCP servers are part of stock Claude, not the GLM layer.
- The servers provide `web_search_prime` and `web_reader` tools inside Claude
  Code sessions.
