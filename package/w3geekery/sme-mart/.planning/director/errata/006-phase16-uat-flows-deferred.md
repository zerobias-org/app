---
id: "006"
severity: medium
phase: 16
found: 2026-04-14
status: deferred
---

# Phase 16 — 4 UAT flows deferred (vendor/buyer account-gated)

Phase 16 closed with 4/8 UAT tests marked `skipped`: tests 5-8 require live UAT vendor/buyer principals that don't exist in the current UAT environment.

**Skipped tests (see `.planning/phases/16-form-builder/16-UAT.md`):**
- Test 5: Vendor Fills and Submits Form
- Test 6: Bid Form Gate Blocks Submission Until Complete
- Test 7: Buyer Reviews Submission and Marks Reviewed
- Test 8: Form Lock After First Submission (depends on Test 5)

**Root cause:** UAT was migrated from CI on 2026-03-30. Vendor/buyer principals were not recreated alongside the migration — only smoke-test infrastructure. Test 5-8 cannot run without at least one UAT vendor account and one UAT buyer account on different orgs.

**Impact:** Form submission end-to-end workflow is unverified in a live environment. Code paths are covered by unit tests (131 passing across 9 spec files) AND by an MCP round-trip smoke test (`Pipeline.receive` → `graphql.Boundary.boundaryExecuteRawQuery`), but the UI flow connecting the two has not been exercised. Risk: wiring-level bugs (auth, org scoping, form-lock trigger timing) could hide until the first real vendor submission.

**Fix:** Two options —
1. Create UAT vendor/buyer test principals (preferred, unblocks Tests 5-8 and future phases)
2. Add Playwright E2E coverage against UAT using programmatic principal setup

**Status: deferred** — not code-gated, carries forward into v1.2 milestone close. Re-evaluate at v1.3 kickoff; if still deferred, it becomes a v1.3 item.
