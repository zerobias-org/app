# Schema Change Process

> **Read this before making any changes to the GQL schema.**
> Schema repo: `~/Projects/w3geekery/zerobias-org-forks/schema`
> Package dir: `package/w3geekery/smemart/`

---

## 1. Setup — Switch to schema repo and sync

```bash
cd ~/Projects/w3geekery/zerobias-org-forks/schema
git fetch upstream
git checkout -b feat/<descriptive-name> upstream/dev
```

- `origin` = `w3geekery/schema` (our fork)
- `upstream` = `zerobias-org/schema` (upstream)
- ALWAYS branch from `upstream/dev`, not `origin/main`

## 2. Make changes

**Classes** are in `package/w3geekery/smemart/classes/*.yml`
**Field definitions** are in `package/w3geekery/smemart/fields/*.yml`

### Adding a field to a class

1. Add the property to the class YAML:
   ```yaml
   - myField:
     field: className.myField
   ```

2. Create the field definition at `fields/className.myField.yml`:
   ```yaml
   description: 'What this field is'
   displayName: 'My Field'
   type: string
   ```
   Types: `string`, `number`, `boolean`, `date`. Add `multi: true` for arrays.

### Adding a link between classes

```yaml
# In ClassA.yml — single link to ClassB
- classB:
  linkTo: ClassB.id.classAs

# In ClassB.yml — reverse multi-link back to ClassA
- classAs:
  linkTo: ClassA.id.classB
  multi: true
```

Both sides of the link must be defined. The format is `ClassName.id.reversePropertyName`.

### Important YAML rules

- `linkTo` must be at SIBLING indent level (same level as the property key), NOT nested
- Cannot `linkTo` platform-native entities (Boundary, Task) — they're hydra entities, not schema classes. Use scalar fields (`boundaryId: field: x.boundaryId`) instead.
- GQL auto-generates link field names WITHOUT the `Id` suffix. Pipeline data must use the link name (e.g., `engagement` not `engagementId`). Scalar fields keep whatever name you give them.

## 3. Validate with dataloader (MANDATORY)

**`npm run validate` is NOT sufficient.** It only checks YAML structure/naming. The REAL validation requires running the actual dataloader against the scratch database.

### Update dataloader to latest (REQUIRED)

**ALWAYS update dataloader before every validation run.** This is not optional. CI uses the latest version — older local versions may be more lenient and pass schemas that fail on CI. We learned this the hard way: v1.0.89 accepted nested `field:` indent that v1.0.92 correctly rejected.

```bash
# REQUIRED: update first, then check version
npm install -g @zerobias-com/platform-dataloader@latest
dataloader --version 2>&1 | grep "Dataloader v"
```

### Ensure scratch DB is running

```bash
docker ps --filter name=supabase-pg-content-dev
```

If not running (e.g., after reboot):
```bash
docker start supabase-pg-content-dev
```

If the container doesn't exist at all (first-time setup only):
```bash
npx @zerobias-org/util-content-dev-schema
```

### Run dataloader

```bash
cd ~/Projects/w3geekery/zerobias-org-forks/schema/package/w3geekery/smemart

export PGUSER=postgres PGPASSWORD=welcome PGHOST=localhost PGPORT=15432 PGDATABASE=content_dev PGSSLMODE=disable

dataloader --content-dev --skip-pgboss --skip-dynamo -d ./
```

Must exit with code 0 and print "Importer finished successfully".

### Touch the validation marker

```bash
touch .dataloader-validated
```

**ONLY touch this AFTER dataloader succeeds.** The Claude hook checks this marker's age (must be < 30 min). Never touch it without actually running dataloader.

## 4. Commit

```bash
cd ~/Projects/w3geekery/zerobias-org-forks/schema

git add package/w3geekery/smemart/classes/<changed>.yml
git add package/w3geekery/smemart/fields/<new-or-changed>.yml
# Do NOT add .dataloader-validated or .scratch-db/

git commit -m "feat(w3geekery): <description>

Session: claude --resume poc/sme-mart"
```

The Claude hook lives in the **app** repo (not the schema repo) but guards schema commands:
`~/Projects/w3geekery/zerobias-org-forks/app/.claude/hooks/check-git-workflow.sh`

It will verify:
- You're in the w3geekery fork (not `~/Projects/zb/`)
- You're synced with upstream/dev
- Dataloader marker exists and is fresh (< 30 min)
- New `field:` properties have corresponding field definition YAMLs

## 5. Push to fork

```bash
git push origin feat/<branch-name> -u
```

## 6. Create cross-fork PR

```bash
gh pr create \
  --repo zerobias-org/schema \
  --base dev \
  --head w3geekery:feat/<branch-name> \
  --title "feat(w3geekery): <description>" \
  --body "$(cat <<'EOF'
## Summary
- bullet points of changes

## Test plan
- [x] Dataloader validated against scratch DB
- [x] npm run validate passes
- [ ] CI check on merge to dev

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**Critical flags:**
- `--repo zerobias-org/schema` (upstream, NOT the fork)
- `--base dev` (default — dev has the CI dataloader check)
- `--head w3geekery:feat/<branch>` (cross-fork reference)

**Fallback if dev CI is broken:**
If the dev branch CI workflow is down (e.g., `nfa_test` DB missing on Actions runner), target `--base qa` instead. This bypasses the broken dev CI while still deploying the schema to an environment. Resume targeting `--base dev` once CI is fixed.

## 7. After merge

- GQL schema reloads every ~15 minutes after merge to dev/qa/main
- New fields won't be queryable until the reload completes
- Class IDs are deterministic (UUID v5 from YAML content) — same across environments
- Pipeline IDs are per-environment (NOT deterministic)

## GQL field name gotchas

| YAML | GQL query field | Pipeline push field | Notes |
|------|----------------|--------------------|----|
| `field: x.myField` | `myField` | `myField` | Scalar — name matches |
| `linkTo: Other.id.reverse` | `other { id name }` | `other` (just the ID string) | Link — needs `{ subfields }` in query, bare ID in push |
| Base class dates | `dateCreated`, `dateLastModified` | Auto-set by platform | NOT `createdAt`/`updatedAt` |

## Connection details (scratch DB)

| Property | Value |
|----------|-------|
| Host | `localhost` |
| Port | `15432` |
| Database | `content_dev` |
| User | `postgres` |
| Password | `welcome` |
| SSL | `disable` |
| Container | `supabase-pg-content-dev` |
