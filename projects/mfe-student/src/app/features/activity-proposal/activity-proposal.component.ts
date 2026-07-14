import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AlertService } from '@my-mfe/ui';
import { CloudinaryService } from '@my-mfe/data-access-media';
import { forkJoin, of } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';
import { Activity, ActivityScheduleDto } from '../../shared/models/activity.model';
import {
  ActivityProposalPayload,
  ActivityProposalService,
  RepresentativeActivityPermission,
  TrainingCategory,
} from '../../shared/services/activity-proposal.service';
import { LocationResponse, LocationService } from '../../shared/services/location.service';

@Component({
  selector: 'app-activity-proposal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './activity-proposal.component.html',
  styleUrls: ['./activity-proposal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityProposalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly proposalService = inject(ActivityProposalService);
  private readonly locationService = inject(LocationService);
  private readonly cloudinaryService = inject(CloudinaryService);
  private readonly alertService = inject(AlertService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isUploading = signal(false);
  readonly isFindingLocations = signal(false);
  readonly isFindingScheduleLocations = signal<Record<number, boolean>>({});
  readonly permission = signal<RepresentativeActivityPermission | null>(null);
  readonly availableLocations = signal<LocationResponse[]>([]);
  readonly availableLocationsBySchedule = signal<Record<number, LocationResponse[]>>({});
  readonly coverPreview = signal<string | null>(null);
  readonly thumbnailPreview = signal<string | null>(null);
  readonly categoryTree = signal<TrainingCategory[]>([]);
  readonly categories = signal<TrainingCategory[]>([]);
  readonly openBenefitPicker = signal<number | null>(null);
  readonly proposalId = signal<number | null>(null);
  readonly loadedProposalStatus = signal<number | null>(null);
  readonly isEditMode = computed(() => this.proposalId() !== null);
  readonly canEditLoadedProposal = computed(() => {
    const status = this.loadedProposalStatus();
    return !this.isEditMode() || status === 0 || status === 3;
  });
  readonly selectableCategories = computed(() =>
    this.categories().filter((category) => !category.children?.length && category.maxPoint > 0),
  );
  readonly currentStep = signal(1);
  readonly wizardSteps = [
    {
      id: 1,
      label: 'Bài đăng',
      description: 'Nội dung đề xuất',
      icon: 'bi-file-earmark-text',
    },
    {
      id: 2,
      label: 'Tổ chức',
      description: 'Thời gian, địa điểm',
      icon: 'bi-calendar-event',
    },
    {
      id: 3,
      label: 'Xác nhận',
      description: 'Kiểm tra trước khi gửi',
      icon: 'bi-check2-circle',
    },
  ];

  readonly form = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    content: ['', Validators.required],
    coverImage: [null as File | string | null],
    thumbnail: [null as File | string | null],
    registrationStart: ['', Validators.required],
    registrationEnd: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    location: [''],
    locationId: [null as number | null],
    maxParticipants: [30, [Validators.required, Validators.min(1)]],
    scheduleTitle: ['Buổi chính'],
    scheduleLocation: [''],
    benefits: this.fb.array([]),
    hasDetailedSchedule: [false],
    schedules: this.fb.array([this.createScheduleGroup(1)]),
  });

  get schedules(): FormArray {
    return this.form.controls.schedules as FormArray;
  }

  get benefits(): FormArray {
    return this.form.controls.benefits as FormArray;
  }

  ngOnInit(): void {
    const routeId = this.parseRouteProposalId();
    this.proposalId.set(routeId);

    this.proposalService.getMyPermission().subscribe({
      next: (permission) => {
        this.permission.set(permission);
        if (routeId && permission.canCreateActivity) {
          this.loadProposalForEdit(routeId);
          return;
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.permission.set({ canCreateActivity: false });
        this.isLoading.set(false);
      },
    });
    this.loadTrainingCategories();
  }

  private parseRouteProposalId(): number | null {
    const rawId = this.route.snapshot.paramMap.get('id');
    if (!rawId) return null;
    const id = Number(rawId);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  private loadProposalForEdit(id: number): void {
    this.proposalService.getMyProposal(id).subscribe({
      next: (activity) => {
        this.applyProposalToForm(activity);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.alertService.error(
          error?.error?.message || 'Không thể tải đề xuất hoạt động của bạn.',
        );
        this.router.navigate(['/activity-proposals']).then();
      },
    });
  }

  private applyProposalToForm(activity: Activity): void {
    const schedules = activity.schedules || [];
    const baseSchedule = schedules[0];
    const hasDetailedSchedule = schedules.length > 1;
    const baseLocation = this.resolveActivityLocation(activity, baseSchedule);

    this.loadedProposalStatus.set(activity.status ?? null);
    this.form.patchValue({
      title: activity.title || '',
      description: activity.description || '',
      content: activity.content || '',
      coverImage: activity.coverImage || null,
      thumbnail: activity.thumbnail || null,
      registrationStart: this.toInputDate(activity.registrationStart),
      registrationEnd: this.toInputDate(activity.registrationEnd),
      startDate: this.toInputDate(activity.startDate),
      endDate: this.toInputDate(activity.endDate),
      location: baseLocation.name || activity.location || '',
      locationId: hasDetailedSchedule ? null : baseLocation.id || null,
      maxParticipants: activity.maxParticipants || 30,
      scheduleTitle: baseSchedule?.title || 'Buổi chính',
      scheduleLocation: baseLocation.name || activity.location || '',
      hasDetailedSchedule,
    });

    this.coverPreview.set(activity.coverImage || null);
    this.thumbnailPreview.set(activity.thumbnail || null);
    this.availableLocations.set(baseLocation.id ? [baseLocation] : []);

    this.benefits.clear();
    (activity.benefits || []).forEach((benefit) => {
      this.benefits.push(
        this.createBenefitGroup(benefit.categoryId || null, benefit.point ?? null),
      );
    });
    this.openBenefitPicker.set(null);

    this.schedules.clear();
    const scheduleLocationMap: Record<number, LocationResponse[]> = {};
    const editableSchedules = hasDetailedSchedule ? schedules : schedules.slice(0, 1);
    if (editableSchedules.length) {
      editableSchedules.forEach((schedule, index) => {
        const selectedLocation = this.resolveActivityLocation(activity, schedule);
        this.schedules.push(
          this.createScheduleGroup(index + 1, {
            title: schedule.title || `Buổi ${index + 1}`,
            startTime: this.toInputDate(schedule.startTime),
            endTime: this.toInputDate(schedule.endTime),
            location: selectedLocation.name || schedule.location || '',
            locationId: selectedLocation.id || null,
          }),
        );
        if (selectedLocation.id) {
          scheduleLocationMap[index] = [selectedLocation];
        }
      });
    } else {
      this.schedules.push(this.createScheduleGroup(1));
    }
    this.availableLocationsBySchedule.set(scheduleLocationMap);
    this.currentStep.set(1);
  }

  private resolveActivityLocation(
    activity: Activity,
    schedule?: ActivityScheduleDto,
  ): LocationResponse {
    const scheduleBooking = activity.locationBookings?.find((booking) => {
      if (!schedule) return true;
      if (booking.scheduleId && schedule.id) return booking.scheduleId === schedule.id;
      return booking.scheduleTitle === schedule.title;
    });
    const locationId = schedule?.locationId || scheduleBooking?.locationId || null;
    const locationName =
      schedule?.locationName ||
      scheduleBooking?.locationName ||
      schedule?.location ||
      activity.location ||
      'Địa điểm đã chọn';

    return {
      id: Number(locationId || 0),
      name: locationName,
      code: schedule?.locationCode || scheduleBooking?.locationCode || null,
    };
  }

  saveDraft(): void {
    const status = this.isEditMode() && this.loadedProposalStatus() !== 3 ? 0 : 3;
    this.submitWithStatus(status);
  }

  submit(): void {
    this.submitWithStatus(0);
  }

  stepProgress(): number {
    return Math.round((this.currentStep() / this.wizardSteps.length) * 100);
  }

  goToStep(step: number): void {
    if (!this.canNavigateToStep(step)) return;
    this.currentStep.set(step);
    this.scrollWizardToTop();
  }

  previousStep(): void {
    this.currentStep.update((step) => Math.max(1, step - 1));
    this.scrollWizardToTop();
  }

  nextStep(): void {
    const step = this.currentStep();
    if (!this.validateCurrentStep()) return;
    this.currentStep.set(Math.min(this.wizardSteps.length, step + 1));
    this.scrollWizardToTop();
  }

  canNavigateToStep(step: number): boolean {
    if (step <= this.currentStep()) return true;
    if (step === 2) return this.isStepCompleted(1);
    if (step === 3) return this.isStepCompleted(1) && this.isStepCompleted(2);
    return false;
  }

  isStepCompleted(step: number): boolean {
    if (step === 1) {
      return (
        this.form.controls.title.valid &&
        this.form.controls.description.valid &&
        this.form.controls.content.valid
      );
    }

    if (step === 2) {
      const hasBaseInfo =
        this.form.controls.registrationStart.valid &&
        this.form.controls.registrationEnd.valid &&
        this.form.controls.startDate.valid &&
        this.form.controls.endDate.valid &&
        this.form.controls.maxParticipants.valid;

      if (!this.form.controls.hasDetailedSchedule.value) {
        return hasBaseInfo && Boolean(this.form.controls.locationId.value);
      }

      return hasBaseInfo && this.hasValidDetailedSchedules();
    }

    return this.form.valid && this.isStepCompleted(2);
  }

  representativeTypeLabel(type?: string): string {
    const map: Record<string, string> = {
      CLASS_MONITOR: 'Lớp trưởng',
      SECRETARY: 'Bí thư chi đoàn',
      DEPUTY_SECRETARY: 'Phó bí thư chi đoàn',
      ASSISTANT: 'Ban cán sự',
      CLASS_REPRESENTATIVE: 'Đại diện lớp',
    };

    return type ? map[type] || type : 'Đại diện lớp';
  }

  isInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return Boolean(control.invalid && (control.dirty || control.touched));
  }

  addSchedule(): void {
    this.schedules.push(this.createScheduleGroup(this.schedules.length + 1));
  }

  removeSchedule(index: number): void {
    if (this.schedules.length <= 1) {
      this.alertService.warning('Lịch trình chi tiết cần ít nhất một buổi.');
      return;
    }

    this.schedules.removeAt(index);
    this.availableLocationsBySchedule.update((current) => {
      const next: Record<number, LocationResponse[]> = {};
      Object.values(current).forEach((locations, currentIndex) => {
        if (currentIndex < index) next[currentIndex] = locations;
        if (currentIndex > index) next[currentIndex - 1] = locations;
      });
      return next;
    });
  }

  onDetailedScheduleToggle(): void {
    if (this.form.controls.hasDetailedSchedule.value && this.schedules.length === 0) {
      this.addSchedule();
    }
  }

  onActivityTimeChanged(): void {
    this.form.patchValue({ locationId: null, location: '' });
    this.availableLocations.set([]);
  }

  onScheduleTimeChanged(index: number): void {
    const schedule = this.schedules.at(index);
    schedule.patchValue({ locationId: null, location: '' });
    this.availableLocationsBySchedule.update((current) => {
      const next = { ...current };
      delete next[index];
      return next;
    });
  }

  findAvailableLocations(): void {
    const value = this.form.getRawValue();
    const startTime = this.toApiDate(value.startDate);
    const endTime = this.toApiDate(value.endDate);

    if (!startTime || !endTime) {
      this.alertService.warning('Vui lòng nhập thời gian tổ chức trước khi tìm địa điểm.');
      return;
    }

    this.isFindingLocations.set(true);
    this.locationService
      .getAvailableLocations({
        startTime,
        endTime,
        minCapacity: value.maxParticipants ? Number(value.maxParticipants) : null,
      })
      .subscribe({
        next: (locations) => {
          this.isFindingLocations.set(false);
          this.availableLocations.set(locations);
          if (!locations.length) {
            this.alertService.warning('Không có địa điểm trống phù hợp trong khung thời gian này.');
          }
        },
        error: (error) => {
          this.isFindingLocations.set(false);
          this.alertService.error(error?.error?.message || 'Không thể tìm địa điểm trống.');
        },
      });
  }

  selectLocation(): void {
    const locationId = this.form.controls.locationId.value;
    const selected = this.availableLocations().find(
      (location) => location.id === Number(locationId),
    );

    if (!selected) return;

    this.form.patchValue({
      location: selected.name,
      scheduleLocation: selected.name,
    });
  }

  searchAvailableLocations(index: number): void {
    const schedule = this.schedules.at(index);
    const value = schedule.getRawValue();
    const startTime = this.toApiDate(value.startTime);
    const endTime = this.toApiDate(value.endTime);

    if (!startTime || !endTime) {
      this.alertService.warning('Vui lòng nhập thời gian của buổi trước khi tìm địa điểm.');
      return;
    }

    this.setScheduleLocationSearching(index, true);
    this.locationService
      .getAvailableLocations({
        startTime,
        endTime,
        minCapacity: this.form.controls.maxParticipants.value
          ? Number(this.form.controls.maxParticipants.value)
          : null,
      })
      .subscribe({
        next: (locations) => {
          this.setScheduleLocationSearching(index, false);
          this.availableLocationsBySchedule.update((current) => ({
            ...current,
            [index]: locations,
          }));
          if (!locations.length) {
            this.alertService.warning('Không có địa điểm trống phù hợp cho buổi này.');
          }
        },
        error: (error) => {
          this.setScheduleLocationSearching(index, false);
          this.alertService.error(error?.error?.message || 'Không thể tìm địa điểm trống.');
        },
      });
  }

  onScheduleLocationSelected(index: number): void {
    const schedule = this.schedules.at(index);
    const locationId = schedule.get('locationId')?.value;
    const selected = (this.availableLocationsBySchedule()[index] || []).find(
      (location) => location.id === Number(locationId),
    );

    if (!selected) return;

    schedule.patchValue({ location: selected.name });
  }

  triggerInput(id: string): void {
    document.getElementById(id)?.click();
  }

  onFileSelected(event: Event, type: 'cover' | 'thumbnail'): void {
    const file = (event.target as HTMLInputElement).files?.item(0);
    if (file) {
      this.handleFile(file, type);
    }
  }

  onFileDropped(event: DragEvent, type: 'cover' | 'thumbnail'): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.item(0);
    if (file) {
      this.handleFile(file, type);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  clearImage(type: 'cover' | 'thumbnail'): void {
    if (type === 'cover') {
      this.coverPreview.set(null);
      this.form.patchValue({ coverImage: null });
      return;
    }
    this.thumbnailPreview.set(null);
    this.form.patchValue({ thumbnail: null });
  }

  addBenefit(categoryId: number | null = null, point: number | null = null): void {
    this.benefits.push(this.createBenefitGroup(categoryId, point));
    this.openBenefitPicker.set(this.benefits.length - 1);
  }

  removeBenefit(index: number): void {
    const currentPicker = this.openBenefitPicker();
    this.benefits.removeAt(index);
    if (currentPicker === index) {
      this.openBenefitPicker.set(null);
    } else if (currentPicker !== null && currentPicker > index) {
      this.openBenefitPicker.set(currentPicker - 1);
    }
  }

  toggleBenefitPicker(index: number): void {
    this.openBenefitPicker.update((current) => (current === index ? null : index));
  }

  selectBenefitCategory(index: number, category: TrainingCategory): void {
    const benefit = this.benefits.at(index);
    benefit.patchValue({ categoryId: category.id });
    const currentPoint = Number(benefit.get('point')?.value || 0);
    if (!currentPoint || currentPoint > category.maxPoint) {
      benefit.patchValue({ point: Math.min(category.maxPoint, 5) });
    }
    this.openBenefitPicker.set(null);
  }

  availableBenefitCategories(index: number): TrainingCategory[] {
    const currentValue = Number(this.benefits.at(index)?.get('categoryId')?.value || 0);
    const selectedIds = new Set(
      this.benefits.controls
        .map((benefit, benefitIndex) =>
          benefitIndex === index ? null : Number(benefit.get('categoryId')?.value || 0),
        )
        .filter(Boolean),
    );

    return this.selectableCategories().filter(
      (category) => category.id === currentValue || !selectedIds.has(category.id),
    );
  }

  categoryLabel(categoryId: number | null | undefined): string {
    const category = this.categories().find((item) => item.id === Number(categoryId));
    if (!category) return 'Chưa chọn';
    return `${category.code || ''} ${category.name}`.trim();
  }

  private submitWithStatus(status: number): void {
    if (!this.permission()?.canCreateActivity) return;
    if (!this.canEditLoadedProposal()) {
      this.alertService.warning('Hoạt động đã được xử lý nên không thể chỉnh sửa từ màn đề xuất.');
      return;
    }

    if (status === 3 && !this.validateDraftMinimum()) {
      return;
    }

    if (status !== 3 && (!this.form.valid || !this.isStepCompleted(2))) {
      this.form.markAllAsTouched();
      this.markDetailedSchedulesTouched();
      this.alertService.error('Vui lòng hoàn thành các thông tin bắt buộc.');
      return;
    }

    const value = this.form.getRawValue();
    const scheduleStart = this.toApiDate(value.startDate);
    const scheduleEnd = this.toApiDate(value.endDate);
    const scheduleTitle = value.scheduleTitle || 'Buổi chính';
    const detailedSchedules = this.buildDetailedSchedules();
    const locationSummary = value.hasDetailedSchedule
      ? this.buildLocationSummary(detailedSchedules.schedules)
      : value.location || null;
    const fallbackSchedules =
      scheduleStart && scheduleEnd
        ? [
            {
              title: scheduleTitle,
              startTime: scheduleStart,
              endTime: scheduleEnd,
              location: value.location || null,
              locationId: value.locationId ? Number(value.locationId) : null,
            },
          ]
        : [];
    const fallbackBookings =
      value.locationId && scheduleStart && scheduleEnd
        ? [
            {
              title: scheduleTitle,
              locationId: Number(value.locationId),
              startTime: scheduleStart,
              endTime: scheduleEnd,
            },
          ]
        : [];

    const payload: ActivityProposalPayload = {
      title: value.title || '',
      description: value.description || null,
      content: value.content || null,
      location: locationSummary,
      maxParticipants: Number(value.maxParticipants || 0),
      isExternal: false,
      isFaculty: true,
      registrationStart: this.toApiDate(value.registrationStart),
      registrationEnd: this.toApiDate(value.registrationEnd),
      startDate: this.toApiDate(value.startDate),
      endDate: this.toApiDate(value.endDate),
      status,
      coverImage: null,
      thumbnail: null,
      benefits: this.buildBenefitRequests(),
      schedules: value.hasDetailedSchedule ? detailedSchedules.schedules : fallbackSchedules,
      locationBookings: value.hasDetailedSchedule
        ? detailedSchedules.locationBookings
        : fallbackBookings,
    };

    const coverVal = value.coverImage;
    const thumbnailVal = value.thumbnail;
    const uploadCover$ =
      coverVal instanceof File
        ? this.cloudinaryService.uploadImage(coverVal, 'activity')
        : of(typeof coverVal === 'string' ? coverVal : null);
    const uploadThumbnail$ =
      thumbnailVal instanceof File
        ? this.cloudinaryService.uploadImage(thumbnailVal, 'activity')
        : of(typeof thumbnailVal === 'string' ? thumbnailVal : null);

    this.isSaving.set(true);
    this.isUploading.set(true);
    forkJoin([uploadCover$, uploadThumbnail$])
      .pipe(
        switchMap(([coverImage, thumbnail]) => {
          const request = {
            ...payload,
            coverImage: coverImage || null,
            thumbnail: thumbnail || null,
          };
          const proposalId = this.proposalId();
          return proposalId
            ? this.proposalService.updateProposal(proposalId, request)
            : this.proposalService.createProposal(request);
        }),
        finalize(() => {
          this.isSaving.set(false);
          this.isUploading.set(false);
        }),
      )
      .subscribe({
        next: (activity) => {
          if (this.isEditMode() && activity && typeof activity === 'object' && 'status' in activity) {
            this.loadedProposalStatus.set(Number((activity as Activity).status));
          }
          this.alertService.success(
            this.isEditMode()
              ? 'Đã cập nhật đề xuất hoạt động.'
              : status === 3
                ? 'Đã lưu bản nháp.'
                : 'Đã gửi đề xuất hoạt động.',
          );
          if (this.isEditMode()) {
            this.router.navigate(['/activity-proposals']).then();
            return;
          }
          if (!this.isEditMode() && status !== 3) {
            this.resetCreateForm();
          }
        },
        error: (error) => {
          this.isSaving.set(false);
          this.alertService.error(error?.error?.message || 'Không thể gửi đề xuất hoạt động.');
        },
      });
  }

  private createScheduleGroup(
    order: number,
    value?: Partial<{
      title: string;
      startTime: string;
      endTime: string;
      location: string;
      locationId: number | null;
    }>,
  ) {
    return this.fb.group({
      title: [value?.title || `Buổi ${order}`],
      startTime: [value?.startTime || ''],
      endTime: [value?.endTime || ''],
      location: [value?.location || ''],
      locationId: [value?.locationId ?? null],
    });
  }

  private hasValidDetailedSchedules(): boolean {
    return (
      this.schedules.length > 0 &&
      this.schedules.controls.every((schedule) => {
        const value = schedule.getRawValue();
        return Boolean(value.title && value.startTime && value.endTime && value.locationId);
      })
    );
  }

  private markDetailedSchedulesTouched(): void {
    this.schedules.controls.forEach((schedule) => {
      schedule.get('title')?.markAsTouched();
      schedule.get('startTime')?.markAsTouched();
      schedule.get('endTime')?.markAsTouched();
      schedule.get('locationId')?.markAsTouched();
    });
  }

  private buildDetailedSchedules(): {
    schedules: ActivityProposalPayload['schedules'];
    locationBookings: NonNullable<ActivityProposalPayload['locationBookings']>;
  } {
    const schedules = this.schedules.getRawValue();
    return schedules.reduce(
      (result, schedule) => {
        const startTime = this.toApiDate(schedule.startTime);
        const endTime = this.toApiDate(schedule.endTime);
        if (!schedule.title || !startTime || !endTime) return result;

        result.schedules.push({
          title: schedule.title,
          startTime,
          endTime,
          location: schedule.location || this.form.controls.location.value || null,
          locationId: schedule.locationId ? Number(schedule.locationId) : null,
        });

        if (schedule.locationId) {
          result.locationBookings.push({
            title: schedule.title,
            locationId: Number(schedule.locationId),
            startTime,
            endTime,
          });
        }

        return result;
      },
      {
        schedules: [] as ActivityProposalPayload['schedules'],
        locationBookings: [] as NonNullable<ActivityProposalPayload['locationBookings']>,
      },
    );
  }

  private buildLocationSummary(schedules: ActivityProposalPayload['schedules']): string | null {
    const locations = Array.from(
      new Set(schedules.map((schedule) => schedule.location).filter(Boolean)),
    ) as string[];

    if (!locations.length) return null;
    if (locations.length === 1) return locations[0];
    return `${locations[0]} và ${locations.length - 1} địa điểm khác`;
  }

  private setScheduleLocationSearching(index: number, isSearching: boolean): void {
    this.isFindingScheduleLocations.update((current) => ({ ...current, [index]: isSearching }));
  }

  private loadTrainingCategories(): void {
    this.proposalService.getTrainingCategories(true).subscribe({
      next: (categories) => {
        this.categoryTree.set(categories);
        this.categories.set(this.flattenCategories(categories));
      },
      error: () => {
        this.categoryTree.set([]);
        this.categories.set([]);
      },
    });
  }

  private createBenefitGroup(categoryId: number | null = null, point: number | null = null) {
    return this.fb.group({
      categoryId: [categoryId],
      point: [point, [Validators.min(0)]],
      type: [1],
    });
  }

  private buildBenefitRequests(): NonNullable<ActivityProposalPayload['benefits']> {
    return this.benefits
      .getRawValue()
      .filter(
        (benefit) => benefit.categoryId && benefit.point !== null && benefit.point !== undefined,
      )
      .map((benefit) => ({
        categoryId: Number(benefit.categoryId),
        point: Number(benefit.point),
        type: Number(benefit.type || 1),
      }));
  }

  private flattenCategories(categories: TrainingCategory[]): TrainingCategory[] {
    return categories.flatMap((category) => [
      category,
      ...this.flattenCategories(category.children || []),
    ]);
  }

  private handleFile(file: File, type: 'cover' | 'thumbnail'): void {
    if (!file.type.startsWith('image/')) {
      this.alertService.warning('Vui lòng chọn tệp hình ảnh.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const preview = reader.result as string;
      if (type === 'cover') {
        this.coverPreview.set(preview);
        this.form.patchValue({ coverImage: file });
        return;
      }
      this.thumbnailPreview.set(preview);
      this.form.patchValue({ thumbnail: file });
    };
    reader.readAsDataURL(file);
  }

  private scrollWizardToTop(): void {
    document
      .getElementById('student-activity-proposal')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private toApiDate(value?: string | null): string | null {
    if (!value) return null;
    return value.length === 16 ? `${value}:00` : value;
  }

  private toInputDate(value?: string | null): string {
    if (!value) return '';
    return value.length >= 16 ? value.slice(0, 16) : value;
  }

  private resetCreateForm(): void {
    this.form.reset({
      maxParticipants: 30,
      scheduleTitle: 'Buổi chính',
      locationId: null,
      hasDetailedSchedule: false,
      coverImage: null,
      thumbnail: null,
    });
    this.coverPreview.set(null);
    this.thumbnailPreview.set(null);
    this.benefits.clear();
    this.schedules.clear();
    this.schedules.push(this.createScheduleGroup(1));
    this.availableLocations.set([]);
    this.availableLocationsBySchedule.set({});
    this.loadedProposalStatus.set(null);
    this.currentStep.set(1);
  }

  private validateCurrentStep(): boolean {
    if (this.currentStep() === 1) {
      this.form.controls.title.markAsTouched();
      this.form.controls.description.markAsTouched();
      this.form.controls.content.markAsTouched();
      if (!this.isStepCompleted(1)) {
        this.alertService.error('Vui lòng nhập tên, mô tả ngắn và nội dung chi tiết.');
        return false;
      }
    }

    if (this.currentStep() === 2) {
      const controls = [
        this.form.controls.registrationStart,
        this.form.controls.registrationEnd,
        this.form.controls.startDate,
        this.form.controls.endDate,
        this.form.controls.maxParticipants,
      ];
      controls.forEach((control) => control.markAsTouched());
      this.markDetailedSchedulesTouched();

      if (!this.isStepCompleted(2)) {
        this.alertService.error('Vui lòng hoàn thành thời gian, địa điểm và lịch trình.');
        return false;
      }

      if (!this.validateActivityTimeRange()) {
        return false;
      }
    }

    return true;
  }

  private validateDraftMinimum(): boolean {
    const stepOneControls = [
      this.form.controls.title,
      this.form.controls.description,
      this.form.controls.content,
    ];
    const stepTwoControls = [
      this.form.controls.registrationStart,
      this.form.controls.registrationEnd,
      this.form.controls.startDate,
      this.form.controls.endDate,
      this.form.controls.maxParticipants,
    ];

    stepOneControls.forEach((control) => control.markAsTouched());
    stepTwoControls.forEach((control) => control.markAsTouched());

    if (stepOneControls.some((control) => control.invalid)) {
      this.currentStep.set(1);
      this.scrollWizardToTop();
      this.alertService.error('Bản nháp cần có tên, mô tả ngắn và nội dung chi tiết.');
      return false;
    }

    if (stepTwoControls.some((control) => control.invalid)) {
      this.currentStep.set(2);
      this.scrollWizardToTop();
      this.alertService.error('Bản nháp cần có thời gian đăng ký, thời gian tổ chức và sức chứa.');
      return false;
    }

    return this.validateActivityTimeRange();
  }

  private validateActivityTimeRange(): boolean {
    const value = this.form.getRawValue();
    const regStart = new Date(value.registrationStart || '');
    const regEnd = new Date(value.registrationEnd || '');
    const actStart = new Date(value.startDate || '');
    const actEnd = new Date(value.endDate || '');

    if (regEnd <= regStart) {
      this.currentStep.set(2);
      this.scrollWizardToTop();
      this.alertService.error('Thời gian đóng đăng ký phải sau thời gian mở đăng ký.');
      return false;
    }
    if (actStart <= regEnd) {
      this.currentStep.set(2);
      this.scrollWizardToTop();
      this.alertService.error('Thời gian tổ chức phải sau khi đóng đăng ký.');
      return false;
    }
    if (actEnd <= actStart) {
      this.currentStep.set(2);
      this.scrollWizardToTop();
      this.alertService.error('Thời gian kết thúc phải sau thời gian bắt đầu.');
      return false;
    }

    return true;
  }
}
