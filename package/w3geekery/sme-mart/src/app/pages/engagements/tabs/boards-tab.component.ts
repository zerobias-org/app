import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { UUID } from '@zerobias-org/types-core-js';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import type { Board } from '@zerobias-com/platform-sdk';
import { BoardsGridComponent } from '../../../shared/components/boards-grid.component';
import type { BoardCardData, BoardPinToggle } from '../../../shared/components/board-card.component';
import { CreateBoardComponent, type CreateBoardDialogData } from '../../org/dialogs/create-board.component';
import { PIN_STORAGE_TOKEN } from '../../../core/services/pin-storage.interface';

/**
 * Engagement-scoped Boards tab (replaces the legacy Tasks tab — L-1, D-Q12).
 *
 * Owns board fetch and pin state; the shared boards-grid is a read-only consumer
 * (L-12 separation). Pin state is persisted via the PinStorage interface (localStorage
 * now; PKV swap is DI-only — D-Q10).
 *
 * Engagement -> projectId: an engagement IS a platform.Project, so the engagement
 * route `:id` is the project UUID and is passed directly as the `projectId` filter.
 * This is the correct linkage today.
 */
@Component({
  selector: 'app-engagement-boards-tab',
  standalone: true,
  imports: [MatProgressSpinnerModule, MatButtonModule, MatIconModule, BoardsGridComponent],
  templateUrl: './boards-tab.component.html',
  styleUrl: './boards-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EngagementBoardsTabComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clientApi = inject(ZerobiasClientApi);
  private readonly dialog = inject(MatDialog);
  private readonly pinStorage = inject(PIN_STORAGE_TOKEN);

  readonly boards = signal<BoardCardData[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  /** True once pin state is hydrated; gates the first-render derivation. */
  readonly pinsLoaded = signal(false);
  /** Bumped on every setPin so the pinned/unpinned computeds re-derive (Map is untracked). */
  private readonly pinVersion = signal(0);

  readonly pinnedBoards = computed<BoardCardData[]>(() => {
    this.pinVersion();
    return this.pinsLoaded() ? this.boards().filter((b) => this.pinStorage.getPin(b.id)) : [];
  });
  readonly unpinnedBoards = computed<BoardCardData[]>(() => {
    this.pinVersion();
    return this.pinsLoaded() ? this.boards().filter((b) => !this.pinStorage.getPin(b.id)) : this.boards();
  });
  /** Pinned first, then unpinned (Sketch 001 Variant A). */
  readonly displayBoards = computed<BoardCardData[]>(() => [...this.pinnedBoards(), ...this.unpinnedBoards()]);
  readonly pinnedBoardIds = computed<string[]>(() => this.pinnedBoards().map((b) => b.id));

  private engagementId: string | null = null;

  async ngOnInit(): Promise<void> {
    await this.pinStorage.load(); // hydrate the in-memory Map BEFORE first-render derivation
    this.pinsLoaded.set(true);

    this.engagementId = (this.route.parent?.snapshot.params['id'] as string | undefined) ?? null;
    if (!this.engagementId) {
      this.loading.set(false);
      return;
    }
    await this.loadBoards();
  }

  onBoardClick(boardId: string): void {
    this.router.navigate(['/boards', boardId]);
  }

  onPinToggle({ boardId, isPinned }: BoardPinToggle): void {
    this.pinStorage.setPin(boardId, isPinned); // sync Map update + fire-and-forget write-through
    this.pinVersion.update((v) => v + 1); // drive re-derivation (Map mutation is not signal-tracked)
  }

  openCreateBoard(): void {
    if (!this.engagementId) {
      return;
    }
    const data: CreateBoardDialogData = { projectId: this.engagementId };
    this.dialog
      .open(CreateBoardComponent, { data, width: '480px' })
      .afterClosed()
      .subscribe((created) => {
        if (created) {
          void this.loadBoards();
        }
      });
  }

  private async loadBoards(): Promise<void> {
    if (!this.engagementId) {
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      // BoardApi.list positional sig: (pageNumber, pageSize, ownerId, orgId,
      // boundaryId, projectId, ...). projectId filters boards by parent project.
      const result = await this.clientApi.platformClient
        .getBoardApi()
        .list(1, 50, undefined, undefined, undefined, new UUID(this.engagementId));
      this.boards.set((result?.items ?? []).map((b) => this.toCardData(b)));
    } catch (err) {
      console.error('[EngagementBoardsTab] Failed to load boards:', err);
      this.error.set('Failed to load boards.');
    } finally {
      this.loading.set(false);
    }
  }

  private toCardData(b: Board): BoardCardData {
    return {
      id: String(b.id),
      name: b.name,
      description: b.description ?? null,
      boardType: String(b.boardType ?? ''),
      status: String(b.status ?? ''),
      isDefault: Boolean(b.isDefault),
    };
  }
}
