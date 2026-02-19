import { Routes } from '@angular/router';
import { AppShell } from './layout/app-shell.component';
import { Home } from './pages/home/home.component';
import { ProviderList } from './pages/providers/provider-list.component';
import { ProviderDetail } from './pages/providers/provider-detail.component';
import { ServiceCatalog } from './pages/services/service-catalog.component';
import { EngagementList } from './pages/engagements/engagement-list.component';
import { EngagementNew } from './pages/engagements/engagement-new.component';
import { EngagementDetail } from './pages/engagements/engagement-detail.component';
import { EngagementEdit } from './pages/engagements/engagement-edit.component';

export const routes: Routes = [
  {
    path: '',
    component: AppShell,
    children: [
      { path: '', component: Home },
      { path: 'providers', component: ProviderList },
      { path: 'providers/:id', component: ProviderDetail },
      { path: 'services', component: ServiceCatalog },
      { path: 'engagements', component: EngagementList },
      { path: 'engagements/new', component: EngagementNew },
      { path: 'engagements/:id', component: EngagementDetail },
      { path: 'engagements/:id/edit', component: EngagementEdit },
      {
        path: 'my-profile',
        loadChildren: () =>
          import('./pages/my-profile/my-profile.routes').then((m) => m.MY_PROFILE_ROUTES),
      },
      {
        path: 'admin',
        loadChildren: () =>
          import('./pages/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
    ],
  },
];
