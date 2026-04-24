---
phase: 15-document-templates
plan: schema-fix
type: execute
wave: 0
depends_on: []
files_modified:
  - "~/Projects/w3geekery/zerobias-org-forks/schema/package/w3geekery/smemart/classes/SmeMartProject.yml"
  - "~/Projects/w3geekery/zerobias-org-forks/schema/package/w3geekery/smemart/fields/documentTemplate.*.yml (9 files)"
  - "~/Projects/w3geekery/zerobias-org-forks/schema/package/w3geekery/smemart/fields/documentInstance.*.yml (10 files)"
autonomous: false
requires_human_gate: true
supersedes: "15-01-PLAN.md schema tasks (which incorrectly marked Phase 15 complete)"

must_haves:
  truths:
    - "Every scalar property on DocumentTemplate has a field definition YAML in fields/"
    - "Every scalar property on DocumentInstance has a field definition YAML in fields/"
    - "SmeMartProject.yml declares documentInstances reverse link (multi: true)"
    - "Real dataloader (not npm run validate) succeeds against Supabase scratch DB on port 15432"
    - ".dataloader-validated marker touched AFTER dataloader exits 0, never before"
    - "Amendment commit pushed to existing feat/document-templates-schema branch"
    - "PR #41 updates automatically (no new PR created)"
    - "Executor STOPS after push — Clark waits for CI: SUCCESS and merges manually"
    - "ROADMAP.md updated to reflect Phase 15 as INCOMPLETE until merge"

---

<objective>
Fix PR #41 so Phase 15 can actually be complete. The existing PR has correct class YAML format but is MISSING:
1. All 19 scalar field definition YAMLs (`fields/documentTemplate.*.yml`, `fields/documentInstance.*.yml`)
2. The reverse link on SmeMartProject (`documentInstances: linkTo: DocumentInstance.id.project, multi: true`)

Because these are missing, the real dataloader has never validated the schema. CI on PR #41 shows SKIPPED. The PR has been open since 2026-04-10 and Phase 15 was incorrectly marked complete.

**This plan adds the missing pieces to the existing branch, validates with the real dataloader, pushes the amendment, and STOPS. Clark reviews CI: SUCCESS and merges.**
</objective>

<hard_rules>

Same rules as 16-00 rewrite. Non-negotiable.

1. **NEVER merge the PR.** Stop after push. Clark merges after CI: SUCCESS.
2. **NEVER use `npm run validate` or `npm run verify` as the validation gate.** Per SCHEMA_CHANGE_PROCESS.md §3: "npm run validate is NOT sufficient." Only the real dataloader against Supabase scratch DB (port 15432) counts.
3. **NEVER touch `.dataloader-validated` before dataloader exits 0.**
4. **NEVER accept SKIPPED CI as passing.** Only `SUCCESS` counts.
5. **Work on the existing branch `feat/document-templates-schema`.** Do NOT create a new branch or new PR. This adds commits to PR #41.
6. **Both sides of bidirectional links must be declared.** SmeMartProject must declare `documentInstances` reverse link.
7. **Field type naming must match existing conventions.** Read an existing field YAML before writing new ones — do not guess.

</hard_rules>

<context>
@.claude/docs/SCHEMA_CHANGE_PROCESS.md
@.planning/phases/15-document-templates/15-CONTEXT.md
@.planning/phases/15-document-templates/15-RESEARCH.md
@.planning/director/WATCH-LIST.md

# Existing PR diff (what's already there)
# Run: gh pr diff 41 --repo zerobias-org/schema

# Reference YAMLs — mirror these
@~/Projects/w3geekery/zerobias-org-forks/schema/package/w3geekery/smemart/classes/SmeMartProject.yml
@~/Projects/w3geekery/zerobias-org-forks/schema/package/w3geekery/smemart/classes/RfpInvitation.yml

# Existing field YAMLs — mirror format for type conventions
@~/Projects/w3geekery/zerobias-org-forks/schema/package/w3geekery/smemart/fields/
</context>

<tasks>

<task type="manual">
  <name>Task 1: Read SCHEMA_CHANGE_PROCESS.md in full, examine existing field YAMLs</name>
  <action>
Read `.claude/docs/SCHEMA_CHANGE_PROCESS.md` top to bottom.

Then examine at least 3 existing field YAMLs in `~/Projects/w3geekery/zerobias-org-forks/schema/package/w3geekery/smemart/fields/` to confirm the format. Specifically look for:
- A string scalar field (for `name`, `description`, etc.)
- A date scalar field (for timestamps)
- A JSON/object scalar field (for `variableSchema`, `variableValues`, `content`)
- A UUID/ID scalar field (for `orgId`, `createdBy`, `templateId`, `engagementId`, `projectId`)

Note: the YAML system may use `type: string` for UUID storage, or may have a dedicated type. Do not guess — mirror what exists.

Also read PR #41's current state:
```bash
gh pr diff 41 --repo zerobias-org/schema
gh pr view 41 --repo zerobias-org/schema --json statusCheckRollup,state,mergedAt
```
  </action>
  <done>
  - SCHEMA_CHANGE_PROCESS.md read in full
  - At least 3 existing field YAMLs examined (string, date, json/object, uuid variants)
  - PR #41 current diff and status reviewed
  </done>
</task>

<task type="auto">
  <name>Task 2: Checkout existing branch, sync with upstream</name>
  <action>
```bash
cd ~/Projects/w3geekery/zerobias-org-forks/schema
git fetch upstream
git fetch origin
git checkout feat/document-templates-schema
git pull origin feat/document-templates-schema
```

Confirm:
- Current branch: `feat/document-templates-schema`
- Existing commit(s) on branch contain DocumentTemplate.yml and DocumentInstance.yml

If the branch has drifted from upstream/dev significantly, rebase onto upstream/dev:
```bash
git rebase upstream/dev
```
If rebase produces conflicts, STOP and ask Clark. Do not force-resolve.
  </action>
  <verify>
    <automated>cd ~/Projects/w3geekery/zerobias-org-forks/schema && git rev-parse --abbrev-ref HEAD | grep -q "feat/document-templates-schema"</automated>
  </verify>
  <done>
  - On branch feat/document-templates-schema
  - Branch synced with origin
  - Existing DocumentTemplate.yml and DocumentInstance.yml present
  </done>
</task>

<task type="auto">
  <name>Task 3: Create 9 field definition YAMLs for DocumentTemplate</name>
  <read_first>
    - At least 3 existing field YAMLs in fields/ (for type conventions)
  </read_first>
  <action>
Create one file per scalar property on DocumentTemplate in `~/Projects/w3geekery/zerobias-org-forks/schema/package/w3geekery/smemart/fields/`:

1. `fields/documentTemplate.name.yml` — description, displayName, type: string
2. `fields/documentTemplate.description.yml` — description, displayName, type: string
3. `fields/documentTemplate.documentType.yml` — description, displayName, type: string (enum-like values documented in description: MSA, NDA, SOW, Exhibit, etc.)
4. `fields/documentTemplate.content.yml` — description, displayName, type: string (markdown content, may be long)
5. `fields/documentTemplate.variableSchema.yml` — description, displayName, type: string (JSON schema defining variables)
6. `fields/documentTemplate.version.yml` — description, displayName, type: string or number — mirror existing numeric field YAMLs
7. `fields/documentTemplate.status.yml` — description, displayName, type: string (draft/published/archived — documented in description)
8. `fields/documentTemplate.orgId.yml` — description, displayName, type: string (UUID)
9. `fields/documentTemplate.createdBy.yml` — description, displayName, type: string (party ID UUID)

**Exact format (mirror existing field YAMLs):**
```yaml
description: '...'
displayName: '...'
type: string
```

Add `multi: true` only if the field is genuinely an array. None of these are arrays.

If any `type` value doesn't match what you see in existing field YAMLs, STOP and ask Clark.
  </action>
  <verify>
    <automated>ls ~/Projects/w3geekery/zerobias-org-forks/schema/package/w3geekery/smemart/fields/documentTemplate.*.yml 2>/dev/null | wc -l | grep -q "9"</automated>
  </verify>
  <done>
  - 9 field YAMLs exist for documentTemplate.*
  - Each has description, displayName, type
  - Types match existing conventions (no guessing)
  </done>
</task>

<task type="auto">
  <name>Task 4: Create 10 field definition YAMLs for DocumentInstance</name>
  <action>
Create one file per scalar property on DocumentInstance in `fields/`:

1. `fields/documentInstance.name.yml`
2. `fields/documentInstance.description.yml`
3. `fields/documentInstance.documentType.yml`
4. `fields/documentInstance.content.yml`
5. `fields/documentInstance.templateId.yml` — type: string (UUID reference)
6. `fields/documentInstance.templateVersion.yml` — type: string (matches template version format)
7. `fields/documentInstance.variableValues.yml` — type: string (JSON blob of resolved variable values)
8. `fields/documentInstance.engagementId.yml` — type: string (UUID, optional)
9. `fields/documentInstance.projectId.yml` — type: string (UUID, optional)
10. `fields/documentInstance.status.yml` — type: string (draft/finalized/signed — documented)

Same format as Task 3. Mirror existing field YAMLs for type conventions.

**Note:** `project` on DocumentInstance is a linkTo, NOT a scalar — it does NOT need a field YAML. The 10 files above cover scalars only.
  </action>
  <verify>
    <automated>ls ~/Projects/w3geekery/zerobias-org-forks/schema/package/w3geekery/smemart/fields/documentInstance.*.yml 2>/dev/null | wc -l | grep -q "10"</automated>
  </verify>
  <done>
  - 10 field YAMLs exist for documentInstance.*
  - Each has description, displayName, type
  - Types match existing conventions
  </done>
</task>

<task type="auto">
  <name>Task 5: Add documentInstances reverse link to SmeMartProject.yml</name>
  <read_first>
    - ~/Projects/w3geekery/zerobias-org-forks/schema/package/w3geekery/smemart/classes/SmeMartProject.yml
  </read_first>
  <action>
DocumentInstance has:
```yaml
- project:
  linkTo: SmeMartProject.id.documentInstances
```

This references `documentInstances` as a property on SmeMartProject — but SmeMartProject.yml doesn't currently declare it. Per SCHEMA_CHANGE_PROCESS.md §2: "Both sides of the link must be defined."

Add to `SmeMartProject.yml` properties list (place it near other reverse links):

```yaml
  - documentInstances:
    linkTo: DocumentInstance.id.project
    multi: true
```

Indent must match sibling properties. `linkTo` must be at sibling indent to the property key, not nested. Mirror other `linkTo` declarations in SmeMartProject.yml.
  </action>
  <verify>
    <automated>grep -n "documentInstances:" ~/Projects/w3geekery/zerobias-org-forks/schema/package/w3geekery/smemart/classes/SmeMartProject.yml && grep -A1 "documentInstances:" ~/Projects/w3geekery/zerobias-org-forks/schema/package/w3geekery/smemart/classes/SmeMartProject.yml | grep -q "linkTo: DocumentInstance.id.project"</automated>
  </verify>
  <done>
  - SmeMartProject.yml contains documentInstances reverse link
  - linkTo: DocumentInstance.id.project
  - multi: true (one project → many instances)
  </done>
</task>

<task type="auto">
  <name>Task 6: Update dataloader to latest (MANDATORY per §3)</name>
  <action>
```bash
npm install -g @zerobias-com/platform-dataloader@latest
dataloader --version 2>&1 | grep "Dataloader v"
```

Capture the version for the PR body update.
  </action>
  <verify>
    <automated>dataloader --version 2>&1 | grep -q "Dataloader v"</automated>
  </verify>
  <done>
  - Latest dataloader installed
  - Version captured
  </done>
</task>

<task type="auto">
  <name>Task 7: Ensure Supabase scratch DB is running</name>
  <action>
```bash
docker ps --filter name=supabase-pg-content-dev
```

If not running: `docker start supabase-pg-content-dev`

If container doesn't exist: `npx @zerobias-org/util-content-dev-schema`
  </action>
  <verify>
    <automated>docker ps --filter name=supabase-pg-content-dev --filter status=running --format "{{.Names}}" | grep -q "supabase-pg-content-dev"</automated>
  </verify>
  <done>
  - supabase-pg-content-dev container running
  </done>
</task>

<task type="auto">
  <name>Task 8: Run REAL dataloader validation</name>
  <action>
```bash
cd ~/Projects/w3geekery/zerobias-org-forks/schema/package/w3geekery/smemart

export PGUSER=postgres PGPASSWORD=welcome PGHOST=localhost PGPORT=15432 PGDATABASE=content_dev PGSSLMODE=disable

dataloader --content-dev --skip-pgboss --skip-dynamo -d ./
```

**Must exit with code 0 AND print "Importer finished successfully".**

If it fails:
- Read the full error output
- Common issues:
  - Missing field YAML for a `field: x.y` reference → add it
  - Type value not recognized → check existing field YAMLs for correct type name
  - Reverse link mismatch → ensure property name and class name match exactly
- Fix the YAML
- Re-run dataloader from scratch
- Do NOT touch `.dataloader-validated` until it succeeds
- Do NOT commit until it succeeds
  </action>
  <verify>
    <automated>cd ~/Projects/w3geekery/zerobias-org-forks/schema/package/w3geekery/smemart && PGUSER=postgres PGPASSWORD=welcome PGHOST=localhost PGPORT=15432 PGDATABASE=content_dev PGSSLMODE=disable dataloader --content-dev --skip-pgboss --skip-dynamo -d ./ 2>&1 | grep -q "Importer finished successfully"</automated>
  </verify>
  <done>
  - Dataloader exits 0
  - "Importer finished successfully" printed
  - No schema validation errors
  </done>
</task>

<task type="auto">
  <name>Task 9: Touch .dataloader-validated (ONLY after Task 8 succeeded)</name>
  <action>
```bash
cd ~/Projects/w3geekery/zerobias-org-forks/schema
touch .dataloader-validated
```
  </action>
  <verify>
    <automated>test -f ~/Projects/w3geekery/zerobias-org-forks/schema/.dataloader-validated && test $(($(date +%s) - $(stat -f %m ~/Projects/w3geekery/zerobias-org-forks/schema/.dataloader-validated))) -lt 1800</automated>
  </verify>
  <done>
  - Marker exists, age under 30 min
  - Created AFTER dataloader succeeded
  </done>
</task>

<task type="auto">
  <name>Task 10: Commit and push amendment to existing branch</name>
  <action>
```bash
cd ~/Projects/w3geekery/zerobias-org-forks/schema

git add package/w3geekery/smemart/classes/SmeMartProject.yml
git add package/w3geekery/smemart/fields/documentTemplate.*.yml
git add package/w3geekery/smemart/fields/documentInstance.*.yml

# Do NOT add .dataloader-validated or .scratch-db/

git commit -m "fix(w3geekery): add missing field definitions and reverse link for document templates

- Add 9 field YAMLs for DocumentTemplate scalar properties
- Add 10 field YAMLs for DocumentInstance scalar properties
- Add documentInstances reverse link on SmeMartProject (multi: true)
- Addresses SCHEMA_CHANGE_PROCESS.md §2 requirement: every scalar property needs a field definition YAML; both sides of bidirectional links must be declared

Dataloader: validated, exit 0, 'Importer finished successfully'

Session: claude --resume poc/sme-mart"

git push origin feat/document-templates-schema
```

This adds commits to the existing branch. PR #41 will automatically update with the new commits. No new PR needed.

If `check-git-workflow.sh` hook blocks the commit, READ the error, fix the root cause, retry. Do NOT bypass the hook.
  </action>
  <verify>
    <automated>cd ~/Projects/w3geekery/zerobias-org-forks/schema && git log origin/feat/document-templates-schema --oneline | head -3 | grep -q "fix(w3geekery)"</automated>
  </verify>
  <done>
  - Amendment commit created
  - Pushed to origin/feat/document-templates-schema
  - PR #41 auto-updates with new commits
  - Hook passed (not bypassed)
  </done>
</task>

<task type="auto">
  <name>Task 11: Update PR #41 body and STOP</name>
  <action>
Update the PR body to reflect the fix:

```bash
gh pr edit 41 --repo zerobias-org/schema --body "$(cat <<'EOF'
## Summary
- New DocumentTemplate class (org-level reusable templates with variable placeholders)
- New DocumentInstance class (engagement/project-scoped instances with resolved values)
- Added all required scalar field definition YAMLs (fields/documentTemplate.*, fields/documentInstance.*)
- Added documentInstances reverse link on SmeMartProject

## Validation
Dataloader <VERSION FROM TASK 6> — passed, exit code 0, 'Importer finished successfully'.

## Test plan
- [x] Real dataloader validated against Supabase scratch DB (content_dev, port 15432)
- [x] Every scalar property has a field definition YAML per SCHEMA_CHANGE_PROCESS.md §2
- [x] Both sides of DocumentInstance → SmeMartProject bidirectional link declared
- [ ] CI check on merge to dev (awaiting review)

## History
Initial commits (2026-04-10) had class YAMLs only, missing the field definition files required by SCHEMA_CHANGE_PROCESS.md §2. CI was SKIPPED and PR was not merged. This fix-up commit adds the missing field YAMLs and reverse link, validated via real dataloader.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**STOP HERE. DO NOT RUN `gh pr merge`. DO NOT CLICK MERGE. DO NOT CLOSE THE PR.**

Report to Clark:
- PR URL: https://github.com/zerobias-org/schema/pull/41
- Latest commit SHA
- Dataloader version used
- Dataloader success confirmation (copy the tail of the output)

Wait for Clark to:
1. Review the updated PR
2. Confirm CI runs and reports `SUCCESS` (not SKIPPED, not PENDING)
3. Merge manually via GitHub UI

**SKIPPED is NOT success.** If CI is still SKIPPED, the branch protection or workflow trigger may be broken. Stop and ask Clark.
  </action>
  <verify>
    <automated>gh pr view 41 --repo zerobias-org/schema --json state -q .state | grep -q "OPEN"</automated>
  </verify>
  <done>
  - PR #41 body updated
  - PR still OPEN (not merged by executor)
  - Executor stopped, reported to Clark
  </done>
</task>

<task type="manual">
  <name>Task 12: [HUMAN] Clark reviews CI and merges PR #41</name>
  <action>
**Clark's action, not the executor's.**

1. Visit PR #41
2. Confirm CI dataloader workflow runs and shows `SUCCESS` (not SKIPPED)
3. Review file changes
4. Merge via GitHub UI
5. Note merge commit SHA and timestamp
6. Tell executor to proceed

If CI is still SKIPPED, diagnose why the workflow isn't triggering (branch protection rules, workflow file path filter, etc.) before merging.
  </action>
  <done>
  - PR #41 state: MERGED
  - CI status: SUCCESS
  - Merge timestamp noted
  </done>
</task>

<task type="auto">
  <name>Task 13: After merge — verify GQL schema reload + capture class IDs</name>
  <action>
Wait ~15 min after merge for GQL reload. Query UAT introspection:

```graphql
{
  documentTemplate: __type(name: "DocumentTemplate") { name fields { name } }
  documentInstance: __type(name: "DocumentInstance") { name fields { name } }
}
```

Both types must return field lists.

Capture the class IDs (deterministic UUID v5 from YAML content — may differ from whatever was registered in `SME_MART_CLASS_IDS` previously since the YAML content changed). Update `src/app/core/services/pipeline-write.service.ts` SME_MART_CLASS_IDS constant if needed.

Report to Clark:
- DocumentTemplate class ID
- DocumentInstance class ID
- Whether app-side code needs constant updates
  </action>
  <verify>
    <automated>true</automated>
  </verify>
  <done>
  - GQL introspection confirms both types live on UAT
  - Class IDs captured
  - App constants updated if needed
  </done>
</task>

<task type="auto">
  <name>Task 14: Update ROADMAP.md to reflect true Phase 15 status</name>
  <action>
Edit `.planning/ROADMAP.md` and `.planning/STATE.md`:

- Phase 15 is now truly complete (schema merged + live + verified)
- Remove any stale "completed 2026-04-10" claims — replace with the real merge date
- Update completed_plans count accordingly

Same for Phase 16 once its schema (PR #42 revert + new PR) lands. That's a separate plan (16-00-PLAN.md rewritten).
  </action>
  <done>
  - ROADMAP.md reflects truth (Phase 15 complete after actual merge)
  - STATE.md updated
  </done>
</task>

</tasks>

<verification>
After all tasks:
1. PR #41 MERGED on zerobias-org/schema:dev with CI: SUCCESS
2. Real dataloader ran against scratch DB (exit 0)
3. 19 field YAMLs added (9 documentTemplate + 10 documentInstance)
4. SmeMartProject.yml declares documentInstances reverse link
5. GQL introspection on UAT confirms both classes live
6. Class IDs captured
7. ROADMAP accurately reflects Phase 15 complete (not prematurely)
</verification>

<success_criteria>
- SCHEMA_CHANGE_PROCESS.md §§2-7 followed, no shortcuts
- All field definition YAMLs exist
- Both bidirectional link sides declared
- Real dataloader (not npm run validate) exited 0
- PR #41 merged by Clark after CI: SUCCESS (not by executor)
- GQL schema live on UAT
- Class IDs known, app constants aligned
- ROADMAP.md tells the truth about phase state
</success_criteria>

<output>
Create `.planning/phases/15-document-templates/15-SCHEMA-FIX-SUMMARY.md` with:
- Dataloader version + output tail
- PR #41 merge commit SHA + timestamp
- DocumentTemplate and DocumentInstance class IDs from UAT
- Whether app-side SME_MART_CLASS_IDS constants needed updates
- Explicit statement: "Executor did not merge PR #41. Clark merged after CI: SUCCESS."
</output>
