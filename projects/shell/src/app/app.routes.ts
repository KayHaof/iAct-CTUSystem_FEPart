import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';

import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'Dashboard | iAct CTU',
      },

      {
        path: 'activities',
        loadChildren: () => loadRemoteModule('mfe-activity', './routes').then((m) => m.routes),
        title: 'Quản lý Hoạt động',
      },

      {
        path: 'admin',
        loadChildren: () => loadRemoteModule('mfe-admin', './routes').then((m) => m.routes),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'MANAGER'] },
        title: 'Trang Quản trị',
      },

      {
        path: 'forbidden',
        loadComponent: () =>
          import('./features/forbidden/forbidden').then((m) => m.ForbiddenComponent),
        title: '403 - Truy cập bị từ chối',
      },

      {
        path: '**',
        loadComponent: () =>
          import('./features/not-found/not-found').then((m) => m.NotFoundComponent),
        title: '404 - Không tìm thấy trang',
      },

      {
        path: 'server-error',
        loadComponent: () =>
          import('./features/server-error/server-error').then(
            (m) => m.ServerErrorComponent,
          ),
        title: '500 - Lỗi máy chủ',
      },
    ],
  },
];
