# Defining Custom GraphQL Schemas on the ZeroBias Platform

> **Status:** Updated 2026-03-06 — dataloader verification tested end-to-end, YAML formatting rules, linkTo constraints documented
> **Audience:** 3rd-party developers building applications on the ZeroBias platform
> **Prerequisites:** ZeroBias org account, `ZB_TOKEN` for package registry, familiarity with GraphQL basics

---

## What This Gives You

Define your application's domain model as YAML files. The platform automatically generates a **fully queryable GraphQL API** — with filtering, pagination, sorting, relationship traversal, and access control — without writing any resolvers, migrations, or server code.

```
You write YAML  →  Platform generates GraphQL API  →  Your app queries it
```

**Write path:** Data enters AuditgraphDB via a **Receiver Differential Pipeline** (push-based). Once ingested, it's queryable through the read-only GraphQL API.

```
Your app writes → Receiver Pipeline (Batch API) → AuditgraphDB → GraphQL API (read-only)
```

**Example:** Define a `WorkRequest` class with five fields in YAML. The platform gives you:

```graphql
# Auto-generated — you don't write this
type WorkRequest {
  id: ID!
  name: String!                    # inherited from Object base class
  description: String              # inherited from Object base class
  title: String!
  status: WorkRequestStatus!
  budgetRange: String
  category: String
  proposals: [Proposal!]           # relationship traversal via linkTo
}

# Query with filtering, pagination, sorting — all built in
query {
  WorkRequest(status: ".eq.PUBLISHED", pageSize: 10, sortBy: ["created"], sortDir: ["Desc"]) {
    id
    name
    title
    status
    proposals { id price }
  }
}
```

---

## How It Works

```
┌──────────────────────────────┐
│   Your Schema Package (YAML) │    You create this in zerobias-org/schema repo
│   classes/ fields/ enums/    │
└──────────────┬───────────────┘
               │  merge to dev/qa/main branch
               ▼
┌──────────────────────────────┐
│   Dataloader                 │    Platform auto-imports on merge
│   (imports into catalog DB)  │    (per-environment branch mapping)
└──────────────┬───────────────┘
               │  automatic
               ▼
┌──────────────────────────────┐
│   AuditgraphDB               │    Per-boundary storage
│   (stores collected objects)  │    Data enters via Receiver Pipeline
└──────────────┬───────────────┘
               │  automatic
               ▼
┌──────────────────────────────┐
│   GraphQL API (read-only)    │    Your app queries this
│   (auto-generated schema)    │    endpoint with ZB SDK auth
└──────────────────────────────┘
```

Your YAML definitions are the **source of truth**. The platform reads them, generates the GraphQL schema at startup, and serves the API. You never touch the database or the GraphQL server directly.

**Environment mapping:** Merging to `dev` deploys to dev, `qa` to QA, `main` to production. No manual publishing step needed.

---

## Base Classes

The platform provides base classes that your entities extend. Choose the right one:

| Base Class | Purpose | Use When |
|-----------|---------|----------|
| **`Object`** | Generic base entity | **Default choice.** Provides id, name, description, note, icon, tag[], metadata, url, dates, includes[], _links[], aliases[] |
| **`File`** | File in FileService | Entity represents a file/document with binary content. Adds fileVersionId, size, mimeType, downloadUrl, viewUrl |
| **`Element`** | Formal document part | Entity is part of a law, framework, standard, or benchmark (e.g., I.R.C. section 162). **Not for general application entities** |
| **`Component`** | Product/service component | Entity supports compliance controls. Adds version, componentType, purpose |
| **`Subject`** | Entity with findings | Entity that can have security findings or alerts attached |

**For most application entities, extend `Object`.** It's the "table stakes" base class. Only use higher-level ancestors if their specific fields are useful to your domain.

---

## Getting Started

### 1. Fork the Schema Repository

The schema repo is a Lerna monorepo at [`zerobias-org/schema`](https://github.com/zerobias-org/schema).

```bash
git clone https://github.com/zerobias-org/schema.git
cd schema
npm install
```

### 2. Create Your Schema Package

```bash
mkdir -p package/{your-vendor}/{your-app}
```

Use the `templates/` directory as a starting point, or copy an existing package like `package/github/github/`.

### 3. Configure Package Metadata

**`catalog.yml`** — identifies your schema to the platform:
```yaml
Schema:
  name: My Application
  package: myvendor.myapp.schema
  description: Domain entities for my marketplace application
```

**`package.json`** — npm package identity and schema imports:
```json
{
  "name": "@zerobias-org/schema-myvendor-myapp",
  "version": "1.0.0-rc.1",
  "zerobias": {
    "import-artifact": "schema",
    "package": "myvendor.myapp.schema",
    "imports": []
  },
  "dependencies": {
    "@zerobias-com/schema-zerobias-zerobias-platform": "latest"
  }
}
```

The `dependencies` array declares npm package dependencies. The platform schema provides base classes like `Object` and `File` that your classes extend. The dataloader resolves these automatically.

**`.npmrc`** — registry authentication:
```
@zerobias-org:registry=https://pkg.zerobias.org/
//pkg.zerobias.org/:_authToken=${ZB_TOKEN}
```

The `imports` array declares dependencies on base schemas. The platform schema provides base classes like `Object` and `File` that your classes can extend.

### 4. Define Your Domain Model

Your package directory should look like this:

```
package/myvendor/myapp/
├── package.json
├── catalog.yml
├── .npmrc
├── classes/              # Entity types (required)
├── fields/               # Field definitions (required)
├── interfaces/           # Shared property contracts (optional)
├── enums/                # Enumerated value sets (optional)
└── documents/            # Nested structures (optional)
```

At minimum you need `classes/` and `fields/`. The rest are optional.

### 5. Validate Locally

```bash
cd package/myvendor/myapp
npm install
npm run validate           # Checks structure, naming, required files
```

### 6. Verify with Dataloader (Required Before PR Merge)

Before your schema PR can be merged, you must verify it loads correctly with the ZeroBias **dataloader**. This is the same tool the platform runs on merge — running it locally catches issues before they hit CI.

#### 6.1 Prerequisites

**NPM Registry Access** — Two private registries are required:

```ini
# ~/.npmrc (global) or project .npmrc
@zerobias-com:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
@zerobias-org:registry=https://pkg.zerobias.org
//pkg.zerobias.org/:_authToken=${ZB_TOKEN}
legacy-peer-deps=true
```

Set these globally for the `npm install -g` step:
```bash
npm config set @zerobias-com:registry https://npm.pkg.github.com/
npm config set //npm.pkg.github.com/:_authToken $GITHUB_TOKEN
npm config set @zerobias-org:registry https://pkg.zerobias.org/
npm config set //pkg.zerobias.org/:_authToken $ZB_TOKEN
```

**Ruby gem** — `schema-evolution-manager` is required for applying hydra DDL scripts:
```bash
gem install --user-install schema-evolution-manager
# Add gem bin to PATH (macOS): export PATH="$HOME/.gem/ruby/$(ruby -e 'puts RUBY_VERSION')/bin:$PATH"
```

**Docker** — for the scratch PostgreSQL database.

**PostgreSQL client** — `psql` command-line tool (macOS: `brew install libpq`).

#### 6.2 Install Dataloader Globally

```bash
npm install -g @zerobias-com/platform-dataloader
```

> **Note:** The package name is `@zerobias-com/platform-dataloader` (NOT `@zerobias-com/dataloader`). The binary is called `dataloader`.

#### 6.3 Create a Scratch Database

The `@zerobias-org/util-content-dev-schema` package automates the entire scratch DB setup in one command — Docker container, full platform schema (300+ tables across hydra/catalog/store/portal), extensions, domains, and dataloader installation.

```bash
# One-command setup (requires Docker running + ZB_TOKEN set)
npx @zerobias-org/util-content-dev-schema
```

**Connection:** `postgres://postgres:welcome@localhost:15432/content_dev`
**Container:** `supabase-pg-content-dev` (Supabase PostgreSQL 17)

> **Source:** `~/Projects/zb/zerobias-org/util/packages/content-schema/`

Set env vars for the content-dev connection:
```bash
export PGUSER=postgres PGPASSWORD=welcome PGHOST=localhost PGPORT=15432 PGDATABASE=content_dev PGSSLMODE=disable
```

#### 6.4 Run Dataloader Against Your Schema

```bash
export PGUSER=postgres PGPASSWORD=welcome PGHOST=localhost PGPORT=15432 PGDATABASE=content_dev PGSSLMODE=disable

dataloader --content-dev --skip-pgboss --skip-dynamo \
  -d path/to/schema/package/myvendor/myapp/
```

The dataloader reads your YAML files, validates them against the catalog schema, and loads class/field/enum definitions into the scratch database. If it exits with code 0, your schema is valid.

**Common issues caught by dataloader:**
- **`No such DataType: string`** — Missing coretype content. Load coretype first (step 5).
- **`No such Package: zerobias.zerobias.base.schema`** — Missing base schema. Load it before your schema.
- **`Field 'x' has not yet been defined`** — Wrong YAML indentation for `linkTo` properties. See [YAML formatting rules](#yaml-formatting-critical).
- **`Class 'X' not found, bad one-sided link`** — `linkTo` referencing a platform-native entity (Boundary, Task) that isn't a schema class. Remove the link or convert to a string field.
- **`No matching link ... class was in this schema package!`** — Bidirectional link missing `.id.reverseProperty` notation on one side. Both sides must specify the reverse.
- Invalid field type references
- Duplicate names or conflicting enum values

#### 6.5 PR Review Process

After dataloader verification:
1. Push your branch and open a PR against `zerobias-org/schema`
2. **Default target:** `--base dev` (dev has the CI dataloader check)
3. **Fallback:** If dev CI is broken (e.g., `nfa_test` DB missing on Actions runner), target `--base qa` instead to avoid blocking schema work
4. **Daniel** reviews the schema PR
5. If approved, Daniel adds an approve tag and merges
6. On merge to `dev`/`qa`/`main`, the platform dataloader auto-imports your schema into the target environment

**Deployment:** Merge your branch to `dev`, `qa`, or `main` in the schema repo. The dataloader auto-imports your schema and the GraphQL API regenerates for that environment. No manual publish step needed.

---

## YAML Reference

### Classes

Classes define your entity types. One YAML file per class in `classes/`. **PascalCase filenames.**

**`classes/WorkRequest.yml`:**
```yaml
description: A buyer engagement/RFP in the marketplace
extends:
  - Object                          # Platform base class (id, name, tags, metadata)
properties:
  - title:
    field: workRequest.title        # References a field definition
  - status:
    field: workRequest.status
  - budgetRange:
    field: workRequest.budgetRange
  - category:
    field: workRequest.category
  - proposals:
    linkTo: Proposal.id.workRequest  # Bidirectional link with reverse property name
    multi: true                      # Array of proposals
viewProperties:                      # Default columns when displayed in platform UI
  "Title":
    jsonata: title                   # JSONata expression to extract display value
    sort: title                      # Sortable column
  "Status":
    jsonata: status
    sort: status
```

**Key concepts:**
- **`extends`** — Inherit from platform base classes or your own interfaces. **Extend `Object`** for general entities. Extend `File` for file/document entities. Do NOT use `Element` unless your entity is part of a formal compliance document.
- **`properties`** — Each property references a field definition (see below). The property name becomes the GraphQL field name.
- **`linkTo`** — Defines relationships to other **schema-defined** classes. See [Relationships](#relationships) below. **Cannot link to platform-native entities** (Boundary, Task) — those are not schema classes.
- **`viewProperties`** — Optional. Defines default UI columns with [JSONata](https://jsonata.org/) expressions for display values.

### YAML Formatting (CRITICAL)

The `linkTo` and `multi`/`uniLink` modifiers must be at the **same indentation level as the property key** (sibling keys), NOT nested under it.

```yaml
# CORRECT — linkTo is a sibling key (same indent as property name)
  - proposals:
    linkTo: Proposal.id.workRequest
    multi: true

# WRONG — linkTo nested under property name (extra indent)
  - proposals:
      linkTo: Proposal.id.workRequest
      multi: true
```

This matters because YAML parses these differently. The correct format creates `{proposals: null, linkTo: "Proposal.id.workRequest", multi: true}` — the dataloader expects this flat structure. The nested format creates `{proposals: {linkTo: ...}}` which the dataloader treats as a field reference and fails.

### Fields

Fields are atomic property definitions. One YAML file per field in `fields/`. **camelCase dot-notation filenames** matching the class property references.

**`fields/workRequest.title.yml`:**
```yaml
description: 'The title of the engagement'
displayName: 'Title'
type: string
```

**`fields/workRequest.budgetRange.yml`:**
```yaml
description: 'Budget range for the engagement'
displayName: 'Budget Range'
type: string
```

**Supported types:**

| Type | GraphQL Output | Example |
|------|---------------|---------|
| `string` | `String` | Names, descriptions, IDs |
| `integer` | `Int` | Counts, ratings (1-5) |
| `number` | `Float` | Prices, percentages |
| `boolean` | `Boolean` | Flags, toggles |
| `date` | `String` | `2026-03-05` |
| `datetime` | `String` | `2026-03-05T10:30:00Z` |

### Relationships

Relationships between **schema-defined classes** are defined inline using the `linkTo` property syntax. Both sides of a bidirectional link must specify the reverse property using `ClassName.id.reverseProperty` notation.

> **Important:** You can only `linkTo` classes defined in your schema package (or imported schema packages). Platform-native entities like `Boundary` and `Task` are NOT schema classes and cannot be used as link targets. Store their IDs as string fields instead.

**Bidirectional link (required for most cases):**
```yaml
# In WorkRequest.yml — "one" side
properties:
  - proposals:
    linkTo: Proposal.id.workRequest     # Points to Proposal, reverse field is "workRequest"
    multi: true                          # WorkRequest has many Proposals

# In Proposal.yml — "many" side
properties:
  - workRequest:
    linkTo: WorkRequest.id.proposals    # Points to WorkRequest, reverse field is "proposals"
```

**Self-referential links (parent/child within same class):**
```yaml
# In NoteFolder.yml
properties:
  - parent:
    linkTo: NoteFolder.id.children
  - children:
    linkTo: NoteFolder.id.parent
    multi: true
```

**Unidirectional link (one-way):**
```yaml
# Only for schema-defined classes — use when no reverse navigation needed
properties:
  - serviceOffering:
    linkTo: ServiceOffering
    uniLink: true
```

**Key `linkTo` modifiers:**
| Modifier | Purpose | Example |
|----------|---------|---------|
| `multi: true` | Array relationship | `proposals` has many `Proposal` |
| `uniLink: true` | One-directional only | No reverse field generated |
| Dot notation | Bidirectional reverse field | `linkTo: Proposal.id.workRequest` |

### Interfaces

Interfaces define shared property contracts that multiple classes can implement. One YAML file per interface in `interfaces/`. **PascalCase filenames.**

**`interfaces/Timestamped.yml`:**
```yaml
description: 'Entities with creation and update timestamps'
properties:
  - createdAt:
    field: common.createdAt
  - updatedAt:
    field: common.updatedAt
```

Then reference in a class:
```yaml
# classes/WorkRequest.yml
extends:
  - Object
  - Timestamped          # Inherits createdAt, updatedAt
properties:
  - title:
    field: workRequest.title
```

### Enumerations

Enums define fixed value sets. One YAML file per enum in `enums/`. **camelCase dot-notation filenames** matching the field they constrain.

**`enums/workRequest.status.yml`:**
```yaml
description: Status of an engagement
displayName: Engagement Status
values:
  - draft: 'Initial creation, not yet published'
  - published: 'Visible to providers, accepting proposals'
  - in_progress: 'Work underway with selected provider'
  - completed: 'Engagement successfully completed'
  - cancelled: 'Engagement cancelled'
```

This generates:
```graphql
enum WorkRequestStatus {
  DRAFT
  PUBLISHED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

### Documents

Documents define flexible nested structures — useful for complex properties that aren't standalone entities. One YAML file per document in `documents/`.

**`documents/ComplianceResponse.yml`:**
```yaml
description: 'Vendor response to a specific compliance requirement'
properties:
  - requirementId:
    type: string
    description: 'ID of the requirement being addressed'
  - complianceLevel:
    type: string
    description: 'Level of compliance (full, partial, none)'
  - evidenceNotes:
    type: string
    multiValue: true                 # Becomes [String!] in GraphQL
    description: 'Supporting evidence and notes'
```

---

## Writing Data (Receiver Pipeline)

The GraphQL API is **read-only**. To create, update, or delete instances of your custom types, use the **Receiver Differential Pipeline**.

### Architecture

```
Your App (Angular/React)
    ↓ user creates/edits entity
Service Layer (e.g., SmeMartResourceService)
    ↓ calls Platform REST API
Receiver Pipeline (Batch API)
    ↓ differential: add/modify/remove
AuditgraphDB (per boundary)
    ↓ queryable
GraphQL API (read-only)
```

### Pipeline Setup

1. **Create a Boundary** — all your data lives in one boundary (e.g., "W3Geekery SME Mart")
2. **Create a Receiver Pipeline** — a URL endpoint scoped to your boundary, configured for Differential mode
3. **Push data through the pipeline** using the Batch API

### Write Sequence

```
createPipelineJob()
    → createBatch(classId)           # one batch per entity type
        → addBatchItem(object)       # add/modify individual records
        → addBatchItem(object)
    → endBatch()
    → createBatch(anotherClassId)    # repeat for each type
        → addBatchItem(object)
    → endBatch()
→ endPipelineJob()
```

### Differential Mode

In differential mode, you tell the pipeline **what changed**, not the full dataset:
- **Add** — new entity
- **Modify** — updated entity (send full object with changes)
- **Remove** — deleted entity

This is more efficient than "full" mode where you'd resend every entity on every update.

### Reference

See [KB34: Collector Developer Guide](https://app.zerobias.com/api/article/kb/kb34/index.html) for the complete Batch API reference including authentication, error handling, and examples.

---

## Querying Your Entities

Once your schema is deployed and data is pushed through the pipeline, your entities are queryable at the platform's GraphQL endpoint.

### Endpoint

```
https://{environment}.zerobias.com/graphql
```

| Environment | URL |
|------------|-----|
| Development | `https://dev.zerobias.com/graphql` |
| QA | `https://qa.zerobias.com/graphql` |
| Production | `https://app.zerobias.com/graphql` |

### Authentication

Include your ZeroBias session JWT or API key in requests:

```http
POST /graphql
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "query": "{ WorkRequest { id name title status } }"
}
```

If using the ZeroBias SDK, authentication is handled automatically through the client library.

### Apollo Sandbox

The platform serves an **Apollo Sandbox** landing page at the GraphQL endpoint. Open it in a browser to explore the generated schema, run queries interactively, and see documentation for all your types and fields.

### Basic Queries

**List all entities of a type:**
```graphql
query {
  WorkRequest {
    id
    name
    title
    status
    budgetRange
  }
}
```

**Traverse relationships:**
```graphql
query {
  WorkRequest {
    id
    title
    proposals {
      id
      price
      status
    }
    reviews {
      rating
      reviewText
    }
  }
}
```

### Filtering

All fields support **RFC4515-style filter operators** passed as string arguments:

| Operator | Syntax | Example |
|----------|--------|---------|
| Equals | `.eq.value` | `status: ".eq.PUBLISHED"` |
| Not equals | `.ne.value` | `status: ".ne.CANCELLED"` |
| Greater than | `.gt.value` | `price: ".gt.1000"` |
| Greater or equal | `.gte.value` | `rating: ".gte.4"` |
| Less than | `.lt.value` | `price: ".lt.5000"` |
| Less or equal | `.lte.value` | `daysToComplete: ".lte.30"` |
| Like (case-sensitive) | `.like.*pattern*` | `title: ".like.*security*"` |
| Like (case-insensitive) | `.ilike.*pattern*` | `title: ".ilike.*SOC*"` |
| Range | `.between.a,b` | `created: ".between.2026-01-01,2026-03-01"` |
| In set | `.in.a,b,c` | `status: ".in.DRAFT,PUBLISHED"` |
| Is null | `.null.` | `assignedTo: ".null."` |
| Is not null | `.notnull.` | `completedAt: ".notnull."` |
| Array is empty | `.isempty.` | `tags: ".isempty."` |
| Array not empty | `.notempty.` | `proposals: ".notempty."` |

**Example — find published work requests in the security category:**
```graphql
query {
  WorkRequest(
    status: ".eq.PUBLISHED",
    category: ".ilike.*security*"
  ) {
    id
    title
    budgetRange
  }
}
```

### Pagination and Sorting

```graphql
query {
  WorkRequest(
    pageSize: 25,
    pageNumber: 1,
    sortBy: ["created"],
    sortDir: ["Desc"]
  ) {
    id
    title
    status
    created
  }
}
```

- **`pageSize`** — Results per page (default varies by environment)
- **`pageNumber`** — 1-based page index
- **`sortBy`** — Array of field names to sort by
- **`sortDir`** — Array of directions: `"Asc"` or `"Desc"` (matches `sortBy` order)

The response includes count headers (`count`, `gqlCount`) for total result size.

### Audit Metadata Filtering

Filter by creation/update timestamps and operations:

```graphql
query {
  WorkRequest(
    metadata: {
      timestamp: ".between.2026-01-01,2026-03-01",
      operation: "CREATE"
    }
  ) {
    id
    title
  }
}
```

Operations: `CREATE`, `UPDATE`, `DELETE`

---

## Stored Queries

The platform supports **saved, versioned GraphQL queries** that can be shared across your team and published as reusable artifacts.

### Creating a Stored Query

**Endpoint:** `POST /catalog/graphqlQueries`

```json
{
  "name": "Active Engagements",
  "description": "Lists all published work requests with proposal counts",
  "template": "query {\n  WorkRequest(status: \".eq.PUBLISHED\") {\n    id\n    title\n    status\n    category\n    proposals { id }\n  }\n}",
  "elements": [],
  "tags": ["<tag-id>"],
  "boundaryId": "<boundary-id>"
}
```

### Lifecycle

Stored queries follow a versioned lifecycle:

| Stage | Status | Description |
|-------|--------|-------------|
| Create | Draft | Initial version (`1.0.0-rc`). Editable. |
| Publish | Published | Versioned release (`1.0.0`). Immutable. |
| Supersede | Archived | Replaced by a newer published version. |

### View Properties

Attach **display column definitions** to stored queries for consistent UI rendering:

```json
{
  "viewProperties": [
    {
      "name": "title",
      "displayName": "Engagement Title",
      "propertyJsonata": "title"
    },
    {
      "name": "proposalCount",
      "displayName": "# Proposals",
      "propertyJsonata": "$count(proposals)"
    }
  ]
}
```

`propertyJsonata` uses [JSONata](https://jsonata.org/) expressions to transform query results into display values.

---

## Boundary Scoping

All data in the platform is **boundary-scoped**. Your application creates a dedicated boundary (e.g., "W3Geekery SME Mart") that contains:
- Your custom schema (classes, fields, enums)
- Your Receiver Pipeline
- All collected entity data in AuditgraphDB

When querying the GraphQL API, only classes and entities scoped to your boundary are visible. This enables multi-tenant scenarios where different projects or clients see different entity types.

---

## Linking to Platform Entities

By extending platform base classes (like `Object`), your custom types integrate with the broader ZeroBias ecosystem:

- **Tagging** — Tag instances of your types with ZeroBias tags (inherited `tag[]` from Object)
- **Schema-to-schema links** — Use `linkTo` to create relationships between classes defined in schema packages (your own or imported ones)
- **Access control** — Leverage platform RLS and org-level permissions
- **Cross-schema links** — Reference classes from other schema packages using `linkTo` syntax

> **Platform-native entities** (Boundary, Task, Principal, etc.) are NOT schema classes. They exist in the `hydra` schema layer, not the catalog schema system. You **cannot** use `linkTo` to reference them. Instead, store their IDs as string fields (e.g., `field: engagement.boundaryId`) and manage the relationship at the application level via the ZeroBias SDK.

---

## Validation Reference

The `npm run validate` command checks:

| Check | Requirement |
|-------|-------------|
| Package name | Must match `@zerobias-org/schema-*` |
| Config key | `zerobias` section must exist with `import-artifact: "schema"` |
| Catalog | `catalog.yml` must have `Schema` section with `name`, `package`, `description` |
| Registry | `.npmrc` file must exist |
| Content | At least one of `classes/`, `interfaces/`, or `fields/` must exist |

---

## Complete Example

Here's a minimal but complete schema package for a marketplace application:

```
package/myvendor/marketplace/
├── package.json
├── catalog.yml
├── .npmrc
│
├── classes/
│   ├── WorkRequest.yml           # extends Object
│   ├── Proposal.yml              # extends Object
│   ├── ServiceOffering.yml       # extends Object
│   └── SmeMartDocument.yml       # extends File
│
├── fields/
│   ├── workRequest.title.yml
│   ├── workRequest.status.yml
│   ├── workRequest.budgetRange.yml
│   ├── workRequest.category.yml
│   ├── proposal.coverLetter.yml
│   ├── proposal.price.yml
│   ├── proposal.status.yml
│   ├── serviceOffering.title.yml
│   ├── serviceOffering.category.yml
│   ├── serviceOffering.pricingType.yml
│   ├── serviceOffering.price.yml
│   ├── smeMartDocument.documentType.yml
│   └── smeMartDocument.version.yml
│
└── enums/
    ├── workRequest.status.yml
    ├── proposal.status.yml
    └── serviceOffering.pricingType.yml
```

**Result after merge + dataloader import:**

```graphql
type WorkRequest {
  # Inherited from Object:
  id: ID!
  name: String!
  description: String
  tag: [String!]
  # Custom fields:
  title: String!
  status: WorkRequestStatus!
  budgetRange: String
  category: String
  # Relationships (from linkTo):
  proposals: [Proposal!]
}

type Proposal {
  id: ID!
  name: String!
  coverLetter: String
  price: Float
  status: ProposalStatus!
  workRequest: WorkRequest           # reverse link (from Proposal.id.workRequest)
}

type ServiceOffering {
  id: ID!
  name: String!
  title: String!
  category: String!
  pricingType: PricingType!
  price: Float
}

type SmeMartDocument {
  # Inherited from File (which extends Object):
  id: ID!
  name: String!
  fileVersionId: String!
  size: Int!
  mimeType: String
  downloadUrl: String
  viewUrl: String
  # Custom fields:
  documentType: DocumentType
  version: String
}

enum WorkRequestStatus { DRAFT, PUBLISHED, IN_PROGRESS, COMPLETED, CANCELLED }
enum ProposalStatus { DRAFT, SUBMITTED, ACCEPTED, REJECTED, WITHDRAWN }
enum PricingType { FIXED, HOURLY, SUBSCRIPTION, CUSTOM }

# All types automatically get: filtering, pagination, sorting, metadata queries
```

---

## Troubleshooting

### Validation fails with "package name must match @zerobias-org/schema-*"

Your `package.json` `name` field must follow the pattern `@zerobias-org/schema-{vendor}-{code}`.

### Validation fails with "at least one of classes/, interfaces/, or fields/ must exist"

Create at least one class or interface YAML file. An empty directory is not sufficient — it must contain at least one `.yml` file.

### My types don't appear in the GraphQL schema

1. Verify the branch was merged to the correct environment branch (dev/qa/main)
2. The dataloader runs automatically on merge — if types still don't appear, check with your ZeroBias administrator
3. If using boundary scoping, ensure your classes are associated with the correct boundary
4. Use the Apollo Sandbox at the GraphQL endpoint to inspect the current schema

### Field names look different in GraphQL than in my YAML

The platform converts `snake_case` field names to `camelCase` in GraphQL. For example, `budget_range` becomes `budgetRange`. Define your field names in camelCase in the YAML to avoid confusion.

### Enum values are UPPERCASED in GraphQL

This is expected. The platform converts enum values to `UPPER_SNAKE_CASE` in the generated GraphQL schema regardless of how they're defined in YAML.

---

*Last updated: 2026-03-06 — Dataloader verification tested end-to-end. Key corrections: package is `@zerobias-com/platform-dataloader` (not `dataloader`), YAML `linkTo` uses sibling indent (not nested), cannot linkTo platform-native entities (Boundary/Task), bidirectional links need `.id.reverseProperty` on both sides, scratch DB requires Docker + hydra schemas + coretype + base schema content.*
