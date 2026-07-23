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
import { EditBoardForm } from './edit-board-form';

const TASK_PREVIEW = 10;

/**
 * BoardDetail — the read drill-down for a board (twin of example-nextjs-v2's BoardDetail). Reached
 * from the boards list via `/boards/detail?id=<uuid>`. Reads on `portalClient`:
 *
 *   getBoardApi().get(id)                    -> the board + its project link + counts
 *   getBoardApi().searchTasks(id, {}, 1, 10) -> the board's own tasks
 *
 * Up: the board's `project` links to the project detail. Down: `searchTasks` lists the board's
 * tasks. The Edit button opens the code-reveal edit drawer.
 */
@Component({
  selector: 'app-board-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,
    RouterLink,
    MatIconModule,
    ZbResourceStatusComponent,
    ZbSnakeToSpacesPipe,
    Drawer,
    MarkdownViewer,
    EditBoardForm,
  ],
  template: `
    <a class="back" routerLink="/boards"><mat-icon>arrow_back</mat-icon> Boards</a>

    @if (loading()) {
      <p class="state">Loading board…</p>
    } @else if (error()) {
      <p class="state error">{{ error() }}</p>
    } @else if (board(); as b) {
      <header class="head">
        <div class="title">
          <h1>{{ b.name }}</h1>
          <zb-resource-status [label]="b.status" [pill]="true"></zb-resource-status>
          <span class="zb-chip square generic">{{ b.boardType }}</span>
        </div>
        <button type="button" class="btn-stroked" (click)="editOpen.set(true)">Edit</button>
      </header>

      @if (b.description) {
        <div class="desc"><app-markdown-viewer [content]="b.description" /></div>
      }

      <dl class="meta">
        <div><dt>Type</dt><dd>{{ b.boardType }}</dd></div>
        <div>
          <dt>Project</dt>
          <dd>
            @if (b.project; as p) {
              <a class="link" [routerLink]="['/projects/detail']" [queryParams]="{ id: p.id.toString() }">{{ p.name }}</a>
            } @else { — }
          </dd>
        </div>
        <div><dt>Tasks</dt><dd>{{ b.taskCount }}</dd></div>
      </dl>

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

      <app-drawer [open]="editOpen()" title="Edit board" (close)="editOpen.set(false)">
        @if (editOpen()) {
          <app-edit-board-form [board]="b" />
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
    .desc { margin: var(--zb-spacing-sm) 0 var(--zb-spacing-md); }
    .meta { display: flex; flex-wrap: wrap; gap: var(--zb-spacing-lg); margin: 0 0 var(--zb-spacing-lg); }
    .meta dt { color: var(--zb-secondary-text); font-size: var(--zb-font-size-xs, 12px); margin: 0; }
    .meta dd { margin: 2px 0 0; color: var(--zb-text); }
    .link { color: var(--zb-primary); text-decoration: none; }
    .link:hover { text-decoration: underline; }
    .panel { border: 1px solid var(--zb-divider); border-radius: 8px; padding: var(--zb-spacing-md); margin-bottom: var(--zb-spacing-md); }
    .panel h2 { margin: 0 0 var(--zb-spacing-sm); font-size: 18px; }
    .count { color: var(--zb-secondary-text); font-weight: 400; font-size: var(--zb-font-size-sm); }
    ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--zb-spacing-xs); }
    .tasks li { display: flex; align-items: center; gap: var(--zb-spacing-sm); }
    .task-name { flex: 1; }
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
export class BoardDetail {
  protected readonly TASK_PREVIEW = TASK_PREVIEW;
  protected readonly editOpen = signal(false);

  /** The board + its task preview as one auto-cancelling resource (see {@link detailResource}). */
  private readonly detail = detailResource(
    async ({ api, id }) => {
      const boardApi = api.portalClient.getBoardApi();
      const uuid = api.toUUID(id);
      const [board, taskResults] = await Promise.all([
        boardApi.get(uuid),
        boardApi.searchTasks(uuid, {} as SearchTaskBody, 1, TASK_PREVIEW),
      ]);
      return { board, tasks: taskResults.items };
    },
    { missingId: 'No board id.', loadFailed: 'Could not load this board.' },
  );

  protected readonly loading = this.detail.loading;
  protected readonly error = this.detail.error;
  protected readonly board = computed(() => this.detail.value()?.board ?? null);
  protected readonly tasks = computed(() => this.detail.value()?.tasks ?? []);
}
