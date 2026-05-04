import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Home } from './features/home/home';
import { PublicLayout } from './shared/layouts/public-layout/public-layout';
import { authGuard } from './core/guards/auth-guard';
import { MainLayout } from './shared/layouts/main-layout/main-layout';
import { Register } from './features/auth/register/register';
import { customerGuard, makerGuard } from './core/guards/role-guard';
import { googleAuthGuard } from './core/guards/google-auth.guard';
import { Settings as CustomerSettings } from './features/customers/settings/settings'
import { Account as CustomerAccountSettings } from './features/customers/settings/account/account'
import { Shipping as CustomerShippingSettings } from './features/customers/settings/shipping/shipping'
import { ErrorPage } from './features/error-page/error-page';
import { Designs } from './features/designs/designs';
import { OurStory } from './features/our-story/our-story';
import { Jobs } from '@woodia-features/customers/jobs/jobs';

export const routes: Routes = [
  {
    // Public & Shared Area
    path: '',
    component: MainLayout,
    data: { layoutVariant: 'plain' },
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        component: Home,
        data: { layoutVariant: 'default' }
      },
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

      // Customer Protected Routes
      {
        path: 'customers',
        canActivate: [customerGuard],
        children: [
          {
            path: '',
            redirectTo: 'jobs',
            pathMatch: 'full',
          },
          {
            path: 'jobs',
            component: Jobs,
          },
          {
            path: 'jobs/:id',
            loadComponent: () =>
              import('./features/customers/jobs/job-details/job-details')
                .then(m => m.JobDetails)
          },
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

      // Maker Protected Routes
      {
        path: 'makers',
        canActivate: [makerGuard],
        children: [
          {
            path: '',
            redirectTo: 'jobs', // Or dashboard when ready
            pathMatch: 'full',
          },
          // Future maker routes go here
        ]
      },
    ]
  },

  // Auth routes
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
        canActivate: [googleAuthGuard],
        loadComponent: () => import('./features/auth/callback/callback').then(m => m.Callback)
      }
    ]
  },

  // Error Page
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

