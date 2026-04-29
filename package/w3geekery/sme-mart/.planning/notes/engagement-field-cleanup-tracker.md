# Engagement Field Cleanup Tracker

**Created:** 2026-03-25
**Context:** Schema PR #20 removed RFP/project-level fields from the Engagement GQL class. These fields are still referenced across the codebase. Some will be cleaned up during the RFP→Project refactor (Plan 075). The rest tracked here for separate cleanup.

## Removed Engagement Schema Fields

| Field (GQL) | Field (snake_case) | What it was | Where it should go |
|---|---|---|---|
| `category` | `category` | RFP category (Assessors, Advisors, etc.) | SmeMartProject |
| `budgetType` | `budget_type` | fixed/hourly/negotiable | SmeMartProject |
| `budgetMin` | `budget_min` | Budget range low | SmeMartProject |
| `budgetMax` | `budget_max` | Budget range high | SmeMartProject |
| `timeline` | `timeline` | Expected duration | SmeMartProject |
| `responseDeadline` | `response_deadline` | RFP bid deadline | SmeMartProject |
| `questionsDeadline` | `questions_deadline` | RFP Q&A deadline | SmeMartProject |
| `evaluationCriteria` | `evaluation_criteria` | Scoring criteria JSON | SmeMartProject |
| `wizardStep` | `wizard_step` | RFP wizard progress | SmeMartProject (or drop — wizard state could be localStorage) |
| `wizardData` | `wizard_data` | RFP wizard draft JSON | SmeMartProject (or drop) |
| `zerobiasBoundaryId` | `zerobias_boundary_id` | Boundary association | SmeMartProject.boundaryIds |

## Files Affected (by category)

### Will be cleaned during RFP→Project refactor (Plan 075)
These files are part of the RFP creation/bidding flow and will be rewritten:
- `pages/rfps/rfp-wizard/` — entire wizard creates Projects now, not Engagements
- `pages/rfps/rfp-detail.component.html` — displays RFP fields
- `pages/rfps/rfp-list.component.ts` — lists RFPs
- `pages/rfps/bid-wizard/` — bid submission
- `pages/rfps/bid-comparison-page.component.ts` — bid comparison
- `shared/components/rfp-dialog/rfp-dialog.component.ts`
- `core/services/rfp-wizard.service.ts` + spec
- `core/services/bids.service.ts` + spec
- `core/services/bid-ai.service.ts` + spec
- `core/services/engagements.service.ts` — createRfp/updateRfp methods move to ProjectService

### Separate cleanup needed (not part of RFP refactor)
- `core/field-mappings.ts` — ENGAGEMENT_FIELD_MAPPING still has removed fields (harmless but stale)
- `core/gql-types/engagement.types.ts` — GqlEngagementResponse has removed fields
- `core/models/engagement.model.ts` — Engagement interface has removed fields
- `core/models/rfp.model.ts` — RFP-specific types that reference engagement fields
- `core/services/engagement-context.service.ts` — no direct refs but consumers use removed fields
- `core/services/engagement.roundtrip.spec.ts` — tests reference removed fields
- `core/mappers/work-request-resource.mapper.spec.ts` — mapper test
- `pages/engagements/engagement-edit.component.ts` — edit form uses removed fields
- `pages/engagements/engagement-new.component.ts` — create form uses removed fields
- `pages/engagements/engagement-list.component.ts` + spec — list displays category
- `pages/engagements/tabs/overview-tab.component.html` — already fixed (category removed)
- `pages/org/tabs/engagements-tab.component.ts` — org-level engagement list
- `pages/home/home.component.ts` + html — home page featured engagements show category/budget
- `pages/admin/admin-dashboard.component.ts` — admin views
- `shared/components/engagement-card/engagement-card.component.ts` + html — card shows category/budget
- `test-helpers/factories.ts` — test factories
- `test-helpers/gql-fixtures.ts` — GQL test fixtures
- `test-helpers/demo-data-seeder.ts` — demo engagement data (already updated for new model but DemoEngagement interface still has old fields)
- `core/models/demo-data.model.ts` — DemoEngagement interface has old fields
- `core/services/wave-1-integration.spec.ts` — integration tests

### Not affected (different entities use same field names)
These files reference `category`, `budget_type`, etc. on ServiceOffering or Bid — NOT Engagement. No cleanup needed:
- `core/services/catalog.service.ts` + spec — ServiceOffering.category
- `core/services/service-offerings.service.ts` + spec — ServiceOffering fields
- `core/gql-types/service-offering.types.ts` — ServiceOffering GQL type
- `core/gql-types/bid.types.ts` — Bid GQL type
- `pages/services/service-catalog.component.ts` + html — ServiceOffering display
- `shared/components/service-card/` — ServiceOffering card
- `pages/my-profile/my-profile-services.component.ts` + html — provider's offerings

## GQL Query Fix Already Done
- `engagements.service.ts` `getEngagementFields()` — removed fields from GQL query list (2026-03-25). This prevents the 500 error. The model still has the fields as optional/undefined.

## Priority
- **RFP flow files** — cleaned during Plan 075 execution
- **Engagement model/mapper/card** — clean after Plan 075 when we know the final shape
- **Test files** — clean last, after production code stabilizes
