import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { BoardCardComponent, type BoardCardData, type BoardPinToggle } from './board-card.component';

/**
 * Responsive board card grid with pin-to-expand-in-place affordance
 * (Sketch 001 Variant A, L-5).
 *
 * Dependency-free of SME-Mart-specific services (L-12): the parent owns board data
 * and pin state; this component is a pure presenter that emits pin/drill events.
 * Reusable across engagement-scoped and project-scoped surfaces, and hoistable to
 * ngx-library later without rewrite.
 */
@Component({
  selector: 'app-boards-grid',
  standalone: true,
  imports: [BoardCardComponent],
  templateUrl: './boards-grid.component.html',
  styleUrl: './boards-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardsGridComponent {
  /** Boards to render (already ordered by the parent). */
  readonly boards = input<BoardCardData[]>([]);

  /** Board ids currently pinned (parent-owned state). */
  readonly pinnedBoardIds = input<string[]>([]);

  /** Max tasks each pinned card may preview. */
  readonly maxPreviewTasks = input<number>(25);

  /** Emits the board id when a card's drill affordance is clicked. */
  readonly cardClicked = output<string>();

  /** Emits when a card's pin affordance is toggled. */
  readonly pinToggled = output<BoardPinToggle>();

  isPinned(boardId: string): boolean {
    return this.pinnedBoardIds().includes(boardId);
  }
}
