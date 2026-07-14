import { Routes } from '@angular/router';
import { StudentLayoutComponent } from '@my-mfe/ui';

export const appRoutes: Routes = [
  {
    path: '',
    component: StudentLayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'Tổng quan | iAct CTU',
      },
      {
        path: 'activity-hub',
        loadComponent: () =>
          import('./features/activity-hub/activity-hub.component').then(
            (m) => m.ActivityHubComponent,
          ),
        title: 'Cổng hoạt động | iAct CTU',
      },
      {
        path: 'activity-hub/detail/:id',
        loadComponent: () =>
          import('./features/activity-hub/activity-detail/activity-detail.component').then(
            (m) => m.ActivityDetailComponent,
          ),
        title: 'Chi tiết hoạt động | iAct CTU',
      },
      {
        path: 'activity-proposal',
        loadComponent: () =>
          import('./features/activity-proposal/activity-proposal.component').then(
            (m) => m.ActivityProposalComponent,
          ),
        title: 'Đăng ký tổ chức hoạt động | iAct CTU',
      },
      {
        path: 'activity-proposal/:id',
        loadComponent: () =>
          import('./features/activity-proposal/activity-proposal.component').then(
            (m) => m.ActivityProposalComponent,
          ),
        title: 'Chỉnh sửa đề xuất hoạt động | iAct CTU',
      },
      {
        path: 'activity-proposals',
        loadComponent: () =>
          import('./features/activity-proposals/activity-proposals.component').then(
            (m) => m.ActivityProposalsComponent,
          ),
        title: 'Hoạt động đã gửi | iAct CTU',
      },
      {
        path: 'my-records',
        loadComponent: () =>
          import('./features/my-records/my-records.component').then((m) => m.MyRecordsComponent),
        title: 'Hoạt động của tôi | iAct CTU',
      },
      {
        path: 'submit-proof',
        loadComponent: () =>
          import('./features/submit-proof/submit-proof.component').then(
            (m) => m.SubmitProofComponent,
          ),
        title: 'Nộp minh chứng | iAct CTU',
      },
      {
        path: 'complaints',
        loadComponent: () =>
          import('./features/complaints/complaints.component').then((m) => m.ComplaintsComponent),
        title: 'Khiếu nại hoạt động | iAct CTU',
      },
      {
        path: 'point-management',
        loadComponent: () =>
          import('./features/point-management/point-management.component').then(
            (m) => m.PointManagementComponent,
          ),
        title: 'Điểm rèn luyện | iAct CTU',
      },
      {
        path: 'preferences',
        loadComponent: () =>
          import('./features/preferences/preferences.component').then(
            (m) => m.PreferencesComponent,
          ),
        title: 'Cài đặt ưu tiên | iAct CTU',
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/notification-center.component').then(
            (m) => m.StudentNotificationCenterComponent,
          ),
        title: 'Thông báo | iAct CTU',
      },
      {
        path: 'notifications/:id',
        loadComponent: () =>
          import('./features/notifications/notification-detail.component').then(
            (m) => m.StudentNotificationDetailComponent,
          ),
        title: 'Chi tiết thông báo | iAct CTU',
      },
      {
        path: 'qr-checkin',
        loadComponent: () =>
          import('./features/qr-checkin/qr-checkin.component').then((m) => m.QrCheckinComponent),
        title: 'Quét QR điểm danh | iAct CTU',
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
