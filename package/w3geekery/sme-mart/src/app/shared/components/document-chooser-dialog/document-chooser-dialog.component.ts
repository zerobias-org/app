import {
  Component, inject, signal, ChangeDetectionStrategy, OnInit,
} from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DocumentService } from '../../../core/services/document.service';
import type { EngagementDocument } from '../../../core/models/document.model';

export interface DocumentChooserDialogData {
  engagementId: string;
  /** Optional: pre-select a document by ID */
  selectedDocId?: string;
}

export type DocumentChooserDialogResult = EngagementDocument | null;

const DOCTYPE_LABELS: Record<string, string> = {
  security_requirements: 'Security',
  sow: 'SOW',
  budget: 'Budget',
  legal_terms: 'Legal',
  compliance: 'Compliance',
  functional_spec: 'Functional',
  other: 'Other',
};

@Component({
  selector: 'app-document-chooser-dialog',
  standalone: true,
  imports: [
    MatDialogModule, MatButtonModule, MatIconModule,
    MatListModule, MatChipsModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './document-chooser-dialog.component.html',
  styleUrl: './document-chooser-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentChooserDialog implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<DocumentChooserDialog>);
  private readonly data: DocumentChooserDialogData = inject(MAT_DIALOG_DATA);
  private readonly docService = inject(DocumentService);
  private readonly snackBar = inject(MatSnackBar);

  readonly documents = signal<EngagementDocument[]>([]);
  readonly loading = signal(true);
  readonly selectedDocId = signal<string | null>(this.data.selectedDocId ?? null);

  async ngOnInit(): Promise<void> {
    try {
      const docs = await this.docService.listDocuments(this.data.engagementId);
      this.documents.set(docs);
    } catch (err: any) {
      this.snackBar.open(`Failed to load documents: ${err.message}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

  selectDoc(doc: EngagementDocument): void {
    this.selectedDocId.set(doc.id);
  }

  confirm(): void {
    const selected = this.documents().find(d => d.id === this.selectedDocId());
    this.dialogRef.close(selected ?? null);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  fileIcon(mimeType?: string | null): string {
    return this.docService.getFileIcon(mimeType);
  }

  fileSize(bytes?: number | null): string {
    return this.docService.formatFileSize(bytes);
  }

  displayName(doc: EngagementDocument): string {
    return doc.display_name || doc.filename;
  }

  typeLabel(docType: string): string {
    return DOCTYPE_LABELS[docType] || docType;
  }
}
