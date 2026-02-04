import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="layout-wrapper">
      <app-sidebar class="sidebar-area"></app-sidebar>

      <div class="content-area">
        <app-header class="header-area"></app-header>

        <main class="main-scrollable">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .layout-wrapper { display: flex; height: 100vh; overflow: hidden; }
    .sidebar-area { flex-shrink: 0; background: #fff; border-right: 1px solid #eee; }
    .content-area { flex-grow: 1; display: flex; flex-direction: column; background: #f5f7fa; }
    .main-scrollable { flex-grow: 1; overflow-y: auto; padding: 12px; }
  `]
})
export class MainLayoutComponent {}