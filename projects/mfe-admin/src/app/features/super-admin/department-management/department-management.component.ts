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

import { DepartmentFormModalComponent } from './components/department-form-modal/department-form-modal.component';
import { MasterDataService } from '../services/master-data.service';
import {
  DepartmentFilters,
  DepartmentRequest,
  DepartmentResponse,
  MajorResponse,
} from '../../../shared/models/master-data.model';

type DepartmentForm = {
  name: string;
  code: string;
  description: string;
  phone: string;
  address: string;
  avatarUrl: string;
  isActive: boolean;
};

type DepartmentDropdownKey = 'statusFilter' | 'activeForm';

type SelectOption<T> = {
  label: string;
  value: T;
  description?: string;
};

@Component({
  selector: 'app-department-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ConfirmDialogComponent,
    PaginationComponent,
    DepartmentFormModalComponent,
  ],
  templateUrl: './department-management.component.html',
  styleUrls: ['./department-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepartmentManagementComponent implements OnInit {
  private readonly masterDataService = inject(MasterDataService);
  private readonly alertService = inject(AlertService);
  private readonly confirmService = inject(ConfirmService);

  public departments = signal<DepartmentResponse[]>([]);
  public allDepartments = signal<DepartmentResponse[]>([]);
  public allMajors = signal<MajorResponse[]>([]);
  public isLoading = signal(false);
  public isSaving = signal(false);
  public isFormOpen = signal(false);
  public editingDepartment = signal<DepartmentResponse | null>(null);
  public currentPage = signal(1);
  public pageSize = signal(10);
  public totalItems = signal(0);
  public openDropdown = signal<DepartmentDropdownKey | null>(null);
  public filters = signal<DepartmentFilters>({
    active: '',
    keyword: '',
  });

  public form = signal<DepartmentForm>(this.createEmptyForm());

  public readonly statusFilterOptions: Array<SelectOption<DepartmentFilters['active']>> = [
    { label: 'Tất cả', value: '', description: 'Không giới hạn trạng thái' },
    { label: 'Đang hoạt động', value: 'true', description: 'Đơn vị đang được sử dụng' },
    { label: 'Tạm ngưng', value: 'false', description: 'Đơn vị đã tạm ngưng' },
  ];

  public readonly activeFormOptions: Array<SelectOption<boolean>> = [
    { label: 'Đang hoạt động', value: true, description: 'Cho phép dùng trong nghiệp vụ mới' },
    { label: 'Tạm ngưng', value: false, description: 'Ẩn khỏi các lựa chọn mới' },
  ];

  public activeCount = computed(
    () => this.allDepartments().filter((department) => department.isActive !== false).length,
  );
  public inactiveCount = computed(
    () => this.allDepartments().filter((department) => department.isActive === false).length,
  );
  public majorCountMap = computed(() => {
    const counts = new Map<number, number>();
    for (const major of this.allMajors()) {
      if (major.departmentId == null) {
        continue;
      }
      counts.set(major.departmentId, (counts.get(major.departmentId) || 0) + 1);
    }
    return counts;
  });
  public departmentsWithMajors = computed(() => this.majorCountMap().size);

  public formDropdown = computed<
    | import('./components/department-form-modal/department-form-modal.component').DepartmentFormDropdownKey
    | null
  >(() => {
    const dropdown = this.openDropdown();
    return dropdown === 'activeForm' ? dropdown : null;
  });

  ngOnInit(): void {
    this.loadDepartments();
    this.loadReferenceData();
  }

  loadDepartments(): void {
    this.isLoading.set(true);

    this.masterDataService
      .getDepartments(this.currentPage(), this.pageSize(), this.filters())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          const page = response.data;
          this.departments.set(page?.data || []);
          this.totalItems.set(page?.totalRows || 0);
          this.normalizeCurrentPage();
        },
        error: () => this.alertService.error('Không thể tải danh sách Khoa/Trường/Viện.'),
      });
  }

  loadReferenceData(): void {
    this.masterDataService.getDepartmentOptions().subscribe({
      next: (response) => this.allDepartments.set(response.data || []),
      error: () => this.allDepartments.set([]),
    });

    this.masterDataService.getMajorList().subscribe({
      next: (response) => this.allMajors.set(response.data || []),
      error: () => this.allMajors.set([]),
    });
  }

  openCreateForm(): void {
    this.editingDepartment.set(null);
    this.form.set(this.createEmptyForm());
    this.isFormOpen.set(true);
    this.openDropdown.set(null);
  }

  openEditForm(department: DepartmentResponse): void {
    this.editingDepartment.set(department);
    this.form.set({
      name: department.name || '',
      code: department.code || '',
      description: department.description || '',
      phone: department.phone || '',
      address: department.address || '',
      avatarUrl: department.avatarUrl || '',
      isActive: department.isActive !== false,
    });
    this.isFormOpen.set(true);
    this.openDropdown.set(null);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.editingDepartment.set(null);
    this.form.set(this.createEmptyForm());
    this.openDropdown.set(null);
  }

  toggleDropdown(key: DepartmentDropdownKey): void {
    this.openDropdown.update((current) => (current === key ? null : key));
  }

  isDropdownOpen(key: DepartmentDropdownKey): boolean {
    return this.openDropdown() === key;
  }

  closeDropdown(): void {
    this.openDropdown.set(null);
  }

  selectStatusFilter(value: DepartmentFilters['active']): void {
    this.updateFilter('active', value);
    this.closeDropdown();
    this.applyFilters();
  }

  selectActiveForm(value: boolean): void {
    this.updateForm('isActive', value);
    this.closeDropdown();
  }

  updateForm<K extends keyof DepartmentForm>(key: K, value: DepartmentForm[K]): void {
    this.form.update((current) => ({ ...current, [key]: value }));
  }

  updateFilter<K extends keyof DepartmentFilters>(key: K, value: DepartmentFilters[K]): void {
    this.filters.update((current) => ({ ...current, [key]: value }));
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadDepartments();
  }

  resetFilters(): void {
    this.filters.set({ active: '', keyword: '' });
    this.currentPage.set(1);
    this.openDropdown.set(null);
    this.loadDepartments();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadDepartments();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.loadDepartments();
  }

  saveDepartment(): void {
    const payload = this.buildPayload();
    if (!payload) {
      return;
    }

    const current = this.editingDepartment();
    const request = current
      ? this.masterDataService.updateDepartment(current.id, payload)
      : this.masterDataService.createDepartment(payload);

    this.isSaving.set(true);
    request.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.alertService.success(current ? 'Đã cập nhật đơn vị.' : 'Đã tạo đơn vị mới.');
        this.closeForm();
        this.reloadData();
      },
      error: () => this.alertService.error('Không thể lưu đơn vị. Vui lòng kiểm tra dữ liệu.'),
    });
  }

  toggleActive(department: DepartmentResponse): void {
    const isActive = department.isActive !== false;
    const request = isActive
      ? this.masterDataService.deactivateDepartment(department.id)
      : this.masterDataService.activateDepartment(department.id);

    request.subscribe({
      next: () => {
        this.alertService.success(isActive ? 'Đã tạm ngưng đơn vị.' : 'Đã kích hoạt đơn vị.');
        this.reloadData();
      },
      error: () => this.alertService.error('Không thể cập nhật trạng thái đơn vị.'),
    });
  }

  deleteDepartment(department: DepartmentResponse): void {
    this.confirmService.warning({
      title: 'Xóa đơn vị',
      message: `Nếu "${department.name}" đã có chuyên ngành, hệ thống sẽ tạm ngưng thay vì xóa hẳn.`,
      confirmText: 'Xóa',
      onConfirm: () => {
        this.masterDataService.deleteDepartment(department.id).subscribe({
          next: () => {
            this.alertService.success('Đã xử lý xóa đơn vị.');
            this.reloadData();
          },
          error: () => this.alertService.error('Không thể xóa đơn vị này.'),
        });
      },
    });
  }

  getStatusFilterLabel(): string {
    return (
      this.statusFilterOptions.find((option) => option.value === this.filters().active)?.label ||
      'Tất cả'
    );
  }

  getActiveFormLabel(): string {
    return this.form().isActive ? 'Đang hoạt động' : 'Tạm ngưng';
  }

  getMajorCount(departmentId: number): number {
    return this.majorCountMap().get(departmentId) || 0;
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
    this.loadDepartments();
    this.loadReferenceData();
  }

  private buildPayload(): DepartmentRequest | null {
    const current = this.form();
    const name = current.name.trim();
    const code = current.code.trim().toUpperCase();
    const description = current.description.trim();
    const phone = current.phone.trim();
    const address = current.address.trim();
    const avatarUrl = current.avatarUrl.trim();

    if (!name) {
      this.alertService.warning('Vui lòng nhập tên Khoa/Trường/Viện.');
      return null;
    }

    if (!code) {
      this.alertService.warning('Vui lòng nhập mã đơn vị.');
      return null;
    }

    return {
      name,
      code,
      description: description || null,
      phone: phone || null,
      address: address || null,
      avatarUrl: avatarUrl || null,
      isActive: current.isActive,
    };
  }

  private normalizeCurrentPage(): void {
    const totalPages = Math.max(Math.ceil(this.totalItems() / this.pageSize()), 1);
    if (this.currentPage() > totalPages) {
      this.currentPage.set(totalPages);
    }
  }

  private createEmptyForm(): DepartmentForm {
    return {
      name: '',
      code: '',
      description: '',
      phone: '',
      address: '',
      avatarUrl: '',
      isActive: true,
    };
  }

  private getScrollContainer(): Element | Window {
    return document.querySelector('.main-scrollable') || document.scrollingElement || window;
  }
}
