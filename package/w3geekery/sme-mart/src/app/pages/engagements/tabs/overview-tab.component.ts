import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { UUID } from '@zerobias-org/types-core-js';
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
    MatTooltipModule,
    MatSnackBarModule,
    DatePipe,
    TitleCasePipe,
    BidCard,
  ],
  templateUrl: './overview-tab.component.html',
  styleUrl: './_tab-shared.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewTab implements OnInit {
  readonly ctx = inject(EngagementContextService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly engagements = inject(EngagementsService);
  private readonly clientApi = inject(ZerobiasClientApi);

  readonly taskCode = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const eng = this.ctx.engagement();
    if (eng?.zerobias_task_id) {
      try {
        const task = await this.clientApi.platformClient
          .getTaskApi()
          .get(new UUID(eng.zerobias_task_id));
        this.taskCode.set(task.code ?? null);
      } catch {
        // Task lookup failed — show UUID fallback
      }
    }
  }

  copyTaskLink(): void {
    const eng = this.ctx.engagement();
    if (!eng?.zerobias_task_id) return;
    const url = `${window.location.origin}/resource/${eng.zerobias_task_id}`;
    navigator.clipboard.writeText(url).then(() => {
      this.snackBar.open('Link copied', 'OK', { duration: 2000 });
    });
  }

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
