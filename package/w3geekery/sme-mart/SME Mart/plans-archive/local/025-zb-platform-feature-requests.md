# Plan 025: ZeroBias Platform Feature Requests

**Status:** Living document — add requests as they arise
**Phase:** N/A (tracks dependencies on ZB platform team)
**Owner:** Clark to coordinate with Kevin
**Updated:** 2026-02-25

---

## Purpose

Track features that SME Mart needs from the ZeroBias platform. These are coordination items with Kevin (CIO) and the ZB platform team.

## Feature Requests

### FR-001: Project Entity

**Priority:** High
**Status:** On Kevin's roadmap (near-term)
**SME Mart Plan:** [022-project-layer.md](./022-project-layer.md)

**What it is:** Tag-based wrapper above Boundaries. Projects bind boundaries, tasks, subtasks, products, API ops, and data objects. Owned by org, inherit org permissions. Gets a Tag, two groups (Members + Admins), tag-based access rules. Can span multiple boundaries.

**SME Mart need:** Organize work into scopes above org-to-org engagements (boundaries). $ tracking, transparency rollups, and worker background checks happen at project level.

**Current status:** Kevin has this on his near-term roadmap. No ETA given beyond "soon."

**SME Mart strategy:** Wait for platform primitive rather than building our own Neon-based project model.

---

### FR-002: Custom Task Activities (SubTask Typing)

**Priority:** Medium
**Status:** Near-term on Kevin's roadmap
**SME Mart Plan:** [023-transparency-center.md](./023-transparency-center.md)

**What it is:** ZB Task Activities define custom fields on tasks/subtasks. Currently not customizable, but near-term plan to allow creating custom Activities.

**SME Mart need:** Categorize subtasks as Legal, Financial, Cyber/Compliance, or Functional Outcomes. This enables the Transparency Center to aggregate data by dimension (SubTask → Task → Boundary → Project).

**Current status:** Kevin has custom Activities on his near-term roadmap.

**SME Mart strategy:** Use tags or Neon metadata for subtask categorization until custom Activities ship. When they do, migrate to platform-native typing.

---

### ~~FR-003: Task/Boundary Attachments~~ — SOLVED

Task Attachments already exist in the ZB SDK. Uploads go to AWS, owned by ZB. No platform change needed. SME Mart can use the existing SDK attachment API for evidence documents, deliverables, and legal docs.

---

### ~~FR-004: Boundary-Scoped Visibility~~ — SOLVED

Boundary Manager app already enforces visibility. Resources NOT in the boundary are not visible. This is platform-level enforcement, not just UI. No additional feature request needed.

---

### FR-005: Scoring App (Awareness Check)

**Priority:** Medium
**Status:** Unknown — need to check with Kevin
**SME Mart Plan:** [024-readiness-scoring.md](./024-readiness-scoring.md)

**What it is:** Brian (CEO) specified that Scoring is a separate ZB functional app. It computes provider performance scores from readiness data + engagement outcomes + buyer reviews.

**SME Mart need:** Display scores on provider profiles. SME Mart consumes scoring data, does not compute it.

**Action:** Ask Kevin if a ZB Scoring app is on his radar or being planned. Brian expects it as a platform app.

---

### FR-006: Billing App (Awareness Check)

**Priority:** Medium
**Status:** Unknown — need to check with Kevin
**SME Mart Plan:** N/A (SME Mart consumes billing data)

**What it is:** Brian (CEO) specified that Billing is a separate ZB functional app. It handles invoicing, payments, and financial tracking.

**SME Mart need:** Display billing status in transparency views. SME Mart consumes billing data, does not build billing.

**Action:** Ask Kevin if a ZB Billing app is on his radar or being planned. Brian expects it as a platform app.

---

### FR-007: Task `dueDate` Field

**Priority:** Medium
**Status:** Not yet requested — add to next Kevin sync
**SME Mart Plan:** [Proposal 002](../../proposals/002-schedule-sync-pm-integration.md)

**What it is:** A native `dueDate` field on ZB Tasks. Currently Tasks have no date-based fields beyond `created`/`updated`.

**SME Mart need:** Synced milestones from external PM tools (Jira, Asana, etc.) currently live in Neon `engagement_milestones` because ZB Tasks can't hold due dates. If Tasks get `dueDate`, milestones could be ZB Tasks and get platform-level visibility, notifications, and audit trail for free.

**SME Mart strategy:** Store in Neon `engagement_milestones` now. Migrate to ZB Tasks when `dueDate` ships.

---

### FR-008: Exposed `hydra.cron` Table / Cron API

**Priority:** Medium
**Status:** Kevin confirmed it's planned but "not near future"
**SME Mart Plan:** [Proposal 002](../../proposals/002-schedule-sync-pm-integration.md)

**What it is:** The `hydra.cron` table powers pipeline scheduling, alert bot triggers, and timed events. Currently internal to the platform — no SDK API to create/manage cron entries from external apps.

**SME Mart need:** SME Mart needs cron-like scheduling for iCal feed polling, milestone reminders, and periodic reports. We've built `sme_cron` in Neon as a mirror of `hydra.cron` (same columns, same lifecycle patterns). When the platform exposes cron, we migrate rows directly.

**SME Mart strategy:** `sme_cron` (Neon) now → `hydra.cron` (platform) when available. Service swap, not a rewrite.

---

### FR-009: Outbound Webhook Delivery

**Priority:** Low
**Status:** HTTP Notification Endpoint schema exists but no delivery implementation
**SME Mart Plan:** [Proposal 002](../../proposals/002-schedule-sync-pm-integration.md)

**What it is:** The ability for the ZB platform to push events (CronEvents, change events) to external HTTP endpoints.

**SME Mart need:** Would enable two-way PM tool sync — when engagement status changes in SME Mart, push update back to customer's Jira/Asana. Currently deferred (read-only sync is 90% of the value).

**SME Mart strategy:** Defer. Revisit if customers request two-way sync.

---

### ~~FR-010: Tag API — Prefix/Pattern Search & Filtering~~ — ANSWERED

**Priority:** ~~High~~ → **No platform change needed**
**Status:** **Answered (2026-03-04)** — `searchTags` POST already supports prefix matching
**SME Mart Plan:** [029-hierarchical-tag-naming.md](./029-hierarchical-tag-naming.md)

**Finding:** `searchTags` POST with `TagSearchBody.name` does partial/prefix matching at any depth:
- `"sme-mart.eng."` → 5 results (all engagement tags)
- `"sme-mart.eng.amber"` → 1 result (specific engagement)
- `"sme-mart.test.dots.in"` → 1 result (deep prefix)

**Note:** `listTags` GET `nameFilter` param is broken (server ignores it, returns all tags). Use `searchTags` POST exclusively.

**Glob/wildcard:** Not supported server-side. Cross-dimension queries (e.g., `sme-mart.*.*.Project-X.*`) require client-side filtering after fetching broader prefix results. Acceptable for expected tag volumes.

---

### ~~FR-011: Tag Name Character Constraints & Length Limits~~ — ANSWERED

**Priority:** ~~Medium~~ → **No platform change needed**
**Status:** **Answered (2026-03-04)** — found constraints in ZB source code
**SME Mart Plan:** [029-hierarchical-tag-naming.md](./029-hierarchical-tag-naming.md)

**Finding:** Tag names use PostgreSQL `nmtoken` domain:
```sql
CREATE DOMAIN nmtoken AS text CHECK (VALUE ~* '^[A-Z0-9\.\_\-\:]+$')
```

- **Allowed characters:** `A-Z`, `0-9`, `.`, `_`, `-`, `:` (case insensitive)
- **Max length:** **None** — unbounded `text` type
- **Separator decision:** `.` (dot) confirmed working. No issues with deep prefixes.
- **Slashes (`/`):** NOT allowed — regex doesn't include them
- **Sources confirmed:** DB schema (`hydra-schema-principal/security.sql`), API spec (`dana/app/src/api/tag.yml`), frontend validation, implementation layer

---

### FR-012: Tag Assignment to Arbitrary Resource Types

**Priority:** Medium
**Status:** Not yet investigated
**SME Mart Plan:** [026-notes-feature.md](./026-notes-feature.md)

**What it is:** Confirm whether ZB tags can be assigned to any resource type, or only to specific entity types (Tasks, Boundaries, etc.).

**SME Mart need:** Notes are Neon-native entities (not ZB platform resources). If ZB tags can only be assigned to ZB resource types, SME Mart would need to:
- Store tag assignments in Neon (note_id → zb_tag_id mapping)
- Use ZB Tag API for tag CRUD and search only
- Keep `note_tag_assignments` table for the note↔tag relationship

If ZB tags support arbitrary resource IDs, the assignment can live entirely in ZB.

**First step:** Check Tag assignment API — does it require a ZB resource UUID, or accept arbitrary IDs?

---

### FR-013: Core Types — `decimal`, `currency`, `money`

**Priority:** High
**Status:** Kevin confirmed needed (2026-03-06)
**SME Mart Plan:** Billing/financial data in engagements, proposals, budgets

**What it is:** Three new core types for the ZB platform:
- **`decimal`** — precise decimal number (not floating point)
- **`currency`** — ISO 4217 currency code (e.g., `USD`, `EUR`, `GBP`)
- **`money`** — composite: `decimal` + `currency` (amount with currency context)

**Context from Kevin (2026-03-06):**
> "I thought we had a money core type... not seeing one. There is `numeric` but that is anything number-like. We need currency (ISO 4217), decimal, and money which is decimal + currency."

**SME Mart need:** Engagement budgets, proposal pricing, billing amounts, cost tracking all require precise monetary values with currency context. Currently using `numeric` or `text` as workarounds.

**SME Mart strategy:** Use Neon `numeric(12,2)` + `text` (currency code) columns until platform core types ship. Migration should be straightforward — same underlying data, new type constraints.

---

### FR-014: FileService Root Folder Initialization (CI)

**Priority:** High
**Status:** Infra issue — needs Nick/Chris
**SME Mart Plan:** [031-document-upload-to-project.md](./031-document-upload-to-project.md)

**What it is:** Two infra issues blocking FileService uploads on CI:
1. **Root folder not initialized** — `fileClient.getFileApi().create()` fails with "Expected a single root folder" for some orgs. The FileService server requires a root folder to exist before files/folders can be created.
2. **S3 IAM permission** — `us-east-1-dev-file-service-role` lacks `s3:PutObject` on `us-east-1-dev-auditmation-file-service` bucket. Even ZB platform UI fails on binary upload.

**SME Mart strategy:** Graceful degradation — FileService upload wrapped in try/catch, metadata stored in Neon regardless. Binary upload will work once infra issues are resolved.

---

## Summary

| FR | Title | Status | Action Needed |
|----|-------|--------|---------------|
| FR-001 | Project Entity | On Kevin's roadmap | Wait for platform. No ETA beyond "soon." |
| FR-002 | Custom Task Activities | On Kevin's roadmap | Wait for platform. Use tags/metadata as interim workaround. |
| ~~FR-003~~ | ~~Attachments~~ | **Solved** | SDK already supports task attachments → AWS. |
| ~~FR-004~~ | ~~Boundary Visibility~~ | **Solved** | Boundary Manager app handles this. |
| FR-005 | Scoring App | **Unknown** | Ask Kevin if this is on his radar. |
| FR-006 | Billing App | **Unknown** | Ask Kevin if this is on his radar. |
| FR-007 | Task `dueDate` | **Not requested** | Add to next Kevin sync. Using Neon milestones as workaround. |
| FR-008 | Exposed `hydra.cron` | **Planned (no ETA)** | Kevin confirmed. `sme_cron` mirrors schema for migration. |
| FR-009 | Outbound Webhooks | **Schema exists** | Low priority. Deferred until two-way sync demand. |
| ~~FR-010~~ | ~~Tag API Prefix Search~~ | **Answered** | `searchTags` POST does prefix matching. No platform change needed. |
| ~~FR-011~~ | ~~Tag Name Constraints~~ | **Answered** | `nmtoken`: A-Z 0-9 . _ - : (case insensitive), no max length. |
| FR-012 | Tag Assignment to Any Resource | **Not investigated** | Check if tags can be assigned to non-ZB resources (Neon notes). |
| FR-013 | Core Types: decimal/currency/money | **Kevin confirmed needed** | Kevin adding to platform. Use Neon numeric + text as workaround. |
| FR-014 | FileService Root Folder Init (CI) | **Infra issue** | Needs Nick/Chris. Two issues: root folder + S3 IAM permission. |

---

*Updated: 2026-03-06 — FR-013 (core types) from Kevin sync, FR-014 (FileService infra) from upload testing.*
