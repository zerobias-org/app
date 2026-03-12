# Scratch DB Setup — Exact Steps

> **Last verified:** 2026-03-06
> **Platform dataloader:** `@zerobias-com/platform-dataloader` v1.0.69
> **Docker base image:** `sarumont/postgres-plus:latest` (PG13 + plv8, AMD64 only)
> **sem-apply:** Ruby gem `schema-evolution-manager` v0.9.57

This documents every step required to build a working scratch DB from zero for dataloader schema validation. These steps were verified working on 2026-03-06.

## CRITICAL: Docker VOLUME Gotcha

**`docker commit` NEVER captures PostgreSQL data.** The `sarumont/postgres-plus:latest` image declares `/var/lib/postgresql/data` as a VOLUME, which `docker commit` excludes. Every committed image is an empty shell.

**Use SQL dumps instead.** The scripts below handle this automatically.

## Quick Start (Automated)

All steps are automated via scripts in the **schema repo**:

```bash
cd ~/Projects/w3geekery/zerobias-org-forks/schema/package/w3geekery/sme-mart

# First time (or after platform updates): full rebuild + save dumps
npm run update-db          # Pulls latest dataloader, rebuilds everything
npm run update-db:skip     # Same but skips dataloader update check

# Verify schema changes against the baseline
npm run verify             # YAML validation + dataloader test (cleans up container)
npm run verify:keep        # Same but leaves container running for inspection
npm run verify:yaml        # YAML-only validation (no Docker needed)
```

### What the scripts do

**`update-scratch-db.sh`** — Full rebuild from scratch:
1. Optionally updates platform-dataloader to latest
2. Starts fresh PG container
3. Applies DDL (full_schema.sql + 5 hydra schemas + sem-apply migrations)
4. Loads coretype + base schema content via dataloader
5. Saves SQL dump: `.scratch-db/scratch-platform-content-loaded.sql`
6. Loads SME Mart schema, saves second dump: `.scratch-db/scratch-sme-mart-loaded.sql`
7. Cleans up container

**`verify-schema.sh`** — Quick validation cycle:
1. Validates YAML schema files (`npm run validate`)
2. Starts fresh PG container
3. Restores the platform-content-loaded SQL dump
4. Runs dataloader with your schema on top
5. Reports success/failure

### SQL Dump Files

Stored in `.scratch-db/` (gitignored):

| File | Contents | Size |
|------|----------|------|
| `scratch-platform-content-loaded.sql` | DDL + coretype + base schema | ~16 MB |
| `scratch-sme-mart-loaded.sql` | Above + SME Mart schema | ~16 MB |

Created by the container's PG13 `pg_dump` (not local PG16+ which produces incompatible SQL).

## Prerequisites

```bash
# 1. Docker Desktop running (with Rosetta enabled for Apple Silicon)
# 2. dataloader installed globally
npm install -g @zerobias-com/platform-dataloader
# 3. sem-apply (Ruby gem)
gem install schema-evolution-manager --user-install
# 4. libpq (PostgreSQL client)
brew install libpq
```

## When to Rebuild (npm run update-db)

- First time setup (no `.scratch-db/` directory)
- After platform-dataloader updates (new DDL migrations)
- After base schema changes
- Periodically to stay current with platform DDL

---

## Full Manual Build (10 Steps)

Use these if the automated scripts fail or you need to debug.

### Step 1: Start fresh container

```bash
docker run -d --name zb-scratch-db -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  sarumont/postgres-plus:latest
```

Wait for PG to be ready:
```bash
until docker exec zb-scratch-db pg_isready -U postgres; do sleep 1; done
```

### Step 2: Create scratch database

```bash
docker exec zb-scratch-db psql -U postgres -c "CREATE DATABASE scratch;"
```

### Step 3: Apply full_schema.sql (first pass)

Creates catalog tables, types. Views referencing hydra tables will fail — expected.

```bash
DL="$(npm root -g)/@zerobias-com/platform-dataloader/node_modules"

docker cp "$DL/@zerobias-com/platform-sql/src/ddl/full_schema.sql" zb-scratch-db:/tmp/
docker exec zb-scratch-db psql -U postgres -d scratch -q -f /tmp/full_schema.sql
```

### Step 4: Apply hydra schemas via sem-apply (5 packages, in order)

**CRITICAL ORDER:** principal -> resource -> principal-role -> security -> health-check

```bash
export PATH="$HOME/.gem/ruby/2.6.0/bin:/opt/homebrew/opt/libpq/bin:$PATH"
export GEM_PATH="$HOME/.gem/ruby/2.6.0:$GEM_PATH"
URL="postgres://postgres:postgres@localhost:5432/scratch?sslmode=disable"

for pkg in hydra-schema-principal hydra-schema-resource hydra-schema-principal-role hydra-schema-security hydra-schema-health-check; do
  (cd "$DL/@zerobias-com/$pkg/src/ddl" && sem-apply --url "$URL")
done
```

### Step 5: Re-apply full_schema.sql (second pass)

Now that hydra tables exist, the ~31 `catalog.vw_*` views get created.

```bash
docker exec zb-scratch-db psql -U postgres -d scratch -q -f /tmp/full_schema.sql
```

"Already exists" errors are expected and harmless.

### Step 6: Apply platform DDL migrations via sem-apply

```bash
(cd "$DL/@zerobias-com/platform-sql/src/ddl" && sem-apply --url "$URL")
```

Applies ~822 migration scripts.

### Step 7: Create nil-UUID role

The dataloader does `SET ROLE` to this UUID. Must exist as SUPERUSER.

```bash
docker exec zb-scratch-db psql -U postgres -d scratch -c \
  "CREATE ROLE \"00000000-0000-0000-0000-000000000000\" SUPERUSER LOGIN;"
```

### Step 8: Load coretype + base schema via dataloader

```bash
export PGHOST=localhost PGPORT=5432 PGUSER=postgres PGPASSWORD=postgres PGDATABASE=scratch PGSSLMODE=disable
export PATH="/opt/homebrew/opt/libpq/bin:$PATH"

# Coretype
dataloader --content-dev --skip-pgboss --skip-dynamo \
  -d "$DL/@zerobias-com/platform-content/src/coretype/"

# Base schema
dataloader --content-dev --skip-pgboss --skip-dynamo \
  -d "$(cd ~/Projects/w3geekery/zerobias-org-forks/schema && pwd)/node_modules/@zerobias-org/schema-zerobias-zerobias-base/"
```

Both must exit 0.

### Step 9: Save SQL dump (the reliable checkpoint)

```bash
mkdir -p .scratch-db
docker exec zb-scratch-db pg_dump -U postgres -d scratch --no-owner --no-acl \
  -f /tmp/platform-content-loaded.sql
docker cp zb-scratch-db:/tmp/platform-content-loaded.sql .scratch-db/scratch-platform-content-loaded.sql
```

### Step 10: Load your custom schema (SME Mart)

```bash
dataloader --content-dev --skip-pgboss --skip-dynamo \
  -d ~/Projects/w3geekery/zerobias-org-forks/schema/package/w3geekery/sme-mart/
```

Save second dump:
```bash
docker exec zb-scratch-db pg_dump -U postgres -d scratch --no-owner --no-acl \
  -f /tmp/sme-mart-loaded.sql
docker cp zb-scratch-db:/tmp/sme-mart-loaded.sql .scratch-db/scratch-sme-mart-loaded.sql
```

---

## Verification

```bash
# Check all 7 SME Mart classes loaded
docker exec zb-scratch-db psql -U postgres -d scratch -tAc "
  SET ROLE \"00000000-0000-0000-0000-000000000000\";
  SELECT r.name FROM hydra.resource r
  JOIN catalog.class c ON r.id = c.id
  WHERE r.name IN ('Engagement','Note','NoteFolder','Proposal','Review','ServiceOffering','SmeMartDocument')
  ORDER BY r.name;"
```

Expected: 7 rows (Engagement, Note, NoteFolder, Proposal, Review, ServiceOffering, SmeMartDocument)

---

## Troubleshooting

### `relation "catalog.vw_collector_botresource" does not exist` during platform DDL sem-apply
**Cause:** `full_schema.sql` was only applied once, before hydra schemas.
**Fix:** Re-apply `full_schema.sql` AFTER hydra schemas (Step 5). The "already exists" errors are harmless.

### `type "hydra.rule_type" does not exist` during platform DDL sem-apply
**Cause:** Missing `hydra-schema-security` package.
**Fix:** Apply all 5 hydra packages in Step 4 — don't skip security.

### Dataloader fails with `null value in column "link_type"`
**Cause:** Missing platform content (link types, resource types). The DDL creates tables but doesn't seed data.
**Fix:** Run coretype dataloader (Step 8) to seed base data types.

### `Cannot find import: zerobias.zerobias.base.schema`
**Cause:** Base schema not loaded.
**Fix:** Run base schema dataloader (Step 8) before your custom schema.

### Dataloader fails with linkTo errors
**Cause:** YAML `linkTo` format issues.
**Rules:**
- `linkTo` must be at SIBLING indent level (same as property key), NOT nested
- Cannot `linkTo` platform hydra entities (Boundary, Task) — they're not schema classes
- Bidirectional links need `ClassName.id.reverseProperty` on BOTH sides

### Local pg_dump produces incompatible SQL
**Cause:** Local PG16+ `pg_dump` emits `\restrict` and `transaction_timeout` directives that PG13 can't parse.
**Fix:** Always use `docker exec <container> pg_dump` to get PG13-compatible output.

### pg_restore custom format fails with partitioned tables
**Cause:** Custom format (`-F c`) doesn't handle partitioned table constraints properly.
**Fix:** Use plain SQL format (`-F p`, the default) — it routes COPY to correct child tables.

---

## Pain Points for Kevin / Backend

1. **Two-phase schema: DDL vs content** — DDL creates tables, content seeds data. Dataloader needs BOTH. This is not obvious and not documented.

2. **full_schema.sql must be applied TWICE** — once before hydra (creates catalog tables) and once after (creates views that reference hydra tables). The second pass is undocumented.

3. **5 hydra packages in specific order** — principal -> resource -> principal-role -> security -> health-check. Order matters.

4. **sem-apply is a Ruby gem** — unexpected dependency for a Node.js ecosystem. Must be installed separately.

5. **Rosetta required on Apple Silicon** — the Docker image is AMD64 only.

6. **Docker VOLUME defeats `docker commit`** — data is lost on every commit. Must use SQL dumps.

7. **Suggested improvement:** Publish a pre-built Docker image to GitHub Container Registry with platform content already loaded. This would reduce setup to: `docker pull ghcr.io/zerobias-org/scratch-db:latest && docker run -d -p 5432:5432 ghcr.io/zerobias-org/scratch-db:latest`
