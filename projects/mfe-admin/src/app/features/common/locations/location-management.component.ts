import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlertService, CustomSelectComponent, CustomSelectOption } from '@my-mfe/ui';
import { UserService } from '@my-mfe/auth';
import { toLocalDateInput } from '@my-mfe/interface';
import { finalize } from 'rxjs';
import { DepartmentResponse } from '../../../shared/models/master-data.model';
import { MasterDataService } from '../../super-admin/services/master-data.service';
import {
  LocationBookingResponse,
  LocationRequest,
  LocationResponse,
  LocationService,
} from './location.service';

type LocationTabKey = 'ALL' | 'AVAILABLE' | 'MAINTENANCE' | 'UNAVAILABLE' | 'INACTIVE';

type LocationModalMode = 'create' | 'edit' | 'availability' | 'schedule' | null;

interface LocationTab {
  key: LocationTabKey;
  label: string;
  icon: string;
  tone: 'primary' | 'success' | 'warning' | 'info' | 'slate';
  count: number;
}

@Component({
  selector: 'app-location-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CustomSelectComponent],
  templateUrl: './location-management.component.html',
  styleUrl: './location-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationManagementComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly locationService = inject(LocationService);
  private readonly alertService = inject(AlertService);
  private readonly userService = inject(UserService);
  private readonly masterDataService = inject(MasterDataService);

  readonly locations = signal<LocationResponse[]>([]);
  readonly bookings = signal<LocationBookingResponse[]>([]);
  readonly departments = signal<DepartmentResponse[]>([]);
  readonly selectedLocation = signal<LocationResponse | null>(null);
  readonly modalMode = signal<LocationModalMode>(null);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isLoadingBookings = signal(false);
  readonly isLoadingDepartments = signal(false);
  readonly currentTab = signal<LocationTabKey>('ALL');

  readonly isAdmin = computed(() => this.userService.currentUser()?.roleType === 3);
  readonly isDepartment = computed(() => this.userService.currentUser()?.roleType === 2);
  readonly currentDepartmentId = computed(() => this.userService.currentUser()?.departmentId ?? null);
  readonly pageTitle = computed(() =>
    this.isDepartment() ? 'Địa điểm đơn vị' : 'Địa điểm cho mượn',
  );
  readonly pageDescription = computed(() =>
    this.isDepartment()
      ? 'Theo dõi khả dụng và lịch sử dụng các địa điểm do khoa/trường của bạn quản lý.'
      : 'Theo dõi khả dụng, lịch sử dụng và danh mục địa điểm phục vụ hoạt động.',
  );
  readonly visibleLocations = computed(() =>
    this.locations().filter((location) => this.matchesCurrentTab(location)),
  );

  readonly locationTabs = computed<LocationTab[]>(() => {
    const locations = this.locations();
    return [
      {
        key: 'ALL',
        label: 'Tất cả',
        icon: 'bi-grid-1x2-fill',
        tone: 'primary',
        count: locations.length,
      },
      {
        key: 'AVAILABLE',
        label: 'Sẵn sàng',
        icon: 'bi-check2-circle',
        tone: 'success',
        count: locations.filter(
          (location) =>
            location.isActive !== false &&
            location.isBookable !== false &&
            location.availabilityStatus === 'AVAILABLE',
        ).length,
      },
      {
        key: 'MAINTENANCE',
        label: 'Bảo trì',
        icon: 'bi-wrench-adjustable-circle',
        tone: 'warning',
        count: locations.filter(
          (location) =>
            location.isActive !== false && location.availabilityStatus === 'MAINTENANCE',
        ).length,
      },
      {
        key: 'UNAVAILABLE',
        label: 'Tạm ngưng',
        icon: 'bi-pause-circle',
        tone: 'info',
        count: locations.filter(
          (location) =>
            location.isActive !== false &&
            (location.availabilityStatus === 'UNAVAILABLE' || location.isBookable === false),
        ).length,
      },
      {
        key: 'INACTIVE',
        label: 'Đã khóa',
        icon: 'bi-lock-fill',
        tone: 'slate',
        count: locations.filter((location) => location.isActive === false).length,
      },
    ];
  });

  readonly locationTypeOptions: CustomSelectOption[] = [
    { value: '', label: 'Tất cả loại', description: 'Không lọc theo loại địa điểm', icon: 'bi-grid' },
    { value: 'HALL', label: 'Hội trường', icon: 'bi-building' },
    { value: 'CLASSROOM', label: 'Phòng học', icon: 'bi-easel' },
    { value: 'SPORT_FIELD', label: 'Sân thể thao', icon: 'bi-dribbble' },
    { value: 'LAB', label: 'Phòng thực hành', icon: 'bi-flask' },
    { value: 'ONLINE', label: 'Trực tuyến', icon: 'bi-camera-video' },
    { value: 'OTHER', label: 'Khác', icon: 'bi-three-dots' },
  ];

  readonly locationTypeSelectOptions = this.locationTypeOptions.slice(1);
  readonly departmentSelectOptions = computed<CustomSelectOption[]>(() => [
    {
      value: null,
      label: this.isLoadingDepartments() ? 'Đang tải đơn vị...' : 'Chọn khoa/trường quản lý',
      description: this.isLoadingDepartments()
        ? 'Danh sách đơn vị đang được tải'
        : 'Không chọn nếu địa điểm do admin quản lý',
      icon: 'bi-building',
      disabled: this.isLoadingDepartments(),
    },
    ...this.departments().map((department) => ({
      value: department.id,
      label: department.name,
      description: department.code ? `Mã ${department.code}` : 'Khoa / Trường',
      icon: 'bi-buildings',
    })),
  ]);

  readonly adminManagedOptions: CustomSelectOption[] = [
    { value: '', label: 'Tất cả hình thức quản lý', description: 'Hiển thị mọi địa điểm', icon: 'bi-ui-checks-grid' },
    { value: true, label: 'Admin quản lý', description: 'Địa điểm do admin phụ trách', icon: 'bi-shield-lock-fill' },
    {
      value: false,
      label: 'Khoa / Trường quản lý',
      description: 'Địa điểm do đơn vị quản lý',
      icon: 'bi-building',
    },
  ];

  readonly availabilityOptions: CustomSelectOption[] = [
    { value: 'AVAILABLE', label: 'Sẵn sàng', icon: 'bi-check2-circle' },
    { value: 'MAINTENANCE', label: 'Bảo trì', icon: 'bi-wrench-adjustable-circle' },
    { value: 'UNAVAILABLE', label: 'Tạm ngưng', icon: 'bi-pause-circle' },
  ];

  readonly scheduleViewOptions: CustomSelectOption[] = [
    { value: 'day', label: 'Ngày', icon: 'bi-calendar-day' },
    { value: 'week', label: 'Tuần', icon: 'bi-calendar-week' },
    { value: 'month', label: 'Tháng', icon: 'bi-calendar-month' },
  ];

  readonly bookingModeOptions: CustomSelectOption[] = [
    { value: 'blocking', label: 'Đang giữ chỗ', icon: 'bi-shield-lock-fill' },
    { value: 'all', label: 'Tất cả', icon: 'bi-grid' },
  ];

  readonly filterForm = this.fb.group({
    keyword: [''],
    type: [''],
    adminManaged: [''],
  });

  readonly locationForm = this.fb.group({
    name: ['', Validators.required],
    code: [''],
    type: ['CLASSROOM', Validators.required],
    description: [''],
    address: [''],
    building: [''],
    floor: [''],
    room: [''],
    capacity: [null as number | null],
    adminManaged: [false],
    managerDepartmentId: [null as number | null],
    contactName: [''],
    contactPhone: [''],
    isBookable: [true],
    availabilityStatus: ['AVAILABLE'],
    isActive: [true],
    unavailableReason: [''],
    note: [''],
  });

  readonly availabilityForm = this.fb.group({
    isBookable: [true],
    availabilityStatus: ['AVAILABLE'],
    unavailableReason: [''],
  });

  readonly scheduleForm = this.fb.group({
    date: [this.todayInput()],
    view: ['month'],
    statusMode: ['blocking'],
  });

  ngOnInit(): void {
    this.hydrateCurrentDepartmentOption();
    this.loadLocations();
    if (this.isAdmin()) {
      this.loadDepartments();
    }
  }

  loadLocations(): void {
    const raw = this.filterForm.getRawValue();
    const departmentId = this.currentDepartmentId();
    if (this.isDepartment() && !departmentId) {
      this.locations.set([]);
      this.alertService.error('Tài khoản chưa được gắn khoa/trường quản lý địa điểm.');
      return;
    }
    this.isLoading.set(true);
    this.locationService
      .getLocations({
        keyword: raw.keyword || null,
        type: raw.type || null,
        managerDepartmentId: this.isDepartment() ? departmentId : null,
        adminManaged: this.isDepartment() ? false : this.toBoolean(raw.adminManaged),
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (locations) => this.locations.set(locations),
        error: () => this.alertService.error('Không thể tải danh sách địa điểm.'),
      });
  }

  resetFilters(): void {
    this.filterForm.reset({
      keyword: '',
      type: '',
      adminManaged: this.isDepartment() ? 'false' : '',
    });
    this.currentTab.set('ALL');
    this.loadLocations();
  }

  openCreateModal(): void {
    this.selectedLocation.set(null);
    this.locationForm.reset({
      type: 'CLASSROOM',
      adminManaged: false,
      isBookable: true,
      availabilityStatus: 'AVAILABLE',
      isActive: true,
    });
    this.modalMode.set('create');
    if (!this.departments().length) this.loadDepartments();
  }

  openEditModal(location: LocationResponse): void {
    this.selectedLocation.set(location);
    this.locationForm.patchValue({
      name: location.name,
      code: location.code || '',
      type: location.type,
      description: location.description || '',
      address: location.address || '',
      building: location.building || '',
      floor: location.floor || '',
      room: location.room || '',
      capacity: location.capacity || null,
      adminManaged: Boolean(location.adminManaged),
      managerDepartmentId: location.managerDepartmentId || null,
      contactName: location.contactName || '',
      contactPhone: location.contactPhone || '',
      isBookable: location.isBookable ?? true,
      availabilityStatus: location.availabilityStatus || 'AVAILABLE',
      isActive: location.isActive ?? true,
      unavailableReason: location.unavailableReason || '',
      note: location.note || '',
    });
    this.modalMode.set('edit');
    if (!this.departments().length) this.loadDepartments();
  }

  openAvailabilityModal(location: LocationResponse): void {
    this.selectedLocation.set(location);
    this.availabilityForm.patchValue({
      isBookable: location.isBookable ?? true,
      availabilityStatus: location.availabilityStatus || 'AVAILABLE',
      unavailableReason: location.unavailableReason || '',
    });
    this.modalMode.set('availability');
  }

  openScheduleModal(location: LocationResponse): void {
    this.selectedLocation.set(location);
    this.scheduleForm.patchValue({
      date: this.todayInput(),
      view: 'month',
      statusMode: 'blocking',
    });
    this.bookings.set([]);
    this.modalMode.set('schedule');
    this.loadBookings();
  }

  closeModal(): void {
    this.modalMode.set(null);
    this.selectedLocation.set(null);
    this.bookings.set([]);
  }

  saveLocation(): void {
    if (this.locationForm.invalid) {
      this.locationForm.markAllAsTouched();
      this.alertService.error('Vui lòng nhập đầy đủ thông tin địa điểm.');
      return;
    }

    const raw = this.locationForm.getRawValue();
    if (!raw.adminManaged && !raw.managerDepartmentId) {
      this.locationForm.controls.managerDepartmentId.markAsTouched();
      this.alertService.error('Vui lòng chọn đơn vị quản lý địa điểm.');
      return;
    }

    const payload = this.buildLocationPayload();
    const selected = this.selectedLocation();
    const request$ = selected
      ? this.locationService.updateLocation(selected.id, payload)
      : this.locationService.createLocation(payload);

    this.isSaving.set(true);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.alertService.success('Đã lưu địa điểm.');
        this.closeModal();
        this.loadLocations();
      },
      error: (error) => this.alertService.error(error?.error?.message || 'Không thể lưu địa điểm.'),
    });
  }

  onAdminManagedChange(): void {
    if (this.locationForm.controls.adminManaged.value) {
      this.locationForm.patchValue({ managerDepartmentId: null });
    }
  }

  saveAvailability(): void {
    const selected = this.selectedLocation();
    if (!selected) return;
    const raw = this.availabilityForm.getRawValue();
    this.isSaving.set(true);
    this.locationService
      .updateAvailability(selected.id, {
        isBookable: raw.isBookable,
        availabilityStatus: raw.availabilityStatus,
        unavailableReason: raw.unavailableReason || null,
      })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.alertService.success('Đã cập nhật khả dụng.');
          this.closeModal();
          this.loadLocations();
        },
        error: (error) =>
          this.alertService.error(error?.error?.message || 'Không thể cập nhật khả dụng.'),
      });
  }

  toggleActive(location: LocationResponse): void {
    const request$ = location.isActive
      ? this.locationService.deactivateLocation(location.id)
      : this.locationService.activateLocation(location.id);
    request$.subscribe({
      next: () => {
        this.alertService.success(location.isActive ? 'Đã khóa địa điểm.' : 'Đã mở địa điểm.');
        this.loadLocations();
      },
      error: (error) =>
        this.alertService.error(error?.error?.message || 'Không thể cập nhật trạng thái.'),
    });
  }

  loadBookings(): void {
    const selected = this.selectedLocation();
    if (!selected) return;
    const raw = this.scheduleForm.getRawValue();
    const statuses = raw.statusMode === 'blocking' ? [0, 1] : null;
    this.isLoadingBookings.set(true);
    this.locationService
      .getLocationBookings(selected.id, raw.date, raw.view || 'month', statuses)
      .pipe(finalize(() => this.isLoadingBookings.set(false)))
      .subscribe({
        next: (bookings) => this.bookings.set(bookings),
        error: () => this.alertService.error('Không thể tải lịch sử dụng địa điểm.'),
      });
  }

  modalTitle(): string {
    const mode = this.modalMode();
    if (mode === 'create') return 'Thêm địa điểm';
    if (mode === 'edit') return 'Cập nhật địa điểm';
    if (mode === 'availability') return 'Cập nhật khả dụng';
    if (mode === 'schedule') return `Lịch sử dụng ${this.selectedLocation()?.name || ''}`;
    return '';
  }

  buildAddress(location: LocationResponse): string {
    return (
      [location.building, location.floor, location.room, location.address]
        .filter(Boolean)
        .join(' · ') || 'Chưa có vị trí chi tiết'
    );
  }

  managerLabel(location: LocationResponse): string {
    if (location.adminManaged) return 'Admin quản lý';
    const department = this.departments().find((item) => item.id === location.managerDepartmentId);
    if (department)
      return department.code ? `${department.name} (${department.code})` : department.name;
    return location.managerDepartmentId
      ? `Khoa/Trường #${location.managerDepartmentId}`
      : 'Khoa/Trường quản lý';
  }

  getTypeLabel(type?: string | null): string {
    const matched = this.locationTypeOptions.find((item) => item.value === type);
    return matched?.value ? matched.label : 'Khác';
  }

  getAvailabilityLabel(status?: string | null): string {
    const map: Record<string, string> = {
      AVAILABLE: 'Sẵn sàng',
      MAINTENANCE: 'Bảo trì',
      UNAVAILABLE: 'Tạm ngưng',
    };
    return status ? map[status] || status : 'Chưa rõ';
  }

  getAvailabilityClass(location: LocationResponse): string {
    if (!location.isBookable) return 'bg-rose-50 text-rose-700';
    if (location.availabilityStatus === 'AVAILABLE') return 'bg-emerald-50 text-emerald-700';
    if (location.availabilityStatus === 'MAINTENANCE') return 'bg-amber-50 text-amber-700';
    return 'bg-rose-50 text-rose-700';
  }

  getBookingStatusLabel(status: number): string {
    const map: Record<number, string> = {
      0: 'Chờ duyệt',
      1: 'Đã duyệt',
      2: 'Từ chối',
      3: 'Bản nháp',
      4: 'Đã hủy',
    };
    return map[status] || 'Chưa rõ';
  }

  getBookingStatusClass(status: number): string {
    if (status === 0) return 'bg-amber-50 text-amber-700';
    if (status === 1) return 'bg-emerald-50 text-emerald-700';
    if (status === 2 || status === 4) return 'bg-rose-50 text-rose-700';
    return 'bg-slate-100 text-slate-600';
  }

  selectTab(tab: LocationTabKey): void {
    this.currentTab.set(tab);
  }

  formatDisplayDate(value?: string | null): string {
    if (!value) return 'Chưa cung cấp';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Chưa cung cấp';
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }

  private buildLocationPayload(): LocationRequest {
    const raw = this.locationForm.getRawValue();
    return {
      name: raw.name || '',
      code: raw.code || null,
      type: raw.type || 'OTHER',
      description: raw.description || null,
      address: raw.address || null,
      building: raw.building || null,
      floor: raw.floor || null,
      room: raw.room || null,
      capacity: raw.capacity ? Number(raw.capacity) : null,
      adminManaged: Boolean(raw.adminManaged),
      managerDepartmentId: raw.adminManaged ? null : raw.managerDepartmentId,
      contactName: raw.contactName || null,
      contactPhone: raw.contactPhone || null,
      isBookable: raw.isBookable,
      availabilityStatus: raw.availabilityStatus || 'AVAILABLE',
      isActive: raw.isActive,
      unavailableReason: raw.unavailableReason || null,
      note: raw.note || null,
    };
  }

  private matchesCurrentTab(location: LocationResponse): boolean {
    switch (this.currentTab()) {
      case 'AVAILABLE':
        return (
          location.isActive !== false &&
          location.isBookable !== false &&
          location.availabilityStatus === 'AVAILABLE'
        );
      case 'MAINTENANCE':
        return location.isActive !== false && location.availabilityStatus === 'MAINTENANCE';
      case 'UNAVAILABLE':
        return (
          location.isActive !== false &&
          (location.availabilityStatus === 'UNAVAILABLE' || location.isBookable === false)
        );
      case 'INACTIVE':
        return location.isActive === false;
      default:
        return true;
    }
  }

  private loadDepartments(): void {
    if (!this.isAdmin()) {
      this.hydrateCurrentDepartmentOption();
      return;
    }
    this.isLoadingDepartments.set(true);
    this.masterDataService
      .getDepartmentOptions('true')
      .pipe(finalize(() => this.isLoadingDepartments.set(false)))
      .subscribe({
        next: (response) => this.departments.set(response.data || []),
        error: () => this.alertService.error('Không thể tải danh sách đơn vị quản lý.'),
      });
  }

  private toBoolean(value?: string | boolean | null): boolean | null {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return null;
  }

  private hydrateCurrentDepartmentOption(): void {
    const user = this.userService.currentUser();
    if (!user?.departmentId || this.departments().some((item) => item.id === user.departmentId)) {
      return;
    }
    this.departments.update((items) => [
      ...items,
      {
        id: user.departmentId as number,
        name: user.departmentName || `Khoa/Trường #${user.departmentId}`,
      },
    ]);
  }

  private todayInput(): string {
    return toLocalDateInput(new Date());
  }
}
