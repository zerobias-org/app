# Requirements: SME Mart v1.3

**Defined:** 2026-04-15
**Core Value:** A transparent, task-gated marketplace where every boundary API operation requires task/subtask approval — demand/supply/transparency partitions at every level of the hierarchy.

**Source:** Phase briefs in `.planning/director/phase-{18..23}-brief.md` (staged by `/meta:director design` during v1.2 retrospective).

## v1.3 Requirements

Requirements for v1.3: Dev Experience, Hardening & Transparency. Each maps to roadmap phases 18-23.

### Org Switcher (OS) — Phase 18

- [ ] **OS-01**: User menu in SME Mart header surfaces an "Organization" section listing all orgs the user can switch to
- [ ] **OS-02**: Clicking an org in the list calls `app.selectOrg(org)`, which updates Dana cookie + `zb-current-dana-org-id` sessionStorage via the SDK
- [ ] **OS-03**: Current org is visually distinguished in the dropdown (checkmark or "current" pill)
- [ ] **OS-04**: Orgs are filtered per existing rules (hide `hidden: true`, System Org `00000000-...`, ops orgs)
- [ ] **OS-05**: Switch triggers a UI refresh sufficient to pick up the new org context (page reload or router-level refresh — match zb/ui behavior)

### Local Dev Stacks (LS) — Phase 19

- [ ] **LS-01**: `zbb up <stack>` brings SME Mart SPA + Hub module online locally with Neon/S3/Registry stand-ins, serving from a CloudFront-shaped URL (path fallback, basePath-aware)
- [ ] **LS-02**: Unmerged SME Mart Hub module builds + publishes to local Verdaccio; local `hub-server` consumes it — no upstream PR dependency for iteration
- [ ] **LS-03**: `login/` repo can be served alongside the SPA via the same `cloudfront-sim` stack; session handoff from login → SPA verified locally
- [ ] **LS-04**: Custom `cloudfront-sim` stack is reusable (not SME Mart-specific — both SPA and login use it)
- [ ] **LS-05**: Env var import/export between stacks works per zbb conventions (e.g., SPA stack imports `HUB_URL` from hub-server stack)
- [ ] **LS-06**: README documents how to bring the stack up, tear it down, and iterate (change Hub module → rebuild → SPA picks it up)

### Fire-and-Forget Audit (FF) — Phase 20

- [ ] **FF-01**: AUDIT.md exists with 100% of `pushEntity` call sites cataloged, each rated for risk + complexity
- [ ] **FF-02**: Telemetry ships — every `.catch()` fires a counted event in addition to the current console.error
- [ ] **FF-03**: All CRITICAL+SIMPLE call sites have fire-and-forget removed and error state surfaced to users; each has at least one spec covering the error path
- [ ] **FF-04**: CRITICAL+MEDIUM and CRITICAL+COMPLEX call sites have individual backlog entries with proposed remediations
- [ ] **FF-05**: WATCH-LIST pattern updated: "Service method ends with `.catch(err => console.error(err))`" is a BLOCK for user-triggered actions going forward

### Org Documents Center (OD) — Phase 21

Loose, time-boxed (~20 hrs). Scope trims when creep emerges.

- [ ] **OD-01**: Folders are user-creatable and nestable in the Org Documents Center
- [ ] **OD-02**: Color + Tag affordances visible and functional on documents
- [ ] **OD-03**: DocumentTemplate (v1.2) entities appear in the Org Documents Center, not only in the RFP wizard
- [ ] **OD-04**: Document preview works for at least the common content types already supported by the File SDK
- [ ] **OD-05**: Additional deliverables (archive browser, versioning UI, bulk ops, etc.) added as they land; each gets a satisfying requirement in this section, OR a defer-to-v1.4 note when creep triggers

### Form Template Library (FT) — Phase 22

- [ ] **FT-01**: Users can save a FormBuilderConfig as a named, org-scoped template
- [ ] **FT-02**: Creating a new form auto-creates a draft FormTemplate; no explicit Save action required to persist in-progress work
- [ ] **FT-03**: Buyers can pick a published template in the RFP wizard Step 2.5, pre-filling the form
- [ ] **FT-04**: `/forms/templates` lists drafts (pinned), published, and archived templates with search/filter
- [ ] **FT-05**: Editing a published template prompts Save-as-New-Version vs Overwrite; Overwrite is owner-only + blocked when other RFPs reference the version
- [ ] **FT-06**: Forking preserves a `parentTemplateId` pointer
- [ ] **FT-07**: Usage count increments when a template is selected in the RFP wizard
- [ ] **FT-08**: Org Documents Center exposes a recent-templates surface linking back to `/forms/templates`
- [ ] **FT-09**: Schema PR merged to `zerobias-org/schema:dev` with CI SUCCESS (not SKIPPED), both classes/*.yml and fields/*.yml present, no self-merge

### Transparency Controls (TC) — Phase 23

- [ ] **TC-01**: UI-SPEC.md for Transparency Controls is locked — no open questions remaining
- [ ] **TC-02**: Low-fi wireframes produced for all 5 concept views from the sketches
- [ ] **TC-03**: Research report documents which backend capabilities TC depends on and which exist today
- [ ] **TC-04**: If implementation is doable this phase, at least one Transparency Control surface ships on an existing view (e.g., Engagement detail or Project detail)
- [ ] **TC-05**: Backlog entry added (or 078 updated) with the implementation plan if deferred

## Future Requirements

Deferred to v1.4+:

- Task/subtask partitioning into demand/supply/transparency (CEO P0, carries from v1.2)
- Tasks as runtime access control — boundary API gating via task approval
- Hard requirements (1-5) / soft requirements (6-10) approval model
- Supply-side explicit resource requirements (ARN, IAM, data objects, schedule)
- Project Bloom UI (boards, tasks, activities, workflows)
- Transparency Center (aggregated rollups from subtask → project) — dependent on Phase 23 spec lock
- Neon table archival (scheduled 2026-04-02, pending execution)
- Fire-and-forget CRITICAL+MEDIUM / CRITICAL+COMPLEX remediations (individual BACKLOG entries added in P20)

## Out of Scope

- Auth flow / login — ZeroBias platform handles this
- LLM-assisted bid generation — separate initiative
- Scoring app — separate ZB platform app
- Billing app — separate ZB platform app
- E2E Playwright tests — separate initiative
- Project switcher UI — deferred (needs UX design; DECISIONS.md 2026-04-01)
- Production `zbb` stack configuration (P19 is local-dev only)
- Full CE4 / N-party entanglement implementation (platform-dependent, TC out-of-scope)
- Marketplace / public template sharing across orgs (FT out-of-scope)
- Split-screen / WYSIWYG form builder redesign (Plan 088 — separate v1.3+ phase)
- Internal Marketplace (BU-to-BU) — future concept
- Reverse Bid Flow — future concept

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| OS-01 | 18 | Pending |
| OS-02 | 18 | Pending |
| OS-03 | 18 | Pending |
| OS-04 | 18 | Pending |
| OS-05 | 18 | Pending |
| LS-01 | 19 | Pending |
| LS-02 | 19 | Pending |
| LS-03 | 19 | Pending |
| LS-04 | 19 | Pending |
| LS-05 | 19 | Pending |
| LS-06 | 19 | Pending |
| FF-01 | 20 | Pending |
| FF-02 | 20 | Pending |
| FF-03 | 20 | Pending |
| FF-04 | 20 | Pending |
| FF-05 | 20 | Pending |
| OD-01 | 21 | Pending |
| OD-02 | 21 | Pending |
| OD-03 | 21 | Pending |
| OD-04 | 21 | Pending |
| OD-05 | 21 | Pending |
| FT-01 | 22 | Pending |
| FT-02 | 22 | Pending |
| FT-03 | 22 | Pending |
| FT-04 | 22 | Pending |
| FT-05 | 22 | Pending |
| FT-06 | 22 | Pending |
| FT-07 | 22 | Pending |
| FT-08 | 22 | Pending |
| FT-09 | 22 | Pending |
| TC-01 | 23 | Pending |
| TC-02 | 23 | Pending |
| TC-03 | 23 | Pending |
| TC-04 | 23 | Pending |
| TC-05 | 23 | Pending |

**Coverage:** 35/35 requirements mapped ✓

---

**Last Updated:** 2026-04-15
**Milestone:** v1.3 — Dev Experience, Hardening & Transparency
