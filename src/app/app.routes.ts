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
import { Designs } from './core/customer/pages/designs/designs';
import { DesignConfigurator } from './core/customer/pages/design-configurator/design-configurator';

export const routes: Routes = [
  { 
    path: '', 
    canActivate: [],
    component: MainLayout,
    children: [
      { 
        path: '', 
        component: Home,
      },
      { 
        path: 'designs', 
        component: Home,
      },
      { 
        path: 'makers', 
        redirectTo: 'customers'
      },
      { 
        path: 'story', 
        component: Home,
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
        redirectTo: 'designs',
        pathMatch: 'full',
      },

      // Designs
      {
        path: 'designs',
        component: Designs,
      },

      {
        path: 'designs/:id',
        component: DesignConfigurator
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
