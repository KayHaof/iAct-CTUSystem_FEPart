import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  {
    path: 'dashboard',
    title: 'Tổng quan quản trị | iAct CTU',
    loadComponent: () =>
      import('./features/common/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [roleGuard],
    data: { roles: ['department', 'admin'] },
  },

  {
    path: 'notifications',
    title: 'Trung tâm thông báo | iAct CTU',
    loadComponent: () =>
      import('./features/common/notifications/notification-center.component').then(
        (m) => m.AdminNotificationCenterComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['department', 'admin'] },
  },

  {
    path: 'notifications/:id',
    title: 'Chi tiết thông báo | iAct CTU',
    loadComponent: () =>
      import('./features/common/notifications/notification-detail.component').then(
        (m) => m.AdminNotificationDetailComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['department', 'admin'] },
  },

  {
    path: 'org',
    canActivate: [roleGuard],
    data: { roles: ['department', 'admin'] },
    children: [
      { path: '', redirectTo: 'activities', pathMatch: 'full' },
      {
        path: 'activities',
        children: [
          {
            path: '',
            title: 'Quản lý hoạt động của đơn vị | iAct CTU',
            loadComponent: () =>
              import('./features/faculty/activity-list/activity-list.component').then(
                (m) => m.ActivityListComponent,
              ),
          },
          {
            path: 'create',
            title: 'Tạo hoạt động mới | iAct CTU',
            loadComponent: () =>
              import('./features/faculty/activity-build/activity-create.component').then(
                (m) => m.ActivityCreateComponent,
              ),
          },
          {
            path: 'edit/:id',
            title: 'Chỉnh sửa hoạt động | iAct CTU',
            loadComponent: () =>
              import('./features/faculty/activity-build/activity-create.component').then(
                (m) => m.ActivityCreateComponent,
              ),
          },
          {
            path: 'detail/:id',
            title: 'Chi tiết vận hành hoạt động | iAct CTU',
            loadComponent: () =>
              import('./features/faculty/activity-management/activity-management.component').then(
                (m) => m.ActivityManagementComponent,
              ),
          },
          {
            path: 'participants/:id',
            title: 'Quản lý sinh viên tham gia | iAct CTU',
            loadComponent: () =>
              import(
                './features/faculty/participant-management/participant-management.component'
              ).then((m) => m.ParticipantManagementComponent),
          },
          {
            path: 'urgent-notification',
            redirectTo: '',
            pathMatch: 'full',
          },
        ],
      },
      {
        path: 'representatives',
        title: 'Đại diện lớp/chi đoàn | iAct CTU',
        loadComponent: () =>
          import(
            './features/faculty/class-representatives/class-representative-management.component'
          ).then((m) => m.ClassRepresentativeManagementComponent),
        canActivate: [roleGuard],
        data: { roles: ['department'] },
      },
      {
        path: 'locations',
        title: 'Địa điểm đơn vị | iAct CTU',
        loadComponent: () =>
          import('./features/common/locations/location-management.component').then(
            (m) => m.LocationManagementComponent,
          ),
      },
      {
        path: 'approvals',
        redirectTo: 'activities',
        pathMatch: 'full',
      },
      { path: 'students', redirectTo: 'activities', pathMatch: 'full' },
    ],
  },

  { path: 'approvals', redirectTo: 'org/activities', pathMatch: 'full' },

  {
    path: 'user-management/import-users',
    title: 'Nhập danh sách sinh viên | iAct CTU',
    loadComponent: () =>
      import('./features/super-admin/user-management/import-users/import-users.component').then(
        (m) => m.ImportUsersComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },

  {
    path: 'user-management',
    title: 'Quản lý người dùng | iAct CTU',
    loadComponent: () =>
      import('./features/super-admin/user-management/user-management.component').then(
        (m) => m.UserManagementComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },

  {
    path: 'activity-moderation',
    title: 'Duyệt hoạt động toàn trường | iAct CTU',
    loadComponent: () =>
      import('./features/super-admin/activity-moderation/activity-moderation.component').then(
        (m) => m.ActivityModerationComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },

  {
    path: 'locations',
    title: 'Quản lý địa điểm | iAct CTU',
    loadComponent: () =>
      import('./features/common/locations/location-management.component').then(
        (m) => m.LocationManagementComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },

  {
    path: 'semesters',
    title: 'Quản lý học kỳ | iAct CTU',
    loadComponent: () =>
      import('./features/super-admin/semester-management/semester-management.component').then(
        (m) => m.SemesterManagementComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },

  {
    path: 'categories',
    title: 'Danh mục điểm rèn luyện | iAct CTU',
    loadComponent: () =>
      import('./features/super-admin/category-management/category-management.component').then(
        (m) => m.CategoryManagementComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },

  {
    path: 'departments',
    title: 'Quản lý Khoa, Trường, Viện | iAct CTU',
    loadComponent: () =>
      import('./features/super-admin/department-management/department-management.component').then(
        (m) => m.DepartmentManagementComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },

  {
    path: 'majors',
    title: 'Quản lý chuyên ngành | iAct CTU',
    loadComponent: () =>
      import('./features/super-admin/major-management/major-management.component').then(
        (m) => m.MajorManagementComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },

  {
    path: 'classes',
    title: 'Quản lý lớp sinh hoạt | iAct CTU',
    loadComponent: () =>
      import('./features/super-admin/class-management/class-management.component').then(
        (m) => m.ClassManagementComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },

  {
    path: 'settings',
    title: 'Cài đặt hệ thống | iAct CTU',
    loadComponent: () =>
      import('./features/super-admin/system-settings/system-settings.component').then(
        (m) => m.SystemSettingsComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },

  { path: 'system', redirectTo: 'settings', pathMatch: 'full' },
  { path: 'reports', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'settings/system', redirectTo: 'settings', pathMatch: 'full' },

  { path: 'faculty/activities', redirectTo: 'org/activities', pathMatch: 'full' },
  { path: 'faculty/activities/create', redirectTo: 'org/activities/create', pathMatch: 'full' },
  { path: 'faculty/activities/edit/:id', redirectTo: 'org/activities/edit/:id', pathMatch: 'full' },
  {
    path: 'faculty/activities/urgent-notification',
    redirectTo: 'org/activities',
    pathMatch: 'full',
  },
  {
    path: 'faculty/activities/detail/:id',
    redirectTo: 'org/activities/detail/:id',
    pathMatch: 'full',
  },

  { path: 'super-admin/moderation', redirectTo: 'activity-moderation', pathMatch: 'full' },
  { path: 'super-admin/users', redirectTo: 'user-management', pathMatch: 'full' },
  { path: 'super-admin/classes', redirectTo: 'classes', pathMatch: 'full' },
  { path: 'super-admin/settings', redirectTo: 'settings', pathMatch: 'full' },

  { path: '**', redirectTo: 'dashboard' },
];
