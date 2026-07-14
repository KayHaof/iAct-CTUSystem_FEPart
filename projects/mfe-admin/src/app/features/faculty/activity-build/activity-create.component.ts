import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of, Observable } from 'rxjs';
import { switchMap, finalize } from 'rxjs/operators';

import { AlertService } from '@my-mfe/ui';
import { UserService } from '@my-mfe/auth';
import { ApiResponse, UserInfo } from '@my-mfe/interface';
import { CloudinaryService } from '@my-mfe/data-access-media';
import { ActivityService } from '../services/activity.service';

import { CategoryService } from '../services/category.service';
import {
  LocationResponse,
  LocationService,
} from '../../common/locations/location.service';
import {
  Activity,
  ActivityRequest,
  ActivityScheduleDto,
  BenefitDto,
  BenefitFormValue,
  OrganizerOption,
} from '../../../shared/models/activity.model';
import { CategoryResponse } from '../../../shared/models/category.model';

type ActivityWizardStep = 1 | 2 | 3 | 4;

interface WizardStep {
  id: ActivityWizardStep;
  label: string;
  description: string;
  icon: string;
}

interface CategoryOption {
  category: CategoryResponse;
  depth: number;
  selectable: boolean;
}

@Component({
  selector: 'app-activity-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './activity-create.component.html',
  styleUrls: ['./activity-create.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private location = inject(Location);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private alertService = inject(AlertService);
  private activityService = inject(ActivityService);
  private cloudinaryService = inject(CloudinaryService);
  private userService = inject(UserService);
  private categoryService = inject(CategoryService);
  private locationService = inject(LocationService);
  http = inject(HttpClient);

  isEditMode = signal<boolean>(false);
  activityId = signal<number | null>(null);
  isLoadingData = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  currentStatus = signal<number>(0);
  currentStep = signal<ActivityWizardStep>(1);
  highestVisitedStep = signal<ActivityWizardStep>(1);
  canSave = computed(
    () => !this.isEditMode() || this.currentStatus() === 0 || this.currentStatus() === 3,
  );
  stepProgress = computed(() => this.currentStep() * 25);

  readonly wizardSteps: WizardStep[] = [
    {
      id: 1,
      label: 'Thông tin bài đăng',
      description: 'Nội dung, hình ảnh và người phụ trách',
      icon: 'bi-file-earmark-text',
    },
    {
      id: 2,
      label: 'Thời gian và tổ chức',
      description: 'Lịch trình, địa điểm và phạm vi',
      icon: 'bi-calendar-event',
    },
    {
      id: 3,
      label: 'Quyền lợi',
      description: 'Điểm rèn luyện và chứng nhận',
      icon: 'bi-award',
    },
    {
      id: 4,
      label: 'Xác nhận',
      description: 'Kiểm tra trước khi đăng bài',
      icon: 'bi-check2-circle',
    },
  ];

  coverPreview = signal<string | null>(null);
  thumbPreview = signal<string | null>(null);
  isUploading = signal<boolean>(false);

  selectedOrganizer = signal<OrganizerOption | null>(null);
  isSearchingOrganizer = signal<boolean>(false);
  searchOrganizerError = signal<string | null>(null);
  isGeneratingAI = signal<boolean>(false);
  isSearchingLocations = signal<Record<number, boolean>>({});
  availableLocationsBySchedule = signal<Record<number, LocationResponse[]>>({});

  categoryTree = signal<CategoryResponse[]>([]);
  categories = signal<CategoryResponse[]>([]);
  rootCategories = computed(() => {
    const romanOrder = ['I', 'II', 'III', 'IV', 'V'];
    return this.categoryTree()
      .filter((category) => category.parentId === null)
      .filter((category) => romanOrder.includes(this.normalizeRomanCode(category.code)))
      .sort(
        (first, second) =>
          romanOrder.indexOf(this.normalizeRomanCode(first.code)) -
          romanOrder.indexOf(this.normalizeRomanCode(second.code)),
      );
  });
  hasCompleteRootCategories = computed(
    () =>
      new Set(this.rootCategories().map((category) => this.normalizeRomanCode(category.code)))
        .size === 5,
  );

  activityForm: FormGroup = this.fb.group({
    title: ['', [Validators.required]],
    description: [''],
    content: [''],
    source_link: [''],
    is_external: [false],
    is_faculty: [false],
    registration_start: ['', Validators.required],
    registration_end: ['', Validators.required],
    start_date: ['', Validators.required],
    end_date: ['', Validators.required],
    location: ['', Validators.required],
    max_participants: [null, Validators.required],
    cover_image: [null],
    thumbnail: [null],
    benefits: this.fb.array([]),
    schedules: this.fb.array([]),
  });

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode.set(true);
      this.activityId.set(Number(idParam));
      this.loadActivityData(idParam);
    }

    this.fetchCategories();
  }

  fetchCategories() {
    this.categoryService.getAllCategoriesTree(true).subscribe({
      next: (res) => {
        if (res.code === 200 && res.data) {
          this.categoryTree.set(res.data);
          this.categories.set(this.flattenCategories(res.data));
          this.hydrateBenefitSelections();
        }
      },
      error: (err) => console.error('Lỗi khi tải danh mục tiêu chí:', err),
    });
  }

  loadActivityData(id: string) {
    this.isLoadingData.set(true);

    this.activityService
      .getActivityById(id)
      .pipe(finalize(() => this.isLoadingData.set(false)))
      .subscribe({
        next: (act: Activity) => {
          this.currentStatus.set(act.status || 0);

          this.activityForm.patchValue({
            title: act.title,
            description: act.description,
            content: act.content,
            source_link: act.sourceLink,
            is_external: act.isExternal,
            is_faculty: act.isFaculty,
            registration_start: this.formatDateForInput(act.registrationStart),
            registration_end: this.formatDateForInput(act.registrationEnd),
            start_date: this.formatDateForInput(act.startDate),
            end_date: this.formatDateForInput(act.endDate),
            location: act.location,
            max_participants: act.maxParticipants,
            cover_image: act.coverImage,
            thumbnail: act.thumbnail,
          });

          if (act.benefits && act.benefits.length > 0) {
            this.benefits.clear();
            act.benefits.forEach((benefit: BenefitDto) => {
              this.benefits.push(this.createBenefitGroup(benefit));
            });
            this.hydrateBenefitSelections();
          }

          if (act.schedules && act.schedules.length > 0) {
            this.schedules.clear();
            act.schedules.forEach((schedule: ActivityScheduleDto) => {
      const scheduleGroup = this.fb.group({
                title: [schedule.title, Validators.required],
                start_time: [this.formatDateForInput(schedule.startTime), Validators.required],
                end_time: [this.formatDateForInput(schedule.endTime), Validators.required],
                location: [schedule.location],
                location_id: [schedule.locationId || this.findBookingLocationId(act, schedule)],
              });
              this.schedules.push(scheduleGroup);
            });
          }

          if (act.coverImage) this.coverPreview.set(act.coverImage);
          if (act.thumbnail) this.thumbPreview.set(act.thumbnail);

          if (act.organizer?.id) {
            const organizerFullName = act.organizer.fullName || 'Người phụ trách';
            this.selectedOrganizer.set({
              id: act.organizer.id,
              username: '...',
              email: 'Đang lấy thông tin chi tiết...',
              fullName: organizerFullName,
              avatarUrl: null,
            });

            this.userService.getUserById(act.organizer.id).subscribe({
              next: (response: ApiResponse<UserInfo>) => {
                const user = response.data;
                if (user) {
                  this.selectedOrganizer.update((prev) => ({
                    ...(prev || { id: user.id }),
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName || user.username,
                    avatarUrl: user.avatarUrl || null,
                  }));
                }
              },
              error: (err: HttpErrorResponse) =>
                console.error('Không thể lấy chi tiết người dùng:', err),
            });
          }
        },
        error: (err: HttpErrorResponse) => {
          console.error('Lỗi khi tải hoạt động:', err);
          this.alertService.error('Không tìm thấy hoạt động này.');
          this.goBack();
        },
      });
  }

  formatDateForInput(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    return dateStr.substring(0, 16);
  }

  get benefits() {
    return this.activityForm.get('benefits') as FormArray;
  }
  addBenefit() {
    if (!this.hasCompleteRootCategories()) {
      this.alertService.error('Hệ thống chưa cấu hình đầy đủ 5 nhóm tiêu chí I, II, III, IV và V.');
      return;
    }
    this.benefits.push(this.createBenefitGroup());
  }
  removeBenefit(index: number) {
    this.benefits.removeAt(index);
  }

  onRootCategoryChange(index: number): void {
    const benefit = this.benefits.at(index);
    const rootCategoryId = benefit.get('root_category_id')?.value as number | null;
    const categoryControl = benefit.get('category_id');
    const pointControl = benefit.get('point');

    categoryControl?.reset(null);
    pointControl?.reset(null);
    pointControl?.disable();
    if (rootCategoryId) {
      categoryControl?.enable();
    } else {
      categoryControl?.disable();
    }
    this.applyPointValidators(index, null);
  }

  onBenefitCategoryChange(index: number): void {
    const benefit = this.benefits.at(index);
    const categoryId = benefit.get('category_id')?.value as number | null;
    const pointControl = benefit.get('point');
    pointControl?.reset(null);
    if (categoryId) {
      pointControl?.enable();
    } else {
      pointControl?.disable();
    }
    this.applyPointValidators(index, categoryId);
  }

  getCategoryOptions(rootCategoryId: number | null | undefined): CategoryOption[] {
    if (!rootCategoryId) return [];
    const root = this.rootCategories().find((category) => category.id === rootCategoryId);
    if (!root) return [];

    const options: CategoryOption[] = [];
    const appendChildren = (nodes: CategoryResponse[] | undefined, depth: number): void => {
      for (const category of nodes || []) {
        const selectable = !category.children?.length;
        options.push({ category, depth, selectable });
        appendChildren(category.children, depth + 1);
      }
    };
    appendChildren(root.children, 0);
    return options;
  }

  getSelectedCategoryMaxPoint(index: number): number | null {
    const categoryId = this.benefits.at(index).get('category_id')?.value as number | null;
    return this.findCategory(categoryId)?.maxPoint ?? null;
  }

  getCategoryPathLabel(categoryId: number | null | undefined): string {
    const path = this.findCategoryPath(categoryId);
    if (!path.length) return 'Chưa chọn';
    return path.map((category) => `${category.code || ''} ${category.name}`.trim()).join(' > ');
  }

  getCategoryOptionLabel(option: CategoryOption): string {
    const prefix = option.depth > 0 ? `${'— '.repeat(option.depth)}` : '';
    const code = option.category.code ? `[${option.category.code}] ` : '';
    const maxPoint = option.selectable ? ` - tối đa ${option.category.maxPoint} điểm` : '';
    return `${prefix}${code}${option.category.name}${maxPoint}`;
  }

  getRootCategoryLabel(category: CategoryResponse): string {
    return `${this.normalizeRomanCode(category.code)}. ${category.name}`;
  }

  get schedules() {
    return this.activityForm.get('schedules') as FormArray;
  }
  addSchedule() {
    this.schedules.push(
      this.fb.group({
        title: ['', Validators.required],
        start_time: ['', Validators.required],
        end_time: ['', Validators.required],
        location: [''],
        location_id: [null],
      }),
    );
  }
  removeSchedule(index: number) {
    this.schedules.removeAt(index);
    this.availableLocationsBySchedule.update((current) => {
      const next = { ...current };
      delete next[index];
      return next;
    });
  }

  searchAvailableLocations(index: number): void {
    const schedule = this.schedules.at(index);
    const startTime = schedule.get('start_time')?.value;
    const endTime = schedule.get('end_time')?.value;
    const maxParticipants = this.activityForm.get('max_participants')?.value;

    if (!startTime || !endTime) {
      this.alertService.warning('Vui lòng nhập thời gian bắt đầu và kết thúc của buổi trước.');
      return;
    }

    this.isSearchingLocations.update((current) => ({ ...current, [index]: true }));
    this.locationService
      .getAvailableLocations({
        startTime: this.formatDateTime(startTime),
        endTime: this.formatDateTime(endTime),
        minCapacity: maxParticipants ? Number(maxParticipants) : null,
      })
      .pipe(
        finalize(() =>
          this.isSearchingLocations.update((current) => ({ ...current, [index]: false })),
        ),
      )
      .subscribe({
        next: (locations) => {
          this.availableLocationsBySchedule.update((current) => ({ ...current, [index]: locations }));
          if (!locations.length) {
            this.alertService.warning('Không có địa điểm trống phù hợp trong khung thời gian này.');
          }
        },
        error: (error: HttpErrorResponse) =>
          this.alertService.error(error.error?.message || 'Không thể tìm địa điểm trống.'),
      });
  }

  onScheduleLocationSelected(index: number): void {
    const schedule = this.schedules.at(index);
    const locationId = Number(schedule.get('location_id')?.value);
    const selectedLocation = this.availableLocationsBySchedule()[index]?.find(
      (location) => location.id === locationId,
    );
    if (!selectedLocation) return;

    schedule.patchValue({ location: selectedLocation.name });
    this.syncMainLocationFromSchedules();
  }

  formatDateTime = (dtStr: string): string => {
    if (!dtStr) return '';
    const str = String(dtStr);
    return str.length === 16 ? `${str}:00` : str;
  };

  triggerInput(id: string) {
    document.getElementById(id)?.click();
  }

  onFileSelected(event: Event, type: 'cover' | 'thumbnail') {
    const file = (event.target as HTMLInputElement).files?.item(0);
    if (file) this.handleFile(file, type);
  }

  onFileDropped(event: DragEvent, type: 'cover' | 'thumbnail') {
    event.preventDefault();
    const file = event.dataTransfer?.files?.item(0);
    if (file) this.handleFile(file, type);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  private handleFile(file: File, type: 'cover' | 'thumbnail') {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (type === 'cover') {
        this.coverPreview.set(result);
        this.activityForm.patchValue({ cover_image: file });
      } else {
        this.thumbPreview.set(result);
        this.activityForm.patchValue({ thumbnail: file });
      }
    };
    reader.readAsDataURL(file);
  }

  goBack() {
    this.location.back();
  }

  searchOrganizer(email: string) {
    if (!email || email.trim() === '') {
      this.searchOrganizerError.set('Vui lòng nhập Email.');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      this.searchOrganizerError.set('Định dạng Email không hợp lệ.');
      return;
    }

    this.isSearchingOrganizer.set(true);
    this.searchOrganizerError.set(null);

    this.userService
      .getUserByEmail(email.trim())
      .pipe(finalize(() => this.isSearchingOrganizer.set(false)))
      .subscribe({
        next: (response: ApiResponse<UserInfo>) => {
          const user = response.data;
          if (!user) {
            this.searchOrganizerError.set('Email này không tồn tại trong hệ thống.');
            return;
          }
          this.selectedOrganizer.set({
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.fullName || user.username,
            avatarUrl: user.avatarUrl || null,
          });
        },
        error: (err: HttpErrorResponse) => {
          this.searchOrganizerError.set(err.error?.message || 'Không tìm thấy Email này.');
        },
      });
  }

  removeOrganizer() {
    this.selectedOrganizer.set(null);
  }

  goToStep(step: ActivityWizardStep): void {
    if (step > this.highestVisitedStep()) return;
    this.currentStep.set(step);
    this.scrollWizardToTop();
  }

  goToPreviousStep(): void {
    const previousStep = Math.max(1, this.currentStep() - 1) as ActivityWizardStep;
    this.currentStep.set(previousStep);
    this.scrollWizardToTop();
  }

  goToNextStep(): void {
    const step = this.currentStep();
    if (step >= 4 || !this.validateStep(step)) return;

    const nextStep = (step + 1) as ActivityWizardStep;
    this.currentStep.set(nextStep);
    this.highestVisitedStep.update((visited) => Math.max(visited, nextStep) as ActivityWizardStep);
    this.scrollWizardToTop();
  }

  isStepCompleted(step: ActivityWizardStep): boolean {
    return step < this.highestVisitedStep();
  }

  canNavigateToStep(step: ActivityWizardStep): boolean {
    return step <= this.highestVisitedStep();
  }

  formatDisplayDate(value: string | null | undefined): string {
    if (!value) return 'Chưa cung cấp';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Chưa cung cấp';
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }

  getCategoryName(categoryId: number | null | undefined): string {
    return this.categories().find((category) => category.id === categoryId)?.name || 'Chưa chọn';
  }

  getBenefitTypeLabel(type: number | null | undefined): string {
    return type === 2 ? 'Cấp giấy chứng nhận' : 'Cộng điểm rèn luyện';
  }

  getActivityScopeLabel(): string {
    const data = this.activityForm.getRawValue();
    if (data.is_external) return 'Hoạt động ngoài trường';
    return data.is_faculty ? 'Cấp Khoa' : 'Cấp Trường';
  }

  private normalizeRomanCode(code: string | null | undefined): string {
    return (code || '')
      .replaceAll('[', '')
      .replaceAll(']', '')
      .replaceAll('.', '')
      .replace(/\s/g, '')
      .toUpperCase();
  }

  private flattenCategories(nodes: CategoryResponse[]): CategoryResponse[] {
    return nodes.flatMap((category) => [
      category,
      ...this.flattenCategories(category.children || []),
    ]);
  }

  private findCategory(categoryId: number | null | undefined): CategoryResponse | null {
    if (!categoryId) return null;
    return this.categories().find((category) => category.id === categoryId) || null;
  }

  private findCategoryPath(
    categoryId: number | null | undefined,
    nodes = this.categoryTree(),
    ancestors: CategoryResponse[] = [],
  ): CategoryResponse[] {
    if (!categoryId) return [];
    for (const category of nodes) {
      const path = [...ancestors, category];
      if (category.id === categoryId) return path;
      const childPath = this.findCategoryPath(categoryId, category.children || [], path);
      if (childPath.length) return childPath;
    }
    return [];
  }

  private applyPointValidators(index: number, categoryId: number | null): void {
    const pointControl = this.benefits.at(index).get('point');
    const category = this.findCategory(categoryId);
    const validators = [Validators.required, Validators.min(0)];
    if (category) validators.push(Validators.max(category.maxPoint));
    pointControl?.setValidators(validators);
    pointControl?.updateValueAndValidity();
  }

  private createBenefitGroup(benefit?: BenefitDto): FormGroup {
    return this.fb.group({
      root_category_id: [null, Validators.required],
      category_id: [{ value: benefit?.categoryId ?? null, disabled: true }, Validators.required],
      point: [
        { value: benefit?.point ?? null, disabled: true },
        [Validators.required, Validators.min(0)],
      ],
      type: [benefit?.type || 1, Validators.required],
    });
  }

  private hydrateBenefitSelections(): void {
    if (!this.categoryTree().length) return;
    this.benefits.controls.forEach((benefit, index) => {
      const categoryId = benefit.get('category_id')?.value as number | null;
      if (!categoryId) return;
      const path = this.findCategoryPath(categoryId);
      const rootCategory = path[0];
      if (!rootCategory) {
        benefit.get('category_id')?.disable();
        benefit.get('point')?.disable();
        return;
      }
      benefit.get('root_category_id')?.setValue(rootCategory?.id || null, { emitEvent: false });
      benefit.get('category_id')?.enable({ emitEvent: false });
      benefit.get('point')?.enable({ emitEvent: false });
      this.applyPointValidators(index, categoryId);
    });
  }

  private scrollWizardToTop(): void {
    document
      .getElementById('activity-wizard')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private validateStep(step: ActivityWizardStep, showAlert = true): boolean {
    if (step === 1) return this.validateBasicInformation(showAlert);
    if (step === 2) return this.validateScheduleAndOrganization(showAlert);
    if (step === 3) return this.validateBenefits(showAlert);
    return true;
  }

  private validateBasicInformation(showAlert: boolean): boolean {
    const titleControl = this.activityForm.get('title');
    titleControl?.markAsTouched();

    if (titleControl?.invalid) {
      if (showAlert) this.alertService.error('Vui lòng nhập tên hoạt động.');
      return false;
    }

    if (!this.selectedOrganizer()) {
      if (showAlert) this.alertService.error('Vui lòng chọn người phụ trách hoạt động.');
      return false;
    }

    return true;
  }

  private validateScheduleAndOrganization(showAlert: boolean): boolean {
    const requiredControls = [
      'registration_start',
      'registration_end',
      'start_date',
      'end_date',
      'location',
      'max_participants',
    ];
    const hasInvalidControl = requiredControls.some((controlName) => {
      const control = this.activityForm.get(controlName);
      control?.markAsTouched();
      return control?.invalid;
    });

    this.schedules.markAllAsTouched();
    if (hasInvalidControl || this.schedules.invalid) {
      if (showAlert) this.alertService.error('Vui lòng hoàn thành thời gian và thông tin tổ chức.');
      return false;
    }

    const data = this.activityForm.getRawValue();
    const regStart = new Date(data.registration_start);
    const regEnd = new Date(data.registration_end);
    const actStart = new Date(data.start_date);
    const actEnd = new Date(data.end_date);

    if (regEnd <= regStart) {
      if (showAlert) {
        this.alertService.error('Thời gian đóng đăng ký phải sau thời gian mở đăng ký.');
      }
      return false;
    }
    if (actStart <= regEnd) {
      if (showAlert) this.alertService.error('Thời gian tổ chức phải sau khi đóng đăng ký.');
      return false;
    }
    if (actEnd <= actStart) {
      if (showAlert) this.alertService.error('Thời gian kết thúc phải sau thời gian bắt đầu.');
      return false;
    }

    for (const schedule of data.schedules || []) {
      const scheduleStart = new Date(schedule.start_time);
      const scheduleEnd = new Date(schedule.end_time);

      if (scheduleEnd <= scheduleStart) {
        if (showAlert) {
          this.alertService.error(
            `Lỗi tại [${schedule.title}]: Thời gian kết thúc phải sau thời gian bắt đầu.`,
          );
        }
        return false;
      }
      if (scheduleStart < actStart || scheduleEnd > actEnd) {
        if (showAlert) {
          this.alertService.error(
            `Lỗi tại [${schedule.title}]: Thời gian buổi này phải nằm trong thời gian tổ chức chung.`,
          );
        }
        return false;
      }
    }

    return true;
  }

  private validateBenefits(showAlert: boolean): boolean {
    this.benefits.markAllAsTouched();
    if (this.benefits.invalid) {
      if (showAlert) this.alertService.error('Vui lòng hoàn thành các quyền lợi đã thêm.');
      return false;
    }

    for (const benefit of this.benefits.controls) {
      const rootCategoryId = benefit.get('root_category_id')?.value as number | null;
      const categoryId = benefit.get('category_id')?.value as number | null;
      const point = Number(benefit.get('point')?.value);
      const path = this.findCategoryPath(categoryId);
      const category = path.at(-1);

      if (!category || category.children?.length || path[0]?.id !== rootCategoryId) {
        if (showAlert) this.alertService.error('Tiêu chí điểm rèn luyện không hợp lệ.');
        return false;
      }
      if (point < 0 || point > category.maxPoint) {
        if (showAlert) {
          this.alertService.error(
            `Điểm của tiêu chí ${category.name} phải từ 0 đến ${category.maxPoint}.`,
          );
        }
        return false;
      }
    }
    return true;
  }

  onSubmit(requestedStatus: number) {
    if (this.isSaving()) return;
    if (!this.canSave()) {
      this.alertService.warning('Hoạt động ở trạng thái hiện tại không thể chỉnh sửa.');
      return;
    }

    const data = this.activityForm.getRawValue();
    const currentOrganizer = this.selectedOrganizer();
    const finalStatus = requestedStatus;

    if (finalStatus !== 3) {
      for (const step of [1, 2, 3] as ActivityWizardStep[]) {
        if (!this.validateStep(step)) {
          this.currentStep.set(step);
          this.highestVisitedStep.update(
            (visited) => Math.max(visited, step) as ActivityWizardStep,
          );
          this.scrollWizardToTop();
          return;
        }
      }
    } else {
      if (!data.title || data.title.trim() === '') {
        this.activityForm.get('title')?.markAsTouched();
        this.alertService.error('Bản nháp cần có ít nhất tên hoạt động.');
        return;
      }
    }

    this.isUploading.set(true);
    this.isSaving.set(true);

    const coverVal = data.cover_image;
    const thumbVal = data.thumbnail;

    const uploadCover$: Observable<string | null> =
      coverVal instanceof File
        ? this.cloudinaryService.uploadImage(coverVal, 'activity')
        : of(typeof coverVal === 'string' ? coverVal : null);

    const uploadThumb$: Observable<string | null> =
      thumbVal instanceof File
        ? this.cloudinaryService.uploadImage(thumbVal, 'activity')
        : of(typeof thumbVal === 'string' ? thumbVal : null);

    const wasEditMode = this.isEditMode();
    const wasDraft = this.currentStatus() === 3;
    const successMsg =
      finalStatus === 3
        ? wasEditMode
          ? 'Đã lưu lại bản nháp.'
          : 'Đã lưu bản nháp.'
        : wasEditMode && !wasDraft
          ? 'Đã lưu thay đổi.'
          : 'Đã gửi hoạt động để xét duyệt.';

    forkJoin([uploadCover$, uploadThumb$])
      .pipe(
        switchMap(([coverUrl, thumbUrl]) => {
          const mappedBenefits: BenefitDto[] = (data.benefits as BenefitFormValue[]).map((b) => ({
            categoryId: b.category_id ?? undefined,
            point: b.point ?? undefined,
            type: b.type ?? undefined,
          }));

          const mappedSchedules: ActivityScheduleDto[] = (data.schedules || []).map(
            (s: {
              title: string;
              start_time: string;
              end_time: string;
              location?: string;
              location_id?: number | null;
            }) => ({
              title: s.title,
              startTime: this.formatDateTime(s.start_time),
              endTime: this.formatDateTime(s.end_time),
              location: s.location || null,
              locationId: s.location_id ? Number(s.location_id) : null,
            }),
          );

          const locationBookings = (data.schedules || [])
            .filter((s: { location_id?: number | null }) => Boolean(s.location_id))
            .map(
              (s: {
                title: string;
                start_time: string;
                end_time: string;
                location_id?: number | null;
              }) => ({
                title: s.title,
                locationId: Number(s.location_id),
                startTime: this.formatDateTime(s.start_time),
                endTime: this.formatDateTime(s.end_time),
              }),
            );

          const payload: ActivityRequest = {
            title: data.title,
            description: data.description || null,
            content: data.content || null,
            location: data.location || null,
            maxParticipants: data.max_participants ? Number(data.max_participants) : null,
            organizerId: currentOrganizer ? currentOrganizer.id : null,
            sourceLink: data.source_link || null,
            isExternal: Boolean(data.is_external),
            isFaculty: !data.is_external && Boolean(data.is_faculty),

            registrationStart: data.registration_start
              ? this.formatDateTime(data.registration_start)
              : null,
            registrationEnd: data.registration_end
              ? this.formatDateTime(data.registration_end)
              : null,
            startDate: data.start_date ? this.formatDateTime(data.start_date) : null,
            endDate: data.end_date ? this.formatDateTime(data.end_date) : null,

            status: finalStatus,
            coverImage: coverUrl || null,
            thumbnail: thumbUrl || null,
            benefits: mappedBenefits,
            schedules: mappedSchedules,
            locationBookings,
          };

          const currentId = this.activityId();

          if (this.isEditMode() && currentId) {
            return this.activityService.updateActivity(currentId, payload);
          } else {
            return this.activityService.createActivity(payload);
          }
        }),
        this.alertService.observe(successMsg, 'Không thể lưu hoạt động. Vui lòng thử lại.'),
        finalize(() => {
          this.isUploading.set(false);
          this.isSaving.set(false);
        }),
      )
      .subscribe({
        next: (savedActivity: Activity) => {
          this.currentStatus.set(finalStatus);

          if (finalStatus === 3) {
            this.activityForm.markAsPristine();
            this.activityId.set(savedActivity.id);
            this.isEditMode.set(true);
            void this.router.navigate(['/admin/org/activities/edit', savedActivity.id], {
              replaceUrl: true,
            });
            return;
          }

          setTimeout(() => this.goBack(), 1000);
        },
        error: (err: HttpErrorResponse) => console.error('Chi tiết lỗi lưu hoạt động:', err),
      });
  }

  private findBookingLocationId(activity: Activity, schedule: ActivityScheduleDto): number | null {
    const matchedBooking = activity.locationBookings?.find(
      (booking) =>
        this.formatDateForInput(booking.startTime) === this.formatDateForInput(schedule.startTime) &&
        this.formatDateForInput(booking.endTime) === this.formatDateForInput(schedule.endTime),
    );
    return matchedBooking?.locationId || null;
  }

  private syncMainLocationFromSchedules(): void {
    const selectedNames = this.schedules.controls
      .map((schedule) => schedule.get('location')?.value)
      .filter(Boolean);
    if (selectedNames.length) {
      this.activityForm.patchValue({ location: [...new Set(selectedNames)].join(', ') });
    }
  }

  generateWithAI(): void {
    const title = this.activityForm.get('title')?.value;
    if (!title) {
      this.alertService.warning('Vui lòng nhập tên hoạt động trước khi tạo nội dung bằng AI.');
      return;
    }
    this.isGeneratingAI.set(true);
    const prompt = `Tạo nội dung chi tiết cho hoạt động: "${title}". Bao gồm mục đích, lợi ích, lịch trình và yêu cầu tham gia.`;
    this.http
      .post<
        ApiResponse<string>
      >('http://localhost:8080/activity/api/v1/activities/ai-generate', { prompt })
      .subscribe({
        next: (res) => {
          this.isGeneratingAI.set(false);
          if (res.data) {
            this.activityForm.patchValue({ content: res.data });
            this.alertService.success('Đã tạo nội dung bằng AI.');
          }
        },
        error: () => {
          this.isGeneratingAI.set(false);
          this.alertService.error('Không thể tạo nội dung bằng AI. Vui lòng thử lại.');
        },
      });
  }
}
