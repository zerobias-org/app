import { Routes } from '@angular/router';
import { AppShell } from './layout/app-shell.component';
import { Home } from './pages/home/home.component';
import { ProviderList } from './pages/providers/provider-list.component';
import { ProviderDetail } from './pages/providers/provider-detail.component';
import { ServiceCatalog } from './pages/services/service-catalog.component';
import { RfpList } from './pages/rfps/rfp-list.component';
import { RfpDetail } from './pages/rfps/rfp-detail.component';
import { EngagementDetail } from './pages/engagements/engagement-detail.component';
import { EngagementEdit } from './pages/engagements/engagement-edit.component';
import { ENGAGEMENT_TAB_ROUTES } from './pages/engagements/engagement.routes';
import { ComingSoon } from './pages/coming-soon/coming-soon.component';

export const routes: Routes = [
  {
    path: '',
    component: AppShell,
    children: [
      { path: '', component: Home },
      { path: 'providers', component: ProviderList },
      { path: 'providers/:id', component: ProviderDetail },
      { path: 'services', component: ServiceCatalog },
      { path: 'rfps', component: RfpList },
      { path: 'rfps/:id', component: RfpDetail },
      { path: 'rfps/:id/edit', component: EngagementEdit },
      { path: 'engagements/:id', component: EngagementDetail, children: ENGAGEMENT_TAB_ROUTES },
      // Legacy redirects
      { path: 'engagements', redirectTo: 'rfps', pathMatch: 'full' },
      {
        path: 'my/engagements',
        loadChildren: () =>
          import('./pages/my-engagements/my-engagements.routes').then((m) => m.MY_ENGAGEMENTS_ROUTES),
      },
      {
        path: 'my-profile',
        loadChildren: () =>
          import('./pages/my-profile/my-profile.routes').then((m) => m.MY_PROFILE_ROUTES),
      },
      { path: 'catalog', component: ComingSoon, data: { title: 'Browse Catalog' } },
      { path: 'request-assistance', component: ComingSoon, data: { title: 'Request Assistance' } },
      { path: 'feedback', component: ComingSoon, data: { title: 'Site Feedback' } },
      {
        path: 'admin',
        loadChildren: () =>
          import('./pages/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
    ],
  },
];
