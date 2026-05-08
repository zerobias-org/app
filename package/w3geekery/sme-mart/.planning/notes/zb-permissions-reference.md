# ZB Platform Permissions — Reference

Authoritative reference for determining user permissions on the ZB platform from SME Mart. Verified via UI network inspection + ZB MCP describe on UAT 2026-05-07.

> **Don't re-derive this.** This doc is the source of truth for "how do I check if user X can do Y in scope Z?" If something here is wrong or missing, fix it here.

## TL;DR

The platform already has system roles + auto-created groups for the cases SME Mart needs. **Don't invent new roles unless you have a specific case the existing ones don't cover.**

| Question | API | How |
|---|---|---|
| Is user X admin of org Y? | `hydra.Principal.searchRolesByPrincipal(X, body)` | check for role `Organization Admin` with ownerId = Y |
| Is user X admin of boundary B? | same | check for role `Boundary Admin` (boundaryIds includes B) |
| Who has access to boundary B (with via-Group resolution)? | `hydra.Role.searchRoles({boundaryId: B, status: 'active'})` | scan `principals[]` |
| Members of org O with their roles + via-Groups? | `hydra.Org.searchOrgMembers(O, body)` | filter by `boundaryId`, `roles`, `types` |
| Effective access rules for user X (transitive)? | `hydra.Principal.searchPrincipalAccessRules(X, body)` | returns access rules, direct or via roles |

## Key concepts

### Principal types (from `PrincipalType` enum)

`USER`, `ORG`, `GROUP`, `API_KEY`, `SERVICE_ACCOUNT` — every role assignment / group membership reference uses one of these.

### Role types

| `roleType` | What it is |
|---|---|
| `system` | Pre-defined by the platform (System Org `00000000-...` owns them); cannot be deleted; e.g., `Boundary Admin`, `Organization Admin` |
| (custom) | User-defined roles per org (admin can create them via Governance UI) |

### Role binding

Roles are global definitions. They get scoped per-target via principal bindings. A binding ties a Principal (User, Org, Group) to a Role with a scope (`ownerId` for org-scoped, `boundaryId` for boundary-scoped).

`hydra.Role.addRoleMembers({principalIds, ownerId, boundaryId?})` — body field `principalIds` accepts USER or GROUP principals. If you assign a Group, all current and future members of that Group inherit the Role transitively.

### Auto-created groups

**Per Org:**
- `Org.adminGroupId` → "Org Admins" — pre-bound to system role `Organization Admin` for the org
- `Org.memberGroupId` → "Org Members" — pre-bound to system role `Organization Read-Only`

**Per Boundary** (auto-created on boundary creation):
- `<Boundary> Admins` — pre-bound to `Boundary Admin` + `Boundary Admin Org access` system roles
- `<Boundary> Members` — pre-bound to `Boundary Read-Only` system role

So adding a user to `<Boundary> Admins` group transitively grants them `Boundary Admin` role on that boundary. This is the platform's idiomatic way to grant boundary-level admin.

## System roles inventory (UAT 2026-05-07)

All owned by System Org (`00000000-0000-0000-0000-000000000000`), `roleType: system`, source `zerobias.zerobias.platform.rbac`.

| Role | Role UUID | Typical use |
|---|---|---|
| `Organization Admin` | `d94dc1df-0a9c-4a45-92b0-49dbb50986b3` | Org-level admin (full org control) |
| `Organization Read-Only` | `862d9449-fb48-4177-9f83-8e38a18b2579` | Org-level read |
| `Boundary Admin` | `b47a65cf-e474-4081-ab88-2dd2e5480e85` | Admin within a boundary (resources scoped to that boundary) |
| `Boundary Admin Org access` | `a70a45d3-fa76-405c-95f2-912a6f42c77f` | Admin perms on org-scoped resources accessible from this boundary (alert_bot, deployment, gql_query, secret) |
| `Boundary Read-Only` | `18fbe31f-18fa-4d65-9b7f-ed4e6da379e2` | Read access to all boundary-scoped resources |
| `Boundaries Read-Only` | `21ed46bb-6baf-4761-8829-463d5ff8431c` | Read access across multiple boundaries (variant; verify scope before relying on) |

There are also 50+ NIST/NICE-framework cybersecurity workforce roles (`Cybersecurity Architecture`, `Vulnerability Analysis`, etc.) — those are domain-classification roles, not access-control.

## The "via" field — transitive resolution

The rich search APIs (`searchRoles`, `searchRolesByPrincipal`, `searchOrgMembers`) all return a `via` field showing the chain by which a principal got their access. Example:

```json
{
  "id": "<userId>",
  "name": "Brian Hierholzer",
  "type": "USER",
  "via": [
    {
      "id": "<groupId>",
      "name": "SME Marketplace DEV Boundary Admins",
      "ownerId": "<W3Geekery org id>",
      "type": "GROUP",
      "level": 0
    }
  ]
}
```

`level: 0` = direct group membership. Higher levels = nested groups (group-of-groups).

**Direct vs transitive:**
- If `via` is empty/absent → direct role binding (user added directly to the role)
- If `via[]` has Groups → transitive (user is in a Group that's bound to the role)

For SME Mart's "is X admin?" detection we usually don't care which path; we just care if the result is non-empty.

## API recipes for SME Mart

### "Is current user admin of their current org?" (for `onboardingGuard`)

```ts
// Replace the current getRequestOrgMember.admin call with:
const result = await clientApi.hydraClient
  .getPrincipalApi()
  .searchRolesByPrincipal(userPrincipalId, {
    status: 'active',
    name: 'Organization Admin',
  });
const isOrgAdmin = result.items.some(r =>
  r.ownerId === currentOrgId &&
  r.roleType === 'system' &&
  r.name === 'Organization Admin'
);
```

This catches: direct Org Admin role assignments AND transitive (via the Org's auto-created Admins group).

### "Is current user admin of a specific boundary?"

```ts
const result = await clientApi.hydraClient
  .getPrincipalApi()
  .searchRolesByPrincipal(userPrincipalId, {
    boundaryId: targetBoundaryId,
    status: 'active',
    name: 'Boundary Admin',
  });
const isBoundaryAdmin = result.items.length > 0;
```

### "Who has admin access to this boundary?"

```ts
const result = await clientApi.hydraClient
  .getRoleApi()
  .searchRoles({
    boundaryId: targetBoundaryId,
    status: 'active',
    name: 'Boundary Admin',
  });
// result.items[0].principals[] = all USERs with this role, with via context
```

### "List all members of org Y with their roles on a specific boundary"

```ts
const result = await clientApi.hydraClient
  .getOrgApi()
  .searchOrgMembers(orgId, {
    boundaryId: targetBoundaryId,
    types: ['USER', 'SERVICE_ACCOUNT'],
    status: 'active',
  });
// each member: { member, groups[], roles[] (with boundaryIds), via[] }
```

This is the API the Governance UI uses to render the boundary's Users tab.

## Auto-conferral semantics — key trade-off

Platform Org Admins are automatically `Organization Admin` role members (via the Org's auto-created adminGroup). This is **structural** — there's no way to be a Platform Org Admin and NOT have the Organization Admin role.

**Consequence for SME Mart:**
- If admin detection includes `Organization Admin` role check → Platform Org Admins are auto-conferred SME Mart admin status in their own org.
- To avoid auto-conferral → need a custom role specifically for SME Mart admin and ignore Organization Admin in detection logic. Adds maintenance.

Recommended posture: lean on auto-conferral for now. If granular separation becomes needed later, add a custom role at that point.

## Where SME Mart hooks in (code touchpoints)

| Where | What it does today | Recommended migration |
|---|---|---|
| `src/app/core/guards/onboarding.guard.ts:94-95` | `getRequestOrgMember.admin` — danaOld OrgMember admin flag | Replace with `searchRolesByPrincipal` for Organization Admin + ownerId check (per the recipe above). Catches both direct and via-group admin assignments. |
| `src/app/core/services/project-context.service.ts:60` | `setIsAdmin(boolean)` — single org-level admin signal | May need to expand to multi-dimensional: `setIsOrgAdmin`, `setIsBoundaryAdmin(boundaryId)`, etc., when boundary-scoped permission checks land in the UI. |
| `src/app/core/services/demo-visibility.service.ts:102` | Reads `projectContext.isAdmin()` | No change needed — consumes the Signal. Will get the new value transparently when guard migrates. |
| `src/app/core/services/demo-mode.service.ts:6,80` | Email allowlist for demo toggle | Decoupled from platform admin; reconsider whether to align with `isAdmin()` or keep separate. (Tracked in parkit doc as separate concern.) |

## What we DON'T need

- **A custom "SME Marketplace Administrator" role** — `Organization Admin` (org-level) and `Boundary Admin` (boundary-level) cover the cases.
- **A per-org `sme-mart.admins` Group** — the Org's auto-created adminGroup already plays this role; non-Org-Admin users can be added directly to the Organization Admin role's principals via the Governance UI if needed.
- **Custom admin-management UI in SME Mart** — point users at the Governance UI (boundaries → Groups/Users tabs) for permission management.

## What we MIGHT need later

- **Per-org SME Mart-specific custom roles** — e.g., "SME Mart RFP Editor" if we want non-admin users with specific RFP-publishing perms. Created via Governance UI; SME Mart's detection logic adds checks for the role.
- **Boundary-scoped admin detection** — when SME Mart starts caring about "this user can admin engagements in boundary X but not boundary Y" (your earlier scenario), use `searchRolesByPrincipal` with `boundaryId` filter.
- **A second per-customer-org boundary** — currently all SME Mart records live in W3Geekery's SME Marketplace DEV boundary. If we move to a per-customer-org boundary, each gets its own auto-created `<Boundary> Admins` group, which neatly mirrors per-org SME Mart admin scoping.
