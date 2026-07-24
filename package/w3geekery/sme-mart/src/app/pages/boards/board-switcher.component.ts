import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { UUID } from '@zerobias-org/types-core-js';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import type { Board } from '@zerobias-com/platform-sdk';

/** Scope used to fetch sibling boards (Foundation: always a project scope). */
export interface BoardSwitcherScope {
  readonly type: 'project';
  readonly id: string;
}

interface SwitcherBoard {
  readonly id: string;
  readonly name: string;
}

/**
 * Sibling-board selector (L-13, D-Q8). Emits `boardChanged` with the chosen id; the
 * parent owns navigation (full URL nav). Hidden when there is only one board.
 *
 * Dependency-free of SME-Mart domain services — only Material + the ZeroBias SDK.
 */
@Component({
  selector: 'app-board-switcher',
  standalone: true,
  imports: [MatButtonModule, MatMenuModule, MatIconModule],
  templateUrl: './board-switcher.component.html',
  styleUrl: './board-switcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardSwitcherComponent {
  private readonly clientApi = inject(ZerobiasClientApi);

  readonly scope = input<BoardSwitcherScope | null>(null);
  readonly selectedBoardId = input<string | null>(null);

  readonly boardChanged = output<string>();

  readonly boards = signal<SwitcherBoard[]>([]);

  readonly currentBoardName = computed<string>(() => {
    const id = this.selectedBoardId();
    return this.boards().find((b) => b.id === id)?.name ?? 'Select board';
  });

  private lastScopeId: string | null = null;

  constructor() {
    effect(() => {
      const scope = this.scope();
      if (!scope || scope.id === this.lastScopeId) {
        return;
      }
      this.lastScopeId = scope.id;
      void this.fetchSiblings(scope.id);
    });
  }

  onBoardSelect(boardId: string): void {
    this.boardChanged.emit(boardId);
  }

  private async fetchSiblings(projectId: string): Promise<void> {
    try {
      const result = await this.clientApi.platformClient
        .getBoardApi()
        .list(1, 50, undefined, undefined, undefined, new UUID(projectId));
      this.boards.set(
        (result?.items ?? []).map((b: Board) => ({ id: String(b.id), name: b.name })),
      );
    } catch (err) {
      console.error('[BoardSwitcher] Failed to load sibling boards:', err);
      this.boards.set([]);
    }
  }
}
