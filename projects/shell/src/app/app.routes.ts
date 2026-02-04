import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { loadRemoteModule } from '@angular-architects/native-federation';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard], // Guard bảo vệ cả layout
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // 1. Dashboard (Feature nội bộ)
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },

      // 2. REMOTE MFE: Activity Hub
      {
        path: 'activities',
        loadChildren: () => loadRemoteModule('mfe-activity', './routes').then((m) => m.routes),
      },

      // 3. REMOTE MFE: Admin
      {
        path: 'admin',
        loadChildren: () => loadRemoteModule('mfe-admin', './routes').then((m) => m.routes),
      },

      // 4. Trang 404 (Đặt ở cuối cùng trong children)
      // Để nó nằm BÊN TRONG layout (có Header/Sidebar)
      {
        path: '**',
        loadComponent: () =>
          import('./features/not-found/not-found').then((m) => m.NotFoundComponent),
        title: 'Không tìm thấy trang | iAct CTU',
      },
    ],
  },
];
