import { Routes } from '@angular/router';
import { BoardDetailComponent } from './board-detail.component';

/** Board feature routes. Registered as a child of the onboarding-guarded shell
 *  (app.routes.ts) so ProjectContextService.isAdmin is hydrated on deep-link. */
export const BOARDS_ROUTES: Routes = [
  { path: ':boardId', component: BoardDetailComponent, data: { title: 'Board' } },
];
