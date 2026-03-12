import {
  Component, Input, Output, EventEmitter, inject, signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DocumentUploadComponent } from '../../../../shared/components/document-upload/document-upload.component';
import { DocumentListComponent } from '../../../../shared/components/document-list/document-list.component';
import { RfpWizardService } from '../../../../core/services/rfp-wizard.service';
import { OrgDocumentService } from '../../../../core/services/org-document.service';
import {
  OrgDocumentChooser,
  type OrgDocumentChooserResult,
} from '../../../../shared/components/org-document-chooser/org-document-chooser.component';
import type { EngagementDocument } from '../../../../core/models/document.model';

@Component({
  selector: 'app-rfp-step-documents',
  standalone: true,
  imports: [
    MatButtonModule, MatIconModule, MatDialogModule, MatSnackBarModule,
    DocumentUploadComponent, DocumentListComponent,
  ],
  template: `
    <div class="step-content">
      <h3>Upload Procurement Documents</h3>
      <p class="step-description">
        Upload exhibits, SOW, budget, and other supporting documents,
        or attach existing files from your organization's document library.
      </p>

      @if (engagementId) {
        <div class="doc-actions-bar">
          @if (showUpload()) {
            <app-document-upload
              [engagementId]="engagementId"
              (uploaded)="onDocUploaded($event)"
              (cancelled)="showUpload.set(false)" />
          } @else {
            <button mat-stroked-button (click)="showUpload.set(true)">
              <mat-icon>upload_file</mat-icon>
              Upload New
            </button>
          }
          <button mat-stroked-button (click)="openLibrary()">
            <mat-icon>folder_open</mat-icon>
            Attach from Library
          </button>
        </div>

        @if (documents.length > 0) {
          <div class="doc-list">
            <app-document-list [engagementId]="engagementId" />
          </div>
        }
      } @else {
        <p class="hint">Complete Step 1 first to enable document uploads.</p>
      }

      <div class="step-actions">
        <button mat-button matStepperPrevious>Back</button>
        <button mat-flat-button (click)="next.emit()">
          {{ documents.length > 0 ? 'Next' : 'Skip' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .step-content { max-width: 720px; }
    .step-description { color: var(--mat-sys-on-surface-variant, #666); margin-bottom: 16px; }
    .doc-actions-bar { display: flex; gap: 12px; align-items: flex-start; flex-wrap: wrap; }
    .doc-list { margin-top: 20px; }
    .hint { color: var(--mat-sys-on-surface-variant, #999); font-style: italic; }
    .step-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 24px;
      gap: 12px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RfpStepDocuments {
  private readonly wizard = inject(RfpWizardService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly orgDocService = inject(OrgDocumentService);

  @Input() engagementId: string | null = null;
  @Input() documents: EngagementDocument[] = [];
  @Output() next = new EventEmitter<void>();

  readonly showUpload = signal(true);

  async onDocUploaded(doc: EngagementDocument): Promise<void> {
    await this.wizard.onDocumentUploaded(doc);
    this.documents = [...this.documents, doc];
  }

  openLibrary(): void {
    const ref = this.dialog.open(OrgDocumentChooser, {
      width: '600px',
      data: {
        scope: 'engagement',
        engagementId: this.engagementId,
        multiple: true,
        title: 'Attach Documents from Library',
      },
    });
    ref.afterClosed().subscribe(async (result: OrgDocumentChooserResult | null) => {
      if (!result) return;
      const allDocs = [...result.selected, ...result.uploaded];
      if (allDocs.length === 0) return;

      // Share each selected/uploaded doc with this engagement
      let shared = 0;
      for (const doc of allDocs) {
        try {
          await this.orgDocService.shareDocument({
            documentId: doc.id,
            targetType: 'engagement',
            targetId: this.engagementId!,
          });
          shared++;
        } catch (err) {
          console.warn('[RfpStepDocuments] Share failed for doc:', doc.id, err);
        }
      }

      if (shared > 0) {
        this.snackBar.open(`${shared} document(s) attached`, 'OK', { duration: 3000 });
        // Reload the document list component
        await this.wizard.refreshDocuments(this.engagementId!);
        this.documents = this.wizard.documents();
      }
    });
  }
}
