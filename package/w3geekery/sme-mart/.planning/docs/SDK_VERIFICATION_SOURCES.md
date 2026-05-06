# SDK / API Verification — Authoritative Sources of Truth

**Audience:** every Claude session, every subagent (gsd-plan, gsd-execute, etc.) working on SME Mart.
**Bottom line:** when you need to verify an SDK accessor, API contract, response shape, or platform behavior — there are exactly three valid sources. Anything else is a hint, not the truth.

---

## Authoritative sources (priority order)

### 1. ZB MCP — `zerobias_search` / `zerobias_describe`

The canonical contract. Returns the platform's published OpenAPI schema directly.

```
mcp__zerobias__zerobias_search { keyword: "<term>", service?: "<service>" }
mcp__zerobias__zerobias_describe { path: "<service>.<Resource>.<operation>", expand?: true }
```

`zerobias_describe` returns the full operation signature, parameter shapes, response type with required fields, and prose description. **This is what the server actually accepts and returns.**

Examples of when to use first:
- "What's the API for X?" — `zerobias_search "X"`
- "Does this op exist?" — `zerobias_search "<op-name>"`
- "What fields does the response have?" — `zerobias_describe "<path>" expand:true`
- "Required vs optional params?" — `zerobias_describe "<path>"`

### 2. Actual ZeroBias platform source

`~/Projects/zb/{dana,platform,hub,fileservice,hydra,clients,...}/` — read the real code for behaviors not visible in OpenAPI (redirect logic, cache semantics, side effects). Always `git pull` first; old clones drift.

### 3. Actual SDK source

`@zerobias-com/zerobias-angular-client` and its underlying `zerobias-client` / `zerobias-sdk` packages.

- For accessor resolution ("which client.getXxxApi() carries this op"): use **vscode-mcp** `get_symbol_lsp_info` against the actual installed SDK package.
- For published version verification: `npm pack <package>@<version>` and inspect the tarball — never trust workspace `node_modules` (may be locally built / symlinked / stale).
- The MCP path namespace (e.g., `danaOld.Org.getRequestOrgMember`) maps to a specific SDK accessor. The mapping is NOT 1:1 — `danaOld` MCP path lives under `clientApi.danaClient` in some SDK builds, `clientApi.danaOldClient` in others. **Verify against the installed package, do not assume.**

---

## NOT authoritative — do not cite as source of truth

| Source | Why not |
|---|---|
| `~/Projects/zb/zerobias-org/app/package/w3geekery/sme-mart/` | Deprecated Next.js prototype. Replaced by the Angular app in this repo. May not even build. Patterns there may have drifted from the SDK. Treat as a HINT for what to grep / search in MCP, never as the truth. |
| `.specstory/history/*.md` | Conversation transcripts. Historical record, not contract. |
| `node_modules/<pkg>` in any workspace | Might be locally built, symlinked, or older than the published version. Use `npm pack` against the registry instead. |
| Memory files (`~/.claude/projects/.../memory/*.md`) | Memories can be wrong (this whole doc exists because an admin-detection memory cited a non-existent `getPrincipal().isAdmin` accessor). Verify against MCP / SDK before acting on a memory's API claim. |
| Earlier commits, comments, or planning docs | Stale-by-default for SDK contracts. Treat as hints. |

---

## Why this rule exists

Specific failures this doc prevents:

- **Admin detection (2026-04-30):** memory said `getPrincipal().isAdmin` returning `OrgPrincipalWithAdminFlag`. ZB MCP `zerobias_describe danaOld.Org.getRequestOrgMember` showed the actual API: `getRequestOrgMember(orgMemberId): OrgMemberExtendedWithAdminFlag` with `admin: boolean` field. The wrong memory had been quoted in handoffs for a week, embedding a non-existent accessor in plans.
- **v2 SDK upgrade (2026-04-23):** investigation cited workspace `node_modules` as evidence that v2 envelope was different from v1. `npm pack` against the registry revealed both versions had the identical wire envelope — the workspace copy was lying.
- **Generic SQL hub module 0.6.0 (2026-04-30):** assumed UI behavior ("Connections page won't show connectionless deployments") based on training-data drift instead of asking. Was wrong; the UI's only deployments view IS the Connections page.

The pattern: **assume → wrong → embarrassing back-and-forth → eventual MCP/SDK lookup that should have been the FIRST move.** This doc exists so the first move is the right move.

---

## Quick reminders

- For any "what's the API for X" question: **first move is `zerobias_search`, second move is `zerobias_describe`.** Not grep, not memory, not legacy app code.
- For SDK accessor location: vscode-mcp on installed package source.
- For "is this version actually published with feature Y": `npm pack <pkg>@<version>` + inspect tarball, NOT workspace `node_modules`.
- If a legacy app shows a working pattern, that's a HINT pointing you toward what to verify in MCP / SDK source. Never write "authoritative reference: <legacy-app-file>" anywhere — it's not authoritative.

---

**Maintainer:** update this doc whenever a new source-of-truth failure surfaces. Add the failure to "Why this rule exists" so the next session can see the pattern.
