import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ZbEmptyStateContainerComponent } from '@zerobias-org/ngx-library';
import { TaskListPanel } from '../../../shared/components/task-list-panel/task-list-panel.component';
import { EngagementContextService } from '../../../core/services/engagement-context.service';

@Component({
  selector: 'app-tasks-tab',
  standalone: true,
  imports: [
    ZbEmptyStateContainerComponent,
    TaskListPanel,
  ],
  templateUrl: './tasks-tab.component.html',
  styleUrl: './_tab-shared.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksTab {
  readonly ctx = inject(EngagementContextService);
}
