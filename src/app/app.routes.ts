import { Routes } from '@angular/router';
import { Login } from './pages/auth/login/login';
import { Home } from './pages/home/home';
import { PublicLayout } from '@shared/layouts/public-layout/public-layout';
import { authGuard } from './core/guards/auth-guard';
import { MainLayout } from '@shared/layouts/main-layout/main-layout';
import { MainLayout as CustomerMainLayout } from './core/customer/layouts/main-layout/main-layout';
import { Register } from './pages/auth/register/register';
import { customerGuard } from './core/guards/role-guard';
import { Settings as CustomerSettings } from './pages/customers/settings/settings'
import { Account as CustomerAccountSettings } from './pages/customers/settings/account/account'
import { Shipping as CustomerShippingSettings } from './pages/customers/settings/shipping/shipping'
import { ErrorPage } from './pages/error-page/error-page';
import { Designs as LandingDesigns } from './pages/designs/designs';
import { OurStory } from './pages/our-story/our-story';

export const routes: Routes = [
  {
    // Landing
    path: '',
    canActivate: [authGuard],
    component: MainLayout,
    children: [
      // (Default)
      {
        path: '',
        component: Home,
      },
      {
        path: 'designs',
        redirectTo: 'designs/all',
        pathMatch: 'full'
      },
      {
        path: 'designs/:category',
        component: LandingDesigns,
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
    component: CustomerMainLayout,
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
        component: LandingDesigns,
      },
      {
        path: 'designs/model/:id',
        loadComponent: () =>
          import('./core/customer/pages/design-configurator/design-configurator')
            .then(m => m.DesignConfigurator)
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
        loadComponent: () => import('./pages/auth/callback/callback').then(m => m.Callback)
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
