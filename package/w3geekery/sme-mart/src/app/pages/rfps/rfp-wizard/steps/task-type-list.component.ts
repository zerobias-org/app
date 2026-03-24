import {
  Component, Input, Output, EventEmitter, signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import type { RfpTaskGroup } from '../../../../core/models';
import type { DocumentType } from '../../../../core/models/document.model';

/** All available task types a buyer can add to their RFP. */
const TASK_TYPE_OPTIONS: { taskType: DocumentType; taskTypeTagName: string; displayName: string }[] = [
  { taskType: 'security_requirements', taskTypeTagName: 'SECURITY', displayName: 'Security Requirements' },
  { taskType: 'compliance', taskTypeTagName: 'COMPLIANCE', displayName: 'Compliance Requirements' },
  { taskType: 'legal_terms', taskTypeTagName: 'LEGAL', displayName: 'Legal Requirements' },
  { taskType: 'functional_spec', taskTypeTagName: 'FUNCTIONAL', displayName: 'Functional Requirements' },
  { taskType: 'budget', taskTypeTagName: 'FINANCIAL', displayName: 'Financial Requirements' },
  { taskType: 'sow', taskTypeTagName: 'SOW', displayName: 'Statement of Work' },
];

@Component({
  selector: 'app-task-type-list',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatListModule, MatBadgeModule, MatMenuModule],
  template: `
    <div class="task-type-list">
      <div class="list-header">
        <h4>Task Types</h4>
        <button mat-icon-button [matMenuTriggerFor]="addMenu" aria-label="Add task type">
          <mat-icon>add</mat-icon>
        </button>
        <mat-menu #addMenu="matMenu">
          @for (opt of availableTypes(); track opt.taskType) {
            <button mat-menu-item (click)="addGroup(opt)">
              {{ opt.displayName }}
            </button>
          } @empty {
            <button mat-menu-item disabled>All types added</button>
          }
        </mat-menu>
      </div>

      <mat-nav-list>
        @for (group of taskGroups; track group.taskType) {
          <a mat-list-item
            [activated]="group.taskType === selectedType"
            (click)="select(group.taskType)">
            <span matListItemTitle>{{ group.displayName }}</span>
            <span matListItemMeta>
              <span class="req-count"
                [matBadge]="group.requirements.length"
                matBadgeOverlap="false"
                matBadgeSize="small">
              </span>
            </span>
          </a>
        } @empty {
          <div class="empty-state">
            <p>No task types added yet.</p>
            <p>Click <mat-icon inline>add</mat-icon> to add a category.</p>
          </div>
        }
      </mat-nav-list>
    </div>
  `,
  styles: [`
    .task-type-list { min-width: 220px; }
    .list-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 8px;
    }
    .list-header h4 { margin: 0; font-weight: 500; }
    .req-count { margin-right: 8px; }
    .empty-state {
      padding: 16px;
      color: var(--mat-sys-on-surface-variant, #999);
      font-size: 13px;
      text-align: center;
    }
    .empty-state mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      vertical-align: middle;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskTypeListComponent {
  @Input() taskGroups: RfpTaskGroup[] = [];
  @Input() selectedType: DocumentType | null = null;
  @Output() selectedTypeChange = new EventEmitter<DocumentType>();
  @Output() groupAdded = new EventEmitter<RfpTaskGroup>();
  @Output() groupRemoved = new EventEmitter<DocumentType>();

  readonly availableTypes = signal<typeof TASK_TYPE_OPTIONS>([]);

  ngOnChanges(): void {
    this.updateAvailable();
  }

  ngOnInit(): void {
    this.updateAvailable();
  }

  select(taskType: DocumentType): void {
    this.selectedTypeChange.emit(taskType);
  }

  addGroup(opt: typeof TASK_TYPE_OPTIONS[0]): void {
    const group: RfpTaskGroup = {
      taskType: opt.taskType,
      taskTypeTagName: opt.taskTypeTagName,
      displayName: opt.displayName,
      requirements: [],
    };
    this.groupAdded.emit(group);
    this.selectedTypeChange.emit(opt.taskType);
  }

  private updateAvailable(): void {
    const existing = new Set(this.taskGroups.map(g => g.taskType));
    this.availableTypes.set(TASK_TYPE_OPTIONS.filter(o => !existing.has(o.taskType)));
  }
}
