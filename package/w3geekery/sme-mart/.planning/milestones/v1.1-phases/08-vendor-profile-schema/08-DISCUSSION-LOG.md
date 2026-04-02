# Phase 8: Vendor Profile Schema - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 08-vendor-profile-schema
**Areas discussed:** Schema field design, Link relationships, Enum vs. string for section, Class naming & scope

---

## Pre-Discussion: Typed Fields vs. Data Blob

Before formal discuss-phase began, Clark asked for a pros/cons analysis of rigid typed fields vs. single data blob for the new entity. After reviewing trade-offs, the hybrid approach was confirmed: typed discriminator + shared metadata fields + JSON data blob for section-specific content.

**User's choice:** Hybrid approach (typed discriminator + JSON blob)
**Notes:** Six separate classes rejected (6x pipeline work). All-nullable-fields rejected (maintenance nightmare). Blob-only rejected (no GQL filtering).

---

## Schema Field Design

| Option | Description | Selected |
|--------|-------------|----------|
| section (discriminator) | Which of the 6 profile sections. Required for filtering/grouping. | ✓ |
| expiresAt (date) | Expiration date for time-sensitive items. Enables GQL filtering. | ✓ |
| status (string) | Item lifecycle state. Could be derived from expiresAt instead. | ✓ |
| orgId (string) | Org ownership. Could be scalar or link. | ✓ |

**User's choice:** All four as typed fields
**Notes:** All selected. Gives solid GQL-filterable surface alongside inherited Object fields.

### Follow-up: Data Field

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated data field | Explicit string field for JSON payload. Clean separation. | ✓ |
| Use description field | Repurpose inherited description for JSON. Overloads semantics. | |

**User's choice:** Dedicated data field
**Notes:** Clean separation: name=display label, description=human summary, data=structured JSON blob.

---

## Link Relationships

### Engagement Link

| Option | Description | Selected |
|--------|-------------|----------|
| No direct Engagement link | Profile items are org-scoped, not engagement-scoped. Linkage via vetting item's profileItemId. | ✓ |
| Bidirectional link to Engagement | Enables "show all engagements using this profile item" query at GQL level. | |
| Link via EngagementVettingItem only | Add linkTo from vetting item to profile item. No link on profile item itself. | |

**User's choice:** No direct Engagement link
**Notes:** Vetting→profile linkage deferred to Phase 11.

### Links in General

| Option | Description | Selected |
|--------|-------------|----------|
| Scalar orgId only, no links | Matches EngagementVettingItem pattern. Simpler YAML. | ✓ |
| Link to parent container class | Create OrgProfile container. Adds hierarchy and maintenance. | |
| orgId scalar + self-referential link | Allow items to reference other items. Probably premature. | |

**User's choice:** Scalar orgId only, no links
**Notes:** Clean and standalone. No bidirectional link overhead.

---

## Enum vs. String for Section

| Option | Description | Selected |
|--------|-------------|----------|
| YAML enum | Define vendorProfileItem.section.yml with 6 values. Platform validates on ingest. | ✓ |
| Plain string | No platform validation. App layer validates. More flexible. | |
| Enum now, migrate later | Start strict, loosen if needed. | |

**User's choice:** YAML enum
**Notes:** Six values locked: corporate_identity, attestation, insurance, reference, personnel, financial.

---

## Class Naming & Scope

### Class Name

| Option | Description | Selected |
|--------|-------------|----------|
| VendorProfileItem | Matches Plan 041 naming. Clear marketplace semantics. | |
| OrgProfileItem | More generic. Both org sides use it. But vague. | |
| MarketplaceProfileItem | Neutral to buyer/vendor distinction. Longer but avoids implication. | ✓ |

**User's choice:** MarketplaceProfileItem
**Notes:** Neutral naming since both demand and supply orgs maintain profiles.

### Package

| Option | Description | Selected |
|--------|-------------|----------|
| Existing smemart package | All SME Mart entities in one package. Consistent. | ✓ |
| New w3geekery.marketplace package | Separate package. More modular but adds overhead. | |

**User's choice:** Existing smemart package

---

## Claude's Discretion

- viewProperties selection
- Field description text in YAML definitions
- Whether status should become an enum later

## Deferred Ideas

- EngagementVettingItem.profileItemId — Phase 11
- OrgProfile container class — rejected, can revisit
- Self-referential profile item links — premature
- Status enum promotion — future schema PR if values stabilize
