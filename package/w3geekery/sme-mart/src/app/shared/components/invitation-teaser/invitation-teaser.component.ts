import { Component, Input, Output, EventEmitter, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import type { SmeMartProject } from '../../../core/models';
import { TeaserReasonDialogComponent } from './teaser-reason-dialog.component';

@Component({
  selector: 'app-invitation-teaser',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    FormsModule,
  ],
  templateUrl: './invitation-teaser.component.html',
  styleUrl: './invitation-teaser.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvitationTeaserComponent {
  @Input() project!: SmeMartProject;
  @Output() requestInvitation = new EventEmitter<{ reason: string }>();

  private readonly dialog = inject(MatDialog);
  readonly isRequesting = signal(false);

  openRequestDialog(): void {
    const ref = this.dialog.open(TeaserReasonDialogComponent, {
      width: '400px',
      data: { projectTitle: this.project?.name || 'RFP' },
    });

    ref.afterClosed().subscribe((result) => {
      if (result && result.confirmed) {
        this.requestInvitation.emit({ reason: result.reason });
      }
    });
  }
}
