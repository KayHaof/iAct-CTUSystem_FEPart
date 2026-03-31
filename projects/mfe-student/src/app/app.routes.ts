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
        title: 'Dashboard | iAct CTU',
      },
      {
        path: 'activity-hub',
        loadComponent: () =>
          import('./features/activity-hub/activity-hub.component').then(
            (m) => m.ActivityHubComponent,
          ),
        title: 'Cổng Hoạt động',
      },
      {
        path: 'activity-hub/detail/:id',
        loadComponent: () =>
          import('./features/activity-hub/activity-detail/activity-detail.component').then(
            (m) => m.ActivityDetailComponent,
          ),
        title: 'Chi tiết Hoạt động',
      },

      {
        path: 'my-records',
        loadComponent: () =>
          import('./features/my-records/my-records.component').then((m) => m.MyRecordsComponent),
        title: 'Quản lý hoạt động cá nhân',
      },

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
