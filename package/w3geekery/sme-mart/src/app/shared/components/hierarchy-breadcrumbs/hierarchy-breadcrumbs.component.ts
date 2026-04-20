import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { HierarchyBreadcrumb, HierarchyLevel } from '../../../core/services/engagement-hierarchy.service';
import { EngagementHierarchyService } from '../../../core/services/engagement-hierarchy.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-hierarchy-breadcrumbs',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatTooltipModule],
  template: `
    <nav class="hierarchy-breadcrumbs" aria-label="Engagement hierarchy">
      @for (crumb of crumbs(); track crumb.level + (crumb.tagId || crumb.taskId || '')) {
        @if (!$first) {
          <mat-icon class="separator">chevron_right</mat-icon>
        }
        <button
          mat-button
          class="crumb-btn"
          [class.active]="crumb.active"
          [class.clickable]="!crumb.active"
          [matTooltip]="hierarchy.levelLabel(crumb.level)"
          [disabled]="crumb.active"
          (click)="navigate.emit(crumb)">
          <mat-icon class="crumb-icon">{{ hierarchy.levelIcon(crumb.level) }}</mat-icon>
          <span class="crumb-label">{{ crumb.label }}</span>
          <span class="crumb-level">{{ hierarchy.levelLabel(crumb.level) }}</span>
        </button>
      }
    </nav>
  `,
  styles: [`
    .hierarchy-breadcrumbs {
      display: flex;
      align-items: center;
      gap: 2px;
      flex-wrap: wrap;
      padding: 4px 0;
    }

    .separator {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--mat-sys-outline-variant, rgba(255, 255, 255, 0.3));
    }

    .crumb-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      min-height: 32px;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 13px;
      text-transform: none;
      letter-spacing: normal;

      &.active {
        background: var(--mat-sys-surface-variant, rgba(255, 255, 255, 0.08));
        font-weight: 500;
      }

      &.clickable:hover {
        background: var(--mat-sys-surface-variant, rgba(255, 255, 255, 0.05));
      }
    }

    .crumb-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      opacity: 0.7;
    }

    .crumb-label {
      font-family: monospace;
      font-size: 12px;
    }

    .crumb-level {
      font-size: 11px;
      opacity: 0.5;
      margin-left: 2px;
    }
  `],
})
export class HierarchyBreadcrumbsComponent {
  protected readonly hierarchy = inject(EngagementHierarchyService);

  readonly crumbs = input.required<HierarchyBreadcrumb[]>();
  readonly navigate = output<HierarchyBreadcrumb>();
}
