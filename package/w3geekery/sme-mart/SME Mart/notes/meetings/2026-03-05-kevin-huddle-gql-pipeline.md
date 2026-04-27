# Kevin Huddle — GQL Pipeline Architecture (2026-03-05)

**Participants:** Clark Stacer, Kevin McCarthy
**Duration:** 2:23 PM - 2:32 PM PT
**Topic:** How SME Mart writes data into AuditgraphDB via Receiver Pipeline

---

## Key Decisions

| Decision | Detail |
|----------|--------|
| **Base class** | `Object` — the starting point for everything. Use higher ancestors only if their fields are useful. |
| **Pipeline type** | **Receiver + Differential** (two independent dimensions) |
| **Receiver** | Creates a URL endpoint to push data into. Not a cron job. |
| **Differential** | Tell the platform what changed (add/remove/modify), not the full set. |
| **Boundary** | All SME Mart data in one boundary ("W3Geekery SME Mart"). Schema, pipeline, data — all boundary-scoped. |
| **Schema deployment** | Merge YAML to dev/qa/main in schema repo → auto-updates that environment |
| **Element is wrong** | Confirmed. Element = formal documents. Object = generic base entity. |

## Architecture

```
Schema Repo (YAML)          → defines what data looks like
    ↓ merge to dev/qa/main
Boundary                    → dedicated home for SME Mart data
    ├── Schema              → custom Object types (WorkRequest, Proposal, etc.)
    ├── Receiver Pipeline   → URL endpoint to push data in (Differential mode)
    └── AuditgraphDB        → queryable via GraphQL (read-only)
```

## Write Path

```
Angular UI
    ↓ user creates/edits entity
SmeMartResourceService
    ↓ calls Platform REST API
Receiver Pipeline (addBatchItem)
    ↓
AuditgraphDB (per boundary)
    ↓
GraphQL API (read-only queries)
```

## Pipeline Dimensions

| | Caller (cron) | Receiver (push) |
|---|---|---|
| **Full** (whole set) | Platform diffs the set | Platform diffs the set |
| **Differential** (changes only) | You send changes | **SME Mart** |

## Kevin Quotes

- "Object is the table stakes. You could build on higher level structures if they give you things like fields or properties that you care about."
- "A receiver is basically a web service that you can basically push things into. So anytime you want, you can push things through a receiver pipeline."
- "Once you push things through the receiver pipeline, then they're queryable as records in GraphQL."
- "You'd want a receiver only, a receive only differential pipeline and then basically you could push into that any objects that conforms with the schemas that you define."
- "The full pipeline means you have to tell the pipeline every single run every employee in your company... Versus if you do differential, you need to say I added this, I removed this, I modified this."

## Reference

- **KB34:** Collector Developer Guide — https://app.zerobias.com/api/article/kb/kb34/index.html
- **Schema repo:** `zerobias-org/schema` (cloned to `~/Projects/zb/zerobias-org/schema/`)
- **Object base class:** `~/Projects/zb/platform/content/src/schemas/zerobias/platform/interfaces/Object.yml`

## Blocker Questions — Answered

All 10 blocker questions from the migration plan now have answers:

| # | Answer |
|---|--------|
| Q1 | No mutations. Write via Receiver Pipeline (Batch API). Read via GraphQL. |
| Q2 | File objects exist in GQL (extends Object). Document → use `File` base class. |
| Q3 | Automatic on merge to schema repo branch (dev/qa/main). |
| Q4 | AuditgraphDB (per boundary). |
| Q5 | Yes, create in `zerobias-org/schema` repo via PR. |
| Q6 | Yes, relationships defined in YAML. See schema repo CLAUDE.md. |
| Q7 | Not Element. Object is the base. Review task-backing TBD. |
| Q8 | Yes, cross-schema links defined in YAML (same as Q6). |
| Q9 | Not yet. Unified DB + Gradle + dataloader coming soon. |
| Q10 | Yes, ZB_TOKEN already in env. |
