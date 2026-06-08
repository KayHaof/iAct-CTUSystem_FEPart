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
        title: 'Cong Hoat dong',
      },
      {
        path: 'activity-hub/detail/:id',
        loadComponent: () =>
          import('./features/activity-hub/activity-detail/activity-detail.component').then(
            (m) => m.ActivityDetailComponent,
          ),
        title: 'Chi tiet Hoat dong',
      },
      {
        path: 'my-records',
        loadComponent: () =>
          import('./features/my-records/my-records.component').then((m) => m.MyRecordsComponent),
        title: 'Quan ly hoat dong ca nhan',
      },
      {
        path: 'submit-proof',
        loadComponent: () =>
          import('./features/submit-proof/submit-proof.component').then(
            (m) => m.SubmitProofComponent,
          ),
        title: 'Nop minh chung',
      },
      {
        path: 'point-management',
        loadComponent: () =>
          import('./features/point-management/point-management.component').then(
            (m) => m.PointManagementComponent,
          ),
        title: 'Diem ren luyen',
      },
      {
        path: 'preferences',
        loadComponent: () =>
          import('./features/preferences/preferences.component').then(
            (m) => m.PreferencesComponent,
          ),
        title: 'Cai dat uu tien',
      },
      {
        path: 'qr-checkin',
        loadComponent: () =>
          import('./features/qr-checkin/qr-checkin.component').then(
            (m) => m.QrCheckinComponent,
          ),
        title: 'Quet QR diem danh',
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
