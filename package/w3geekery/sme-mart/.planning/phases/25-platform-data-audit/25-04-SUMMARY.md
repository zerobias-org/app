---
phase: 25-platform-data-audit
plan: 04
subsystem: Platform Data Audit
tags: [synthesis, pre-fill-map, company-profile-convention, superseded]
dependencies:
  requires: [25-02, 25-03]
  provides: [phase-26-input, phase-28-input]
  affects: [phase-26-brief, phase-28-brief, phase-22-form-schema]
tech_stack:
  added: []
  patterns: [section-data-discriminator, deterministic-id-strategy, flat-sub-section-encoding]
key_files:
  created:
    - .planning/director/COMPANY-INFO-CONVENTION-DRAFT.md
  modified:
    - .planning/director/PLATFORM-DATA-INVENTORY.md
    - .planning/director/phase-28-brief.md
decisions: [D-08, D-12, "MPI Replace Semantics", "Object.tag Remediation"]
metrics:
  duration: "30 min original synthesis + 90 min live re-execution propagation"
  originally_completed: "2026-04-24"
  superseded_by_inline_corrections: "2026-04-27"
---

# Phase 25 Plan 04: Pre-fill Map & Convention Synthesis (Superseded)

## Status

**SUPERSEDED.** This plan's deliverables (pre-fill map synthesis + convention draft) were rewritten inline 2026-04-27 after the live MCP re-execution of Plans 25-02 and 25-03 surfaced a major schema correction.

The original 25-04 synthesis was based on synthesized (not live) audit findings and assumed `MarketplaceProfileItem` had structured fields like `legalName`, `dba`, `logoUrl`. Reality: the class is generic with a `(section, data)` discriminator. Every "field" of the company_info convention is its own MPI record keyed by `(orgId, section)`.

## What changed (2026-04-27)

The corrected synthesis lives in three documents (not in this summary):

1. **`.planning/director/COMPANY-INFO-CONVENTION-DRAFT.md`** — full rewrite. Canonical section catalog (17 entries) replaces the original YAML-style schema. Documents the section/data discriminator, deterministic id strategy (`mpi-<orgId>-<section>`), Pipeline.receive replace-by-id semantics, and flat sub-section encoding pattern (over JSON-encoded objects).

2. **`.planning/director/PLATFORM-DATA-INVENTORY.md`** — pre-fill map rewritten. Form-field-first orientation preserved; column changed from "platform_field_path" (struct field) to "MPI section name". Read pattern + write pattern documented inline.

3. **`.planning/director/phase-28-brief.md`** — storage shape called out, save flow + pre-fill flow rewritten, MarketplaceProfileService adapter pattern defined, deliverables list updated.

## What this plan still contributes

The synthesis intent is preserved — the consolidation of Plans 02-03 audit findings into a single source of truth — but the artifacts now live in the dependent docs above rather than here. Reading order for downstream phases:

- **Phase 26 input:** `COMPANY-INFO-CONVENTION-DRAFT.md` (corrected canonical section catalog, ready for ratification)
- **Phase 28 input:** `PLATFORM-DATA-INVENTORY.md` pre-fill map + `phase-28-brief.md` save/pre-fill flow + `COMPANY-INFO-CONVENTION-DRAFT.md` section names
- **Phase 22 input (form schema):** `COMPANY-INFO-CONVENTION-DRAFT.md` canonical sections; form-schema definition needs a `section` property per field

## Validated empirically (2026-04-27 UAT)

- Pipeline.receive replace key = `id` only (per-section saves are independent)
- Class id `7bcf86a5-91dc-520d-b9bf-e308b1078d46` accepts deterministic-id ingest
- W3Geekery Engagement + default SmeMartProject re-ingested with Object.tag populated; tag-filter discovery works uniformly
- Test residue cleanup queue: `mpi-test-a-cd7105df`, `mpi-test-b-cd7105df`, `TAG-SHAPE-TEST-C`

## Handoff

- **Phase 26 (next):** ratify `COMPANY-INFO-CONVENTION-DRAFT.md` against ZeroBias org's data shape. Rename to `COMPANY-INFO-CONVENTION.md`. Use it to seed ZeroBias's marketplace profile (one Pipeline.receive batch per section).
- **Phase 28:** consume the ratified convention as form schema input. Adapter service translates form model ↔ MPI record array.

---

**Originally created:** 2026-04-24
**Superseded by inline corrections:** 2026-04-27
**Final status:** synthesis content moved to COMPANY-INFO-CONVENTION-DRAFT.md, PLATFORM-DATA-INVENTORY.md, and phase-28-brief.md. This summary preserved as a pointer.
