# Hub Wiring Audit — 2026-04-22

**Scope:** Phase 0 of `.planning/phases/neon-via-hub-wireup.md`. Determine whether the existing `SmeMartDbService` Hub code path is production-ready against `@auditlogic/module-auditmation-generic-sql@0.5.0` on ZB-native hosting (no Vercel proxy).

**Verdict:** ✅ **GO with one recommended polish.** Wiring is fundamentally correct and ZB-convention-compliant. Phase 1 can proceed. One optional refactor noted for consistency.

---

## What was audited

- `src/app/core/services/sme-mart-db.service.ts` (456 lines)
- `src/environments/environment.{ts,uat.ts,prod.ts,vercel.ts,stack.ts}`
- `middleware.ts` + `vercel.json` (context for the current Vercel stopgap)
- Installed SDK surface:
  - `@zerobias-org/data-utils@1.0.32`
  - `@zerobias-org/module-interface-dataproducer-hub-sdk@1.2.32`
  - `@zerobias-com/zerobias-client@1.1.32` (vanilla — has `getZerobiasClientUrl`)
  - `@zerobias-com/zerobias-angular-client@1.1.31` (wrapper)
- Generic SQL 0.5.0 op surface (the 26 ops enumerated in today's `hub.Module.listOperations` output)
- Reference impl: `package/zerobias/data-explorer/context/DataExplorerContext.tsx`

## SDK-op alignment (service call → 0.5.0 op)

| Service method | SDK accessor | 0.5.0 op | Verified today |
|----------------|-------------|----------|----------------|
| `connect(…)` → `connectHub` | `DataProducerClient.connect({ server, targetId })` | handshake | ✅ (via `hub.Connection.connect`/`reverify`) |
| `getRoot()` | `client.objects.getRoot()` | `getRootObject` | ✅ |
| `getChildren(id)` | `client.objects.getChildren(id)` | `getChildren` | ✅ |
| `resolveTableId(name)` | chained `getChildren` calls | `getChildren` | ✅ (tree walked: /, /db:neondb, /db:neondb/schema:public) |
| `listRows` | `client.collections.getCollectionElements(id, opts)` | `getCollectionElements` | ✅ |
| `searchRows` | `client.collections.searchCollectionElements(id, filter, opts)` | `searchCollectionElements` | ⚠ not exercised today — needs Phase 3 validation with RFC4515 filter (e.g. `(id=…)`) |
| `getRow` | reuses `searchRows` with `(id=…)` | `searchCollectionElements` | ⚠ same as above |
| `getRowByKey` | `collectionsApi.getCollectionElement(id, rowKey)` | `getCollectionElement` | ⚠ not exercised today — Phase 3 |
| `createRow` | `collectionsApi.addCollectionElement(id, data)` | `addCollectionElement` | ⚠ Phase 3 — needs readwrite role |
| `updateRow` | `collectionsApi.updateCollectionElement(id, rowKey, data)` | `updateCollectionElement` | ⚠ Phase 3 |
| `deleteRow` | `collectionsApi.deleteCollectionElement(id, rowKey)` | `deleteCollectionElement` | ⚠ Phase 3 |
| `getTableSchema` | `client.schemas.getSchema(schemaId)` | `getSchema` | ⚠ Phase 3 |

**No deprecated or renamed ops.** Every method the service uses maps to an op present in 0.5.0's 26-op list. `module-interface-dataproducer-hub-sdk@1.2.32` is the typed client SDK matching the module's op surface; names and shapes line up.

## Server URL

**Current code (line 104):**
```typescript
const server = new ZbURL(`${window.location.origin}/api/hub`);
```

**SDK-helper equivalent (what data-explorer does):**
```typescript
import { getZerobiasClientUrl } from '@zerobias-com/zerobias-client';
const server = getZerobiasClientUrl('hub', /* isApiURL */ true, /* isLocalDev */ environment.isLocalDev);
// Produces: `${location.protocol}//${location.host}/api/hub`
```

**Finding:** The `/api/hub` path is standard ZeroBias convention — confirmed by reading the SDK helper's implementation (`zerobias-client-api.js`). On the ZB-native published deployment (`app.zerobias.com/{basePath}/api/hub/*`), the edge/platform handles these requests directly; browser authenticates via same-origin Dana session cookies; SDK adds `dana-org-id` header from `sessionStorage['zb-current-dana-org-id']`. No proxy, no API key in the client.

**Recommended polish (non-blocking):** Refactor line 104 to use `getZerobiasClientUrl('hub', true, environment.isLocalDev)`. Advantages:
1. Matches data-explorer reference pattern.
2. `directToDev` flag (4th arg) available for future scenarios where localhost wants to talk directly to UAT.
3. Consistent with how `document.service.ts` already uses this helper.

Not a blocker for Phase 1 — the hardcoded URL is functionally identical to the helper's output in the published path.

## Auth flow audit (ZB-native only)

- Browser: Dana session cookies (same-origin) + `dana-org-id` header (set by SDK from sessionStorage)
- Server-side injection: none — direct to `app.zerobias.com/api/hub/*`
- **No credentials in browser code.** `sme-mart-db.service.ts` does not reference any API key env var.

**Gotcha confirmed (via memory `project_sme_mart_schema_live.md`-style dana-org-id notes):** The SDK manages `dana-org-id` client-side from `sessionStorage['zb-current-dana-org-id']`. Wrong/missing value → Hub queries return empty sets silently. If Phase 3 finds zero rows where rows should exist, check that sessionStorage first.

## Env-file inventory (for Phase 2 scope)

| File | Status | Action in plan |
|------|--------|----------------|
| `environment.ts` (dev) | `dbMode: 'neon'`, stale `smeMartConnectionId` | Update UUID to `5ae47aa2-...` for parity/opt-in; leave `dbMode: 'neon'` per Clark's call (b) |
| `environment.uat.ts` (ZB-native UAT) | `dbMode: 'neon'`, empty UUID, comment "Switch to 'hub' when Hub Module connection is ready" | **Flip to `'hub'` + set UUID** — this is Phase 2's core edit |
| `environment.prod.ts` (ZB-native prod) | `dbMode: 'hub'` already, empty UUID | Leave `dbMode: 'hub'`; keep empty UUID + TODO — prod connection is Kevin's follow-up |
| `environment.stack.ts` | `dbMode: 'neon'` | Untouched (uses local PG in zbb stack, not Hub) |
| `environment.vercel.ts` | — | Out of scope. Vercel removal tracked separately. |

## Filter dialect (searchCollectionElements)

Service uses RFC4515 (LDAP filter) syntax: `(id=rowId)`, `(&(a=b)(c=d))`, etc. See the `rfc4515ToSql` helper at line 355 (that's the Neon-mode fallback; Hub mode passes the filter string straight through).

**Unknown until Phase 3:** whether generic-sql 0.5.0's `searchCollectionElements` parses RFC4515 identically. The DataProducer interface documents RFC4515 support, and we've confirmed `searchCollectionElements` exists in 0.5.0's op list, but the raw string hasn't been exercised end-to-end today.

**Phase 3 mitigation:** explicit test — `this.db.getRow('categories', <known_id>)` → asserts parse succeeds and returns the row. If it fails, fallback is to rewrite `getRow` to use `getCollectionElement(id, rowKey)` directly (already exposed as `getRowByKey`).

## Bit-rot items actually found

1. **Stale placeholder UUID** `e3c874f5-5fd8-4fbc-8120-19861e28b19e` in `environment.ts`. Not our current connection (`5ae47aa2-...`). Phase 2 fixes.
2. **Partial deprecation docblock** at top of `sme-mart-db.service.ts` (lines 9-34) is accurate about Pipeline/GQL migration but pre-dates today's connection setup. Phase 6 will update it.
3. **`connectHub` hardcodes the URL string** instead of using `getZerobiasClientUrl`. Cosmetic; functionally equivalent. Recommend polish inline with Phase 2 or Phase 3.

## Open items that do NOT block Phase 1

- [ ] Polish `connectHub` to use `getZerobiasClientUrl('hub', true, env.isLocalDev)` — recommend doing it as part of Phase 2's config PR.
- [ ] Verify RFC4515 filter parsing end-to-end in Phase 3.

## Go/No-Go

**GO.** Phase 1 (Neon readwrite role + Hub secret swap) starts next. Phase 2 includes the optional `getZerobiasClientUrl` polish as a side-edit in the same commit as the env-flip. No blocking bit-rot; all SDK ops map cleanly to 0.5.0.
