---
phase: 26
slug: seed-provider-zb-as-provider
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-27
---

# Phase 26 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source: `.planning/phases/26-seed-provider-zb-as-provider/26-RESEARCH.md` § Validation Architecture

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Karma + Jasmine (`ng test` via `npm test`); optional Vitest for non-Angular seed-function tests |
| **Config file** | `angular.json` test target; `karma.conf.js` if present; `vitest.config.ts` (Wave 0 if seed test goes Vitest) |
| **Quick run command** | `npm test -- --watch=false --browsers=ChromeHeadless --include='**/provider*.spec.ts'` |
| **Full suite command** | `npm test -- --watch=false --browsers=ChromeHeadless` |
| **Estimated runtime** | Quick: ~10–20s · Full: ~60–120s (varies with current spec count) |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --watch=false --browsers=ChromeHeadless --include='**/provider*.spec.ts'`
- **After every plan wave:** Run `npm test -- --watch=false --browsers=ChromeHeadless`
- **Before `/gsd:verify-work`:** Full suite must be green AND UAT GQL verification query confirms seeded records.
- **Max feedback latency:** ~20s for the targeted quick run

---

## Per-Task Verification Map

> Tasks finalized by gsd-planner. This is the requirement-to-test mapping derived from RESEARCH.md.

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 26-01-XX | 01 (ratify convention) | 1 | SP-01 | Doc check | `test -f .planning/director/COMPANY-INFO-CONVENTION.md` | ❌ W0 | ⬜ pending |
| 26-02-XX | 02 (seed batch) | 2 | SP-04 | Unit (seed payload assertions) | `npm test -- --include='**/seed-zb-provider*.spec.ts'` (or `vitest run scripts/seed-zb-provider.spec.ts`) | ❌ W0 | ⬜ pending |
| 26-02-XX | 02 (seed batch) | 2 | SP-05 | Unit (markDeleted assertions) | `npm test -- --include='**/seed-zb-provider*.spec.ts'` | ❌ W0 | ⬜ pending |
| 26-03-XX | 03 (UI verify) | 3 | SP-02 | Integration (mock GQL) | `npm test -- --include='**/provider-list.component.spec.ts'` | ❌ W0 | ⬜ pending |
| 26-03-XX | 03 (UI verify) | 3 | SP-06 | Unit + Integration | `npm test -- --include='**/provider*.spec.ts,**/seed-zb-provider*.spec.ts'` | ⚠️ Partial | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

> Wave numbers above are illustrative; planner sets the canonical waves in PLAN frontmatter.

---

## Wave 0 Requirements

- [ ] `scripts/seed-zb-provider.spec.ts` — seed-function payload tests (deterministic ids, Object.tag shape, sections present, markDeleted cleanup includes `mpi-test-a-cd7105df` + `mpi-test-b-cd7105df`, no `mpi-test-c` from a different class)
- [ ] `src/app/pages/providers/provider-list.component.spec.ts` — list rendering with mocked GQL response that includes ZB-shaped records
- [ ] Extend `src/app/shared/components/provider-card/provider-card.component.spec.ts` — assert ZB-shaped data renders (corporate provider; legal_name + logo + short_blurb visible; no rating/skills assumptions)
- [ ] If seed test framework is Vitest (non-Angular tree), add `vitest.config.ts` and ensure `npm test` (or a sibling script) routes seed specs through it. Otherwise place spec under `scripts/__tests__/` and run via Angular's Jasmine config.
- [ ] Confirm `karma.conf.js` exists or `angular.json` test target is wired for ChromeHeadless before plan execution.

*Phase 26 owns Wave 0 setup; planner must schedule these before the seed/UI tasks.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Browse Providers UAT page lists ZeroBias card after seed | SP-02 | UAT-only render, requires CDN cache invalidation timing | 1) Run seed script. 2) Invalidate UAT CloudFront cache (E23VJPBBDUCHBQ → `/*`). 3) Open `https://uat.zerobias.com/sme-mart/providers`. 4) Confirm ZB card visible with seeded copy/logo. |
| GQL verification queries return expected records | SP-04, SP-05 | Live UAT data check post-seed | Run via ZB MCP: (a) `MarketplaceProfileItem(orgId: ".eq.57c741cf-a58e-5efc-bf2f-93c4f6cf76ec") { id, section, data }` returns N rows. (b) If tag distinguisher: `MarketplaceProfileItem(tag: {value: ".eq.<tag-uuid>"}) { id, section }` returns same N. (c) `mpi-test-a-cd7105df` / `mpi-test-b-cd7105df` no longer appear in MPI results. |
| `COMPANY-INFO-CONVENTION.md` rename + ratification review | SP-01 | Doc-quality review, not test-codifiable | Read renamed file, confirm 17-section catalog matches latest decisions, no `-DRAFT` references remain in repo (`grep -r 'COMPANY-INFO-CONVENTION-DRAFT' --include='*.md'`). |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (3 spec files + optional Vitest config)
- [ ] No watch-mode flags (`--watch=false` enforced)
- [ ] Feedback latency < 20s for targeted quick run
- [ ] `nyquist_compliant: true` set in frontmatter once planner confirms Wave 0 coverage

**Approval:** pending
