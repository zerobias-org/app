# Hub Connection Setup: Generic SQL → Neon (Playbook)

**Date:** 2026-04-22
**Env:** UAT (`uat-clark@w3geekery` profile), boundary **SME Marketplace DEV**
**Target:** expose the SME Mart Neon PG database to ZB Hub as a read-only DataProducer via the generic-sql connector
**Status:** ✅ Connection `up`, secret `valid`. Fix: use the **direct (non-pooler)** Neon endpoint in the JDBC URL — the PG JDBC driver can't authenticate through Neon's pgbouncer pooler. psql works fine through either.

This playbook captures the exact sequence that worked via the ZB MCP (zerobias_execute) against UAT. Every step ran through MCP; no platform UI required.

---

## Prerequisites

| What | How to find |
|------|-------------|
| Profile with hub write access | `meta.listProfiles` → switch with `meta.switchProfile` |
| Profile lock (prevents parallel sessions stomping) | `~/.claude/scripts/zb-mcp-profile-lock.sh check/acquire/release` |
| Boundary the connection belongs to | `platform.Boundary.listBoundaries` |
| Hub Node to deploy on | `hub.Node.list` — SaaS Connection Node for SaaS tenants (it's a **virtual node**, no local SM) |
| Module ID + latest version | `hub.Module.list` → `hub.Module.listVersions` |
| Connection profile ID (secret scaffolds against this) | returned in `store.Module.listVersions` item as `connectionProfileId` |

---

## The Seven Steps

### 1. Switch profile + acquire lock

```
~/.claude/scripts/zb-mcp-profile-lock.sh check <profile>
meta.switchProfile { profile: "<profile>" }
~/.claude/scripts/zb-mcp-profile-lock.sh acquire <profile> <session>
```

### 2. Identify the module + version

```
hub.Module.list                       → find @auditlogic/module-auditmation-generic-sql
hub.Module.listVersions { id }         → pick latest (e.g. 0.5.0)
```

Key IDs for SQL Connector 0.5.0 (UAT, 2026-04-22):

| Field | Value |
|-------|-------|
| moduleId | `df4d16b8-dfd5-4b0e-8a0a-588dd896bb13` |
| moduleVersionId | `d8fe04bf-c47b-540d-a3ed-b730bc9aa023` |
| connectionProfileId | `7957ebee-5ce7-51ed-9730-91bf2a92d6d6` |

### 3. Create the deployment

```
hub.Node.createNodeDeployment {
  nodeId: <node>,
  createNodeDeployment: {
    key: "@auditlogic/module-auditmation-generic-sql",  // module package name, NOT arbitrary
    version: "0.5.0",
    moduleVersionId: "d8fe04bf-..."
  }
}
```

**Gotcha:** `key` is the module package name, not a display name. Server 404s on mismatched keys.

**Result:** deployment with `status: "down"` — normal for fresh deployments pre-connection.

### 4. Inspect the connection-profile shape

```
hub.Deployment.getConnectionProfile { id: <deployment-id> }
```

For generic-sql 0.5.0:

```jsonc
{
  "jdbcUrl": {                    // required
    "example": "jdbc:postgresql://localhost:5432/mydb?user=admin&password=secret"
  },
  "poolSize":   { "default": 5  },
  "maxPoolSize":{ "default": 15 },
  "driverClass":{ "example": "org.postgresql.Driver" }  // auto-detected
}
```

### 5. Provision a dedicated read-only DB role

**Why:** the generic-sql module implements the DataProducer interface — 26 operations, all read-shaped. Writes should go through the app's own role, not Hub. Least-privilege keeps blast radius small if the Hub node is ever compromised.

On Neon (via Neon MCP `run_sql` — one statement at a time):

```sql
CREATE ROLE zb_hub_readonly WITH LOGIN PASSWORD '<generated>';
GRANT CONNECT ON DATABASE neondb TO zb_hub_readonly;
GRANT USAGE ON SCHEMA public TO zb_hub_readonly;
GRANT SELECT ON ALL TABLES    IN SCHEMA public TO zb_hub_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO zb_hub_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES    TO zb_hub_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO zb_hub_readonly;
```

Verify end-to-end:

```bash
psql "$NEON_RO_URL" -c "SELECT current_user"     # expect: zb_hub_readonly
psql "$NEON_RO_URL" -c "INSERT ..."              # expect: permission denied
psql "$NEON_RO_URL" -c "CREATE TABLE ..."        # expect: permission denied
```

Convert Neon native URL → JDBC URL:

| Neon native                                                                                      | JDBC form                                                                                                  |
|--------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------|
| `postgresql://USER:PASS@HOST/DB?sslmode=require&channel_binding=require`                         | `jdbc:postgresql://HOST:5432/DB?user=USER&password=PASS&ssl=true&sslmode=require`                         |

- Neon default port `5432` must be explicit in JDBC form.
- **Use the direct endpoint, NOT the pooler** — drop `-pooler` from the host (e.g. `ep-aged-fog-af9wu771.c-2.us-west-2.aws.neon.tech`). The PG JDBC driver fails SCRAM-SHA-256 through Neon's pgbouncer pooler with `bad_credentials`, even though psql connects fine against both. The SQL Connector 0.5.0 is single-tenant / low-concurrency, so the pooler isn't needed.
- PG JDBC driver handles SCRAM channel-binding automatically when `ssl=true&sslmode=require`.

### 6. Create the Secret (draft → push value → verify)

The SaaS Connection Node is a **virtual node** — it has no local secrets manager. `hub.Node.getWritableSecretPath` errors with *"Cannot list secret nodes on a virtual node"*. Use `mode: "managed"` instead — ZB stores the value in its own central vault.

```
# 6a. create draft
hub.Secret.create {
  createSecret: {
    name: "w3geekery-sme-mart-dev-neon-readonly",
    description: "...",
    connectionProfileId: "<cp>",
    boundaryId: "<bdy>",
    mode: "managed",
    shared: false
  }
}
# returns status: "unknown", draft: true, profile: {}

# 6b. push the actual value
hub.Secret.updateSecretValues {
  id: <secret-id>,
  nodeId: <node-id>,   // query param — required even for managed mode
  requestBody: {
    jdbcUrl: "jdbc:postgresql://..."
  }
}
# ZB stores jdbcUrl at vault.<secret-id>.jdbcUrl and the profile field now references that path
```

**Gotcha:** `hub.Connection.updateConnectionProfile` and `hub.Connection.updateConnectionProfileSecrets` are both **deprecated** — use the Secret-first flow above.

**Do not call** `hub.Secret.update { draft: false }` yet — it fails with *"Cannot enable an unknown secret"*. The secret transitions out of `unknown` only after something actually tests the credentials (i.e. creating a connection that uses it). The connection flow below drives the verification.

### 7. Create the Connection + verify

```
hub.Deployment.createConnection {
  id: <deployment-id>,
  createConnection: {
    name: "...",
    description: "...",
    boundaryId: "<bdy>",
    secretId: "<secret>",
    lifecycleConfig: { mode: "manual" }   // or "auto" with idleTimeout
  }
}
# defaultScope is auto-created
# connection.status → "down" with downReason in {bad_credentials, ...}
# secret.status transitions unknown → invalid | valid
```

- `lifecycleConfig.mode: "manual"` → you explicitly call `hub.Connection.connect` / `disconnect`. Required for `connect`.
- `lifecycleConfig.mode: "auto"` → ZB auto-connects/idles; requires `idleTimeout` (ISO-8601 duration).

On `"auto"` mode, `hub.Connection.reverify` works directly. On `"manual"` mode, `reverify` errors with *"Connection must be created manually"* — use `hub.Connection.connect` instead.

When the connection status is `"up"` and the secret status is `"valid"`, run `hub.Secret.update { draft: false }` to move the secret out of draft.

---

## Concepts / why it's shaped this way

- **Module** = the installable package (`@auditlogic/module-auditmation-generic-sql`).
- **Deployment** = a running instance of a Module on a specific Node.
- **Connection profile** = the *schema* of what a Secret for this module must contain (e.g. `jdbcUrl`).
- **Secret** = a record that holds (centrally, for managed mode) the actual credential values, scoped to a boundary and a connection-profile.
- **Connection** = the composite of {Deployment + Boundary + Secret + lifecycle policy}. It's the thing that actually targets a remote system.
- **Scope** = a sub-target inside a connection (for multi-DB / multi-schema connectors). Auto-created as `defaultScope` if the module is single-scope.

Why not just one `createConnection` with inline creds?
Because secrets are first-class, boundary-scoped resources that can be shared across connections and rotated independently. The two-step flow exists so rotation doesn't require connection recreation.

---

## Exercising the live connection (DataProducer via Hub)

Once `connection.status: up`, module operations are callable via `hub.Target.execute`:

```
hub.Target.execute {
  id: <scope-id-or-connection-id>,   // default scope auto-created by createConnection
  operationId: "getRootObject" | "getChildren" | "getCollectionElements" | "getSchema" | ...,
  requestBody: { ... }
}
```

**Param naming gotcha:** DataProducer uses `objectId` (NOT `parentId`). `getChildren` with `{ parentId: "/" }` returns an NPE `Cannot invoke "String.split(String)" because "objectId" is null`.

**Object-ID tree shape (PostgreSQL):**

| Level | Example ID | Class |
|-------|-----------|-------|
| Root | `/` | container (server) |
| Database | `/db:neondb` | container |
| Schema | `/db:neondb/schema:public` | container |
| Table | `/db:neondb/schema:public/table:bids` | collection |
| View | `/db:neondb/schema:public/view:v_provider_directory` | collection |
| Function | `/db:neondb/function:query`, `/db:neondb/function:erd` | function |

**Minimum viable exercise:**
```
hub.Target.getTargetMetadata { id: <scope> }            → PG version, JDBC driver version
hub.Target.execute getRootObject { }                    → root container
hub.Target.execute getChildren { objectId: "/" }        → list databases
hub.Target.execute getChildren { objectId: "/db:neondb" }  → schemas + built-in functions
hub.Target.execute getCollectionElements {
  objectId: "/db:neondb/schema:public/view:v_provider_directory",
  page: 1, pageSize: 3
}                                                        → actual rows
```

Built-in functions on every DB: `query` (dynamic SQL with param interpolation) and `erd` (schema ERD).

## MCP operations used (cheat sheet)

| Step | Operation |
|------|-----------|
| Find module | `hub.Module.list` / `hub.Module.listVersions` |
| Find profile metadata | `store.Module.listVersions` (has `connectionProfileId`) |
| Deploy | `hub.Node.createNodeDeployment` |
| Inspect profile | `hub.Deployment.getConnectionProfile` |
| Create secret (draft) | `hub.Secret.create` with `mode: "managed"` |
| Push secret value | `hub.Secret.updateSecretValues` |
| Enable secret | `hub.Secret.update { draft: false }` *(after connection verifies)* |
| Create connection | `hub.Deployment.createConnection` |
| Start manual connection | `hub.Connection.connect` |
| Verify auto connection | `hub.Connection.reverify` |
| Inspect state | `hub.Connection.get`, `hub.Secret.get` |

Deprecated (do not use): `hub.Connection.updateConnectionProfile`, `hub.Connection.updateConnectionProfileSecrets`.

---

## Resolved: `bad_credentials` with Neon pooler endpoint

**Symptom:** Connection `down`, `downReason: ["bad_credentials"]`, secret status `unknown → invalid`. Same JDBC URL works via local psql.

**Root cause:** PG JDBC driver fails SCRAM-SHA-256 auth through Neon's pgbouncer pooler endpoint (`ep-xxx-pooler.c-N.region.aws.neon.tech`). psql handles this transparently; JDBC does not.

**Fix:** drop `-pooler` from the host in the JDBC URL. `updateSecretValues` with the direct endpoint → `reverify` (requires `lifecycleConfig.mode: "auto"`). Secret status flipped `invalid → valid`, connection status flipped `down → up` within seconds.

**Secondary gotcha found along the way:** `hub.Connection.reverify` errors with *"Connection must be created manually"* when `lifecycleConfig.mode: "manual"`. Use `hub.Connection.update` to switch mode to `auto` (with an `idleTimeout` like `PT5M`) before calling reverify. `hub.Connection.connect` is the manual-mode equivalent but returned a generic `InvalidInputError` for this case — the auto+reverify path is more reliable.

---

## Environment artifacts (for later cleanup)

| Resource | ID |
|----------|-----|
| Deployment | `87f6ff90-3e60-11f1-97df-d9b9a1d21aad` |
| Secret | `fbafb917-b7e4-4221-a945-9b51e8652391` |
| Connection | `5ae47aa2-285a-439b-b12c-1429dd272931` |
| Default scope | `a7b22df3-dee5-443a-b562-0256d86e46ec` |
| Neon role | `zb_hub_readonly` on `neondb` @ project `square-meadow-76427985` (branch `br-wild-mode-affit7rf`) |
