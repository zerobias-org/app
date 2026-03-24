import { Routes } from '@angular/router';
import { MyProfile } from './my-profile.component';
import { MyProfileOverview } from './my-profile-overview.component';
import { MyProfileExpertise } from './my-profile-expertise.component';
import { MyProfileServices } from './my-profile-services.component';
import { MyProfileReviews } from './my-profile-reviews.component';
import { MyProfileModerateReviews } from './my-profile-moderate-reviews.component';
import { MyProfileSettings } from './my-profile-settings.component';

export const MY_PROFILE_ROUTES: Routes = [
  {
    path: '',
    component: MyProfile,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: MyProfileOverview },
      { path: 'expertise', component: MyProfileExpertise },
      { path: 'services', component: MyProfileServices },
      { path: 'reviews', component: MyProfileReviews },
      { path: 'moderate-reviews', component: MyProfileModerateReviews },
      { path: 'settings', component: MyProfileSettings },
    ],
  },
];
