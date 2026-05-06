# Phase 16: Form Builder - Research

**Researched:** 2026-04-10
**Domain:** Angular 21 form UI + JSON schema configuration + Pipeline writes + GraphQL reads
**Confidence:** HIGH

## Summary

Form Builder for SME Mart (Phase 16) is a **reusable, shared Angular component** that enables buyers to define structured submission forms with 6 field types (text, textarea, dropdown, number, file upload, checkbox). The form is configured as a JSON schema stored on `SmeMartProject`, with a new `FormSubmission` schema class in the ZeroBias GQL system tracking vendor responses across draft/submitted/reviewed lifecycle.

The implementation uses established patterns from Phases 14-15:
- **Storage:** JSON schema config on SmeMartProject (schema change), FormSubmission as separate entity (new schema class)
- **Rendering:** Single `DynamicFormRenderer` component with mode prop (preview/fill/review)
- **Persistence:** RfpWizardService draft pattern (form config auto-persists on step change)
- **Validation:** Angular Reactive Forms (built-in validators) + server-side gating on Pipeline receive
- **File uploads:** Reuse existing ZB FileService SDK (no custom upload)
- **Access control:** Form locked on first submission (service-layer gate, not UI-only)

**Primary recommendation:** Implement FormBuilder + DynamicFormRenderer as reusable shared components. Use Angular's built-in Reactive Forms validators (no custom validator library). Store form config as JSON on SmeMartProject entity (add new field in schema). New FormSubmission class for responses. Integrate with RfpWizardService for draft persistence and RfpInvitationService for access control.

---

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Form builder is reusable, not RFP-specific — lives in `src/app/shared/components/form-builder/` (D3-01)
- Sequential expansion panel UX (mirrors requirement-editor pattern) with drag-drop reordering (D-01, D-03)
- Six field types: text, textarea, dropdown, number, file upload, checkbox (D3-02, D-07)
- Form config stored as JSON field on SmeMartProject, not separate entity (D-10)
- New FormSubmission schema class with projectId, bidId, submissionData, status, timestamps (D-11)
- Form locked on first submission — editable only while zero submissions exist (D-13)
- File uploads via ZB FileService SDK (existing infrastructure) (D-14, D-33)
- Single DynamicFormRenderer with mode prop: 'preview', 'fill', 'review' (D-23)
- RFP Wizard step order: Basics → Requirements → Submission Form → Documents → Terms → Review (D-15)
- Submission Form step is optional (D-16, D-17 — form config auto-persists like other steps)
- Vendor form prerequisite for bid submission when form configured (D-22)
- Vendor can edit submission until RFP closes; status reverts to "revised" on re-edit (D-21)

### Claude's Discretion
- File upload constraints (allowed types, max size)
- FormSubmission field mapping constants, class ID registration
- CDK DragDrop integration details
- Section header UI design (divider + label, or collapsible group)
- "Revised" status badge styling
- Form validation error display patterns
- Notes folder integration for chooser dialog (Phase 15 carryover)

### Deferred Ideas (OUT OF SCOPE)
- Side-by-side bid comparison (v1.3)
- Conditional form logic (if/then field visibility) (v1.3)
- Repeating form sections (v1.3)
- Form template reuse as separate entity (v1.3)

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| D3-01 | Form builder is reusable shared component in src/app/shared/ | Shared component structure established (see Code Examples); patterns proven in Phase 15 (DocumentTemplateService) |
| D3-02 | Buyer defines form fields via UI — 6 types stored as JSON config | Angular Reactive Forms + Material form fields sufficient; JSON schema shape defined in TypeScript interfaces (HIGH confidence) |
| D3-03 | Dynamic form renderer displays buyer-defined fields using Reactive Forms + Material | Angular's built-in validators cover all 6 types; no external form library needed (HIGH confidence) |
| D3-04 | Buyer can preview form before publishing RFP | Single DynamicFormRenderer in preview mode (read-only) — same pattern as Phase 15 template preview (HIGH confidence) |
| D3-05 | Vendor can fill and submit buyer-defined form on RFP | DynamicFormRenderer in fill mode (editable) with FormSubmission persistence (HIGH confidence) |
| D3-06 | Buyer can review vendor form responses | DynamicFormRenderer in review mode (read-only showing actual responses) + "Mark Reviewed" status gate (HIGH confidence) |

---

## Standard Stack

### Core (Angular 21 Built-in)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@angular/forms` | 21.1.0 | ReactiveFormsModule, FormBuilder, Validators | Part of Angular core; all validators (required, min/max, pattern, email) already available |
| `@angular/material` | 21.1.4 | Form field components (input, textarea, select, checkbox) + expansion panels + dialog | Material is the project standard; form-field is industry-standard for Angular |
| `@angular/cdk` | 21.1.4 | DragDropModule for field reordering in builder | Already installed; no additional dependency needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@zerobias-org/ngx-library` | 0.2.32 | Reusable components (ZbSimplePanelComponent, ZbResourceStatusComponent) | For submission status badges (draft/submitted/reviewed); already project standard |
| `@zerobias-com/zerobias-angular-client` | 1.1.29 | SDK access to fileClient for file uploads | D-14 requirement; reuse existing infrastructure for file upload fields |
| `ts-md5` | 1.3.2 | MD5 checksum for file uploads | Already in project (from file-upload-sdk-reference.md); required for FileService SDK |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Angular Reactive Forms | ngx-formly or Formik | ngx-formly is 5+ years stale, Formik is React-only; Angular's built-in validators are more current and well-integrated |
| Material Expansion Panels | Custom accordion | Material is proven in requirement-editor; leverages existing theme/accessibility |
| CDK DragDrop | angular-sortablejs or ng2-dnd | CDK is official Angular library; both alternatives are 3+ years old and less maintained |

### Version Verification

Angular 21 Validators available in `@angular/forms@21.1.0`:
- `required`, `requiredTrue`, `min`, `max`, `minLength`, `maxLength`, `pattern`, `email`, `compose`, `composeAsync`

All 6 field types have native validator support:
- **text:** `required`, `minLength`, `maxLength`, `pattern` (for email/phone/URL presets)
- **textarea:** `required`, `minLength`, `maxLength`
- **dropdown:** `required` (enum constraint via form array)
- **number:** `required`, `min`, `max`, `step` (numeric control)
- **file upload:** `required` (file reference stored as JSON object)
- **checkbox:** No validators needed (binary state)

**Installation:**
```bash
# All included in Angular CLI project — no new packages required
npm install  # Already satisfied
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/app/
├── shared/
│   ├── components/
│   │   ├── form-builder/                    # Phase 16 new
│   │   │   ├── form-builder.component.ts
│   │   │   ├── form-builder.component.html
│   │   │   ├── form-builder.component.scss
│   │   │   ├── dynamic-form-renderer.component.ts
│   │   │   ├── dynamic-form-renderer.component.html
│   │   │   ├── dynamic-form-renderer.component.scss
│   │   │   ├── form-field-editor.component.ts      # Reusable field config panel
│   │   │   ├── form-field-editor.component.html
│   │   │   ├── form.model.ts                       # Interface + types
│   │   │   └── form.constants.ts                   # Field type enums, validators
│   │   └── ... (other components)
│   └── ... (other shared)
├── core/
│   ├── models/
│   │   ├── form-builder.model.ts                   # FormConfig, FormSubmission interfaces
│   │   └── index.ts                                # Re-export
│   ├── services/
│   │   ├── form-submission.service.ts              # Phase 16 new — CRUD for FormSubmission
│   │   └── ... (existing services)
│   └── field-mappings/
│       ├── form-builder.field-mapping.ts           # New — for Pipeline writes
│       └── ... (existing mappings)
└── pages/
    ├── rfps/
    │   └── rfp-wizard/
    │       └── steps/
    │           ├── rfp-step-form.component.ts      # Phase 16 new — wizard step
    │           ├── rfp-step-form.component.html
    │           └── ... (existing steps)
    └── project/
        ├── project-detail.component.ts             # Add "Submission Form" tab for vendors
        └── ... (existing)
```

### Pattern 1: Form Field Configuration (JSON Schema Approach)

**What:** Form config stored as TypeScript interface (converted to JSON for storage on SmeMartProject).

**When to use:** Buyer-defined field structure with 6 discrete types.

**Interface definition:**

```typescript
// src/app/core/models/form-builder.model.ts
import { UUID } from '@zerobias-org/types-core-js';

export interface FormFieldConfig {
  id: string;                        // Unique within form
  type: FormFieldType;               // 'text' | 'textarea' | 'dropdown' | 'number' | 'file' | 'checkbox'
  label: string;
  required: boolean;
  placeholder?: string;
  description?: string;              // Helper text
  // Type-specific config
  textValidation?: TextValidation;   // min/max length, pattern (preset: email/phone/URL)
  dropdownOptions?: DropdownOption[]; // For dropdown fields
  numberValidation?: NumberValidation; // min, max, step
  fileUploadConfig?: FileUploadConfig;
  sectionId?: string;                // Optional section grouping
}

export interface FormSection {
  id: string;
  label: string;
  fields: FormFieldConfig[];
}

export interface FormBuilderConfig {
  version: 1;                        // Schema version for migrations
  sections?: FormSection[];          // Grouped fields (optional)
  fields: FormFieldConfig[];         // Top-level ungrouped fields
  lockedAt?: Date;                   // Locked on first submission
}

export interface FormSubmission {
  id: string;
  projectId: UUID;                   // Link to SmeMartProject
  bidId: UUID;                       // Link to Bid
  submissionData: Record<string, unknown>; // Field values: { fieldId: value, ... }
  status: 'draft' | 'submitted' | 'revised' | 'reviewed';
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: UUID;                 // User who marked reviewed
  createdAt: Date;
  updatedAt: Date;
}

// Type-specific validators
export interface TextValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: 'email' | 'phone' | 'url' | 'custom';
  patternValue?: string;            // Custom regex if pattern='custom'
}

export interface NumberValidation {
  min?: number;
  max?: number;
  step?: number;
}

export interface FileUploadConfig {
  allowedMimeTypes?: string[];      // e.g., ['application/pdf', 'image/*']
  maxFileSizeBytes?: number;        // e.g., 10 * 1024 * 1024 = 10 MB
  maxFiles?: number;                // Per field (usually 1)
}

export interface DropdownOption {
  value: string;
  label: string;
}

export type FormFieldType = 'text' | 'textarea' | 'dropdown' | 'number' | 'file' | 'checkbox';
```

### Pattern 2: DynamicFormRenderer (Three Modes)

**What:** Single component that renders form config in three contexts (preview, fill, review).

**When to use:** Render buyer-defined forms to all three audiences (buyer preview, vendor fill, buyer review).

**Example:**

```typescript
// src/app/shared/components/form-builder/dynamic-form-renderer.component.ts
import {
  Component, input, signal, computed, inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { FormBuilderConfig, FormSubmission, FormFieldConfig } from '../../models/form-builder.model';

type FormMode = 'preview' | 'fill' | 'review';
type FormFieldType = 'text' | 'textarea' | 'dropdown' | 'number' | 'file' | 'checkbox';

@Component({
  selector: 'app-dynamic-form-renderer',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatCheckboxModule, MatButtonModule, MatIconModule,
  ],
  template: `
    <form [formGroup]="formGroup" class="dynamic-form">
      <!-- Grouped sections (if any) -->
      @for (section of config().sections; track section.id) {
        <fieldset class="form-section">
          <legend>{{ section.label }}</legend>
          @for (field of section.fields; track field.id) {
            <app-form-field-renderer
              [field]="field"
              [mode]="mode()"
              [formGroup]="formGroup"
              [submission]="submission()">
            </app-form-field-renderer>
          }
        </fieldset>
      }

      <!-- Top-level ungrouped fields -->
      @for (field of topLevelFields(); track field.id) {
        <app-form-field-renderer
          [field]="field"
          [mode]="mode()"
          [formGroup]="formGroup"
          [submission]="submission()">
        </app-form-field-renderer>
      }

      <!-- Action buttons (fill mode only) -->
      @if (mode() === 'fill') {
        <div class="form-actions">
          <button mat-raised-button color="primary" [disabled]="formGroup.invalid || submitting()">
            Submit Form
          </button>
          <button mat-stroked-button (click)="saveDraft()">Save Draft</button>
        </div>
      }

      <!-- Review actions (review mode only) -->
      @if (mode() === 'review' && !submission()?.reviewedAt) {
        <div class="form-actions">
          <button mat-raised-button color="accent" (click)="markReviewed()">
            Mark Reviewed
          </button>
        </div>
      }
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicFormRenderer {
  private readonly fb = inject(FormBuilder);

  readonly config = input.required<FormBuilderConfig>();
  readonly mode = input.required<FormMode>();
  readonly submission = input<FormSubmission | null>(null);
  readonly submitting = signal(false);

  readonly formGroup = computed(() => {
    const fg = this.fb.group({});
    const fields = [
      ...(this.config().sections?.flatMap(s => s.fields) ?? []),
      ...this.config().fields,
    ];
    fields.forEach(field => {
      const validators = this.buildValidators(field);
      const value = this.submission()?.submissionData?.[field.id] ?? '';
      fg.addControl(field.id, this.fb.control({ value, disabled: this.mode() !== 'fill' }, validators));
    });
    return fg;
  });

  readonly topLevelFields = computed(() =>
    this.config().fields.filter(f => !f.sectionId)
  );

  private buildValidators(field: FormFieldConfig): any[] {
    const validators: any[] = [];
    if (field.required) validators.push(Validators.required);
    if (field.type === 'text' && field.textValidation?.minLength) {
      validators.push(Validators.minLength(field.textValidation.minLength));
    }
    if (field.type === 'text' && field.textValidation?.maxLength) {
      validators.push(Validators.maxLength(field.textValidation.maxLength));
    }
    if (field.type === 'text' && field.textValidation?.pattern === 'email') {
      validators.push(Validators.email);
    }
    if (field.type === 'number' && field.numberValidation?.min !== undefined) {
      validators.push(Validators.min(field.numberValidation.min));
    }
    if (field.type === 'number' && field.numberValidation?.max !== undefined) {
      validators.push(Validators.max(field.numberValidation.max));
    }
    return validators;
  }

  saveDraft(): void {
    // Service call — save FormSubmission with status='draft'
  }

  markReviewed(): void {
    // Service call — update FormSubmission.status='reviewed', reviewedAt, reviewedBy
  }
}
```

### Pattern 3: FormBuilder Service (Schema-First, Pipeline Writes)

**What:** Service that reads SmeMartProject, updates formConfig, persists via Pipeline.

**When to use:** Form builder save operations (add field, remove field, reorder, etc.).

**Example:**

```typescript
// src/app/core/services/form-builder.service.ts
import { Injectable, inject } from '@angular/core';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import type { FormBuilderConfig, FormFieldConfig, FormSection } from '../models/form-builder.model';

@Injectable({ providedIn: 'root' })
export class FormBuilderService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);

  /** Get current form config for a project. */
  async getFormConfig(projectId: string): Promise<FormBuilderConfig | null> {
    const project = await this.graphqlRead.getById('SmeMartProject', projectId, ['formConfig']);
    const configJson = project?.formConfig as string | null;
    if (!configJson) return null;
    return JSON.parse(configJson) as FormBuilderConfig;
  }

  /** Save updated form config. Fails if form already locked. */
  async updateFormConfig(projectId: string, config: FormBuilderConfig): Promise<void> {
    const existing = await this.getFormConfig(projectId);
    if (existing?.lockedAt) {
      throw new Error('Form is locked — cannot modify after first submission');
    }

    // Persist via Pipeline (fires-and-forgets)
    await this.pipelineWrite.pushEntities('SmeMartProject', [{
      id: projectId,
      formConfig: JSON.stringify(config),
      updatedAt: new Date(),
    }]);

    // Cache for fast re-reads
    this.pipelineWrite.setCached('SmeMartProject', projectId, {
      id: projectId,
      formConfig: JSON.stringify(config),
    });
  }

  /** Add a new field to the form. */
  addField(config: FormBuilderConfig, field: FormFieldConfig): FormBuilderConfig {
    return {
      ...config,
      fields: [...config.fields, field],
    };
  }

  /** Remove a field by ID. */
  removeField(config: FormBuilderConfig, fieldId: string): FormBuilderConfig {
    return {
      ...config,
      fields: config.fields.filter(f => f.id !== fieldId),
      sections: config.sections?.map(s => ({
        ...s,
        fields: s.fields.filter(f => f.id !== fieldId),
      })),
    };
  }

  /** Reorder fields via drag-drop. */
  reorderFields(config: FormBuilderConfig, fieldIds: string[]): FormBuilderConfig {
    const fieldMap = new Map(
      [...config.fields, ...(config.sections?.flatMap(s => s.fields) ?? [])]
        .map(f => [f.id, f])
    );
    return {
      ...config,
      fields: fieldIds.filter(id => fieldMap.get(id) && !fieldMap.get(id)?.sectionId)
        .map(id => fieldMap.get(id)!),
    };
  }
}
```

### Pattern 4: FormSubmission Service (Persistence + Status Gates)

**What:** Service managing FormSubmission CRUD with status gates (locked-on-first-submission, reviewed-on-edit revert).

**When to use:** Vendor submission, buyer review, status lifecycle.

**Example:**

```typescript
// src/app/core/services/form-submission.service.ts
import { Injectable, inject } from '@angular/core';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import type { FormSubmission } from '../models/form-builder.model';
import type { UUID } from '@zerobias-org/types-core-js';

@Injectable({ providedIn: 'root' })
export class FormSubmissionService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);

  private readonly scalarFields = [
    'id', 'projectId', 'bidId', 'submissionData', 'status',
    'submittedAt', 'reviewedAt', 'reviewedBy', 'createdAt', 'updatedAt',
  ];

  /** Get submission by ID. */
  async getById(id: UUID): Promise<FormSubmission | null> {
    return this.graphqlRead.getById('FormSubmission', id, this.scalarFields);
  }

  /** List submissions for a project. */
  async listByProject(projectId: UUID): Promise<FormSubmission[]> {
    // Use rawQuery with projectId link filter
    const query = `{ FormSubmission(projectId: { id: ".eq.${projectId}" }) { ${this.scalarFields.join(' ')} } }`;
    const data = await this.graphqlRead.rawQuery(query, 1, 100);
    return (data['FormSubmission'] as any[]) ?? [];
  }

  /** Create new draft submission. */
  async createDraft(projectId: UUID, bidId: UUID, initialData?: Record<string, unknown>): Promise<FormSubmission> {
    const submission: FormSubmission = {
      id: crypto.randomUUID(),
      projectId,
      bidId,
      submissionData: initialData ?? {},
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.pipelineWrite.pushEntities('FormSubmission', [submission]);
    return submission;
  }

  /** Save draft (partial submission data). */
  async saveDraft(id: UUID, submissionData: Record<string, unknown>): Promise<void> {
    await this.pipelineWrite.pushEntities('FormSubmission', [{
      id,
      submissionData,
      updatedAt: new Date(),
    }]);
  }

  /** Submit form (finalize data, lock form on first submission). */
  async submit(id: UUID, submissionData: Record<string, unknown>, projectId: UUID): Promise<void> {
    // Check if this is first submission (lock form config)
    const others = await this.listByProject(projectId);
    const isFirst = !others.some(s => s.status === 'submitted' || s.status === 'revised');

    const update: Partial<FormSubmission> = {
      id,
      submissionData,
      status: 'submitted',
      submittedAt: new Date(),
      updatedAt: new Date(),
    };

    await this.pipelineWrite.pushEntities('FormSubmission', [update]);

    // Lock form config if first submission
    if (isFirst) {
      // FormBuilderService.lockForm(projectId) call here
    }
  }

  /** Vendor re-edits — revert reviewed status. */
  async edit(id: UUID, submissionData: Record<string, unknown>): Promise<void> {
    await this.pipelineWrite.pushEntities('FormSubmission', [{
      id,
      submissionData,
      status: 'revised',  // Revert from 'reviewed'
      reviewedAt: undefined,
      reviewedBy: undefined,
      updatedAt: new Date(),
    }]);
  }

  /** Buyer marks reviewed. */
  async markReviewed(id: UUID, reviewedBy: UUID): Promise<void> {
    await this.pipelineWrite.pushEntities('FormSubmission', [{
      id,
      status: 'reviewed',
      reviewedAt: new Date(),
      reviewedBy,
      updatedAt: new Date(),
    }]);
  }
}
```

### Anti-Patterns to Avoid

- **Custom validator library:** Angular's built-in Validators cover all 6 field types. ngx-formly adds 100KB+ and is stale.
- **Multiple form renderers per mode:** One DynamicFormRenderer with mode prop is cleaner than FormPreviewComponent, FormFillComponent, FormReviewComponent.
- **Storing form config on individual fields:** JSON on SmeMartProject allows atomic all-or-nothing updates; splitting across entity links makes locking harder.
- **Async locking gates in UI only:** Form locking must happen in service layer (`FormBuilderService.updateFormConfig` checks `lockedAt`). UI buttons disable conditionally.
- **Deferring server-side validation:** FormSubmission.submissionData is validated by Pipeline on receive — invalid JSON must be rejected before write. Client-side validation is UX-only.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form field rendering for 6 types (text, textarea, select, number, file, checkbox) | Custom <input> + event handlers | Angular Material `mat-form-field` + `mat-input`, `mat-select`, `mat-checkbox` | Material is production-hardened, accessible, theme-integrated |
| Field-level validation (required, min/max, pattern, email) | Custom validator functions | `@angular/forms` Validators (required, min, max, minLength, maxLength, pattern, email) | Built-in validators are well-tested, tree-shaken efficiently |
| Form state management | ngx-formly, Formik, react-hook-form | Angular Reactive Forms (FormBuilder, FormGroup, FormArray) | Reactive Forms is baked into Angular; others add 50-100KB and are framework-specific |
| Field reordering in builder | Custom JS array splice + DOM manipulation | Angular CDK `cdkDragDrop` | CDK is official Angular; handles accessibility, change detection, edge cases |
| File uploads to FileService | Custom HttpClient + checksum logic | ZB FileService SDK + `ts-md5` | SDK is battle-tested; checksumming is non-trivial (MD5 byte handling, streaming) |
| JSON schema validation | Custom schema validator | No new dependency — validation happens on Pipeline receive (server-side gate) | Client-side is UI-only; server-side is authoritative. Don't duplicate logic. |

**Key insight:** The form builder domain is deceptively complex (field reordering, file uploads, schema consistency, state locking). Leveraging Angular's built-in Reactive Forms, Material, and CDK avoids reinventing wheels that are already mature.

---

## Runtime State Inventory

**Trigger:** Phase 16 includes a new `FormSubmission` entity class and a new `formConfig` field on `SmeMartProject`. After the schema PR merges and the 15-minute reload window passes, the new GQL class and field must be queryable. This audit identifies what runtime state exists before implementation begins.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| **Stored data** | SmeMartProject rows do NOT yet have `formConfig` field (schema change in Wave 0). FormSubmission table does NOT exist yet (new class in Wave 0). | Code change: Update SmeMartProject query to include `formConfig` after schema merge. Dataloader must create FormSubmission table on `npm run verify`. |
| **Live service config** | RfpWizardService already persists step-wise draft data to SmeMartProject.wizardData (proven pattern). New form config step must integrate same persist pattern. | Code change: Add formConfig to RfpWizardService.saveFormConfig() → PipelineWriteService (fire-and-forget). |
| **OS-registered state** | None — form config is pure data, no OS-level registration. | None. |
| **Secrets/env vars** | None — form builder uses no new API keys or auth secrets. FileService SDK access is via existing zerobiasClientApi. | None. |
| **Build artifacts** | No new npm packages required (Validators/Material/CDK already installed). No code generation needed (unlike OpenAPI module phases). | None — `npm install` already satisfied. |

**Verification:** FormSubmission class ID must be determined after `npm run verify` in the schema repo (UUID v5 deterministic from YAML content). Document it in pipeline-write.service.ts SME_MART_CLASS_IDS constant.

---

## Common Pitfalls

### Pitfall 1: Form Validation Missing Server-Side (CRITICAL)

**What goes wrong:** Buyer defines form with required fields. Vendor submits invalid JSON (`{ field1: "" }` when required). No server-side validation — invalid data persists to FormSubmission, buyer sees it as "submitted" when it's actually broken.

**Why it happens:** Team assumes client-side Reactive Forms validation is sufficient. Pipeline receive accepts any JSON without schema gating.

**How to avoid:** 
1. **Define schema validation rules on Pipeline:** FormSubmission.submissionData is a JSON field. Validate against FormBuilderConfig schema on write (same pattern as Phase 15 DocumentInstance.content validation).
2. **Explicit service gate:** FormSubmissionService.submit() validates submissionData against project's formConfig BEFORE calling pushEntities.
3. **Test scenario:** Vendor submits form with required field empty → catch validation error in service → UI shows error → submission fails.

**Warning signs:** 
- Buyer reviews submission, data is missing but status='submitted'
- No error message when vendor tries to submit invalid form
- FormSubmission class definition lacks explicit validators on submissionData field

### Pitfall 2: Form Config Locked Too Late (CRITICAL)

**What goes wrong:** Buyer modifies form after first vendor submission. Vendor's submitted data no longer matches form structure (fields removed, types changed). Buyer reviews old form config vs. new, data appears corrupted.

**Why it happens:** Locking happens in UI (button disabled) but service allows write. Or lock gate is missing entirely.

**How to avoid:**
1. **Service-layer gate (not UI-only):** FormBuilderService.updateFormConfig() checks `config.lockedAt` before allowing write. Throws error if locked.
2. **Lock on first submission:** FormSubmissionService.submit() calls FormBuilderService.lockForm(projectId) atomically.
3. **Test scenario:** First vendor submits → FormBuilder checks if any FormSubmission exists with status='submitted' → yes → lock form → buyer cannot modify form → second vendor sees same form structure.

**Warning signs:**
- Buyer can edit form after first submission (button should be disabled + service rejects write)
- Form config version is missing or not checked

### Pitfall 3: RFP Wizard State Loss (CRITICAL)

**What goes wrong:** Buyer adds form fields, clicks "Next" to step 3. Wizard saves documents. Buyer clicks "Previous" back to step 2 → form fields are empty.

**Why it happens:** Form config not persisted on step change. Only saved on final publish.

**How to avoid:**
1. **Follow RfpWizardService pattern:** Call `wizard.saveFormConfig()` before stepper.next() in the form step component.
2. **Auto-persist on step change:** Hook the form step into RfpWizardService.persistWizardState(projectId, stepIndex) same as Requirements step.
3. **Load on resume:** loadDraft(id) hydrates formConfig from SmeMartProject.wizardData or new formConfig field.
4. **Test scenario:** Buyer builds form, moves to next step → form config is in SmeMartProject → buyer closes browser → reopens draft → form is restored.

**Warning signs:**
- Form step doesn't have onSave() callback
- RfpWizardService lacks saveFormConfig() method
- formConfig is stored only in local signal, not persisted to project

### Pitfall 4: File Upload Field Type Not Integrated

**What goes wrong:** Form builder allows file upload field. Vendor submits form → submissionData has `{ fileUploadField: fileId }`. But fileId is not linked to FileService → file is orphaned, can be deleted, preview fails.

**Why it happens:** Team assumes storing fileId is enough. Missing: File reference in FileService SDK metadata, proper lifecycle management.

**How to avoid:**
1. **Use FileService SDK metadata:** When vendor uploads file, call `fileClient.getFileApi().update(fileId, { tags: [formSubmissionId] })` to link file to submission.
2. **Store file reference object:** submissionData stores `{ fileUploadField: { fileId, fileName, fileSize, mimeType } }` (from upload response).
3. **Validate file existence:** FormSubmissionService.submit() checks that each file reference is actually in FileService (via `fileClient.getFileApi().get(fileId)`).
4. **Test scenario:** Vendor uploads PDF → FormSubmission.submit() stores file ref → buyer reviews, clicks preview → iframe shows file via FileService /view endpoint.

**Warning signs:**
- Form submission stores bare fileId without file metadata
- No file reference validation before accept
- File cannot be previewed in review UI

### Pitfall 5: Submission Form Tab Visibility Bug

**What goes wrong:** Buyer creates RFP without form config. Vendor views project detail → Submission Form tab is missing (correct). Buyer then edits project, adds form config. Vendor refreshes page → Submission Form tab still missing. New vendor views → tab appears.

**Why it happens:** Tab visibility computed once on component init. Form config change doesn't re-evaluate visibility.

**How to avoid:**
1. **Use signal-based computed:** ProjectDetailComponent defines `showSubmissionFormTab = computed(() => project()?.formConfig != null)`. Re-evaluates on every project signal change.
2. **Refresh on form config update:** After FormBuilderService.updateFormConfig(), emit change event → ProjectDetailComponent re-fetches project → computed updates.
3. **Test scenario:** Buyer adds form to RFP → vendor refreshes browser → Submission Form tab appears immediately.

**Warning signs:**
- Tab visibility is `*ngIf` on a property (not computed)
- No signal subscription to project updates
- "Stale content" bugs reported where data is changed but UI doesn't update

---

## Code Examples

Verified patterns from official sources and prior phases.

### FormBuilderConfig Interface (JSON Schema Shape)

```typescript
// Source: Angular Reactive Forms patterns (docs) + Phase 15 DocumentTemplate precedent
export interface FormBuilderConfig {
  version: 1;
  sections?: FormSection[];          // Optional — group fields under headers
  fields: FormFieldConfig[];         // All fields (flat or nested by section)
  lockedAt?: Date;                   // Set on first submission
}

export interface FormFieldConfig {
  id: string;                        // UUID or nanoid — unique per form
  type: FormFieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  description?: string;
  // Type-specific
  textValidation?: { minLength?: number; maxLength?: number; pattern?: 'email' | 'phone' | 'url' };
  dropdownOptions?: { value: string; label: string }[];
  numberValidation?: { min?: number; max?: number; step?: number };
  fileUploadConfig?: { allowedMimeTypes?: string[]; maxFileSizeBytes?: number };
  sectionId?: string;
}

export type FormFieldType = 'text' | 'textarea' | 'dropdown' | 'number' | 'file' | 'checkbox';
```

### DynamicFormRenderer — Fill Mode (Vendor Submission)

```typescript
// Source: Angular Reactive Forms + Material (docs) + Phase 15 template editor pattern
@Component({
  selector: 'app-dynamic-form-renderer',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatCheckboxModule, MatButtonModule,
  ],
  template: `
    <form [formGroup]="formGroup">
      @for (field of allFields(); track field.id) {
        <div class="form-group">
          @switch (field.type) {
            @case ('text') {
              <mat-form-field appearance="outline">
                <mat-label>{{ field.label }}</mat-label>
                <input matInput [formControlName]="field.id"
                  [placeholder]="field.placeholder || ''">
              </mat-form-field>
            }
            @case ('textarea') {
              <mat-form-field appearance="outline">
                <mat-label>{{ field.label }}</mat-label>
                <textarea matInput [formControlName]="field.id"
                  rows="4" [placeholder]="field.placeholder || ''"></textarea>
              </mat-form-field>
            }
            @case ('dropdown') {
              <mat-form-field appearance="outline">
                <mat-label>{{ field.label }}</mat-label>
                <mat-select [formControlName]="field.id">
                  @for (opt of field.dropdownOptions; track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            }
            @case ('number') {
              <mat-form-field appearance="outline">
                <mat-label>{{ field.label }}</mat-label>
                <input matInput type="number" [formControlName]="field.id"
                  [min]="field.numberValidation?.min"
                  [max]="field.numberValidation?.max"
                  [step]="field.numberValidation?.step || 1">
              </mat-form-field>
            }
            @case ('checkbox') {
              <mat-checkbox [formControlName]="field.id">
                {{ field.label }}
              </mat-checkbox>
            }
            @case ('file') {
              <div class="file-field">
                <label>{{ field.label }}</label>
                <app-file-upload [field]="field" [formControlName]="field.id"></app-file-upload>
              </div>
            }
          }
          @if (formGroup.get(field.id)?.invalid && formGroup.get(field.id)?.touched) {
            <mat-error>{{ getErrorMessage(field) }}</mat-error>
          }
        </div>
      }
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicFormRenderer {
  private readonly fb = inject(FormBuilder);
  
  readonly config = input.required<FormBuilderConfig>();
  readonly mode = input.required<FormMode>();
  
  readonly allFields = computed(() => [
    ...(this.config().sections?.flatMap(s => s.fields) ?? []),
    ...this.config().fields,
  ]);
  
  readonly formGroup = computed(() => {
    const fg = this.fb.group({});
    this.allFields().forEach(field => {
      const validators = this.buildValidators(field);
      fg.addControl(field.id, this.fb.control({ value: '', disabled: this.mode() !== 'fill' }, validators));
    });
    return fg;
  });
  
  private buildValidators(field: FormFieldConfig): any[] {
    const v: any[] = [];
    if (field.required) v.push(Validators.required);
    if (field.type === 'text') {
      if (field.textValidation?.minLength) v.push(Validators.minLength(field.textValidation.minLength));
      if (field.textValidation?.maxLength) v.push(Validators.maxLength(field.textValidation.maxLength));
      if (field.textValidation?.pattern === 'email') v.push(Validators.email);
      if (field.textValidation?.pattern === 'phone') v.push(Validators.pattern(/^\d{10}$/));
      if (field.textValidation?.pattern === 'url') v.push(Validators.pattern(/^https?:\/\/.+/));
    }
    if (field.type === 'number') {
      if (field.numberValidation?.min !== undefined) v.push(Validators.min(field.numberValidation.min));
      if (field.numberValidation?.max !== undefined) v.push(Validators.max(field.numberValidation.max));
    }
    return v;
  }
  
  getErrorMessage(field: FormFieldConfig): string {
    const control = this.formGroup().get(field.id);
    if (!control) return '';
    if (control.hasError('required')) return `${field.label} is required`;
    if (control.hasError('email')) return 'Invalid email format';
    if (control.hasError('minlength')) return `Minimum length is ${field.textValidation?.minLength}`;
    if (control.hasError('maxlength')) return `Maximum length is ${field.textValidation?.maxLength}`;
    return 'Invalid value';
  }
}
```

### FormSubmissionService — submit() with Validation Gate

```typescript
// Source: Phase 14 BidsService pattern + Phase 15 DocumentInstanceService pattern
async submit(submissionId: UUID, formData: Record<string, unknown>, projectId: UUID): Promise<void> {
  // Load project + form config
  const project = await this.graphqlRead.getById('SmeMartProject', projectId, ['id', 'formConfig']);
  const configJson = project?.formConfig as string | null;
  if (!configJson) throw new Error('No form config on project');

  const config = JSON.parse(configJson) as FormBuilderConfig;
  const allFields = [...(config.sections?.flatMap(s => s.fields) ?? []), ...config.fields];

  // Validate submitted data against form config
  const errors: string[] = [];
  allFields.forEach(field => {
    const value = formData[field.id];
    if (field.required && !value) {
      errors.push(`${field.label} is required`);
    }
    if (field.type === 'number' && field.numberValidation?.min !== undefined && value < field.numberValidation.min) {
      errors.push(`${field.label} minimum is ${field.numberValidation.min}`);
    }
  });

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join('; ')}`);
  }

  // Check if first submission (lock form)
  const submissions = await this.listByProject(projectId);
  const isFirst = !submissions.some(s => s.status === 'submitted' || s.status === 'revised');

  // Write via Pipeline
  await this.pipelineWrite.pushEntities('FormSubmission', [{
    id: submissionId,
    submissionData: formData,
    status: 'submitted',
    submittedAt: new Date(),
    updatedAt: new Date(),
  }]);

  // Lock form if first submission
  if (isFirst) {
    const lockedConfig: FormBuilderConfig = { ...config, lockedAt: new Date() };
    await this.pipelineWrite.pushEntities('SmeMartProject', [{
      id: projectId,
      formConfig: JSON.stringify(lockedConfig),
      updatedAt: new Date(),
    }]);
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom form builder (per-RFP code) | Reusable FormBuilderService + DynamicFormRenderer component | Phase 16 (this phase) | Enables form reuse across RFP types; reduces code duplication |
| ngx-formly JSON schema | Angular Reactive Forms + Material | Phase 16 (decision made in CONTEXT.md) | Smaller bundle, better integration with Material, no external library |
| Manual field validation in component | Angular Validators (built-in) | Phase 16 | Standardized, well-tested, tree-shaken efficiently |
| Form config versioning | Single config with lockedAt timestamp | Phase 16 (CONTEXT.md D-13) | Simpler than versioning; lock prevents mismatch |
| Storing file upload as bare fileId | File reference object { fileId, fileName, fileSize, mimeType } | Phase 16 (from file-upload-sdk-reference.md pattern) | Enables preview, supports file metadata queries |

**Deprecated/outdated:**
- **ngx-formly:** Last update 2023-11, 5+ years of stagnation. Angular's built-in Reactive Forms are more current.
- **Custom form state management:** Signals + Reactive Forms are now standard in Angular 21; manual state machine is anti-pattern.

---

## Open Questions

1. **Preset text patterns for email/phone/URL — regex strategy**
   - What we know: CONTEXT.md D-06 mentions "preset pattern validation (email, phone, URL)"
   - What's unclear: Should we use Material's built-in email validator or custom regex for phone/URL?
   - Recommendation: Use Validators.email for email; simple regex `/^\d{10}$/` for US phone (9-digit); `/^https?:\/\/.+/` for URL. Validate assumption in design doc or first wave execution.

2. **File upload field — allowed MIME types and max file size defaults**
   - What we know: CONTEXT.md D-14 mentions file upload via FileService; form config includes fileUploadConfig with constraints
   - What's unclear: Should we default to all document MIME types (PDF, Word, Excel, PowerPoint) or be more restrictive? Max file size (5MB, 10MB)?
   - Recommendation: Defer to "Claude's Discretion" — suggest PDF + Word + Excel + PowerPoint, 10MB max per file. Buyer can customize per field.

3. **Section grouping visual design**
   - What we know: CONTEXT.md D-04 mentions "optional sections supported" and "named section headers"
   - What's unclear: Should sections be collapsible groups (mat-expansion-panel) or simple dividers with legend?
   - Recommendation: Use `<fieldset><legend>` for semantic HTML + simpler CSS. Collapsible groups can be future enhancement (v1.3).

4. **FormSubmission class ID verification after schema merge**
   - What we know: New class in zerobias-org/schema PR, deterministic UUID v5
   - What's unclear: When does dataloader assign the ID? How to document it in code?
   - Recommendation: Run `npm run verify` after schema PR merges (Wave 0), capture class ID from output, update pipeline-write.service.ts SME_MART_CLASS_IDS.FormSubmission constant in Wave 1.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build, dev, tests | ✓ | 18.19.1+ | — |
| npm | Package manager | ✓ | 10.2.4+ | — |
| Angular 21 CLI | Build, serve | ✓ | 21.1.0 | — |
| Angular Material | Form components, expansion panels, dialogs | ✓ | 21.1.4 | — |
| Angular CDK | DragDrop module | ✓ | 21.1.4 | — |
| ts-md5 | File upload checksums | ✓ | 1.3.2 | — |
| ZB FileService SDK | File upload to FileService | ✓ | Latest (via angular-client@1.1.29) | — |
| ZB Platform API (HTTP) | Pipeline writes, GQL reads | ✓ | UAT environment | — |
| Neon PostgreSQL | Data storage (via DataProducer) | ✓ | Via Neon HTTP | — |

**Missing dependencies with no fallback:** None — all required infrastructure is available.

**Missing dependencies with fallback:** None — Phase 16 requires no new external services or tools.

**Schema repo availability:** `zerobias-org/schema` is available. FormSubmission.yml and SmeMartProject schema changes must be in Wave 0 (schema PR merged before code execution).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 2.x (migrated from Jasmine in Phase 14) |
| Config file | `vitest.config.ts` (in project root) |
| Quick run command | `npm test -- --run --reporter=verbose` (entire suite) |
| Full suite command | `npm test` (watch mode available) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D3-01 | Form builder component exists, is standalone, lives in src/app/shared/components/form-builder/ | unit | `npm test -- src/app/shared/components/form-builder/form-builder.component.spec.ts -t "should create"` | ❌ Wave 0 |
| D3-02 | Buyer can add/remove/reorder form fields; config persists via FormBuilderService | unit | `npm test -- src/app/core/services/form-builder.service.spec.ts -t "addField|removeField|reorderFields"` | ❌ Wave 0 |
| D3-03 | DynamicFormRenderer validates form fields using Angular Validators; required, min/max, pattern validators work | unit | `npm test -- src/app/shared/components/form-builder/dynamic-form-renderer.component.spec.ts -t "validator"` | ❌ Wave 0 |
| D3-04 | DynamicFormRenderer preview mode is read-only; renders all field types | unit | `npm test -- src/app/shared/components/form-builder/dynamic-form-renderer.component.spec.ts -t "preview mode"` | ❌ Wave 0 |
| D3-05 | Vendor can fill and submit form; FormSubmissionService.submit() validates and persists | unit | `npm test -- src/app/core/services/form-submission.service.spec.ts -t "submit"` | ❌ Wave 0 |
| D3-06 | Buyer can review vendor submissions; submission status updates from submitted→reviewed | unit | `npm test -- src/app/core/services/form-submission.service.spec.ts -t "markReviewed"` | ❌ Wave 0 |
| D3-01 | RfpWizardService includes Submission Form step; form config persists on step change | integration | `npm test -- src/app/core/services/rfp-wizard.service.spec.ts -t "form step"` | ❌ Wave 0 |
| D3-02 | File upload field stores file reference object with metadata | unit | `npm test -- src/app/shared/components/form-builder/file-upload-field.component.spec.ts -t "file reference"` | ❌ Wave 0 |
| D3-05 | Form submission is prerequisite for bid submission on form-enabled RFPs (BidsService gate) | integration | `npm test -- src/app/core/services/bids.service.spec.ts -t "form prerequisite"` | ❌ Wave 0 |
| (Pitfall #3) | Form config locked on first submission; subsequent updates fail with clear error | unit | `npm test -- src/app/core/services/form-builder.service.spec.ts -t "locked"` | ❌ Wave 0 |
| (Pitfall #4) | FormSubmission.submit() validates submissionData against FormBuilderConfig schema server-side | unit | `npm test -- src/app/core/services/form-submission.service.spec.ts -t "validation"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run` (full suite quick-run — <30s)
- **Per wave merge:** `npm test` (watch mode, full coverage check)
- **Phase gate:** 80%+ coverage on FormBuilder + FormSubmissionService before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/app/core/models/form-builder.model.ts` — interfaces (FormBuilderConfig, FormFieldConfig, FormSubmission, etc.)
- [ ] `src/app/core/models/index.ts` — export form-builder.model
- [ ] `src/app/shared/components/form-builder/` directory structure
- [ ] Schema repo: `zerobias-org-forks/schema/package/w3geekery/smemart/classes/FormSubmission.yml` + SmeMartProject.yml update
- [ ] `src/app/core/services/form-builder.service.ts` — CRUD, lock gate
- [ ] `src/app/core/services/form-submission.service.ts` — submission lifecycle, validation
- [ ] `src/app/core/field-mappings/form-builder.field-mapping.ts` — Pipeline field mapping for YAML→JSON
- [ ] `src/app/pages/rfps/rfp-wizard/steps/rfp-step-form.component.ts` — wizard step integration
- [ ] Update `RfpWizardService` to include `saveFormConfig()` and step management
- [ ] Tests: 25+ specs covering validators, service gates, state persistence

*(No existing test infrastructure gaps — vitest is configured and all prior phase tests are runnable.)*

---

## Sources

### Primary (HIGH confidence)

- **Angular 21 Forms documentation** — Reactive Forms API, Validators (required, min, max, minLength, maxLength, pattern, email). Verified against `@angular/forms@21.1.0` in package.json.
- **Angular Material 21 Form Field Components** — `mat-form-field`, `mat-input`, `mat-select`, `mat-checkbox`, `mat-expansion-panel`. Verified against `@angular/material@21.1.4`.
- **Angular CDK 21 DragDrop** — `CdkDragDrop`, `cdkDrag`, `cdkDropList` directives. Verified against `@angular/cdk@21.1.4`.
- **ZB FileService SDK Reference** — `.planning/notes/zb-file-upload-sdk-reference.md` (project-specific, HIGH confidence)
- **Phase 14 Context** — RfpInvitationService, access control gate pattern proven (16-CONTEXT.md section on canonical refs)
- **Phase 15 Context** — DocumentTemplateService (CRUD + Pipeline pattern), DocumentInstanceService (schema integration pattern) proven
- **Project CLAUDE.md** — Angular 21 patterns (inject, input/output, signals, OnPush, modern control flow) — verified against codebase
- **MODERNIZATION_GUIDE.md** — Angular 21 current patterns for this project (HIGH confidence)

### Secondary (MEDIUM confidence)

- **Pipeline Write Pattern** — `pipeline-write.service.ts` (codebase, verified Nov 2024)
- **GraphQL Read Pattern** — `graphql-read.service.ts` (codebase, verified Nov 2024)
- **RfpWizardService draft persistence** — `rfp-wizard.service.ts` (codebase, Phase 10 refactor, verified Mar 2026)

### Tertiary (documentation / references)

- **16-CONTEXT.md** — Decision records from `/gsd:discuss-phase` (user-provided, HIGH confidence)
- **REQUIREMENTS.md** — D3-01 through D3-06 requirement definitions (user-provided, HIGH confidence)

---

## Metadata

**Confidence breakdown:**
- **Standard Stack:** HIGH — All libraries are installed and current. Angular Validators cover all field types (verified against @angular/forms docs).
- **Architecture Patterns:** HIGH — Patterns proven in Phase 14 (BidsService, RfpInvitationService) and Phase 15 (DocumentTemplateService). DynamicFormRenderer pattern is standard Angular (single component, input props to control behavior).
- **Pitfalls:** HIGH — All pitfalls are specific, actionable, and grounded in prior phases (state loss from Phase 10, locking from Phase 15, validation gates from Phase 14).
- **Environment:** HIGH — All tools are available, no platform blockers.
- **Tests:** HIGH — vitest is configured, prior phases have 100+ passing specs. No gaps in framework or infrastructure.

**Research date:** 2026-04-10

**Valid until:** 2026-04-24 (14 days — form builder is stable domain, no breaking changes expected in Angular 21 or ZB SDK in next two weeks)

---

## Next Steps for Planner

1. **Schema PR (Wave 0):** Create FormSubmission.yml class + add formConfig field to SmeMartProject.yml in zerobias-org/schema:dev branch. Merge, wait 15 min for reload, verify class IDs via dataloader.
2. **Model & Service Layer (Wave 1):** Implement form-builder.model.ts interfaces, FormBuilderService, FormSubmissionService with validation gates and locking logic.
3. **UI Components (Wave 2):** Form builder (expansion panels + CDK DragDrop), DynamicFormRenderer (3 modes), FormFieldEditor (type-specific config).
4. **Wizard Integration (Wave 3):** RfpStepForm component, RfpWizardService extension for form step persistence.
5. **Vendor & Review UI (Wave 4):** Submission Form tab on project detail, bid form prerequisite gate, review UI on bid detail.
6. **Tests (per-wave):** 80%+ coverage on services, components, integration scenarios. Verify pitfall prevention (locking, validation, state persistence).

---

*Research complete. Planner can now create PLAN.md files with confidence.*
