---
source: graphql.Boundary.boundaryExecuteRawQuery
surface: GQL
verified: 2026-04-27
uat_tested: true
---

## Signature

**`graphql.Boundary.boundaryExecuteRawQuery(boundaryId: UUID, executeRawGraphqlQuery: ExecuteRawGraphqlQuery, ...): Promise<ExecuteGraphqlQueryResult>`**
- HTTP: `PUT /boundaries/{boundaryId}`
- Body: `executeRawGraphqlQuery: { query: string, operationName?, variables?, pagination?, viewProperties? }`
- Path/query params: `boundaryId` (path, required); optional `pageNumber`, `pageSize`, `sort`, `tags`, `op`, `asOf`, `start`, `stop`, `latest`, `graph`, `includeRawData`
- Org-scoping: query is automatically scoped to the requested boundary; classes from other boundaries are not visible.
- Filter syntax: RFC4515 dot-prefix operators inside GQL field args, e.g. `Engagement(id: ".eq.<uuid>")`, `MarketplaceProfileItem(orgId: ".eq.<uuid>")`. Tag filter via `tag: { value: ".eq.<tag-uuid>" }` (per DECISIONS.md "Object.tag Field Shape").
- Schema introspection works: `__type(name: "Foo") { fields { name type { name kind ofType { name kind } } } }` — used to enumerate class fields when memory is stale.

## Sample Responses (W3Geekery boundary, real values, captured 2026-04-27)

### Engagement (default ZB engagement, 1 record)

Query: `{ Engagement(id: ".eq.746010b7-dc99-436b-9142-8c4b85c5e623") { id, name, engagementTag, dateCreated, dateLastModified, buyerZerobiasOrgId, buyerZerobiasUserId, tag { value } } }`

```json
{
  "data": {
    "Engagement": [
      {
        "id": "746010b7-dc99-436b-9142-8c4b85c5e623",
        "name": "W3Geekery <- ZeroBias",
        "engagementTag": "default-project",
        "zerobiasTagId": "a81cd320-243e-44eb-bdd9-9824019ef3dd",
        "zerobiasTaskId": "2c95bc18-a978-4766-a7d3-f7ceb8a9cff5",
        "dateCreated": "2026-04-24",
        "dateLastModified": "2026-04-27",
        "buyerZerobiasOrgId": "cd7105df-523d-5392-9f9a-3f83d3f30107",
        "buyerZerobiasUserId": "3da9385a-5d15-4d19-84ab-e1c9ce8d84ed",
        "tag": [{ "value": "a81cd320-243e-44eb-bdd9-9824019ef3dd" }]
      }
    ]
  },
  "gqlCount": { "Engagement": 1 }
}
```

All four tag-related fields now consistent: `engagementTag` (string discriminator), `zerobiasTagId` (UUID scalar), `zerobiasTaskId` (meta-tracker FK), and `tag` (Object.tag array). Object.tag remediation pushed 2026-04-27 — see DECISIONS.md "W3Geekery Object.tag Remediation".

### SmeMartProject (19 records: 2 default-engagement projects + 6 demo Project records + 11 RFP records)

Query: `{ SmeMartProject { id, name, description, status, projectType, engagementId, category, tag { value } } }` — returns 19 records. Notable findings:

```json
[
  {
    "id": "64047b6c-52e7-4592-ac1d-27f5020d1e01",
    "name": "TAG-SHAPE-TEST-C",
    "description": "Throwaway record for Object.tag shape experiment. Shape C-prime: [{value: tagId}].",
    "status": "active",
    "projectType": "project",
    "engagementId": "746010b7-dc99-436b-9142-8c4b85c5e623",
    "category": null,
    "tag": [{ "value": "a81cd320-243e-44eb-bdd9-9824019ef3dd" }]
  },
  {
    "id": "ea4db55f-2c57-4567-a1be-6e7fd1a210bf",
    "name": "SME Mart Platform Development",
    "status": "active",
    "projectType": "project",
    "engagementId": "746010b7-dc99-436b-9142-8c4b85c5e623",
    "category": "Development",
    "tag": null
  },
  {
    "id": "proj-001-crystal-harbor",
    "name": "SOC 2 Type I Fast-Track Assessment",
    "status": "active",
    "projectType": null,
    "engagementId": null,
    "category": "Assessors",
    "tag": null
  },
  {
    "id": "rfp-004-fedramp",
    "name": "FedRAMP Readiness Assessment",
    "status": "draft",
    "projectType": null,
    "engagementId": null,
    "category": "Assessors",
    "tag": null
  }
]
```

(Sample of 4 from 19. Pattern: real default-engagement projects have `engagementId` set + `projectType: "project"`; demo seeder records (proj-NNN, rfp-NNN) have `engagementId: null` and `projectType: null`.)

### MarketplaceProfileItem (2 test records on UAT for W3Geekery boundary, 0 production records)

Query: `{ MarketplaceProfileItem(orgId: ".eq.cd7105df-...") { id, section, data, status } }` returns the two replace-test residues (`mpi-test-a-cd7105df`, `mpi-test-b-cd7105df`) — see "Test residue" in Known Gaps.

**Schema is generic, not structured.** No `legalName`, `dba`, `logoUrl`, `shortDescription`, `longDescription`, `website`, `hqLocation`, `yearsInBusiness`, `employeeCount` fields exist on `MarketplaceProfileItem`. The Phase 28 plan assumed structured fields; reality is a section/data model where each profile attribute is its own record. Per-class `description` (from `platform.Class.getClass`): "Vendor/buyer profile item containing credentials, certifications, references, insurance info, or personnel data. Uses section discriminator + JSON data blob for flexible content."

Schema fields:
- `section` (string) — the profile field name (e.g., `"legal_name"`, `"logo_url"`, `"long_description"`)
- `data` (string) — the value (string-typed per class spec: "JSON-serialized section-specific data blob"; for plain values pass plain strings)
- `orgId` (string scalar, not link) — owning org
- `status` — `active`, `expired`, `draft`, `archived`
- `expiresAt` — optional TTL (ISO 8601 date)
- `product` — optional Product link
- `tag` — optional tag list (e.g., to mark buyer-profile vs provider-profile)

**Pipeline.receive replace semantics (validated 2026-04-27 via UAT experiment):** Replace key is **`id` only** (only `id` and `url` are `keyed: true` on the class). Ingesting one MPI record does NOT clobber other MPI records with different ids. This makes per-section saves safe.

**Recommended id strategy for Phase 28:** Deterministic id per `(orgId, section)`. The `id` field is `string` (not strict UUID), so a structured slug like `mpi-<orgId>-<section>` works — e.g., `mpi-cd7105df-523d-5392-9f9a-3f83d3f30107-legal_name`. Each form field gets a stable id; saves are independent; no risk of cross-section collision.

## Field List

### Engagement (29 fields)

| Field | Type | Always Populated? | Notes |
|---|---|---|---|
| id | String (UUID) | yes | Class id |
| name | String | yes | Display name |
| status | String | yes | Engagement status |
| engagementTag | String | yes | Short-name tag (`default-project` for default ZB engagement) |
| dateCreated | String (date) | yes | YYYY-MM-DD format |
| dateLastModified | String (date) | yes | YYYY-MM-DD |
| dateDeleted | String | sometimes | Soft-delete timestamp |
| description | String | sometimes | |
| note | String | sometimes | |
| url | String | sometimes | |
| icon | String | sometimes | |
| aliases | [String] | sometimes | |
| buyerZerobiasOrgId | String (UUID) | yes | Buyer org id |
| buyerZerobiasUserId | String (UUID) | yes | Buyer user id |
| zerobiasTagId | String (UUID) | sometimes | Tag id reference (vs `tag` array) |
| zerobiasTaskId | String (UUID) | sometimes | Linked Task id (engagement coordination task per memory) |
| facilitatorUserId | String (UUID) | sometimes | Facilitator/SME |
| communicationMode | String | sometimes | |
| product | Product (object) | sometimes | Linked Product |
| tag | [Tag] | sometimes | Tag list per Object.tag shape |
| metadata | objectMetadata | yes | Class metadata (system-managed) |
| includes | [String] | sometimes | |
| _links | [link] | sometimes | |
| vettingItems | [EngagementVettingItem] | sometimes | Sub-records |
| noteFolders | [NoteFolder] | sometimes | Sub-records |
| documents | [SmeMartDocument] | sometimes | Sub-records |
| reviews | [Review] | sometimes | Sub-records |
| notes | [Note] | sometimes | Sub-records |

### SmeMartProject (47 fields — much richer than Plan 25-03 assumed)

| Field | Type | Notes |
|---|---|---|
| id | String | |
| name | String | |
| description | String | |
| status | String | `active`, `draft`, `published`, etc. |
| projectType | String | `project`, etc. (null for demo seeder records) |
| category | String | `Assessors`, `Advisors`, `Agentic`, `Training`, `Data Services`, `DevSecOps`, `SecOps`, `Development`, etc. |
| engagementId | String (UUID) | FK to Engagement (null on demo records) |
| ownerId | String | |
| ownerType | String | |
| timeline | String | |
| startDate | String (date) | |
| targetEndDate | String (date) | |
| responseDeadline | String (date) | RFP-specific |
| questionsDeadline | String (date) | RFP-specific |
| budgetMin | Float | |
| budgetMax | Float | |
| budgetType | String | |
| industry | String | |
| complianceFrameworkIds | [String] | |
| evaluationCriteria | String | |
| isInvitationOnly | Boolean | |
| formConfig | String | (JSON-string) |
| wizardData | String | (JSON-string) |
| wizardStep | String | |
| boundaryIds | [String] | |
| dateCreated, dateLastModified, dateDeleted | String | |
| description, name, note, url, icon, aliases | scalar/list | |
| product | Product | |
| tag | [Tag] | |
| metadata, includes, _links | system fields | |
| boards | [SmeMartBoard] | Children |
| prds | [ProjectPrd] | Children |
| plans | [ProjectPlan] | Children |
| rfpInvitations | [RfpInvitation] | Children |
| formSubmissions | [FormSubmission] | Children |
| documentInstances | [DocumentInstance] | Children |
| bids | [Bid] | Children (RFP-bound) |
| documents | [SmeMartDocument] | Children |
| reviews | [Review] | Children |
| noteFolders | [NoteFolder] | Children |
| notes | [Note] | Children |

### MarketplaceProfileItem (20 fields, generic)

| Field | Type | Notes |
|---|---|---|
| id | String | |
| name | String | |
| description | String | |
| status | String | |
| section | String | **The profile field name** (e.g. `legal_name`, `dba`) |
| data | String | **The profile field value** (string-encoded; JSON for structured values) |
| orgId | String (UUID) | Owning org |
| url | String | |
| expiresAt | String | TTL |
| product | Product | Optional product association |
| tag | [Tag] | E.g., to distinguish buyer-profile vs provider-profile |
| dateCreated, dateLastModified, dateDeleted | String | |
| icon, note, aliases | scalar/list | |
| metadata, includes, _links | system fields | |

### Bid (29 fields)

| Field | Type | Notes |
|---|---|---|
| id, name, status, description | scalar | |
| providerId | String | Provider org id |
| project | SmeMartProject | Linked RFP/project |
| price | Float | |
| pricingModel | String | |
| pricingBreakdown | String | (JSON-string) |
| coverLetter | String | |
| executiveSummary | String | |
| teamDescription | String | |
| totalEstimatedHours | Float | |
| timeline | String | |
| bidValidUntil | String (date) | |
| wizardStep | Float | |
| wizardData | String | (JSON-string) |
| formSubmission | FormSubmission | Linked submission |
| responses | [BidResponse] | Children (per-question answers) |
| dateCreated, dateLastModified, dateDeleted, name, description, note, url, icon, aliases, product, tag, metadata, includes, _links | system/base | |

## RFC4515 Filter Examples

```graphql
# By id
{ Engagement(id: ".eq.746010b7-dc99-436b-9142-8c4b85c5e623") { id, name } }

# By engagementTag (string equality)
{ Engagement(engagementTag: ".eq.default-project") { id, name, buyerZerobiasOrgId } }

# By orgId scoped lookup
{ MarketplaceProfileItem(orgId: ".eq.cd7105df-523d-5392-9f9a-3f83d3f30107") { id, section, data } }

# By tag (Object.tag shape: [{value: tagId}])
{ SmeMartProject(tag: { value: ".eq.a81cd320-243e-44eb-bdd9-9824019ef3dd" }) { id, name } }

# Status not-equal
{ SmeMartProject(status: ".ne.draft") { id, name, status } }
```

Operators (per DECISIONS.md): `.eq.`, `.ne.`, `.sw.` (starts-with), `.in.`, etc.

## Pre-fill Map Contributions

**Major correction:** MarketplaceProfileItem does NOT have structured profile fields. Phase 28 form pre-fill MUST go through the section/data pattern:

For each form field in `company_info`:
1. Query `MarketplaceProfileItem(orgId: ".eq.<currentOrgId>", section: ".eq.<form_field_key>") { data }`
2. Read the `data` string (parse if JSON-encoded for structured values)
3. Write back: ingest a new MarketplaceProfileItem record with matching `orgId` + `section`, `data` set to user input (Pipeline.receive at ingest time, full-replace semantics)

| Phase 28 form field | MarketplaceProfileItem section | Type encoding |
|---|---|---|
| legal_name | `legal_name` | plain string in `data` |
| dba | `dba` | plain string |
| logo_url | `logo_url` | plain string (URL) |
| short_blurb | `short_blurb` | plain string |
| long_description | `long_description` | plain string (may be markdown) |
| primary_contact | `primary_contact` | JSON-encoded `{ userId, name, email }` |
| website | `website` | plain string (URL) |
| hq_location | `hq_location` | JSON-encoded `{ street, city, state, country, postal }` or plain |
| years_in_business | `years_in_business` | numeric-as-string |
| employee_count | `employee_count` | numeric-as-string or range string |

**Cross-reference fallback (when no MarketplaceProfileItem record exists):**
- `legal_name` ← `danaOld.Org.getOrg.name` (always populated; reasonable default)
- `logo_url` ← `danaOld.Org.getOrg.avatarUrl` (when set)
- All other fields require explicit user input (no upstream source on UAT)

## Known Gaps / Edge Cases

- **MarketplaceProfileItem schema mismatch.** Plan 25-03 assumed structured fields; reality is generic section/data. **All downstream Phase 28 design must reflect this.** Section names need to be canonicalized in a constants file (per Brian's "company_info convention" draft).
- **No MarketplaceProfileItem records exist on UAT** for W3Geekery boundary. Pre-fill behavior must gracefully handle "no records yet" (use Org defaults, prompt for everything).
- **Engagement `tag` was originally null** (W3Geekery walkthrough used batch-level `tagIds` instead of per-record `tag`; gap accepted at the time per refinement #18). Remediated 2026-04-27 — re-ingested both Engagement and default SmeMartProject via Pipeline.receive with `tag: [{value: "a81cd320-..."}]`. Tag-filter discovery now works uniformly: `Engagement(tag: {value: ".eq.<id>"})` returns the W3Geekery engagement; `SmeMartProject(tag: {...})` returns both TAG-SHAPE-TEST-C and the default project. See DECISIONS.md "W3Geekery Object.tag Remediation".
- **`engagementTag` string vs `tag` array vs `zerobiasTagId` scalar** — three tag-related fields per Engagement. Disambiguate in usage:
  - `engagementTag` — short human-readable label (`default-project`)
  - `zerobiasTagId` — UUID reference, scalar
  - `tag` — Object.tag array `[{value: tagId}]`, possibly empty
- **Date fields are DATE not DATETIME.** `dateCreated: "2026-04-24"`, no time portion. Phase 28 form must render as date picker.
- **`projectType: null` on demo records** — distinguishes "real" projects from seeder records. Filter on `.ne.null` or `.eq.project` for production project lists.
- **`category` taxonomy is free-text** (Assessors, Advisors, Agentic, Training, etc.). Not validated server-side; client-side enum recommended.
- **Schema introspection is the source of truth** when memory diverges. Use `__type(name: "Foo") { fields { ... } }` before assuming field shapes.
- **Page-by-default behavior unknown** — large queries may need explicit `pageNumber/pageSize` outside the GQL body or `pagination` inside. Defer until pagination shows up as a problem.
- **Bid is a child of SmeMartProject (RFP)**, not a top-level class for buyer-profile work. Out of scope for Phase 28 pre-fill; relevant to Phase 26+ marketplace flows.

## Write-Path Target (D-12)

All class objects write through **Pipeline.receive** at ingest time:
- `Pipeline.receive(boundaryId, pipelineId, classId, items[])` — full-replace semantics per memory
- `pipelineId` for SME Mart UAT: `43f08afd-7ab9-4e99-a93c-619c46adaabe` (per DECISIONS.md)
- Object.tag is set in the same record at ingestion: `tag: [{ value: "<tag-uuid>" }]`
- No post-ingest mutation API for class fields. Editing a Profile field = re-ingest the MarketplaceProfileItem with the new `data` value.

Phase 28 form save flow:
1. Validate input
2. For each changed field, ingest a MarketplaceProfileItem with matching `orgId + section`, new `data`
3. Pipeline.receive applies full-replace at the (orgId, section) key
4. Re-query to confirm and update UI

Out of scope for Phase 25 audit; documented for Phase 28 design.
