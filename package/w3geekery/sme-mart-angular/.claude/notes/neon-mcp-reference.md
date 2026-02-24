# Neon MCP Reference — SME Mart

Quick reference for common Neon MCP queries against the SME Mart database.

## Connection Details

| Property | Value |
|----------|-------|
| **Project ID** | `square-meadow-76427985` |
| **Database** | `neondb` |
| **Branch** | default (main) |
| **Host** | `ep-aged-fog-af9wu771.c-2.us-west-2.aws.neon.tech` |

## Tables

| Table | Purpose |
|-------|---------|
| `marketplace_users` | All users (buyers + providers + platform users) |
| `provider_profiles` | Provider detail (headline, rate, rating, slug) |
| `provider_frameworks` | Frameworks a provider is certified in |
| `provider_products` | ZB products a provider supports |
| `provider_roles` | Provider role categories |
| `provider_segments` | Market segments a provider serves |
| `provider_service_segments` | Join: provider ↔ service segment |
| `provider_skills` | Provider skills/competencies |
| `service_offerings` | Packaged services a provider offers |
| `work_requests` | RFPs (open) and Engagements (in_progress) |
| `proposals` | Provider proposals on work_requests |
| `reviews` | Buyer reviews of providers |
| `categories` | Service category tree (parent/child) |
| `app_settings` | Application configuration |

## Views

| View | Purpose |
|------|---------|
| `v_admin_stats` | Dashboard stats (counts, totals) |
| `v_admin_reviews` | Reviews with provider/reviewer names |
| `v_engagement_detail` | Full engagement info (work_request + buyer + provider) |
| `v_engagement_summary` | Engagement list with key fields |
| `v_provider_detail` | Provider profile with aggregated skills/frameworks |
| `v_provider_directory` | Provider listing for Browse Providers page |

## Common Queries

### List all tables
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;
```

### Describe a table's columns
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'work_requests' ORDER BY ordinal_position;
```

### All work requests (RFPs + Engagements)
```sql
SELECT id, title, status, category, engagement_tag, zerobias_task_id,
       buyer_user_id, budget_min, budget_max, timeline
FROM work_requests ORDER BY created_at;
```

### Only engagements (have engagement_tag)
```sql
SELECT id, title, status, engagement_tag, zerobias_task_id, zerobias_tag_id
FROM work_requests
WHERE engagement_tag IS NOT NULL ORDER BY created_at;
```

### Only RFPs (no engagement_tag)
```sql
SELECT id, title, status, category, budget_min, budget_max
FROM work_requests
WHERE engagement_tag IS NULL ORDER BY created_at;
```

### Proposals for a specific RFP
```sql
SELECT p.id, pp.display_name AS provider, p.proposed_price, p.proposed_timeline, p.status
FROM proposals p
JOIN provider_profiles pp ON pp.id = p.provider_id
WHERE p.request_id = '<work_request_id>'
ORDER BY p.created_at;
```

### All providers with ratings
```sql
SELECT id, display_name, headline, hourly_rate, rating_average,
       availability_status, slug
FROM provider_profiles ORDER BY display_name;
```

### Provider reviews
```sql
SELECT r.rating, r.review_text, pp.display_name AS provider,
       mu.display_name AS reviewer
FROM reviews r
JOIN provider_profiles pp ON pp.id = r.provider_id
JOIN marketplace_users mu ON mu.zerobias_user_id = r.reviewer_zerobias_user_id
ORDER BY r.created_at;
```

### Categories (top-level)
```sql
SELECT id, name, slug, icon, sort_order
FROM categories WHERE parent_id IS NULL ORDER BY sort_order;
```

### Categories (children of a parent)
```sql
SELECT c.name, c.slug, c.icon, p.name AS parent
FROM categories c
JOIN categories p ON p.id = c.parent_id
ORDER BY p.sort_order, c.sort_order;
```

### Engagement summary view
```sql
SELECT * FROM v_engagement_summary;
```

### Provider directory view
```sql
SELECT * FROM v_provider_directory;
```

### Admin stats
```sql
SELECT * FROM v_admin_stats;
```

## MCP Tool Pattern

All queries use `mcp__Neon__run_sql` with:
```json
{
  "projectId": "square-meadow-76427985",
  "databaseName": "neondb",
  "sql": "SELECT ..."
}
```

## Other Neon MCP Tools

| Tool | Purpose |
|------|---------|
| `mcp__Neon__list_projects` | List Neon projects (use `search: "square-meadow"`) |
| `mcp__Neon__get_database_tables` | List tables (alternative to information_schema) |
| `mcp__Neon__describe_table_schema` | Column details for a table |
| `mcp__Neon__run_sql_transaction` | Multiple statements in a transaction |
| `mcp__Neon__explain_sql_statement` | Query plan analysis |

## ZeroBias MCP Integration

Engagements link to ZeroBias Tasks via `zerobias_task_id`. To verify tasks:

```
Tool: mcp__zerobias__zerobias_execute
Method: platform.Task.get
Params: { "id": "<zerobias_task_id>" }
```

Switch profiles with:
```
Method: meta.switchProfile
Params: { "profile": "ci-auditmation-dev" }  // or "qa"
```
