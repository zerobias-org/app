import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { BoardCardPinnedPreviewComponent } from './board-card-pinned-preview.component';

/**
 * Atomic, RDF-serializable board view-model consumed by the card (C-2 RDF Compass).
 *
 * Every field is a discrete, typed property — no mixed-axis strings, no positional
 * ordering, no encoded state. Round-trippable to RDF triples
 * (`board:id rdf:type Board; board:name "..."; board:boardType "..."`) so the future
 * Holon/RDF projection never has to decode a proprietary string format.
 */
export interface BoardCardData {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly boardType: string;
  readonly status: string;
  readonly isDefault: boolean;
}

/** Payload emitted when a card's pin affordance is toggled. */
export interface BoardPinToggle {
  readonly boardId: string;
  readonly isPinned: boolean;
}

/**
 * Presentation-only board card. No data-fetching, no SME-Mart service injection (L-12).
 *
 * Pin and drill are coexistent affordances (L-4): pin emits a toggle for the parent
 * to persist; drill emits a navigation request. The parent owns all state.
 */
@Component({
  selector: 'app-board-card',
  standalone: true,
  imports: [
    TitleCasePipe,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    BoardCardPinnedPreviewComponent,
  ],
  templateUrl: './board-card.component.html',
  styleUrl: './board-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardCardComponent {
  /** The board to render (atomic view-model, C-2). */
  readonly board = input.required<BoardCardData>();

  /** Whether this card is currently pinned (parent-owned state). */
  readonly isPinned = input<boolean>(false);

  /** Max tasks the pinned preview may show (Sketch 001 Variant A: <= 25). */
  readonly maxPreviewTasks = input<number>(25);

  /** Emits when the pin affordance is toggled. */
  readonly pinToggled = output<BoardPinToggle>();

  /** Emits the board id when the drill affordance is clicked. */
  readonly cardClicked = output<string>();

  onPin(): void {
    this.pinToggled.emit({ boardId: this.board().id, isPinned: !this.isPinned() });
  }

  onDrill(): void {
    this.cardClicked.emit(this.board().id);
  }
}
