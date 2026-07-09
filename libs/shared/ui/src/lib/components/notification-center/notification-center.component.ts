import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  AfterViewInit,
  OnInit,
  NgZone,
  signal,
  computed,
  effect,
  input,
  ElementRef,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationItem, NotificationType, NOTIFICATION_TYPE_CONFIG } from '@my-mfe/interface';
import { AlertService } from '../../services/alert.service';
import { ConfirmService } from '../../services/confirm.service';
import { NotificationFacade } from '../../services/notification-facade.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

type TabFilter = 'all' | 'unread' | 'read';

@Component({
  selector: 'lib-notification-center',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notification-center.component.html',
  styleUrls: ['./notification-center.component.scss'],
})
export class NotificationCenterComponent implements OnInit, AfterViewInit {
  /** Role context: student, department, admin */
  roleContext = input<'student' | 'department' | 'admin'>('student');

  readonly facade = inject(NotificationFacade);
  private confirmService = inject(ConfirmService);
  private alertService = inject(AlertService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private host = inject(ElementRef<HTMLElement>);
  private destroyRef = inject(DestroyRef);
  private refreshScheduled = false;
  private destroyed = false;

  // UI State
  readonly activeTab = signal<TabFilter>('all');
  readonly searchQuery = signal<string>('');
  readonly pageSize = 10;

  // Computed: role-based subtitle
  readonly subtitle = computed(() => {
    switch (this.roleContext()) {
      case 'student':
        return 'Xem và quản lý thông báo cá nhân của bạn';
      case 'department':
        return 'Thông báo nghiệp vụ và cập nhật từ hệ thống';
      case 'admin':
        return 'Thông báo hệ thống và hoạt động cần xử lý';
      default:
        return 'Quản lý thông báo của bạn';
    }
  });

  // Computed: filtered notifications for local search
  readonly filteredNotifications = computed(() => {
    const list = this.facade.notifications();
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return list;
    return list.filter(
      (n) => n.title.toLowerCase().includes(query) || n.message.toLowerCase().includes(query),
    );
  });

  readonly tabs: { key: TabFilter; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'unread', label: 'Chưa đọc' },
    { key: 'read', label: 'Đã đọc' },
  ];

  private viewRefreshEffect = effect(() => {
    this.facade.loading();
    this.facade.error();
    this.facade.notifications();
    this.facade.selectedNotification();
    this.scheduleViewRefresh();
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
    });
  }

  ngOnInit(): void {
    this.facade.init();
    this.loadPage(1);
  }

  ngAfterViewInit(): void {
    this.scheduleViewRefresh();
  }

  switchTab(tab: TabFilter): void {
    this.activeTab.set(tab);
    this.searchQuery.set('');
    this.loadPage(1);
  }

  loadPage(page: number): void {
    const tab = this.activeTab();
    const isRead = tab === 'unread' ? false : tab === 'read' ? true : undefined;
    this.facade.refresh({ page, size: this.pageSize, isRead });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  selectNotification(item: NotificationItem): void {
    this.facade.loadDetail(item.id);
  }

  openNotification(item: NotificationItem): void {
    this.facade.openNotification(item);
  }

  deleteNotification(item: NotificationItem, event: MouseEvent): void {
    event.stopPropagation();
    this.confirmService
      .confirm({
        title: 'Xóa thông báo',
        message: `Bạn có chắc muốn xóa thông báo "${item.title}"?`,
        type: 'warning',
      })
      .then(() => {
        this.facade.remove(item.id);
        this.alertService.success('Đã xóa thông báo');
      })
      .catch(() => {
        // User cancelled — do nothing
      });
  }

  markReadSingle(item: NotificationItem, event: MouseEvent): void {
    event.stopPropagation();
    if (!item.isRead) {
      this.facade.markRead(item.id);
    }
  }

  markAllAsRead(): void {
    this.facade.markAllRead();
    this.alertService.success('Đã đánh dấu tất cả đã đọc');
  }

  getTypeConfig(type: NotificationType) {
    return NOTIFICATION_TYPE_CONFIG[type] ?? NOTIFICATION_TYPE_CONFIG[2];
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  formatDateTime(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /** Pagination helpers */
  get pages(): number[] {
    const total = this.facade.totalPages();
    const current = this.facade.currentPage();
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  /** Check if admin for technical metadata display */
  get isAdmin(): boolean {
    return this.roleContext() === 'admin';
  }

  private scheduleViewRefresh(): void {
    if (this.refreshScheduled || this.destroyed) {
      return;
    }

    this.refreshScheduled = true;
    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (this.destroyed) {
            return;
          }

          this.refreshScheduled = false;
          this.host.nativeElement.getBoundingClientRect();
          this.ngZone.run(() => {
            this.cdr.markForCheck();
            this.cdr.detectChanges();
          });
        });
      });
    });
  }
}
