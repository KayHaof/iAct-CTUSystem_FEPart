import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard';
import { ImportUsersComponent } from './features/super-admin/user-management/import-users/import-users.component';

export const routes: Routes = [
  // Tự động chuyển hướng khi vừa vào mfe-admin
  { path: '', redirectTo: 'admin/dashboard', pathMatch: 'full' },

  // --- VÙNG CHUNG (Admin & Khoa đều xài) ---
  {
    path: 'dashboard',
    title: 'Dashboard Thống kê',
    loadComponent: () =>
      import('./features/common/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [roleGuard],
    data: { roles: ['department', 'admin'] },
  },

  // --- VÙNG QUẢN LÝ HOẠT ĐỘNG (Dùng chung) ---
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
          import('./features/faculty/participant-management/participant-management.component').then(
            (m) => m.ParticipantManagementComponent,
          ),
      },
    ],
  },

  // --- VÙNG RIÊNG CỦA KHOA (Department) ---
  {
    path: 'approvals',
    title: 'Duyệt minh chứng',
    loadComponent: () =>
      import('./features/faculty/participant-approvals/approvals.component').then(
        (m) => m.ApprovalsComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['department'] },
  },

  // --- VÙNG RIÊNG CỦA SUPER ADMIN ---
  {
    path: 'system',
    title: 'Cài đặt hệ thống',
    loadComponent: () =>
      import('./features/super-admin/system-settings/system-settings.component').then(
        (m) => m.SystemSettingsComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'user-management',
    title: 'Quản lý người dùng',
    loadComponent: () =>
      import('./features/super-admin/user-management/user-management.component').then(
        (m) => m.UserManagementComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'user-management/import-users',
    title: 'Import Users Data',
    loadComponent: () =>
      import('./features/super-admin/user-management/import-users/import-users.component').then(
        (m) => m.ImportUsersComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },
];
