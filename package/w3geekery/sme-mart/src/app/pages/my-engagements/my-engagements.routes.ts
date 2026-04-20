import { Routes } from '@angular/router';
import { MyEngagementList } from './my-engagement-list.component';
import { EngagementDetail } from '../engagements/engagement-detail.component';
import { EngagementEdit } from '../engagements/engagement-edit.component';
import { ENGAGEMENT_TAB_ROUTES } from '../engagements/engagement.routes';

export const MY_ENGAGEMENTS_ROUTES: Routes = [
  { path: '', component: MyEngagementList },
  { path: ':id', component: EngagementDetail, children: ENGAGEMENT_TAB_ROUTES },
  { path: ':id/edit', component: EngagementEdit },
];
