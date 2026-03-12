# ZeroBias GraphQL Schema Extension Guide

> **Status:** Updated 2026-03-05 — incorporates Kevin McCarthy's architecture decisions from huddle
> **Audience:** Developers building custom applications on the ZeroBias platform.
> **Reviewer:** Kevin McCarthy (CIO)
> **Sources:** `~/zb/platform/graphql/`, [`zerobias-org/schema`](https://github.com/zerobias-org/schema), `~/zb/zerobias-org/util/packages/content-schema/` (local dev DB setup), Kevin huddle 2026-03-05

---

## Overview

The ZeroBias platform provides a **metadata-driven GraphQL API** that dynamically generates schemas from database definitions. Instead of writing GraphQL type definitions and resolvers by hand, you define your domain model as **YAML schema packages** — classes, properties, link types, enumerations, and documents — which the dataloader imports into catalog tables, and the platform generates a fully-functional GraphQL API at runtime.

This means custom applications (like SME Mart) can expose their domain entities through the platform's GraphQL layer **without platform code changes**.

**Key architecture decisions (from Kevin, 2026-03-05):**
- **Read path:** GraphQL API (auto-generated, read-only)
- **Write path:** Receiver Differential Pipeline (push-based Batch API)
- **Storage:** AuditgraphDB (per boundary)
- **Base class:** `Object` for general entities, `File` for file/document entities
- **NOT `Element`** — Element is for formal documents (laws, standards, benchmarks)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 Schema Packages (YAML)                    │
│              zerobias-org/schema monorepo                 │
│                                                          │
│  package/{vendor}/{code}/                                │
│    ├── catalog.yml        (package metadata)             │
│    ├── classes/            (entity type definitions)      │
│    ├── interfaces/         (shared property contracts)    │
│    ├── fields/             (atomic field definitions)     │
│    ├── documents/          (nested structures)            │
│    └── enums/              (enumerated values)            │
│                                                          │
│  npm run validate → merge to dev/qa/main                 │
└────────────────────────┬────────────────────────────────┘
                         │ dataloader auto-imports on merge
                         ▼
┌─────────────────────────────────────────────────────────┐
│       Catalog Tables (PostgreSQL)                        │
│                                                          │
│  catalog.class + catalog.property    ← entity types      │
│  catalog.document + document_property ← nested structs   │
│  catalog.enumeration + enum_value    ← enum values       │
│  app.link                            ← relationships     │
│  catalog.data_type                   ← type mappings     │
│                                                          │
│  Row-Level Security (RLS) · Boundary scoping             │
└────────────────────────┬────────────────────────────────┘
                         │ read at startup
                         ▼
┌─────────────────────────────────────────────────────────┐
│            Cache Layer (in-memory)                        │
│                                                          │
│  InitCache (build-time, discarded after schema build):   │
│    DataTypeCache → ClassCache → LinkCache →              │
│    EnumCache → DocumentCache                             │
│                                                          │
│  RuntimeCache (query-time, kept alive):                   │
│    RuntimeClassCache, RuntimeDocumentsCache               │
└────────────────────────┬────────────────────────────────┘
                         │ generates
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    Apollo Server v5                       │
│              (Apollo Federation subgraph)                 │
│                                                          │
│  SchemaBuilder              SchemaResolver    Plugins    │
│  ├── EnumBuilder            ├── ClassResolver  response  │
│  ├── DocumentBuilder        ├── DocResolver    timing    │
│  └── InputBuilder           ├── LinkResolver   landing   │
│                             ├── EnumResolver             │
│                             ├── CastResolver             │
│                             ├── InterfaceRes.            │
│                             ├── ObjectVersion            │
│                             ├── DatabaseTable            │
│                             └── MetadataFunc.            │
└─────────────────────────────────────────────────────────┘
```

### Write Path (Receiver Pipeline)

```
Angular UI (user creates/edits entity)
    ↓
Service Layer (e.g., SmeMartResourceService)
    ↓ Platform REST API
Receiver Pipeline (Differential mode)
    ↓ createPipelineJob → createBatch → addBatchItem(s) → endBatch → endPipelineJob
AuditgraphDB (per boundary)
    ↓
GraphQL API (read-only queries)
```

The Receiver Pipeline is a **URL endpoint** you push data into (not a cron job). In Differential mode, you tell the platform what changed (add/modify/remove) rather than sending the full dataset.

See [KB34: Collector Developer Guide](https://app.zerobias.com/api/article/kb/kb34/index.html) for the complete Batch API reference.

---

## Base Class Hierarchy

```
Object (base)
├── Element (formal docs — laws, standards, benchmarks)
├── File (files in FileService)
├── Component (products, services supporting controls)
└── Subject (entities with findings/alerts)
```

### Object (Recommended Default)

The "table stakes" base class. Provides:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `ID!` (required) | Unique identifier |
| `name` | `String!` (required) | Display name |
| `description` | `String` | Long description |
| `note` | `String` | Free-form notes |
| `icon` | `String` | Icon identifier |
| `tag` | `[String!]` (multi) | Platform tags |
| `metadata` | `String` | JSON metadata blob |
| `url` | `String` | External URL |
| `dateCreated` | `String` | Creation timestamp |
| `dateLastModified` | `String` | Last modified timestamp |
| `dateDeleted` | `String` | Soft-delete timestamp |
| `includes` | `[Object!]` (multi) | Composed sub-objects |
| `_links` | `[Object!]` (multi) | Platform resource links |
| `aliases` | `[String!]` (multi) | Alternate names |

**Use for:** WorkRequest, Proposal, ServiceOffering, Review, Note, NoteFolder — any general application entity.

### File (Extends Object)

Adds file-specific fields:

| Field | Type | Description |
|-------|------|-------------|
| `fileVersionId` | `String!` (required) | File version in FileService |
| `size` | `Int!` (required) | File size in bytes |
| `mimeType` | `String` | MIME type |
| `downloadUrl` | `String` | Download URL |
| `viewUrl` | `String` | Preview URL |

**Use for:** SmeMartDocument — entities that represent actual files with binary content.

### Element (DO NOT USE for application entities)

Extends Object. Adds `externalId`, `code`, `version`, `background`. Links to `Standard` (child_of), parent/subElements, BaselineElement, ElementType, TestCase.

**This is for formal compliance documents** — laws, frameworks, standards, benchmarks (e.g., I.R.C. section 162, NIST 800-53 controls). NOT for marketplace entities.

---

## How Schema Generation Works

### 1. Cache Build (Startup)

On server startup, the `CacheInstance` loads metadata from the database in dependency order:

```
DataTypes → Classes → Links → Enums → Documents
```

Each cache indexes its data for fast lookup. After the schema is built, init-only caches are discarded to save memory.

### 2. Schema Build

The `SchemaBuilder` orchestrates three sub-builders to produce GraphQL SDL:

| Builder | Source Tables | Generates |
|---------|-------------|-----------|
| `EnumBuilder` | `catalog.enumeration` + `catalog.enumeration_value` | `enum Status { ACTIVE, INACTIVE, DRAFT }` |
| `DocumentBuilder` | `catalog.document` + `catalog.document_property` | `type CustomDocument { id: ID!, name: String, ... }` |
| `InputBuilder` | Derived from classes | `input CreateWorkRequest { title: String!, ... }` |

The builder also injects:
- **Search infrastructure** — `SearchTermEnum`, `MetadataInput`, `LinksFilter` types
- **Link fields** — relationship traversal fields on each type
- **Cast fields** — type coercion fields for polymorphic types

### 3. Resolver Registration

The `SchemaResolver` wires up resolvers for every generated type:

| Resolver | Purpose |
|----------|---------|
| `ClassResolver` | Resolves class/object queries against `catalog.class` data |
| `DocumentResolver` | Resolves document property queries |
| `LinkResolver` | Traverses relationships between entities |
| `LinkFieldResolver` | Resolves individual link fields on types |
| `EnumResolver` | Maps enum values |
| `CastResolver` | Handles type casting for interfaces |
| `InterfaceResolver` | Resolves polymorphic interface types |
| `ObjectVersionResolver` | Temporal/versioned object queries |
| `DatabaseTableResolver` | Direct table queries (for resource overrides) |
| `MetadataFunctionResolver` | Metadata function invocations |

### 4. Server Start

Apollo Server v5 is configured with:
- `buildSubgraphSchema()` (Apollo Federation — composable with other ZB subgraphs)
- JWT-based authentication extracted from request headers
- Database connections with **Row-Level Security** (RLS) per request
- Response plugins for count headers, timing, and the Apollo Sandbox landing page

---

## Defining Custom Entities

There are two paths to defining entities. The **recommended path** is YAML schema packages (source of truth). The alternative is direct SQL into catalog tables (lower-level, useful for understanding what the YAML becomes).

### Path A: Schema Packages (Recommended)

Schema packages live in the [`zerobias-org/schema`](https://github.com/zerobias-org/schema) monorepo. Each package defines a set of classes, interfaces, fields, documents, and enums as YAML files. The dataloader imports them into catalog tables, and the GraphQL API auto-generates.

#### Package Structure

```
package/{vendor}/{code}/
├── package.json          # @zerobias-org/schema-{vendor}-{code}
├── catalog.yml           # Schema catalog entry
├── .npmrc                # Registry configuration
├── classes/              # Entity type definitions (YAML)
├── interfaces/           # Shared property contracts (YAML)
├── fields/               # Atomic field definitions (YAML)
├── documents/            # Nested structure definitions (optional)
└── enums/                # Enumerated value sets (optional)
```

#### Step 1: Create the Package

```bash
# In zerobias-org/schema repo
mkdir -p package/w3geekery/sme-mart
# Copy templates/ as starting point, then customize
```

**`catalog.yml`:**
```yaml
Schema:
  name: SME Mart
  package: w3geekery.sme-mart.schema
  description: Marketplace entities for Subject Matter Expert engagements
```

**`package.json`:**
```json
{
  "name": "@zerobias-org/schema-w3geekery-sme-mart",
  "version": "1.0.0-rc.1",
  "zerobias": {
    "import-artifact": "schema",
    "imports": [
      "@auditmation/schema-auditmation-auditmation-platform"
    ]
  }
}
```

The `imports` array declares dependencies on base schemas (platform provides `Object`, `File`, etc.).

#### Step 2: Define Classes

Classes are entity types. PascalCase filenames. Each class extends a base class and defines properties + relationships.

**`classes/WorkRequest.yml`:**
```yaml
description: A buyer engagement/RFP in the SME marketplace
extends:
  - Object                         # Base class (id, name, tags, metadata, etc.)
properties:
  - title:
    field: workRequest.title
  - status:
    field: workRequest.status
  - budgetRange:
    field: workRequest.budgetRange
  - timeline:
    field: workRequest.timeline
  - category:
    field: workRequest.category
  - boundary:
      linkTo: Boundary
      uniLink: true                # One-directional
  - proposals:
      linkTo: Proposal.id.workRequest   # Bidirectional: WR.proposals ↔ Proposal.workRequest
      multi: true
viewProperties:
  "Title":
    jsonata: title
    sort: title
  "Status":
    jsonata: status
    sort: status
  "Category":
    jsonata: category
```

**`classes/Proposal.yml`:**
```yaml
description: A vendor's response to an engagement/RFP
extends:
  - Object
properties:
  - coverLetter:
    field: proposal.coverLetter
  - price:
    field: proposal.price
  - status:
    field: proposal.status
  - timeline:
    field: proposal.timeline
  - serviceOffering:
      linkTo: ServiceOffering
      uniLink: true
```

**`classes/ServiceOffering.yml`:**
```yaml
description: A provider's catalog listing in the SME marketplace
extends:
  - Object
properties:
  - title:
    field: serviceOffering.title
  - category:
    field: serviceOffering.category
  - pricingType:
    field: serviceOffering.pricingType
  - price:
    field: serviceOffering.price
  - deliveryTime:
    field: serviceOffering.deliveryTime
```

**`classes/Review.yml`:**
```yaml
description: Post-engagement review/rating of a provider
extends:
  - Object
properties:
  - rating:
    field: review.rating
  - reviewText:
    field: review.reviewText
  - status:
    field: review.status
```

**`classes/SmeMartDocument.yml`:**
```yaml
description: File/document attached to an engagement or proposal
extends:
  - File                           # Extends File (which extends Object)
properties:
  - documentType:
    field: smeMartDocument.documentType
  - version:
    field: smeMartDocument.version
  - workRequest:
      linkTo: WorkRequest.id.documents    # Bidirectional
```

#### Relationship Syntax (linkTo)

Relationships are defined inline on class properties:

| Pattern | Meaning | Example |
|---------|---------|---------|
| `linkTo: ClassName` | Uni link (default) | `linkTo: Boundary` |
| `linkTo: ClassName` + `uniLink: true` | Explicit uni link | `boundary: { linkTo: Boundary, uniLink: true }` |
| `linkTo: ClassName.id.reverseField` | Bidirectional | `linkTo: Proposal.id.workRequest` |
| `multi: true` | Array relationship | `proposals: { linkTo: Proposal, multi: true }` |
| `resourceLinkType: child_of` | Platform link type | `parentTask: { linkTo: WorkRequest, resourceLinkType: child_of }` |

#### Step 3: Define Fields

Fields are atomic property definitions. camelCase dot-notation filenames.

**`fields/workRequest.title.yml`:**
```yaml
description: 'The title of the engagement'
displayName: 'Title'
type: string
```

**`fields/proposal.price.yml`:**
```yaml
description: 'Proposed price for the engagement'
displayName: 'Price'
type: number
```

**Supported field types:** `string`, `boolean`, `number`, `integer`, `date`, `datetime`

#### Step 4: Define Enums (Optional)

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

#### Step 5: Validate and Deploy

```bash
cd package/w3geekery/sme-mart
npm install
npm run validate                 # Check structure and naming
```

**Deployment:** Merge to `dev`/`qa`/`main` in the schema repo. Dataloader auto-imports. No manual publish step.

### Path B: Direct SQL (Lower-Level)

For understanding or debugging, here's what the YAML becomes in the database:

**Data type mappings** (from `catalog.data_type`):

| YAML Type | DB Type | GraphQL Type |
|-----------|---------|-------------|
| `string` | `string` | `String` |
| `integer` | `integer` | `Int` |
| `number` | `number` | `Float` |
| `boolean` | `boolean` | `Boolean` |
| `date` | `date` | `String` |
| `datetime` | `datetime` | `String` |
| — | `int64` | `BigInt` (custom scalar) |

The dataloader translates YAML into `INSERT` statements against `catalog.class`, `catalog.property`, `catalog.enumeration`, `catalog.enumeration_value`, `catalog.document`, `catalog.document_property`, and `app.link` tables.

**Field name rules (applied by `DocumentBuilder`):**
- Snake_case properties are converted to camelCase in GraphQL
- Names must be alphanumeric (no leading digits)
- Invalid characters are stripped automatically

---

## Stored Queries

The platform supports **versioned, publishable GraphQL queries** stored in the database. These allow teams to define reusable queries that can be shared, versioned, and published as npm artifacts.

### Table Schema

```
catalog.graphql_query              → Query metadata (name, status, owner)
catalog.graphql_query_version      → Versioned query templates
catalog.graphql_query_classes      → Classes referenced by query
catalog.graphql_query_parameters   → Query variables and types
```

### Creating a Stored Query

**Endpoint:** `POST /catalog/graphqlQueries`

```json
{
  "name": "SME Mart Active Engagements",
  "description": "Lists all active work requests with proposals",
  "template": "query($status: WorkRequestStatus) {\n  WorkRequest(status: \".eq.$status\") {\n    id\n    title\n    status\n    proposals {\n      id\n      vendorName\n      price\n    }\n  }\n}",
  "elements": [],
  "tags": ["<tag-id>"],
  "boundaryId": "<boundary-id>"
}
```

### Query Lifecycle

```
Draft  ──────►  Published  ──────►  Archived
  │                │
  │  (editing)     │  (versioned as npm artifact)
  │                │
  └── v1.0.0-rc    └── v1.0.0
```

- **Draft** — Initial creation. Editable.
- **Published** — Versioned (semver) and released as an npm artifact: `@auditlogic/query-{publisher}-{classname}-{slot}-{sequence}`
- **Archived** — Superseded by a newer version.

### View Properties

Stored queries support **view properties** for UI column configuration:

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

---

## Query Filtering

All generated types support **RFC4515-style filtering operators** as query arguments:

| Operator | Syntax | Example |
|----------|--------|---------|
| Equals | `.eq.value` | `status: ".eq.ACTIVE"` |
| Not equals | `.ne.value` | `status: ".ne.CANCELLED"` |
| Greater than | `.gt.value` | `price: ".gt.1000"` |
| Greater/equal | `.gte.value` | `rating: ".gte.4"` |
| Less than | `.lt.value` | `price: ".lt.5000"` |
| Less/equal | `.lte.value` | `daysToComplete: ".lte.30"` |
| Like (case-sensitive) | `.like.*pattern*` | `title: ".like.*security*"` |
| Like (case-insensitive) | `.ilike.*pattern*` | `title: ".ilike.*Security*"` |
| Between | `.between.a,b` | `created: ".between.2026-01-01,2026-03-01"` |
| In set | `.in.a,b,c` | `status: ".in.DRAFT,PUBLISHED"` |
| Is null | `.null.` | `assignedTo: ".null."` |
| Is not null | `.notnull.` | `completedAt: ".notnull."` |
| Is empty (arrays) | `.isempty.` | `tags: ".isempty."` |
| Is not empty | `.notempty.` | `proposals: ".notempty."` |

### Pagination & Sorting

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
    created
  }
}
```

### Metadata Filtering

Filter by audit metadata (creation, updates, versions):

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

---

## Boundary Scoping

The GraphQL server supports **per-boundary schema generation**. When a `boundaryId` is provided to the server constructor, only classes and documents scoped to that boundary are included in the generated schema.

All SME Mart data (schema, pipeline, entities) lives in a single "W3Geekery SME Mart" boundary.

```
GraphQLServer(roleId, orgId)              → Full schema (all classes)
GraphQLServer(roleId, orgId, boundaryId)  → Boundary-scoped schema
```

---

## Apollo Federation

The platform's GraphQL server is an **Apollo Federation subgraph**. This means:

- It can be composed with other ZeroBias GraphQL services into a unified supergraph
- Entity references (e.g., `Boundary`) can be resolved across subgraph boundaries
- The `buildSubgraphSchema()` function from `@apollo/subgraph` handles federation directives

---

## Security

### Authentication
- JWT extracted from request headers
- Validated per-request before resolver execution

### Row-Level Security (RLS)
- Each request gets a database connection with RLS role
- `hydra.get_principal()` and `hydra.get_org()` available in SQL triggers
- Admin access checked via `hydra.is_ops_org_connection()`

### Resource-Level Permissions
- Classes and documents respect boundary scoping
- Link traversal respects source/target visibility
- Stored queries are scoped to their owner org

---

## Key Source Files

| File | Purpose |
|------|---------|
| `platform/graphql/src/SchemaBuilder.ts` | Dynamic schema generation from metadata |
| `platform/graphql/src/SchemaResolver.ts` | Unified resolver factory |
| `platform/graphql/src/builders/DocumentBuilder.ts` | Document → GraphQL type generation |
| `platform/graphql/src/builders/EnumBuilder.ts` | Enumeration → GraphQL enum generation |
| `platform/graphql/src/builders/InputBuilder.ts` | Input type generation |
| `platform/graphql/src/cache/CacheInstance.ts` | Metadata caching layer |
| `platform/graphql/src/GraphQLServer.ts` | Apollo Server v5 + Federation setup |
| `platform/sql/src/sql/catalog/graphql_query*.sql` | Stored query table schemas |
| `platform/api/src/producers/GraphqlQueryProducerImpl.ts` | Stored query REST API |
| `platform/content/src/schemas/zerobias/platform/interfaces/Object.yml` | Object base class definition |
| `platform/content/src/schemas/zerobias/platform/interfaces/File.yml` | File base class definition |

---

## Example: SME Mart Entity Model

```
┌─────────────────────────────────────────────────────────┐
│              AuditgraphDB (W3Geekery SME Mart boundary)  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Classes (all extend Object unless noted):               │
│    WorkRequest  ──linkTo──►  Proposal                   │
│        │                         │                       │
│        │ linkTo                  │ linkTo                │
│        ▼                         ▼                       │
│    Review                   ServiceOffering             │
│        │                                                 │
│        │ linkTo                                          │
│        ▼                                                 │
│    Note ◄──child_of──► NoteFolder                       │
│                                                          │
│    SmeMartDocument (extends File)                        │
│        │ linkTo                                          │
│        ▼                                                 │
│    WorkRequest / Proposal                                │
│                                                          │
│  Enumerations:                                           │
│    WorkRequestStatus, ProposalStatus, ReviewStatus,      │
│    PricingType, DocumentType                             │
│                                                          │
│  Documents:                                              │
│    ProposalResponse (requirement compliance details)     │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  Write path: Receiver Differential Pipeline (Batch API)  │
│  Read path:  GraphQL API (auto-generated, read-only)     │
├─────────────────────────────────────────────────────────┤
│                      ▼ generates                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  GraphQL Schema (auto-generated):                        │
│                                                          │
│  type WorkRequest {                                      │
│    id: ID!                                               │
│    name: String!              # from Object               │
│    description: String        # from Object               │
│    tag: [String!]             # from Object               │
│    title: String!                                        │
│    status: WorkRequestStatus!                            │
│    budgetRange: String                                   │
│    proposals: [Proposal!]     # via linkTo               │
│    reviews: [Review!]         # via linkTo               │
│    documents: [SmeMartDocument!]  # via linkTo           │
│  }                                                       │
│                                                          │
│  type Proposal {                                         │
│    id: ID!                                               │
│    name: String!                                         │
│    coverLetter: String                                   │
│    price: Float                                          │
│    status: ProposalStatus!                               │
│    workRequest: WorkRequest   # reverse linkTo           │
│    serviceOffering: ServiceOffering                      │
│  }                                                       │
│                                                          │
│  type SmeMartDocument {                                  │
│    id: ID!                                               │
│    name: String!              # from Object               │
│    fileVersionId: String!     # from File                │
│    size: Int!                 # from File                │
│    mimeType: String           # from File                │
│    documentType: DocumentType                            │
│    workRequest: WorkRequest   # reverse linkTo           │
│  }                                                       │
│                                                          │
│  # ... plus filtering, pagination, sorting on all types  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Answered Questions (from Kevin huddle 2026-03-05)

| # | Question | Answer |
|---|----------|--------|
| 1 | How do writes work? | No mutations. Write via Receiver Pipeline (Batch API). Read via GraphQL. |
| 2 | How are file/document entities handled? | File objects exist in GQL (extends Object). SmeMartDocument extends `File` base class. |
| 3 | How does schema deployment work? | Automatic on merge to schema repo branch (dev/qa/main). No manual publish. |
| 4 | Where is data stored? | AuditgraphDB (per boundary). |
| 5 | Where do we define schema? | In `zerobias-org/schema` repo via PR. Package path: `package/w3geekery/sme-mart/`. |
| 6 | How are relationships defined? | In YAML using `linkTo` syntax. Supports uni, bi, multi, and platform link types. |
| 7 | What base class for marketplace entities? | `Object` (NOT Element). Element is for formal compliance documents only. |
| 8 | Can we link across schemas? | Yes, using `linkTo` syntax (same as Q6). Can reference platform types like Boundary. |
| 9 | Can we test locally before deploying? | Not yet. Unified DB + Gradle + dataloader coming soon. |
| 10 | Do we have API auth tokens? | Yes, `ZB_TOKEN` already in env. |

---

*Generated from platform source code (`~/zb/platform/graphql/`) and schema repo ([`zerobias-org/schema`](https://github.com/zerobias-org/schema)). Updated 2026-03-05 with Kevin McCarthy's architecture decisions: Object/File base classes, Receiver Differential Pipeline write path, AuditgraphDB per boundary, linkTo relationship syntax.*
