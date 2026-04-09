import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { MainLayout } from '@admin-shared/layouts/main/main.layout';
import { ErrorPage } from './features/error-page/error-page';
import {authGuard} from '@admin-shared/guards/auth.guard';
import {Login} from '@admin-features/auth/login/login';
import {PlainLayout} from '@admin-shared/layouts/plain/plain.layout';

export const routes: Routes = [

  // Auth
  {
    path: 'auth',
    component: PlainLayout,
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
      {
        path: 'login',
        component: Login,
      },
    ],
  },

  // Admin Board
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
      component: PlainLayout,
      children: [
        {
          path: '',
          component: ErrorPage,
        }
      ]
    }
];
