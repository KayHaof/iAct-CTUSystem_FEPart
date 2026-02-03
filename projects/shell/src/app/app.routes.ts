import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [
//   {
//     path: 'admin',
//     loadComponent: () => import('./admin/admin.component').then(m => m.AdminComponent),
//     canActivate: [authGuard] // Chỉ cho vào nếu đã qua bước PKCE
//   },
];