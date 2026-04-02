# Technology Stack: v1.2 RFP Packages & Pilot Projects

**Project:** SME Mart v1.2
**Researched:** 2026-04-02

## Recommended Stack (No Changes to v1.1)

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Angular | 21.1.4 | Frontend framework | Standalone components (v21 standard), proven in v1.0–1.1, no migration needed |
| TypeScript | 5.x | Language | Strict mode enabled, interfaces for all entity types |
| RxJS | 7.8+ | State management | Signals + BehaviorSubject, proven write-through cache pattern |
| Angular Material | 21.x | UI components | Tabs, form fields, dialogs, tables (coordinated with ngx-library) |

### Data Layer (NO CHANGES)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| ZerobiasClientApi | @zerobias-com/zerobias-angular-client ^1.1.23 | Platform SDK | Hydra client for Platform APIs, HubConnector for GQL |
| Pipeline | — | Data ingestion | AuditgraphDB Receiver Pipeline (fire-and-forget async writes) |
| GraphQL | — | Data querying | Direct GQL endpoint to AuditgraphDB (sync reads via schema package) |
| AuditgraphDB | — | Primary database | All 17 SME Mart entities + 4 new (Invitation, DocumentTemplate, FormBuilderConfig, FormSubmission) |

### UI Library (NO CHANGES)

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| @zerobias-org/ngx-library | 0.2.25 | Pre-built components | Panels, dialogs, tables, autocomplete, remote table, code editor |
| @angular/material | 21.x | Material components | Tabs, form fields, select, checkbox, date picker |

### Form Building (NEW)

| Technology | Version | Purpose | Approach |
|------------|---------|---------|----------|
| Angular Reactive Forms | Built-in | Form generation | DynamicFormComponent creates form controls from JSON Schema |
| JSON Schema validation | Lightweight custom | Server-side validation | Validate FormSubmission.submissionData on submission |

**Recommendation:** Implement custom DynamicFormComponent (not JSON Forms library) because:
- Simpler mental model (6 field types: text, number, select, checkbox, date, textarea)
- No external dependency (JSON Forms adds bundle bloat)
- Proven Angular Validators ecosystem
- Can expand field types in future phases iteratively

### File Storage (NO CHANGES)

| Service | Purpose | Why |
|---------|---------|-----|
| ZeroBias FileService SDK | Binary upload/download | Used by DocumentService for template binary storage |
| Neon HTTP connector | Database fallback | For org_documents table if needed (pending archival) |

### Development & Testing (NO CHANGES)

| Tool | Version | Purpose |
|------|---------|---------|
| ng (Angular CLI) | 21.x | Build, serve, test |
| Karma | Built-in | Test runner |
| Jasmine | Built-in | Unit test framework |
| Chrome DevTools MCP | Latest | E2E debugging (via Clark's setup) |

## Installation & Configuration

### Core Dependencies (Already Installed)

```bash
# Framework
npm install @angular/core@21.1.4 @angular/common@21.1.4 \
  @angular/forms@21.1.4 @angular/router@21.1.4

# UI
npm install @angular/material@21.x @zerobias-org/ngx-library@0.2.25

# Platform
npm install @zerobias-com/zerobias-angular-client@^1.1.23 \
  @zerobias-com/zerobias-client @zerobias-com/fileservice-sdk \
  @zerobias-com/platform-sdk

# State
npm install rxjs@7.8+
```

### No New Dependencies Needed

All technologies required for v1.2 are already in package.json:
- Angular 21 (framework)
- RxJS (state management)
- Angular Material (UI)
- @zerobias-org/ngx-library (pre-built components)
- ZerobiasClientApi (platform SDK)

**Why:** All services follow existing PipelineWriteService + GraphqlReadService pattern. No new libraries required.

## Environment Variables

**Existing (no changes needed):**
- `pipelineId` — Receiver Pipeline 091d5068-...
- `zerobiasOrgId` — W3Geekery org ID (UAT environment)
- `authMode` — mock | proxy | production (dev uses mock)

**New configuration (if needed):**
- `formValidationStrategy` — 'client-only' (Phase 16 default) or 'client-and-server' (future)
- `templateVariableSyntax` — '{{varName}}' (hardcoded, not configurable)

## Build Configuration

### No Changes Required

- `ng build --configuration vercel` — Temporary Vercel deployment (builds as-is)
- `ng test` — Existing test runner (add tests for new services/components)
- `ng serve` — Dev server points to UAT environment (existing)

## Schema & Code Generation

### Schema (New Classes Only)

**Pre-phase 16:** Create 4 new entity classes in zerobias-org/schema:
- Invitation.yml
- DocumentTemplate.yml
- FormBuilderConfig.yml
- FormSubmission.yml

**Post-merge:** Update SME Mart field-mappings.ts with new entity mappings.

### No Code Generation Needed

Unlike zerobias-org/schema services that use util-codegen, SME Mart services are hand-written:
- Field mappings are declarative constants
- GQL queries are hand-written (no codegen)
- Services follow simple CRUD patterns

## Version Pinning

**Critical for consistency:**
- Angular 21.1.4 (no alpha/RC versions)
- @zerobias-org/ngx-library 0.2.25 (pinned, not ^)
- @zerobias-com/zerobias-angular-client ^1.1.23+ (allow patch updates)

## Security Considerations

- **No API keys in client code** — All auth via ZerobiasClientApi (session-based)
- **Input validation** — FormSubmission.submissionData validated server-side (JSON Schema)
- **Authorization gates** — BidsService checks InvitationService.canBidOnProject()

## Performance Notes

- **Form rendering:** DynamicFormComponent uses Angular change detection (OnPush recommended for large forms)
- **JSON Schema parsing:** No runtime schema compilation (schema loaded once at init)
- **Template instantiation:** Async via Pipeline (5–10s latency acceptable)

## CI/CD (Vercel Temporary)

### Existing Pipeline

- Branch: `poc/sme-mart` auto-deploys to Vercel on push
- Environment variables set in Vercel dashboard
- No changes needed for v1.2

### Future (Platform Publishing)

When ZeroBias platform publishing is ready, migrate from Vercel to ZeroBias infrastructure (no stack changes).

## Browser Support

- Chrome 90+ (primary — DevTools MCP compatibility)
- Safari 15+ (supported)
- Firefox 88+ (supported)
- Edge 90+ (supported)

## Alternatives NOT Recommended

| Technology | Why Not |
|------------|---------|
| JSON Forms library | Adds external dependency, more complexity than needed for v1.2 |
| Formio.io | Overkill for SME Mart use case, expensive, vendor lock-in |
| SurveyJS | Similar to Formio, too heavy |
| Nx workspace | SME Mart explicitly uses plain Angular CLI (no Nx) |
| Neon direct access | Only for existing legacy services (v1.2 uses Pipeline+GQL only) |
| Custom state management (NgRx, Akita) | Signals + RxJS sufficient, proven in v1.0–1.1 |

## Sources

- **Angular 21 docs:** Official Angular documentation (21.angular.io)
- **Material 21:** Official Material documentation
- **Existing codebase:** package.json versions, angular.json configuration
- **Form builder patterns:** [Angular JSON Schema Forms](https://angular.love/building-dynamic-forms-in-angular-using-json-schema-and-signals/)

---

**Created:** 2026-04-02
**Recommendation:** No stack changes required. All needed technologies already in place.
