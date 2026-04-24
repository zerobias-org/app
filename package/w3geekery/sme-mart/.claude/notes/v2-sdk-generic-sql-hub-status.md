# Generic SQL Hub Module v2 SDK — publish-and-consume tracker

**Created:** 2026-04-23 (Clark direction)
**Updated:** 2026-04-23 (Chris relayed package-name change + v2 publication)
**Status:** ⛔ DO NOT UPGRADE. v2 published but is NOT a drop-in fix for the write workaround. Working tree REVERTED to v1 on 2026-04-23 after investigation. Awaiting backend (module-side) fix from Chris/Kevin. See "Validation findings + corrected diagnosis 2026-04-23" below — read this BEFORE proposing any v2 install or workaround removal in a future session.

## Validation findings + corrected diagnosis 2026-04-23

> **For future Claude:** READ THIS WHOLE SECTION before proposing the v2 SDK upgrade. The simple read is wrong; the simple read is what the agent + initial director analysis BOTH got wrong. The corrected diagnosis came from Clark catching the gap. Do not skim.

### The mismatched-interface problem in plain terms

`SmeMartDbService` (in `src/app/core/services/sme-mart-db.service.ts`) talks to a Neon Postgres DB through the ZeroBias Hub via the `@auditlogic/module-auditmation-generic-sql@0.5.0` module. The CLIENT-SIDE typed SDK is `@zerobias-org/module-interface-dataproducer-hub-sdk` (v1, currently `1.2.32`). When you call a typed write method on the v1 SDK like:

```typescript
collectionsApi.addCollectionElement(objectId, { firstName: 'Clark', email: '...' });
```

…the SDK serializes the HTTP body as:

```json
{ "objectId": "uuid-...", "requestBody": { "firstName": "Clark", "email": "..." } }
```

…and PUTs it to `/addCollectionElement`. Note the user's data is NESTED under a `requestBody` key. The generic-sql 0.5.0 module on the receiving end was rejecting this — it expected the element data either at the top of the body or under an `element` key, not nested under `requestBody`. That mismatch is the original write failure. The same module also mis-casts UUID primary-key columns as BIGINT under some conditions.

**Workaround currently in production** (lines 178–203 of the service): bypass the typed `CollectionsApi.addCollectionElement / updateCollectionElement / deleteCollectionElement` entirely. Build raw SQL strings and invoke them via the generic-sql module's `query` function:

```typescript
return await functionsApi.invokeFunction('/db:neondb/function:query', { sql: 'INSERT INTO ...' });
```

### Why the workaround DOES NOT actually solve the root problem (corrected 2026-04-23)

The workaround switches from `addCollectionElement` to `invokeFunction`. **But `invokeFunction` uses the SAME envelope-wrapping in the SDK.** Verified by reading `node_modules/@zerobias-org/hub-sdk-interface-dataproducer/generated/api/FunctionsApi.ts` (v2; v1 compiled JS is identical):

```typescript
async invokeFunction(objectId, requestBody) {
  const _body = { objectId, requestBody };
  return this.client.put('/invokeFunction', { ..._body });
}
```

So our workaround sends:

```json
{ "objectId": "/db:neondb/function:query", "requestBody": { "sql": "INSERT INTO ..." } }
```

The `sql` is nested under `requestBody`, structurally identical envelope to the typed-write payloads we were trying to avoid. If the module rejects `requestBody`-nested data for `addCollectionElement`, it should reject the same envelope for `invokeFunction`.

**Two possibilities for what's actually happening in production:**

1. **Writes have been silently failing the whole time** and we haven't noticed. Plausible — see errata 011 (`pipeline-fire-and-forget-masks-errors.md`): `.catch(err => console.error(err))` on the `pushEntity` call sites masks pipeline failures from the user. Same pattern likely exists on the Hub write path. Without explicit error-state surfacing or an instrumented run, we can't distinguish "write succeeded" from "write was discarded silently."
2. **The module's function dispatcher unwraps `requestBody` for `invokeFunction` calls but does NOT unwrap it for `addCollectionElement` calls.** That would mean the envelope bug is asymmetric on the module side — typed writes break, function invokes work coincidentally — and the workaround works through that asymmetry.

We do not know which is true without live testing. Live testing needs UAT MCP profile lock + careful observation of actual Neon row state before and after a write, NOT just "no exception thrown."

### What v2 SDK (`@zerobias-org/hub-sdk-interface-dataproducer@2.0.1`) introduces and what it does NOT address

Three findings:

1. **The wire envelope in v2 is bit-for-bit identical to v1.** v2's `CollectionsApiHubImpl.addCollectionElement` and `FunctionsApiHubImpl.invokeFunction` both build `{ objectId, requestBody }` and PUT to `/addCollectionElement` / `/invokeFunction`. Verified by reading the generated TS source. **v2 does NOT change the wire format.** If the original write failure is the SDK envelope shape, v2 SDK alone does not fix it.
2. **v2 build-breaks our app with 56 strict-mode TypeScript errors.** v2 ships TS source under `generated/api/` and `generated/model/` rather than pre-compiled JS like v1. Generated code has unsafe enum/index lookups: `TS7053: Element implicitly has an 'any' type because expression of type 'string | number' can't be used to index type { readonly Color: EnumValue; ... }`. Angular 21 strict mode rejects on import switch. `skipLibCheck: true` in `tsconfig.app.json` would mask it but is undesirable.
3. **API surface (interface signatures) is identical between v1 and v2.** Both expose `addCollectionElement(objectId, requestBody)` etc with the same param names and types. No method renames, no signature changes. Type aliasing in our service (`HubCollectionsApi`) compiles cleanly against both interfaces.

**What v2 might still be the right matching client for:** if the fix is on the MODULE side (generic-sql 0.5.x or 0.6.x updated to accept `requestBody`-nested envelopes, or a Hub server-side dispatcher updated to unwrap), then v2 SDK is the matching client release that ships at the same time. We need confirmation from Chris (SDK owner) and/or Kevin (platform/Hub) about which module version pairs with v2 and whether the envelope bug is resolved on that pair.

### Decision recorded 2026-04-23

**Stay on v1.** Working tree REVERTED — `package.json`, `package-lock.json`, `src/app/core/services/sme-mart-db.service.ts` all restored to pre-investigation state. v2 removed from `node_modules`. The workaround (raw-SQL via `invokeFunction('query')`) stays in place and is treated as the production write path until backend (module-side) fix is confirmed.

The asynchronous question to Chris (SDK-side) and Kevin (module-side) is: which generic-sql module version accepts the `{ objectId, requestBody }` envelope, and is v2 SDK its matching client? Until that's answered, v2 upgrade is wasted work.

### What NOT to do in a future session

- **Do NOT propose installing v2** based on the comment at `sme-mart-db.service.ts:178-181`. That comment was written before v2 actually landed and the expectation that v2 fixes the workaround is unverified. The comment is stale-by-assumption.
- **Do NOT delegate this to a general-purpose Agent without giving it the corrected diagnosis above.** The agent will read type signatures, see them match, and conclude "drop-in upgrade". It will miss that v1 and v2 have the same wire bug AND that the workaround inherits the same wire bug via `invokeFunction`. (Confirmed by Clark 2026-04-23: "agent is stupid".) If you need help comparing the SDK surfaces, do it yourself with grep on the actual `_body = { objectId, requestBody }` construction in `node_modules/.../generated/api/CollectionsApi.ts` and `FunctionsApi.ts`.
- **Do NOT remove the workaround** until BOTH (a) the module-side envelope behavior is confirmed by Chris/Kevin AND (b) a live UAT write test (with explicit Neon row verification before+after, not just "no exception") proves typed writes land.
- **Do NOT assume the workaround is bullet-proof in production.** It hits the same SDK envelope wrapping. It may be silently failing on some calls (see errata 011 fire-and-forget pattern). Until live verification confirms otherwise, treat the workaround as "writes that probably-but-not-certainly land."

### Original finding 1 (now subsumed) — v2 SDK build-breaks with 56 TypeScript errors

The v2 package ships its **generated TypeScript source** (in `generated/api/` and `generated/model/`) rather than pre-compiled JS like v1. The generated code is NOT compatible with strict-mode TypeScript, which Angular 21 enforces:

```
TS7053: Element implicitly has an 'any' type because expression of type 'string | number'
can't be used to index type { readonly Color: EnumValue; ... }
```

56 such errors in v2's source. `npm run build` fails the moment the import in `sme-mart-db.service.ts:4` is switched from v1 to v2. The **service code itself has no errors** — only v2's library code does.

**Workaround options if v2 is mandatory:** `skipLibCheck: true` in `tsconfig.app.json` (suppresses type-check on the SDK), or wait for a v2.0.2+ patch from Chris with strict-mode-clean generated code.

### Finding 2 — v1 and v2 expose IDENTICAL `CollectionsApi` signatures

Both versions use `requestBody` for write payloads. **Neither uses `element`.** Both have the same method names, same parameter types, same return types. There is no API-surface difference for the methods the service uses (`addCollectionElement`, `updateCollectionElement`, `deleteCollectionElement`, etc.).

This means the comment at `sme-mart-db.service.ts:179` ("The v1 SDK sends element data under 'requestBody' but generic-sql 0.5.0 expects 'element'") is **misleading or stale**. It's not why the workaround exists.

### Finding 3 — the "workaround" actually bypasses the typed SDK entirely

`SmeMartDbService.createRow / updateRow / deleteRow` (lines 183, 191, 200) do NOT call the typed SDK methods at all. They build raw SQL strings (`buildInsertSql / buildUpdateSql / buildDeleteSql` at lines 494–509) and invoke them via the generic-sql module's `query` function (line 489):

```typescript
return await functionsApi.invokeFunction('/db:neondb/function:query', { sql });
```

This is the **production-working** write path. It has been the production write path the whole time. Writes are NOT currently failing — the typed SDK methods just have never been used for writes in this codebase.

## What this means

- The original framing — "v2 fixes the failing writes" — does not hold. Writes are working via raw-SQL workaround. v2 may or may not allow us to switch from raw SQL back to typed SDK methods, but **we have no evidence that v2's typed methods work against generic-sql 0.5.0**, only that they exist with identical signatures to v1.
- v2 has its own blocker (strict-mode type errors in generated code) that would have to be solved before we could even attempt to validate its typed methods.
- The decision space splits:
  - **Option A:** Stay on v1, accept that the raw-SQL workaround IS the production solution, document the intentional bypass clearly. Cost: zero.
  - **Option B:** Move to v2 with `skipLibCheck`, attempt to refactor `createRow/updateRow/deleteRow` to use typed methods, validate against UAT Neon. Cost: real refactor + live testing + a tsconfig escape hatch we'd want to remove later.
  - **Option C:** Wait for Chris to ship v2.0.2+ with strict-mode-clean generated code, then decide. Cost: time.

**Director recommendation pending Clark direction:** Option A is the cheapest correct answer. Option B is only justified if there's a concrete reason to prefer typed-SDK writes over raw SQL (e.g., a performance issue, a bulk-operation feature, or a future generic-sql breaking change). Option C is the safest if we expect to need v2 later anyway.

## Working-tree state after Agent investigation

- `package.json` HAS been modified to add `@zerobias-org/hub-sdk-interface-dataproducer: ^2.0.1`
- `node_modules` HAS been updated (v2 installed alongside v1)
- `sme-mart-db.service.ts` import on line 4 was switched to v2 during testing — **revert if Option A or C is chosen.** Verify with `git diff src/app/core/services/sme-mart-db.service.ts`.
- The build is broken in this state — v2 import + 56 type errors. Reverting the import OR removing v2 from package.json restores green build.

## Existing write-test coverage (for reference)

- `src/app/core/services/notification.service.spec.ts` — mocks `createRow / updateRow`
- `src/app/core/services/categories.service.spec.ts` — mocks `createRow / updateRow / deleteRow`
- **No live SmeMartDbService write tests exist.** Any Option-B refactor would need new spec coverage that exercises the actual Hub call path before claiming validation.


**Reason this exists:** When Clark mentions "v2 SDK" or "the missing v2 SDK," he is referring to THIS situation. Use this note to recognize the topic and to know what to check + what to do once published.

## What "v2 SDK" means in SME Mart conversation

The `@auditlogic/module-auditmation-generic-sql` Hub module shipped at version **0.5.0** with an op surface that the previously-installed Hub-interface client SDK (`@zerobias-org/module-interface-dataproducer-hub-sdk@1.2.32`) did not fully cover.

**The Hub-interface SDK has been renamed and re-published.** Per Christopher Scarola 2026-04-23 9:04 AM Slack:

> So the name had changed: Its now this: `@zerobias-org/hub-sdk-interface-dataproducer`
> v2.x of that should exist

**Old name (still installed in repo's package.json):** `@zerobias-org/module-interface-dataproducer-hub-sdk` (last seen at `1.2.32`)
**New name (the one to install):** `@zerobias-org/hub-sdk-interface-dataproducer` (target: latest v2.x)

## Where to check whether it's been published

```bash
# Primary check — the renamed Hub-interface SDK on the @zerobias-org registry
# (npm.pkg.github.com via GITHUB_TOKEN; @zerobias-org also resolves to that registry per repo .npmrc).
npm view @zerobias-org/hub-sdk-interface-dataproducer versions --json

# Look for the highest 2.x.x. Per Chris 2026-04-23, it should be present.

# Sanity check — confirm the OLD name is no longer the right one to depend on:
npm view @zerobias-org/module-interface-dataproducer-hub-sdk versions --json
# (Old name may still resolve to 1.x.x — that's the legacy line. Do NOT install from it.)
```

Two-registry reminder (from MEMORY.md): `@zerobias-com` → `npm.pkg.github.com` (needs `GITHUB_TOKEN`), `@zerobias-org` → `pkg.zerobias.org` (needs `ZB_TOKEN`). `@auditlogic` follows the `@zerobias-org` registry. Auth setup must be in place before `npm view` will return private-package data.

## What to do once it IS published

1. **Update `package/w3geekery/sme-mart/package.json`** to depend on the v2 SDK (replacing the current `@zerobias-org/module-interface-dataproducer-hub-sdk@^1.2.32`).
2. **Run `npm install`** in `package/w3geekery/sme-mart/` to pull the v2 down.
3. **Re-run the audit checks** documented in `.claude/notes/hub-wiring-audit-2026-04-22.md`:
   - SDK-op alignment table (lines 22–37) against the new v2 surface — confirm every op `SmeMartDbService` calls still maps cleanly. If any rename, fix the service.
   - Run `npm test src/app/core/services/sme-mart-db.service.spec.ts` to catch type breaks.
4. **Retry the Phase 3 validation steps** flagged as ⚠ in the same audit doc — they were deferred pending end-to-end Hub wireup, and the v2 SDK is a precondition for getting them green.
5. **Pick up `.planning/phases/neon-via-hub-wireup.md`** at whichever phase it was paused on. The original blocker was the missing v2 SDK; with that resolved, the neon-via-hub wireup can proceed to provisioning the Generic SQL connection on UAT and flipping `dbMode: 'hub'` per backlog 003 (`.planning/director/backlog/003-generic-sql-hub-module-uat-neon.md`).
6. **Director-side:** if v2 SDK landing changes any architectural decisions captured in `.claude/docs/HUB_CONNECTION_SETUP_NEON.md`, append an update note. If the new op surface unblocks any existing errata (esp. errata 015 on env.neon credential rotation), update the errata status.

## Related context (for orientation, do NOT re-research these)

- Backlog 003 `003-generic-sql-hub-module-uat-neon.md` — the wireup work this v2 SDK unblocks
- `.claude/docs/HUB_CONNECTION_SETUP_NEON.md` — operator playbook for getting the Generic SQL connection live on UAT (assumes a working SDK exists)
- `.claude/notes/hub-wiring-audit-2026-04-22.md` — the SDK-op alignment audit done against 1.2.32; re-read this for the op-surface mapping
- `.planning/phases/neon-via-hub-wireup.md` — the in-flight Phase 0 → Phase N plan for the wireup itself

## Out of scope for this note

- Any v1 → v2 SDK migration that is not the SME Mart Hub SDK (other ZB SDKs may have unrelated v1/v2 transitions; do not conflate)
- The `@zerobias-com/hydra-sdk` and `@zerobias-com/dana-sdk` migrations (those are settled per memory)
