import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

import { ActivityService } from '../../../shared/services/activity.service';
import { RegistrationService } from '../../../shared/services/registration.service';
import { AlertService, ConfirmService } from '@my-mfe/ui';
import { Activity } from '../../../shared/models/activity.model';
import { RegistrationResponse, ApiResponse } from '@my-mfe/interface';
import { ActivityRegistrationModalComponent } from '../activity-form/activity-registration-modal.component';

@Component({
  selector: 'app-activity-detail',
  standalone: true,
  imports: [CommonModule, ActivityRegistrationModalComponent],
  templateUrl: './activity-detail.component.html',
  styleUrls: ['./activity-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private activityService = inject(ActivityService);
  private registrationService = inject(RegistrationService);

  private alertService = inject(AlertService);
  private confirmService = inject(ConfirmService);

  activity = signal<Activity | null>(null);
  userRegistration = signal<RegistrationResponse | null>(null);
  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);
  activeTab = signal<'overview' | 'content' | 'benefits'>('overview');
  isRegistrationModalOpen = signal<boolean>(false);

  isRegistered = computed(() => {
    const reg = this.userRegistration();
    return !!reg && (reg.status === 0 || reg.status === 1);
  });

  capacityPercentage = computed(() => {
    const act = this.activity();
    if (!act || !act.maxParticipants) return 0;
    return Math.round(((act.registeredCount || 0) / act.maxParticipants) * 100);
  });

  totalPoints = computed(() => {
    const act = this.activity();
    if (!act || !act.benefits) return 0;
    return act.benefits.reduce((sum, b) => sum + (b.point || 0), 0);
  });

  statusConfig = computed(() => {
    const act = this.activity();
    if (!act) return { isOpen: false, label: 'Đang tải...', canRegister: false };

    const now = new Date().getTime();
    const regStart = new Date(act.registrationStart).getTime();
    const regEnd = new Date(act.registrationEnd).getTime();
    const isFull = (act.registeredCount || 0) >= act.maxParticipants;

    if (now < regStart) return { isOpen: false, label: 'Chưa mở đăng ký', canRegister: false };
    if (now > regEnd) return { isOpen: false, label: 'Đã đóng đăng ký', canRegister: false };
    if (isFull && !this.isRegistered()) {
      return { isOpen: false, label: 'Đủ số lượng', canRegister: false };
    }

    return { isOpen: true, label: 'Đang mở đăng ký', canRegister: true };
  });

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.fetchActivityDetails(Number(id));
    } else {
      await this.goBack();
    }
  }

  fetchActivityDetails(id: number): void {
    this.isLoading.set(true);

    this.activityService.getActivityById(id).subscribe({
      next: (res: Activity | ApiResponse<Activity>) => {
        const actData = 'data' in res ? res.data : 'result' in res ? res.result : res;
        this.activity.set(actData as Activity);
      },
      error: () => {
        this.alertService.error('Không thể tải thông tin hoạt động!');
        this.goBack().then();
      },
      complete: () => this.isLoading.set(false),
    });

    this.registrationService.getMyStatus(id).subscribe({
      next: (res: ApiResponse<RegistrationResponse>) =>
        this.userRegistration.set(res.data || null),
      error: () => this.userRegistration.set(null),
    });
  }

  async goBack(): Promise<void> {
    await this.router.navigate(['/activity-hub']);
  }

  setTab(tab: 'overview' | 'content' | 'benefits'): void {
    this.activeTab.set(tab);
  }

  async handleRegistration() {
    const act = this.activity();
    if (!act) return;

    if (this.isRegistered()) {
      if (this.userRegistration()?.status === 1) {
        this.alertService.info('Bạn đã điểm danh hoạt động này rồi!');
        return;
      }
      await this.confirmService.confirm({
        title: 'Xác nhận hủy?',
        message: 'Bạn có chắc chắn muốn rút tên khỏi danh sách tham gia hoạt động không?',
        confirmText: 'Chắc, hủy đăng ký',
        cancelText: 'Không, giữ đăng ký',
        type: 'warning',
        onConfirm: async () => {
          const { value: reason } = await Swal.fire({
            title: 'Lý do hủy đăng ký',
            input: 'text',
            inputPlaceholder: 'Nhập lý do bận gì đó...',
            inputValidator: (value) => (!value ? 'BTC cần biết lý do để xem xét yêu cầu!' : null),
          });

          if (reason) this.executeRegistrationAction('cancel', act.id, reason);
        },
      });
    } else {
      if (!this.statusConfig().canRegister) return;
      this.isRegistrationModalOpen.set(true);
    }
  }

  submitRegistration(selectedScheduleIds: number[]) {
    const act = this.activity();
    if (!act) return;

    this.isSubmitting.set(true);

    this.registrationService
      .registerActivity(act.id, selectedScheduleIds)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (res: ApiResponse<RegistrationResponse>) => {
          this.alertService.success('Đã ghi nhận đăng ký của bạn!');
          this.isRegistrationModalOpen.set(false);
          this.userRegistration.set(res.data || null);
          this.fetchActivityDetails(act.id);
        },
        error: (err: HttpErrorResponse) => {
          const msg = err.error?.message || 'Có lỗi xảy ra, thử lại sau nhé!';
          this.alertService.error(msg);
        },
      });
  }

  private executeRegistrationAction(
    action: 'register' | 'cancel',
    id: number,
    reason?: string,
  ): void {
    this.isSubmitting.set(true);

    const request$ =
      action === 'register'
        ? this.registrationService.registerActivity(id, [])
        : this.registrationService.cancelRegistration(id, reason || '');

    request$.pipe(finalize(() => this.isSubmitting.set(false))).subscribe({
      next: (res: ApiResponse<RegistrationResponse>) => {
        this.alertService.success(
          action === 'register' ? 'Đã ghi nhận đăng ký của bạn!' : 'Đã hủy thành công.',
        );
        this.userRegistration.set(res.data || null);
        this.fetchActivityDetails(id);
      },
      error: (err: HttpErrorResponse) => {
        const msg = err.error?.message || 'Có lỗi xảy ra, thử lại sau nhé!';
        this.alertService.error(msg);
      },
    });
  }
}
