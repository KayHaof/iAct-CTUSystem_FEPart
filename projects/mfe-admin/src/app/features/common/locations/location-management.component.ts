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
import { AlertService } from '@my-mfe/ui';
import { UserService } from '@my-mfe/auth';
import { finalize } from 'rxjs';
import { DepartmentResponse } from '../../../shared/models/master-data.model';
import { MasterDataService } from '../../super-admin/services/master-data.service';
import {
  LocationBookingResponse,
  LocationRequest,
  LocationResponse,
  LocationService,
} from './location.service';

type LocationModalMode = 'create' | 'edit' | 'availability' | 'schedule' | null;

@Component({
  selector: 'app-location-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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

  readonly isAdmin = computed(() => this.userService.currentUser()?.roleType === 3);
  readonly availableCount = computed(
    () =>
      this.locations().filter(
        (location) =>
          location.isActive && location.isBookable && location.availabilityStatus === 'AVAILABLE',
      ).length,
  );
  readonly maintenanceCount = computed(
    () =>
      this.locations().filter((location) => location.availabilityStatus === 'MAINTENANCE').length,
  );
  readonly bookableCount = computed(
    () => this.locations().filter((location) => location.isBookable).length,
  );

  readonly locationTypes = [
    { value: 'HALL', label: 'Hội trường' },
    { value: 'CLASSROOM', label: 'Phòng học' },
    { value: 'SPORT_FIELD', label: 'Sân thể thao' },
    { value: 'LAB', label: 'Phòng thực hành' },
    { value: 'ONLINE', label: 'Trực tuyến' },
    { value: 'OTHER', label: 'Khác' },
  ];

  readonly filterForm = this.fb.group({
    keyword: [''],
    type: [''],
    availabilityStatus: [''],
    active: [''],
    bookable: [''],
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
    this.loadLocations();
    this.loadDepartments();
  }

  loadLocations(): void {
    const raw = this.filterForm.getRawValue();
    this.isLoading.set(true);
    this.locationService
      .getLocations({
        keyword: raw.keyword || null,
        type: raw.type || null,
        availabilityStatus: raw.availabilityStatus || null,
        active: this.toBoolean(raw.active),
        bookable: this.toBoolean(raw.bookable),
        adminManaged: this.toBoolean(raw.adminManaged),
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
      availabilityStatus: '',
      active: '',
      bookable: '',
      adminManaged: '',
    });
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
    return this.locationTypes.find((item) => item.value === type)?.label || 'Khác';
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

  private loadDepartments(): void {
    this.isLoadingDepartments.set(true);
    this.masterDataService
      .getDepartmentOptions('true')
      .pipe(finalize(() => this.isLoadingDepartments.set(false)))
      .subscribe({
        next: (response) => this.departments.set(response.data || []),
        error: () => this.alertService.error('Không thể tải danh sách đơn vị quản lý.'),
      });
  }

  private toBoolean(value?: string | null): boolean | null {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return null;
  }

  private todayInput(): string {
    return new Date().toISOString().substring(0, 10);
  }
}
