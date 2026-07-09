import {
  Injectable,
  inject,
  signal,
  computed,
  DestroyRef,
  NgZone,
  effect,
  Injector,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { UserService } from '@my-mfe/auth';
import {
  NotificationItem,
  NotificationPage,
  NotificationQuery,
  ApiResponse,
} from '@my-mfe/interface';
import { NotificationService } from '@my-mfe/data-access-notification';
import { WebSocketService } from '@my-mfe/data-access-realtime';

/**
 * NotificationFacade - Facade trung tâm quản lý state notification dùng chung.
 *
 * - Expose signal state: notifications, unreadCount, loading, error
 * - Cung cấp action: refresh, markRead, markAllRead, remove, openNotification
 * - Tự đồng bộ unread count khi thay đổi trạng thái
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationFacade {
  private notificationService = inject(NotificationService);
  private wsService = inject(WebSocketService);
  private userService = inject(UserService);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private injector = inject(Injector);
  private destroyRef = inject(DestroyRef);

  // ===== STATE SIGNALS =====
  readonly notifications = signal<NotificationItem[]>([]);
  readonly unreadCount = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly totalPages = signal<number>(0);
  readonly currentPage = signal<number>(1);
  readonly totalRows = signal<number>(0);
  readonly realtimeStatus = signal<'connected' | 'disconnected' | 'reconnecting'>('disconnected');

  // Bell dropdown
  readonly dropdownOpen = signal<boolean>(false);
  readonly dropdownNotifications = signal<NotificationItem[]>([]);
  readonly dropdownLoading = signal<boolean>(false);

  // Selected notification for detail view
  readonly selectedNotification = signal<NotificationItem | null>(null);
  readonly detailLoading = signal<boolean>(false);

  // ===== COMPUTED =====
  readonly hasUnread = computed(() => this.unreadCount() > 0);
  readonly displayBadge = computed(() => {
    const count = this.unreadCount();
    if (count <= 0) return '';
    return count > 99 ? '99+' : String(count);
  });

  // ===== PRIVATE =====
  private wsSubs: Subscription[] = [];
  private initialized = false;
  private connectedUserId: number | null = null;
  private markingReadIds = new Set<number>();

  /**
   * Khởi tạo facade. Gọi 1 lần sau login hoặc khi layout khởi tạo.
   * Nếu đã init rồi thì bỏ qua để tránh duplicate connection.
   */
  init(): void {
    if (this.initialized) return;

    effect(() => {
      const userId = this.userService.currentUser()?.id ?? null;
      if (!userId) {
        this.disconnectWebSocket();
        this.unreadCount.set(0);
        return;
      }

      this.fetchUnreadCount();
      this.connectWebSocket(userId);
    }, { injector: this.injector });

    this.initialized = true;

    this.destroyRef.onDestroy(() => this.dispose());
  }

  /** ===== ACTIONS ===== */

  /** Refresh danh sách notification và unread count */
  refresh(query?: NotificationQuery): void {
    this.loading.set(true);
    this.error.set(null);
    const q: NotificationQuery = {
      page: query?.page ?? this.currentPage(),
      size: query?.size ?? 10,
      isRead: query?.isRead,
    };

    this.notificationService.getNotifications(q).subscribe({
      next: (res: ApiResponse<NotificationPage>) => {
        this.commitState(() => {
          const page = res.data ?? res.result;
          if (page) {
            this.notifications.set(page.data || []);
            this.totalPages.set(page.totalPage || 0);
            this.totalRows.set(page.totalRows || 0);
            this.currentPage.set(page.pageNumber || 1);
          }
          this.loading.set(false);
        });
      },
      error: () => {
        this.error.set('Không thể tải thông báo. Vui lòng thử lại.');
        this.loading.set(false);
      },
    });
  }

  /** Load danh sách cho bell dropdown (trang đầu, 5 items) */
  loadDropdownNotifications(): void {
    this.dropdownLoading.set(true);
    this.notificationService.getNotifications({ page: 1, size: 5 }).subscribe({
      next: (res: ApiResponse<NotificationPage>) => {
        this.commitState(() => {
          const page = res.data ?? res.result;
          this.dropdownNotifications.set(page?.data || []);
          this.dropdownLoading.set(false);
        });
      },
      error: () => {
        this.commitState(() => {
          this.dropdownLoading.set(false);
        });
      },
    });
  }

  /** Fetch unread count */
  fetchUnreadCount(): void {
    this.notificationService.getUnreadCount().subscribe({
      next: (res: ApiResponse<number>) => {
        this.commitState(() => {
          const count = res.data ?? res.result ?? 0;
          this.unreadCount.set(count);
        });
      },
      error: () => {
        // Silent fail for count
      },
    });
  }

  /** Load chi tiết notification */
  loadDetail(id: number): void {
    this.detailLoading.set(true);
    this.notificationService.getNotificationById(id).subscribe({
      next: (res: ApiResponse<NotificationItem>) => {
        const item = (res.data ?? res.result) as NotificationItem;
        this.commitState(() => {
          this.selectedNotification.set(item);
          this.detailLoading.set(false);
        });

        // Auto mark read
        if (item && !item.isRead) {
          this.markRead(item.id);
        }
      },
      error: () => {
        this.commitState(() => {
          this.detailLoading.set(false);
        });
      },
    });
  }

  /** Đánh dấu đã đọc */
  markRead(id: number): void {
    if (this.markingReadIds.has(id)) {
      return;
    }

    this.markingReadIds.add(id);
    const wasUnread =
      this.notifications().some((n) => n.id === id && !n.isRead) ||
      this.dropdownNotifications().some((n) => n.id === id && !n.isRead) ||
      (this.selectedNotification()?.id === id && !this.selectedNotification()?.isRead);

    this.notificationService.markAsRead(id).subscribe({
      next: () => {
        this.commitState(() => {
          // Update local state
          this.notifications.update((list) =>
            list.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)),
          );
          this.dropdownNotifications.update((list) =>
            list.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)),
          );
          if (this.selectedNotification()?.id === id) {
            this.selectedNotification.update((n) =>
              n ? { ...n, isRead: true, readAt: new Date().toISOString() } : n,
            );
          }
          if (wasUnread) {
            this.unreadCount.update((c) => Math.max(0, c - 1));
          }
        });
      },
      complete: () => {
        this.markingReadIds.delete(id);
      },
      error: () => {
        this.markingReadIds.delete(id);
      },
    });
  }

  /** Đánh dấu tất cả đã đọc */
  markAllRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.commitState(() => {
          this.notifications.update((list) =>
            list.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })),
          );
          this.dropdownNotifications.update((list) =>
            list.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })),
          );
          this.unreadCount.set(0);
        });
      },
    });
  }

  /** Xóa notification */
  remove(id: number): void {
    this.notificationService.deleteNotification(id).subscribe({
      next: () => {
        this.commitState(() => {
          const wasUnread = this.notifications().find((n) => n.id === id && !n.isRead);
          this.notifications.update((list) => list.filter((n) => n.id !== id));
          this.dropdownNotifications.update((list) => list.filter((n) => n.id !== id));
          this.totalRows.update((r) => Math.max(0, r - 1));
          if (wasUnread) {
            this.unreadCount.update((c) => Math.max(0, c - 1));
          }
          if (this.selectedNotification()?.id === id) {
            this.selectedNotification.set(null);
          }
        });
      },
    });
  }

  /**
   * Mở notification: mark read + điều hướng theo role.
   * Dùng cho cả bell dropdown và notification center.
   */
  openNotification(notification: NotificationItem): void {
    if (!notification.isRead) {
      this.markRead(notification.id);
    }
    this.dropdownOpen.set(false);

    const user = this.userService.currentUser();
    const roleType = user?.roleType;

    // Nếu có activityId, điều hướng theo role
    if (notification.activityId) {
      if (roleType === 1) {
        // Student
        this.router.navigate(['/activity-hub/detail', notification.activityId]);
      } else if (roleType === 2) {
        // Department
        this.router.navigate(['/admin/org/activities/detail', notification.activityId]);
      } else if (roleType === 3) {
        // Admin
        this.router.navigate(['/admin/org/activities/detail', notification.activityId]);
      }
      return;
    }

    // Không có activityId → mở detail notification
    if (roleType === 1) {
      this.router.navigate(['/notifications', notification.id]);
    } else {
      this.router.navigate(['/admin/notifications', notification.id]);
    }
  }

  /** Toggle bell dropdown */
  toggleDropdown(): void {
    const next = !this.dropdownOpen();
    this.dropdownOpen.set(next);
    if (next) {
      this.loadDropdownNotifications();
    }
  }

  closeDropdown(): void {
    this.dropdownOpen.set(false);
  }

  /** Navigate to notification center */
  goToCenter(): void {
    this.dropdownOpen.set(false);
    const user = this.userService.currentUser();
    if (user?.roleType === 1) {
      this.router.navigate(['/notifications']);
    } else {
      this.router.navigate(['/admin/notifications']);
    }
  }

  // ===== PRIVATE METHODS =====

  private connectWebSocket(userId: number): void {
    if (this.connectedUserId === userId && this.wsSubs.length > 0) {
      return;
    }

    this.disconnectWebSocket();
    this.connectedUserId = userId;

    this.wsService.initConnection(userId);
    this.realtimeStatus.set('connected');

    // Subscribe user-specific notifications
    const userSub = this.wsService.watchUserNotification(userId).subscribe({
      next: (notification) => {
        this.ngZone.run(() => this.handleRealtimeNotification(notification));
      },
    });
    this.wsSubs.push(userSub);

    // Subscribe broadcast notifications
    const broadcastSub = this.wsService.watchBroadcastNotification().subscribe({
      next: (notification) => {
        this.ngZone.run(() => this.handleRealtimeNotification(notification));
      },
    });
    this.wsSubs.push(broadcastSub);
  }

  private handleRealtimeNotification(notification: NotificationItem): void {
    this.fetchUnreadCount();

    // Prepend vào cache trang đầu
    this.notifications.update((list) => {
      const exists = list.some((n) => n.id === notification.id);
      return exists ? list : [notification, ...list];
    });
    this.dropdownNotifications.update((list) => {
      const exists = list.some((n) => n.id === notification.id);
      return exists ? list : [notification, ...list.slice(0, 4)];
    });

    if (!notification.isRead) {
      this.unreadCount.update((c) => c + 1);
    }
  }

  private disconnectWebSocket(): void {
    this.wsSubs.forEach((s) => s.unsubscribe());
    this.wsSubs = [];
    this.connectedUserId = null;
    this.realtimeStatus.set('disconnected');
  }

  private dispose(): void {
    this.disconnectWebSocket();
    this.initialized = false;
  }

  private commitState(update: () => void): void {
    this.ngZone.run(() => {
      update();
    });
  }
}
