import { Routes } from '@angular/router';
import { AppShell } from './layout/app-shell.component';
import { Home } from './pages/home/home.component';
// Phase 31-A: imports removed alongside hidden route components. Re-import
// when restoring post-BACKLOG-099 architectural decision + errata 039 fix.
// import { ProviderList } from './pages/providers/provider-list.component';
// import { ProviderDetail } from './pages/providers/provider-detail.component';
// import { ServiceCatalog } from './pages/services/service-catalog.component';
// import { RfpList } from './pages/rfps/rfp-list.component';
// import { RfpDetail } from './pages/rfps/rfp-detail.component';
// import { RfpWizard } from './pages/rfps/rfp-wizard/rfp-wizard.component';
// import { BidWizard } from './pages/rfps/bid-wizard/bid-wizard.component';
// import { BidComparisonPage } from './pages/rfps/bid-comparison-page.component';
import { ComingSoon } from './pages/coming-soon/coming-soon.component';
import { FeatureComingSoonComponent } from './pages/default-project-board/feature-coming-soon.component';

export const routes: Routes = [
  {
    path: '',
    component: AppShell,
    children: [
      { path: '', component: Home },
      // Phase 31-A: surfaces hidden/Coming Soon for v1.4 dogfood. Original
      // routes preserved as comments for one-line restoration post-BACKLOG-099
      // architectural decision + errata 039 fix.
      // { path: 'providers', component: ProviderList },
      // { path: 'providers/:id', component: ProviderDetail },
      // { path: 'services', component: ServiceCatalog },
      // { path: 'rfps', component: RfpList },
      // { path: 'rfps/new', component: RfpWizard },
      // { path: 'rfps/:id', component: RfpDetail },
      // { path: 'rfps/:id/edit', component: RfpWizard },
      // { path: 'rfps/:id/compare', component: BidComparisonPage },
      // { path: 'rfps/:id/bid', component: BidWizard },
      // { path: 'rfps/:id/bid/:bidId', component: BidWizard },
      { path: 'providers', component: ComingSoon, data: { title: 'Browse Providers' } },
      { path: 'providers/:id', component: ComingSoon, data: { title: 'Provider Detail' } },
      { path: 'services', component: ComingSoon, data: { title: 'Services' } },
      { path: 'rfps', component: ComingSoon, data: { title: 'RFPs' } },
      { path: 'rfps/:id', redirectTo: 'rfps' },
      { path: 'rfps/:id/:tail', redirectTo: 'rfps' },
      // Engagements + Projects (top-level — the /my/ prefix was dropped
      // 2026-05-14; lists are implicitly "yours" via the org-session header).
      // Engagements no longer drill in SME Mart. An engagement is a CARD here; all
      // detail (notes, documents, tasks, boards) lives in the Projects App, which the
      // card links out to.
      //
      // The local RFP create/edit surface is GONE as of the platform.Project cutover.
      // It was never a separate write path — `createAsRfp`/`publishRfp` were thin
      // wrappers over SmeMartProject CRUD, writing fields (category, budgetType,
      // budgetMin/Max, timeline, status) that the retired class owned and
      // platform.Project does not. There was nothing to port. RFP writes get minted
      // fresh when the RFP surface is actually built, and may not be needed at all.
      { path: 'engagements', component: ComingSoon, data: { title: 'Engagements' } },
      { path: 'engagements/:id/edit', redirectTo: 'engagements' },
      // Legacy /my/* redirects (preserve any bookmarks / cached deep-links).
      { path: 'my/engagements', redirectTo: 'engagements', pathMatch: 'full' },
      // Phase 30 placeholders — deep-link-only honest "coming soon" pages for
      // 046 / 066 / 065 (no nav entries; surfaced only when something deep-links).
      {
        path: 'org-documents',
        component: FeatureComingSoonComponent,
        data: {
          title: 'Org Documents — Coming Soon',
          description: 'Centralized document management and sharing for your organization is on the roadmap. Once available, you\'ll be able to upload, organize, and share documents across engagements.',
          featureKey: '046',
        },
      },
      {
        path: 'engagement-dashboard',
        component: FeatureComingSoonComponent,
        data: {
          title: 'Engagement Dashboard — Coming Soon',
          description: 'Aggregated metrics and progress views across all your engagements are coming soon. You\'ll see status, milestones, and key activity at a glance.',
          featureKey: '066',
        },
      },
      {
        path: 'message-center',
        component: FeatureComingSoonComponent,
        data: {
          title: 'Message Center — Coming Soon',
          description: 'Cross-party messaging across all your engagements is coming soon. Today, conversations live within individual engagements.',
          featureKey: '065',
        },
      },
      {
        path: 'org',
        loadChildren: () =>
          import('./pages/org/org.routes').then((m) => m.ORG_ROUTES),
      },
      {
        path: 'orgs',
        loadChildren: () =>
          import('./pages/orgs/orgs.routes').then((m) => m.ORGS_ROUTES),
      },
      // Invitations were RFP-invitation surfaces reading SmeMartProject. Gone with
      // it; rebuilt against the RFP drawer when that lands.
      { path: 'my/invitations', component: ComingSoon, data: { title: 'My Invitations' } },
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
