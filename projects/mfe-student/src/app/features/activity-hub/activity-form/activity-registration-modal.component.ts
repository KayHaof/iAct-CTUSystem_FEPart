import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Activity } from '../../../shared/models/activity.model';

@Component({
  selector: 'app-activity-registration-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div
        class="fixed inset-0 z- flex items-center justify-center p-4 sm:p-6"
        style="z-index: 9999;"
      >
        <div
          class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          role="button"
          tabindex="-1"
          aria-label="Close modal"
          (click)="closeModal()"
          (keydown.enter)="closeModal()"
        ></div>

        <div
          class="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]"
        >
          <div
            class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50"
          >
            <div>
              <h3 class="text-lg font-black text-slate-800 tracking-tight">Đăng ký tham gia</h3>
              <p class="text-xs font-bold text-indigo-600 mt-1 line-clamp-1">
                {{ activity()?.title }}
              </p>
            </div>
            <button
              (click)="closeModal()"
              class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="p-6 overflow-y-auto custom-scrollbar">
            @if (activity()?.schedules && activity()!.schedules!.length > 0) {
              <div class="mb-4 flex items-center justify-between">
                <p class="text-sm font-bold text-slate-700">
                  Chọn các buổi bạn có thể tham gia <span class="text-red-500">*</span>
                </p>
                <button
                  type="button"
                  (click)="selectAll()"
                  class="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  Chọn tất cả
                </button>
              </div>

              <div class="space-y-3">
                @for (schedule of activity()?.schedules; track schedule.id) {
                  <label
                    class="flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200"
                    [ngClass]="
                      selectedScheduleIds().has(schedule.id!)
                        ? 'border-indigo-500 bg-indigo-50/50'
                        : 'border-slate-100 bg-white hover:border-indigo-200'
                    "
                  >
                    <div
                      class="relative flex items-center justify-center w-6 h-6 rounded-lg border-2 mt-0.5 shrink-0 transition-colors"
                      [ngClass]="
                        selectedScheduleIds().has(schedule.id!)
                          ? 'border-indigo-500 bg-indigo-500'
                          : 'border-slate-300 bg-white'
                      "
                    >
                      @if (selectedScheduleIds().has(schedule.id!)) {
                        <i class="bi bi-check text-white text-lg leading-none"></i>
                      }
                    </div>
                    <div class="flex-1">
                      <h4 class="font-bold text-sm text-slate-800 leading-tight mb-1">
                        {{ schedule.title }}
                      </h4>
                      <div class="flex flex-col gap-1 text-xs text-slate-500 font-medium">
                        <span class="flex items-center gap-1.5"
                          ><i class="bi bi-clock text-indigo-400"></i>
                          {{ schedule.startTime | date: 'dd/MM HH:mm' }} -
                          {{ schedule.endTime | date: 'HH:mm' }}</span
                        >
                        @if (schedule.location) {
                          <span class="flex items-center gap-1.5"
                            ><i class="bi bi-geo-alt-fill text-rose-400"></i>
                            {{ schedule.location }}</span
                          >
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
              <div class="text-center py-8">
                <div
                  class="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
                >
                  <i class="bi bi-calendar-check-fill"></i>
                </div>
                <p class="text-slate-600 font-medium text-sm">
                  Hoạt động này không chia nhỏ thành nhiều buổi.
                </p>
                <p class="text-slate-800 font-bold mt-2">
                  Bạn sẽ đăng ký tham gia toàn bộ thời gian của hoạt động.
                </p>
              </div>
            }
          </div>

          <div class="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
            <button
              type="button"
              (click)="closeModal()"
              class="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors text-sm"
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
              class="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200 flex items-center gap-2 text-sm"
            >
              @if (isSubmitting()) {
                <div
                  class="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"
                ></div>
                Đang xử lý...
              } @else {
                <i class="bi bi-send-fill"></i> Gửi đăng ký
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ActivityRegistrationModalComponent {
  isOpen = input.required<boolean>();
  activity = input.required<Activity | null>();
  isSubmitting = input<boolean>(false);

  modalClosed = output<void>();
  confirm = output<number[]>();

  selectedScheduleIds = signal<Set<number>>(new Set());

  toggleSchedule(id: number) {
    const current = new Set(this.selectedScheduleIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.selectedScheduleIds.set(current);
  }

  selectAll() {
    const schedules = this.activity()?.schedules;
    if (schedules) {
      const allIds = schedules.map((s) => s.id).filter((id): id is number => id !== undefined);
      this.selectedScheduleIds.set(new Set(allIds));
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
