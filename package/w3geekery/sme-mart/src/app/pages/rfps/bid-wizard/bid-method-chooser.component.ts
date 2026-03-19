import {
  Component, Output, EventEmitter, signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import type { BidMethod } from '../../../core/models/bid-ai.model';

@Component({
  selector: 'app-bid-method-chooser',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <div class="method-chooser">
      <h2>How would you like to respond to this RFP?</h2>
      <p class="chooser-subtitle">
        You can have AI draft your bid based on your profile and the RFP requirements,
        or build your response step by step.
      </p>

      <div class="method-cards">
        <!-- AI-Assisted Card -->
        <mat-card class="method-card" appearance="outlined"
          [class.selected]="selectedMethod() === 'ai'"
          (click)="selectMethod('ai')">
          <mat-card-header>
            <mat-icon mat-card-avatar class="card-icon ai-icon">auto_awesome</mat-icon>
            <mat-card-title>AI-Assisted Draft</mat-card-title>
            <mat-card-subtitle>Recommended for faster responses</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>
              AI analyzes the RFP requirements and your organization's profile to
              draft a complete bid response. You review and edit everything before submitting.
            </p>
            <ul>
              <li>Drafts executive summary, cover letter, and team description</li>
              <li>Generates per-requirement compliance responses</li>
              <li>Estimates hours and pricing by category</li>
              <li>All content is fully editable</li>
            </ul>
          </mat-card-content>
        </mat-card>

        <!-- Manual Card -->
        <mat-card class="method-card" appearance="outlined"
          [class.selected]="selectedMethod() === 'manual'"
          (click)="selectMethod('manual')">
          <mat-card-header>
            <mat-icon mat-card-avatar class="card-icon manual-icon">edit_note</mat-icon>
            <mat-card-title>Build Manually</mat-card-title>
            <mat-card-subtitle>Full control, step by step</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>
              Walk through the bid wizard step by step. Write your approach,
              respond to each requirement, and set your pricing manually.
            </p>
            <ul>
              <li>Write your approach and cover letter</li>
              <li>Describe your team and qualifications</li>
              <li>Respond to each requirement individually</li>
              <li>Set pricing and timeline</li>
            </ul>
          </mat-card-content>
        </mat-card>
      </div>

      @if (selectedMethod()) {
        <div class="chooser-actions">
          @if (selectedMethod() === 'ai') {
            <p class="ai-note">
              <mat-icon>info</mat-icon>
              The AI will use your vendor profile and organization documents to draft
              contextual responses. You'll review and edit every field before submitting.
            </p>
          }
          @if (selectedMethod() === 'ai') {
            <button mat-flat-button (click)="confirm()">
              <mat-icon>auto_awesome</mat-icon> Generate AI Draft
            </button>
          } @else {
            <button mat-flat-button (click)="confirm()">
              <mat-icon>edit_note</mat-icon> Start Manual Entry
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .method-chooser {
      max-width: 800px;
      margin: 0 auto;
    }

    h2 {
      font-size: 20px;
      font-weight: 500;
      margin: 0 0 4px;
    }

    .chooser-subtitle {
      color: var(--mat-sys-on-surface-variant, #666);
      font-size: 14px;
      margin: 0 0 24px;
    }

    .method-cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }

    .method-card {
      cursor: pointer;
      transition: border-color 0.2s, box-shadow 0.2s;

      &:hover {
        border-color: var(--mat-sys-primary, #1976d2);
      }

      &.selected {
        border-color: var(--mat-sys-primary, #1976d2);
        box-shadow: 0 0 0 1px var(--mat-sys-primary, #1976d2);
      }
    }

    .card-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      font-size: 20px;
    }

    .ai-icon {
      background: var(--mat-sys-primary-container, #e3f2fd);
      color: var(--mat-sys-on-primary-container, #1565c0);
    }

    .manual-icon {
      background: var(--mat-sys-secondary-container, #e8f5e9);
      color: var(--mat-sys-on-secondary-container, #2e7d32);
    }

    mat-card-content {
      p { margin: 0 0 8px; font-size: 13px; color: var(--mat-sys-on-surface-variant, #666); }
      ul {
        margin: 0;
        padding-left: 20px;
        font-size: 13px;
        color: var(--mat-sys-on-surface-variant, #555);
        li { padding: 2px 0; }
      }
    }

    .chooser-actions {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .ai-note {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 12px 16px;
      background: var(--mat-sys-primary-container, #e3f2fd);
      border-radius: 8px;
      font-size: 13px;
      color: var(--mat-sys-on-primary-container, #1565c0);
      margin: 0;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        flex-shrink: 0;
        margin-top: 2px;
      }
    }

    @media (max-width: 600px) {
      .method-cards {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BidMethodChooser {
  @Output() methodChosen = new EventEmitter<BidMethod>();

  readonly selectedMethod = signal<BidMethod | null>(null);

  selectMethod(method: BidMethod): void {
    this.selectedMethod.set(method);
  }

  confirm(): void {
    const method = this.selectedMethod();
    if (method) {
      this.methodChosen.emit(method);
    }
  }
}
