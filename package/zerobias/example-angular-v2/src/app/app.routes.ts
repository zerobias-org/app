import { Routes } from '@angular/router';
import { Home } from './pages/home/home';

export const routes: Routes = [
  { path: '', component: Home, title: 'Home · ZeroBias v2 (Angular)' },
  {
    path: 'products',
    loadComponent: () => import('./pages/products/products').then((m) => m.Products),
    title: 'Products · ZeroBias v2 (Angular)',
  },
  {
    path: 'pkv',
    loadComponent: () => import('./pages/pkv/pkv').then((m) => m.Pkv),
    title: 'Key-Value · ZeroBias v2 (Angular)',
  },
  {
    path: 'projects',
    loadComponent: () => import('./pages/projects/projects').then((m) => m.Projects),
    title: 'Projects · ZeroBias v2 (Angular)',
  },
  {
    path: 'projects/detail',
    loadComponent: () =>
      import('./pages/projects/project-detail').then((m) => m.ProjectDetail),
    title: 'Project · ZeroBias v2 (Angular)',
  },
  {
    path: 'module',
    loadComponent: () => import('./pages/module/module-usage').then((m) => m.ModuleUsage),
    title: 'Module Usage · ZeroBias v2 (Angular)',
  },
  {
    path: 'boards',
    loadComponent: () => import('./pages/boards/boards').then((m) => m.Boards),
    title: 'Boards · ZeroBias v2 (Angular)',
  },
  {
    path: 'boards/detail',
    loadComponent: () => import('./pages/boards/board-detail').then((m) => m.BoardDetail),
    title: 'Board · ZeroBias v2 (Angular)',
  },
  {
    path: 'tasks',
    loadComponent: () => import('./pages/tasks/tasks').then((m) => m.Tasks),
    title: 'Tasks · ZeroBias v2 (Angular)',
  },
  {
    path: 'tasks/detail',
    loadComponent: () => import('./pages/tasks/task-detail').then((m) => m.TaskDetail),
    title: 'Task · ZeroBias v2 (Angular)',
  },
  // Feature demos land here as lazy routes (loadComponent) through Phases B–C.
];
