import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { BidCard } from '../../../shared/components/bid-card/bid-card.component';
import { EngagementContextService } from '../../../core/services/engagement-context.service';
import { EngagementsService } from '../../../core/services/engagements.service';

@Component({
  selector: 'app-overview-tab',
  standalone: true,
  imports: [
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    DatePipe,
    TitleCasePipe,
    BidCard,
  ],
  templateUrl: './overview-tab.component.html',
  styleUrl: './_tab-shared.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewTab {
  readonly ctx = inject(EngagementContextService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly engagements = inject(EngagementsService);

  async cancelEngagement(): Promise<void> {
    const eng = this.ctx.engagement();
    if (!eng) return;
    try {
      await this.engagements.cancelEngagement(eng.id);
      this.snackBar.open('Engagement cancelled', 'OK', { duration: 3000 });
      this.ctx.requestRefresh();
    } catch (err: any) {
      this.snackBar.open(`Failed: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
  }
}
