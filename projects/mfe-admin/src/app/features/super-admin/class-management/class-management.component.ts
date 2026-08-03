import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import {
  AlertService,
  ConfirmDialogComponent,
  ConfirmService,
  PaginationComponent,
  TableContainerComponent,
} from '@my-mfe/ui';

import { ClassFiltersComponent } from './components/class-filters/class-filters.component';
import { ClassFormModalComponent } from './components/class-form-modal/class-form-modal.component';
import { MasterDataService } from '../services/master-data.service';
import {
  ClassFilters,
  ClassRequest,
  ClassResponse,
  DepartmentResponse,
  MajorResponse,
} from '../../../shared/models/master-data.model';

type ClassForm = {
  name: string;
  classCode: string;
  departmentId: number | '';
  majorId: number | '';
  academicYear: string;
  isActive: boolean;
};

type SelectOption<T> = {
  label: string;
  value: T;
  description?: string;
};

@Component({
  selector: 'app-class-management',
  standalone: true,
  imports: [
    CommonModule,
    ConfirmDialogComponent,
    PaginationComponent,
    TableContainerComponent,
    ClassFiltersComponent,
    ClassFormModalComponent,
  ],
  templateUrl: './class-management.component.html',
  styleUrls: ['./class-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassManagementComponent implements OnInit {
  private readonly masterDataService = inject(MasterDataService);
  private readonly alertService = inject(AlertService);
  private readonly confirmService = inject(ConfirmService);

  public classes = signal<ClassResponse[]>([]);
  public allClasses = signal<ClassResponse[]>([]);
  public departments = signal<DepartmentResponse[]>([]);
  public majors = signal<MajorResponse[]>([]);
  public isLoading = signal(false);
  public isSaving = signal(false);
  public isFormOpen = signal(false);
  public editingClass = signal<ClassResponse | null>(null);
  public currentPage = signal(1);
  public pageSize = signal(10);
  public totalItems = signal(0);
  public filters = signal<ClassFilters>({
    active: '',
    departmentId: '',
    majorId: '',
    academicYear: '',
    keyword: '',
  });

  public form = signal<ClassForm>(this.createEmptyForm());

  public readonly academicYearOptions: SelectOption<string>[] = [
    { label: 'K46 (2020)', value: 'K46' },
    { label: 'K47 (2021)', value: 'K47' },
    { label: 'K48 (2022)', value: 'K48' },
    { label: 'K49 (2023)', value: 'K49' },
    { label: 'K50 (2024)', value: 'K50' },
    { label: 'K51 (2025)', value: 'K51' },
    { label: 'K52 (2026)', value: 'K52' },
    { label: 'K53 (2027)', value: 'K53' },
  ];

  public readonly statusFilterOptions: Array<SelectOption<ClassFilters['active']>> = [
    { label: 'Tất cả', value: '', description: 'Không giới hạn trạng thái' },
    { label: 'Đang hoạt động', value: 'true', description: 'Lớp đang được sử dụng' },
    { label: 'Tạm ngưng', value: 'false', description: 'Lớp đã tạm ngưng' },
  ];

  public readonly activeFormOptions: Array<SelectOption<boolean>> = [
    { label: 'Đang hoạt động', value: true, description: 'Cho phép phân lớp cho sinh viên' },
    { label: 'Tạm ngưng', value: false, description: 'Ẩn khỏi các lựa chọn phân lớp' },
  ];

  public activeDepartments = computed(() => {
    const currentDepartmentId = this.form().departmentId;
    return this.departments().filter(
      (department) =>
        department.isActive !== false ||
        (currentDepartmentId !== '' && department.id === currentDepartmentId),
    );
  });

  public activeMajorsByDepartment = computed(() => {
    const deptId = this.form().departmentId;
    const currentMajorId = this.form().majorId;
    if (deptId === '') {
      return this.majors().filter(
        (major) =>
          major.isActive !== false || (currentMajorId !== '' && major.id === currentMajorId),
      );
    }
    return this.majors().filter(
      (major) =>
        (major.departmentId === deptId && major.isActive !== false) ||
        (currentMajorId !== '' && major.id === currentMajorId),
    );
  });

  public filterMajorsByDepartment = computed(() => {
    const deptId = this.filters().departmentId;
    if (deptId === '') {
      return this.majors();
    }
    return this.majors().filter((major) => major.departmentId === deptId);
  });

  ngOnInit(): void {
    this.loadClasses();
    this.loadReferenceData();
  }

  loadClasses(): void {
    this.isLoading.set(true);

    this.masterDataService
      .getClasses(this.currentPage(), this.pageSize(), this.filters())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          const page = response.data;
          if (page && page.data) {
            this.classes.set(page.data as unknown as ClassResponse[]);
            this.totalItems.set(page.totalRows || 0);
          } else {
            this.classes.set([]);
            this.totalItems.set(0);
          }
          this.normalizeCurrentPage();
        },
        error: () => this.alertService.error('Không thể tải danh sách lớp sinh hoạt.'),
      });
  }

  loadReferenceData(): void {
    this.masterDataService.getDepartmentOptions().subscribe({
      next: (response) => this.departments.set(response.data || []),
      error: () => this.departments.set([]),
    });

    this.masterDataService.getMajorList().subscribe({
      next: (response) => this.majors.set(response.data || []),
      error: () => this.majors.set([]),
    });

    this.masterDataService
      .getClasses(1, 1000, {
        active: '',
        departmentId: '',
        majorId: '',
        academicYear: '',
        keyword: '',
      })
      .subscribe({
        next: (response) => {
          const page = response.data;
          this.allClasses.set(page && page.data ? (page.data as unknown as ClassResponse[]) : []);
        },
        error: () => this.allClasses.set([]),
      });
  }

  openCreateForm(): void {
    this.editingClass.set(null);
    this.form.set(this.createEmptyForm());
    this.isFormOpen.set(true);
  }

  openEditForm(cls: ClassResponse): void {
    this.editingClass.set(cls);
    this.form.set({
      name: cls.name || '',
      classCode: cls.classCode || '',
      departmentId: cls.departmentId || '',
      majorId: cls.majorId || '',
      academicYear: cls.academicYear || '',
      isActive: cls.isActive !== false,
    });
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.editingClass.set(null);
    this.form.set(this.createEmptyForm());
  }

  selectStatusFilter(value: ClassFilters['active']): void {
    this.updateFilter('active', value);
    this.applyFilters();
  }

  selectDepartmentFilter(value: ClassFilters['departmentId']): void {
    this.updateFilter('departmentId', value);
    this.updateFilter('majorId', '');
    this.applyFilters();
  }

  selectMajorFilter(value: ClassFilters['majorId']): void {
    this.updateFilter('majorId', value);
    this.applyFilters();
  }

  selectAcademicYearFilter(value: string): void {
    this.updateFilter('academicYear', value);
    this.applyFilters();
  }

  selectDepartmentForm(value: number | ''): void {
    this.updateForm('departmentId', value);
    this.updateForm('majorId', '');
  }

  selectMajorForm(value: number | ''): void {
    this.updateForm('majorId', value);
  }

  selectAcademicYearForm(value: string): void {
    this.updateForm('academicYear', value);
  }

  selectActiveForm(value: boolean): void {
    this.updateForm('isActive', value);
  }

  updateForm<K extends keyof ClassForm>(key: K, value: ClassForm[K]): void {
    this.form.update((current) => ({ ...current, [key]: value }));
  }

  updateFilter<K extends keyof ClassFilters>(key: K, value: ClassFilters[K]): void {
    this.filters.update((current) => ({ ...current, [key]: value }));
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadClasses();
  }

  resetFilters(): void {
    this.filters.set({ active: '', departmentId: '', majorId: '', academicYear: '', keyword: '' });
    this.currentPage.set(1);
    this.loadClasses();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadClasses();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.loadClasses();
  }

  saveClass(): void {
    const payload = this.buildPayload();
    if (!payload) {
      return;
    }

    const current = this.editingClass();
    const request = current
      ? this.masterDataService.updateClass(current.id, payload)
      : this.masterDataService.createClass(payload);

    this.isSaving.set(true);
    request.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.alertService.success(
          current ? 'Đã cập nhật lớp sinh hoạt.' : 'Đã tạo lớp sinh hoạt mới.',
        );
        this.closeForm();
        this.reloadData();
      },
      error: (err) => {
        const message = err?.error?.message || 'Không thể lưu lớp sinh hoạt.';
        this.alertService.error(message);
      },
    });
  }

  toggleActive(cls: ClassResponse): void {
    const isActive = cls.isActive !== false;
    const request = isActive
      ? this.masterDataService.deactivateClass(cls.id)
      : this.masterDataService.activateClass(cls.id);

    request.subscribe({
      next: () => {
        this.alertService.success(isActive ? 'Đã tạm ngưng lớp.' : 'Đã kích hoạt lớp.');
        this.reloadData();
      },
      error: (err) => {
        const message = err?.error?.message || 'Không thể cập nhật trạng thái lớp.';
        this.alertService.error(message);
      },
    });
  }

  deleteClass(cls: ClassResponse): void {
    this.confirmService.warning({
      title: 'Xóa lớp sinh hoạt',
      message: `Bạn có chắc chắn muốn xóa lớp "${cls.name}"?`,
      confirmText: 'Xóa',
      onConfirm: () => {
        this.masterDataService.deleteClass(cls.id).subscribe({
          next: () => {
            this.alertService.success('Đã xóa lớp sinh hoạt.');
            this.reloadData();
          },
          error: (err) => {
            const message = err?.error?.message || 'Không thể xóa lớp này.';
            this.alertService.error(message);
          },
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
    this.loadClasses();
    this.loadReferenceData();
  }

  private buildPayload(): ClassRequest | null {
    const current = this.form();
    const name = current.name.trim();
    const classCode = current.classCode.trim().toUpperCase();

    if (!name) {
      this.alertService.warning('Vui lòng nhập tên lớp sinh hoạt.');
      return null;
    }

    if (!classCode) {
      this.alertService.warning('Vui lòng nhập mã lớp.');
      return null;
    }

    if (current.majorId === '') {
      this.alertService.warning('Vui lòng chọn chuyên ngành.');
      return null;
    }

    if (!current.academicYear) {
      this.alertService.warning('Vui lòng chọn khóa tuyển sinh.');
      return null;
    }

    return {
      name,
      classCode,
      majorId: current.majorId,
      academicYear: current.academicYear,
      isActive: current.isActive,
    };
  }

  private normalizeCurrentPage(): void {
    const totalPages = Math.max(Math.ceil(this.totalItems() / this.pageSize()), 1);
    if (this.currentPage() > totalPages) {
      this.currentPage.set(totalPages);
    }
  }

  private createEmptyForm(): ClassForm {
    return {
      name: '',
      classCode: '',
      departmentId: '',
      majorId: '',
      academicYear: '',
      isActive: true,
    };
  }

  private getScrollContainer(): Element | Window {
    return document.querySelector('.main-scrollable') || document.scrollingElement || window;
  }
}
