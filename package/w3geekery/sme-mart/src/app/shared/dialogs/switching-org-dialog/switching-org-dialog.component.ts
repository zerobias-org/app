import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface SwitchingOrgDialogData {
  orgName: string;
}

@Component({
  selector: 'app-switching-org-dialog',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatDialogModule],
  template: `
    <div class="switching-org-dialog">
      <div class="spinner-container">
        <mat-spinner diameter="48"></mat-spinner>
      </div>
      <h2 mat-dialog-title>Switching Organization</h2>
      <mat-dialog-content>
        <p>Please wait while we load {{ data.orgName }}.</p>
      </mat-dialog-content>
    </div>
  `,
  styles: [`
    .switching-org-dialog {
      min-width: 300px;
      text-align: center;
    }

    .spinner-container {
      padding: 1.5rem 0 1rem;
      display: flex;
      justify-content: center;
    }

    h2 {
      margin: 0.5rem 0 0;
      font-size: 1.25rem;
    }

    p {
      margin: 0.5rem 0 0;
      color: var(--mat-sys-on-surface-variant);
      font-size: 14px;
      line-height: 1.5;
    }

    mat-dialog-content {
      padding: 0.5rem 0 1rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwitchingOrgDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: SwitchingOrgDialogData) {}
}
