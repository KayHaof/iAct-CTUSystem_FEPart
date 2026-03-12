import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard';

import { AdminLayoutComponent } from '@my-mfe/ui';

export const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
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
            title: 'Tạo hoạt động mới',
            loadComponent: () =>
              import('./features/faculty/activity-build/activity-create.component').then(
                (m) => m.ActivityCreateComponent,
              ),
          },
          // Route cho Chỉnh sửa (Trỏ VỀ CÙNG 1 COMPONENT với Tạo mới)
          {
            path: 'edit/:id',
            title: 'Chỉnh sửa hoạt động',
            loadComponent: () =>
              import('./features/faculty/activity-build/activity-create.component').then(
                (m) => m.ActivityCreateComponent,
              ),
          },
          {
            path: 'detail/:id',
            title: 'Chi tiết hoạt động',
            loadComponent: () =>
              import('./features/faculty/activity-management/activity-management.component').then(
                (m) => m.ActivityManagementComponent,
              ),
          },
          {
            path: 'participants/:id',
            title: 'Quản lý sinh viên',
            loadComponent: () =>
              import(
                './features/faculty/participant-management/participant-management.component'
              ).then((m) => m.ParticipantManagementComponent),
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
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
