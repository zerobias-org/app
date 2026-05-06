# Errata 024 — Commit `aad578d` Body Claims 2-Arg SimpleBatch, Actual Code Is 3-Arg

**Date:** 2026-05-04
**Severity:** Low (no functional impact; documentation drift only)
**Type:** Commit-message-vs-actual-code drift
**Phase:** 24, Plan 02 defect-fix loop

## What happened

Commit `aad578d` ("fix(24-02): embed tag in data payload — SimpleBatch 3rd-arg tagIds does not populate Object.tag") states in its body:

> 1. src/app/core/services/pipeline-write.service.ts pushEntities()
>    - ...
>    - Simplified SimpleBatch to 2-arg form (classId, ensured)
> 2. scripts/demo/helpers.ts pushEntity()
>    - ...
>    - Simplified SimpleBatch to 2-arg form

The actual committed code keeps the 3-arg form everywhere with an explanatory comment:

```ts
const batch = new SimpleBatch(
  new UUID(classId),
  ensured,
  [], // tagIds: batch/job metadata (does NOT populate Object.tag) — tags embedded in data instead
);
```

Verified at:
- `src/app/core/services/pipeline-write.service.ts:207-211`
- `src/app/core/services/pipeline-write.service.ts:274-278` (4-arg deleteEntities form)
- `scripts/demo/helpers.ts:297-301`
- `scripts/demo/helpers.ts:339` (4-arg deleteEntities form)

The agent's checkpoint report to Director correctly described the deviation ("SimpleBatch kept 3-arg form [], not reduced to 2-arg") — the inaccuracy lives only in the commit body.

## Why it's not blocking

Functionally, `[], // tagIds: batch/job metadata...` is equivalent to a 2-arg form: empty array passes nothing through the broken metadata seam. The self-documenting comment at each call site is arguably better than a silent 2-arg form because future readers see the rationale inline.

The Director's original handoff specified a 2-arg form AND said "If SimpleBatch's type signature does NOT support a 2-arg form, STOP and surface." The agent took a third path (kept 3-arg with `[]`) without surfacing — defensible but the SDK-signature inspection never happened.

## Lesson

This is the same drift pattern called out in feedback memory `feedback_verify_commit_contents.md` and the schema-repo post-mortem (`9c81a4e` claimed-vs-committed drift). Commit-message text is not the same as committed code; the latter is authoritative. CI passing ≠ commit body is accurate.

For Director: trust-but-verify on agent commit bodies before approving downstream work. `git show <sha>` is the contract, not the commit message body. This errata exists because the checkpoint caught the drift; future runs should catch it earlier (before approval, not after).

## Disposition

- **Fix-up:** None required. Code is correct; comment self-documents.
- **Process:** Director-level checkpoint ran `grep -n "new SimpleBatch"` on the touched files before approving the next step, which is the right reflex going forward.
- **Tracking:** This errata closes the matter. No follow-up commits.
