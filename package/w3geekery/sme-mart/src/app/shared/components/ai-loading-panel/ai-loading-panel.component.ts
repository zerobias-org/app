import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-ai-loading-panel',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule, MatProgressSpinnerModule],
  template: `
    <div class="ai-loading-panel">
      <div class="loading-header">
        <mat-spinner [diameter]="32"></mat-spinner>
        <h3>{{ message || 'Generating bid draft...' }}</h3>
      </div>

      <mat-progress-bar
        mode="determinate"
        [value]="percent"
        class="loading-bar">
      </mat-progress-bar>

      <p class="loading-detail">{{ percent }}% complete</p>

      <div class="loading-info">
        <mat-icon>info</mat-icon>
        <p>
          The AI is analyzing the RFP requirements and your organization's profile
          to draft a tailored response. This typically takes 15-30 seconds.
        </p>
      </div>

      <button mat-stroked-button (click)="cancelled.emit()" class="cancel-btn">
        <mat-icon>close</mat-icon> Cancel
      </button>
    </div>
  `,
  styles: [`
    .ai-loading-panel {
      max-width: 500px;
      margin: 40px auto;
      padding: 32px;
      text-align: center;
    }

    .loading-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
      }
    }

    .loading-bar {
      margin-bottom: 8px;
    }

    .loading-detail {
      font-size: 13px;
      color: var(--mat-sys-on-surface-variant, #666);
      margin: 0 0 24px;
    }

    .loading-info {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 12px 16px;
      background: var(--mat-sys-surface-container, #f5f5f5);
      border-radius: 8px;
      text-align: left;
      margin-bottom: 24px;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--mat-sys-on-surface-variant, #666);
        flex-shrink: 0;
        margin-top: 2px;
      }

      p {
        margin: 0;
        font-size: 13px;
        color: var(--mat-sys-on-surface-variant, #555);
        line-height: 1.5;
      }
    }

    .cancel-btn {
      color: var(--mat-sys-on-surface-variant, #666);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiLoadingPanel {
  @Input() message = '';
  @Input() percent = 0;
  @Output() cancelled = new EventEmitter<void>();
}
