---
phase: 15-document-templates
type: research
status: complete
created: 2026-04-08
---

# Phase 15 Research: Template Variable Substitution

## Problem Statement

Org admins need reusable document templates (MSA, NDA, SOW) with placeholder variables that auto-fill when buyers instantiate them per-engagement. The ROADMAP flags this as **NEEDS RESEARCH** before execution.

Key design decisions:
1. Variable syntax (delimiters)
2. Available variables (registry)
3. Escaping (literal delimiters in content)
4. Missing variable behavior
5. Content format and editor
6. Storage model

---

## Decision 1: Variable Syntax

### Options Evaluated

| Syntax | Pros | Cons |
|--------|------|------|
| `{{varName}}` (Handlebars-style) | Universally recognized, zero learning curve, used by Mustache/Handlebars/Liquid/Hugo | Conflict risk with content containing `{{` (rare in legal docs) |
| `${varName}` (ES6-style) | Familiar to developers | Conflicts with shell scripts, code snippets in SOW docs |
| `[%varName%]` | No natural language collision | Obscure, unfamiliar |
| `<<varName>>` | Visually distinct | Conflicts with HTML, XML content |

### Decision: `{{variableName}}`

- **Handlebars/Mustache double-curly is the industry standard** for non-developer-facing template systems.
- Legal/compliance documents virtually never contain `{{` naturally.
- Markdown editors (Milkdown) pass `{{` through as literal text — no rendering conflict.
- Aligns with how Notion, Docusign, PandaDoc, and similar tools handle template variables.
- CamelCase variable names: `{{buyerOrgName}}`, `{{engagementTitle}}`, `{{effectiveDate}}`

---

## Decision 2: Variable Registry

### Built-in Variables (auto-populated from engagement context)

| Variable | Source | Example Value |
|----------|--------|---------------|
| `{{buyerOrgName}}` | Engagement buyer org display name | "Acme Corp" |
| `{{vendorOrgName}}` | Engagement vendor org display name | "CyberSec Partners" |
| `{{engagementTitle}}` | Engagement name | "2026 SOC2 Assessment" |
| `{{engagementId}}` | Engagement UUID | "a1b2c3..." |
| `{{projectName}}` | Project name (if scoped to project) | "Phase 1 Audit" |
| `{{projectId}}` | Project UUID | "d4e5f6..." |
| `{{effectiveDate}}` | Template instantiation date | "April 8, 2026" |
| `{{expirationDate}}` | Engagement end date (if set) | "December 31, 2026" |
| `{{todayDate}}` | Current date at render time | "April 8, 2026" |

### Custom Variables (org-defined)

Templates can also define **custom variables** with:
- `name`: variable identifier (camelCase, alphanumeric + underscores)
- `label`: human-readable prompt ("Company Registration Number")
- `type`: `text` | `date` | `number`
- `required`: boolean
- `defaultValue`: optional fallback

Custom variables appear as a fill-in form when the buyer instantiates the template. This enables templates like:

```
This Master Services Agreement is entered into by {{buyerOrgName}}
("Client") and {{vendorOrgName}} ("Provider") on {{effectiveDate}}.

Client Registration: {{clientRegistrationNumber}}
Provider Registration: {{providerRegistrationNumber}}
```

Where `clientRegistrationNumber` and `providerRegistrationNumber` are custom variables prompted at instantiation.

### Variable Name Constraints

- **Pattern:** `[a-zA-Z][a-zA-Z0-9_]*` (starts with letter, alphanumeric + underscore)
- **Convention:** camelCase for built-in, camelCase for custom
- **Reserved prefix:** `sme_` reserved for future system variables
- **Max length:** 64 characters

---

## Decision 3: Escaping Rules

### Problem

A template author writes: "Use {{curly braces}} for emphasis" — the system shouldn't try to resolve `curly braces` as a variable.

### Decision: Backslash escape

- `\{{` renders as literal `{{` in output
- `\}}` renders as literal `}}`
- Example: `Use \{{curly braces\}}` → `Use {{curly braces}}`

### Why not alternatives?

- **HTML entities (`&#123;&#123;`)** — breaks markdown readability
- **Raw blocks (`{{{raw}}}...{{{/raw}}}`)** — over-engineered for this use case
- **Tripled delimiters (`{{{literal}}}`)** — Handlebars uses this for unescaped HTML, confusing

### Implementation

Simple regex with negative lookbehind:

```typescript
const VARIABLE_PATTERN = /(?<!\\)\{\{([a-zA-Z][a-zA-Z0-9_]*)\}\}/g;

function substitute(template: string, variables: Record<string, string>): string {
  return template
    .replace(VARIABLE_PATTERN, (match, varName) => variables[varName] ?? match)
    .replace(/\\(\{\{|\}\})/g, '$1'); // Unescape
}
```

---

## Decision 4: Missing Variable Behavior

### Options

| Behavior | Pros | Cons |
|----------|------|------|
| Keep placeholder `{{varName}}` | Obvious what's missing | Unprofessional in final doc |
| Replace with blank | Clean output | Silent data loss |
| Replace with `[MISSING: varName]` | Visible but distinct | Ugly in final doc |
| Block instantiation | Prevents incomplete docs | Frustrating for optional vars |

### Decision: Two-tier approach

1. **Required variables** (built-in + custom marked `required: true`): Block instantiation. Show validation errors listing missing values. Buyer must fill all required fields before creating the document instance.

2. **Optional variables** (custom marked `required: false`): Replace with `defaultValue` if set, otherwise replace with empty string. Preview shows `[optional: varName]` placeholder so buyer sees what's unfilled.

This ensures no half-filled documents go out while allowing flexibility for optional fields.

---

## Decision 5: Content Format

### Decision: Markdown (stored as string, edited with Milkdown Crepe)

- **Milkdown Crepe editor already exists** in the app (`markdown-editor.component.ts`)
- Markdown serializes to a string → easy to store in a GQL text field
- Variable placeholders render as literal text in the editor (no conflict)
- Preview mode renders markdown → HTML with variables substituted
- Export to PDF possible via markdown-to-PDF libraries (future)

### Content Flow

```
Org Admin writes template (Milkdown) → markdown string with {{variables}}
                                         ↓
Buyer instantiates → fills custom variables → substitution engine runs
                                         ↓
Instance document stored as rendered markdown (variables resolved)
                                         ↓
Preview renders markdown → HTML for display
```

Templates store raw markdown with `{{placeholders}}`. Instances store resolved markdown (variables already substituted). This means instances are snapshot copies — changing the template doesn't affect existing instances.

---

## Decision 6: Storage Model

### New GQL Schema Entities

**DocumentTemplate** (org-level, reusable)
```yaml
# Schema class: DocumentTemplate
fields:
  - name             # "Master Services Agreement v2"
  - description      # "Standard MSA for compliance engagements"
  - documentType     # 'msa' | 'nda' | 'sow' | 'compliance' | 'other'
  - content          # Raw markdown with {{variable}} placeholders
  - variableSchema   # JSON string: array of custom variable definitions
  - version          # Integer, incremented on edit
  - status           # 'draft' | 'published' | 'archived'
  - orgId            # Owner org
  - createdBy        # Principal who created
links:
  - linkTo: (none — org-scoped, no parent entity)
```

**DocumentInstance** (engagement-scoped, instantiated copy)
```yaml
# Schema class: DocumentInstance
fields:
  - name             # Copied from template, can be edited
  - description      # Copied from template
  - documentType     # Copied from template
  - content          # Resolved markdown (variables substituted)
  - templateId       # UUID of source DocumentTemplate
  - templateVersion  # Version at time of instantiation
  - variableValues   # JSON string: Record<string, string> of filled values
  - engagementId     # Scoped to engagement
  - projectId        # Optional: scoped to project within engagement
  - status           # 'draft' | 'final' | 'signed'
links:
  - linkTo: SmeMartProject.id.documentInstances (if project-scoped)
```

### Why two entities, not one?

- Templates are org-level, reusable across engagements
- Instances are engagement-scoped, contain resolved content
- Editing a template doesn't retroactively change existing instances (snapshot semantics)
- Duplicate prevention: query `DocumentInstance WHERE templateId = X AND engagementId = Y`

### Relation to existing OrgDocument

OrgDocument = **file uploads** (PDFs, Word docs via S3).
DocumentTemplate = **content templates** (markdown with variables, stored in GQL).

These are separate concerns. An OrgDocument is a binary file; a DocumentTemplate is structured text content. No migration or overlap needed.

---

## Summary of Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Syntax | `{{variableName}}` | Industry standard, no conflict with legal docs |
| Variables | 9 built-in + custom variable schema | Covers common fields, extensible |
| Escaping | `\{{` for literal curly braces | Simple, regex-friendly |
| Missing vars | Block required, blank optional | Prevents incomplete docs |
| Content format | Markdown (Milkdown Crepe editor) | Already in app, string-serializable |
| Storage | Two GQL entities: DocumentTemplate + DocumentInstance | Org-level reuse + engagement-scoped snapshots |

---

## Implementation Implications

1. **Schema PR needed** (like Phase 14): Two new YAML classes in `zerobias-org/schema`
2. **Substitution is pure TypeScript** — no external templating library needed. ~30 lines of code.
3. **Milkdown editor reused** — no new editor component. Add "Insert Variable" toolbar button.
4. **Variable picker component** — dropdown/autocomplete of available variables, inserts `{{varName}}` at cursor
5. **Preview component** — renders substituted markdown as HTML. Highlights unresolved optional vars.
6. **Duplicate prevention** — query before create, offer "reuse existing" if template already instantiated for this engagement.
