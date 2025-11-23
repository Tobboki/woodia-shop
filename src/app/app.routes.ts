import { Routes } from '@angular/router';
import { Login } from './pages/auth/login/login';
import { Home } from './pages/home/home';
import { PublicLayout } from '@shared/layouts/public-layout/public-layout';
import { appGuard, authGuard } from './core/guards/auth-guard';
import { MainLayout } from '@shared/layouts/main-layout/main-layout';
import { Register } from './pages/auth/register/register';

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
