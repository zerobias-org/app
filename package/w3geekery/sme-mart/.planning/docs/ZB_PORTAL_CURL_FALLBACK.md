# ZB Portal API curl Fallback

**Use when:** You need to query a ZB API path that is **not indexed in the zerobias MCP** (e.g., anything under the `portal` service). MCP covers `platform`, `hub`, `store`, `hydra`, `danaOld` — **not `portal`**. Calling `portal.*` operations via `zerobias_execute` returns `"Unknown service: portal"`.

**Do NOT use when:** MCP has the equivalent operation. The sanctioned path is always MCP first (see memory `feedback_mcp_is_sanctioned_path.md`). This recipe is a narrow fallback for portal-only endpoints, explicitly authorized by Clark on 2026-04-23.

---

## Recipe

Credentials live in `~/.config/mcp-zb/credentials.json`. Active profile determines URL + API key + org ID.

### One-shot POST (bash)

```bash
creds=$(cat ~/.config/mcp-zb/credentials.json)
profile=$(echo "$creds" | jq -r '.active')
apikey=$(echo "$creds" | jq -r ".profiles[\"$profile\"][\"api-key\"]")
orgid=$(echo "$creds"  | jq -r ".profiles[\"$profile\"][\"org-id\"]")
base=$(echo "$creds"   | jq -r ".profiles[\"$profile\"].url")

curl -s -X POST "$base/api/portal/<endpoint>?pageNumber=1&pageSize=200" \
  -H "Authorization: APIKey $apikey" \
  -H "Dana-Org-Id: $orgid" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{}' | jq '.'
```

### Notes on invocation

- **Response shape**: portal search endpoints return a **bare JSON array** (not `{items: [...], count}`). `.[0]` not `.items[0]`. Use `length` for count.
- **Body**: empty `{}` works for "get everything". Add search filters when needed (endpoint-specific).
- **HTTP method**: `*Search` endpoints are POST. GET returns null/empty for these.
- **Pagination**: `pageNumber` + `pageSize` as query params (1-indexed). Max page size appears generous (500+ works).
- **Page limit**: platform currently has hundreds of items in several catalogs — use `pageSize=500` if you want it all in one call.

---

## Known-good endpoints

| Endpoint | Method | Returns | Notes |
|---|---|---|---|
| `/api/portal/frameworkSearch` | POST | Framework list (~257 on UAT) | Fields: `id`, `code`, `name`, `standardId`, `standardCategory`, `status`, `internal`, `elementCount`, `hasElements`, `description`, `imageUrl`, `aliases` |
| `/api/portal/vendorSearch` | POST | Vendor list | Untested via curl, but referenced in `zb-org-vendor/CLAUDE.md` as `portal.Vendor.search` — shape likely mirrors `platform.Vendor.listVendors` |

Add new entries here as they are discovered. If a path works via MCP, don't add it here — record it in the ZB MCP memory/docs instead.

---

## Why this exists

- MCP index reports `847 operations` after `meta.reloadIndex` but zero are under `portal`.
- The UI calls `https://uat.zerobias.com/api/portal/frameworkSearch` directly — so the service is live and authoritative; it's just not represented in our MCP.
- For the SME Mart credentials-catalog research (2026-04-23), the framework inventory was needed to map our 130 certs to platform `Framework` IDs. MCP's `platform.Framework.list*` returned 0 items (and errored with `"No such OldFramework"`). The portal endpoint returned 257.
- Long-term fix: Kevin adds portal to ZB MCP. Short-term: this recipe.

---

## Discoverability

- Linked from: SME Mart `CLAUDE.md` → Quick Reference table → "ZB Portal API curl Fallback"
- Memory pointer: `reference_zb_mcp_no_portal_service.md`
- Related rules: `feedback_mcp_is_sanctioned_path.md` (narrow exception only)

If you find other ZB API paths that are only available via direct HTTP (not MCP), append them to the "Known-good endpoints" table above rather than starting a new doc.
