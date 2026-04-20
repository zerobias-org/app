import { Routes } from '@angular/router';
import { ProjectDetail } from './project-detail.component';
import { ProjectOverviewTab } from './tabs/project-overview-tab.component';
import { ProjectComingSoonTab } from './tabs/project-coming-soon-tab.component';
import { ProjectPartiesTabComponent } from './tabs/project-parties-tab.component';
import { ProjectInvitedVendorsTabComponent } from './tabs/project-invited-vendors-tab.component';

/**
 * Top-level project routes.
 * /project/:projId/ — NOT nested under engagements.
 */
export const PROJECT_ROUTES: Routes = [
  {
    path: ':projId',
    component: ProjectDetail,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      { path: 'overview', component: ProjectOverviewTab },
      { path: 'boards', component: ProjectComingSoonTab, data: { title: 'Boards' } },
      { path: 'boards/:boardId', component: ProjectComingSoonTab, data: { title: 'Board' } },
      { path: 'prd', component: ProjectComingSoonTab, data: { title: 'PRD' } },
      { path: 'plan', component: ProjectComingSoonTab, data: { title: 'Plan' } },
      { path: 'notes', component: ProjectComingSoonTab, data: { title: 'Notes' } },
      { path: 'documents', component: ProjectComingSoonTab, data: { title: 'Documents' } },
      { path: 'timeline', component: ProjectComingSoonTab, data: { title: 'Timeline' } },
      { path: 'parties', component: ProjectPartiesTabComponent, data: { title: 'Parties' } },
      { path: 'invited-vendors', component: ProjectInvitedVendorsTabComponent, data: { title: 'Invited Vendors' } },
      { path: 'messages', component: ProjectComingSoonTab, data: { title: 'Messages' } },
      { path: 'dashboard', component: ProjectComingSoonTab, data: { title: 'Dashboard' } },
      { path: 'financials', component: ProjectComingSoonTab, data: { title: 'Financials' } },
      { path: 'compliance', component: ProjectComingSoonTab, data: { title: 'Compliance' } },
      { path: 'reviews', component: ProjectComingSoonTab, data: { title: 'Reviews' } },
    ],
  },
];
