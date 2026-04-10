import {
  Component, inject, signal, ChangeDetectionStrategy, OnInit, OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  MatButton, MatIconButton,
} from '@angular/material/button';
import {
  MatFormField, MatLabel, MatError,
} from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import {
  MatToolbar, MatToolbarRow,
} from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';
import { DocumentTemplateService, VariableSubstitutionService } from '../../core/services';
import { DocumentTemplate, CustomVariable } from '../../core/models';
import { MarkdownEditor } from '../../shared/components/markdown-editor/markdown-editor.component';
import { VariablePanelComponent } from '../../shared/components/variable-panel/variable-panel.component';

@Component({
  selector: 'app-template-editor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButton,
    MatIconButton,
    MatFormField,
    MatLabel,
    MatError,
    MatInput,
    MatSelect,
    MatOption,
    MatToolbar,
    MatToolbarRow,
    MatIcon,
    MatProgressSpinner,
    MarkdownEditor,
    VariablePanelComponent,
  ],
  templateUrl: './template-editor.component.html',
  styleUrl: './template-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateEditorComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly documentTemplateService = inject(DocumentTemplateService);
  private readonly variableSubstitution = inject(VariableSubstitutionService);
  private readonly fb = inject(FormBuilder);

  private subs: Subscription[] = [];

  readonly form!: FormGroup;
  readonly isCreateMode = signal(false);
  readonly loading = signal(false);
  readonly customVariables = signal<CustomVariable[]>([]);
  readonly allVariableNames = signal<string[]>([]);

  private template: DocumentTemplate | null = null;

  constructor() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      documentType: ['other', [Validators.required]],
      content: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.loadTemplate();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  private loadTemplate(): void {
    const sub = this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) return;

      if (id === 'new') {
        this.isCreateMode.set(true);
        this.initializeVariables();
        return;
      }

      this.loading.set(true);
      const templateSub = this.documentTemplateService.getById(id).then(template => {
        if (!template) {
          this.router.navigate(['/org/templates']);
          return;
        }

        this.template = template;
        this.form.patchValue({
          name: template.name,
          description: template.description,
          documentType: template.documentType,
          content: template.content,
        });

        const customVars = this.variableSubstitution.parseCustomVariables(template.variableSchema ?? undefined);
        this.customVariables.set(customVars);
        this.updateVariableNames();
      }).finally(() => this.loading.set(false));
    });

    this.subs.push(sub);
  }

  private initializeVariables(): void {
    this.customVariables.set([]);
    this.updateVariableNames();
  }

  private updateVariableNames(): void {
    const builtInVars = [
      'buyerOrgName',
      'vendorOrgName',
      'engagementTitle',
      'engagementId',
      'projectName',
      'projectId',
      'effectiveDate',
      'expirationDate',
      'todayDate',
    ];
    const customVars = this.customVariables().map(v => v.name);
    this.allVariableNames.set([...builtInVars, ...customVars]);
  }

  addVariable(variable: CustomVariable): void {
    const current = this.customVariables();
    this.customVariables.set([...current, variable]);
    this.updateVariableNames();
  }

  updateVariable(index: number, variable: CustomVariable): void {
    const current = [...this.customVariables()];
    current[index] = variable;
    this.customVariables.set(current);
    this.updateVariableNames();
  }

  removeVariable(index: number): void {
    const current = this.customVariables();
    this.customVariables.set(current.filter((_, i) => i !== index));
    this.updateVariableNames();
  }

  async save(): Promise<void> {
    if (!this.form.valid) {
      console.warn('Form invalid');
      return;
    }

    this.loading.set(true);
    try {
      const formValue = this.form.getRawValue();
      const variableSchema = this.customVariables().length > 0
        ? JSON.stringify(this.customVariables())
        : null;

      if (this.isCreateMode()) {
        // Create new template
        const dto = {
          name: formValue.name,
          description: formValue.description,
          documentType: formValue.documentType,
          content: formValue.content,
          variableSchema: this.customVariables(),
          orgId: 'current-org-id', // TODO: Get from auth service
        };
        const created = await this.documentTemplateService.create(dto);
        this.router.navigate(['/org/templates']);
      } else if (this.template) {
        // Update existing
        const dto = {
          name: formValue.name,
          description: formValue.description,
          documentType: formValue.documentType,
          content: formValue.content,
          variableSchema: this.customVariables(),
        };
        await this.documentTemplateService.update(this.template.id, dto);
        this.router.navigate(['/org/templates']);
      }
    } finally {
      this.loading.set(false);
    }
  }

  async publish(): Promise<void> {
    if (!this.template) return;
    this.loading.set(true);
    try {
      await this.documentTemplateService.publish(this.template.id);
      this.router.navigate(['/org/templates']);
    } finally {
      this.loading.set(false);
    }
  }

  async archive(): Promise<void> {
    if (!this.template) return;
    this.loading.set(true);
    try {
      await this.documentTemplateService.archive(this.template.id);
      this.router.navigate(['/org/templates']);
    } finally {
      this.loading.set(false);
    }
  }

  cancel(): void {
    this.router.navigate(['/org/templates']);
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
