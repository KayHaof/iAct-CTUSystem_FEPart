import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { loadRemoteModule } from '@angular-architects/native-federation';
import { authGuard } from './core/auth/auth.guard'; // Import Guard

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent, // Áp dụng Layout chung
    canActivate: [authGuard],       // 🔥 Bảo vệ toàn bộ app (phải login mới thấy)
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      
      // Feature nội bộ của Shell
      { 
        path: 'dashboard', 
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) 
      },

      // 👇 REMOTE MFE: Activity Hub
      {
        path: 'activities',
        loadChildren: () => loadRemoteModule('mfe-activity', './routes').then(m => m.routes)
      },

      // 👇 REMOTE MFE: Admin
      {
        path: 'admin',
        loadChildren: () => loadRemoteModule('mfe-admin', './routes').then(m => m.routes)
      }
    ]
  },
  
  // Trang 404 (Không cần Guard cũng được)
  { 
    path: '**', 
    loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent) 
  }
];