import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { MainLayout } from './shared/layouts/main.layout/main.layout';
import { ErrorPage } from './features/error-page/error-page';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        component: Home,
      },
      {
        path: 'designs',
        loadComponent: () => import('./features/designs/designs').then(m => m.Designs),
      },
      {
        path: 'designs/design-studio',
        loadComponent: () => import('./features/designs/design-studio/design-studio').then(m => m.DesignStudio),
      },
    ],
  },

  // Error
    {
      path: '**',
      component: MainLayout,
      children: [
        {
          path: '',
          component: ErrorPage,
        }
      ]
    }
];
