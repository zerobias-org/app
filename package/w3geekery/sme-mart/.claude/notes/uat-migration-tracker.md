# UAT Migration Tracker

CI/dev (`ci.zerobias.com`) is being nuked and rebuilt with hydra. UAT (`uat.zerobias.com`) is our temporary CI/dev replacement. This file tracks everything that needs to be recreated on UAT.

**UAT Credentials (Clark Stacer):**
- API Key: `660e553e-b2b4-4972-b8e3-c9cd9617f101`
- Org: Zerobias Operations (`d2216703-f63b-5281-87c0-5eaa892fbec5`)

---

## Migration Checklist

### 1. Boundary

| Entity | CI Value | UAT Value | Status |
|--------|----------|-----------|--------|
| Boundary name | W3Geekery Dev | W3Geekery Testing | ✅ Done |
| Boundary ID | `b1e4b97e-6ef2-4e7e-8dbc-c3750fb9306e` | `7c43e376-b079-41f5-a42c-9ce7c64597fc` | ✅ Done |

### 2. Activity

Activities are platform-global (same IDs across all environments). Confirmed via `platform.Activity.list` on UAT.

| Entity | CI Value | UAT Value | Status |
|--------|----------|-----------|--------|
| Activity name | Ad Hoc Activity - One person | Ad Hoc Activity - One person | ✅ Same |
| Activity ID | `e15830c8-4274-4d67-bf9b-c22b60001e32` | `e15830c8-4274-4d67-bf9b-c22b60001e32` | ✅ Same |

### 3. Tags (hydra)

All tags follow the pattern `sme-mart.eng.<codename>`. Created via `hydraClient.getTagApi().createTag()` with `ownerId` = org ID for org-scoped tags.

| Tag Name | CI Tag ID | UAT Tag ID | Status |
|----------|-----------|------------|--------|
| `sme-mart.eng.crystal-harbor` | `518acc1c-acc5-4831-b4db-5648cd5f9558` | `b4c97483-edbe-4854-b81c-aba40c7f1b9d` | ✅ Done |
| `sme-mart.eng.velvet-summit` | `e07c3ee5-4bfc-42bf-b61d-33c08750d20a` | `0630ad1b-0c12-4914-b90b-36ae8f7ca628` | ✅ Done |
| `sme-mart.eng.amber-circuit` | `aacd35bd-ca10-4032-9603-00d19e018194` | `b244cd6c-df3c-4888-932f-81c76ae51ad6` | ✅ Done |
| `sme-mart.eng.silver-bridge` | `b3b590d8-3140-4866-b344-ca79ef1cc2a8` | `29ab33e0-ca75-44ce-a809-8d2ce879c922` | ✅ Done |
| `sme-mart.eng.coral-meadow` | `49cbb0b8-ccd3-4d92-88e5-16e63ef81662` | `b8e84e56-bf69-4013-aa9c-9d4157b5418a` | ✅ Done |

### 4. Tasks

All tasks created in boundary above, activity above, status `in_progress`, workflow "Software Development Lifecycle". Each task is tagged with its corresponding engagement tag.

| Task Code | Task Name | CI Task ID | UAT Task ID | Status |
|-----------|-----------|------------|-------------|--------|
| `aha1-1` | SOC 2 Readiness Assessment | `223318eb-feb5-4454-8454-a28efc935f4d` | `fafe9c00-136c-4ee1-985d-c3a1f7aa0095` | ✅ Done |
| `aha1-2` | NIST CSF Gap Analysis | `f30ffe2b-1e6d-458e-9d65-72df5b9ff599` | `9d4a93a9-9258-46e7-975d-5c518228f476` | ✅ Done |
| `aha1-3` | Compliance Automation Setup | `4a3ad32b-4800-43db-83be-a33d134317d0` | `9ab5a79a-aaae-40b6-b49c-a418bc359c68` | ✅ Done |
| `aha1-4` | FedRAMP Authorization Support | `67659347-8925-414c-822c-76a41ef1ff40` | `127dfed5-39ca-4696-945a-109c1c39097c` | ✅ Done |
| `aha1-5` | ISO 27001 Evidence Collection | `46cf4833-035c-4113-8e00-175a31ed9ab3` | `43bcbbfd-cd40-4020-b83b-97bdb38f6e61` | ✅ Done |

### 5. Hub Module Connection (Generic SQL)

| Entity | CI/QA Value | UAT Value | Status |
|--------|-------------|-----------|--------|
| Connection name | SQL Connector Connection 1 | N/A | ⏸️ Skipped — using `dbMode: 'neon'` (direct Neon HTTP) |
| Connection ID | `e3c874f5-5fd8-4fbc-8120-19861e28b19e` | N/A | ⏸️ Hub Module not active |
| Module | `@auditlogic/module-auditmation-generic-sql` | same | — |
| Connector Version | 0.5.0 | latest | — |
| Neon JDBC URL | `jdbc:postgresql://ep-aged-fog-af9wu771...` | same DB | — |

### 6. Config Files to Update After Migration

Once UAT IDs are created, update these files:

| File | What to update |
|------|----------------|
| `src/environments/environment.ts` | `smeMartConnectionId` → new UAT connection ID |
| `src/environments/environment.vercel.ts` | `smeMartConnectionId` → new UAT connection ID |
| `middleware.ts` | Already defaults to `uat.zerobias.com` ✅ |
| `vercel.env` | `ZB_API_KEY`, `ZB_ORG_ID` → UAT values (for Vercel deploy) |
| `.claude/notes/demo-data-guide.md` | All tag IDs, task IDs, boundary ID → UAT values |

---

## Neon Database (No Migration Needed)

Neon DB is independent of ZeroBias environment — same database across CI/QA/UAT/Prod.

| Entity | Value | Notes |
|--------|-------|-------|
| Project ID | `square-meadow-76427985` | Stays the same |
| Database | `neondb` | Stays the same |
| Endpoint | `ep-aged-fog-af9wu771.c-2.us-west-2.aws.neon.tech` | Stays the same |
| Connection string | in `.env.local` | No change needed |

---

## Migration Order

1. **Boundary** — create first (tasks need a boundary) ✅ Done
2. **Activity** — platform-global, same ID everywhere ✅ No migration needed
3. **Tags** — create via hydra API ✅ Done (5 tags created 2026-03-13)
4. **Tasks** — create in boundary + activity, tag each ✅ Done (5 tasks created + tagged 2026-03-13)
5. **Hub Connection** — ⏸️ Skipped (using `dbMode: 'neon'`, Hub Module not active)
6. **Update configs** — Neon DB rows + demo-data-guide + tracker updated ✅ Done
7. **Verify** — `npm run dev` loads against UAT ✅ Done (2026-03-13). Fixed: Neon timestamp bug, documents-tab sub init. PKV 500s are UAT platform issue (not our code).

---

## Notes

- UAT uses **hydra** for tags/resources (same as what CI will eventually use)
- Tag creation on UAT should use `hydraClient.getTagApi().createTag()` — no more `danaOld` path
- Task→Tag linking uses `hydraClient.getResourceApi()` for resource tagging
- The Neon demo data (work_requests, bids, providers, etc.) references `zerobias_task_id` and `zerobias_tag_id` columns — these will need SQL UPDATEs after creating UAT entities
