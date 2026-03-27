import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Home } from './features/home/home';
import { PublicLayout } from './shared/layouts/public-layout/public-layout';
import { authGuard } from './core/guards/auth-guard';
import { MainLayout } from './shared/layouts/main-layout/main-layout';
import { Register } from './features/auth/register/register';
import { customerGuard } from './core/guards/role-guard';
import { Settings as CustomerSettings } from './features/customers/settings/settings'
import { Account as CustomerAccountSettings } from './features/customers/settings/account/account'
import { Shipping as CustomerShippingSettings } from './features/customers/settings/shipping/shipping'
import { ErrorPage } from './features/error-page/error-page';
import { Designs } from './features/designs/designs';
import { OurStory } from './features/our-story/our-story';

export const routes: Routes = [
  {
    // Landing
    path: '',
    canActivate: [authGuard],
    component: MainLayout,
    data: { layoutVariant: 'default' },
    children: [
      // (Default)
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
        title: 'Home',
      },
      {
        path: 'home',
        component: Home,
      },

      // designs
      {
        path: 'designs',
        redirectTo: 'designs/all',
        pathMatch: 'full'
      },
      {
        path: 'designs/:category',
        component: Designs,
      },
      {
        path: 'designs/model/:id',
        loadComponent: () =>
          import('./features/design-studio/design-studio')
            .then(m => m.DesignStudio)
      },

      {
        path: 'our-story',
        component: OurStory,
      },
    ]
  },
  // Customer
  {
    path: 'customers',
    canActivate: [customerGuard],
    component: MainLayout,
    data: { layoutVariant: 'plain' },
    children: [
      // (Default)
      {
        path: '',
        redirectTo: 'designs/all',
        pathMatch: 'full',
      },

      // Designs
      {
        path: 'designs',
        redirectTo: 'designs/all',
        pathMatch: 'full'
      },
      {
        path: 'designs/:category',
        component: Designs,
      },
      {
        path: 'designs/model/:id',
        loadComponent: () =>
          import('./features/design-studio/design-studio')
            .then(m => m.DesignStudio)
      },

      // Settings
      {
        path: 'settings',
        component: CustomerSettings,
        children: [
          {
            path: '',
            redirectTo: 'account',
            pathMatch: 'full',
          },
          {
            path: 'account',
            component: CustomerAccountSettings,
          },
          {
            path: 'shipping',
            component: CustomerShippingSettings,
          },
        ]
      },
    ]
  },
  // auth
  {
    path: 'auth',
    component: PublicLayout,
    canActivate: [authGuard],
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
      {
        path: 'register',
        component: Register,
      },
      {
        path: 'google-callback',
        loadComponent: () => import('./features/auth/callback/callback').then(m => m.Callback)
      }
    ]
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
