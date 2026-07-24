import { Routes } from '@angular/router';
import { OverviewTab } from './tabs/overview-tab.component';
import { EngagementBoardsTabComponent } from './tabs/boards-tab.component';
import { TimelineTab } from './tabs/timeline-tab.component';
import { NotesTab } from './tabs/notes-tab.component';
import { DocumentsTab } from './tabs/documents-tab.component';
import { VettingTab } from './tabs/vetting-tab.component';
import { ProjectList } from '../project/project-list.component';

/**
 * Child routes for engagement detail tabs.
 * Reused by both /rfps/:id and /engagements/:id.
 */
export const ENGAGEMENT_TAB_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'overview' },
  { path: 'overview', component: OverviewTab },
  { path: 'projects', component: ProjectList },
  { path: 'documents', component: DocumentsTab },
  // /details deprecated 2026-05-15 — DetailsTab removed; redirect for any stale deep links
  { path: 'details', redirectTo: 'overview' },
  { path: 'boards', component: EngagementBoardsTabComponent },
  { path: 'vetting', component: VettingTab },
  { path: 'timeline', component: TimelineTab },
  { path: 'notes', component: NotesTab },
];
