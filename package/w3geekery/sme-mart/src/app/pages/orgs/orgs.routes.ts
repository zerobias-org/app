import { Routes } from '@angular/router';
import { OrgListComponent } from './org-list.component';
import { OrgDetailComponent } from './org-detail.component';

export const ORGS_ROUTES: Routes = [
  {
    path: '',
    component: OrgListComponent,
  },
  {
    path: ':orgId',
    component: OrgDetailComponent,
  },
];
