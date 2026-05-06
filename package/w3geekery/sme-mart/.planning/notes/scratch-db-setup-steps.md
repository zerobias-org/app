# Scratch DB Setup — Dataloader Verification

> **Last verified:** 2026-03-17
> **Reference:** [zb-graphql-custom-schema-howto.md](zb-graphql-custom-schema-howto.md) section 6

Follow the howto (section 6.3–6.4). No custom scripts needed.

## Steps

```bash
cd ~/Projects/w3geekery/zerobias-org-forks/schema/package/w3geekery/sme-mart

# 1. Create scratch DB (requires Docker running + ZB_TOKEN set)
npx @zerobias-org/util-content-dev-schema

# 2. Set env vars
export PGUSER=postgres PGPASSWORD=welcome PGHOST=localhost PGPORT=15432 PGDATABASE=content_dev PGSSLMODE=disable

# 3. Run dataloader
dataloader --content-dev --skip-pgboss --skip-dynamo -d ./

# 4. YAML-only validation (no Docker needed)
npm run validate
```

## Connection Details

| Property | Value |
|----------|-------|
| Host | `localhost` |
| Port | `15432` |
| Database | `content_dev` |
| User | `postgres` |
| Password | `welcome` |
| SSL | `disable` |

**Connection string:** `postgres://postgres:welcome@localhost:15432/content_dev`
**Container:** `supabase-pg-content-dev` (Supabase PostgreSQL 17)

## Prerequisites

```bash
# Docker Desktop running
# ZB_TOKEN environment variable set
npm install -g @zerobias-com/platform-dataloader
npm install -g @zerobias-org/util-content-dev-schema@latest
```

## Troubleshooting

### `content-dev-schema` path resolution bug with npx
**Cause:** `npx` resolves resources relative to `bin/` instead of the package dir.
**Fix:** Run `setup.sh` directly from the package location:
```bash
cd $(npm prefix -g)/lib/node_modules/@zerobias-org/util-content-dev-schema && bash setup.sh
```

### `Cannot find import: zerobias.zerobias.base.schema`
**Cause:** Base schema not loaded in the DB.
**Fix:** Recreate the container: `docker stop supabase-pg-content-dev && docker rm supabase-pg-content-dev`, then rerun step 1.

### Dataloader fails with linkTo errors
**Rules:**
- `linkTo` must be at SIBLING indent level (same as property key), NOT nested
- Cannot `linkTo` platform hydra entities (Boundary, Task) — they're not schema classes
- Bidirectional links need `ClassName.id.reverseProperty` on BOTH sides

### Port 15432 already in use
**Fix:** `docker stop supabase-pg-content-dev && docker rm supabase-pg-content-dev`, then retry.
