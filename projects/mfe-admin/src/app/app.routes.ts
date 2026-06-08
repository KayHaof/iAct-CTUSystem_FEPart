import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'admin/dashboard', pathMatch: 'full' },

  {
    path: 'dashboard',
    title: 'Dashboard Thong ke',
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
        title: 'Quan ly hoat dong',
        loadComponent: () =>
          import('./features/faculty/activity-list/activity-list.component').then(
            (m) => m.ActivityListComponent,
          ),
      },
      {
        path: 'create',
        title: 'Tao hoat dong moi',
        loadComponent: () =>
          import('./features/faculty/activity-build/activity-create.component').then(
            (m) => m.ActivityCreateComponent,
          ),
      },
      {
        path: 'edit/:id',
        title: 'Chinh sua hoat dong',
        loadComponent: () =>
          import('./features/faculty/activity-build/activity-create.component').then(
            (m) => m.ActivityCreateComponent,
          ),
      },
      {
        path: 'detail/:id',
        title: 'Chi tiet hoat dong',
        loadComponent: () =>
          import('./features/faculty/activity-management/activity-management.component').then(
            (m) => m.ActivityManagementComponent,
          ),
      },
      {
        path: 'participants/:id',
        title: 'Quan ly sinh vien',
        loadComponent: () =>
          import('./features/faculty/participant-management/participant-management.component').then(
            (m) => m.ParticipantManagementComponent,
          ),
      },
      {
        path: 'urgent-notification',
        title: 'Gui thong bao khan cap',
        loadComponent: () =>
          import('./features/faculty/urgent-notification/urgent-notification.component').then(
            (m) => m.UrgentNotificationComponent,
          ),
      },
    ],
  },

  {
    path: 'approvals',
    title: 'Duyet minh chung',
    loadComponent: () =>
      import('./features/faculty/participant-approvals/approvals.component').then(
        (m) => m.ApprovalsComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['department'] },
  },

  {
    path: 'system',
    title: 'Cai dat he thong',
    loadComponent: () =>
      import('./features/super-admin/system-settings/system-settings.component').then(
        (m) => m.SystemSettingsComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'user-management',
    title: 'Quan ly nguoi dung',
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
    title: 'Quan ly hoat dong',
    loadComponent: () =>
      import('./features/super-admin/activity-moderation/activity-moderation.component').then(
        (m) => m.ActivityModerationComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'semesters',
    title: 'Quan ly hoc ky',
    loadComponent: () =>
      import('./features/super-admin/semester-management/semester-management.component').then(
        (m) => m.SemesterManagementComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'categories',
    title: 'Danh muc diem ren luyen',
    loadComponent: () =>
      import('./features/super-admin/category-management/category-management.component').then(
        (m) => m.CategoryManagementComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'departments',
    title: 'Quan ly Khoa/Truong/Vien',
    loadComponent: () =>
      import('./features/super-admin/department-management/department-management.component').then(
        (m) => m.DepartmentManagementComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'majors',
    title: 'Quan ly chuyen nghanh',
    loadComponent: () =>
      import('./features/super-admin/major-management/major-management.component').then(
        (m) => m.MajorManagementComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'classes',
    title: 'Quan ly lop sinh hoat',
    loadComponent: () =>
      import('./features/super-admin/class-management/class-management.component').then(
        (m) => m.ClassManagementComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },
];
