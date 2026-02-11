import { Routes } from '@angular/router';
import { Component } from '@angular/core';

// Tạo nhanh một component tại chỗ để test
@Component({
  standalone: true,
  template: `<h1 style="color: red; font-size: 50px;">ADMIN ĐÃ HIỆN RỒI NÈ!</h1>`,
})
class TestComponent {}

export const routes: Routes = [
  {
    path: '',
    component: TestComponent, // Dùng component test này
    pathMatch: 'full',
  },
];
