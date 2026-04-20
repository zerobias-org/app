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
