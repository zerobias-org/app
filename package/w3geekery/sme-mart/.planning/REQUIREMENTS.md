# Requirements: SME Mart v1.2

**Defined:** 2026-04-02
**Core Value:** A transparent, task-gated marketplace where every boundary API operation requires task/subtask approval — demand/supply/transparency partitions at every level of the hierarchy.

## v1.2 Requirements

Requirements for v1.2: RFP Packages & Pilot Projects. Each maps to roadmap phases.

### RFP Access Controls (D1)

- [ ] **D1-01**: Buyer can mark an RFP as invitation-only (boolean flag on project entity)
- [ ] **D1-02**: Buyer can add vendors to an RFP invitation list with pending/accepted/declined status tracking
- [ ] **D1-03**: Invited vendor can accept or decline an RFP invitation
- [ ] **D1-04**: System blocks bid submission from uninvited vendors on invitation-only RFPs
- [ ] **D1-05**: Vendor can view a dedicated "My Invitations" feed showing RFPs they've been invited to
- [ ] **D1-06**: Buyer can view an "Invited Vendors" tab on RFP detail showing all invitations and their status

### Document Packages (D2)

- [ ] **D2-01**: Buyer can attach multiple documents (templates, exhibits, attachments) to an RFP package
- [ ] **D2-02**: Org admin can create, edit, and delete reusable document templates at the org level (MSA, NDA, SOW, etc.)
- [ ] **D2-03**: Buyer can instantiate an org template per-engagement (copy-on-create, engagement-scoped instance)
- [ ] **D2-04**: Template instances support variable substitution (buyer name, dates, engagement ID auto-filled)
- [ ] **D2-05**: Buyer can preview a document template before instantiating it

### Form Builder (D3)

- [ ] **D3-01**: Form builder is a reusable shared component (not RFP-specific) — lives in `src/app/shared/` or `src/app/components/form-builder/`
- [ ] **D3-02**: Buyer can define form fields via UI — 6 types: text, textarea, dropdown, number, file upload, checkbox — stored as JSON config (ngx-formly's JSON-based config pattern as reference, not dependency)
- [ ] **D3-03**: Dynamic form renderer displays buyer-defined fields using Angular Reactive Forms + Material
- [ ] **D3-04**: Buyer can preview the form before publishing the RFP
- [ ] **D3-05**: Vendor can fill and submit the buyer-defined form on an RFP
- [ ] **D3-06**: Buyer can review vendor's submitted form responses

### Pilot Projects (077)

- [ ] **PLT-01**: SmeMartProject entity supports `projectType` discriminator (rfp | pilot | project)
- [ ] **PLT-02**: Pilot completion creates a conditional vetting checklist item
- [ ] **PLT-03**: Buyer can promote a completed pilot to a real project (new SmeMartProject linked to pilot)
- [ ] **PLT-04**: Pilot projects display visual badges/labels distinguishing them in lists and detail views

### Demo Infrastructure (DEMO)

- [ ] **DEMO-01**: CLI seed script (node/ts) creates a realistic RFP package flow via ZB Platform APIs (RFP with documents, invited vendor, submitted bid with form responses)
- [ ] **DEMO-02**: CLI cleanup script tears down all demo-created data
- [ ] **DEMO-03**: Seed script doubles as integration test (exits non-zero on failure)

## Future Requirements

Deferred to v1.3 or later. Tracked but not in current roadmap.

### Form Builder Enhancements

- **D3-07**: Conditional form logic (if/then field visibility)
- **D3-08**: Repeating form sections
- **D3-09**: Vendor resource requirements form (reuses shared form builder component in engagement context)

### RFP Enhancements

- **S2-01**: Intent-to-bid/withdraw workflow with deadlines and destruction attestation
- **S3-01**: Structured bid response templates
- **S4-01**: Bid validity/expiration dates

### AI Integration

- **AI-01**: LLM-assisted bid generation (Plan 033 P5)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Conditional form logic (if/then field visibility) | Complexity — deferred to v1.3 |
| Repeating form sections | Complexity — deferred to v1.3 |
| S2 destruction attestation | Deferred to v1.3 |
| 033 P5 AI bid generation | Depends on 054, deferred to v1.3 |
| Document versioning | Copy-on-instantiation only, no version history for v1.2 |
| Structured security questionnaires (CAIQ/SIG) | Future differentiator |
| Complex pricing models (NRC/ARC, milestone payments) | Plan 055, separate milestone |
| Engagement roles & communication (facilitator, mediation) | Plan 056, separate milestone |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| D1-01 | 14 | Pending |
| D1-02 | 14 | Pending |
| D1-03 | 14 | Pending |
| D1-04 | 14 | Pending |
| D1-05 | 14 | Pending |
| D1-06 | 14 | Pending |
| D2-01 | 15 | Pending |
| D2-02 | 15 | Pending |
| D2-03 | 15 | Pending |
| D2-04 | 15 | Pending |
| D2-05 | 15 | Pending |
| D3-01 | 16 | Pending |
| D3-02 | 16 | Pending |
| D3-03 | 16 | Pending |
| D3-04 | 16 | Pending |
| D3-05 | 16 | Pending |
| D3-06 | 16 | Pending |
| PLT-01 | 13 | Pending |
| PLT-02 | 13 | Pending |
| PLT-03 | 13 | Pending |
| PLT-04 | 13 | Pending |
| DEMO-01 | 17 | Pending |
| DEMO-02 | 17 | Pending |
| DEMO-03 | 17 | Pending |

**Coverage:**
- v1.2 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0 ✓

---

*Requirements defined: 2026-04-02*
*Last updated: 2026-04-02 after roadmap creation*
