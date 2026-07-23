import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { BoardStatus, BoardType, NewBoard } from '@zerobias-com/platform-sdk';
import type { UUID } from '@zerobias-org/types-core-js';

import { SessionService } from '../../core/session.service';
import { CallReveal, objectLiteral } from '../../shared/call-reveal/call-reveal';
import { exampleBoard } from './fixtures';

interface CreateForm {
  name: string;
  status: string;
  boardType: string;
  description: string;
  projectId: string;
}

/**
 * CreateBoardForm — the board sibling of CreateProjectForm. Builds a REAL `NewBoard` from live input
 * (typechecking the shape against the installed platform-sdk) and reveals the call + payload + an
 * obfuscated response. It NEVER calls `create`.
 *
 * `projectId`, when set (opening this from a project), places the board in that project's chain —
 * that's just a `NewBoard` with `projectId`.
 */
@Component({
  selector: 'app-create-board-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, CallReveal],
  template: `
    <form class="create-form" (submit)="$event.preventDefault()">
      <div class="form-fields">
        @if (projectId()) {
          <p class="note">
            Placing this board in a <strong>project</strong> — <code>projectId</code> is set from the
            project you opened this from.
          </p>
        }

        <div class="field">
          <label for="cb-name">Name</label>
          <input id="cb-name" [formField]="cbForm.name" placeholder="Q1 Controls Kanban" autocomplete="off" />
        </div>

        <div class="field">
          <label for="cb-status">Status <span class="req">required</span></label>
          <select id="cb-status" [formField]="cbForm.status">
            @for (o of statuses; track o.value) { <option [value]="o.value">{{ o.label }}</option> }
          </select>
        </div>

        <div class="field">
          <label for="cb-type">Type <span class="req">required</span></label>
          <select id="cb-type" [formField]="cbForm.boardType">
            @for (o of types; track o.value) { <option [value]="o.value">{{ o.label }}</option> }
          </select>
        </div>

        <div class="field">
          <label for="cb-desc">Description</label>
          <textarea id="cb-desc" rows="3" [formField]="cbForm.description" placeholder="Markdown supported"></textarea>
        </div>

        @if (!projectId()) {
          <div class="field">
            <label for="cb-project">Project id <span class="opt">optional</span></label>
            <input id="cb-project" [formField]="cbForm.projectId" placeholder="a project UUID to place the board under" autocomplete="off" />
          </div>
        }
      </div>

      <div class="form-code">
        <app-call-reveal [call]="call()" [response]="exampleResponse" />
      </div>
    </form>
  `,
  styles: `
    .create-form { display: grid; grid-template-columns: 1fr 2fr; gap: var(--zb-spacing-lg); align-items: start; }
    .form-fields { display: flex; flex-direction: column; gap: var(--zb-spacing-md); min-width: 0; }
    .form-code { min-width: 0; }
    @media (max-width: 900px) { .create-form { grid-template-columns: 1fr; } }
    .note { margin: 0; color: var(--zb-secondary-text); font-size: var(--zb-font-size-sm); }
    .field { display: flex; flex-direction: column; gap: var(--zb-spacing-xs); }
    label { color: var(--zb-secondary-text); font-size: var(--zb-font-size-sm); }
    .req { color: var(--zb-color-error); font-size: var(--zb-font-size-xs, 12px); }
    .opt { color: var(--zb-secondary-text); font-size: var(--zb-font-size-xs, 12px); }
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
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--zb-primary); }
  `,
})
export class CreateBoardForm {
  private readonly session = inject(SessionService);

  /** When set (board created from a project), the built NewBoard carries this projectId. */
  readonly projectId = input<UUID | undefined>(undefined);

  protected readonly statuses = BoardStatus.values.map(toOption);
  protected readonly types = BoardType.values.map(toOption);
  protected readonly exampleResponse = exampleBoard;

  private readonly model = signal<CreateForm>({
    name: '',
    status: String(BoardStatus.Active),
    boardType: String(BoardType.Kanban),
    description: '',
    projectId: '',
  });
  protected readonly cbForm = form(this.model, (path) => {
    required(path.status);
    required(path.boardType);
  });

  /** The REAL request object, rebuilt from live input via the pure `buildNewBoard`. Nothing is sent. */
  protected readonly request = computed(() =>
    buildNewBoard({ ...this.model(), projectIdOverride: this.projectId() }, this.toUUID),
  );

  /** UUID parser bound to the live client; throws when no session yet (caught in the builder). */
  private readonly toUUID = (s: string): UUID => {
    const api = this.session.api();
    if (!api) throw new Error('client not ready');
    return api.toUUID(s);
  };

  /**
   * The call WITH its payload inline — one panel, not a signature plus a separate JSON blob. The
   * literal is rendered from the real `NewBoard` above, so what is shown is exactly what was built.
   */
  protected readonly call = computed(() =>
    [
      `const board: NewBoard = ${objectLiteral(this.request())};`,
      `const created = await platformClient.getBoardApi().create(board);`,
    ].join('\n'),
  );

}

/** Map an SDK EnumValue to a select {value, label} once, up front — no per-render template call. */
function toOption(v: { toString(): string }): { value: string; label: string } {
  const value = String(v);
  return { value, label: value.charAt(0).toUpperCase() + value.slice(1) };
}

export interface CreateBoardInput extends CreateForm {
  /** Set when creating from a project's detail — placed under that project. Wins over the text field. */
  projectIdOverride?: UUID;
}

/**
 * Build the REAL `NewBoard` the demo reveals — a pure function. A board is placed in the containment
 * chain by giving it a `projectId` (from the parent project, or a hand-entered UUID); a not-yet-valid
 * entry is omitted rather than breaking the payload. Nothing is sent.
 */
export function buildNewBoard(input: CreateBoardInput, toUUID: (s: string) => UUID): NewBoard {
  let projUuid: UUID | undefined = input.projectIdOverride;
  if (!projUuid && input.projectId.trim()) {
    try {
      projUuid = toUUID(input.projectId.trim());
    } catch {
      projUuid = undefined;
    }
  }
  // A plain object typed as `NewBoard` — the compiler enforces the required fields (a missing one
  // is a build error). Values are the real SDK types (enum members, UUID); nothing is coerced here.
  const board: NewBoard = {
    name: input.name.trim() || 'Untitled board',
    status: BoardStatus.from(input.status),
    boardType: BoardType.from(input.boardType),
    ...(input.description.trim() ? { description: input.description.trim() } : {}),
    ...(projUuid ? { projectId: projUuid } : {}), // the board's containing project
  };
  return board;
}
