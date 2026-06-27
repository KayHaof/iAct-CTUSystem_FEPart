import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Activity } from '../../../../../shared/models/activity.model';
import { ActivityModerationService } from '../../../services/activity-moderation.service';
import { ApiResponse } from '@my-mfe/interface';

@Component({
  selector: 'app-view-activity-modal',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe],
  templateUrl: './view-activity-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewActivityModalComponent implements OnInit {
  activityId = input.required<number>();
  modalClosed = output<void>();
  approve = output<Activity>();
  reject = output<Activity>();

  private moderationService = inject(ActivityModerationService);

  activity = signal<Activity | null>(null);
  isLoading = signal<boolean>(true);

  ngOnInit() {
    this.fetchActivityDetails();
  }

  fetchActivityDetails() {
    this.isLoading.set(true);
    this.moderationService.getActivityDetails(this.activityId().toString()).subscribe({
      next: (res: ApiResponse<Activity>) => {
        this.activity.set(res.data as Activity);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  onClose() {
    this.modalClosed.emit();
  }

  onApprove(): void {
    const currentActivity = this.activity();
    if (currentActivity) {
      this.approve.emit(currentActivity);
    }
  }

  onReject(): void {
    const currentActivity = this.activity();
    if (currentActivity) {
      this.reject.emit(currentActivity);
    }
  }

  statusLabel(status: number | null | undefined): string {
    switch (status) {
      case 1:
        return 'Đã duyệt';
      case 2:
        return 'Từ chối';
      case 0:
        return 'Chờ duyệt';
      default:
        return 'Không xác định';
    }
  }

  statusClasses(status: number | null | undefined): string {
    switch (status) {
      case 1:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 2:
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 0:
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  }

  scopeLabel(activity: Activity): string {
    return activity.isFaculty ? 'Cấp Khoa' : 'Cấp Trường';
  }

  activityTypeLabel(activity: Activity): string {
    return activity.isExternal ? 'Hoạt động ngoài hệ thống' : 'Hoạt động nội bộ';
  }
}
