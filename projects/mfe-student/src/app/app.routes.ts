import { Routes } from '@angular/router';
// 1. Import cái áo Layout dành cho sinh viên từ thư viện dùng chung
import { StudentLayoutComponent } from '@my-mfe/ui';

export const appRoutes: Routes = [
  {
    path: '',
    component: StudentLayoutComponent, // 2. Mặc áo Layout vào đây
    children: [
      // 3. Nhét tất cả các trang của student vào bụng thằng layout này
      // --- DASHBOARD ---
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'Dashboard | iAct CTU',
      },

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
        path: 'activity-hub/detail/:id', // Trang chi tiết hoạt động
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

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
