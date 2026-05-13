import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Activity } from '../../../shared/models/activity.model';

@Component({
  selector: 'app-activity-registration-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 flex items-center justify-center p-4 sm:p-6" style="z-index: 9999">
        <div
          class="absolute inset-0 bg-slate-950/55 backdrop-blur-sm transition-opacity"
          role="button"
          tabindex="-1"
          aria-label="Đóng hộp thoại đăng ký"
          (click)="closeModal()"
          (keydown.enter)="closeModal()"
        ></div>

        <div
          class="relative flex max-h-[90vh] w-full max-w-xl animate-fade-in-up flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <div
            class="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4"
          >
            <div class="min-w-0">
              <h3 class="text-lg font-black tracking-tight text-slate-950">Đăng ký tham gia</h3>
              <p class="mt-1 line-clamp-1 text-xs font-bold text-blue-700">
                {{ activity()?.title }}
              </p>
            </div>
            <button
              type="button"
              (click)="closeModal()"
              class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600"
            >
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="custom-scrollbar overflow-y-auto p-5">
            @if (activity()?.schedules && activity()!.schedules!.length > 0) {
              <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p class="text-sm font-bold text-slate-700">
                  Chọn các buổi bạn có thể tham gia <span class="text-rose-500">*</span>
                </p>
                <button
                  type="button"
                  (click)="toggleAll()"
                  class="w-fit rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                >
                  {{ isAllSelected() ? 'Bỏ chọn tất cả' : 'Chọn tất cả' }}
                </button>
              </div>

              <div class="space-y-3">
                @for (schedule of activity()?.schedules; track schedule.id) {
                  <label
                    class="flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-all duration-200"
                    [ngClass]="
                      selectedScheduleIds().has(schedule.id!)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'
                    "
                  >
                    <div
                      class="relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors"
                      [ngClass]="
                        selectedScheduleIds().has(schedule.id!)
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-slate-300 bg-white'
                      "
                    >
                      @if (selectedScheduleIds().has(schedule.id!)) {
                        <i class="bi bi-check text-lg leading-none text-white"></i>
                      }
                    </div>
                    <div class="flex-1">
                      <h4 class="mb-1 text-sm font-bold leading-tight text-slate-950">
                        {{ schedule.title }}
                      </h4>
                      <div class="flex flex-col gap-1 text-xs font-semibold text-slate-500">
                        <span class="flex items-center gap-1.5">
                          <i class="bi bi-clock text-blue-500"></i>
                          {{ schedule.startTime | date: 'dd/MM HH:mm' }} -
                          {{ schedule.endTime | date: 'HH:mm' }}
                        </span>
                        @if (schedule.location) {
                          <span class="flex items-center gap-1.5">
                            <i class="bi bi-geo-alt-fill text-rose-400"></i>
                            {{ schedule.location }}
                          </span>
                        }
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      class="hidden"
                      [checked]="selectedScheduleIds().has(schedule.id!)"
                      (change)="toggleSchedule(schedule.id!)"
                    />
                  </label>
                }
              </div>
            } @else {
              <div class="py-8 text-center">
                <div
                  class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl text-blue-600"
                >
                  <i class="bi bi-calendar-check-fill"></i>
                </div>
                <p class="text-sm font-medium text-slate-600">
                  Hoạt động này không chia nhỏ thành nhiều buổi.
                </p>
                <p class="mt-2 font-bold text-slate-950">
                  Bạn sẽ đăng ký tham gia toàn bộ thời gian của hoạt động.
                </p>
              </div>
            }
          </div>

          <div class="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 p-4">
            <button
              type="button"
              (click)="closeModal()"
              class="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              (click)="submit()"
              [disabled]="
                isSubmitting() ||
                (activity()?.schedules &&
                  activity()!.schedules!.length > 0 &&
                  selectedScheduleIds().size === 0)
              "
              class="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              @if (isSubmitting()) {
                <div
                  class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                ></div>
                Đang xử lý...
              } @else {
                <i class="bi bi-send-fill"></i>
                Gửi đăng ký
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(8px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .animate-fade-in-up {
        animation: fadeInUp 0.28s ease-out forwards;
      }

      .line-clamp-1 {
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: rgb(203 213 225) transparent;
      }

      .custom-scrollbar::-webkit-scrollbar {
        width: 0.35rem;
      }

      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }

      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgb(203 213 225);
        border-radius: 9999px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityRegistrationModalComponent {
  isOpen = input.required<boolean>();
  activity = input.required<Activity | null>();
  isSubmitting = input<boolean>(false);

  modalClosed = output<void>();
  confirm = output<number[]>();

  selectedScheduleIds = signal<Set<number>>(new Set());

  isAllSelected = computed(() => {
    const schedules = this.activity()?.schedules;
    if (!schedules || schedules.length === 0) return false;
    return this.selectedScheduleIds().size === schedules.length;
  });

  toggleSchedule(id: number) {
    const current = new Set(this.selectedScheduleIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.selectedScheduleIds.set(current);
  }

  toggleAll() {
    if (this.isAllSelected()) {
      this.selectedScheduleIds.set(new Set());
    } else {
      const schedules = this.activity()?.schedules;
      if (schedules) {
        const allIds = schedules.map((s) => s.id).filter((id): id is number => id !== undefined);
        this.selectedScheduleIds.set(new Set(allIds));
      }
    }
  }

  closeModal() {
    if (!this.isSubmitting()) {
      this.modalClosed.emit();
      this.selectedScheduleIds.set(new Set());
    }
  }

  submit() {
    this.confirm.emit(Array.from(this.selectedScheduleIds()));
  }
}
