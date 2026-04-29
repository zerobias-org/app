# Post-Mortem: Redefined `name`/`description` on `DocumentInstance` / `DocumentTemplate`

**Date:** 2026-04-14
**Repo:** `zerobias-org-forks/schema`
**Affected PRs:** 41, 42, 45 (bug shipped) → 46 (fix)
**Affected versions:** `@zerobias-org/schema-w3geekery-smemart` 1.0.15-rc.1 through 1.0.16
**Severity:** Shipped broken schema to published npm artifacts across ~4 days; caught only by local dataloader runs against published versions.

---

## Timeline

- **2026-04-10**: Phase 15 author creates `DocumentInstance.yml` + `DocumentTemplate.yml` redefining `name` and `description` (both inherited from `Object`). PR 41 opened against `dev`.
- **2026-04-10 17:50Z**: PR 41 CI run **SKIPPED** — the `approved` label was never applied. PR 41 merged without dataloader CI ever running against it. Published as `1.0.15-rc.0`.
- **2026-04-13 ~21:00Z**: Later session pulls `1.0.15-rc.0` into `node_modules`, runs dataloader locally → **FAIL**: `Property 'description' already exists on extended class and the fields do not match.`
- **2026-04-13 ~21:38Z**: Session edits `DocumentInstance.yml` + `DocumentTemplate.yml` in source, re-runs dataloader → **PASS** (source is correct, `node_modules` now rebuilt from source). Creates commit `9c81a4e` with message: *"remove inherited base props, add field defs"*. **Commit actually contains only the 15 field YAMLs — the class-file edits were never staged.**
- **2026-04-13 22:37Z**: PR 41 CI re-runs after `approved` label. This time **SUCCESS** — the `fields do not match` check became a no-op because the new field YAMLs registered first and the overload happened to match. Class created cleanly: `Concrete class 'DocumentInstance' added.` PR merged. Bug shipped to published schema again (`1.0.15`).
- **2026-04-14 16:24Z**: PR 46 finally captures the class-file edits. Merged and published.

---

## Answers

### 1. How did local dataloader tests not catch this?

They caught it, then **the green-bar signal was trusted over the commit contents**. The session ran the dataloader after editing source, saw exit 0, and committed. But the `git add` step captured only the new `fields/*.yml` files, not the two modified class files. The dataloader was never re-run against the committed tree (it would have failed again — `node_modules` rebuilt from the committed source would still have had the overload). **No session verified `git show HEAD -- classes/Document*.yml` matched the intended diff before pushing.**

### 2. How did CI dataloader not catch this?

Two failure modes, stacked:

- **First CI run (PR 41, 2026-04-10): SKIPPED** — workflow requires the `approved` label to run dataloader. The label was never applied. CI did nothing for several days.
- **Second CI run (PR 41, 2026-04-13): SUCCESS despite the bug still being present** — the dataloader's rejection rule is conditional: *"already exists on extended class AND the fields do not match."* PR 41 added field YAMLs (`documentInstance.description.yml`, etc.) that registered first with properties identical to the `Object` parent's `description`. The subsequent class-level overload "matched," so the check lapsed. Locally the same check failed because the local run loaded `1.0.15-rc.0` from the npm cache, which predated the new field YAMLs — so the fields did not match. The bug was invisible in CI's exact build order but visible in any local run that loaded the published package.

### 3. How did sessions working on the schema not flag the leftover files?

Across at least three schema PRs (41, 42, 45) the working tree held the two-file cleanup as unstaged changes. Sessions didn't flag it because:

- `git status` output was routinely truncated or summarized rather than reviewed line-by-line
- PR-create helpers used `git add <path>` targeted at new/modified files for that PR, silently ignoring the unrelated modifieds
- No session ran `git diff` against base branch and cross-checked against the PR description claims (PR 41's body explicitly said *"[x] No `Object`-inherited properties redefined"* — that checkbox was manually ticked, never programmatically verified)

### 4. What to tell gsd-execute to explain how it errored

> **Deviation report — schema cleanup lost between commit and push.**
> During Phase 15 re-execution, the fix plan required two coordinated edits: (A) add 15 field YAMLs, (B) remove redundant `name`/`description` from `DocumentInstance.yml` and `DocumentTemplate.yml`. The execution ran local dataloader validation AFTER both edits and saw exit 0. The commit step then used targeted `git add` scoped to the `fields/` directory, which captured (A) but silently dropped (B). The commit message and PR description claimed both were delivered. No post-commit verification step (`git show HEAD -- <expected paths>`) was performed. CI masked the defect because the overload passed the "fields match" escape hatch once the new field YAMLs were in place. Downstream impact: every published schema version from 1.0.15-rc.1 through 1.0.16 shipped with the redefined-inherited-properties bug until PR 46.
>
> **Root cause: claimed-vs-committed drift. gsd-execute's commit phase trusted the author's staged files without reconciling them against the plan's expected file list.**

### 5. New guardrails to add

1. **Static inheritance check in `scripts/validate.ts`** — walk `extends:` chains, detect any class property whose name exists on an ancestor. This is a string-level check that doesn't need dataloader and would fail `npm run validate` instantly. Root of the whole class: a 20-line check would have prevented every version of this bug.
2. **Commit-claim verifier** — pre-push hook: extract file paths from commit messages (regex `\b[A-Z][a-zA-Z]+\.yml\b`, etc.), assert each appears in `git diff HEAD~1`. If message says *"remove X from DocumentInstance.yml"* and `DocumentInstance.yml` isn't in the diff, block the push.
3. **gsd-execute plan↔diff reconciliation** — after the commit step, compare the plan's declared touched files to `git diff --name-only HEAD~1`. Any missing file = checkpoint with the user. This is the direct fix for "what to tell gsd-execute."
4. **Kill the `approved`-label gate for schema PRs** — or at least make "dataloader never ran on this PR" a visible banner on the PR page. PR 41's first merge slipped past zero CI runs.
5. **Strict mode in platform-dataloader** — ask Kevin for a flag that makes *any* redefinition of an inherited property an error, regardless of whether fields match. Today's behavior ("error only if fields don't match") is the reason CI green-lit PR 41.
6. **Published-version dataloader smoke** — after `npm publish --dry-run` or a real publish, run dataloader against the packed tarball (not the workspace). This is the only way to catch "workspace is fine but published artifact is broken" (memory rule exists about this for npm packs, but isn't wired into CI).

### 6. Why did Phase 15 Claude redefine inherited properties in the first place?

**No retrieval-led reasoning.** The author wrote the class YAMLs from first principles instead of reading:

- `Object.yml` in the `zerobias-base` schema package (the parent class — would have shown `name`/`description` are already defined)
- **Sibling classes in the exact same folder** — `Bid.yml`, `RfpInvitation.yml`, `SmeMartProject.yml` all correctly omit `name`/`description`. A three-file `grep` for `^properties:` would have surfaced the correct pattern immediately.
- The schema-extension how-to (`.planning/notes/zb-graphql-custom-schema-howto.md`) which calls out inherited properties explicitly.

This is the same failure mode CLAUDE.md warns against: *"Prefer retrieval-led reasoning over pre-training-led reasoning... never guess when project documentation is available."* The author guessed that a class definition needs all its properties declared explicitly, because that's how most ORMs work. In this schema system, inheritance does the work and redeclaration is an error. No local source check was performed before writing.

The fix-session Claude eventually found it by reading `Bid.yml` (SpecStory line 50363: *"Found it. `name` is inherited from `Object` base class — Bid.yml and RfpInvitation.yml don't redefine it."*) — which is exactly the check the Phase 15 author should have done at the start.

---

## Action Items (for morning review)

- [ ] File issue on `zerobias-org/schema` requesting static inheritance check in `scripts/validate.ts`
- [ ] Draft commit-claim verifier hook (global `~/.claude/hooks/` or per-repo)
- [ ] Raise gsd-execute plan↔diff reconciliation as a /gsd enhancement
- [ ] Ask Kevin about `approved`-label bypass visibility + strict-mode dataloader flag
- [ ] Consider adding `dataloader against packed tarball` to SCHEMA_CHANGE_PROCESS.md
