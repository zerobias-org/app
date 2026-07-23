import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ZbSnakeToSpacesPipe } from '@zerobias-org/ngx-library';

import { detailResource } from '../../shared/detail-resource';
import { Drawer } from '../../shared/drawer/drawer';
import { MarkdownViewer } from '../../shared/markdown-viewer/markdown-viewer';
import { CommentComposer } from './comment-composer';
import { EditTaskForm } from './edit-task-form';

/**
 * TaskDetail — the read drill-down for a task (twin of example-nextjs-v2's TaskDetail). Reached from
 * the tasks list via `/tasks/detail?id=<uuid>`. Reads span BOTH clients:
 *
 *   portalClient.getTaskApi().get(id)            -> the task itself
 *   platformClient.getTaskApi().listSubtasks(id) -> child tasks
 *   platformClient.getTaskApi().listComments(id) -> the comment thread
 *
 * The task carries `nextTransitions` — the workflow moves available from its current status. That is
 * how status changes happen (a transition, not a status string); the Edit drawer sends one.
 */
@Component({
  selector: 'app-task-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,
    DatePipe,
    RouterLink,
    MatIconModule,
    ZbSnakeToSpacesPipe,
    Drawer,
    MarkdownViewer,
    CommentComposer,
    EditTaskForm,
  ],
  template: `
    <a class="back" routerLink="/tasks"><mat-icon>arrow_back</mat-icon> Tasks</a>

    @if (loading()) {
      <p class="state">Loading task…</p>
    } @else if (error()) {
      <p class="state error">{{ error() }}</p>
    } @else if (task(); as t) {
      <header class="head">
        <div class="title">
          <code class="code">{{ t.code }}</code>
          <h1>{{ t.name }}</h1>
          <span class="zb-chip square task-status" [ngClass]="t.status">{{ t.status | snakeToSpaces: 'everyFirst' }}</span>
          @if (t.priority.label) {
            <span class="zb-chip priority" [ngClass]="t.priority.label">{{ t.priority.label }}</span>
          }
        </div>
        <button type="button" class="btn-stroked" (click)="editOpen.set(true)">Edit</button>
      </header>

      @if (t.description) {
        <div class="desc"><app-markdown-viewer [content]="t.description" /></div>
      }

      <dl class="meta">
        <div><dt>Activity</dt><dd>{{ t.activity.name }}</dd></div>
        <div>
          <dt>Board</dt>
          <dd>
            @if (t.board.id) {
              <a class="link" [routerLink]="['/boards/detail']" [queryParams]="{ id: t.board.id.toString() }">{{ t.board.name }}</a>
            } @else { — }
          </dd>
        </div>
        <div><dt>Workflow</dt><dd>{{ t.workflow.name }}</dd></div>
      </dl>

      <section class="panel">
        <h2>Available transitions</h2>
        @if (transitions().length === 0) {
          <p class="state">No transitions from "{{ t.status }}".</p>
        } @else {
          <div class="transitions">
            @for (tr of transitions(); track tr.id) {
              <span class="transition">{{ tr.name }} <span class="arrow">-></span> {{ tr.status }}</span>
            }
          </div>
          <p class="hint"><code>update(id, {{ '{ transitionId }' }})</code> moves the task — status is a workflow transition, not a free-text field.</p>
        }
      </section>

      <section class="panel">
        <h2>Subtasks <span class="count">({{ subtasks().length }})</span></h2>
        @if (subtasks().length === 0) {
          <p class="state">No subtasks.</p>
        } @else {
          <ul class="tasks">
            @for (s of subtasks(); track s.id) {
              <li>
                <code>{{ s.code }}</code>
                <span class="task-name">{{ s.name }}</span>
                <span class="zb-chip square task-status" [ngClass]="s.status">{{ s.status | snakeToSpaces: 'everyFirst' }}</span>
              </li>
            }
          </ul>
        }
      </section>

      <section class="panel">
        <h2>Comments <span class="count">({{ comments().length }})</span></h2>
        @if (comments().length === 0) {
          <p class="state">No comments.</p>
        } @else {
          <ul class="comments">
            @for (c of comments(); track c.id) {
              <li>
                <div class="comment-head">
                  <strong>{{ c.person?.name ?? c.party?.name ?? 'Unknown' }}</strong>
                  <time>{{ c.created.toString() | date: 'short' }}</time>
                </div>
                <app-markdown-viewer [content]="c.commentMarkdown ?? c.commentTxt" />
              </li>
            }
          </ul>
        }
        <app-comment-composer [taskId]="t.id" />
      </section>

      <app-drawer [open]="editOpen()" title="Edit task" (close)="editOpen.set(false)">
        @if (editOpen()) {
          <app-edit-task-form [task]="t" />
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
    .title h1 { margin: 0; font-size: 24px; }
    .code { color: var(--zb-primary); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .desc { margin: var(--zb-spacing-sm) 0 var(--zb-spacing-md); }
    .meta { display: flex; flex-wrap: wrap; gap: var(--zb-spacing-lg); margin: 0 0 var(--zb-spacing-lg); }
    .meta dt { color: var(--zb-secondary-text); font-size: var(--zb-font-size-xs, 12px); margin: 0; }
    .meta dd { margin: 2px 0 0; color: var(--zb-text); }
    .link { color: var(--zb-primary); text-decoration: none; }
    .link:hover { text-decoration: underline; }
    .panel { border: 1px solid var(--zb-divider); border-radius: 8px; padding: var(--zb-spacing-md); margin-bottom: var(--zb-spacing-md); }
    .panel h2 { margin: 0 0 var(--zb-spacing-sm); font-size: 18px; }
    .count { color: var(--zb-secondary-text); font-weight: 400; font-size: var(--zb-font-size-sm); }
    .transitions { display: flex; flex-wrap: wrap; gap: var(--zb-spacing-sm); }
    .transition {
      padding: 4px 10px; border: 1px solid var(--zb-divider); border-radius: 999px;
      font-size: var(--zb-font-size-sm); color: var(--zb-text);
    }
    .transition .arrow { color: var(--zb-secondary-text); }
    .hint { margin: var(--zb-spacing-sm) 0 0; color: var(--zb-secondary-text); font-size: var(--zb-font-size-sm); }
    ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--zb-spacing-xs); }
    .tasks li { display: flex; align-items: center; gap: var(--zb-spacing-sm); }
    .task-name { flex: 1; }
    .comments li { color: var(--zb-text); padding: var(--zb-spacing-sm) 0; border-bottom: 1px solid var(--zb-divider); }
    .comment-head { display: flex; align-items: baseline; gap: var(--zb-spacing-sm); margin-bottom: 4px; }
    .comment-head strong { color: var(--zb-text); font-size: var(--zb-font-size-sm); }
    .comment-head time { color: var(--zb-secondary-text); font-size: var(--zb-font-size-xs, 12px); }
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
export class TaskDetail {
  protected readonly editOpen = signal(false);

  /** The task + its subtasks + comment thread as one auto-cancelling resource (see {@link detailResource}). */
  private readonly detail = detailResource(
    async ({ api, id }) => {
      const uuid = api.toUUID(id);
      const [task, subs, cmts] = await Promise.all([
        api.portalClient.getTaskApi().get(uuid),
        api.platformClient.getTaskApi().listSubtasks(uuid),
        api.platformClient.getTaskApi().listComments(uuid),
      ]);
      return { task, subtasks: subs.items, comments: cmts.items };
    },
    { missingId: 'No task id.', loadFailed: 'Could not load this task.' },
  );

  protected readonly loading = this.detail.loading;
  protected readonly error = this.detail.error;
  protected readonly task = computed(() => this.detail.value()?.task ?? null);
  protected readonly subtasks = computed(() => this.detail.value()?.subtasks ?? []);
  protected readonly comments = computed(() => this.detail.value()?.comments ?? []);

  /** Workflow moves available from the task's current status (drives the transitions panel). */
  protected readonly transitions = computed(() => this.task()?.nextTransitions ?? []);
}
