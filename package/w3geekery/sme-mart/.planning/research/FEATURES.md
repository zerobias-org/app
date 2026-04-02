# Feature Landscape: v1.2 RFP Packages & Pilot Projects

**Domain:** SME Mart marketplace
**Researched:** 2026-04-02

## Table Stakes

Features users expect in v1.2. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|-----------|-------|
| **Pilot Projects** | Brian requirement (POC testing before full engagement) | Low | Simple projectType discriminator + timestamp field |
| **Invitation-Only RFPs** | Brian requirement (closed RFPs for vetting) | Medium | Access control gate, vendor feed, buyer invite list |
| **Document Templates** | Org efficiency (reuse MSA, NDA, SOW boilerplate) | Medium | Template CRUD, variable substitution, instantiation |
| **Form Requirements** | Buyer compliance (structured vendor response format) | Medium | JSON Schema config, dynamic renderer, submission review |
| **Template Preview** | Vendor clarity (what docs will vendor receive?) | Low | Read-only document tab on project detail |
| **Form Preview** | Buyer validation (test form before publishing) | Low | Form editor preview button |
| **Submission Deadline** | Marketplace standard (close date for submissions) | Low | Field on SmeMartProject, UI display |

## Differentiators

Features that set SME Mart apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|-----------|-------|
| **Variable-Based Template Substitution** | Orgs can define once, reuse everywhere (buyer name, engagement ID, dates auto-filled) | Medium | Enables org efficiency, reduces manual edits |
| **Structured Form Schema** | Buyer can define exactly what vendor must submit (no guessing, fewer back-and-forths) | Medium | JSON Schema-based, type-safe, validation built-in |
| **Pilot→Real Project Promotion** | Clear lifecycle (test idea, promote if successful) | Low | Single button, creates new SmeMartProject with link to pilot |
| **Vendor Invitation Feed** | Vendors see only their invitations (no marketplace noise) | Low | Separate `/my-invitations` page, filters out public RFPs |
| **Invited Vendors Tab** | Buyer tracks invitation status (pending/accepted/declined) | Low | Project detail tab, shows all invitations for this RFP |
| **Form Submission History** | Buyers review all vendor submissions (audit trail) | Low | Form responses tab, view/download per submission |
| **Org Template Library** | Orgs can build template catalog (reuse across projects) | Low | Org admin `/document-templates` page, CRUD |

## Anti-Features

Features to explicitly NOT build in v1.2.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **LLM-Assisted Form Generation** | Separate initiative (Plan 033 P5), not in v1.2 scope | Defer to Plan 033, can integrate later |
| **Complex Form Branching Logic** | Too complex for Phase 16 (conditional fields, dynamic sections) | Start with simple flat forms (6 field types), add branching in Phase 20+ |
| **Form Submission Approval Workflow** | ZB Task integration not ready (Plan 054 S3) | Keep submission as data-only, no approval routing in Phase 16 |
| **Multi-Submission Forms** | Adds UI complexity (version history, comparison) | One submission per vendor in Phase 16, expand in Phase 20+ |
| **Template Versioning** | Templates are immutable by design (create new if need to change) | Old template stays available, new template created for changes |
| **Document Signing** | Separate feature (e-signature integration) | Defer to future marketplace feature request |
| **Real-Time Invitation Notifications** | Not critical for Phase 16 | Vendors check `/my-invitations` page manually (can add notifications in Phase 20+) |
| **Invitation Expiration Automatic Cleanup** | Background job not ready | Check expiration client-side on invitation list, optional background job later |

## Feature Dependencies

```
Pilot Projects (Plan 077)
  └─ SmeMartProject.projectType field (already exists)

Invitation Controls (Plan 054 - D1)
  ├─ SmeMartProject.isInvitationOnly field
  ├─ Invitation entity (new)
  └─ BidsService access control gate

Document Templates (Plan 054 - D2)
  ├─ DocumentTemplate entity (new)
  ├─ SmeMartProjectService.publish() integration
  └─ Template variable substitution

Form Builder (Plan 054 - D3)
  ├─ FormBuilderConfig entity (new)
  ├─ FormSubmission entity (new)
  ├─ DynamicFormComponent (new)
  └─ SmeMartProjectService.publish() integration

RFP Wizard Integration (All features)
  ├─ Step 1: Add Pilot + Invitation toggles [Phase 13, 14b]
  └─ Step 2: Add Template selector + Form builder [Phase 15b, 16b]
```

## MVP Recommendation

**Prioritize in this order:**

1. **Pilot Projects** (Phase 13) — 6–8 hrs
   - Lowest risk, zero dependencies
   - Validates baseline architecture
   - Addresses Brian's POC testing requirement

2. **Invitation Controls** (Phase 14) — 12–16 hrs
   - Addresses Brian's closed RFP requirement
   - Access control gate pattern establishes pattern for future features
   - Differentiator: Vendor invitation feed

3. **Document Templates** (Phase 15) — 14–18 hrs
   - Addresses org efficiency requirement (reuse templates)
   - Differentiator: Variable substitution
   - Building on Phases 13–14 validated patterns

4. **Form Builder** (Phase 16) — 16–20 hrs
   - Most complex (JSON Schema rendering)
   - Highest business value (structured vendor responses)
   - Can be deferred if time is tight (Phases 13–15 ship without it)

**Ship v1.2 MVP:** Phases 13 + 14 + 15 (minimal form builder, defer Phase 16b UI polish)
**Full v1.2:** Add Phase 16 (form builder complete)

## Feature Flags / Config

| Feature | Flag | Notes |
|---------|------|-------|
| Pilot projects enabled | Via projectType field (default: always on) | No runtime flag needed |
| Invitation-only RFPs | Via isInvitationOnly field (default: false) | Buyer toggles in RFP wizard |
| Templates enabled | Via template CRUD availability (default: always on) | No runtime flag needed |
| Form builder enabled | Via form CRUD availability (default: always on) | No runtime flag needed |
| Form submission required | Via SmeMartProject field (default: optional) | Buyer can mark form as optional |

## Success Metrics (Post-Phase 16)

| Metric | Target | Measure |
|--------|--------|---------|
| Pilot projects created | 10+ test pilots in UAT (2-week observation period) | Usage analytics |
| Invitation-only RFPs | 5+ closed RFPs in UAT | Usage analytics |
| Template reuse | 3+ orgs with 5+ templates each | Usage analytics |
| Form submission rate | 80%+ of vendors complete form when required | Form response tracking |
| User satisfaction | 4.5+/5 (SME Mart user survey) | Post-launch survey |

## Deferred Features (Future Phases)

| Feature | Plan | Reason |
|---------|------|--------|
| LLM-assisted form generation | Plan 033 P5 | Separate initiative, separate budget |
| Complex form branching | Phase 20+ | Too complex for Phase 16, can add incrementally |
| Form submission approval workflow | Plan 054 S3 | Requires ZB Task integration (blocked) |
| Multi-submission forms | Phase 20+ | One submission per vendor in Phase 16 |
| Template versioning | Future | Templates immutable by design |
| Document e-signing | Future | Separate feature request, not in marketplace scope |
| Real-time invitation notifications | Phase 20+ | Can add after Phase 16 (manual check sufficient) |
| Bulk invitation import (CSV) | Future | Can add if many invitations needed |
| Template marketplace (orgs share templates) | Future | Org scope only in Phase 15 |

## Sources

- **Plan 077 (Pilot Projects):** BACKLOG.md, Brian "PILOTS" requirement
- **Plan 054 (RFP Packages):** BACKLOG.md, gap analysis D1 (invitation), D2 (templates), D3 (forms)
- **Gap analysis:** Marketplace requirement survey (D1–D9, S1–S6, E1–E6, P1–P3)

---

**Created:** 2026-04-02
**Scope:** v1.2 features (Phases 13–16)
