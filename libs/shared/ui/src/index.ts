// ==============================================
// IACT UI LIBRARY - Main Exports
// ==============================================

// Services
export * from './lib/services/alert.service';
export * from './lib/services/loading.service';
export * from './lib/services/confirm.service';
export * from './lib/services/notification-facade.service';

// Components
export * from './lib/components/loading-bar/loading-bar.component';
export * from './lib/components/pagination/pagination.component';
export * from './lib/components/page-header/page-header.component';
export * from './lib/components/table-container/table-container.component';
export * from './lib/components/alert-snackbar/alert-snackbar.component';
export * from './lib/components/confirm-dialog/confirm-dialog.component';
export * from './lib/components/status-badge/status-badge.component';
export * from './lib/components/notification-bell/notification-bell.component';
export * from './lib/components/notification-center/notification-center.component';

// Layouts
export * from './lib/layout/admin-layout/admin-layout.component';
export * from './lib/layout/student-layout/student-layout.component';
export * from './lib/layout/header/header.component';
export * from './lib/layout/sidebar/sidebar.component';
export * from './lib/layout/footer/footer.component';

// Type exports
export type { ConfirmDialogConfig, ConfirmType } from './lib/components/confirm-dialog/confirm-dialog.component';
export type { StatusConfig, BadgeVariant, BadgeSize } from './lib/components/status-badge/status-badge.component';
