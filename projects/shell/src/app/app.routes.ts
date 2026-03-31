import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  {
    path: 'server-error',
    loadComponent: () =>
      import('./features/server-error/server-error').then((m) => m.ServerErrorComponent),
    title: '500 - Lỗi hệ thống',
  },

  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadChildren: () => loadRemoteModule('mfe-student', './Routes').then((m) => m.appRoutes),
      },

      {
        path: 'admin',
        loadComponent: () => import('@my-mfe/ui').then((m) => m.AdminLayoutComponent),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'department'] },
        title: 'Trang Quản trị',
        children: [
          {
            path: '',
            loadChildren: () => loadRemoteModule('mfe-admin', './routes').then((m) => m.routes),
          },
        ],
      },

      {
        path: 'profile',
        loadChildren: () =>
          import('@my-mfe/features/user-profile').then((m) => m.userProfileRoutes),
      },

      // --- ERROR PAGES ---
      {
        path: 'forbidden',
        loadComponent: () =>
          import('./features/forbidden/forbidden').then((m) => m.ForbiddenComponent),
        title: '403 - Truy cập bị từ chối',
      },

      {
        path: 'not-found',
        loadComponent: () =>
          import('./features/not-found/not-found').then((m) => m.NotFoundComponent),
        title: '404 - Đường dẫn không tồn tại',
      },

      {
        path: '**',
        loadComponent: () =>
          import('./features/not-found/not-found').then((m) => m.NotFoundComponent),
        title: '404 - Không tìm thấy trang',
      },
    ],
  },

  {
    path: '**',
    redirectTo: 'not-found',
  },
];
