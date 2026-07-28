import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UserService } from '@my-mfe/auth';
import { NotificationService } from '@my-mfe/data-access-notification';
import { ApiResponse, PageDTO, UrgentNotificationRequest, UserInfo } from '@my-mfe/interface';
import { LayoutService } from '../layout.service';
import { AlertService } from '../../services/alert.service';
import { NotificationBellComponent } from '../../components/notification-bell/notification-bell.component';

type SupportRequestType = 'support' | 'incident';

@Component({
  selector: 'lib-header',
  standalone: true,
  imports: [CommonModule, FormsModule, NotificationBellComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  @HostBinding('class.support-modal-active')
  get supportModalActive(): boolean {
    return this.supportModalOpen();
  }

  theme = input<'light' | 'dark'>('light');

  public userService = inject(UserService);

  private layoutService = inject(LayoutService);
  private router = inject(Router);
  private host = inject(ElementRef<HTMLElement>);
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);
  private alertService = inject(AlertService);

  currentUser = computed(() => this.userService.currentUser());
  supportMenuOpen = signal(false);
  supportModalOpen = signal(false);
  selectedSupportType = signal<SupportRequestType>('support');
  supportTitle = signal('');
  supportContent = signal('');
  supportSubmitting = signal(false);

  isAdmin = computed(() => this.userService.isAdmin());
  isStudent = computed(() => this.userService.isStudent());
  isDepartment = computed(() => this.userService.isDepartment());

  defaultAvatar =
    'https://res.cloudinary.com/dhjamvg6j/image/upload/v1772527220/0305-logo-ctu_vrk0rw.png';

  adminAvatar = 'https://res.cloudinary.com/dhjamvg6j/image/upload/v1773991699/iact_admin_avt.png';

  toggleMenu() {
    this.layoutService.toggleMobileMenu();
  }

  toggleSupportMenu(event: MouseEvent) {
    event.stopPropagation();
    this.supportMenuOpen.update((open) => !open);
  }

  closeSupportMenu() {
    this.supportMenuOpen.set(false);
  }

  goToAdminNotifications() {
    this.closeSupportMenu();
    this.layoutService.closeMobileMenu();
    this.router.navigate(['/admin/notifications']).then();
  }

  openSupportModal(type: SupportRequestType) {
    this.selectedSupportType.set(type);
    this.supportTitle.set(this.defaultSupportTitle(type));
    this.supportContent.set('');
    this.supportModalOpen.set(true);
    this.closeSupportMenu();
  }

  closeSupportModal() {
    if (this.supportSubmitting()) {
      return;
    }

    this.supportModalOpen.set(false);
    this.supportContent.set('');
  }

  canSubmitSupportRequest(): boolean {
    return !!(
      this.supportTitle().trim() &&
      this.supportContent().trim().length >= 10 &&
      !this.supportSubmitting()
    );
  }

  submitSupportRequest() {
    if (!this.canSubmitSupportRequest()) {
      this.alertService.warning('Vui lòng nhập nội dung hỗ trợ ít nhất 10 ký tự.');
      return;
    }

    const user = this.currentUser();
    const params = new HttpParams()
      .set('page', '1')
      .set('size', '100')
      .set('roleType', '3')
      .set('status', '1');

    this.supportSubmitting.set(true);
    this.http
      .get<ApiResponse<PageDTO<UserInfo>>>('http://localhost:8080/user/api/v1/users', { params })
      .subscribe({
        next: (response) => {
          const admins = response.data?.data || response.result?.data || [];
          const adminIds = admins.map((admin) => String(admin.id));

          if (adminIds.length === 0) {
            this.supportSubmitting.set(false);
            this.alertService.error('Chưa tìm thấy tài khoản admin để nhận yêu cầu hỗ trợ.');
            return;
          }

          this.sendSupportNotification(adminIds, user);
        },
        error: () => {
          this.supportSubmitting.set(false);
          this.alertService.error('Không thể tải danh sách admin nhận hỗ trợ.');
        },
      });
  }

  navigateToProfile() {
    this.layoutService.closeMobileMenu();
    this.closeSupportMenu();
    this.closeSupportModal();
    this.router.navigate(['/profile']).then();
  }

  @HostListener('document:click', ['$event'])
  closeSupportMenuFromDocument(event: MouseEvent) {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.closeSupportMenu();
    }
  }

  supportTypeLabel(): string {
    return this.selectedSupportType() === 'incident'
      ? 'Báo sự cố vận hành'
      : 'Yêu cầu hỗ trợ nghiệp vụ';
  }

  private sendSupportNotification(adminIds: string[], user: UserInfo | null) {
    const department = user?.departmentName || user?.fullName || 'Đơn vị';
    const message = [
      `Đơn vị: ${department}`,
      `Người gửi: ${user?.fullName || user?.username || 'Chưa xác định'}`,
      user?.email ? `Email: ${user.email}` : '',
      user?.phone ? `Số điện thoại: ${user.phone}` : '',
      '',
      this.supportContent().trim(),
    ]
      .filter((line) => line !== '')
      .join('\n');

    const payload: UrgentNotificationRequest = {
      title: this.supportTitle().trim(),
      message,
      priority: this.selectedSupportType() === 'incident' ? 3 : 2,
      targetType: 'ADMIN_SUPPORT',
      userIds: adminIds,
    };

    this.notificationService.sendUrgentNotification(payload).subscribe({
      next: (response) => {
        const count = response.data ?? response.result ?? adminIds.length;
        this.supportSubmitting.set(false);
        this.supportModalOpen.set(false);
        this.supportContent.set('');
        this.alertService.success(`Đã gửi yêu cầu hỗ trợ đến ${count} admin.`);
      },
      error: () => {
        this.supportSubmitting.set(false);
        this.alertService.error('Không thể gửi yêu cầu hỗ trợ đến admin.');
      },
    });
  }

  private defaultSupportTitle(type: SupportRequestType): string {
    const department = this.currentUser()?.departmentName || 'Đơn vị';
    return type === 'incident'
      ? `[Hỗ trợ iAct] ${department} báo sự cố vận hành`
      : `[Hỗ trợ iAct] ${department} cần hỗ trợ nghiệp vụ`;
  }
}
