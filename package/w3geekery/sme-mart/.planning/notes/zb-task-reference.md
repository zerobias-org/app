# ZB Platform Task — Reference

Authoritative reference for `platform.Task.*` operations as used in SME Mart. Verified against `platform.Task.create` describe + zb/ui's `createTaskDialog` component on UAT 2026-05-06.

> **Don't go re-grepping zb/ui for Task questions.** This doc is the source of truth. If something here is wrong or missing, fix it here — that's cheaper than reading the zb-ui-lib component again.

## Endpoints

| Operation | Path | Use |
|---|---|---|
| Create | `platform.Task.create` | Create a new task. Body is `{ newTask: { ... } }`. Returns `TaskExtended`. |
| Get | `platform.Task.get` | Read a task by id. |
| List | `platform.Task.list` | Page over tasks (filterable). |
| Update | `platform.Task.update` | Update a task (status transitions, field changes). |
| Delete | `platform.Task.delete` | Delete a task. |

## Task.create — request body

Required: `activityId`, `approvers`, `notified`, `links`. Everything else optional.

```ts
{
  activityId:  string (uuid),     // required — references the Activity / workflow
  ownerId:     string (uuid),     // org that owns the task. Defaults to current org.
  name:        string,            // task name. If omitted, derived from activity.taskTemplateName.
  description: string,
  priority:    number (int),      // 1000 Critical, 500 High, 200 Normal, 100 Low
  boundaryId:  string (uuid),     // optional boundary scope
  rank:        string (oid),      // ordering within parent
  transitionId: string (uuid),    // optional initial transition; first valid is used if omitted
  customFields: object,           // free-form per activity
  // ====== RACI ======
  assigned:    string (uuid),     // R — single Party UUID  ← name = "assigned" but RACI = Responsible
  accountable: string (uuid),     // A — single Party UUID
  approvers:   string[] (uuid[]), // C — array of Party UUIDs ← LEGACY NAME; semantics = Consulted
  notified:    string[] (uuid[]), // I — array of Party UUIDs
  // ==================
  links:       NewTaskLink[]      // [] is fine; each link is { resourceId, linkTypeId }
}
```

## RACI — field-name mapping (CRITICAL)

The schema field `approvers` is **NOT** Accountable. It is **Consulted**. Schema description text says "A list of parties that must be consulted on this task." The legacy field name pre-dates RACI. The actual A-role field is `accountable`.

| RACI | zb/ui form field name | Task.create schema field name | Cardinality |
|---|---|---|---|
| **R** Responsible | `responsible` | `assigned` | single |
| **A** Accountable | `accountable` | `accountable` | single |
| **C** Consulted | `consulted` | `approvers` | array |
| **I** Informed | `informed` | `notified` | array |

Verified from:
- Schema: `platform.Task.create` describe (`approvers`'s description is "must be consulted")
- UI: `~/Projects/zb/ui/projects/zb-ui-lib/src/lib/components/zerobias-task-components/create-task-dialog/create-task-dialog.component.ts` lines 66–70 enum + 380–393 form-to-NewTask mapping

## Party UUID — what each field accepts

All four RACI fields accept Party UUIDs (NOT principal UUIDs, NOT user UUIDs). To get a Party UUID:

- **User-party**: `platform.Party.get(userPrincipalId)` returns the user's party in the **current** org context. Returns 404 if the user has no party in that org.
- **Org-party**: `platform.Party.list({ partyType: 'org' })` in the org's own context returns one row — that org's org-party.
- **My party**: `platform.Party.getMyParty` returns the current principal's party in the current org. Use this for "assign to self" patterns.

For Party taxonomy and cross-org context-switching, see `~/.claude/projects/-Users-.../memory/reference_zb_party_taxonomy.md` and `reference_zb_mcp_org_context_switching.md`.

## ownerId

`ownerId` is the **org UUID** that owns the task — `dana-org-id`-equivalent. Defaults to current org. Pass explicitly when the recipe runs in one org's context but creates a task owned by a different org (e.g., admin provisioning cross-org).

> Memory `feedback_w3geekery_task_ownerid.md` notes: prod API key = ZeroBias org, must pass `ownerId: cd7105df-...` for W3Geekery tasks.

## activityId

The Activity UUID drives the task's workflow, possible transitions, link types, and template name. SME Mart known activity IDs:
- **Global aha1** (default coordination/engagement): `e15830c8-4274-4d67-bf9b-c22b60001e32`

To find activities, use `platform.Activity.list` filtered by name/code, or check the project's seed data.

## Task→Task and Task→Resource links

Pass `links` as an array of `{ resourceId, linkTypeId }`. Common link type IDs:

**Task→Task** (UAT env):
- `child_of` / `parent_to`: `d03fe072-1972-11f1-99c1-0721f729f875`
- `blocked_by` / `blocks`: `d03fec8e-1972-11f1-99c1-9b06e8e6772b`
- `extends` / `extended_by` (activity): `fda28c82-f6da-11f0-9c45-8bdfce226653`

**Task→Task** (CI env):
- `child_of` / `parent_to`: `cf72be7c-1403-11f1-845f-dff3645d0fe7`
- `blocked_by` / `blocks`: `cf73b304-1403-11f1-845f-8b0a517a3fa6`
- `extends` / `extended_by` (activity): `1680b252-81d7-11f0-b34d-475c8de2e1b3`

**Resource link types:** discover via `listResourceLinkTypes` (param is `id`, not `resourceId`).

## Bidirectional links must be created on both sides

Per memory `feedback_task_links_bidirectional.md`: `Task.create` links are one-directional. To get bidirectional `child_of`/`parent_to` semantics, also call `hydra.Resource.linkResources` from the parent side.

## Surfacing in the platform UI (verified 2026-05-06)

Tested via task `aha1-7` (`fefe2741-637b-48d8-bcf7-7fff8506a803`) in W3Geekery org, SME Marketplace DEV boundary, on UAT. Three platform views surface tasks differently:

| view | filter applied | shows tasks where viewer is... |
|---|---|---|
| **Boundary Manager** | viewer-agnostic | (anyone) — shows all tasks scoped to the boundary |
| **Governance** | boundary filter must be set (ALL or specific) — `boundaries=none` hides everything | viewer is in one of the RACI fields (R/A/C/I) |
| **My Tasks** | viewer-scoped | viewer is in one of the RACI fields, with R/A/C/I sub-filters |

### Empirical results

**Test 1: `assigned = org-party` only (no `accountable`/`approvers`/`notified`)**
- ✓ Boundary Manager — surfaces
- ✗ Governance — doesn't surface (viewer not in any RACI slot via a user-party)
- ✗ My Tasks — doesn't surface

**Test 2: same task updated with `accountable = clark's user-party`**
- ✓ Boundary Manager — still surfaces
- ✓ Governance — surfaces ONLY when boundary filter is ALL or includes the task's boundary
- ✗ My Tasks "Accountable" filter — **does NOT surface** even when filter is set to self. **Likely a platform bug** — task IS visible in My Tasks with no filters applied (one of "tons of tasks"), but the Accountable sub-filter doesn't honor `accountable = self`.

### Implications for design

- **Org-only assignment is invisible to humans except via Boundary Manager.** Don't expect users to see org-only-assigned tasks in their personal task views.
- **To get a task into Governance,** at least one user-party must be in R/A/C/I. Setting `accountable` to a user-party is sufficient.
- **My Tasks RACI sub-filters are unreliable** as of 2026-05-06 (specifically the Accountable filter). Bring up at standup. Until fixed, "go to My Tasks unfiltered and search" is the workaround.

### Recipe: org-as-R + admin-as-A

For SME Mart's engagement coordination tasks:
```
assigned    = target org-party     // R: org collectively responsible (Boundary Manager surfaces it for org members)
accountable = target user-party    // A: specific human signs off (Governance surfaces it for them)
approvers   = []                   // C
notified    = []                   // I (not needed for surfacing; accountable does it)
```

This shape balances "the org owns the task" with "a specific human is accountable + sees it in Governance."

## Priority numeric values

| Label | Value |
|---|---|
| Critical | 1000 |
| High | 500 |
| Normal | 200 |
| Low | 100 |

Free-form integer per schema, but stick to these for UI consistency.

## Common mistakes

1. **Putting principal/user UUIDs into RACI fields.** They take **Party** UUIDs. Wrong-type UUID = silent failure or misleading 4xx.
2. **Putting one party in `assigned` AND duplicating it into `approvers`/`notified`** to "cover all bases." This conflates RACI roles. Pick the right field per role.
3. **Forgetting `ownerId` when creating tasks for a different org than the session.** Task lands in wrong org.
4. **Treating the legacy `approvers` field as Accountable.** It's Consulted. The Accountable field is `accountable`.
5. **Using a User principalId where a Party UUID is needed.** Resolve via `Party.get(principalId)` in the right org context first.

## Provisioning case study — SME Mart `PlatformEngagementProvisioner`

When the admin Provisioning tab provisions an org, the coordination Task gets:

```
ownerId     = <target-org's id>                  // task owned by target org
assigned    = <target-org's org-party UUID>       // R — org collectively responsible
accountable = <admin user's user-party UUID>      // A — specific human signs off
approvers   = []                                  // C — none
notified    = []                                  // I — see open question above
activityId  = e15830c8-... (aha1)
priority    = 500 (High)
```

The org-party is fetched via cross-org context switch (see `reference_zb_mcp_org_context_switching.md`). The admin-user pick is from the target org's adminGroup members.
