import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Pinned-state task-count label for a board card.
 *
 * Foundation-Phase stub: displays a simple count summary. The actual task-list
 * table wiring happens in Phase 33 (board-detail surface owns the real list).
 *
 * Dependency-free (L-12): no service injection, signal-based I/O only.
 */
@Component({
  selector: 'app-board-card-pinned-preview',
  standalone: true,
  templateUrl: './board-card-pinned-preview.component.html',
  styleUrl: './board-card-pinned-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardCardPinnedPreviewComponent {
  /** Maximum tasks the preview is allowed to show (Sketch 001 Variant A: <= 25). */
  readonly maxTasks = input<number>(25);

  /** Number of tasks currently available for preview. */
  readonly pinnedTaskCount = input<number>(0);

  /** Human label for the count summary. */
  readonly label = computed(() => {
    const count = this.pinnedTaskCount();
    return count === 0 ? 'No tasks' : `${count} tasks`;
  });
}
