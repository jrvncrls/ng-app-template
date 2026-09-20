import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'error',
    loadComponent: () => import('./features/error-page/error-page').then((m) => m.ErrorPage),
  },
  {
    path: 'showcase',
    loadComponent: () =>
      import('./features/component-showcase/component-showcase').then((m) => m.ComponentShowcase),
  },
  // Feature areas register their own lazy-loaded routes here, e.g.:
  // {
  //   path: 'dashboard',
  //   loadChildren: () =>
  //     import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
  //   canActivate: [authGuard],
  // },
  { path: '**', redirectTo: 'error' },
];
