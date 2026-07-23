import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import {
  MembershipPolicy,
  NewProject,
  ProjectStatus,
  ProjectVisibility,
} from '@zerobias-com/platform-sdk';
import type { UUID } from '@zerobias-org/types-core-js';

import { SessionService } from '../../core/session.service';
import { CallReveal, objectLiteral } from '../../shared/call-reveal/call-reveal';
import { exampleProject } from './fixtures';

interface CreateForm {
  name: string;
  status: string;
  visibility: string;
  policy: string;
  description: string;
  projectTypeId: string;
}

/**
 * CreateProjectForm — a code-reveal create demo (twin of example-nextjs-v2's CreateProjectForm).
 * It builds a REAL `NewProject` from live input (so the payload is accurate and the shape is
 * typechecked against the installed platform-sdk) and reveals the call + payload + an obfuscated
 * response. It NEVER calls `create` — nothing is sent.
 *
 * `parentId`, when set (opening this from a project's detail), makes it a sub-project — that's just
 * a `NewProject` with `parentId`.
 */
@Component({
  selector: 'app-create-project-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, CallReveal],
  template: `
    <form class="create-form" (submit)="$event.preventDefault()">
      <div class="form-fields">
        @if (parentId()) {
          <p class="note">
            Creating a <strong>sub-project</strong> — <code>parentId</code> is set from the project
            you opened this from.
          </p>
        }

        <div class="field">
          <label for="cp-name">Name</label>
          <input id="cp-name" [formField]="cpForm.name" placeholder="Q1 Evidence Collection" autocomplete="off" />
        </div>

        <div class="field">
          <label for="cp-visibility">Visibility <span class="req">required</span></label>
          <select id="cp-visibility" [formField]="cpForm.visibility">
            @for (o of visibilities; track o.value) { <option [value]="o.value">{{ o.label }}</option> }
          </select>
        </div>

        <div class="field">
          <label for="cp-status">Status <span class="req">required</span></label>
          <select id="cp-status" [formField]="cpForm.status">
            @for (o of statuses; track o.value) { <option [value]="o.value">{{ o.label }}</option> }
          </select>
        </div>

        <div class="field">
          <label for="cp-policy">Membership policy <span class="req">required</span></label>
          <select id="cp-policy" [formField]="cpForm.policy">
            @for (o of policies; track o.value) { <option [value]="o.value">{{ o.label }}</option> }
          </select>
        </div>

        <div class="field">
          <label for="cp-desc">Description</label>
          <textarea id="cp-desc" rows="3" [formField]="cpForm.description" placeholder="Markdown supported"></textarea>
        </div>

        <div class="field">
          <label for="cp-type">Project type id <span class="opt">optional</span></label>
          <input id="cp-type" [formField]="cpForm.projectTypeId" placeholder="a project-type UUID from your org" autocomplete="off" />
        </div>
      </div>

      <div class="form-code">
        <app-call-reveal [call]="call()" [response]="exampleResponse" />
      </div>
    </form>
  `,
  styles: `
    /* Form on the left (1/3), live code panel on the right (2/3); stacks on narrow. Mirrors the
       Next.js drawer's .create-form grid exactly. */
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
export class CreateProjectForm {
  private readonly session = inject(SessionService);

  /** When set (sub-project from a project detail), the built NewProject carries this parentId. */
  readonly parentId = input<UUID | undefined>(undefined);

  protected readonly statuses = ProjectStatus.values.map(toOption);
  protected readonly visibilities = ProjectVisibility.values.map(toOption);
  protected readonly policies = MembershipPolicy.values.map(toOption);
  protected readonly exampleResponse = exampleProject;

  private readonly model = signal<CreateForm>({
    name: '',
    status: String(ProjectStatus.Draft),
    visibility: String(ProjectVisibility.Private),
    policy: String(MembershipPolicy.Private),
    description: '',
    projectTypeId: '',
  });
  protected readonly cpForm = form(this.model, (path) => {
    required(path.status);
    required(path.visibility);
    required(path.policy);
  });

  /**
   * The REAL request object, rebuilt from live input via the pure `buildNewProject` (below), which
   * is what typechecks the call shape against the installed platform-sdk. Nothing is sent.
   */
  protected readonly request = computed(() =>
    buildNewProject({ ...this.model(), parentId: this.parentId() }, this.toUUID),
  );

  /** UUID parser bound to the live client; throws when no session yet (caught in the builder). */
  private readonly toUUID = (s: string): UUID => {
    const api = this.session.api();
    if (!api) throw new Error('client not ready');
    return api.toUUID(s);
  };

  /**
   * The call WITH its payload inline — one panel, not a signature plus a separate JSON blob. The
   * literal is rendered from the real `NewProject` above, so what is shown is exactly what was
   * built (and would be sent).
   */
  protected readonly call = computed(() =>
    [
      `const project: NewProject = ${objectLiteral(this.request())};`,
      `const created = await platformClient.getProjectApi().create(project);`,
    ].join('\n'),
  );
}

/** Map an SDK EnumValue to a select {value, label} once, up front — no per-render template call. */
function toOption(v: { toString(): string }): { value: string; label: string } {
  const value = String(v);
  return { value, label: value.charAt(0).toUpperCase() + value.slice(1) };
}

export interface CreateProjectInput extends CreateForm {
  /** Set when creating a sub-project (from a project's detail). */
  parentId?: UUID;
}

/**
 * Build the REAL `NewProject` the demo reveals — a pure function so the SDK-shape logic is unit-
 * testable without a component. `toUUID` parses the optional projectTypeId; a throw (no client yet,
 * or a not-yet-valid id) simply omits it rather than breaking the payload. Nothing is sent.
 */
export function buildNewProject(input: CreateProjectInput, toUUID: (s: string) => UUID): NewProject {
  let typeUuid: UUID | undefined;
  const trimmed = input.projectTypeId.trim();
  if (trimmed) {
    try {
      typeUuid = toUUID(trimmed);
    } catch {
      typeUuid = undefined;
    }
  }
  // A plain object typed as `NewProject` — the compiler enforces the required fields (a missing
  // one is a build error, which `NewProject.newInstance(obj: any)` would NOT catch). Values are the
  // real SDK types (enum members, UUID), so nothing is coerced or serialized here.
  const project: NewProject = {
    name: input.name.trim() || 'Untitled project',
    status: ProjectStatus.from(input.status),
    visibility: ProjectVisibility.from(input.visibility),
    membershipPolicy: MembershipPolicy.from(input.policy),
    ...(input.description.trim() ? { description: input.description.trim() } : {}),
    ...(input.parentId ? { parentId: input.parentId } : {}), // set => sub-project
    ...(typeUuid ? { projectTypeId: typeUuid } : {}),
  };
  return project;
}
