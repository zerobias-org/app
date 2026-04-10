import {
  Component, inject, signal, ChangeDetectionStrategy, OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MatFormField, MatLabel, MatError,
} from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DocumentTemplateService } from '@/core/services';
import { DocumentTemplate } from '@/core/models';

export interface TemplateChooserDialogData {
  scope: 'engagement' | 'project' | 'note'; // Where the template will be instantiated
  scopeId: string; // ID of the engagement, project, or note
}

export interface TemplateChooserDialogResult {
  templateId: string;
  instanceData: Record<string, any>;
}

@Component({
  selector: 'app-template-chooser-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButton,
    MatFormField,
    MatLabel,
    MatError,
    MatInput,
    MatIcon,
    MatChipsModule,
    MatProgressSpinner,
  ],
  templateUrl: './template-chooser-dialog.component.html',
  styleUrl: './template-chooser-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateChooserDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<TemplateChooserDialogComponent>);
  readonly data = inject(MAT_DIALOG_DATA) as TemplateChooserDialogData;
  private readonly documentTemplateService = inject(DocumentTemplateService);
  private readonly fb = inject(FormBuilder);

  readonly form!: FormGroup;
  readonly templates = signal<DocumentTemplate[]>([]);
  readonly loading = signal(false);
  readonly selectedTemplate = signal<DocumentTemplate | null>(null);

  constructor() {
    this.form = this.fb.group({
      title: ['', [Validators.required]],
      description: [''],
      documentType: ['', [Validators.required]],
      templateId: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.loadTemplates();
  }

  private async loadTemplates(): Promise<void> {
    this.loading.set(true);
    try {
      // In a real implementation, this would filter by org
      // For now, load all templates
      const result = await this.documentTemplateService.listByOrg('current-org-id');
      this.templates.set(result);
    } finally {
      this.loading.set(false);
    }
  }

  selectTemplate(template: DocumentTemplate): void {
    this.selectedTemplate.set(template);
    this.form.patchValue({
      templateId: template.id,
      title: template.name,
      description: template.description,
      documentType: template.documentType,
    });
  }

  instantiate(): void {
    if (!this.form.valid) {
      return;
    }

    const formValue = this.form.getRawValue();
    const result: TemplateChooserDialogResult = {
      templateId: formValue.templateId,
      instanceData: {
        title: formValue.title,
        description: formValue.description,
        templateId: formValue.templateId,
        scope: this.data.scope,
        scopeId: this.data.scopeId,
      },
    };

    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close();
  }

  getDocumentTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      msa: 'Master Service Agreement',
      nda: 'Non-Disclosure Agreement',
      sow: 'Statement of Work',
      compliance: 'Compliance Document',
      other: 'Other',
    };
    return labels[type] || type;
  }
}
