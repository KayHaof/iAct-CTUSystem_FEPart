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
import { AlertService, ConfirmDialogComponent, ConfirmService, PaginationComponent, TableContainerComponent } from '@my-mfe/ui';

import { MajorFiltersComponent } from './components/major-filters/major-filters.component';
import { MajorFormModalComponent } from './components/major-form-modal/major-form-modal.component';
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

type SelectOption<T> = {
  label: string;
  value: T;
  description?: string;
};

@Component({
  selector: 'app-major-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ConfirmDialogComponent,
    PaginationComponent,
    TableContainerComponent,
    MajorFiltersComponent,
    MajorFormModalComponent,
  ],
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

  public activeDepartments = computed(() => {
    const currentDepartmentId = this.form().departmentId;
    return this.departments().filter(
      (department) =>
        department.isActive !== false ||
        (currentDepartmentId !== '' && department.id === currentDepartmentId),
    );
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
          const page = response.data;
          this.majors.set(page?.data || []);
          this.totalItems.set(page?.totalRows || 0);
          this.normalizeCurrentPage();
        },
        error: () => this.alertService.error('Không thể tải danh sách chuyên ngành.'),
      });
  }

  loadReferenceData(): void {
    this.masterDataService.getDepartmentOptions().subscribe({
      next: (response) => this.departments.set(response.data || []),
      error: () => this.departments.set([]),
    });

    this.masterDataService.getMajorList().subscribe({
      next: (response) => this.allMajors.set(response.data || []),
      error: () => this.allMajors.set([]),
    });
  }

  openCreateForm(): void {
    this.editingMajor.set(null);
    this.form.set(this.createEmptyForm());
    this.isFormOpen.set(true);
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
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.editingMajor.set(null);
    this.form.set(this.createEmptyForm());
  }

  selectStatusFilter(value: MajorFilters['active']): void {
    this.updateFilter('active', value);
    this.applyFilters();
  }

  selectDepartmentFilter(value: MajorFilters['departmentId']): void {
    this.updateFilter('departmentId', value);
    this.applyFilters();
  }

  selectProgramFilter(value: string): void {
    this.updateFilter('programType', value);
    this.applyFilters();
  }

  selectDepartmentForm(value: number | ''): void {
    this.updateForm('departmentId', value);
  }

  selectProgramForm(value: string): void {
    this.updateForm('programType', value);
  }

  selectActiveForm(value: boolean): void {
    this.updateForm('isActive', value);
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

  deleteMajor(major: MajorResponse): void {
    this.confirmService.warning({
      title: 'Xóa chuyên ngành',
      message: `Nếu "${major.name}" đã có lớp sinh hoạt, hệ thống sẽ tạm ngưng thay vì xóa hẳn.`,
      confirmText: 'Xóa',
      onConfirm: () => {
        this.masterDataService.deleteMajor(major.id).subscribe({
          next: () => {
            this.alertService.success('Đã xử lý xóa chuyên ngành.');
            this.reloadData();
          },
          error: () => this.alertService.error('Không thể xóa chuyên ngành này.'),
        });
      },
    });
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
