import { Routes } from '@angular/router';
import { OverviewTab } from './tabs/overview-tab.component';
import { DetailsTab } from './tabs/details-tab.component';
import { TasksTab } from './tabs/tasks-tab.component';
import { TimelineTab } from './tabs/timeline-tab.component';
import { NotesTab } from './tabs/notes-tab.component';

/**
 * Child routes for engagement detail tabs.
 * Reused by both /rfps/:id and /my/engagements/:id.
 */
export const ENGAGEMENT_TAB_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'overview' },
  { path: 'overview', component: OverviewTab },
  { path: 'details', component: DetailsTab },
  { path: 'tasks', component: TasksTab },
  { path: 'timeline', component: TimelineTab },
  { path: 'notes', component: NotesTab },
];
