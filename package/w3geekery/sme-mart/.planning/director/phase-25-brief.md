# Phase 25 — Platform Data Audit (NEW)

**Milestone:** v1.4 "3P Onboarding & Default Engagement"
**Est:** 4–6 hrs (research-heavy, no app code)
**Repos:** `app/` (audit doc lives there; no runtime code)
**Origin:** Errata 020 (3p-plan-missing-platform-data-audit-phase, 2026-04-23). Clark direction: **first `/gsd:discuss-phase` target** for v1.4.

## Goal

Inventory everything the authenticated ZB platform session already tells us about a customer Org — via ZB SDK, GQL, hydra Resources, and any other reachable data source. Output a single `PLATFORM-DATA-INVENTORY.md` that subsequent phases (especially Phase 28 company profile form) consume to decide what's pre-fillable vs. what the user must supply vs. what requires external enrichment.

## Architecture

### Starting state
- We have a validated auth flow (branded login → ZB session → SDK client).
- We have validated write/read paths for class Objects (Engagement, SmeMartProject, Bid, etc.) via Pipeline.receive + GQL with RFC4515 filters.
- We have hydra Resource operations for Tasks, Tags, Boundaries, Parties.
- What's NOT catalogued: the exact set of SDK reads that return user/org/role/tasks/boundaries/scopes/MarketplaceProfileItems/etc. with their field shapes, and which of those fields correspond to Phase 28 company-profile form fields.

### Deliverables

1. **`.planning/director/PLATFORM-DATA-INVENTORY.md`** — structured inventory with one section per data source. Each section documents:
   - SDK call or GQL query signature
   - Sample response shape (redacted)
   - Fields returned (name, type, usually-populated vs. sparse)
   - Org-scoping behavior (is it filtered to `currentOrg` automatically?)
   - Known gaps / edge cases
2. **Source coverage minimum:**
   - `dana.User.getWhoAmI` / `getPrincipal` / `getCurrentOrg`
   - `dana.Org.*` (search, get, listMembers)
   - `platform.Boundary.*` (list, get, listBoundaryParties)
   - `platform.Task.*` (list, relevant filters)
   - `platform.Class.*` (getClass, getClassObjects — for SME Mart classes specifically)
   - `hydra.Resource.*` (listResources, getResource, searchResources)
   - `hydra.Tag.*` (listTags, searchTags)
   - `graphql.Boundary.boundaryExecuteRawQuery` — for direct class Object reads
   - MarketplaceProfileItem via relevant endpoints (check Plan 080 + 041 notes)
3. **Pre-fill map.** A mapping table: `Phase 28 company-profile field name` → `source` → `pre-fillable: yes/no/partial`. This is what Phase 28 consumes.
4. **Known-unknown list.** Fields that appear nowhere today and would have to be collected from the user OR filled in via the per-org LLM-prompt generation brief (deferred director work).

## Requirements

- **PDA-01:** `PLATFORM-DATA-INVENTORY.md` exists at `.planning/director/PLATFORM-DATA-INVENTORY.md` (NOT in `/phases/` — this is director research, not a GSD artifact).
- **PDA-02:** Minimum 9 data-source sections (list above), each with sample response + field list.
- **PDA-03:** Pre-fill map table covers every field in the draft Phase 28 company-profile form (Phase 28 brief references this map).
- **PDA-04:** Known-unknown list highlights fields that will need user input or LLM enrichment.
- **PDA-05:** Pipeline health check: push a throwaway test record via `Pipeline.receive` for the current SME Mart pipeline (`43f08afd-...`) to confirm the pipeline is live. Document in the inventory. Do NOT ship to prod — UAT only.

## Dependencies

- Active `uat-clark@w3geekery` profile for MCP-based research.
- Memory: ZB MCP + Neon MCP reference patterns.
- Phase 26 (Seed ZB as provider + ServiceOffering placeholders) benefits from knowing what a "provider" Org looks like in SDK data — schedule Phase 25 BEFORE Phase 26.
- Phase 28 (company profile form) explicitly consumes this inventory — Phase 25 must land before Phase 28 plans.

## Verification

- Document is complete: all 9 required sections populated, sample responses present, field lists complete.
- Pre-fill map audit: walk through each proposed Phase 28 form field and confirm it maps to either a source or the known-unknown list.
- Spot-check: pick 3 random SDK calls from the inventory and re-run them via MCP to confirm the documented response shape still holds.

## Out of scope

- Any code changes in `app/`.
- The LLM-prompt generation brief (separate director brief, written after Phase 28 form design stabilizes).
- Filling in the unknowns (Phase 28 onboarding form + the LLM brief handle that later).
- Documenting ZB platform internals (we document what SDK/GQL surfaces, not how ZB computes it).

## References

- Errata 020 (`.planning/director/errata/020-3p-plan-missing-platform-data-audit-phase.md` — or equivalent errata path)
- DECISIONS.md "v1.4 Milestone Shape — Brian Asks Are Placeholders, Not Blockers"
- `.planning/notes/sme-mart-resource-types-summary.md` (resource type inventory already shared with Kevin — partial prior art)
- `.planning/research/internal/2026-04-23-credentials-zb-platform-research.md` (adjacent research, may have reusable snippets)
- Memory: `ZeroBias MCP Parameter Patterns`, `ZeroBias Hydra Migration`, `ZeroBias Dataloader & Schema Verification`
