import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { disabled, form, FormField } from '@angular/forms/signals';
import { UpdateTask } from '@zerobias-com/platform-sdk';
import type { TaskExtended } from '@zerobias-com/portal-sdk';
import type { UUID } from '@zerobias-org/types-core-js';

import { SessionService } from '../../core/session.service';
import { CallReveal, objectLiteral } from '../../shared/call-reveal/call-reveal';
import { exampleUpdatedTask } from './fixtures';

export interface EditForm {
  transitionId: string;
  name: string;
  description: string;
  priority: string;
  assigned: string;
  accountable: string;
}

/** The subset of the original task the delta is compared against (TaskExtended satisfies it). */
export interface EditTaskBaseline {
  name: string;
  description?: string;
  priority?: { value?: number };
  assigned?: { principalId?: UUID };
  accountable?: { principalId?: UUID };
}

/**
 * EditTaskForm — the code-reveal EDIT demo, and the money shot of the task surface: you do NOT set
 * `status = "done"`. Status is a WORKFLOW move. The task carries `nextTransitions` (the moves
 * available from its current status); you pick one and send its id as `UpdateTask.transitionId`.
 * The server runs the transition and returns the task in its new status.
 *
 * Like every edit demo this builds a DELTA — `UpdateTask` is partial, so only changed fields are
 * assigned; the rest stay `undefined` and drop from the payload. Nothing is sent.
 */
@Component({
  selector: 'app-edit-task-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, CallReveal],
  template: `
    <form class="edit-form" (submit)="$event.preventDefault()">
      <div class="form-fields">
        <p class="note">
          Editing sends a <strong>delta</strong> — only the fields you change appear in the request.
          @if (changedCount() === 0) {
            Nothing changed yet, so the payload is empty <code>{{ '{}' }}</code>.
          } @else {
            {{ changedCount() }} field{{ changedCount() === 1 ? '' : 's' }} changed.
          }
        </p>

        <div class="field">
          <label for="et-transition">Status <span class="opt">workflow transition</span></label>
          <select id="et-transition" [formField]="etForm.transitionId">
            <option value="">
              @if (transitions().length === 0) { no transitions from "{{ task().status }}" }
              @else { — keep "{{ task().status }}" — }
            </option>
            @for (tr of transitions(); track tr.id) {
              <option [value]="tr.id.toString()">{{ tr.name }} (-> {{ tr.status }})</option>
            }
          </select>
          <p class="hint">
            Current status is <code>{{ task().status }}</code>. Moving it means picking a transition —
            the payload carries <code>transitionId</code>, never a status string.
          </p>
        </div>

        <div class="field">
          <label for="et-name">Name</label>
          <input id="et-name" [formField]="etForm.name" autocomplete="off" />
        </div>

        <div class="field">
          <label for="et-desc">Description</label>
          <textarea id="et-desc" rows="3" [formField]="etForm.description"></textarea>
        </div>

        <div class="field">
          <label for="et-priority">Priority <span class="opt">numeric</span></label>
          <input id="et-priority" [formField]="etForm.priority" inputmode="numeric" autocomplete="off" />
        </div>

        <div class="field">
          <label for="et-assigned">Assigned (R) <span class="opt">party id</span></label>
          <input id="et-assigned" [formField]="etForm.assigned" placeholder="responsible party UUID (blank to unassign)" autocomplete="off" />
        </div>

        <div class="field">
          <label for="et-accountable">Accountable (A) <span class="opt">party id</span></label>
          <input id="et-accountable" [formField]="etForm.accountable" placeholder="accountable party UUID (blank to unassign)" autocomplete="off" />
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
    .note {
      margin: 0; padding: var(--zb-spacing-sm) var(--zb-spacing-md);
      color: var(--zb-secondary-text); font-size: var(--zb-font-size-sm);
      background: var(--zb-table-row-hover); border-radius: 6px;
    }
    .hint { margin: 0; color: var(--zb-secondary-text); font-size: var(--zb-font-size-sm); }
    .field { display: flex; flex-direction: column; gap: var(--zb-spacing-xs); }
    label { color: var(--zb-secondary-text); font-size: var(--zb-font-size-sm); }
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
export class EditTaskForm implements OnInit {
  private readonly session = inject(SessionService);

  /** The task being edited — seeds the form and is the baseline for the delta. */
  readonly task = input.required<TaskExtended>();

  protected readonly exampleResponse = exampleUpdatedTask;
  protected readonly transitions = computed(() => this.task().nextTransitions ?? []);

  /** The call WITH its delta inline — `transitionId` shows up here the moment you pick a move. */
  protected readonly call = computed(() =>
    [
      `// Status is a workflow transition, not a status string —`,
      `// transitionId must be one of task.nextTransitions.`,
      `const changes: UpdateTask = ${objectLiteral(this.request())};`,
      `const updated = await platformClient.getTaskApi().update(taskId, changes);`,
    ].join('\n'),
  );

  private readonly model = signal<EditForm>(EMPTY_FORM);
  // Signal Forms owns control state: the transition select is disabled via the form schema (NOT a
  // `[disabled]` binding on the [formField] element — NG8022) when the task has no next transitions.
  protected readonly etForm = form(this.model, (path) => {
    disabled(path.transitionId, () => this.transitions().length === 0);
  });

  ngOnInit(): void {
    this.model.set(seedFrom(this.task()));
  }

  /** The REAL `UpdateTask` delta, via the pure `buildUpdateTask` (below). */
  protected readonly request = computed(() => buildUpdateTask(this.model(), this.task(), this.toUUID));

  /** UUID parser bound to the live client; throws when no session yet (caught in the builder). */
  private readonly toUUID = (s: string): UUID => {
    const api = this.session.api();
    if (!api) throw new Error('client not ready');
    return api.toUUID(s);
  };

  protected readonly changedCount = computed(
    () => Object.values(this.request() as Record<string, unknown>).filter((v) => v !== undefined).length,
  );
}

const EMPTY_FORM: EditForm = {
  transitionId: '',
  name: '',
  description: '',
  priority: '',
  assigned: '',
  accountable: '',
};

function seedFrom(t: TaskExtended): EditForm {
  return {
    transitionId: '',
    name: t.name,
    description: t.description ?? '',
    priority: t.priority?.value?.toString() ?? '',
    assigned: t.assigned?.principalId?.toString() ?? '',
    accountable: t.accountable?.principalId?.toString() ?? '',
  };
}

/**
 * Build the REAL `UpdateTask` DELTA — a pure function, so the edit lessons are unit-testable:
 *   - STATUS IS A WORKFLOW TRANSITION: a picked transition becomes `transitionId`, never a status string.
 *   - only changed fields are set (the rest drop from the partial payload);
 *   - a party id changed-to-blank becomes `null` (unassign), changed-to-valid becomes the id, and a
 *     mid-typing invalid id is left out.
 * Nothing is sent.
 */
export function buildUpdateTask(
  model: EditForm,
  baseline: EditTaskBaseline,
  toUUID: (s: string) => UUID,
): UpdateTask {
  // A typed `UpdateTask` delta: only changed fields are assigned. `null` is not absence — for a
  // party it means "unassign", which is why applyParty can write null below (the field types allow
  // it and it survives to the wire).
  const delta: UpdateTask = {};
  const toU = (s: string): UUID | undefined => {
    try {
      return toUUID(s.trim());
    } catch {
      return undefined;
    }
  };

  if (model.transitionId) {
    const tr = toU(model.transitionId);
    if (tr) delta.transitionId = tr; // the workflow move — this is how status changes
  }

  const name = model.name.trim();
  if (name && name !== baseline.name) delta.name = name;

  const description = model.description.trim();
  if (description !== (baseline.description ?? '')) delta.description = description;

  const origPriority = baseline.priority?.value;
  if (model.priority.trim() !== '') {
    const next = Number(model.priority);
    if (!Number.isNaN(next) && next !== origPriority) delta.priority = next;
  }

  applyParty(model.assigned, baseline.assigned?.principalId, toU, (v) => (delta.assigned = v));
  applyParty(model.accountable, baseline.accountable?.principalId, toU, (v) => (delta.accountable = v));
  return delta;
}

/** Nullable party: unchanged => skip; blanked => null (unassign); valid new => the id. */
function applyParty(
  cur: string,
  orig: UUID | undefined,
  toU: (s: string) => UUID | undefined,
  set: (v: UUID | null) => void,
): void {
  const origStr = orig?.toString() ?? '';
  const curTrim = cur.trim();
  if (curTrim === origStr) return;
  if (!curTrim) set(null);
  else {
    const u = toU(curTrim);
    if (u) set(u);
  }
}
