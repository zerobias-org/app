import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TitleCasePipe, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SmeMartProjectService } from '../../core/services/sme-mart-project.service';
import { ProjectCard } from './project-card.component';
import type { SmeMartProject } from '../../core/models';

type ViewMode = 'table' | 'cards';

const VIEW_PREF_KEY = 'sme-mart.project-list.viewMode';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    TitleCasePipe,
    DatePipe,
    MatTableModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    ProjectCard,
  ],
  template: `
    <div class="project-list-page">
      <div class="project-list-header">
        <h3>Projects</h3>
        <mat-button-toggle-group
          [value]="viewMode()"
          (change)="setViewMode($event.value)"
          hideSingleSelectionIndicator>
          <mat-button-toggle value="table">
            <mat-icon>table_rows</mat-icon>
          </mat-button-toggle>
          <mat-button-toggle value="cards">
            <mat-icon>grid_view</mat-icon>
          </mat-button-toggle>
        </mat-button-toggle-group>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="32"></mat-spinner>
        </div>
      } @else if (projects().length === 0) {
        <div class="empty-state">
          <mat-icon>folder_off</mat-icon>
          <p>No projects yet for this engagement.</p>
        </div>
      } @else if (viewMode() === 'table') {
        <table mat-table [dataSource]="projects()" class="project-table">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let proj">{{ proj.name }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let proj">
              <mat-chip [class]="'status-' + proj.status" size="small">
                {{ proj.status | titlecase }}
              </mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="startDate">
            <th mat-header-cell *matHeaderCellDef>Start</th>
            <td mat-cell *matCellDef="let proj">{{ proj.startDate | date:'mediumDate' }}</td>
          </ng-container>

          <ng-container matColumnDef="targetEndDate">
            <th mat-header-cell *matHeaderCellDef>Target End</th>
            <td mat-cell *matCellDef="let proj">{{ proj.targetEndDate | date:'mediumDate' }}</td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let proj; columns: displayedColumns;"
            class="clickable-row"
            (click)="openProject(proj)">
          </tr>
        </table>
      } @else {
        <div class="project-cards-grid">
          @for (proj of projects(); track proj.id) {
            <app-project-card
              [project]="proj"
              (click)="openProject(proj)">
            </app-project-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .project-list-page {
      padding: 1rem 0;
    }

    .project-list-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;

      h3 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 500;
      }
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 3rem;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem;
      color: var(--zb-secondary-text);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        opacity: 0.5;
        margin-bottom: 1rem;
      }
    }

    .project-table {
      width: 100%;
    }

    .clickable-row {
      cursor: pointer;

      &:hover {
        background-color: var(--mat-table-row-item-hover-state-layer-color, rgba(0, 0, 0, 0.04));
      }
    }

    .project-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1rem;
    }

    // Status colors
    .status-active { --mdc-chip-label-text-color: var(--zb-color-success); }
    .status-draft { --mdc-chip-label-text-color: var(--zb-color-gray); }
    .status-completed { --mdc-chip-label-text-color: var(--zb-color-info); }
    .status-cancelled { --mdc-chip-label-text-color: var(--zb-color-error); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectList implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly projectService = inject(SmeMartProjectService);

  readonly loading = signal(true);
  readonly projects = signal<SmeMartProject[]>([]);
  readonly viewMode = signal<ViewMode>(this.loadViewPref());

  readonly displayedColumns = ['name', 'status', 'startDate', 'targetEndDate'];

  async ngOnInit(): Promise<void> {
    try {
      // Get engagement ID from parent route (engagements/:id/projects)
      const engagementId = this.route.parent?.snapshot.params['id'];

      const result = engagementId
        ? await this.projectService.listProjectsByEngagement(engagementId, { pageSize: 100 })
        : await this.projectService.listProjects({ pageSize: 100 });

      this.projects.set(result.items);
    } catch (err) {
      console.error('[ProjectList] Failed to load projects:', err);
    } finally {
      this.loading.set(false);
    }
  }

  openProject(proj: SmeMartProject): void {
    this.router.navigate(['/project', proj.id, 'overview']);
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
    try {
      localStorage.setItem(VIEW_PREF_KEY, mode);
    } catch {
      // localStorage may be unavailable
    }
  }

  private loadViewPref(): ViewMode {
    try {
      const stored = localStorage.getItem(VIEW_PREF_KEY);
      if (stored === 'table' || stored === 'cards') return stored;
    } catch {
      // fallback
    }
    return 'cards';
  }
}
