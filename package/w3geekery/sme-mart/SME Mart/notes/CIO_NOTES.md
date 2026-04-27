# CIO Notes (Kevin McCarthy)

Notes from conversations with Kevin about platform architecture and SME Mart alignment.

## 2026-03-06 — Project Entity & Taxonomy

Context: Clark checking in about upcoming Project entity, Brian's directive to drop "Proposal" and use "Project" instead.

### Kevin's Key Points

**Ownership model:**
- Owner is a **principal**: org, user, etc.
- Projects can be in a boundary or not
- Vendors may or may not have orgs

**Project entity (platform definition):**
- Project may or may not be a proposal
- Platform definition will be **"a bunch of related resources"** that can include:
  - Boards
  - Timelines
  - Files
  - Calendar events
  - etc.

**Identity & access:**
- Vendors don't log in to the platform. **Orgs do.**
- And **people** do.

**Platform realization mapping:**

| SME Mart Concept | Realized in Platform as |
|------------------|------------------------|
| Service/product offering (catalog) | **Boundary** |
| Vendor | **Org** |

> "A service/product offering in the catalog is realized in the platform by a Boundary the same way a vendor is realized by an Org"

### Implications for SME Mart

1. **Project is a platform-level concept** — not SME Mart-specific. It's a container for related resources. SME Mart's "Project" (scoped work under an Engagement) will map to the platform Project entity when available.

2. **Boundary = offering** — each service/product listing in the marketplace corresponds to a ZB Boundary. This is how access control and scoping works.

3. **Org = vendor** — vendor identity is an Org in the platform. Vendors authenticate as Org members, not as a special "vendor" role.

4. **Principal-based ownership** — don't hardcode "vendor owns project". The owner is a principal (could be org, could be user). Keep the model flexible.

## 2026-03-27 — GQL Entities vs Resources (Messaging)

Context: Clark asking about SmeMartMessage GQL entity for messaging center (Plan 065). Multi-level: Org, Engagement, Project, Task.

### Kevin's Key Points

**GQL entities are NOT resources:**
- GQL entities are available to queries but not to platform UI (Tasks, Board, etc.)
- They work fine for SME Mart's custom screens
- "The stuff that hits my radar is when we make things resources — that is what makes something part of the platform"

**Custom/extensible resources:**
- Kevin suggested a **custom/extensible resource** type would work better
- This would make messages "part of the platform" — visible in Tasks, searchable, linkable
- Not available yet — future platform feature

**Attachments:**
- Message attachments would be scoped at the same level as the dialog (Org, Engagement, Project, Task)
- Similar to Task Comments with attachments

### Decision

- **For now:** Build SmeMartMessage as GQL entity. Works for custom screens, fastest path.
- **Future:** When Kevin ships extensible resources, migrate messages to that. The GQL entity structure (content, visibility, threading) maps cleanly to a resource model.
- **Action:** Clark to write up a feature request for custom/extensible resource type.
