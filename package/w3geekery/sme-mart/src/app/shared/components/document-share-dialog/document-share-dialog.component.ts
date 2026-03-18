import {
  Component, inject, signal, computed, ChangeDetectionStrategy, OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { TitleCasePipe } from '@angular/common';
import { ZbDialogComponent } from '@zerobias-org/ngx-library';
import { OrgDocumentService } from '../../../core/services/org-document.service';
import { EngagementsService } from '../../core/services/engagements.service';
import { SmeMartTagService } from '../../../core/services/sme-mart-tag.service';
import type { OrgDocument, OrgDocumentShare, ShareTargetType, ShareVisibility } from '../../../core/models/org-document.model';
import type { EngagementSummaryRow } from '../../../core/models';

export interface DocumentShareDialogData {
  document: OrgDocument;
  orgId: string;
}

export interface DocumentShareDialogResult {
  sharesCreated: number;
}

interface ShareTarget {
  id: string;
  name: string;
  type: ShareTargetType;
  status?: string;
  alreadyShared: boolean;
  selected: boolean;
}

@Component({
  selector: 'app-document-share-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule,
    MatCheckboxModule, MatChipsModule, MatDividerModule, MatRadioModule, MatSnackBarModule,
    MatProgressSpinnerModule, MatTabsModule,
    ZbDialogComponent,
    TitleCasePipe,
  ],
  template: `
    <zb-dialog
      title="Share Document"
      [subTitle]="'Share \\'' + data.document.display_name + '\\' with engagements'"
      actionLabel="Share"
      [actionDisabled]="selectedCount() === 0 || saving()"
      [actionProcessing]="saving()"
      cancelLabel="Cancel"
      [showCloseX]="true"
      (action)="share()"
      (cancel)="close()"
    >
      <div class="share-content">
        <!-- Search -->
        <mat-form-field appearance="outline" class="search-field" subscriptSizing="dynamic">
          <mat-icon matPrefix>search</mat-icon>
          <input matInput
            placeholder="Search engagements..."
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)">
        </mat-form-field>

        @if (loading()) {
          <div class="loading-state">
            <mat-spinner diameter="32" />
            <span>Loading engagements...</span>
          </div>
        } @else if (filteredTargets().length === 0) {
          <div class="empty-state">
            <mat-icon>folder_off</mat-icon>
            <p>No engagements found.</p>
          </div>
        } @else {
          <div class="target-list">
            @for (target of filteredTargets(); track target.id) {
              <div class="target-row" [class.already-shared]="target.alreadyShared">
                <mat-checkbox
                  [checked]="target.selected || target.alreadyShared"
                  [disabled]="target.alreadyShared"
                  (change)="toggleTarget(target)"
                />
                <div class="target-info">
                  <span class="target-name">{{ target.name }}</span>
                  @if (target.status) {
                    <span class="target-status" [attr.data-status]="target.status">
                      {{ target.status | titlecase }}
                    </span>
                  }
                </div>
                @if (target.alreadyShared) {
                  <mat-icon class="shared-icon" matTooltip="Already shared">check_circle</mat-icon>
                }
              </div>
            }
          </div>
        }

        @if (selectedCount() > 0) {
          <mat-divider class="visibility-divider" />

          <!-- Visibility -->
          <div class="visibility-section">
            <label class="visibility-label">Visibility</label>
            <mat-radio-group [value]="visibility()" (change)="visibility.set($event.value)">
              <mat-radio-button value="all">
                <span class="radio-text">All parties</span>
              </mat-radio-button>
              <mat-radio-button value="provider_only">
                <span class="radio-text">Provider / Assessor only</span>
              </mat-radio-button>
              <mat-radio-button value="buyer_only">
                <span class="radio-text">Buyer / Client only</span>
              </mat-radio-button>
            </mat-radio-group>
          </div>

          <div class="selection-summary">
            <mat-icon>share</mat-icon>
            <span>{{ selectedCount() }} engagement{{ selectedCount() === 1 ? '' : 's' }} selected
              @if (visibility() !== 'all') {
                · {{ visibilityLabel() }}
              }
            </span>
          </div>
        }
      </div>
    </zb-dialog>
  `,
  styles: [`
    .share-content {
      min-width: 400px;
      max-height: 500px;
      display: flex;
      flex-direction: column;
    }

    .search-field { width: 100%; margin-bottom: 8px; }

    .loading-state, .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 32px 0;
      color: var(--mat-sys-on-surface-variant, #666);
    }

    .empty-state {
      flex-direction: column;
      mat-icon { font-size: 36px; width: 36px; height: 36px; }
    }

    .target-list {
      max-height: 320px;
      overflow-y: auto;
      border: 1px solid var(--mat-sys-outline-variant, #e0e0e0);
      border-radius: 8px;
    }

    .target-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border-bottom: 1px solid var(--mat-sys-outline-variant, #f0f0f0);

      &:last-child { border-bottom: none; }
      &.already-shared { opacity: 0.6; }
      &:hover:not(.already-shared) { background: var(--mat-sys-surface-variant, #f5f5f5); }
    }

    .target-info {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .target-name {
      font-size: 14px;
      font-weight: 500;
    }

    .target-status {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 12px;
      background: var(--mat-sys-surface-variant, #e0e0e0);
      color: var(--mat-sys-on-surface-variant, #666);

      &[data-status="in_progress"] { background: #d7e0ee; }
      &[data-status="completed"] { background: #d8ecba; }
      &[data-status="cancelled"] { background: #eed5d1; }
    }

    .shared-icon {
      color: var(--mat-sys-primary, #1976d2);
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .visibility-divider { margin: 12px 0 8px; }

    .visibility-section {
      display: flex;
      flex-direction: column;
      gap: 4px;

      mat-radio-group {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
    }

    .visibility-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--mat-sys-on-surface-variant, #666);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .radio-text {
      font-size: 13px;
    }

    .selection-summary {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 0 0;
      font-size: 13px;
      color: var(--mat-sys-primary, #1976d2);
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentShareDialog implements OnInit {
  readonly data = inject<DocumentShareDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<DocumentShareDialog>);
  private readonly orgDocService = inject(OrgDocumentService);
  private readonly engagements = inject(EngagementsService);
  private readonly tagService = inject(SmeMartTagService);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly searchQuery = signal('');
  readonly targets = signal<ShareTarget[]>([]);
  readonly visibility = signal<ShareVisibility>('all');

  readonly filteredTargets = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const all = this.targets();
    if (!query) return all;
    return all.filter(t => t.name.toLowerCase().includes(query));
  });

  readonly selectedCount = computed(() =>
    this.targets().filter(t => t.selected && !t.alreadyShared).length,
  );

  readonly visibilityLabel = computed(() => {
    const labels: Record<ShareVisibility, string> = {
      all: 'All parties',
      buyer_only: 'Buyer only',
      provider_only: 'Provider only',
    };
    return labels[this.visibility()];
  });

  async ngOnInit(): Promise<void> {
    try {
      // Load engagements and existing shares in parallel
      const [engResult, existingShares] = await Promise.all([
        this.engagements.listEngagements({ pageNumber: 1, pageSize: 200 }),
        this.orgDocService.listShares(this.data.document.id),
      ]);

      const sharedEngIds = new Set(
        existingShares
          .filter(s => s.shared_with_type === 'engagement')
          .map(s => s.shared_with_id),
      );

      const engagements = (engResult.items || []).map((eng: EngagementSummaryRow) => ({
        id: eng.id,
        name: eng.title,
        type: 'engagement' as ShareTargetType,
        status: eng.status,
        alreadyShared: sharedEngIds.has(eng.id),
        selected: false,
      }));

      this.targets.set(engagements);
    } catch (err) {
      console.error('[DocumentShareDialog] Failed to load targets:', err);
      this.snackBar.open('Failed to load engagements', 'Dismiss', { duration: 4000 });
    } finally {
      this.loading.set(false);
    }
  }

  toggleTarget(target: ShareTarget): void {
    this.targets.update(list =>
      list.map(t => t.id === target.id ? { ...t, selected: !t.selected } : t),
    );
  }

  async share(): Promise<void> {
    const newSelections = this.targets().filter(t => t.selected && !t.alreadyShared);
    if (newSelections.length === 0) return;

    this.saving.set(true);
    let created = 0;

    try {
      for (const target of newSelections) {
        await this.orgDocService.shareDocument({
          documentId: this.data.document.id,
          targetType: target.type,
          targetId: target.id,
          visibility: this.visibility(),
        });

        // Auto-tag: if engagement has a tag, add it to the document resource
        await this.autoTagOnShare(target);

        created++;
      }

      this.snackBar.open(
        `Shared with ${created} engagement${created === 1 ? '' : 's'}`,
        'OK',
        { duration: 3000 },
      );

      this.dialogRef.close({ sharesCreated: created } as DocumentShareDialogResult);
    } catch (err) {
      console.error('[DocumentShareDialog] Share failed:', err);
      this.snackBar.open('Failed to share document', 'Dismiss', { duration: 4000 });
    } finally {
      this.saving.set(false);
    }
  }

  close(): void {
    this.dialogRef.close(null);
  }

  /** Auto-tag the document's ZB file resource with the engagement's scope tag. */
  private async autoTagOnShare(target: ShareTarget): Promise<void> {
    const zbFileId = this.data.document.zb_file_id;
    if (!zbFileId) return;

    try {
      // Look up the engagement's tag name by searching work_requests
      const engResult = await this.engagements.searchEngagements(
        `(id=${target.id})`, { pageNumber: 1, pageSize: 1 },
      );
      const eng = engResult.items?.[0];
      if (!eng?.engagement_tag) return;

      // Find the ZB tag by name
      const tag = await this.tagService.findTagByName(eng.engagement_tag);
      if (!tag?.id) return;

      // Tag the file resource
      await this.tagService.assignTag(zbFileId, [tag.id.toString()]);
    } catch (err) {
      // Non-blocking — log but don't fail the share
      console.warn('[DocumentShareDialog] Auto-tag failed:', err);
    }
  }
}
