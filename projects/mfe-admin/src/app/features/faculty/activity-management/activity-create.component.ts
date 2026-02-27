import { Component, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { switchMap, finalize } from 'rxjs/operators';

import { AlertService } from '@my-mfe/ui';
import { UserService, ApiResponse, UserInfo } from '@my-mfe/auth';
import { CloudinaryService } from '@my-mfe/data-access-media';
import { ActivityService } from '../services/activity.service';

export interface SemesterMock {
  id: number;
  name: string;
}

export interface OrganizerMock {
  id: number;
  username: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
}

@Component({
  selector: 'app-activity-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './activity-create.component.html',
  styleUrls: ['./activity-create.component.scss'],
})
export class ActivityCreateComponent {
  private fb = inject(FormBuilder);
  private location = inject(Location);
  private alertService = inject(AlertService);
  private activityService = inject(ActivityService);
  private cloudinaryService = inject(CloudinaryService);
  private userService = inject(UserService);

  coverPreview = signal<string | null>(null);
  thumbPreview = signal<string | null>(null);
  semesters = signal<SemesterMock[]>([{ id: 1, name: 'Học kỳ 1 (2025-2026)' }]);
  isUploading = signal<boolean>(false);

  selectedOrganizer = signal<OrganizerMock | null>(null);
  isSearchingOrganizer = signal<boolean>(false);
  searchOrganizerError = signal<string | null>(null);

  activityForm: FormGroup = this.fb.group({
    title: ['', [Validators.required]],
    description: [''],
    content: [''],
    semester_id: [null, Validators.required],
    source_link: [''],
    is_external: [false],
    registration_start: ['', Validators.required],
    registration_end: ['', Validators.required],
    start_date: ['', Validators.required],
    end_date: ['', Validators.required],
    location: ['', Validators.required],
    max_participants: [null, Validators.required],
    cover_image: [null],
    thumbnail: [null],
  });

  triggerInput(id: string) {
    document.getElementById(id)?.click();
  }

  onFileSelected(event: Event, type: 'cover' | 'thumbnail') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.handleFile(file, type);
  }

  onFileDropped(event: DragEvent, type: 'cover' | 'thumbnail') {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
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

  formatDateTime = (dtStr: string): string => {
    if (!dtStr) return '';
    const str = String(dtStr);
    return str.length === 16 ? `${str}:00` : str;
  };

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
            username: user.username,
            email: user.email,
            fullName: user.fullName || user.username,
            avatarUrl: user.avatarUrl || null,
          });
        },
        error: (err: HttpErrorResponse) => {
          console.error('Lỗi tìm kiếm:', err);
          const errorMessage = err.error?.message || 'Email này không tồn tại trong hệ thống!';
          this.searchOrganizerError.set(errorMessage);
        },
      });
  }

  removeOrganizer() {
    this.selectedOrganizer.set(null);
  }

  onSubmit(status: number) {
    if (this.activityForm.invalid) {
      this.activityForm.markAllAsTouched();
      this.alertService.error('Vui lòng điền đầy đủ các thông tin bắt buộc!');
      return;
    }

    const currentOrganizer = this.selectedOrganizer();
    if (!currentOrganizer) {
      this.alertService.error('Vui lòng tìm và chọn người phụ trách hoạt động!');
      return;
    }

    const data = this.activityForm.value;

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

    this.isUploading.set(true);

    const coverFile = data.cover_image as File | null;
    const thumbFile = data.thumbnail as File | null;

    const uploadCover$ = coverFile
      ? this.cloudinaryService.uploadImage(coverFile, 'activity')
      : of(null);
    const uploadThumb$ = thumbFile
      ? this.cloudinaryService.uploadImage(thumbFile, 'activity')
      : of(null);

    const successMsg = status === 0 ? 'Lưu nháp thành công!' : 'Đã gửi yêu cầu tạo hoạt động!';

    forkJoin([uploadCover$, uploadThumb$])
      .pipe(
        switchMap(([coverUrl, thumbUrl]) => {
          const payload = {
            title: data.title,
            description: data.description,
            content: data.content,
            location: data.location,

            maxParticipants: Number(data.max_participants),
            semesterId: Number(data.semester_id),
            organizerId: currentOrganizer.id,

            sourceLink: data.source_link || null,
            isExternal: Boolean(data.is_external),
            registrationStart: this.formatDateTime(data.registration_start),
            registrationEnd: this.formatDateTime(data.registration_end),
            startDate: this.formatDateTime(data.start_date),
            endDate: this.formatDateTime(data.end_date),

            status: status,
            coverImage: coverUrl || null,
            thumbnail: thumbUrl || null,
            benefits: [],
          };

          console.log('Payload gửi lên Spring Boot (kèm link ảnh):', payload);
          return this.activityService.createActivity(payload);
        }),
        this.alertService.observe(successMsg, 'Lỗi Server: Không thể tạo hoạt động!'),
        finalize(() => this.isUploading.set(false)),
      )
      .subscribe({
        next: () => {
          setTimeout(() => this.goBack(), 1500);
        },
        error: (err) => {
          console.error('Chi tiết lỗi:', err);
        },
      });
  }
}
