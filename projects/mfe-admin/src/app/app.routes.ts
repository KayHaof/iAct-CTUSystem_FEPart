import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard';

import { AdminLayoutComponent } from '@my-mfe/ui';

export const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // VÙNG CHUNG
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/common/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
        canActivate: [roleGuard],
        data: { roles: ['department', 'admin'] },
      },

      // --- VÙNG QUẢN LÝ HOẠT ĐỘNG ---
      {
        path: 'org/activities',
        canActivate: [roleGuard],
        data: { roles: ['department', 'admin'] },
        children: [
          {
            path: '',
            title: 'Quản lý hoạt động',
            loadComponent: () =>
              import('./features/faculty/activity-list/activity-list.component').then(
                (m) => m.ActivityListComponent,
              ),
          },
          {
            path: 'create',
            loadComponent: () =>
              import('./features/faculty/activity-management/activity-create.component').then(
                (m) => m.ActivityCreateComponent,
              ),
          },
        ],
      },

      // VÙNG RIÊNG CỦA KHOA
      {
        path: 'approvals',
        loadComponent: () =>
          import('./features/faculty/participant-approvals/approvals.component').then(
            (m) => m.ApprovalsComponent,
          ),
        canActivate: [roleGuard],
        data: { roles: ['department'] },
      },

      // VÙNG RIÊNG CỦA SUPER ADMIN
      {
        path: 'system',
        loadComponent: () =>
          import('./features/super-admin/system-settings/system-settings.component').then(
            (m) => m.SystemSettingsComponent,
          ),
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
      },
    ],
  },
];
