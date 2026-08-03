import { ChangeDetectionStrategy, Component, OnInit, computed, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModerationFilters } from '../../../../shared/models/activity-moderation.model';
import { ActivityModerationService } from '../../services/activity-moderation.service';
import { ApiResponse, PageDTO, Department } from '@my-mfe/interface';
import { CustomSelectComponent, CustomSelectOption, CustomSelectValue } from '@my-mfe/ui';

@Component({
  selector: 'app-moderation-filters',
  standalone: true,
  imports: [CommonModule, CustomSelectComponent],
  templateUrl: './moderation-filters.component.html',
  styleUrls: ['./moderation-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModerationFiltersComponent implements OnInit {
  private moderationService = inject(ActivityModerationService);

  departments = signal<Department[]>([]);
  keyword = signal<string>('');

  filterApplied = output<ModerationFilters>();

  selectedDepartment = signal<number | null>(null);
  selectedStatus = signal<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('ALL');

  readonly departmentOptions = computed<CustomSelectOption[]>(() => [
    {
      value: null,
      label: 'Tất cả Khoa',
      description: 'Không lọc theo đơn vị',
      icon: 'bi-buildings',
    },
    ...this.departments().map((dept) => ({
      value: dept.id,
      label: dept.name,
      description: dept.code ? `Mã ${dept.code}` : 'Khoa / đơn vị',
      icon: 'bi-building',
    })),
  ]);

  readonly statusOptions: CustomSelectOption[] = [
    {
      value: 'ALL',
      label: 'Tất cả Trạng thái',
      description: 'Hiển thị mọi trạng thái duyệt',
      icon: 'bi-ui-radios',
    },
    {
      value: 'PENDING',
      label: 'Chờ duyệt',
      description: 'Các hoạt động chưa xử lý',
      icon: 'bi-clock',
    },
    {
      value: 'APPROVED',
      label: 'Đã duyệt',
      description: 'Các hoạt động đã phê duyệt',
      icon: 'bi-check2-circle',
    },
    {
      value: 'REJECTED',
      label: 'Đã từ chối',
      description: 'Các hoạt động bị từ chối',
      icon: 'bi-x-circle',
    },
  ];

  ngOnInit() {
    this.loadDepartments();
  }

  onKeywordChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.keyword.set(input.value);
  }

  clearKeyword(): void {
    this.keyword.set('');
    this.applyFilters();
  }

  onDepartmentChange(value: CustomSelectValue): void {
    this.selectedDepartment.set(typeof value === 'number' ? value : null);
  }

  onStatusChange(value: CustomSelectValue): void {
    this.selectedStatus.set((typeof value === 'string' ? value : 'ALL') as ModerationFilters['status']);
  }

  loadDepartments() {
    this.moderationService.getAllDepartments().subscribe({
      next: (res: ApiResponse<PageDTO<Department>>) => {
        if (res.data && res.data.data) {
          this.departments.set(res.data.data);
        }
      },
    });
  }

  applyFilters() {
    const filters: ModerationFilters = {
      departmentId: this.selectedDepartment(),
      status: this.selectedStatus(),
      keyword: this.keyword().trim(),
    };

    this.filterApplied.emit(filters);
  }
}
