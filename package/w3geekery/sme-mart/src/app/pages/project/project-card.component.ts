import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import type { SmeMartProject } from '../../core/models';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [DatePipe, TitleCasePipe, MatCardModule, MatChipsModule, MatIconModule],
  template: `
    @if (project(); as proj) {
      <mat-card class="project-card" appearance="outlined">
        <mat-card-header>
          <mat-icon mat-card-avatar class="project-icon">folder_special</mat-icon>
          <mat-card-title>{{ proj.name }}</mat-card-title>
          <mat-card-subtitle>
            <mat-chip [class]="'status-' + proj.status" size="small">
              {{ proj.status | titlecase }}
            </mat-chip>
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (proj.description) {
            <p class="project-desc">{{ proj.description }}</p>
          }
          <div class="project-meta">
            <span class="meta-item">
              <mat-icon>calendar_today</mat-icon>
              {{ proj.startDate | date:'mediumDate' }}
            </span>
            @if (proj.targetEndDate) {
              <span class="meta-item">
                <mat-icon>event</mat-icon>
                {{ proj.targetEndDate | date:'mediumDate' }}
              </span>
            }
          </div>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [`
    .project-card {
      cursor: pointer;
      transition: box-shadow 0.2s;

      &:hover {
        box-shadow: var(--mat-card-elevated-container-shadow, 0 2px 6px rgba(0, 0, 0, 0.15));
      }
    }

    .project-icon {
      color: var(--zb-color-primary);
    }

    .project-desc {
      margin: 0.5rem 0;
      color: var(--zb-secondary-text);
      font-size: 0.875rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .project-meta {
      display: flex;
      gap: 1rem;
      margin-top: 0.5rem;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8rem;
      color: var(--zb-secondary-text);

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }

    // Status colors
    .status-active { --mdc-chip-label-text-color: var(--zb-color-success); }
    .status-draft { --mdc-chip-label-text-color: var(--zb-color-gray); }
    .status-completed { --mdc-chip-label-text-color: var(--zb-color-info); }
    .status-cancelled { --mdc-chip-label-text-color: var(--zb-color-error); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCard {
  readonly project = input.required<SmeMartProject>();
}
