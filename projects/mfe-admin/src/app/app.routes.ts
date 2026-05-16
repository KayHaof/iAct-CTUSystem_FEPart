import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'admin/dashboard', pathMatch: 'full' },

  // --- VÙNG CHUNG  ---
  {
    path: 'dashboard',
    title: 'Dashboard Thống kê',
    loadComponent: () =>
      import('./features/common/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [roleGuard],
    data: { roles: ['department', 'admin'] },
  },

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

  // --- VÙNG RIÊNG CỦA KHOA ---
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
  {
    path: 'activity-moderation',
    title: 'Quản lý hoạt động',
    loadComponent: () =>
      import('./features/super-admin/activity-moderation/activity-moderation.component').then(
        (m) => m.ActivityModerationComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'semesters',
    title: 'Quản lý học kỳ',
    loadComponent: () =>
      import('./features/super-admin/semester-management/semester-management.component').then(
        (m) => m.SemesterManagementComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'categories',
    title: 'Danh mục điểm rèn luyện',
    loadComponent: () =>
      import('./features/super-admin/category-management/category-management.component').then(
        (m) => m.CategoryManagementComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'departments',
    title: 'Quản lý Khoa/Trường/Viện',
    loadComponent: () =>
      import('./features/super-admin/department-management/department-management.component').then(
        (m) => m.DepartmentManagementComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'majors',
    title: 'Quản lý chuyên ngành',
    loadComponent: () =>
      import('./features/super-admin/major-management/major-management.component').then(
        (m) => m.MajorManagementComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },
];
