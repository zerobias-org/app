import { Routes } from '@angular/router';
import { OrgPage } from './org.component';

export const ORG_ROUTES: Routes = [
  {
    path: '',
    component: OrgPage,
    children: [
      { path: '', redirectTo: 'documents', pathMatch: 'full' },
      {
        path: 'documents',
        loadComponent: () =>
          import('./tabs/documents-tab.component').then(m => m.DocumentsTab),
      },
      {
        path: 'engagements',
        loadComponent: () =>
          import('./tabs/engagements-tab.component').then(m => m.EngagementsTab),
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./tabs/projects-tab.component').then(m => m.ProjectsTab),
      },
      {
        path: 'members',
        loadComponent: () =>
          import('./tabs/members-tab.component').then(m => m.MembersTab),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./tabs/settings-tab.component').then(m => m.SettingsTab),
      },
    ],
  },
];
