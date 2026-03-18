import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, of, Observable } from 'rxjs';
import { switchMap, finalize } from 'rxjs/operators';

import { AlertService } from '@my-mfe/ui';
import { UserService } from '@my-mfe/auth';
import { ApiResponse, UserInfo} from 'interface';
import { CloudinaryService } from '@my-mfe/data-access-media';
import { ActivityService } from '../services/activity.service';

import { CategoryService } from '../services/category.service';
import {
  Activity,
  BenefitDto,
  BenefitFormValue,
  OrganizerMock,
} from '../../../shared/models/activity.model';
import { CategoryResponse } from '../../../shared/models/category.model';

@Component({
  selector: 'app-activity-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './activity-create.component.html',
  styleUrls: ['./activity-create.component.scss'],
})
export class ActivityCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private location = inject(Location);
  private route = inject(ActivatedRoute);
  private alertService = inject(AlertService);
  private activityService = inject(ActivityService);
  private cloudinaryService = inject(CloudinaryService);
  private userService = inject(UserService);
  private categoryService = inject(CategoryService);

  isEditMode = signal<boolean>(false);
  activityId = signal<number | null>(null);
  isLoadingData = signal<boolean>(false);
  currentStatus = signal<number>(0);

  coverPreview = signal<string | null>(null);
  thumbPreview = signal<string | null>(null);
  isUploading = signal<boolean>(false);

  selectedOrganizer = signal<OrganizerMock | null>(null);
  isSearchingOrganizer = signal<boolean>(false);
  searchOrganizerError = signal<string | null>(null);

  categories = signal<CategoryResponse[]>([]);

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
    this.categoryService.getAllCategoriesFlat().subscribe({
      next: (res) => {
        if (res.code === 200 && res.result) {
          this.categories.set(res.result);
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
              const benefitGroup = this.fb.group({
                category_id: [benefit.categoryId, Validators.required],
                point: [benefit.point, [Validators.required, Validators.min(1)]],
                type: [benefit.type || 1, Validators.required],
              });
              this.benefits.push(benefitGroup);
            });
          }

          if ((act as any).schedules && (act as any).schedules.length > 0) {
            this.schedules.clear();
            (act as any).schedules.forEach((schedule: any) => {
              const scheduleGroup = this.fb.group({
                title: [schedule.title, Validators.required],
                start_time: [this.formatDateForInput(schedule.startTime), Validators.required],
                end_time: [this.formatDateForInput(schedule.endTime), Validators.required],
                location: [schedule.location]
              });
              this.schedules.push(scheduleGroup);
            });
          }

          if (act.coverImage) this.coverPreview.set(act.coverImage);
          if (act.thumbnail) this.thumbPreview.set(act.thumbnail);

          if (act.organizer?.id) {
            this.selectedOrganizer.set({
              id: act.organizer.id,
              name: act.organizer.name,
              username: '...',
              email: 'Đang lấy thông tin chi tiết...',
              fullName: act.organizer.name || 'Người phụ trách',
              avatarUrl: null,
            });

            this.userService.getUserById(act.organizer.id).subscribe({
              next: (response: ApiResponse<UserInfo>) => {
                const user = response.result;
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
              error: (err: HttpErrorResponse) => console.error('Không thể lấy chi tiết User:', err),
            });
          }
        },
        error: (err: HttpErrorResponse) => {
          console.error('Lỗi khi tải hoạt động:', err);
          this.alertService.error('Không tìm thấy hoạt động này!');
          this.goBack();
        },
      });
  }

  formatDateForInput(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    return dateStr.substring(0, 16);
  }

  // --- QUẢN LÝ ĐIỂM RÈN LUYỆN ---
  get benefits() { return this.activityForm.get('benefits') as FormArray; }
  addBenefit() {
    this.benefits.push(this.fb.group({
      category_id: [null, Validators.required],
      point: [null, [Validators.required, Validators.min(1)]],
      type: [1, Validators.required],
    }));
  }
  removeBenefit(index: number) { this.benefits.removeAt(index); }

  // --- QUẢN LÝ LỊCH TRÌNH NHIỀU BUỔI ---
  get schedules() { return this.activityForm.get('schedules') as FormArray; }
  addSchedule() {
    this.schedules.push(this.fb.group({
      title: ['', Validators.required],
      start_time: ['', Validators.required],
      end_time: ['', Validators.required],
      location: ['']
    }));
  }
  removeSchedule(index: number) { this.schedules.removeAt(index); }


  formatDateTime = (dtStr: string): string => {
    if (!dtStr) return '';
    const str = String(dtStr);
    return str.length === 16 ? `${str}:00` : str;
  };

  triggerInput(id: string) { document.getElementById(id)?.click(); }

  onFileSelected(event: Event, type: 'cover' | 'thumbnail') {
    const file = (event.target as HTMLInputElement).files?.item(0);
    if (file) this.handleFile(file, type);
  }

  onFileDropped(event: DragEvent, type: 'cover' | 'thumbnail') {
    event.preventDefault();
    const file = event.dataTransfer?.files?.item(0);
    if (file) this.handleFile(file, type);
  }

  onDragOver(event: DragEvent) { event.preventDefault(); }

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

  goBack() { this.location.back(); }

  searchOrganizer(email: string) {
    if (!email || email.trim() === '') {
      this.searchOrganizerError.set('Vui lòng nhập email!');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      this.searchOrganizerError.set('Định dạng email không hợp lệ!');
      return;
    }

    this.isSearchingOrganizer.set(true);
    this.searchOrganizerError.set(null);

    this.userService
      .getUserByEmail(email.trim())
      .pipe(finalize(() => this.isSearchingOrganizer.set(false)))
      .subscribe({
        next: (response: ApiResponse<UserInfo>) => {
          const user = response.result;
          if (!user) {
            this.searchOrganizerError.set('Email này không tồn tại trong hệ thống!');
            return;
          }
          this.selectedOrganizer.set({
            id: user.id,
            name: user.fullName || user.username,
            username: user.username,
            email: user.email,
            fullName: user.fullName || user.username,
            avatarUrl: user.avatarUrl || null,
          });
        },
        error: (err: HttpErrorResponse) => {
          this.searchOrganizerError.set(err.error?.message || 'Email này không tồn tại!');
        },
      });
  }

  removeOrganizer() { this.selectedOrganizer.set(null); }

  onSubmit(requestedStatus: number) {
    const data = this.activityForm.value;
    const currentOrganizer = this.selectedOrganizer();
    const finalStatus = requestedStatus;

    const isFormValid = this.activityForm.valid;
    const hasOrganizer = !!currentOrganizer;

    // KIỂM TRA LỖI KHI GỬI DUYỆT
    if (finalStatus !== 3) {
      if (!isFormValid) {
        this.activityForm.markAllAsTouched();
        this.alertService.error('Vui lòng điền đầy đủ các thông tin bắt buộc để gửi duyệt!');
        return;
      }

      if (!hasOrganizer) {
        this.alertService.error('Vui lòng tìm và chọn người phụ trách hoạt động!');
        return;
      }

      const regStart = new Date(data.registration_start);
      const regEnd = new Date(data.registration_end);
      const actStart = new Date(data.start_date);
      const actEnd = new Date(data.end_date);

      if (regEnd <= regStart) {
        this.alertService.error('Thời gian đóng đăng ký phải sau thời gian mở!');
        return;
      }
      if (actStart <= regEnd) {
        this.alertService.error('Thời gian tổ chức phải sau khi đã đóng đăng ký!');
        return;
      }
      if (actEnd <= actStart) {
        this.alertService.error('Thời gian kết thúc phải sau thời gian bắt đầu!');
        return;
      }

      //  VALIDATION CHO LỊCH TRÌNH CHI TIẾT (SCHEDULES)
      if (data.schedules && data.schedules.length > 0) {
        for (let i = 0; i < data.schedules.length; i++) {
          const s = data.schedules[i];
          const sStart = new Date(s.start_time);
          const sEnd = new Date(s.end_time);

          if (sEnd <= sStart) {
            this.alertService.error(`Lỗi tại [${s.title}]: Thời gian kết thúc phải sau bắt đầu!`);
            return;
          }
          if (sStart < actStart || sEnd > actEnd) {
            this.alertService.error(`Lỗi tại [${s.title}]: Thời gian buổi này phải nằm trong khung thời gian tổ chức chung của hoạt động!`);
            return;
          }
        }
      }

    } else {
      if (!data.title || data.title.trim() === '') {
        this.activityForm.get('title')?.markAsTouched();
        this.alertService.error('Bản nháp ít nhất phải có Tên hoạt động!');
        return;
      }
    }

    this.isUploading.set(true);

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

    const successMsg = this.isEditMode()
      ? (finalStatus === 0 ? 'Đã cập nhật và gửi yêu cầu duyệt!' : 'Cập nhật bản nháp thành công!')
      : (finalStatus === 0 ? 'Đã gửi yêu cầu tạo hoạt động!' : 'Lưu nháp thành công!');

    forkJoin([uploadCover$, uploadThumb$])
      .pipe(
        switchMap(([coverUrl, thumbUrl]) => {
          const mappedBenefits: BenefitDto[] = (data.benefits as BenefitFormValue[]).map((b) => ({
            categoryId: b.category_id ?? undefined,
            point: b.point ?? undefined,
            type: b.type ?? undefined,
          }));

          //  MAP LỊCH TRÌNH CHI TIẾT ĐỂ GỬI BE
          const mappedSchedules = (data.schedules || []).map((s: any) => ({
            title: s.title,
            startTime: this.formatDateTime(s.start_time),
            endTime: this.formatDateTime(s.end_time),
            location: s.location || null
          }));

          const payload = {
            title: data.title,
            description: data.description || null,
            content: data.content || null,
            location: data.location || null,
            maxParticipants: data.max_participants ? Number(data.max_participants) : null,
            organizerId: currentOrganizer ? currentOrganizer.id : null,
            sourceLink: data.source_link || null,
            isExternal: Boolean(data.is_external),

            registrationStart: data.registration_start ? this.formatDateTime(data.registration_start) : null,
            registrationEnd: data.registration_end ? this.formatDateTime(data.registration_end) : null,
            startDate: data.start_date ? this.formatDateTime(data.start_date) : null,
            endDate: data.end_date ? this.formatDateTime(data.end_date) : null,

            status: finalStatus,
            coverImage: coverUrl || null,
            thumbnail: thumbUrl || null,
            benefits: mappedBenefits,
            schedules: mappedSchedules
          };

          const currentId = this.activityId();

          if (this.isEditMode() && currentId) {
            return this.activityService.updateActivity(currentId, payload);
          } else {
            return this.activityService.createActivity(payload);
          }
        }),
        this.alertService.observe(successMsg, 'Lỗi Server: Không thể lưu hoạt động!'),
        finalize(() => this.isUploading.set(false)),
      )
      .subscribe({
        next: () => setTimeout(() => this.goBack(), 1500),
        error: (err) => console.error('Chi tiết lỗi:', err),
      });
  }
}
