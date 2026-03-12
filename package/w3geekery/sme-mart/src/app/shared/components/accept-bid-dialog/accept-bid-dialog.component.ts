import {
  Component, Inject, ChangeDetectionStrategy, computed, signal,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ComplianceProgress } from '../compliance-progress/compliance-progress.component';
import type { ComplianceSummary } from '../../../core/models';

export interface AcceptBidDialogData {
  bidId: string;
  providerName: string;
  proposedPrice: string | null;
  proposedTimeline: string | null;
  compliance: ComplianceSummary | null;
  otherBidCount: number;
}

export interface AcceptBidDialogResult {
  confirmed: boolean;
}

@Component({
  selector: 'app-accept-bid-dialog',
  standalone: true,
  imports: [
    MatDialogModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatProgressBarModule, CurrencyPipe, DecimalPipe,
    ComplianceProgress,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>check_circle_outline</mat-icon>
      Accept Bid
    </h2>

    <mat-dialog-content>
      <div class="confirm-summary">
        <p class="lead">Accept bid from <strong>{{ data.providerName }}</strong>?</p>

        <div class="bid-details">
          @if (data.proposedPrice) {
            <div class="detail-row">
              <span class="label">Price</span>
              <span class="value">{{ data.proposedPrice | currency:'USD':'symbol':'1.0-0' }}</span>
            </div>
          }
          @if (data.proposedTimeline) {
            <div class="detail-row">
              <span class="label">Timeline</span>
              <span class="value">{{ data.proposedTimeline }}</span>
            </div>
          }
          @if (data.compliance) {
            <div class="detail-row compliance-detail">
              <span class="label">Compliance</span>
              <div class="compliance-inline">
                <span>{{ data.compliance.met }}/{{ data.compliance.total }} met</span>
                <app-compliance-progress
                  [summary]="data.compliance"
                  [compact]="true"
                  [showLabel]="false" />
              </div>
            </div>
          }
        </div>

        <div class="warning-box">
          <mat-icon>warning</mat-icon>
          <div>
            <strong>This action will:</strong>
            <ul>
              <li>Create an engagement between your organizations</li>
              @if (data.otherBidCount > 0) {
                <li>Reject {{ data.otherBidCount }} other pending bid{{ data.otherBidCount > 1 ? 's' : '' }}</li>
              }
              <li>Transition the RFP to "In Progress"</li>
            </ul>
          </div>
        </div>

        @if (accepting()) {
          <mat-progress-bar mode="indeterminate" />
          <p class="accepting-msg">Creating engagement...</p>
        }
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button
              [disabled]="accepting()"
              (click)="onCancel()">
        Cancel
      </button>
      <button mat-flat-button color="primary"
              [disabled]="accepting()"
              (click)="onConfirm()">
        <mat-icon>check</mat-icon>
        Accept Bid
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
    }

    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      mat-icon {
        color: var(--zb-color-success, #4caf50);
      }
    }

    .confirm-summary {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      min-width: 400px;
    }

    .lead {
      font-size: 1rem;
      margin: 0;
    }

    .bid-details {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      background: var(--mat-sys-surface-container);
    }

    .detail-row {
      display: flex;
      align-items: center;
      gap: 1rem;

      .label {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--zb-secondary-text);
        min-width: 80px;
      }

      .value {
        font-weight: 500;
      }
    }

    .compliance-detail {
      align-items: flex-start;
    }

    .compliance-inline {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      flex: 1;
    }

    .warning-box {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      background: rgba(255, 152, 0, 0.08);
      border-left: 3px solid #ff9800;

      mat-icon {
        color: #ff9800;
        flex-shrink: 0;
        margin-top: 2px;
      }

      ul {
        margin: 0.25rem 0 0;
        padding-left: 1.25rem;
        font-size: 0.875rem;
        line-height: 1.6;
      }

      strong {
        font-size: 0.875rem;
      }
    }

    .accepting-msg {
      font-size: 0.85rem;
      color: var(--zb-secondary-text);
      text-align: center;
      margin: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcceptBidDialog {
  readonly accepting = signal(false);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AcceptBidDialogData,
    private readonly dialogRef: MatDialogRef<AcceptBidDialog, AcceptBidDialogResult>,
  ) {}

  onCancel(): void {
    this.dialogRef.close({ confirmed: false });
  }

  onConfirm(): void {
    this.accepting.set(true);
    this.dialogRef.close({ confirmed: true });
  }
}
