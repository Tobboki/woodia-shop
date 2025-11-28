import { Routes } from '@angular/router';
import { Login } from './pages/auth/login/login';
import { Home } from './pages/home/home';
import { PublicLayout } from '@shared/layouts/public-layout/public-layout';
import { appGuard, authGuard } from './core/guards/auth-guard';
import { MainLayout } from '@shared/layouts/main-layout/main-layout';
import { Register } from './pages/auth/register/register';
import { customerGuard } from './core/guards/role-guard';
import { Settings as CustomerSettings } from './pages/customers/settings/settings'
import { Account as CustomerAccountSettings } from './pages/customers/settings/account/account'
import { Shipping as CustomerShippingSettings } from './pages/customers/settings/shipping/shipping'
export const routes: Routes = [
  { 
    path: '', 
    canActivate: [appGuard],
    component: MainLayout,
    children: [
      { 
        path: '', 
        component: Home,
      },
    ]
  },
  { 
    path: 'customers', 
    canActivate: [appGuard, customerGuard],
    component: MainLayout,
    children: [
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
        component: Login,
      },
      { 
        path: 'register', 
        component: Register,
      },
    ]
  },
  
];
