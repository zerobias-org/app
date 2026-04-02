# Phase 12: Project-Centric Boundary Model - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 12-project-centric-boundary-model
**Areas discussed:** Org card enhancements, Org overview expansion, Parties tab design, Data fetching strategy

---

## Org Card Enhancements

### Badge Style

| Option | Description | Selected |
|--------|-------------|----------|
| zb-resource-status chip | Reuse ZbResourceStatusComponent. Internal = green, External = blue. | ✓ |
| Simple text badge | Plain styled span with background color. | |
| Mat chip | Angular Material mat-chip. More interactive feel. | |

**User's choice:** zb-resource-status chip

### Count Display

| Option | Description | Selected |
|--------|-------------|----------|
| Inline metrics row | Small row: "3 Engagements · 5 Projects". Compact. | ✓ |
| Icon + number badges | Small icon badges aligned right/bottom. | |
| Claude's discretion | Let planner decide. | |

**User's choice:** Inline metrics row

### Table View

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, add columns | Internal/External + Engagement/Project columns. Parity with cards. | ✓ |
| Cards only | Only enhance card view. | |
| Claude's discretion | Let planner decide. | |

**User's choice:** Yes, add columns

---

## Org Overview Expansion

### Layout

| Option | Description | Selected |
|--------|-------------|----------|
| New ZbSimplePanelComponent sections | Add panels below existing ones. | |
| Combined 'Work' section | Single section grouping both. | |
| Tab-based | Convert to tabs. Contradicts Phase 7. | |

**User's choice:** Other — Single "Projects" panel section. Projects grouped by parent engagement. Each engagement = group header (linked to `/engagement/:id`). Under each: small ZbCustomizableTable with project rows. Row click → `/project/:id`.

### Separate Engagements Panel

| Option | Description | Selected |
|--------|-------------|----------|
| Grouped Projects panel only | One panel. Engagements as group headers. | ✓ |
| Both panels | Separate Engagements + Projects panels. Duplicates info. | |

**User's choice:** Grouped Projects panel only

---

## Parties Tab Design

### Multi-Boundary Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Accordion per boundary | Collapsible section per boundary. | ✓ |
| Flat combined list | Merge all parties, add Boundary column. | |
| Tabs per boundary | Sub-tabs if multiple boundaries. | |

**User's choice:** Accordion per boundary

### Party Display

| Option | Description | Selected |
|--------|-------------|----------|
| ZbCustomizableTable | Table with Party Name, Roles, Teams columns. | ✓ |
| Card list | Each party as a small card. | |
| Simple list with ZbAvatarLabel | Avatar + name + roles subtitle. | |

**User's choice:** ZbCustomizableTable

### Route Name

| Option | Description | Selected |
|--------|-------------|----------|
| Change route to 'parties' | URL = /project/:id/parties. Tab label = Parties. | ✓ |
| Keep 'members' URL | URL unchanged, label renamed. | |

**User's choice:** Change route to 'parties'

---

## Data Fetching Strategy

### Engagement/Project Counts

| Option | Description | Selected |
|--------|-------------|----------|
| GQL queries per org | Filter by org ID via GraphqlReadService. | ✓ |
| Batch query then group | Single query, group client-side. | |
| Claude's discretion | Let planner decide. | |

**User's choice:** GQL queries per org

### Boundary Party Fetch Timing

| Option | Description | Selected |
|--------|-------------|----------|
| Lazy on tab select | Fetch only when Parties tab clicked. | ✓ |
| Eager on project load | Fetch alongside overview data. | |

**User's choice:** Lazy on tab select

### Service Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| New BoundaryService | Dedicated boundary.service.ts wrapping platform.Boundary.* APIs. | ✓ |
| Add to existing service | Mix into SmeMartProjectService. | |
| Direct API calls | Call from component directly. | |

**User's choice:** New BoundaryService

---

## Claude's Discretion

- Exact party table columns beyond minimum (Name, Roles, Teams)
- Loading/empty states for parties tab and projects panel
- whoAmI ownerId caching strategy
- Accordion default expand/collapse behavior

## Deferred Ideas

- Project context switcher (Brian wants, needs UX design)
- Sub-project nesting (platform doesn't model yet)
- Permission cascading (boundary role → feature gating)
- Boundary admin in SME Mart (stays in Governance)
- Engagement detail party view (no stubs to replace)
