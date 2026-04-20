import {
  Component, inject, signal, ChangeDetectionStrategy, OnInit, OnDestroy, effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardHeader, MatCardContent, MatCardActions } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { DocumentTemplateService } from '@/core/services';
import { DocumentTemplate } from '@/core/models';
import { ConfirmDialogComponent } from '@/shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-org-document-templates-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatButton,
    MatCard,
    MatCardHeader,
    MatCardContent,
    MatCardActions,
    MatChipsModule,
    MatIcon,
    MatMenu,
    MatMenuTrigger,
    MatProgressSpinner,
    MatDivider,
  ],
  templateUrl: './org-document-templates-tab.component.html',
  styleUrl: './org-document-templates-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrgDocumentTemplatesTabComponent implements OnInit, OnDestroy {
  private readonly app = inject(ZerobiasClientApp);
  private readonly documentTemplateService: DocumentTemplateService = inject(DocumentTemplateService);
  private readonly router = inject(Router);
  private readonly dialog: MatDialog = inject(MatDialog);

  private subs: Subscription[] = [];

  readonly orgId = signal<string | null>(null);
  readonly templates = signal<DocumentTemplate[]>([]);
  readonly loading = signal(false);

  constructor() {
    effect(() => {
      const id = this.orgId();
      if (id) {
        this.loadTemplates();
      }
    });
  }

  ngOnInit(): void {
    const sub = this.app.getCurrentOrg().subscribe((org: any) => {
      if (org?.id) {
        const id = typeof org.id === 'string' ? org.id : org.id.toString?.();
        if (id) this.orgId.set(id);
      }
    });
    this.subs.push(sub);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  async loadTemplates(): Promise<void> {
    const id = this.orgId();
    if (!id) return;

    this.loading.set(true);
    try {
      const result = await this.documentTemplateService.listByOrg(id);
      this.templates.set(result);
    } finally {
      this.loading.set(false);
    }
  }

  createNewTemplate(): void {
    this.router.navigate(['/templates', 'new']);
  }

  editTemplate(template: DocumentTemplate): void {
    this.router.navigate(['/templates', template.id]);
  }

  async publishTemplate(template: DocumentTemplate): Promise<void> {
    this.loading.set(true);
    try {
      await this.documentTemplateService.publish(template.id);
      await this.loadTemplates();
    } finally {
      this.loading.set(false);
    }
  }

  async archiveTemplate(template: DocumentTemplate): Promise<void> {
    this.loading.set(true);
    try {
      await this.documentTemplateService.archive(template.id);
      await this.loadTemplates();
    } finally {
      this.loading.set(false);
    }
  }

  async deleteTemplate(template: DocumentTemplate): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent as any, {
      data: {
        title: 'Delete Template',
        message: `Delete template "${template.name}"? This cannot be undone.`,
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
      },
    });

    const confirmed = await dialogRef.afterClosed().toPromise();
    if (confirmed) {
      this.loading.set(true);
      try {
        await this.documentTemplateService.delete(template.id);
        await this.loadTemplates();
      } finally {
        this.loading.set(false);
      }
    }
  }

  getStatusLabel(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  getVariableCount(variableSchema: string | null | undefined): number {
    if (!variableSchema) return 0;
    try {
      const parsed = JSON.parse(variableSchema);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  }

  formatDate(date: Date | string): string {
    if (!date) return 'Unknown';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
