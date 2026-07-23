import { ChangeDetectionStrategy, Component, computed, forwardRef, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import type { ProjectTreeNode } from '@zerobias-com/portal-sdk';
import type { UUID } from '@zerobias-org/types-core-js';

/** The node a new sub-project would hang under — emitted up to ProjectDetail's create drawer. */
export interface CreateParent {
  readonly id: UUID;
  readonly name: string;
}

/**
 * One node of `ProjectTree` plus its descendants (twin of example-nextjs-v2's `TreeNode`).
 * `getTree` returns the whole hierarchy from the topmost ancestor down, so this renders
 * recursively — the node matching `currentId` is highlighted and NOT linked, every other node
 * links to its own detail, which makes the tree double as navigation up the ancestry and down
 * the descendants.
 *
 * Recursion note: a standalone component cannot list itself in `imports` directly (the identifier
 * is still in its temporal dead zone when the decorator is evaluated), so the self-reference goes
 * through `forwardRef`.
 *
 * `addChild` re-emits from nested nodes, so a click at any depth reaches ProjectDetail.
 */
@Component({
  selector: 'app-project-tree-node',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, forwardRef(() => ProjectTreeNodeComponent)],
  template: `
    <li>
      <div class="node" [class.current]="isCurrent()">
        @if (isCurrent()) {
          <span class="name">{{ name() }}</span>
        } @else {
          <a class="name" routerLink="/projects/detail" [queryParams]="linkParams()">{{ name() }}</a>
        }

        @if (typeName(); as type) {
          <span class="zb-chip square generic">{{ type }}</span>
        }
        @if (memberCount() !== null) {
          <span class="node-meta">{{ memberCount() }} members</span>
        }

        <button
          type="button"
          class="add"
          [attr.aria-label]="addLabel()"
          [title]="addLabel()"
          (click)="addChild.emit({ id: node().id, name: name() })"
        >
          <mat-icon>add</mat-icon>
        </button>
      </div>

      @if (children().length) {
        <ul class="children">
          @for (child of children(); track child.id.toString()) {
            <app-project-tree-node
              [node]="child"
              [currentId]="currentId()"
              (addChild)="addChild.emit($event)"
            />
          }
        </ul>
      }
    </li>
  `,
  styles: `
    :host { display: contents; }
    li { display: block; }
    .node {
      display: flex; align-items: center; gap: var(--zb-spacing-sm);
      padding: 4px 0;
    }
    .node.current .name { color: var(--zb-text); font-weight: 600; }
    .name { color: var(--zb-primary); text-decoration: none; }
    a.name:hover { text-decoration: underline; }
    .node-meta { color: var(--zb-secondary-text); font-size: var(--zb-font-size-sm); }
    .add {
      display: inline-flex; align-items: center; justify-content: center;
      width: 24px; height: 24px; padding: 0;
      border: 1px solid var(--zb-divider); border-radius: 4px;
      background: transparent; color: var(--zb-secondary-text); cursor: pointer;
      opacity: 0; transition: opacity 120ms ease;
    }
    .node:hover .add, .add:focus-visible { opacity: 1; }
    .add:hover { color: var(--zb-primary); border-color: var(--zb-primary); }
    .add mat-icon { font-size: 16px; width: 16px; height: 16px; }
    /* Indent each level and draw the containment line. */
    .children {
      list-style: none; margin: 0; padding: 0 0 0 var(--zb-spacing-md);
      border-left: 1px solid var(--zb-divider);
      margin-left: 6px;
    }
  `,
})
export class ProjectTreeNodeComponent {
  readonly node = input.required<ProjectTreeNode>();
  /** Stringified id of the project being viewed — that node renders highlighted, not linked. */
  readonly currentId = input.required<string>();

  readonly addChild = output<CreateParent>();

  protected readonly name = computed(() => this.node().name);
  protected readonly isCurrent = computed(() => this.node().id.toString() === this.currentId());
  protected readonly children = computed(() => this.node().children ?? []);
  protected readonly typeName = computed(() => this.node().projectType?.name ?? null);
  protected readonly memberCount = computed(() => this.node().memberCount ?? null);
  protected readonly linkParams = computed(() => ({ id: this.node().id.toString() }));
  protected readonly addLabel = computed(() => `Create sub-project of ${this.name()}`);
}
