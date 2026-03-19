# Restart Context — Test Hydra MCP (Take 2)

## What just happened

The ZB MCP server didn't have hydra registered as a service. Fixed it:

1. **Root cause:** `packages/mcp/src/services.ts` has a hardcoded `SERVICES` array listing all SDK services. Hydra was missing.
2. **Fix:** Added hydra entry to `SERVICES` array with `hydra.yml` spec and 14 tags (accessRule, alert, boundary, group, healthcheck, org, permission, principal, resource, resourceSelector, role, serviceAccount, tag, user).
3. **Rebuilt:** `npm run build` in `packages/mcp/` — `dist/services.js` now has 3 hydra references.
4. **SDK already works:** `sdk.hydra` accessor exists, `server.ts` uses `sdk[service]` dynamically at line 520 — no other changes needed.
5. **MCP process must restart** to pick up the new build — that's why we're restarting Claude Code.

## What to do now

1. **Test ONE hydra call first** — start with the simplest:
   ```
   zerobias_execute("hydra.Healthcheck.health")
   ```
2. **If it works** → run the other two:
   ```
   zerobias_execute("hydra.Tag.listTags", { pageNumber: 1, pageSize: 3 })
   zerobias_execute("hydra.Tag.searchTags", { pageNumber: 1, pageSize: 3, tagSearchBody: { name: "sme" } })
   ```
3. **If all pass** → hydra MCP is fully functional. Done.
3. **If "Unknown service: hydra"** → MCP server didn't restart. Check `which zb` still points to the workspace link, and verify `dist/services.js` has hydra references.
4. **If URL/404 errors** → `normalizeBaseUrl` in the SDK may not apply `/api` prefix. Check credentials URL in `~/.config/mcp-zb/credentials.json`.
5. **After confirming MCP works**, revert the old fallback changes in server.ts (if still present):
   ```
   cd ~/Projects/zb/clients && git diff packages/mcp/src/server.ts
   ```
   If there's a hydra fallback block from the previous session, revert it. The `services.ts` change is the ONLY change needed.
6. **Do NOT revert `services.ts`** — that's the real fix. Consider committing it and updating PR #14.

## Key state

- **Clients repo:** `~/Projects/zb/clients/` on `main`
- **Changed file:** `packages/mcp/src/services.ts` — added hydra service config (the fix)
- **Changed file (revert candidate):** `packages/mcp/src/server.ts` — may have old fallback code from previous session (not needed)
- **Global zb:** symlinked to `~/Projects/zb/clients/packages/mcp`
- **Credentials:** `~/.config/mcp-zb/credentials.json`, active profile: `prod`, URL: `https://api.app.zerobias.com`
- **SME Mart:** `~/Projects/zb/zerobias-org-forks/app/package/w3geekery/sme-mart/` on `poc/sme-mart`
- **PR #14:** https://github.com/zerobias-com/clients/pull/14
