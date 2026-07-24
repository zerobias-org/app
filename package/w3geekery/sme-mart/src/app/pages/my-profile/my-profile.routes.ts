import { Routes } from '@angular/router';
import { MyProfile } from './my-profile.component';
import { MyProfileSettings } from './my-profile-settings.component';
import { ComingSoon } from '../coming-soon/coming-soon.component';

// Phase 31-A: Overview/Expertise/Services/Reviews/Moderate Reviews tabs
// land on Coming Soon for v1.4. Only Settings is functional (profile role +
// theme picker). Original child components preserved on disk; re-wire when
// each surface is product-ready post-BACKLOG-098 / BACKLOG-099.
// import { MyProfileOverview } from './my-profile-overview.component';
// import { MyProfileExpertise } from './my-profile-expertise.component';
// import { MyProfileServices } from './my-profile-services.component';
// import { MyProfileReviews } from './my-profile-reviews.component';
// import { MyProfileModerateReviews } from './my-profile-moderate-reviews.component';

export const MY_PROFILE_ROUTES: Routes = [
  {
    path: '',
    component: MyProfile,
    children: [
      // v1.4 default landing: Settings (only functional tab).
      { path: '', redirectTo: 'settings', pathMatch: 'full' },
      { path: 'overview', component: ComingSoon, data: { title: 'Overview' } },
      { path: 'expertise', component: ComingSoon, data: { title: 'Expertise' } },
      { path: 'services', component: ComingSoon, data: { title: 'Services' } },
      { path: 'reviews', component: ComingSoon, data: { title: 'Reviews' } },
      { path: 'moderate-reviews', component: ComingSoon, data: { title: 'Moderate Reviews' } },
      { path: 'settings', component: MyProfileSettings },
    ],
  },
];
