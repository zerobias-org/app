# ZeroBias Platform Security Guide (kb9)

**Source:** `platform.KbArticle` code `kb9`, version 1.0.8
**Retrieved:** 2026-04-02 via `meta.getKbArticleContent` in ZB MCP
**CDN URL:** https://cdn.zerobias.com/kb/kb9/index.html

> **How to refresh:** `mcp__zerobias__zerobias_execute({ path: "meta.getKbArticleContent", params: { code: "kb9" } })`
> **How to find other articles:** `mcp__zerobias__zerobias_execute({ path: "platform.KbArticle.listKbArticles", params: { search: "keyword" } })`

---

## ZeroBias Platform Overview

### Solution Overview

ZeroBias is a data platform that collects, normalizes and correlates evidence to enable internal and external audits of systems, resources, and processes. Key features:

- [Boundaries](#boundaries)
- [Data Collection](#data-collection)
- [AuditGraph DB](#auditgraph-db)
- [Evidence Repositories](#evidence-repositories)
- [Audits](#audits)

### Boundaries

Boundaries represent a set of assets and supporting controls and are used to organize data and evidence in the platform. Boundaries can represent different:

**Physical or Logical Asset Groups.** For example, if there are separate environments for different applications or services that are isolated from one another, each environment could be a separate boundary.

**Policies, Procedures or Responsibilities.** Each boundary has its own policies, procedures, controls, and responsibility matrix. Any situations where different teams or regulations are in place would require separate boundaries, for example GovCloud/FedRAMP vs Commercial, US vs EU, etc.

**Environment Types (Production/Lab/Sandbox).** Separate boundaries are helpful to segment production data and systems from lab or sandbox environments used for creating new content or testing/validating configurations prior to promotion.

It is possible to share data across boundaries either by mapping the exact same data to multiple boundaries (for instance, same list of employees in Boundary A and Boundary B), or by collecting different portions of data from the same application into different boundaries (tickets for Project X in Boundary A, tickets for Project Y in Boundary B).

Boundaries are bound to compliance frameworks (SOC 2, NIST, FedRAMP, etc) and adhere to some or all of the controls/requirements in the selected frameworks as specified by the boundary owner. All evidence collected in the boundary can be mapped to controls/requirements and used inside Audit Rooms to demonstrate adherence.

### Data Collection

Data collection is performed inside boundaries by Data Pipelines that utilize Connections to acquire and transform data from source systems. Three forms:

**Collection Bots.** Purpose-built software modules designed specifically for given applications. Can be tuned and configured for the boundary.

**File Pipelines.** Used to collect specific files/documents (Employee Handbook, Data Flow Diagram, Documentation, etc.) from connected source systems (OneDrive, Confluence, GitHub, DropBox, etc.).

**No-Code Pipelines.** Able to transform structured documents (XLS, CSV, JSON, YAML) or application data (SQL, REST, LDAP, GRC, etc.) into objects that conform to the ZeroBias Schema.

Data pipelines all run at a user-defined frequency (daily, weekly, monthly, etc.). Each time a pipeline runs, it creates a job record, and one or more batches. Each batch generates a digital chain of custody.

### AuditGraph DB

All data collected from pipelines is stored in AuditGraph DB: a purpose-built timeseries graph database for enabling present-time and look-back audits and continuous control testing.

Each object in each batch is compared against the previously stored version. When a change is detected, a new version of the object is recorded. This capability allows for near-realtime detection of changes.

AuditGraphDB continuously detects links between objects collected across all systems/pipelines as well as shared objects in the catalog (CVEs, CWEs, controls, etc).

The combination of time-series and graph are complemented by a powerful query engine (GraphQL).

### Evidence Repositories

**Queries** — GraphQL queries to select and extract data from AuditGraph DB spanning single or multiple applications.

**Evidence Definitions / ERLs** — Express a specific type of information (e.g., "A list of current employees"). Mapped to framework controls and requirements. A collection = Evidence Request List (ERL).

**Evidence Bots** — Tie together a query and evidence definition. Through this association, the platform categorizes all evidence under framework controls.

### Audits

Audits are data rooms that present evidence for all or parts of a boundary for a given period of time to select parties. Scoped by:
- Framework (NIST, ISO, SOC2, etc.) — same boundary supports multiple audits via SCF controls
- Controls in scope (full or limited set)
- Lookback period (start and stop dates)

Only selected parties are invited to the data room. These parties may be inside or outside the company, but all must have accounts in the ZeroBias platform.

## Platform Architecture

Building blocks:
- ZeroBias Platform Services
- ZeroBias Connection Nodes
- Modules
- Secrets Managers
- Source Systems

### Platform Services

The ZeroBias SaaS platform provides:
- IAM functions (Authentication and Authorization)
- Data storage and processing
- API and UI access
- Application features

### ZeroBias Connection Nodes

Nodes provide the runtime environment for data collection modules. All connections to source systems originate from a node, which relays information back to ZeroBias using outgoing ports only (no listening ports).

Configurations: Single Node, Dual Nodes, Node(s) Per Environment, Node(s) Per Branch Office, Node(s) Per Windows Domain, Node Agent Per Server.

### Modules

Software packages that execute on a node to collect data. Two forms:
- **Connectors** — interact with remote systems via REST, SQL, SOAP, SNMP, etc. (agentless)
- **Agents** — execute directly on an OS via the Node system service

### Secrets Managers

Supported: AWS Secrets Manager, Azure Key Vault, GCP Secret Manager, Hashicorp Vault, CyberArk Conjur.

## Authentication

ZeroBias requires users to be identified by external Identity Provider. Default providers: Microsoft (Entra ID, Live/Hotmail), Google (G-Suite, Gmail), Apple, LinkedIn, Amazon.

Additional supported types: Active Directory/LDAP, ADFS, OpenID Connect, Okta, SAML, Ping Federate, Auth0 Social/Enterprise Connections.

Users are invited via e-mail. If the e-mail address in the exported identity does not match either an existing user or an invitation, the user will not be allowed to log in.

By default, users own their own accounts (like GitHub). However, **it is strongly recommended for all organizations to register their e-mail domain with ZeroBias**, to ensure all accounts that end with the domain(s) will belong to the organization. This also enables organization-level policies (self-registration, account caps).

## Session Management and Cookies

Session-based cookies only (cleared on logout or expiration). Sessions expire based on org-defined max duration or inactivity timer, whichever comes first. Users in multiple organizations are bound by the most restrictive values. No tracking or third-party cookies.

## Organizations / Tenancy

Organizations are the owners of Applications, Resources, and Objects in the ZeroBias Platform, and form the basis for tenancy and governance.

Users must belong to at least one Organization. Multiple org membership use cases:
- An Auditor performing audits on different companies
- A consultant who is an Advisor to different companies
- An employee in shared services across distributed/franchised company divisions

Users can switch between organizations via the UI. Different permissions and grants per org.

The Governance application manages user invitations and group memberships.

**All organizations are presently moderated and approved by ZeroBias.** Future: DNS domain verification for self-service creation.

**Built-in Groups:**
- **Org Users** — users able to log in to this Organization and use ANY applications/resources
- **Org Admins** — admins of all resources in the Organization

## Authorization

Two primary mechanisms:

### Resource Authorization

**Resources** — objects subject to security restrictions. Most entities in ZeroBias are Resources (Applications, Boundaries, Connections, Audits, Frameworks, etc.). All Resources have a known type, unique ID, and belong to an Organization.

**Principals** — individuals (users), security groups, or systems (API keys) that can be granted access.

**Permissions** — actions (create, delete, search, export, tag, etc.) granted or restricted for selected principals on given Resources.

**Access Rules** — policies that grant or revoke permissions for a Principal to a selection of Resources using Resource Selectors:
- Exact resource (e.g., "XYZ Audit")
- All resources of a given type (e.g., "All Connections")
- All resources of a given type with a given Tag (e.g., "All Connections in Boundary X" — boundaries are backed by tags)
- All resources with a given property value (e.g., "All Audits with status Complete")

### Pre-Defined Roles

| Organization Type | Role Name | Description |
|---|---|---|
| Auditor | Audit Manager | Administrator of Audit Entity |
| Auditor | Audit Lead | Administer select Audits only |
| Auditor | Audit Analyst | Audit Participant (non-admin) |
| Auditee | IT Specialist | Administer Boundaries and Connections |
| Auditee | Internal Auditor | Administer Evidence Repos and Audits |
| Auditee | Data Steward | Administer AuditGraph DB and Queries |
| Auditee | Guest Auditor | Participant in select Audits only |

### Object Authorization

For AuditGraph DB objects:
- Principals get Permissions through Access Rules (same as Resources)
- The only Permission is **Read**. All writes are done via Data Pipelines.
- Object Selectors match Classes (vs Resource Types)
- Boundary, Tag, and Property-Value selectors work similarly

## Zero Trust Principles

Architecture designed around NIST SP 800-207 principles.

## Encryption and Data Protection

All communications use SSL/TLS. All data at rest encrypted via AWS (RDS, S3, DynamoDB, Backup, Secrets Manager, CloudWatch).

## Secure Operations Guide

### Operations Overview

Customer responsibilities:
- Boundary creation/maintenance (products, frameworks)
- Node/Secrets Manager deployment and management
- API key provisioning for Connections
- Data Pipeline creation, configuration, management
- Module updates as software versions change
- User/Group/Permission management
- Lab/Sandbox management

### Connection Node Management

Standard server/network security best practices apply. Outgoing connections only (port 443 to ZeroBias Platform URL + SaaS source systems).

### Least Privilege / Credential Management

ZeroBias requires read-only access to source systems. Data pipelines never modify source systems (except generating audit/log records from reads).

### Data Pipelines

Configuration needed for: customer-specific mappings, boundary scoping (what data is in scope), property mapping to ZeroBias Schema. Avoid over-collecting data.

### Labs / Sandboxes

Three environments recommended: Lab/Dev (exploration), Sandbox (production simulation), Production (highest standard of care). ZeroBias uses Terraform for dev environments.

### Change Management

Two areas: inside the Boundary (products, frameworks, connectors, pipelines) and outside/above (audits, queries, bots, ERLs).

---

*Retrieved from ZeroBias KB via MCP on 2026-04-02. May be out of date — verify against current code/APIs when making implementation decisions.*
