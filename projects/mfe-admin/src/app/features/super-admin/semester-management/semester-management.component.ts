import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  AlertService,
  ConfirmDialogComponent,
  ConfirmService,
  PaginationComponent,
} from '@my-mfe/ui';

import { SemesterFiltersComponent } from './components/semester-filters/semester-filters.component';
import { SemesterFormModalComponent } from './components/semester-form-modal/semester-form-modal.component';
import { MasterDataService } from '../services/master-data.service';
import {
  SemesterFilters,
  SemesterRequest,
  SemesterResponse,
} from '../../../shared/models/master-data.model';

type SemesterForm = {
  name: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isLocked: boolean;
};

type SemesterDropdownKey = 'activeFilter' | 'lockedFilter' | 'statusForm';

type SelectOption<T> = {
  label: string;
  value: T;
  description?: string;
};

@Component({
  selector: 'app-semester-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PaginationComponent,
    ConfirmDialogComponent,
    SemesterFiltersComponent,
    SemesterFormModalComponent,
  ],
  templateUrl: './semester-management.component.html',
  styleUrls: ['./semester-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SemesterManagementComponent implements OnInit {
  private readonly masterDataService = inject(MasterDataService);
  private readonly alertService = inject(AlertService);
  private readonly confirmService = inject(ConfirmService);

  public semesters = signal<SemesterResponse[]>([]);
  public isLoading = signal(false);
  public isSaving = signal(false);
  public isFormOpen = signal(false);
  public editingSemester = signal<SemesterResponse | null>(null);
  public currentPage = signal(1);
  public pageSize = signal(10);
  public openDropdown = signal<SemesterDropdownKey | null>(null);
  public filters = signal<SemesterFilters>({
    active: '',
    locked: '',
    academicYear: '',
  });

  public form = signal<SemesterForm>(this.createEmptyForm());

  public readonly activeFilterOptions: Array<SelectOption<SemesterFilters['active']>> = [
    { label: 'Tất cả', value: '', description: 'Không giới hạn trạng thái áp dụng' },
    { label: 'Đang áp dụng', value: 'true', description: 'Học kỳ đang được sử dụng' },
    { label: 'Chưa áp dụng', value: 'false', description: 'Học kỳ chưa được kích hoạt' },
  ];

  public readonly lockedFilterOptions: Array<SelectOption<SemesterFilters['locked']>> = [
    { label: 'Tất cả', value: '', description: 'Không giới hạn trạng thái khóa' },
    { label: 'Đã khóa', value: 'true', description: 'Không cho chỉnh sửa dữ liệu' },
    { label: 'Chưa khóa', value: 'false', description: 'Có thể cập nhật dữ liệu' },
  ];

  public readonly statusFormOptions: Array<SelectOption<boolean>> = [
    { label: 'Chưa áp dụng', value: false, description: 'Lưu học kỳ nhưng chưa kích hoạt' },
    { label: 'Đang áp dụng', value: true, description: 'Đặt làm học kỳ hiện hành' },
  ];

  public activeSemester = computed(
    () => this.semesters().find((semester) => semester.isActive) || null,
  );
  public lockedCount = computed(
    () => this.semesters().filter((semester) => semester.isLocked).length,
  );
  public openCount = computed(
    () => this.semesters().filter((semester) => !semester.isLocked).length,
  );
  public pagedSemesters = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.semesters().slice(start, start + this.pageSize());
  });

  public filterDropdown = computed<'activeFilter' | 'lockedFilter' | null>(() => {
    const dropdown = this.openDropdown();
    return dropdown === 'activeFilter' || dropdown === 'lockedFilter' ? dropdown : null;
  });

  public formDropdown = computed<import('./components/semester-form-modal/semester-form-modal.component').SemesterFormDropdownKey | null>(() => {
    const dropdown = this.openDropdown();
    return dropdown === 'statusForm' ? dropdown : null;
  });

  ngOnInit(): void {
    this.loadSemesters();
  }

  loadSemesters(): void {
    this.isLoading.set(true);

    this.masterDataService
      .getSemesters(this.filters())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.semesters.set(response.data || []);
          this.normalizeCurrentPage();
        },
        error: () => this.alertService.error('Không thể tải danh sách học kỳ.'),
      });
  }

  openCreateForm(): void {
    this.editingSemester.set(null);
    this.form.set(this.createEmptyForm());
    this.isFormOpen.set(true);
    this.openDropdown.set(null);
  }

  openEditForm(semester: SemesterResponse): void {
    if (semester.isLocked) {
      this.alertService.warning('Học kỳ đã khóa. Vui lòng mở khóa trước khi chỉnh sửa.');
      return;
    }

    this.editingSemester.set(semester);
    this.form.set({
      name: this.getSemesterName(semester),
      academicYear: semester.academicYear || '',
      startDate: this.toInputDate(semester.startDate),
      endDate: this.toInputDate(semester.endDate),
      isActive: semester.isActive,
      isLocked: semester.isLocked,
    });
    this.isFormOpen.set(true);
    this.openDropdown.set(null);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.editingSemester.set(null);
    this.form.set(this.createEmptyForm());
    this.openDropdown.set(null);
  }

  toggleDropdown(key: SemesterDropdownKey): void {
    this.openDropdown.update((current) => (current === key ? null : key));
  }

  isDropdownOpen(key: SemesterDropdownKey): boolean {
    return this.openDropdown() === key;
  }

  closeDropdown(): void {
    this.openDropdown.set(null);
  }

  selectActiveFilter(value: SemesterFilters['active']): void {
    this.updateFilter('active', value);
    this.closeDropdown();
  }

  selectLockedFilter(value: SemesterFilters['locked']): void {
    this.updateFilter('locked', value);
    this.closeDropdown();
  }

  selectStatusForm(value: boolean): void {
    this.updateForm('isActive', value);
    this.closeDropdown();
  }

  updateForm<K extends keyof SemesterForm>(key: K, value: SemesterForm[K]): void {
    this.form.update((current) => ({ ...current, [key]: value }));
  }

  updateFilter<K extends keyof SemesterFilters>(key: K, value: SemesterFilters[K]): void {
    this.filters.update((current) => ({ ...current, [key]: value }));
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadSemesters();
  }

  resetFilters(): void {
    this.filters.set({ active: '', locked: '', academicYear: '' });
    this.currentPage.set(1);
    this.openDropdown.set(null);
    this.loadSemesters();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  saveSemester(): void {
    const payload = this.buildPayload();
    if (!payload) {
      return;
    }

    const current = this.editingSemester();
    const request = current
      ? this.masterDataService.updateSemester(current.id, payload)
      : this.masterDataService.createSemester(payload);

    this.isSaving.set(true);
    request.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.alertService.success(current ? 'Đã cập nhật học kỳ.' : 'Đã tạo học kỳ mới.');
        this.closeForm();
        this.loadSemesters();
      },
      error: () => this.alertService.error('Không thể lưu học kỳ. Vui lòng kiểm tra dữ liệu.'),
    });
  }

  activateSemester(semester: SemesterResponse): void {
    this.confirmService.confirm({
      title: 'Kích hoạt học kỳ',
      message: `Học kỳ "${this.getSemesterName(semester)}" sẽ trở thành học kỳ đang áp dụng.`,
      confirmText: 'Kích hoạt',
      cancelText: 'Hủy',
      type: 'info',
      onConfirm: () => {
        this.masterDataService.activateSemester(semester.id).subscribe({
          next: () => {
            this.alertService.success('Đã kích hoạt học kỳ.');
            this.loadSemesters();
          },
          error: () => this.alertService.error('Không thể kích hoạt học kỳ.'),
        });
      },
    });
  }

  toggleLock(semester: SemesterResponse): void {
    const request = semester.isLocked
      ? this.masterDataService.unlockSemester(semester.id)
      : this.masterDataService.lockSemester(semester.id);

    request.subscribe({
      next: () => {
        this.alertService.success(semester.isLocked ? 'Đã mở khóa học kỳ.' : 'Đã khóa học kỳ.');
        this.loadSemesters();
      },
      error: () => this.alertService.error('Không thể cập nhật trạng thái khóa học kỳ.'),
    });
  }

  deleteSemester(semester: SemesterResponse): void {
    if (semester.isLocked) {
      this.alertService.warning('Không thể xóa học kỳ đã khóa.');
      return;
    }

    this.confirmService.danger({
      title: 'Xóa học kỳ',
      message: `Bạn có chắc chắn muốn xóa "${this.getSemesterName(semester)}"?`,
      confirmText: 'Xóa',
      onConfirm: () => {
        this.masterDataService.deleteSemester(semester.id).subscribe({
          next: () => {
            this.alertService.success('Đã xóa học kỳ.');
            this.loadSemesters();
          },
          error: () => this.alertService.error('Không thể xóa học kỳ này.'),
        });
      },
    });
  }

  getActiveFilterLabel(): string {
    return (
      this.activeFilterOptions.find((option) => option.value === this.filters().active)?.label ||
      'Tất cả'
    );
  }

  getLockedFilterLabel(): string {
    return (
      this.lockedFilterOptions.find((option) => option.value === this.filters().locked)?.label ||
      'Tất cả'
    );
  }

  getStatusFormLabel(): string {
    return this.form().isActive ? 'Đang áp dụng' : 'Chưa áp dụng';
  }

  getSemesterName(semester: SemesterResponse): string {
    return semester.name || semester.semesterName || 'Chưa đặt tên';
  }

  formatDate(value?: string | null): string {
    if (!value) {
      return 'Chưa thiết lập';
    }

    return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
  }

  scrollToTop(): void {
    this.getScrollContainer().scrollTo({ top: 0, behavior: 'smooth' });
  }

  private buildPayload(): SemesterRequest | null {
    const current = this.form();
    const name = current.name.trim();
    const academicYear = current.academicYear.trim();

    if (!name || !academicYear) {
      this.alertService.warning('Vui lòng nhập tên học kỳ và năm học.');
      return null;
    }

    if (current.startDate && current.endDate && current.startDate > current.endDate) {
      this.alertService.warning('Ngày bắt đầu không được lớn hơn ngày kết thúc.');
      return null;
    }

    return {
      name,
      academicYear,
      startDate: current.startDate || null,
      endDate: current.endDate || null,
      isActive: current.isActive,
      isLocked: current.isLocked,
    };
  }

  private normalizeCurrentPage(): void {
    const totalPages = Math.max(Math.ceil(this.semesters().length / this.pageSize()), 1);
    if (this.currentPage() > totalPages) {
      this.currentPage.set(totalPages);
    }
  }

  private createEmptyForm(): SemesterForm {
    return {
      name: '',
      academicYear: '',
      startDate: '',
      endDate: '',
      isActive: false,
      isLocked: false,
    };
  }

  private toInputDate(value?: string | null): string {
    if (!value) {
      return '';
    }

    return value.slice(0, 10);
  }

  private getScrollContainer(): Element | Window {
    return document.querySelector('.main-scrollable') || document.scrollingElement || window;
  }
}
