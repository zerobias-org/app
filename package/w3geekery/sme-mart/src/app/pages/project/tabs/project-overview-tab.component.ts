import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { ProjectContextService } from '../../../core/services/project-context.service';

@Component({
  selector: 'app-project-overview-tab',
  standalone: true,
  imports: [DatePipe, MatCardModule, MatChipsModule, MatIconModule],
  template: `
    <div class="project-overview">
      @if (ctx.project(); as proj) {
        <div class="overview-grid">
          <mat-card>
            <mat-card-header>
              <mat-card-title>Project Details</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <dl class="detail-list">
                <dt>Status</dt>
                <dd>{{ proj.status }}</dd>
                <dt>Start Date</dt>
                <dd>{{ proj.startDate | date:'mediumDate' }}</dd>
                @if (proj.targetEndDate) {
                  <dt>Target End</dt>
                  <dd>{{ proj.targetEndDate | date:'mediumDate' }}</dd>
                }
                <dt>Created</dt>
                <dd>{{ proj.createdAt | date:'medium' }}</dd>
              </dl>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-header>
              <mat-card-title>Boundaries</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p class="placeholder-text">
                <mat-icon>security</mat-icon>
                Boundary associations will appear here once linked.
              </p>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-header>
              <mat-card-title>Team</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p class="placeholder-text">
                <mat-icon>group</mat-icon>
                Project members from boundary will appear here.
              </p>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-header>
              <mat-card-title>Milestones</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p class="placeholder-text">
                <mat-icon>flag</mat-icon>
                Plan milestones will appear here once created.
              </p>
            </mat-card-content>
          </mat-card>
        </div>
      }
    </div>
  `,
  styles: [`
    .project-overview {
      padding: 1rem 0;
    }

    .overview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
    }

    .detail-list {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.5rem 1rem;
      margin: 0;

      dt {
        font-weight: 500;
        color: var(--zb-secondary-text);
      }

      dd {
        margin: 0;
      }
    }

    .placeholder-text {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--zb-secondary-text);
      font-style: italic;
      margin: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectOverviewTab {
  readonly ctx = inject(ProjectContextService);
}
