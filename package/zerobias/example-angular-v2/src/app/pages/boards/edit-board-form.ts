import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  input,
  signal,
} from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { BoardStatus, BoardType, UpdateBoard } from '@zerobias-com/platform-sdk';
import type { BoardExtended } from '@zerobias-com/portal-sdk';

import { CallReveal, objectLiteral } from '../../shared/call-reveal/call-reveal';
import { exampleUpdatedBoard } from './fixtures';

export interface EditForm {
  name: string;
  status: string;
  boardType: string;
  description: string;
}

/** The subset of the original board the delta is compared against (BoardExtended satisfies it). */
export interface EditBoardBaseline {
  name: string;
  status: { toString(): string };
  boardType: { toString(): string };
  description?: string | null;
}

/**
 * EditBoardForm — the board sibling of EditProjectForm. Builds a DELTA: `UpdateBoard` is partial
 * (name/description/status/boardType, all optional), so only CHANGED fields are set; an emptied
 * description becomes `null` (clear) vs `undefined` (leave). Reveals the call + payload + fixture
 * response. Nothing is sent.
 */
@Component({
  selector: 'app-edit-board-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, CallReveal],
  template: `
    <form class="edit-form" (submit)="$event.preventDefault()">
      <div class="form-fields">
        <div class="field">
          <label for="eb-name">Name</label>
          <input id="eb-name" [formField]="ebForm.name" autocomplete="off" />
        </div>

        <div class="field">
          <label for="eb-status">Status</label>
          <select id="eb-status" [formField]="ebForm.status">
            @for (o of statuses; track o.value) { <option [value]="o.value">{{ o.label }}</option> }
          </select>
        </div>

        <div class="field">
          <label for="eb-type">Type</label>
          <select id="eb-type" [formField]="ebForm.boardType">
            @for (o of types; track o.value) { <option [value]="o.value">{{ o.label }}</option> }
          </select>
        </div>

        <div class="field">
          <label for="eb-desc">Description</label>
          <textarea id="eb-desc" rows="3" [formField]="ebForm.description"></textarea>
        </div>
      </div>

      <div class="form-code">
        <app-call-reveal [call]="call()" [response]="exampleResponse" />
      </div>
    </form>
  `,
  styles: `
    .edit-form { display: grid; grid-template-columns: 1fr 2fr; gap: var(--zb-spacing-lg); align-items: start; }
    .form-fields { display: flex; flex-direction: column; gap: var(--zb-spacing-md); min-width: 0; }
    .form-code { min-width: 0; }
    @media (max-width: 900px) { .edit-form { grid-template-columns: 1fr; } }
    .field { display: flex; flex-direction: column; gap: var(--zb-spacing-xs); }
    label { color: var(--zb-secondary-text); font-size: var(--zb-font-size-sm); }
    input, select, textarea {
      padding: var(--zb-spacing-xs) var(--zb-spacing-sm);
      border: 1px solid var(--zb-divider);
      border-radius: 6px;
      background: var(--zb-background);
      color: var(--zb-text);
      font-size: var(--zb-font-size-md);
      font-family: inherit;
    }
    textarea { resize: vertical; }
    input:focus, select:focus, textarea:focus { outline: 2px solid var(--zb-primary); outline-offset: -1px; }
  `,
})
export class EditBoardForm implements OnInit {
  /** The board being edited — seeds the form and is the baseline for the delta. */
  readonly board = input.required<BoardExtended>();

  protected readonly statuses = BoardStatus.values.map(toOption);
  protected readonly types = BoardType.values.map(toOption);
  protected readonly exampleResponse = exampleUpdatedBoard;

  /** The call WITH its delta inline — edit a field and watch it appear in the payload. */
  protected readonly call = computed(() =>
    [
      `// UpdateBoard is partial — send ONLY the fields that changed.`,
      `const changes: UpdateBoard = ${objectLiteral(this.request())};`,
      `const updated = await platformClient.getBoardApi().update(boardId, changes);`,
    ].join('\n'),
  );

  private readonly model = signal<EditForm>(EMPTY_FORM);
  protected readonly ebForm = form(this.model);

  ngOnInit(): void {
    this.model.set(seedFrom(this.board()));
  }

  /** The REAL `UpdateBoard` delta, via the pure `buildUpdateBoard` (below). */
  protected readonly request = computed(() => buildUpdateBoard(this.model(), this.board()));

}

/** Map an SDK EnumValue to a select {value, label} once, up front — no per-render template call. */
function toOption(v: { toString(): string }): { value: string; label: string } {
  const value = String(v);
  return { value, label: value.charAt(0).toUpperCase() + value.slice(1) };
}

const EMPTY_FORM: EditForm = { name: '', status: '', boardType: '', description: '' };

function seedFrom(b: BoardExtended): EditForm {
  return {
    name: b.name,
    status: String(b.status),
    boardType: String(b.boardType),
    description: b.description ?? '',
  };
}

/**
 * Build the REAL `UpdateBoard` DELTA — a pure function. Only changed fields are set (the rest drop
 * from the partial payload); an emptied description becomes `null` (clear). Nothing is sent.
 */
export function buildUpdateBoard(model: EditForm, baseline: EditBoardBaseline): UpdateBoard {
  // A typed `UpdateBoard` delta: only changed fields are assigned. `null` is not absence — it is an
  // explicit "clear this field" (field type is `string | null`), which is why an emptied
  // description becomes null and survives to the wire.
  const delta: UpdateBoard = {};
  const name = model.name.trim();
  if (name && name !== baseline.name) delta.name = name;
  if (model.status !== String(baseline.status)) delta.status = BoardStatus.from(model.status);
  if (model.boardType !== String(baseline.boardType)) {
    delta.boardType = BoardType.from(model.boardType);
  }
  if (model.description.trim() !== (baseline.description ?? '')) {
    delta.description = model.description.trim() || null;
  }
  return delta;
}
