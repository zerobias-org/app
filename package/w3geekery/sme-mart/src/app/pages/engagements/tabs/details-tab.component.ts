import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { CurrencyPipe, TitleCasePipe } from '@angular/common';
import { ProposalCard } from '../../../shared/components/proposal-card/proposal-card.component';
import { EngagementContextService } from '../../../core/services/engagement-context.service';

@Component({
  selector: 'app-details-tab',
  standalone: true,
  imports: [
    MatCardModule,
    MatDividerModule,
    CurrencyPipe,
    TitleCasePipe,
    ProposalCard,
  ],
  templateUrl: './details-tab.component.html',
  styleUrl: './_tab-shared.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailsTab {
  readonly ctx = inject(EngagementContextService);
}
