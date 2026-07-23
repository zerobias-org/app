import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import {
  ZbResourceStatusComponent,
  ZbSnakeToSpacesPipe,
} from '@zerobias-org/ngx-library';
import { SearchTaskBody } from '@zerobias-com/portal-sdk';

import { detailResource } from '../../shared/detail-resource';
import { Drawer } from '../../shared/drawer/drawer';
import { MarkdownViewer } from '../../shared/markdown-viewer/markdown-viewer';
import { CreateProjectForm } from './create-project-form';
import { EditProjectForm } from './edit-project-form';
import { ProjectTreeNodeComponent, type CreateParent } from './project-tree-node';

const TASK_PREVIEW = 10;

/**
 * ProjectDetail — the read drill-down for a project (twin of example-nextjs-v2's ProjectDetail).
 * Reached from the projects list via `/projects/detail?id=<uuid>` (query param, not a path param,
 * so it survives a static export). All reads are on `portalClient`:
 *
 *   getProjectApi().get(id)                    -> the project
 *   getProjectApi().listMembers(id)            -> members + roles
 *   getProjectApi().searchTasks(id, {}, 1, 10) -> a task preview
 *   getProjectApi().getTree(id, true)          -> the sub-project hierarchy
 *
 * The Edit button opens the code-reveal edit drawer.
 */
@Component({
  selector: 'app-project-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,
    RouterLink,
    MatIconModule,
    ZbResourceStatusComponent,
    ZbSnakeToSpacesPipe,
    Drawer,
    MarkdownViewer,
    CreateProjectForm,
    EditProjectForm,
    ProjectTreeNodeComponent,
  ],
  template: `
    <a class="back" routerLink="/projects"><mat-icon>arrow_back</mat-icon> Projects</a>

    @if (loading()) {
      <p class="state">Loading project…</p>
    } @else if (error()) {
      <p class="state error">{{ error() }}</p>
    } @else if (project(); as p) {
      <header class="head">
        <div class="title">
          <code class="code">{{ p.code ?? '—' }}</code>
          <h1>{{ p.name }}</h1>
          <zb-resource-status [label]="p.status" [pill]="true"></zb-resource-status>
        </div>
        <button type="button" class="btn-stroked" (click)="editOpen.set(true)">Edit</button>
      </header>

      @if (p.description) {
        <div class="desc"><app-markdown-viewer [content]="p.description" /></div>
      }

      <dl class="meta">
        <div><dt>Type</dt><dd>{{ p.projectType.name }}</dd></div>
        <div><dt>Visibility</dt><dd><span class="zb-chip square visibility" [ngClass]="p.visibility.toString().toLowerCase()">{{ p.visibility }}</span></dd></div>
        <div><dt>Owner</dt><dd>{{ p.owner.name }}</dd></div>
        <div><dt>Boards</dt><dd>{{ p.boardCount }}</dd></div>
        <div><dt>Members</dt><dd>{{ p.memberCount }}</dd></div>
      </dl>

      <section class="panel">
        <h2>Structure</h2>
        <p class="subtitle">
          <code>getProjectApi().getTree(id, true)</code> — walks the project's full ancestry and
          descendants in one call.
        </p>

        @if (standalone()) {
          <p class="state">This project is standalone — no parent, no children.</p>
          <p class="hint">
            Projects nest into a hierarchy; <code>getTree</code> returns the whole tree from the
            topmost ancestor down. For example:
          </p>
          <ul class="tree example" aria-label="Example project hierarchy">
            <li>
              <div class="node"><span class="name">Enterprise Compliance</span><span class="zb-chip square generic">Portfolio</span></div>
              <ul class="children">
                <li>
                  <div class="node"><span class="name">SOC 2 Program</span><span class="zb-chip square generic">Program</span></div>
                  <ul class="children">
                    <li>
                      <div class="node current"><span class="name">Q1 Evidence Collection</span><span class="zb-chip square generic">Project</span></div>
                    </li>
                  </ul>
                </li>
              </ul>
            </li>
          </ul>
        } @else if (treeRoot(); as root) {
          <ul class="tree">
            <app-project-tree-node
              [node]="root"
              [currentId]="currentId()"
              (addChild)="createParent.set($event)"
            />
          </ul>
          @if (skippedSubtrees() > 0) {
            <p class="hint">{{ skippedSubtrees() }} sub-tree(s) not shown — the server pruned them.</p>
          }
        }
      </section>

      <section class="panel">
        <h2>Tasks <span class="count">({{ tasks().length }}{{ tasks().length === TASK_PREVIEW ? '+' : '' }})</span></h2>
        @if (tasks().length === 0) {
          <p class="state">No tasks.</p>
        } @else {
          <ul class="tasks">
            @for (t of tasks(); track t.id) {
              <li>
                <code>{{ t.code }}</code>
                <span class="task-name">{{ t.name }}</span>
                <span class="zb-chip square task-status" [ngClass]="t.status">{{ t.status | snakeToSpaces: 'everyFirst' }}</span>
              </li>
            }
          </ul>
        }
      </section>

      <section class="panel">
        <h2>Members <span class="count">({{ members().length }})</span></h2>
        @if (memberRoles().length === 0) {
          <p class="state">No members.</p>
        } @else {
          <ul class="members">
            @for (roles of memberRoles(); track $index) {
              <li>
                <mat-icon>person</mat-icon>
                <span class="roles">{{ roles }}</span>
              </li>
            }
          </ul>
        }
      </section>

      <app-drawer [open]="editOpen()" title="Edit project" (close)="editOpen.set(false)">
        @if (editOpen()) {
          <app-edit-project-form [project]="p" />
        }
      </app-drawer>

      <!-- Sub-project create, opened from any node's "+" — a code-reveal demo like every other
           write in this app: it builds the real NewProject (with parentId) and never posts. -->
      <app-drawer
        [open]="!!createParent()"
        title="Create sub-project"
        (close)="createParent.set(null)"
      >
        @if (createParent(); as parent) {
          <p class="hint">Creating under <strong>{{ parent.name }}</strong></p>
          <app-create-project-form [parentId]="parent.id" />
        }
      </app-drawer>
    }
  `,
  styles: `
    :host { display: block; }
    .back {
      display: inline-flex; align-items: center; gap: 4px;
      color: var(--zb-secondary-text); text-decoration: none;
      font-size: var(--zb-font-size-sm); margin-bottom: var(--zb-spacing-md);
    }
    .back:hover { color: var(--zb-text); }
    .back mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .head { display: flex; align-items: center; justify-content: space-between; gap: var(--zb-spacing-md); }
    .title { display: flex; align-items: center; gap: var(--zb-spacing-sm); flex-wrap: wrap; }
    .title h1 { margin: 0; font-size: 26px; }
    .code { color: var(--zb-primary); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .desc { margin: var(--zb-spacing-sm) 0 var(--zb-spacing-md); }
    .meta { display: flex; flex-wrap: wrap; gap: var(--zb-spacing-lg); margin: 0 0 var(--zb-spacing-lg); }
    .meta dt { color: var(--zb-secondary-text); font-size: var(--zb-font-size-xs, 12px); margin: 0; }
    .meta dd { margin: 2px 0 0; color: var(--zb-text); }
    .panel { border: 1px solid var(--zb-divider); border-radius: 8px; padding: var(--zb-spacing-md); margin-bottom: var(--zb-spacing-md); }
    .panel h2 { margin: 0 0 var(--zb-spacing-sm); font-size: 18px; }
    .count { color: var(--zb-secondary-text); font-weight: 400; font-size: var(--zb-font-size-sm); }
    ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--zb-spacing-xs); }
    .tasks li, .members li { display: flex; align-items: center; gap: var(--zb-spacing-sm); }
    .subtitle { margin: 0 0 var(--zb-spacing-sm); color: var(--zb-secondary-text); font-size: var(--zb-font-size-sm); }
    .hint { margin: var(--zb-spacing-sm) 0 0; color: var(--zb-secondary-text); font-size: var(--zb-font-size-sm); }
    /* Tree rows come from app-project-tree-node (own styles); these cover the inline
       standalone EXAMPLE, which is static markup rather than real nodes. */
    .tree { gap: 0; }
    .tree li { display: block; }
    .example .node { display: flex; align-items: center; gap: var(--zb-spacing-sm); padding: 4px 0; }
    .example .name { color: var(--zb-primary); }
    .example .node.current .name { color: var(--zb-text); font-weight: 600; }
    .example .children {
      list-style: none; margin: 0 0 0 6px; padding: 0 0 0 var(--zb-spacing-md);
      border-left: 1px solid var(--zb-divider);
    }
    .example { opacity: 0.75; }
    .task-name { flex: 1; }
    .members mat-icon { color: var(--zb-secondary-text); font-size: 18px; width: 18px; height: 18px; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--zb-primary); }
    .state { color: var(--zb-secondary-text); }
    .state.error { color: var(--zb-color-error); }
    .btn-stroked {
      height: 38px; padding: 0 var(--zb-spacing-md);
      border: 1px solid var(--zb-primary); border-radius: 6px;
      background: transparent; color: var(--zb-primary);
      font-size: var(--zb-font-size-md); cursor: pointer;
    }
    .btn-stroked:hover { background: var(--zb-table-row-hover); }
  `,
})
export class ProjectDetail {
  protected readonly TASK_PREVIEW = TASK_PREVIEW;
  protected readonly editOpen = signal(false);
  /** Non-null while the sub-project drawer is open; carries the node the "+" was clicked on. */
  protected readonly createParent = signal<CreateParent | null>(null);

  /** The four drill-down reads as one auto-cancelling resource (see {@link detailResource}). */
  private readonly detail = detailResource(
    async ({ api, id }) => {
      const projectApi = api.portalClient.getProjectApi();
      const uuid = api.toUUID(id);
      const [project, members, taskResults, tree] = await Promise.all([
        projectApi.get(uuid),
        projectApi.listMembers(uuid),
        projectApi.searchTasks(uuid, {} as SearchTaskBody, 1, TASK_PREVIEW),
        projectApi.getTree(uuid, true),
      ]);
      return { project, members, tasks: taskResults.items, tree };
    },
    { missingId: 'No project id.', loadFailed: 'Could not load this project.' },
  );

  protected readonly loading = this.detail.loading;
  protected readonly error = this.detail.error;
  protected readonly project = computed(() => this.detail.value()?.project ?? null);
  protected readonly members = computed(() => this.detail.value()?.members ?? []);
  protected readonly tasks = computed(() => this.detail.value()?.tasks ?? []);

  /** The whole hierarchy `getTree` returned — root is the topmost ancestor, not this project. */
  protected readonly tree = computed(() => this.detail.value()?.tree ?? null);
  protected readonly treeRoot = computed(() => this.tree()?.root ?? null);
  protected readonly currentId = computed(() => this.tree()?.requestedProjectId?.toString() ?? '');
  /** Sub-trees the server pruned from the response — surfaced so the count isn't silently wrong. */
  protected readonly skippedSubtrees = computed(() => this.tree()?.skippedSubtreeCount ?? 0);

  /**
   * No parent and no children: the tree is just this project, so there is no hierarchy to show.
   * The template then renders an illustrative example instead of an empty panel — the teaching
   * point is what `getTree` returns, which an empty list would fail to convey.
   */
  protected readonly standalone = computed(() => {
    const root = this.treeRoot();
    return !!root && root.id.toString() === this.currentId() && !root.hasChildren;
  });

  /** Per-member role labels, precomputed — the members section renders these directly. */
  protected readonly memberRoles = computed(() =>
    this.members().map((m) => {
      const names = (m.roles ?? []).map((r) => r.name).filter(Boolean);
      return names.length ? names.join(', ') : 'Member';
    }),
  );
}
