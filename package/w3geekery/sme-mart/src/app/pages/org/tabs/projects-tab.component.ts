import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MyProjectList } from '../../my-projects/my-project-list.component';

@Component({
  selector: 'app-org-projects-tab',
  standalone: true,
  imports: [MyProjectList],
  template: `<app-my-project-list />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsTab {}
