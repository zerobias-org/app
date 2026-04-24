---
id: "020"
severity: high
phase: "*"
found: 2026-04-22
status: open
---

# 3P plan missing a platform-data-audit phase; pre-population is treated as a side-task

Clark clarified 2026-04-22: an authenticated SME Mart user is already a ZB platform customer with potentially significant existing context — org membership, role assignments, group memberships, existing boundaries, existing tasks, possibly existing engagements or `MarketplaceProfileItem` records seeded by ZB internal team. SME Mart should **pull and reuse** that data rather than re-prompting the user or re-creating backend constructs that platform already provides.

The current 3P plan mentions "auto-fill" only in passing (Phase 4: "Template variables auto-fill with engagement context") and lists the company-profile form as a fresh user-entry surface (Phase 3) without an upstream inventory of what's already retrievable from the SDK.

**Root cause:** Plan focused on the data SME Mart writes (Pipeline.receive of MarketplaceProfileItem / Engagement / ServiceOffering) without first inventorying what SME Mart can read from platform.

**Impact:**
- Risk of re-prompting users for data the SDK already has (org name, address, member list, etc.)
- Risk of duplicating platform constructs we don't realize exist (e.g., a customer-facing profile entity we missed)
- Risk of ignoring pre-existing boundaries / tasks that should be linked into the default ZB engagement on Day 1
- Form pre-population in Phase 3 of the plan can't be designed properly without this inventory

**Fix:**
- Insert a new GSD phase: **Platform Data Audit** — explicit inventory of SDK reads available for an authenticated user (clientApi surfaces: `whoAmI`, `Org`, `Boundary`, `Task`, `Group`, `Role`, `MarketplaceProfileItem` query against current org, etc.)
- Output: `.planning/phases/{N}/PLATFORM-DATA-INVENTORY.md` enumerating fields with sample payloads
- Downstream phases (company profile, first engagement, default project board) consume this inventory for pre-population logic
- Phase ordering: lands BEFORE company profile form and default engagement creation

Filed by: Director Parks
