import {
  Component, signal, inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type {
  SmeMartRfpImport,
  SmeMartRfpTaskGroupImport,
  RfpTaskGroup,
  RfpRequirement,
  EvidenceType,
} from '../../../../core/models';
import type { DocumentType } from '../../../../core/models/document.model';

/** Map import task type strings to DocumentType enum values. */
const TASK_TYPE_MAP: Record<string, { taskType: DocumentType; displayName: string }> = {
  SECURITY: { taskType: 'security_requirements', displayName: 'Security Requirements' },
  COMPLIANCE: { taskType: 'compliance', displayName: 'Compliance Requirements' },
  LEGAL: { taskType: 'legal_terms', displayName: 'Legal Requirements' },
  FUNCTIONAL: { taskType: 'functional_spec', displayName: 'Functional Requirements' },
  FINANCIAL: { taskType: 'budget', displayName: 'Financial Requirements' },
  SOW: { taskType: 'sow', displayName: 'Statement of Work' },
};

const PRIORITY_MAP: Record<string, number> = {
  critical: 1000, high: 500, normal: 200, low: 100,
};

@Component({
  selector: 'app-rfp-import-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Import Requirements from JSON</h2>

    <mat-dialog-content>
      <p class="description">
        Paste or upload a JSON file matching the
        <a href="javascript:void(0)" (click)="showSchema.set(!showSchema())">SmeMartRfpImport schema</a>.
      </p>

      @if (showSchema()) {
        <pre class="schema-preview">{{ schemaExample }}</pre>
      }

      <div class="import-area">
        <textarea
          class="json-input"
          [value]="rawJson()"
          (input)="onInput($event)"
          placeholder='Paste JSON here...'
          rows="12">
        </textarea>

        <div class="file-upload">
          <span>— or —</span>
          <button mat-stroked-button (click)="fileInput.click()">
            <mat-icon>upload_file</mat-icon> Choose File
          </button>
          <input #fileInput type="file" accept=".json" hidden
            (change)="onFileSelected($event)">
        </div>
      </div>

      @if (error()) {
        <div class="error-msg">
          <mat-icon>error</mat-icon>
          {{ error() }}
        </div>
      }

      @if (preview(); as groups) {
        <div class="preview">
          <h4>Preview</h4>
          @for (g of groups; track g.taskType) {
            <div class="preview-group">
              <strong>{{ g.displayName }}</strong>
              — {{ g.requirements.length }} requirements
            </div>
          }
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button
        [disabled]="!preview()"
        (click)="import()">
        Import {{ totalReqs() }} Requirements
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .description { color: var(--mat-sys-on-surface-variant, #666); margin-bottom: 12px; }
    .description a { color: var(--mat-sys-primary, #1976d2); cursor: pointer; }
    .schema-preview {
      background: var(--mat-sys-surface-container, #f5f5f5);
      padding: 12px;
      border-radius: 4px;
      font-size: 11px;
      max-height: 200px;
      overflow: auto;
      margin-bottom: 12px;
    }
    .json-input {
      width: 100%;
      font-family: monospace;
      font-size: 12px;
      padding: 12px;
      border: 1px solid var(--mat-sys-outline-variant, #ccc);
      border-radius: 4px;
      resize: vertical;
      box-sizing: border-box;
    }
    .file-upload {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 8px;
      color: var(--mat-sys-on-surface-variant, #999);
    }
    .error-msg {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--mat-sys-error, #d32f2f);
      margin-top: 12px;
      font-size: 13px;
    }
    .preview {
      margin-top: 16px;
      padding: 12px;
      background: var(--mat-sys-surface-container, #f5f5f5);
      border-radius: 4px;
    }
    .preview h4 { margin: 0 0 8px; font-weight: 500; }
    .preview-group { padding: 4px 0; font-size: 13px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RfpImportDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<RfpImportDialogComponent>);

  readonly rawJson = signal('');
  readonly error = signal<string | null>(null);
  readonly preview = signal<RfpTaskGroup[] | null>(null);
  readonly showSchema = signal(false);
  readonly totalReqs = signal(0);

  readonly schemaExample = `{
  "schemaVersion": "1.0",
  "taskGroups": [
    {
      "taskType": "SECURITY",
      "displayName": "Security Requirements",
      "requirements": [
        {
          "title": "Multi-factor authentication",
          "description": "All users must use MFA",
          "standardReference": "NIST SP800-53 IA-2",
          "evidenceType": "document",
          "priority": "high"
        }
      ]
    }
  ]
}`;

  onInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.rawJson.set(value);
    this.tryParse(value);
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    file.text().then(text => {
      this.rawJson.set(text);
      this.tryParse(text);
    });
  }

  import(): void {
    const groups = this.preview();
    if (groups) {
      this.dialogRef.close(groups);
    }
  }

  private tryParse(text: string): void {
    if (!text.trim()) {
      this.error.set(null);
      this.preview.set(null);
      this.totalReqs.set(0);
      return;
    }

    try {
      const parsed = JSON.parse(text) as SmeMartRfpImport;

      if (parsed.schemaVersion !== '1.0') {
        this.error.set(`Unsupported schema version: ${parsed.schemaVersion}. Expected "1.0".`);
        this.preview.set(null);
        return;
      }

      if (!Array.isArray(parsed.taskGroups) || parsed.taskGroups.length === 0) {
        this.error.set('No taskGroups found in JSON.');
        this.preview.set(null);
        return;
      }

      const groups = this.convertGroups(parsed.taskGroups);
      const total = groups.reduce((s, g) => s + g.requirements.length, 0);
      this.preview.set(groups);
      this.totalReqs.set(total);
      this.error.set(null);
    } catch (e: any) {
      this.error.set(`Invalid JSON: ${e.message}`);
      this.preview.set(null);
      this.totalReqs.set(0);
    }
  }

  private convertGroups(imported: SmeMartRfpTaskGroupImport[]): RfpTaskGroup[] {
    return imported
      .map(g => {
        const mapping = TASK_TYPE_MAP[g.taskType];
        if (!mapping) return null;

        const requirements: RfpRequirement[] = g.requirements.map((r, i) => ({
          id: crypto.randomUUID(),
          taskType: mapping.taskType,
          title: r.title,
          description: r.description,
          standardReference: r.standardReference,
          evidenceType: (r.evidenceType || 'document') as EvidenceType,
          priority: PRIORITY_MAP[r.priority || 'normal'] ?? 200,
          sortOrder: i,
        }));

        return {
          taskType: mapping.taskType,
          taskTypeTagName: g.taskType,
          displayName: g.displayName || mapping.displayName,
          requirements,
        } as RfpTaskGroup;
      })
      .filter((g): g is RfpTaskGroup => g !== null);
  }
}
