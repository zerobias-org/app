# 3P Organization Signup & Engagement Flow

> **Status:** Plan draft v3, 2026-04-20 (post-Slack huddle with Brian). Updated 2026-04-22 with context-bootstrap section.
> **Intent:** This plan is **self-sufficient** — a fresh Claude session reading this file should have enough context to enter GSD discuss → plan → execute for this work without needing a restart_context.md.

---

## Context bootstrap — read these first (in order)

Required reading for a cold-start session before touching any code:

1. **`CLAUDE.md`** at project root (`package/w3geekery/sme-mart/CLAUDE.md`) — stack constraints, team, ngx-library, Angular 21 patterns, ZB SDK conventions
2. **`~/.claude/CLAUDE.md`** — user-level preferences (Pacific Time, Clark, MCP usage, git discipline)
3. **`.claude/notes/meetings/2026-04-20-slack-huddle-project-hierarchy-qa.md`** — Brian's authoritative decisions on Portfolios / Linked Projects / Sub-Projects (sourced by the architectural decisions below)
4. **`.claude/notes/plans/hierarchy-brief-for-nic.md`** — Open questions Slacked to Nic about Linked Project implementation mechanism; his answer will inform Phase 4+
5. **`.planning/director/backlog/002-demo-data-cleanup-and-visibility.md`** — **Prerequisite to Phase 6 seeder work**; demo data cleanup + visibility conventions must land first
6. **`.planning/director/backlog/003-generic-sql-hub-module-uat-neon.md`** — Adjacent infra work; moves UAT off direct-Neon onto Hub module. Independent of this plan, but both touch UAT env configs
7. **`.planning/BACKLOG.md`**, **`.planning/PROJECT.md`**, **`.planning/ROADMAP.md`** — milestone state

## Stakeholders & who to ask what

| Person | Role | Owns / decides |
|---|---|---|
| **Brian Hierholzer** | CEO | Business directives, pricing tiers, guild tier rules, ToS/legal docs, brand assets, seed data identities. **Meetings Tue/Fri.** |
| **Kevin** | CIO | Platform / Hub infrastructure, pipeline health on UAT, ZB signup embed viability, `engagementTag` collisions. Escalate infra issues here. |
| **Nic** | GQL expert ("king of GQL") | Linked Project implementation mechanism (hydra link_type rows vs CE10 flat relations vs new link class vs platformized). **See `hierarchy-brief-for-nic.md` Q1.** |
| **Chris** | Dana/login SDK author | `dana-login-sdk` changes; `nextPath` is his authoritative spec decision. |
| **Clark** | W3Geekery contractor (self) | SME Mart frontend + schema PRs. 15 hrs/week cap. |
| **Andrey** | AWS/infra | AWS IAM roles, S3 buckets, DNS subdomains. UAT `w3geekery.uat.zerobias.com` CloudFront routing is his (currently in flight — see Current State below). |

## Current state (2026-04-22)

- **UAT is live** at `uat.zerobias.com` (migration from CI completed 2026-03-30; tracker at `.claude/notes/uat-migration-tracker.md`). SME Mart SPA and custom login both deployed to UAT.
- **UAT login subdomain** (`w3geekery.uat.zerobias.com` or `sme-mart.uat.zerobias.com`) is **not yet provisioned** — Andrey's side. Login package is deployed to S3 and routing via `uat.zerobias.com/login/` works for the default login, but the branded SME Mart login needs a subdomain CNAME + CloudFront alternate-domain config. **Does not block this plan's Phase 1–2** — onboarding flow uses the default login path. Will re-verify once subdomain lands.
- **SME Mart prod schema:** all 22 classes live in `@zerobias-org/product-w3geekery-smemart`. No schema work needed for this plan. Key classes summarized below.
- **AuditgraphDB pipeline** (SME Mart receiver): **healthy on prod**; UAT health **unconfirmed** (Phase 1 verification — ask Kevin).
- **UAT boundary (W3Geekery org):** `c15fb2dc-...` (cutover 2026-04-16). All UAT development uses this boundary, not the old CI Auditmation Dev boundary.

## Constraint recap

W3Geekery is a 3rd-party developer. We can only modify:
- Angular app code (`src/`)
- Our GQL schema (`zerobias-org/schema/package/w3geekery/smemart/`)

Platform, auth, Hub, file service, Org, Tasks — we consume, don't modify.

## Key architectural decisions (locked, Brian 2026-04-20)

| Decision | Source |
|---|---|
| All Portfolios (Engagement / Project / Workspace / Task) are UI views, not entities | Brian A1/A2/A3 |
| Sub-Project rejected; replaced with Linked Project (typed link between two SmeMartProjects) | Brian A4 |
| Multi-3PAO = N separate Engagements linked into one primary Project | Brian A5 |
| Transparency can exist at any tier, no fixed depth; link type determines cross-link transparency | Brian A6 |
| Every customer gets a default `project-zerobias-platform` — ZB as platform tenant; "we are dog-fooding, we have no choice" | Brian B |
| Seed data must be real (HIS/Goshen/ArmorStack/ZB), not fake | Brian B |
| Linked Project implementation mechanism is Nic's call | Clark 2026-04-20 |
| Zero new schema classes for this plan | This plan |
| Writes via `platform.Pipeline.receive` (full-replace); reads via platform GQL | Existing convention |

## Brian's directive summary

- Every customer gets a default `zerobias-platform` project where ZB is seller, customer is buyer — "we are dog-fooding; we have no choice"
- Current ZB signup will eventually be replaced by SME Mart's engagement flow ("everyone comes in the front door"); for MVP, create profiles manually ("back door")
- Multi-party collaboration uses **Linked Projects** (not nested sub-projects), via **typed hydra links** between project resources — some links carry data permissions, some are structural-only
- Portfolios (Engagement / Project / Workspace / Task) are all **UI views only** — zero new schema classes

---

## Constraint recap

W3Geekery is a 3rd-party developer. We can only modify:
- Angular app code (`src/`)
- Our GQL schema (`zerobias-org/schema/package/w3geekery/smemart/`)

Platform, auth, Hub, file service, Org, Tasks — we consume, don't modify.

## Updates from 2026-04-20 Brian huddle

1. **No new Portfolio classes** (Workspace/Task/Engagement Portfolios are all UI views)
2. **Sub-Project tier rejected** — replaced with **Linked Project** concept
3. **Linked Projects = typed links between two `SmeMartProject` records.** Implementation mechanism is Nic's call — could be hydra `link_type` rows, CE10's flat typed relations, a new link class, or (if we're lucky) a platformized version of SmeMartProject using a platform-native link primitive. Types include data-bearing (inherit boundary access into primary) and structural-only. Do NOT commit to an implementation until Nic weighs in — see `hierarchy-brief-for-nic.md` Q1.
4. **Hierarchy becomes:** `Engagement → Project → (Linked Project via hydra link)* → Workspace → Task`
5. **Transparency can exist at any tier** — no fixed depth; link type determines cross-link transparency
6. **Seed data must be real:** ZeroBias, HIS (Austin TX compliance consultancy), Goshen (Indiana hospital), ArmorStack (Minneapolis SI) — with their actual relationships (HIS↔Goshen primary, HIS↔ArmorStack linked in, etc.). Brian will send company details (EIN, banks, addresses).
7. **Deferred (not blocking MVP):** guild tier rules, legal docs, brand assets, onboarding UX specifics, pricing

## Key decision: zero new schema classes

The existing `@zerobias-org/product-w3geekery-smemart` schema already has everything needed. **No new classes, no schema repo PR.** Relevant existing classes:

| Existing class | Role in onboarding flow |
|---|---|
| `MarketplaceProfileItem` | Captures company info (new `section: "company_info"` convention — data-only, no schema change) — `section`, `orgId`, `data` JSON, `status`, `expiresAt` |
| `ServiceOffering` | ZB's own provider listing (one row per pricing tier, `providerId = ZB org ID`) — `category`, `pricingType`, `price`, `serviceIncludes`, `isActive` |
| `Engagement` | Per-customer default ZB engagement — buyer=customer org, provider=ZB org. Tagged via `engagementTag="default-zerobias"` to distinguish from other engagements |
| `SmeMartProject` | `project-zerobias-platform` default project per customer — where platform delivery (tickets, support, licensing, MSA, banking) flows. Stubs: MSA, D&B, banking info, licensing fields on the engagement |
| hydra `link_type` rows | **NEW data rows, not new schema class.** Register project↔project link types: `linked_to_primary`, `contributes_data_to`, `structural_nav`. Register Workspace↔Project link types if needed (probably `child_of` already exists). Used for Linked Project model. |
| `Note`, `NoteFolder`, `SmeMartDocument`, `EngagementVettingItem` | Already linked to Engagement — flow automatically for Default Project |

All 22 classes in the schema remain untouched.

## Data path

- **Writes:** `platform.Pipeline.receive` (full-replace pushes to the SME Mart receiver pipeline in AuditgraphDB)
- **Reads:** platform GQL API via `@zerobias-com/zerobias-angular-client`
- **Not used:** Generic SQL Hub Module / DataProducer (that path is for direct Neon tables — these records live in AuditgraphDB via the GQL schema)

---

## Phases

### Phase 1: Seed ZB as provider + `company_info` convention (Week 1, 1–2 days)

**Goal:** ZB exists in the marketplace as a provider with published ServiceOfferings; `MarketplaceProfileItem.section = "company_info"` is documented and understood across the app.

**Tasks:**

1. **Decide pricing tiers with Brian** (input, not code) — 2–3 SKUs: e.g., Free, Growth ($99/mo), Enterprise ($999/mo). Exact features per tier.

2. **Push ServiceOffering records for ZB** — via `platform.Pipeline.receive` to the SME Mart pipeline. One record per tier:
   ```
   { providerId: <ZB org ID>, name: "ZeroBias Growth", category: "platform",
     pricingType: "subscription", price: 99, isActive: true,
     serviceIncludes: [...], serviceRequirements: [...] }
   ```

3. **Document the `company_info` section convention** (`.claude/notes/company-info-section.md` or inline in CLAUDE.md) — spec the `data` JSON shape:
   ```json
   { "forProfit": true, "nonprofit": false, "peFunded": false,
     "governmentEntity": false, "companySize": "51-250",
     "industryVertical": "healthcare-compliance", "description": "...",
     "website": "https://..." }
   ```

**Verification:**
- Platform GQL returns 2–3 `ServiceOffering` records with `providerId == <ZB org ID>`
- ZB `ServiceOffering` records visible via existing marketplace browse UI (if pointed at ZB as filter)
- Convention doc landed in repo

**Ask Kevin:** is our receiver pipeline healthy on UAT? (per memory, pipeline works on prod — UAT readiness unclear)

**Ask Brian:** final pricing tiers, features per tier, SKUs

---

### Phase 2: Auth routing + org detection (Week 1–2, 2–3 days)

**Goal:** 3P user landing on `uat.zerobias.com/sme-mart` with no session goes to ZB signup; returning user lands in onboarding if their org has no `company_info` profile yet.

**Tasks:**

1. **`AuthGuard` + `NoAuthGuard`** — unauthed → ZB signup; authed user with no `company_info` → `/onboarding/profile`; authed user with `company_info` → dashboard.

2. **ZB signup handoff** — env var `ZB_SIGNUP_URL`, external link with return URL; after return, check for `MarketplaceProfileItem` with `section=company_info, orgId=currentOrg` via GQL.

3. **Onboarding layout** — `/onboarding/{profile,confirm-engagement,success}` with progress indicator.

**Verification:**
- Unauthed → redirects to ZB signup
- Returning authed user without profile → `/onboarding/profile`
- Returning authed user WITH profile → dashboard (skips onboarding)

**Ask Kevin:** does ZB signup auto-create an org? Is embedded (iframe) signup viable, or external-link only? What's the return URL mechanism?

---

### Phase 3: Company profile form (Week 2, 2–3 days)

**Goal:** User fills guild-licensing metadata; app creates/updates a `MarketplaceProfileItem` with `section=company_info` for their org.

**Tasks:**

1. **`CompanyInfoFormComponent`** — Angular reactive form with fields per the `data` JSON shape. Conditional logic: for-profit XOR nonprofit; nonprofit disables PE/gov.

2. **`MarketplaceProfileService`** — already likely exists for other sections (credentials, etc.); extend to handle `section=company_info`. Uses `platform.Pipeline.receive` for writes (full-replace), GQL query for reads.

3. **`GuildTierService`** — pure client-side function `deriveGuildTier(data): GuildTier`. Rules TBD with Brian. Display-only for MVP.

**Verification:**
- Form validates; live tier display updates
- Submit creates/updates `MarketplaceProfileItem` in AuditgraphDB
- Refresh reloads saved data from GQL

**Ask Brian:** exact guild tier derivation rules

---

### Phase 4: ZB provider display + first engagement (Week 2–3, 3–4 days)

**Goal:** User sees ZB's `ServiceOffering` listings, picks a tier (or Free default), confirms ToS, and creates their first `Engagement` (buyer=them, provider=ZB, `engagementTag="default-project"`).

**Tasks:**

1. **`ServiceOfferingDisplayComponent`** (reusable) — renders any provider's offerings. For ZB: fetch `ServiceOffering` records where `providerId == ZB org ID`. Renders as pricing table with features.

2. **`FirstEngagementConfirmComponent`** — shows inferred guild tier, ZB offerings, tier selector, ToS checkbox, "Create Engagement" button.

3. **`EngagementService.createDefaultEngagement`** — pushes `Engagement` record with `buyerZerobiasOrgId=currentOrg`, provider link to ZB, `engagementTag="default-project"`, status="active". Via `platform.Pipeline.receive`.

4. **Fetch ToS / legal docs** — store links in the seeded `ServiceOffering.serviceRequirements` JSON (or a dedicated `SmeMartDocument` record linked to ZB's org) — no schema change either way.

**Verification:**
- Offering display loads ZB's tiers
- ToS checkbox enforced
- Engagement created in AuditgraphDB; queryable by `engagementTag="default-project"`
- "Save for later" → dashboard without engagement creation

**Ask Brian:** ToS/legal doc URLs, ZB branding (logo, colors)

---

### Phase 5: Default Project board (Week 3, 2–3 days)

**Goal:** User lands on the Engagement board for their Default Project, sees notes/docs/tasks scoped to that Engagement.

**Tasks:**

1. **Success screen** — summary + "Go to Your Board" → `/engagement/<id>/board`.

2. **Engagement board enhancement** — when `engagementTag === "default-project"`, show banner: "This is your default account with ZeroBias — all requests between you and us live here."

3. **Task board** — reuse existing `SmeMartTask` / `SmeMartBoard` filtered by engagement. No new components.

4. **Notes / Docs** — existing Engagement has `notes`, `noteFolders`, `documents` links; just render them on the board.

**Verification:**
- Board loads post-onboarding
- Banner shows for default-project engagements
- Tasks/notes/docs scoped correctly; no cross-engagement leakage

---

### Phase 6: Demo seeder + UAT validation (Week 3–4, 2–3 days)

**Tasks:**

1. **Seeder additions** (`scripts/demo/`) — create ACME Corp org + user + `MarketplaceProfileItem` (section=company_info) + `Engagement` (default-project with ZB) + sample `SmeMartTask` records.

2. **Playwright E2E** — full flow: signup stub → profile form → offerings review → engagement create → board.

3. **Unit tests** — `guild-tier.service.spec.ts` (every rule), `MarketplaceProfileService` CRUD for `company_info` section.

4. **Manual UAT checklist** — 12-item list from unauth landing through task creation.

**Verification:**
- Seeder is idempotent
- E2E suite green on UAT
- Manual checklist signed off

---

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| SME Mart receiver pipeline not healthy on UAT | HIGH | Confirm with Kevin before Phase 1.2 push. Fallback: run seed against prod, snapshot to UAT. |
| `platform.Pipeline.receive` full-replace semantics nuke unrelated fields | MEDIUM | Always send complete records; write service helpers that merge with latest GQL read before push |
| ZB signup flow not embeddable; return URL semantics unclear | MEDIUM | External link with query-param return; if ZB signup doesn't honor it, manual "paste this URL back" fallback |
| Guild tier rules change post-Phase 3 | LOW | Rules live in a pure function; changes are isolated, well-tested |
| `engagementTag="default-project"` collides with existing tag usage | LOW | Grep existing data; rename to `sme-mart.engagement.default` if needed |
| `MarketplaceProfileItem.section` values not enumerated anywhere | LOW | Document the enum in a shared constants file; add TS union type |

## Success criteria

- [ ] Unauth user at `uat.zerobias.com/sme-mart` routes to ZB signup
- [ ] Returning user with no company_info profile lands on onboarding
- [ ] Company profile form persists to `MarketplaceProfileItem` (section=company_info)
- [ ] Guild tier displayed live
- [ ] ZB `ServiceOffering` records visible to customer
- [ ] ToS gated; engagement creation succeeds
- [ ] Engagement with `engagementTag="default-project"` exists; board loads
- [ ] Notes/docs/tasks scoped correctly
- [ ] E2E + unit tests passing
- [ ] Demo seeder produces full ACME scenario

## Asks at a glance

**Kevin:**
1. SME Mart receiver pipeline healthy on UAT?
2. ZB signup — auto-creates org? Embed viable? Return URL mechanism?
3. Any existing data using `engagementTag="default-project"`?

**Brian:**
1. Guild tier rules (size × for-profit/nonprofit/PE/gov → tier name)
2. Pricing tiers, features per tier, SKUs
3. ToS/Privacy/legal doc URLs
4. ZB branding (logo, colors)
5. First engagement: automatic on signup, or opt-in (current plan: opt-in)?

## Architectural decisions (final)

- **Zero new schema classes. Zero schema repo PRs.** All data uses existing `MarketplaceProfileItem`, `ServiceOffering`, `Engagement`.
- `company_info` is a **new `section` value** (data convention), not a new class.
- ZB-as-provider is **N `ServiceOffering` records** with `providerId=ZB`, not a custom config type.
- "Default Project 1" is **an `Engagement` with `engagementTag="default-project"`** — a query convention, not a schema flag.
- Guild tier is **client-side, deterministic, testable** — no API round trip.
- Writes via `platform.Pipeline.receive` (full-replace); reads via platform GQL. Not DataProducer.
