import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of, Observable } from 'rxjs';
import { switchMap, finalize } from 'rxjs/operators';

import { AlertService } from '@my-mfe/ui';
import { UserService, ApiResponse, UserInfo } from '@my-mfe/auth';
import { CloudinaryService } from '@my-mfe/data-access-media';
import { ActivityService } from '../services/activity.service';
import { Activity } from '../../../shared/models/activity.model';

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
export class ActivityCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private location = inject(Location);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private alertService = inject(AlertService);
  private activityService = inject(ActivityService);
  private cloudinaryService = inject(CloudinaryService);
  private userService = inject(UserService);

  //  CÁC SIGNAL QUẢN LÝ CHẾ ĐỘ SỬA
  isEditMode = signal<boolean>(false);
  activityId = signal<number | null>(null);
  isLoadingData = signal<boolean>(false);
  currentStatus = signal<number>(0);

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

  ngOnInit() {
    // 1. Kiểm tra URL xem có truyền ID vào không (Chế độ Edit)
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode.set(true);
      this.activityId.set(Number(idParam));
      this.loadActivityData(idParam);
    }
  }

  loadActivityData(id: string) {
    this.isLoadingData.set(true);

    this.activityService
      .getActivityById(id)
      .pipe(finalize(() => this.isLoadingData.set(false)))
      .subscribe({
        next: (act: Activity) => {
          this.currentStatus.set(act.status || 0);

          // Đổ dữ liệu vào Form
          this.activityForm.patchValue({
            title: act.title,
            description: act.description,
            content: act.content,
            semester_id: act.semesterId,
            source_link: act.sourceLink,
            is_external: act.isExternal,
            // Format ngày tháng từ DB về chuẩn của thẻ input type="datetime-local"
            registration_start: this.formatDateForInput(act.registrationStart),
            registration_end: this.formatDateForInput(act.registrationEnd),
            start_date: this.formatDateForInput(act.startDate),
            end_date: this.formatDateForInput(act.endDate),
            location: act.location,
            max_participants: act.maxParticipants,

            // Lấy tạm URL ảnh cũ nhét vào form để tí submit biết đường xử lý
            cover_image: act.coverImage,
            thumbnail: act.thumbnail,
          });

          // Hiển thị ảnh cũ
          if (act.coverImage) this.coverPreview.set(act.coverImage);
          if (act.thumbnail) this.thumbPreview.set(act.thumbnail);

          //  GỌI API THẬT ĐỂ LẤY THÔNG TIN NGƯỜI PHỤ TRÁCH
          if (act.organizerId) {
            // 1. Gắn tạm thông báo đang tải để UX mượt hơn
            this.selectedOrganizer.set({
              id: act.organizerId,
              username: '...',
              email: 'Đang tải thông tin...',
              fullName: 'Đang tải...',
              avatarUrl: null,
            });

            // 2. Gọi API lấy User thật
            this.userService.getUserById(act.organizerId).subscribe({
              next: (response: ApiResponse<UserInfo>) => {
                const user = response.result;
                if (user) {
                  // Đắp dữ liệu thật vào Signal
                  this.selectedOrganizer.set({
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName || user.username,
                    avatarUrl: user.avatarUrl || null,
                  });
                }
              },
              error: (err: HttpErrorResponse) => {
                console.error('Không thể tải thông tin người phụ trách:', err);
                // Nếu lỗi thì xóa trắng để người dùng tự tìm lại
                this.selectedOrganizer.set(null);
              },
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

  // Helper để chuyển chuỗi ngày từ BE thành format cho thẻ input datetime-local
  formatDateForInput(dateStr: string): string {
    if (!dateStr) return '';
    // Giả sử dateStr là '2026-02-27T16:40:00'
    return dateStr.substring(0, 16); // Lấy tới phút 'YYYY-MM-DDTHH:mm'
  }

  // Helper để format ngày từ input đẩy lên Backend
  formatDateTime = (dtStr: string): string => {
    if (!dtStr) return '';
    const str = String(dtStr);
    return str.length === 16 ? `${str}:00` : str;
  };

  triggerInput(id: string) {
    document.getElementById(id)?.click();
  }

  onFileSelected(event: Event, type: 'cover' | 'thumbnail') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);
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
    const data = this.activityForm.value;
    const currentOrganizer = this.selectedOrganizer();

    // 1. KIỂM TRA VALIDATE THEO TRẠNG THÁI
    if (status !== 3) {
      if (this.activityForm.invalid) {
        this.activityForm.markAllAsTouched();
        this.alertService.error('Vui lòng điền đầy đủ các thông tin bắt buộc dshsfh!');
        return;
      }

      if (!currentOrganizer) {
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
    } else {
      if (!data.title || data.title.trim() === '') {
        this.activityForm.get('title')?.markAsTouched();
        this.alertService.error('Bản nháp ít nhất phải có Tên hoạt động!');
        return;
      }
    }

    // ==========================================
    // 2. XỬ LÝ UPLOAD ẢNH & CHUẨN BỊ DỮ LIỆU
    // ==========================================
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
      ? 'Cập nhật hoạt động thành công!'
      : status === 3
        ? 'Lưu nháp thành công!'
        : 'Đã gửi yêu cầu tạo hoạt động!';

    forkJoin([uploadCover$, uploadThumb$])
      .pipe(
        switchMap(([coverUrl, thumbUrl]) => {
          // Xử lý null an toàn cho bản nháp
          const payload = {
            title: data.title,
            description: data.description || null,
            content: data.content || null,
            location: data.location || null,
            maxParticipants: data.max_participants ? Number(data.max_participants) : null,
            semesterId: data.semester_id ? Number(data.semester_id) : null,
            organizerId: currentOrganizer ? currentOrganizer.id : null,
            sourceLink: data.source_link || null,
            isExternal: Boolean(data.is_external),

            // Nếu có nhập ngày thì format, không thì ném null xuống DB
            registrationStart: data.registration_start
              ? this.formatDateTime(data.registration_start)
              : null,
            registrationEnd: data.registration_end
              ? this.formatDateTime(data.registration_end)
              : null,
            startDate: data.start_date ? this.formatDateTime(data.start_date) : null,
            endDate: data.end_date ? this.formatDateTime(data.end_date) : null,

            status: status,
            coverImage: coverUrl || null,
            thumbnail: thumbUrl || null,
            benefits: [],
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
        next: () => {
          setTimeout(() => this.goBack(), 1500);
        },
        error: (err) => {
          console.error('Chi tiết lỗi:', err);
        },
      });
  }
}
