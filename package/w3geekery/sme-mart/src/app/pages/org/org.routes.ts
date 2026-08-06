import { Routes } from '@angular/router';
import { OrgPage } from './org.component';

export const ORG_ROUTES: Routes = [
  {
    path: '',
    component: OrgPage,
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      // documents / engagements / projects tabs deleted with the platform.Project
      // cutover — Documents belongs to the Projects App (FileService-backed), and
      // engagements/projects are cards that link out rather than surfaces we own.
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
      {
        path: 'profile',
        loadComponent: () =>
          import('./tabs/vendor-profile-tab.component').then(m => m.VendorProfileTab),
      },
    ],
  },
];
