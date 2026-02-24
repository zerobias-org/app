import { Routes } from '@angular/router';
import { MyEngagementList } from './my-engagement-list.component';
import { EngagementDetail } from '../engagements/engagement-detail.component';
import { EngagementEdit } from '../engagements/engagement-edit.component';

export const MY_ENGAGEMENTS_ROUTES: Routes = [
  { path: '', component: MyEngagementList },
  { path: ':id', component: EngagementDetail },
  { path: ':id/edit', component: EngagementEdit },
];
