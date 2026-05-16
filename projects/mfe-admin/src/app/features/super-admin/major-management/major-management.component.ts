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
import { AlertService, ConfirmService, PaginationComponent, TableContainerComponent } from '@my-mfe/ui';

import { MasterDataService } from '../services/master-data.service';
import {
  DepartmentResponse,
  MajorFilters,
  MajorRequest,
  MajorResponse,
} from '../../../shared/models/master-data.model';

type MajorForm = {
  name: string;
  code: string;
  programType: string;
  departmentId: number | '';
  isActive: boolean;
};

type MajorDropdownKey =
  | 'statusFilter'
  | 'departmentFilter'
  | 'programFilter'
  | 'departmentForm'
  | 'programForm'
  | 'activeForm';

type SelectOption<T> = {
  label: string;
  value: T;
  description?: string;
};

@Component({
  selector: 'app-major-management',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent, TableContainerComponent],
  templateUrl: './major-management.component.html',
  styleUrls: ['./major-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MajorManagementComponent implements OnInit {
  private readonly masterDataService = inject(MasterDataService);
  private readonly alertService = inject(AlertService);
  private readonly confirmService = inject(ConfirmService);

  public majors = signal<MajorResponse[]>([]);
  public allMajors = signal<MajorResponse[]>([]);
  public departments = signal<DepartmentResponse[]>([]);
  public isLoading = signal(false);
  public isSaving = signal(false);
  public isFormOpen = signal(false);
  public editingMajor = signal<MajorResponse | null>(null);
  public currentPage = signal(1);
  public pageSize = signal(10);
  public totalItems = signal(0);
  public openDropdown = signal<MajorDropdownKey | null>(null);
  public filters = signal<MajorFilters>({
    active: '',
    departmentId: '',
    keyword: '',
    programType: '',
  });

  public form = signal<MajorForm>(this.createEmptyForm());

  public readonly statusFilterOptions: Array<SelectOption<MajorFilters['active']>> = [
    { label: 'Tất cả', value: '', description: 'Không giới hạn trạng thái' },
    { label: 'Đang hoạt động', value: 'true', description: 'Chuyên ngành đang được sử dụng' },
    { label: 'Tạm ngưng', value: 'false', description: 'Chuyên ngành đã tạm ngưng' },
  ];

  public readonly activeFormOptions: Array<SelectOption<boolean>> = [
    { label: 'Đang hoạt động', value: true, description: 'Cho phép chọn cho lớp và người dùng mới' },
    { label: 'Tạm ngưng', value: false, description: 'Ẩn khỏi các lựa chọn nghiệp vụ mới' },
  ];

  public readonly programTypeOptions: Array<SelectOption<string>> = [
    { label: 'Đại trà', value: 'Đại trà', description: 'Chương trình đào tạo chuẩn' },
    { label: 'Chất lượng cao', value: 'Chất lượng cao', description: 'Chương trình đào tạo chất lượng cao' },
    { label: 'Tiên tiến', value: 'Tiên tiến', description: 'Chương trình tiên tiến hoặc liên kết' },
    { label: 'Liên thông', value: 'Liên thông', description: 'Chương trình liên thông' },
    { label: 'Văn bằng 2', value: 'Văn bằng 2', description: 'Chương trình văn bằng 2' },
  ];

  public activeCount = computed(
    () => this.allMajors().filter((major) => major.isActive !== false).length,
  );
  public inactiveCount = computed(
    () => this.allMajors().filter((major) => major.isActive === false).length,
  );
  public departmentCount = computed(() => {
    const ids = new Set<number>();
    for (const major of this.allMajors()) {
      if (major.departmentId != null) {
        ids.add(major.departmentId);
      }
    }
    return ids.size;
  });
  public activeDepartments = computed(() => {
    const currentDepartmentId = this.form().departmentId;
    return this.departments().filter(
      (department) =>
        department.isActive !== false ||
        (currentDepartmentId !== '' && department.id === currentDepartmentId),
    );
  });
  public topProgramType = computed(() => {
    const counts = new Map<string, number>();
    for (const major of this.allMajors()) {
      const programType = major.programType || 'Chưa phân loại';
      counts.set(programType, (counts.get(programType) || 0) + 1);
    }

    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'Chưa có dữ liệu';
  });

  ngOnInit(): void {
    this.loadMajors();
    this.loadReferenceData();
  }

  loadMajors(): void {
    this.isLoading.set(true);

    this.masterDataService
      .getMajors(this.currentPage(), this.pageSize(), this.filters())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          const page = response.result;
          this.majors.set(page?.data || []);
          this.totalItems.set(page?.totalRows || 0);
          this.normalizeCurrentPage();
        },
        error: () => this.alertService.error('Không thể tải danh sách chuyên ngành.'),
      });
  }

  loadReferenceData(): void {
    this.masterDataService.getDepartmentOptions().subscribe({
      next: (response) => this.departments.set(response.result || []),
      error: () => this.departments.set([]),
    });

    this.masterDataService.getMajorList().subscribe({
      next: (response) => this.allMajors.set(response.result || []),
      error: () => this.allMajors.set([]),
    });
  }

  openCreateForm(): void {
    this.editingMajor.set(null);
    this.form.set(this.createEmptyForm());
    this.isFormOpen.set(true);
    this.openDropdown.set(null);
  }

  openEditForm(major: MajorResponse): void {
    this.editingMajor.set(major);
    this.form.set({
      name: major.name || '',
      code: major.code || '',
      programType: major.programType || '',
      departmentId: major.departmentId || '',
      isActive: major.isActive !== false,
    });
    this.isFormOpen.set(true);
    this.openDropdown.set(null);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.editingMajor.set(null);
    this.form.set(this.createEmptyForm());
    this.openDropdown.set(null);
  }

  toggleDropdown(key: MajorDropdownKey): void {
    this.openDropdown.update((current) => (current === key ? null : key));
  }

  isDropdownOpen(key: MajorDropdownKey): boolean {
    return this.openDropdown() === key;
  }

  closeDropdown(): void {
    this.openDropdown.set(null);
  }

  selectStatusFilter(value: MajorFilters['active']): void {
    this.updateFilter('active', value);
    this.closeDropdown();
    this.applyFilters();
  }

  selectDepartmentFilter(value: MajorFilters['departmentId']): void {
    this.updateFilter('departmentId', value);
    this.closeDropdown();
    this.applyFilters();
  }

  selectProgramFilter(value: string): void {
    this.updateFilter('programType', value);
    this.closeDropdown();
    this.applyFilters();
  }

  selectDepartmentForm(value: number | ''): void {
    this.updateForm('departmentId', value);
    this.closeDropdown();
  }

  selectProgramForm(value: string): void {
    this.updateForm('programType', value);
    this.closeDropdown();
  }

  selectActiveForm(value: boolean): void {
    this.updateForm('isActive', value);
    this.closeDropdown();
  }

  updateForm<K extends keyof MajorForm>(key: K, value: MajorForm[K]): void {
    this.form.update((current) => ({ ...current, [key]: value }));
  }

  updateFilter<K extends keyof MajorFilters>(key: K, value: MajorFilters[K]): void {
    this.filters.update((current) => ({ ...current, [key]: value }));
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadMajors();
  }

  resetFilters(): void {
    this.filters.set({ active: '', departmentId: '', keyword: '', programType: '' });
    this.currentPage.set(1);
    this.openDropdown.set(null);
    this.loadMajors();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadMajors();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.loadMajors();
  }

  saveMajor(): void {
    const payload = this.buildPayload();
    if (!payload) {
      return;
    }

    const current = this.editingMajor();
    const request = current
      ? this.masterDataService.updateMajor(current.id, payload)
      : this.masterDataService.createMajor(payload);

    this.isSaving.set(true);
    request.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.alertService.success(current ? 'Đã cập nhật chuyên ngành.' : 'Đã tạo chuyên ngành mới.');
        this.closeForm();
        this.reloadData();
      },
      error: () => this.alertService.error('Không thể lưu chuyên ngành. Vui lòng kiểm tra dữ liệu.'),
    });
  }

  toggleActive(major: MajorResponse): void {
    const isActive = major.isActive !== false;
    const request = isActive
      ? this.masterDataService.deactivateMajor(major.id)
      : this.masterDataService.activateMajor(major.id);

    request.subscribe({
      next: () => {
        this.alertService.success(isActive ? 'Đã tạm ngưng chuyên ngành.' : 'Đã kích hoạt chuyên ngành.');
        this.reloadData();
      },
      error: () => this.alertService.error('Không thể cập nhật trạng thái chuyên ngành.'),
    });
  }

  async deleteMajor(major: MajorResponse): Promise<void> {
    const confirmed = await this.confirmService.warning(
      'Xóa chuyên ngành',
      `Nếu "${major.name}" đã có lớp sinh hoạt, hệ thống sẽ tạm ngưng thay vì xóa hẳn.`,
      'Xóa',
    );

    if (!confirmed) {
      return;
    }

    this.masterDataService.deleteMajor(major.id).subscribe({
      next: () => {
        this.alertService.success('Đã xử lý xóa chuyên ngành.');
        this.reloadData();
      },
      error: () => this.alertService.error('Không thể xóa chuyên ngành này.'),
    });
  }

  getStatusFilterLabel(): string {
    return (
      this.statusFilterOptions.find((option) => option.value === this.filters().active)?.label ||
      'Tất cả'
    );
  }

  getDepartmentFilterLabel(): string {
    const departmentId = this.filters().departmentId;
    if (departmentId === '') {
      return 'Tất cả đơn vị';
    }

    return this.departments().find((department) => department.id === departmentId)?.name || 'Đơn vị đã chọn';
  }

  getProgramFilterLabel(): string {
    return this.filters().programType || 'Tất cả hệ đào tạo';
  }

  getDepartmentFormLabel(): string {
    const departmentId = this.form().departmentId;
    if (departmentId === '') {
      return 'Chọn đơn vị quản lý';
    }

    return this.departments().find((department) => department.id === departmentId)?.name || 'Đơn vị đã chọn';
  }

  getProgramFormLabel(): string {
    return this.form().programType || 'Chọn hệ đào tạo';
  }

  getActiveFormLabel(): string {
    return this.form().isActive ? 'Đang hoạt động' : 'Tạm ngưng';
  }

  formatDate(value?: string | null): string {
    if (!value) {
      return 'Chưa cập nhật';
    }

    return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
  }

  scrollToTop(): void {
    this.getScrollContainer().scrollTo({ top: 0, behavior: 'smooth' });
  }

  private reloadData(): void {
    this.loadMajors();
    this.loadReferenceData();
  }

  private buildPayload(): MajorRequest | null {
    const current = this.form();
    const name = current.name.trim();
    const code = current.code.trim().toUpperCase();
    const programType = current.programType.trim();

    if (!name) {
      this.alertService.warning('Vui lòng nhập tên chuyên ngành.');
      return null;
    }

    if (!code) {
      this.alertService.warning('Vui lòng nhập mã chuyên ngành.');
      return null;
    }

    if (!programType) {
      this.alertService.warning('Vui lòng chọn hệ đào tạo.');
      return null;
    }

    if (current.departmentId === '') {
      this.alertService.warning('Vui lòng chọn đơn vị quản lý.');
      return null;
    }

    return {
      name,
      code,
      programType,
      departmentId: current.departmentId,
      isActive: current.isActive,
    };
  }

  private normalizeCurrentPage(): void {
    const totalPages = Math.max(Math.ceil(this.totalItems() / this.pageSize()), 1);
    if (this.currentPage() > totalPages) {
      this.currentPage.set(totalPages);
    }
  }

  private createEmptyForm(): MajorForm {
    return {
      name: '',
      code: '',
      programType: '',
      departmentId: '',
      isActive: true,
    };
  }

  private getScrollContainer(): Element | Window {
    return document.querySelector('.main-scrollable') || document.scrollingElement || window;
  }
}
