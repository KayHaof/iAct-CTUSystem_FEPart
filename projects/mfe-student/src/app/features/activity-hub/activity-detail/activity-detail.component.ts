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
import { AlertService } from '@my-mfe/ui';
import { Activity, BenefitDto } from '../../../shared/models/activity.model';
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

  activity = signal<Activity | null>(null);
  userRegistration = signal<RegistrationResponse | null>(null);
  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);
  activeTab = signal<'overview' | 'content' | 'benefits'>('overview');
  isRegistrationModalOpen = signal<boolean>(false);

  registrationStatus = computed(() => {
    const status = this.userRegistration()?.status;
    if (status === undefined || status === null) return null;

    const parsedStatus = Number(status);
    return Number.isNaN(parsedStatus) ? null : parsedStatus;
  });

  isRegistered = computed(() => {
    const status = this.registrationStatus();
    return status === 0 || status === 1;
  });

  canCancelRegistration = computed(() => {
    return this.registrationStatus() === 0;
  });

  capacityPercentage = computed(() => {
    const act = this.activity();
    if (!act || !act.maxParticipants) return 0;
    return Math.round(((act.registeredCount || 0) / act.maxParticipants) * 100);
  });

  remainingSlots = computed(() => {
    const act = this.activity();
    if (!act || !act.maxParticipants) return 0;
    return Math.max(act.maxParticipants - (act.registeredCount || 0), 0);
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

  registrationStatusLabel = computed(() => {
    const status = this.registrationStatus();
    if (status === null) return 'Chưa đăng ký';
    if (status === 1) return 'Đã điểm danh';
    if (status === 0) return 'Đã đăng ký';
    if (status === 2) return 'Đã hủy';
    return 'Đang cập nhật';
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

  benefitTitle(benefit: BenefitDto): string {
    return benefit.categoryName || benefit.name || `Tiêu chí #${benefit.categoryId || 'N/A'}`;
  }

  benefitTypeLabel(benefit: BenefitDto): string {
    if (benefit.typeLabel) return benefit.typeLabel;
    if (benefit.type === 1) return 'Điểm cộng';
    if (benefit.type === 2) return 'Điểm trừ';
    return 'Theo tiêu chí';
  }

  semesterLabel(activity: Activity): string {
    if (activity.semesterDisplayName) return activity.semesterDisplayName;
    if (activity.semesterName && activity.academicYear) {
      return `${activity.semesterName}, năm học ${activity.academicYear}`;
    }
    if (activity.semesterName) return activity.semesterName;
    if (activity.academicYear) return `Năm học ${activity.academicYear}`;
    return 'Đang cập nhật';
  }

  async handleRegistration() {
    const act = this.activity();
    if (!act) return;

    if (this.isRegistered()) {
      if (!this.canCancelRegistration()) {
        this.alertService.info('Bạn đã điểm danh hoạt động này rồi!');
        return;
      }

      const { value: reason, isConfirmed } = await Swal.fire({
        title: 'Xác nhận hủy đăng ký?',
        text: 'Bạn có chắc chắn muốn rút tên khỏi danh sách tham gia hoạt động không?',
        icon: 'warning',
        input: 'text',
        inputPlaceholder: 'Nhập lý do bận hoặc không thể tham gia...',
        showCancelButton: true,
        confirmButtonText: 'Chắc, hủy đăng ký',
        cancelButtonText: 'Không, giữ đăng ký',
        confirmButtonColor: '#e11d48',
        inputValidator: (value) =>
          !value ? 'BTC cần biết lý do để xem xét yêu cầu!' : null,
      });

      if (isConfirmed && reason) {
        this.executeRegistrationAction('cancel', act.id, reason);
      }
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
