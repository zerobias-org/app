import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TitleCasePipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UUID } from '@zerobias-org/types-core-js';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import type { Board } from '@zerobias-com/platform-sdk';

interface BoardRow {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  boardType: string;
  status: string;
  created: string | null;
}

@Component({
  selector: 'app-project-boards-tab',
  standalone: true,
  imports: [
    TitleCasePipe,
    DatePipe,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="boards-tab">
      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="32" />
        </div>
      } @else if (boards().length === 0) {
        <div class="empty-state">
          <mat-icon>view_kanban</mat-icon>
          <h3>No boards yet</h3>
          <p>This project has no boards.</p>
        </div>
      } @else {
        <div class="boards-grid">
          @for (b of boards(); track b.id) {
            <mat-card class="board-card">
              <mat-card-header>
                <mat-card-title>
                  {{ b.name }}
                  @if (b.isDefault) {
                    <mat-chip class="default-chip">Default</mat-chip>
                  }
                </mat-card-title>
                <mat-card-subtitle>
                  {{ b.boardType | titlecase }} &middot; {{ b.status | titlecase }}
                </mat-card-subtitle>
              </mat-card-header>
              @if (b.description) {
                <mat-card-content>
                  <p>{{ b.description }}</p>
                </mat-card-content>
              }
              @if (b.created) {
                <mat-card-footer class="board-footer">
                  Created {{ b.created | date:'mediumDate' }}
                </mat-card-footer>
              }
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .boards-tab {
      padding: 1.5rem;
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
      padding: 4rem 2rem;
      color: var(--mat-sys-on-surface-variant);
      text-align: center;
    }
    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.5;
      margin-bottom: 1rem;
    }
    .empty-state h3 {
      margin: 0 0 0.5rem;
      font-weight: 500;
    }
    .empty-state p {
      margin: 0;
      font-size: 0.9rem;
    }
    .boards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1rem;
    }
    .board-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .default-chip {
      font-size: 0.75rem;
      min-height: 22px;
      padding: 0 8px;
    }
    .board-footer {
      padding: 0 16px 16px;
      font-size: 0.8rem;
      color: var(--mat-sys-on-surface-variant);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectBoardsTabComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly clientApi = inject(ZerobiasClientApi);

  readonly boards = signal<BoardRow[]>([]);
  readonly loading = signal(true);

  async ngOnInit(): Promise<void> {
    const projId = this.route.parent?.snapshot.params['projId'] as string | undefined;
    if (!projId) {
      this.loading.set(false);
      return;
    }
    try {
      const projectIdUuid = new UUID(projId);
      // BoardApi.list positional sig: (pageNumber, pageSize, ownerId, orgId,
      // boundaryId, projectId, ...). projectId is server-side filterable.
      const result = await this.clientApi.platformClient
        .getBoardApi()
        .list(1, 100, undefined, undefined, undefined, projectIdUuid);
      const items = (result?.items ?? []).map((b): BoardRow => {
        const raw = b as Board;
        return {
          id: String(raw.id),
          name: raw.name,
          description: raw.description ?? null,
          isDefault: Boolean(raw.isDefault),
          boardType: String(raw.boardType ?? ''),
          status: String(raw.status ?? ''),
          created: raw.created ? raw.created.toDate().toISOString() : null,
        };
      });
      this.boards.set(items);
    } catch (err) {
      console.error('[ProjectBoardsTab] Failed to load boards:', err);
    } finally {
      this.loading.set(false);
    }
  }
}
