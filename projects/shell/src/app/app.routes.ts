import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';

import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  // 1. TRANG LỖI HỆ THỐNG (Nằm ngoài cùng, không dính Layout)
  {
    path: 'server-error',
    loadComponent: () =>
      import('./features/server-error/server-error').then((m) => m.ServerErrorComponent),
    title: '500 - Lỗi hệ thống',
  },

  // 2. MAIN LAYOUT (Cần đăng nhập)
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // --- DASHBOARD ---
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'Dashboard | iAct CTU',
      },

      // --- NEW ROUTES (Bổ sung theo Dashboard) ---

      // 1. Activity Hub (Dành cho sinh viên xem/đăng ký hoạt động)
      {
        path: 'activity-hub',
        loadComponent: () =>
          import('./features/activity-hub/activity-hub.component').then(
            (m) => m.ActivityHubComponent,
          ),
        title: 'Cổng Hoạt động',
      },
      {
        path: 'activity-hub/:id', // Trang chi tiết hoạt động
        loadComponent: () =>
          import('./features/activity-hub/activity-detail/activity-detail.component').then(
            (m) => m.ActivityDetailComponent,
          ),
        title: 'Chi tiết Hoạt động',
      },

      // 2. My Records (Xem điểm rèn luyện, lịch sử tham gia)
      {
        path: 'my-records',
        loadComponent: () =>
          import('./features/my-records/my-records.component').then((m) => m.MyRecordsComponent),
        title: 'Hồ sơ rèn luyện',
      },

      // 3. Submit Proof (Nộp minh chứng)
      {
        path: 'submit-proof',
        loadComponent: () =>
          import('./features/submit-proof/submit-proof.component').then(
            (m) => m.SubmitProofComponent,
          ),
        title: 'Nộp minh chứng',
      },

      // --- EXISTING REMOTE MODULES (MFEs) ---
      // (Giữ lại cái này cho Admin quản lý)
      {
        path: 'activities',
        loadChildren: () => loadRemoteModule('mfe-activity', './routes').then((m) => m.routes),
        title: 'Quản lý Hoạt động (Admin)',
        // Có thể thêm Role Guard nếu cần
        // canActivate: [roleGuard],
        // data: { roles: ['ADMIN', 'MANAGER'] }
      },

      {
        path: 'admin',
        loadChildren: () => loadRemoteModule('mfe-admin', './routes').then((m) => m.routes),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'MANAGER'] },
        title: 'Trang Quản trị',
      },

      {
        path: 'profile',
        loadComponent: () =>
          import('./features/user-profile/user-profile.component').then(
            (m) => m.UserProfileComponent,
          ),
        title: 'Thông tin cá nhân',
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

      // Wildcard con (để bắt lỗi 404 trong nội bộ layout)
      {
        path: '**',
        loadComponent: () =>
          import('./features/not-found/not-found').then((m) => m.NotFoundComponent),
        title: '404 - Không tìm thấy trang',
      },
    ],
  },

  // 3. WILDCARD NGOÀI CÙNG (Fallback)
  {
    path: '**',
    redirectTo: 'not-found',
  },
];
