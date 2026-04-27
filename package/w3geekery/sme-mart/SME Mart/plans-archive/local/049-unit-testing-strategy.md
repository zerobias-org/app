# Plan 049: Testing Strategy

**Created:** 2026-03-12
**Updated:** 2026-03-26 — Fresh audit, two-silo classification (unit vs E2E)
**Framework:** Vitest + Angular TestBed (`@angular/build:unit-test`)
**Target Coverage:** 80%

## Current State (2026-03-26 Audit)

**Baseline (2026-03-12):** 14 specs, 209 tests
**After Plan 049 v1:** 33 specs, 460 tests
**Current (post Plans 060-063):** 61 specs, 751 tests

| Category | Total Files | With Specs | Gap | Coverage |
|----------|------------|------------|-----|----------|
| Services | 44 | 22 | 22 | 50% |
| Page Components | 50 | 5 | 45 | 10% |
| Shared Components | 56 | 15 | 41 | 27% |
| Mappers | 6 | 6 | 0 | 100% |
| Pipes | 2 | 2 | 0 | 100% |
| Roundtrip Tests | 8 | 8 | 0 | 100% |
| Directives | 1 | 0 | 1 | 0% |
| **Total** | **167** | **58** | **109** | **35%** |

## Completed (v1)

- [x] Phase 1 — Pure functions (8 tests: document-resource mapper, safe-resource-url pipe)
- [x] Phase 2 — Presentational components (63 tests: compliance-progress, bid-card, bid-summary, bid-comparison, bid-review, sme-doc-link-renderer)
- [x] Phase 3 — Dialog & form components (18 tests: bid-form, resource-tags-panel)
- [x] Phase 4 — Services (81 tests: bids, work-requests, engagement-lifecycle, notes, catalog)
- [x] Phase 5 — Page components (63 tests: rfp-list, rfp-detail, engagement-list, engagement-detail)
- [x] Test helpers — `src/app/test-helpers/` (angular.ts, constants.ts, factories.ts, gql-fixtures.ts, demo-data-seeder.ts)
- [x] Post-v1 additions — vetting (18), bloom entities (board/activity/workflow/project/task/prd/plan specs), wave integration, field-mappings

---

## Two-Silo Classification

### Silo 1: Unit Tests (isolated logic, testable with mocks)

Best for: services with business logic, computed signals, form validation, data transformation, state machines.

#### Priority A — Core Infrastructure (currently untested)

| File | Why Unit Test | Est. Tests |
|------|---------------|-----------|
| `graphql-read.service.ts` | Query builder logic, filter construction, pagination, field selection | 15 |
| `pipeline-write.service.ts` | Cache TTL, merge behavior, pushEntities batching, deleteEntities | 12 |
| `engagement-context.service.ts` | Computed signals (isRfp, isOwner, statusColor), refresh mechanism | 10 |
| `impersonation.service.ts` | User switching logic, effective user ID resolution | 5 |
| `feature-flags.service.ts` | Flag resolution, defaults | 4 |

**Subtotal: ~46 tests**

#### Priority B — Data Services (business logic worth isolating)

| File | Why Unit Test | Est. Tests |
|------|---------------|-----------|
| `note-hierarchy.service.ts` | Tree building, move operations, cycle detection, pendingCreations race guard | 15 |
| `engagement-hierarchy.service.ts` | Tag/resource operations, boundary resolution | 10 |
| `engagement-tasks.service.ts` | ZB Task CRUD, subtask linking, status sync | 12 |
| `bid-response.service.ts` | Compliance status computation, requirement matching | 8 |
| `provider-profiles.service.ts` | Profile CRUD, availability toggle | 6 |
| `sme-mart-resource.service.ts` | Resource tagging, link operations | 8 |
| `user-preferences.service.ts` | Preference CRUD, defaults | 4 |
| `categories.service.ts` | Category listing, caching | 4 |

**Subtotal: ~67 tests**

#### Priority C — Presentational Components (pure input/output)

| File | Why Unit Test | Est. Tests |
|------|---------------|-----------|
| `star-rating.component.ts` | Rating display, click events, half-star logic | 6 |
| `provider-card.component.ts` | Computed signals (initials, specialty display), navigate event | 5 |
| `service-card.component.ts` | Pricing format, availability badge | 4 |
| `task-card.component.ts` | Status chip, priority display, assignee | 5 |
| `note-card.component.ts` | Truncation, date formatting, folder badge | 4 |
| `timeline-event-card.component.ts` | Event type icon, relative time, actor display | 5 |
| `engagement-card.component.ts` | Status badge, bid count, navigate | 4 |
| `notification-card.component.ts` | *(already tested — 14 tests)* | — |

**Subtotal: ~33 tests**

#### Priority D — Dialogs & Forms (form validation, submit logic)

| File | Why Unit Test | Est. Tests |
|------|---------------|-----------|
| `folder-dialog.component.ts` | Form validation, parent selector, color picker, create vs edit mode | 8 |
| `vetting-item-dialog.component.ts` | Form validation, category/type dropdowns, submit payload | 6 |
| `accept-bid-dialog.component.ts` | Confirmation flow, engagement creation trigger | 4 |
| `create-subtask-dialog.component.ts` | Parent task linking, priority defaults | 5 |
| `move-note-dialog.component.ts` | Tree navigation, move validation (no self-move) | 5 |
| `rfp-dialog.component.ts` | RFP creation form, category selection | 5 |
| `engagement-form.component.ts` | Multi-field form, validation rules | 6 |
| `requirement-response.component.ts` | Compliance status selection, response text | 4 |

**Subtotal: ~43 tests**

**Unit Test Silo Total: ~189 new tests across ~29 new spec files**

---

### Silo 2: E2E Tests (user flows, multi-component, navigation)

Best for: wizard flows, tab navigation, drag-and-drop, file upload, search + filter + navigate sequences, cross-component communication.

Framework: Playwright (recommended) or Cypress.

#### Flow A — RFP Lifecycle (highest value)

| Flow | Steps | Components Touched |
|------|-------|-------------------|
| Create RFP | Home → "Post RFP" → wizard steps → publish → appears in list | rfp-dialog, rfp-wizard steps, rfp-list |
| Browse & Bid | RFP list → filter → detail → bid wizard → submit | rfp-list, catalog-filters, rfp-detail, bid-wizard steps |
| Review & Accept | Engagement detail → bids tab → compare → accept → engagement created | engagement-detail, bid-comparison, bid-review, accept-bid-dialog |
| RFP → Project | Accepted bid → project auto-created → project detail | engagement-detail, project-list, project-detail |

#### Flow B — Engagement Management

| Flow | Steps | Components Touched |
|------|-------|-------------------|
| Tab Navigation | Engagement detail → each tab loads correctly | All 8 tabs (overview, projects, documents, details, tasks, vetting, timeline, notes) |
| Vetting Checklist | Vetting tab → items seeded → expand → change status → progress updates | vetting-tab, zb-resource-status |
| Notes Workflow | Notes tab → create notebook → create folder → create note → edit → move | notes-panel, note-folder-tree, note-editor-panel, folder-dialog, move-note-dialog |
| Document Upload | Documents tab → upload → share with engagement → view in related notes | document-list, document-upload, document-share-dialog |
| Timeline | Timeline tab → compose event → filter by type → view history | timeline-panel, timeline-composer, timeline-filters |

#### Flow C — Provider & Organization

| Flow | Steps | Components Touched |
|------|-------|-------------------|
| Provider Directory | Home → browse providers → filter → card click → profile detail | home, service-catalog, provider-card, provider-detail |
| My Profile | Profile page → edit expertise → manage services → view reviews | my-profile tabs, service-card, star-rating |
| Org Dashboard | Org page → engagements tab → projects tab → documents tab | org-shell, org tabs |

#### Flow D — Search & Filtering

| Flow | Steps | Components Touched |
|------|-------|-------------------|
| Catalog Filters | Service catalog → toggle filter sections → apply → results update | catalog-filters, catalog-filter-section, filter-enabler, list-page |
| Timeline Filters | Timeline → filter by event type → date range → results | timeline-filters, timeline-filter-section, timeline-filter-enabler |

**E2E Test Silo Total: ~12-15 test scenarios across 4 flow groups**

---

### Both Silos (unit + E2E)

These components have testable isolated logic AND participate in critical user flows:

| Component | Unit Tests (logic) | E2E Tests (flow) |
|-----------|-------------------|-------------------|
| `notes-panel.component.ts` | Folder selection, search, note loading signals | Notes workflow (create → edit → move → search) |
| `document-list.component.ts` | *(already has 17 unit tests)* | Document upload → share flow |
| `bid-form.component.ts` | *(already has 14 unit tests)* | Full bid submission wizard |
| `engagement-detail` | *(already has 24 unit tests)* | Tab navigation, all child tabs |
| `rfp-detail` | *(already has 29 unit tests)* | RFP browse → bid flow |
| `catalog-filters.component.ts` | Filter state management, toggle logic | Search + filter user journey |
| `markdown-editor.component.ts` | Toolbar actions, preview toggle, sanitization | Note editing flow |
| `list-page.component.ts` | Pagination signals, search debounce, sort | Every list view (RFPs, engagements, providers) |
| `impersonation-switcher.component.ts` | User selection, session update | Demo scenarios (switch user → verify view changes) |

---

## Implementation Plan (v2)

### Phase 6: Core Infrastructure Unit Tests (~2 hrs) ✅ DONE (2026-03-26)

Focus: `graphql-read`, `pipeline-write`, `engagement-context`, `feature-flags`

55 new tests across 4 spec files:
- `graphql-read.service.spec.ts` — 14 tests (query building, pagination, getById, rawQuery)
- `pipeline-write.service.spec.ts` — 15 tests (cache TTL, merge, seedCache, push, delete)
- `engagement-context.service.spec.ts` — 23 tests (computed signals, bid parsing, state, refresh)
- `feature-flags.service.spec.ts` — 3 tests (get, isEnabled)

Note: `impersonation.service.ts` skipped — requires ZerobiasClientApp + SmeMartDbService mocks + localStorage. Better covered by E2E.

### Phase 7: Data Service Unit Tests (~3 hrs)

Focus: `note-hierarchy`, `engagement-hierarchy`, `engagement-tasks`, `bid-response`, `provider-profiles`, `sme-mart-resource`, `user-preferences`, `categories`

~67 new tests. Cover business logic in service layer.

### Phase 8: Card & Presentational Components (~1.5 hrs)

Focus: `star-rating`, `provider-card`, `service-card`, `task-card`, `note-card`, `timeline-event-card`, `engagement-card`

~33 new tests. Quick wins — pure input/output.

### Phase 9: Dialog & Form Components (~2 hrs)

Focus: `folder-dialog`, `vetting-item-dialog`, `accept-bid-dialog`, `create-subtask-dialog`, `move-note-dialog`, `rfp-dialog`, `engagement-form`, `requirement-response`

~43 new tests.

### Phase 10: E2E Test Infrastructure + First Flows (~3 hrs)

Focus: Playwright setup, auth/impersonation helper, first 2 flows:
- Flow A.1: Create RFP (wizard end-to-end)
- Flow B.1: Engagement tab navigation

~4-6 E2E test scenarios.

### Phase 11: Remaining E2E Flows (~4 hrs)

Focus: Remaining flows from Silo 2 (bidding, vetting, notes, documents, provider directory).

~8-10 E2E test scenarios.

| Phase | Type | Est. Time | New Tests | Cumulative |
|-------|------|-----------|-----------|------------|
| 6 | Unit | 2 hrs | 46 | 797 |
| 7 | Unit | 3 hrs | 67 | 864 |
| 8 | Unit | 1.5 hrs | 33 | 897 |
| 9 | Unit | 2 hrs | 43 | 940 |
| 10 | E2E | 3 hrs | 6 scenarios | 940 + 6 E2E |
| 11 | E2E | 4 hrs | 10 scenarios | 940 + 16 E2E |
| **Total** | | **~15.5 hrs** | **189 unit + 16 E2E** | |

---

## Test Helpers (`src/app/test-helpers/`)

| File | Contents |
|------|----------|
| `angular.ts` | Mock factories: `fakeSmeMartDb`, `fakeImpersonation`, `fakeSmeMartTagService`, `fakeClientApi` (Proxy-based), `fakeMatDialog`, `fakeSnackBar`, `fakeEngagementContext`, `fakeEngagementHierarchy`, `fakeDocumentService`, `fakePipelineWriteService`, `fakeGraphqlReadService` |
| `constants.ts` | Shared UUIDs and identifiers |
| `factories.ts` | Domain model factories |
| `gql-fixtures.ts` | GQL response fixtures for all entity types |
| `demo-data-seeder.ts` | Demo data generation functions |

---

*Session: `claude --resume poc/sme-mart`*
