import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import {
  MembershipPolicy,
  ProjectStatus,
  ProjectVisibility,
  UpdateProject,
} from '@zerobias-com/platform-sdk';
import type { ProjectExtended } from '@zerobias-com/portal-sdk';
import type { UUID } from '@zerobias-org/types-core-js';

import { SessionService } from '../../core/session.service';
import { CallReveal, objectLiteral } from '../../shared/call-reveal/call-reveal';
import { exampleUpdatedProject } from './fixtures';

export interface EditForm {
  name: string;
  status: string;
  visibility: string;
  policy: string;
  description: string;
  projectTypeId: string;
}

/** The subset of the original project the delta is compared against (ProjectExtended satisfies it). */
export interface EditProjectBaseline {
  name: string;
  status: { toString(): string };
  visibility: { toString(): string };
  membershipPolicy: { toString(): string };
  description?: string | null;
  projectTypeId?: { toString(): string } | null;
}

/**
 * EditProjectForm — a code-reveal edit demo (twin of example-nextjs-v2's EditProjectForm). It builds
 * a REAL `UpdateProject` DELTA from live input — only fields that DIFFER from the original are set;
 * a trimmed-empty description becomes `null` (clear the field) rather than `undefined` (leave). It
 * reveals the call + payload + an obfuscated response and NEVER calls `update`.
 */
@Component({
  selector: 'app-edit-project-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, CallReveal],
  template: `
    <form class="edit-form" (submit)="$event.preventDefault()">
      <div class="form-fields">
        <div class="field">
          <label for="ep-name">Name</label>
          <input id="ep-name" [formField]="epForm.name" autocomplete="off" />
        </div>

        <div class="field">
          <label for="ep-visibility">Visibility</label>
          <select id="ep-visibility" [formField]="epForm.visibility">
            @for (o of visibilities; track o.value) { <option [value]="o.value">{{ o.label }}</option> }
          </select>
        </div>

        <div class="field">
          <label for="ep-status">Status</label>
          <select id="ep-status" [formField]="epForm.status">
            @for (o of statuses; track o.value) { <option [value]="o.value">{{ o.label }}</option> }
          </select>
        </div>

        <div class="field">
          <label for="ep-policy">Membership policy</label>
          <select id="ep-policy" [formField]="epForm.policy">
            @for (o of policies; track o.value) { <option [value]="o.value">{{ o.label }}</option> }
          </select>
        </div>

        <div class="field">
          <label for="ep-desc">Description</label>
          <textarea id="ep-desc" rows="3" [formField]="epForm.description"></textarea>
        </div>

        <div class="field">
          <label for="ep-type">Project type id <span class="opt">optional</span></label>
          <input id="ep-type" [formField]="epForm.projectTypeId" autocomplete="off" />
        </div>
      </div>

      <div class="form-code">
        <app-call-reveal [call]="call()" [response]="exampleResponse" />
      </div>
    </form>
  `,
  styles: `
    /* Form left (1/3), live code right (2/3); stacks on narrow — mirrors the Next.js grid. */
    .edit-form { display: grid; grid-template-columns: 1fr 2fr; gap: var(--zb-spacing-lg); align-items: start; }
    .form-fields { display: flex; flex-direction: column; gap: var(--zb-spacing-md); min-width: 0; }
    .form-code { min-width: 0; }
    @media (max-width: 900px) { .edit-form { grid-template-columns: 1fr; } }
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
  `,
})
export class EditProjectForm implements OnInit {
  private readonly session = inject(SessionService);

  /** The project being edited — seeds the form and is the baseline for the delta. */
  readonly project = input.required<ProjectExtended>();

  protected readonly statuses = ProjectStatus.values.map(toOption);
  protected readonly visibilities = ProjectVisibility.values.map(toOption);
  protected readonly policies = MembershipPolicy.values.map(toOption);
  protected readonly exampleResponse = exampleUpdatedProject;

  /**
   * The call WITH its delta inline — one panel. Because the payload is built delta-only, the
   * literal doubles as the lesson: edit a field and watch it appear; revert it and watch it go.
   */
  protected readonly call = computed(() =>
    [
      `// PATCH semantics — only the fields you actually changed are sent`,
      `const changes: UpdateProject = ${objectLiteral(this.request())};`,
      `const updated = await platformClient.getProjectApi().update(projectId, changes);`,
    ].join('\n'),
  );

  private readonly model = signal<EditForm>(EMPTY_FORM);
  protected readonly epForm = form(this.model);

  ngOnInit(): void {
    // Seed from the bound project. (Required inputs aren't available until after construction, so
    // this can't run in a field initializer / constructor.)
    this.model.set(seedFrom(this.project()));
  }

  /** The REAL `UpdateProject` delta, via the pure `buildUpdateProject` (below). */
  protected readonly request = computed(() => buildUpdateProject(this.model(), this.project(), this.toUUID));

  /** UUID parser bound to the live client; throws when no session yet (caught in the builder). */
  private readonly toUUID = (s: string): UUID => {
    const api = this.session.api();
    if (!api) throw new Error('client not ready');
    return api.toUUID(s);
  };

}

/** Map an SDK EnumValue to a select {value, label} once, up front — no per-render template call. */
function toOption(v: { toString(): string }): { value: string; label: string } {
  const value = String(v);
  return { value, label: value.charAt(0).toUpperCase() + value.slice(1) };
}

const EMPTY_FORM: EditForm = {
  name: '',
  status: '',
  visibility: '',
  policy: '',
  description: '',
  projectTypeId: '',
};

function seedFrom(p: ProjectExtended): EditForm {
  return {
    name: p.name,
    status: String(p.status),
    visibility: String(p.visibility),
    policy: String(p.membershipPolicy),
    description: p.description ?? '',
    projectTypeId: p.projectTypeId?.toString() ?? '',
  };
}

/**
 * Build the REAL `UpdateProject` DELTA the demo reveals — a pure function, so the "only send what
 * changed" lesson is unit-testable. Fields equal to the baseline are left `undefined` (dropped from
 * the payload); an emptied description becomes `null` (clear the field). `projectTypeId` only changes
 * when the new text is a valid UUID (a throw leaves it unchanged). Nothing is sent.
 */
export function buildUpdateProject(
  model: EditForm,
  baseline: EditProjectBaseline,
  toUUID: (s: string) => UUID,
): UpdateProject {
  // A typed `UpdateProject` delta: only changed fields are assigned, so an untouched field stays
  // absent. `null` is NOT absence — it is an explicit "clear this field" (the field types are
  // `T | null`, so the compiler allows it and it survives to the wire unchanged).
  const delta: UpdateProject = {};
  const name = model.name.trim();
  if (name && name !== baseline.name) delta.name = name;
  if (model.status !== String(baseline.status)) delta.status = ProjectStatus.from(model.status);
  if (model.visibility !== String(baseline.visibility)) {
    delta.visibility = ProjectVisibility.from(model.visibility);
  }
  if (model.policy !== String(baseline.membershipPolicy)) {
    delta.membershipPolicy = MembershipPolicy.from(model.policy);
  }
  if (model.description.trim() !== (baseline.description ?? '')) {
    delta.description = model.description.trim() || null;
  }
  const nextType = model.projectTypeId.trim();
  const prevType = baseline.projectTypeId?.toString() ?? '';
  if (nextType !== prevType) {
    try {
      delta.projectTypeId = toUUID(nextType);
    } catch {
      // not a UUID yet — leave unchanged
    }
  }
  return delta;
}
