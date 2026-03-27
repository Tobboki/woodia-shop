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
