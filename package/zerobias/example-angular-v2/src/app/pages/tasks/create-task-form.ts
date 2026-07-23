import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { NewTask, NewTaskLink } from '@zerobias-com/platform-sdk';
import type { UUID } from '@zerobias-org/types-core-js';

import { SessionService } from '../../core/session.service';
import { CallReveal, objectLiteral } from '../../shared/call-reveal/call-reveal';
import { exampleTask } from './fixtures';

interface CreateForm {
  activityId: string;
  name: string;
  description: string;
  priority: string;
  assigned: string;
  accountable: string;
  approvers: string;
  notified: string;
  links: string;
}

// Stand-in shown until a real activityId is entered, so the payload always constructs (activityId
// is required and non-optional). Obviously fake — all zeros.
const PLACEHOLDER_ACTIVITY = '00000000-0000-0000-0000-000000000000';

/**
 * CreateTaskForm — the code-reveal create demo for the richest write on the surface. `NewTask` has
 * FOUR required fields, and that's the lesson:
 *   activityId  — a task hangs off an activity; it does not float.
 *   approvers[] — RACI is first-class; party ids (may be empty, but must be present).
 *   notified[]  — same.
 *   links[]     — links to resources (each a NewTaskLink); may be empty.
 * Everything else (name, description, priority, boardId, assigned, accountable) is optional and set
 * as a property after construction. Building a REAL `NewTask` typechecks the whole shape. Nothing is
 * sent. Party/link ids are entered by hand — a real app would resolve them with a picker.
 */
@Component({
  selector: 'app-create-task-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, CallReveal],
  template: `
    <form class="create-form" (submit)="$event.preventDefault()">
      <div class="form-fields">
        <p class="note">
          <code>NewTask</code> requires four fields: <code>activityId</code> and the arrays
          <code>approvers</code>, <code>notified</code>, <code>links</code> (which may be empty). Ids
          are entered by hand here — a real app would resolve them with a user/resource picker.
        </p>

        @if (boardId()) {
          <p class="note">
            Creating on a <strong>board</strong> — <code>boardId</code> is set from the board you
            opened this from.
          </p>
        }

        <div class="field">
          <label for="ct-activity">Activity id <span class="req">required</span></label>
          <input id="ct-activity" [formField]="ctForm.activityId" placeholder="the activity this task hangs off" autocomplete="off" />
        </div>

        <div class="field">
          <label for="ct-name">Name</label>
          <input id="ct-name" [formField]="ctForm.name" placeholder="Collect SOC 2 access-review evidence" autocomplete="off" />
        </div>

        <div class="field">
          <label for="ct-desc">Description</label>
          <textarea id="ct-desc" rows="3" [formField]="ctForm.description" placeholder="Markdown supported"></textarea>
        </div>

        <div class="field">
          <label for="ct-priority">Priority <span class="opt">numeric</span></label>
          <input id="ct-priority" [formField]="ctForm.priority" placeholder="a priority value, e.g. 1" inputmode="numeric" autocomplete="off" />
        </div>

        <div class="field">
          <label for="ct-assigned">Assigned (R) <span class="opt">party id</span></label>
          <input id="ct-assigned" [formField]="ctForm.assigned" placeholder="responsible party UUID" autocomplete="off" />
        </div>

        <div class="field">
          <label for="ct-accountable">Accountable (A) <span class="opt">party id</span></label>
          <input id="ct-accountable" [formField]="ctForm.accountable" placeholder="accountable party UUID" autocomplete="off" />
        </div>

        <div class="field">
          <label for="ct-approvers">Approvers <span class="req">required</span></label>
          <input id="ct-approvers" [formField]="ctForm.approvers" placeholder="party UUIDs, comma-separated (may be empty)" autocomplete="off" />
        </div>

        <div class="field">
          <label for="ct-notified">Notified <span class="req">required</span></label>
          <input id="ct-notified" [formField]="ctForm.notified" placeholder="party UUIDs, comma-separated (may be empty)" autocomplete="off" />
        </div>

        <div class="field">
          <label for="ct-links">Links <span class="req">required</span></label>
          <input id="ct-links" [formField]="ctForm.links" placeholder="resource UUIDs, comma-separated (may be empty)" autocomplete="off" />
        </div>
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
    .note {
      margin: 0; padding: var(--zb-spacing-sm) var(--zb-spacing-md);
      color: var(--zb-secondary-text); font-size: var(--zb-font-size-sm);
      background: var(--zb-table-row-hover); border-radius: 6px;
    }
    .field { display: flex; flex-direction: column; gap: var(--zb-spacing-xs); }
    label { color: var(--zb-secondary-text); font-size: var(--zb-font-size-sm); }
    .req { color: var(--zb-color-error); font-size: var(--zb-font-size-xs, 12px); }
    .opt { color: var(--zb-secondary-text); font-size: var(--zb-font-size-xs, 12px); }
    input, textarea {
      padding: var(--zb-spacing-xs) var(--zb-spacing-sm);
      border: 1px solid var(--zb-divider);
      border-radius: 6px;
      background: var(--zb-background);
      color: var(--zb-text);
      font-size: var(--zb-font-size-md);
      font-family: inherit;
    }
    textarea { resize: vertical; }
    input:focus, textarea:focus { outline: 2px solid var(--zb-primary); outline-offset: -1px; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--zb-primary); }
  `,
})
export class CreateTaskForm {
  private readonly session = inject(SessionService);

  /** When set (task created from a board), the built NewTask carries this boardId. */
  readonly boardId = input<UUID | undefined>(undefined);
  /** When set (task created from a board's activity), pre-fills the required activityId. */
  readonly activityId = input<UUID | undefined>(undefined);

  protected readonly exampleResponse = exampleTask;

  private readonly model = signal<CreateForm>({
    activityId: '',
    name: '',
    description: '',
    priority: '',
    assigned: '',
    accountable: '',
    approvers: '',
    notified: '',
    links: '',
  });
  protected readonly ctForm = form(this.model);

  /** The REAL request object — NewTask + NewTaskLink built from live input via the pure `buildNewTask`. */
  protected readonly request = computed(() => {
    const api = this.session.api();
    if (!api) return undefined;
    return buildNewTask(
      { ...this.model(), boardId: this.boardId(), activityIdOverride: this.activityId() },
      (s) => api.toUUID(s),
    );
  });

  /**
   * The call WITH its payload inline — one panel. Rendered from the real `NewTask` above, so the
   * required fields and whichever optionals you actually filled are both visible in one place.
   */
  protected readonly call = computed(() =>
    [
      `const task: NewTask = ${objectLiteral(this.request())};`,
      `const created = await platformClient.getTaskApi().create(task);`,
    ].join('\n'),
  );
}

export interface CreateTaskInput extends CreateForm {
  /** Set when creating on a board (from a board's detail). */
  boardId?: UUID;
  /** Pre-filled required activity (from a board's activity); overridden by the activityId field if valid. */
  activityIdOverride?: UUID;
}

/**
 * Build the REAL `NewTask` the demo reveals — a pure function. This is the richest write on the
 * surface: `activityId` + `approvers`/`notified`/`links` are REQUIRED (arrays may be empty). When no
 * valid activityId is entered, an obviously-fake placeholder keeps the payload constructing. Party
 * and resource ids are parsed leniently — a not-yet-valid id is dropped, never fatal. Nothing is sent.
 */
export function buildNewTask(input: CreateTaskInput, toUUID: (s: string) => UUID): NewTask {
  const toU = (s: string): UUID | undefined => {
    try {
      return toUUID(s.trim());
    } catch {
      return undefined; // not a UUID yet — omit rather than break the payload
    }
  };
  const toList = (raw: string): UUID[] =>
    splitUuidList(raw).flatMap((s) => {
      const u = toU(s);
      return u ? [u] : [];
    });

  const activity = toU(input.activityId) ?? input.activityIdOverride ?? toUUID(PLACEHOLDER_ACTIVITY);
  const p = Number(input.priority);
  const asg = toU(input.assigned);
  const acc = toU(input.accountable);
  // A plain object typed as `NewTask` — the compiler enforces the four required fields (activityId
  // + the three arrays); an optional the user did not fill simply never appears. Values are the
  // real SDK types, so nothing is coerced here.
  const task: NewTask = {
    activityId: activity, // required — a task hangs off an activity
    approvers: toList(input.approvers), // required (may be empty)
    notified: toList(input.notified), // required (may be empty)
    links: toList(input.links).map((resourceId): NewTaskLink => ({ resourceId })),
    ...(input.name.trim() ? { name: input.name.trim() } : {}),
    ...(input.description.trim() ? { description: input.description.trim() } : {}),
    ...(input.priority.trim() && !Number.isNaN(p) ? { priority: p } : {}),
    ...(input.boardId ? { boardId: input.boardId } : {}),
    ...(asg ? { assigned: asg } : {}),
    ...(acc ? { accountable: acc } : {}),
  };
  return task;
}

/** Split a comma/whitespace-separated list, trim, drop blanks, de-dupe (first-seen order). Exported for tests. */
export function splitUuidList(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const token of raw.split(/[\s,]+/)) {
    const t = token.trim();
    if (t && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  return out;
}
