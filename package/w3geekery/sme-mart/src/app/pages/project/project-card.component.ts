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
            <div class="project-chips">
              <mat-chip [class]="'status-' + proj.status" size="small">
                {{ proj.status | titlecase }}
              </mat-chip>
              @if (proj.projectType) {
                <mat-chip [class]="'type-' + proj.projectType" size="small">
                  <mat-icon>{{ getTypeIcon(proj.projectType) }}</mat-icon>
                  {{ proj.projectType | titlecase }}
                </mat-chip>
              }
            </div>
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

    .project-chips {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
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

    // Type colors
    .type-pilot { --mdc-chip-label-text-color: var(--zb-color-warning, #ff9800); }
    .type-rfp { --mdc-chip-label-text-color: var(--zb-color-info, #2196f3); }
    .type-project { --mdc-chip-label-text-color: var(--zb-color-success, #4caf50); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCard {
  readonly project = input.required<SmeMartProject>();

  getTypeIcon(type: string): string {
    switch (type) {
      case 'rfp':
        return 'description';
      case 'pilot':
        return 'science';
      case 'project':
        return 'folder_open';
      default:
        return 'folder_special';
    }
  }
}
