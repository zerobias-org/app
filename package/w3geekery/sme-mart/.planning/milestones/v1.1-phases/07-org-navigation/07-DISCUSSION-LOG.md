# Phase 7: Org Navigation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 07-org-navigation
**Areas discussed:** Org list layout & filtering, Org overview page structure, Navigation & routing, Org switching stub UX

---

## Org List Layout & Filtering

| Option | Description | Selected |
|--------|-------------|----------|
| Card grid | Responsive grid, each card shows name/desc/member count | |
| Table with rows | ZbCustomizableTable, sortable columns | |
| Toggle (cards/table) | User switches between card grid and table view | ✓ |

**User's choice:** Toggle (cards/table) — user can switch between views
**Notes:** Persist preference via UserPreferencesService

---

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-filtered, no toggle | Filter hidden/System/ops before rendering | ✓ |
| Filtered with 'Show all' toggle | Default filtered, toggle to see all | |
| Show all with indicators | Show everything, dim hidden/system | |

**User's choice:** Pre-filtered, no toggle
**Notes:** Users never see hidden/System/ops orgs

---

| Option | Description | Selected |
|--------|-------------|----------|
| Name + description + member count | Clean and scannable | |
| Name + description + role + status | More info per card | |
| You decide | Claude picks based on API data | ✓ |

**User's choice:** You decide
**Notes:** Claude's discretion on card fields

---

| Option | Description | Selected |
|--------|-------------|----------|
| Search only | Text filter for org names | ✓ |
| Search + sort | Search bar + sort dropdown | |
| Neither | Plain list, no controls | |

**User's choice:** Search only
**Notes:** listMyOrgs returns manageable number of orgs

---

| Option | Description | Selected |
|--------|-------------|----------|
| Persist via UserPreferencesService | Save card/table preference across sessions | ✓ |
| Session only | Resets on reload | |
| Default to cards, no toggle yet | Ship cards first | |

**User's choice:** Persist via UserPreferencesService

---

| Option | Description | Selected |
|--------|-------------|----------|
| Subtle border/badge | Colored border or "Active" chip | ✓ |
| Prominent styling | Different background, pinned to top | |
| No distinction | All cards look identical | |

**User's choice:** Subtle border/badge for current org

---

| Option | Description | Selected |
|--------|-------------|----------|
| Name, Description, Members, Role | Core info matching card | |
| Name, Members, Status, Actions | Action-oriented | |
| You decide | Claude picks columns | ✓ |

**User's choice:** You decide — "we'll tweak this later as needed"

---

| Option | Description | Selected |
|--------|-------------|----------|
| Show single org normally | Consistent UX | ✓ |
| Auto-redirect to overview | Skip list for single org | |
| Show list + info message | Normal list with banner | |

**User's choice:** Show single org normally

---

## Org Overview Page Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Single page with sections | Scrollable, all sections visible | ✓ |
| Tab layout | Tabs like /org | |
| Accordion sections | Collapsible sections | |

**User's choice:** Single page with ZbSimplePanelComponent sections
**Notes:** Clark specifically called out ZbSimplePanelComponent

---

| Option | Description | Selected |
|--------|-------------|----------|
| Simple lists with avatars | Avatar + name + role for members, name + count for groups | ✓ |
| Tables | Full table per section | |
| Cards within sections | Small cards per member/group | |

**User's choice:** Simple lists with avatars

---

| Option | Description | Selected |
|--------|-------------|----------|
| List with status chips | Boundary name + zb-resource-status | ✓ |
| Simple text list | Names only | |
| Cards with description | Small cards with name/desc/status | |

**User's choice:** List with status chips

---

| Option | Description | Selected |
|--------|-------------|----------|
| In header area | Name, desc, metadata | |
| Name + description only | Minimal header | |
| You decide | Claude picks from API data | ✓ |

**User's choice:** You decide — Claude picks metadata

---

## Navigation & Routing

| Option | Description | Selected |
|--------|-------------|----------|
| Add to top nav bar | Third item after RFPs | |
| User menu dropdown | In user profile dropdown | ✓ |
| Sidebar section | New sidebar nav | |

**User's choice:** Already in user dropdown — just update route to /orgs
**Notes:** "it's already in User menu dropdown, leave as-is"

---

| Option | Description | Selected |
|--------|-------------|----------|
| Keep /org as-is | All three routes coexist | ✓ |
| Redirect /org | /org becomes redirect | |
| Merge into /orgs/:orgId | Replace /org entirely | |

**User's choice:** Keep /org as-is — "of COURSE keep /org"
**Notes:** /org for editing current org, /orgs/:orgId for read-only overview

---

## Org Switching Stub UX

| Option | Description | Selected |
|--------|-------------|----------|
| Org overview header only | Button on /orgs/:orgId header | ✓ |
| Both list cards and overview | Switch icon on cards + button on overview | |
| List cards only | Switch on cards, not overview | |

**User's choice:** Org overview header only

---

| Option | Description | Selected |
|--------|-------------|----------|
| Banner + 'Go to Org Profile' button | Current org: info banner + link to /org. Other org: disabled switch | ✓ |
| Just action button difference | Different button, no banner | |
| You decide | Claude picks treatment | |

**User's choice:** Banner + 'Go to Org Profile' button

---

## Claude's Discretion

- Card field selection (D-06)
- Table columns (D-07)
- Org header metadata (D-12)
- Exact visual styling of active org indicator

## Deferred Ideas

None — discussion stayed within phase scope
