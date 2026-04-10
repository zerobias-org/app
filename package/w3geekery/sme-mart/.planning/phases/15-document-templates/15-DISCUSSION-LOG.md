# Phase 15: Document Templates - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-10
**Phase:** 15-document-templates
**Areas discussed:** Template management UI, Instantiation workflow, Preview & variable insertion, Document listing on RFP

---

## Pre-Discussion Clarification: Template Scopes

Before gray area discussion began, user asked whether templates need multiple scopes (engagement, project, notes).

**User's question:** "Would we need templates in multiple scopes i.e. engagement, project, notes?"

| Option | Description | Selected |
|--------|-------------|----------|
| Engagement + Project | Templates instantiate as engagement docs (required engagementId, optional projectId). Research design. | |
| Engagement + Project + Notes | Templates can also instantiate as Notes within Note/NoteFolder hierarchy. Adds complexity but unifies content. | ✓ |
| Just Engagement | Simplest. Templates only at engagement level. | |

**User's choice:** Engagement + Project + Notes
**Notes:** This expanded the scope from the original research design (engagement-only) to three instantiation targets.

---

## Template Management UI

### Template Library Location

| Option | Description | Selected |
|--------|-------------|----------|
| Tab on /org page | "Document Templates" tab alongside org settings. Org-level management. | |
| Standalone /templates route | Dedicated top-level page with nav entry. More room for editor. | |
| Both — tab + dedicated editor page | List as tab on /org, clicking opens /templates/:id editor page. | ✓ |

**User's choice:** Both — tab + dedicated editor page
**Notes:** List on /org for management, full editor page at /templates/:id for editing.

### List Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Cards | Card per template with name, type chip, status, var count, last edited. | ✓ |
| Table | ZbCustomizableTable with sortable columns. Better for many templates. | |

**User's choice:** Cards

### Template Statuses

| Option | Description | Selected |
|--------|-------------|----------|
| Draft → Published → Archived | Three-state. Only Published in pickers. Archived preserves. | ✓ |
| Draft → Published only | Simpler. Delete instead of archive. | |

**User's choice:** Draft → Published → Archived

---

## Instantiation Workflow

### Instantiation UX

| Option | Description | Selected |
|--------|-------------|----------|
| Chooser dialog | "Add from Template" opens dialog, pick template, fill vars, create. | ✓ |
| Inline panel | Template picker inline on documents tab. No dialog. | |
| Stepper wizard | Multi-step: choose, fill, preview, confirm. | |

**User's choice:** Chooser dialog

### Notes Integration

| Option | Description | Selected |
|--------|-------------|----------|
| Same dialog, different context | "New from Template" in notes opens same chooser. Creates DocumentInstance + Note. | ✓ |
| Template as note type | Just create Note with resolved content. No DocumentInstance. | |

**User's choice:** Same dialog, different context

### Duplicate Prevention

| Option | Description | Selected |
|--------|-------------|----------|
| Warn but allow | Warning: "Already instantiated. Create another?" Flexible. | ✓ |
| Block duplicates | Strict one-per-template-per-scope. | |

**User's choice:** Warn but allow

### Notes Storage Model

| Option | Description | Selected |
|--------|-------------|----------|
| DocumentInstance + Note | DocumentInstance (audit trail) + Note (content). Both created. | ✓ |
| Plain Note only | Just Note with resolved content. Loses template provenance. | |

**User's choice:** DocumentInstance + Note

### Editability

| Option | Description | Selected |
|--------|-------------|----------|
| Editable | Buyer can edit resolved markdown. Instance is starting point. | |
| Sealed snapshot | Content locked. Delete and re-instantiate for changes. | |
| Editable with diff tracking | Buyer can edit, changes tracked against original. | ✓ |

**User's choice:** Editable with diff tracking

### Diff Tracking Model

| Option | Description | Selected |
|--------|-------------|----------|
| Original + current | Two fields, compute diff on demand. Simple. | |
| Edit history log | Separate records per edit with timestamp/author. Full audit trail. | ✓ |

**User's choice:** Edit history log

### Notes UI Integration

| Option | Description | Selected |
|--------|-------------|----------|
| Split button menu | "New Note" becomes split button. Default = blank note. Dropdown = "From Template". | ✓ |
| Second button | Separate "From Template" button next to "New Note". | |

**User's choice:** Split button menu

---

## Preview & Variable Insertion

### Variable Insertion Method

| Option | Description | Selected |
|--------|-------------|----------|
| Toolbar button + picker | "Insert Variable" toolbar button opens dropdown. | |
| Slash command | Type /var for inline autocomplete. | |
| Both toolbar + slash command | Toolbar for discoverability, slash for power users. | ✓ |

**User's choice:** Both toolbar + slash command

### Variable Display in Editor

| Option | Description | Selected |
|--------|-------------|----------|
| Styled chips | Colored inline chips like Notion mentions. Requires Milkdown plugin. | ✓ |
| Raw {{text}} | Literal {{varName}} in editor. Simpler. | |

**User's choice:** Styled chips

### Preview Mode

| Option | Description | Selected |
|--------|-------------|----------|
| Toggle button | Toggle in toolbar switches edit/preview. Sample variable values. | ✓ |
| Side-by-side split | Editor left, live preview right. Always visible. | |
| Preview dialog | Separate dialog for preview. | |

**User's choice:** Toggle button

### Custom Variable Management

| Option | Description | Selected |
|--------|-------------|----------|
| Variables panel on editor page | Side panel with built-in (read-only) + custom vars (CRUD). | ✓ |
| Dialog from toolbar | "Manage Variables" button opens modal dialog. | |
| Inline definition | First use of unknown var prompts definition. | |

**User's choice:** Variables panel on editor page

### Preview Sample Data

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-generated samples | Realistic fake data for built-in, label/default for custom. Zero config. | ✓ |
| Admin fills sample values | Editable fields for each var. More work for admin. | |

**User's choice:** Auto-generated samples

### Slash Command Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Single list, grouped | One autocomplete with "Built-in" and "Custom" section headers. | ✓ |
| Separate commands | /builtin and /custom as distinct commands. | |

**User's choice:** Single list, grouped

---

## Document Listing on RFP

### Listing Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Mixed list on Documents tab | File uploads + template instances together. Distinct icons. | ✓ |
| Separate sections | Split into "Uploaded Files" and "Template Documents". | |
| Separate tab | New "Template Documents" tab. | |

**User's choice:** Mixed list on Documents tab

### Document View on Click

| Option | Description | Selected |
|--------|-------------|----------|
| Inline rendered markdown | Expands inline/panel with rendered HTML. Edit button. "Modified" indicator. | ✓ |
| Full-page editor route | Navigate to /documents/:id. Leaves engagement context. | |
| Read-only dialog | Dialog with rendered markdown. Edit in dialog. | |

**User's choice:** Inline rendered markdown

### Share Visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Same controls as uploads | all/buyer_only/provider_only. Consistent. | ✓ |
| Always visible to all | Simpler but less flexible. | |

**User's choice:** Same controls as uploads

---

## Claude's Discretion

- Milkdown variable chip plugin approach (build custom or extend existing)
- Notes folder integration details
- Edit history entity design
- Card layout details for template list
- "Modified from template" diff display format

## Deferred Ideas

None — discussion stayed within phase scope.
