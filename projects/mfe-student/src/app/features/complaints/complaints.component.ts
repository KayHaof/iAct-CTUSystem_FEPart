import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { AlertService } from '@my-mfe/ui';
import { CloudinaryService } from '@my-mfe/data-access-media';
import { Semester } from '@my-mfe/interface';
import {
  ComplaintEligibleActivity,
  ComplaintRequest,
} from '../../shared/models/complaint.model';
import { ComplaintService } from '../../shared/services/complaint.service';
import { SemesterService } from '../../shared/services/semester.service';

type ComplaintFilter = 'ALL' | 'OPEN' | 'PENDING' | 'RESPONDED';

@Component({
  selector: 'app-complaints',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './complaints.component.html',
  styleUrls: ['./complaints.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComplaintsComponent implements OnInit {
  private complaintService = inject(ComplaintService);
  private semesterService = inject(SemesterService);
  private alertService = inject(AlertService);
  private cloudinaryService = inject(CloudinaryService);

  semesters = signal<Semester[]>([]);
  selectedSemesterId = signal<number | null>(null);
  filter = signal<ComplaintFilter>('ALL');
  activities = signal<ComplaintEligibleActivity[]>([]);
  selectedActivity = signal<ComplaintEligibleActivity | null>(null);

  isLoading = signal(false);
  isModalOpen = signal(false);
  isSubmitting = signal(false);
  isDragging = signal(false);
  selectedFile = signal<File | null>(null);
  selectedFileName = signal('');
  previewUrl = signal<string | null>(null);

  detail = signal('');
  evidenceUrl = signal('');

  ngOnInit() {
    this.loadSemesters();
  }

  filteredActivities = computed(() => {
    const currentFilter = this.filter();

    return this.activities().filter((item) => {
      const status = item.complaint?.status;

      if (currentFilter === 'OPEN') {
        return item.complaint == null;
      }
      if (currentFilter === 'PENDING') {
        return status === 0;
      }
      if (currentFilter === 'RESPONDED') {
        return status === 1 || status === 2;
      }
      return true;
    });
  });

  openCount = computed(() => this.activities().filter((item) => item.complaint == null).length);
  pendingCount = computed(() => this.activities().filter((item) => item.complaint?.status === 0).length);
  respondedCount = computed(() =>
    this.activities().filter((item) => item.complaint?.status === 1 || item.complaint?.status === 2)
      .length,
  );

  loadSemesters() {
    this.semesterService.getAllSemesters().subscribe({
      next: (res) => {
        const semesters = res.data || [];
        this.semesters.set(semesters);
        const activeSemester = semesters.find((semester) => semester.isActive);
        this.selectedSemesterId.set(activeSemester?.id ?? semesters[0]?.id ?? null);
        this.loadActivities();
      },
      error: () => {
        this.alertService.error('Không thể tải danh sách học kỳ.');
        this.loadActivities();
      },
    });
  }

  loadActivities() {
    this.isLoading.set(true);
    this.complaintService
      .getMyEligibleActivities(this.selectedSemesterId())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.activities.set(res.data || []);
        },
        error: (err) => {
          this.activities.set([]);
          this.alertService.error(err.error?.message || 'Không thể tải danh sách hoạt động khiếu nại.');
        },
      });
  }

  onFilterChange() {
    this.loadActivities();
  }

  changeFilter(filter: ComplaintFilter) {
    this.filter.set(filter);
  }

  openComplaintModal(activity: ComplaintEligibleActivity) {
    this.selectedActivity.set(activity);
    this.detail.set(activity.complaint?.detail || '');
    this.evidenceUrl.set(activity.complaint?.evidenceUrl || '');
    this.selectedFile.set(null);
    this.selectedFileName.set('');
    this.previewUrl.set(null);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedActivity.set(null);
    this.selectedFile.set(null);
    this.selectedFileName.set('');
    this.previewUrl.set(null);
    this.detail.set('');
    this.evidenceUrl.set('');
  }

  submitComplaint() {
    const activity = this.selectedActivity();
    const detail = this.detail().trim();

    if (!activity) {
      return;
    }

    if (detail.length < 10) {
      this.alertService.error('Vui lòng mô tả khiếu nại ít nhất 10 ký tự.');
      return;
    }

    this.isSubmitting.set(true);
    const file = this.selectedFile();

    if (file) {
      this.cloudinaryService.uploadImage(file, 'proof-activity').subscribe({
        next: (uploadedUrl) => this.executeSubmit(activity.registrationId, detail, uploadedUrl),
        error: () => {
          this.isSubmitting.set(false);
          this.alertService.error('Không thể tải minh chứng lên hệ thống.');
        },
      });
      return;
    }

    this.executeSubmit(activity.registrationId, detail, this.evidenceUrl().trim());
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.handleFile(file);
    }

    input.value = '';
  }

  removeFile(event: Event) {
    event.stopPropagation();
    this.selectedFile.set(null);
    this.selectedFileName.set('');
    this.previewUrl.set(null);
  }

  getStatusClass(activity: ComplaintEligibleActivity) {
    const status = activity.complaint?.status;

    if (status === 0) {
      return 'bg-amber-50 text-amber-700 ring-amber-600/20';
    }
    if (status === 1) {
      return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
    }
    if (status === 2) {
      return 'bg-rose-50 text-rose-700 ring-rose-600/20';
    }
    return 'bg-blue-50 text-blue-700 ring-blue-600/20';
  }

  getStatusLabel(activity: ComplaintEligibleActivity) {
    return activity.complaint?.statusLabel || 'Có thể gửi khiếu nại';
  }

  private executeSubmit(registrationId: number, detail: string, evidenceUrl: string) {
    const request: ComplaintRequest = {
      registrationId,
      detail,
      evidenceUrl: evidenceUrl || null,
    };

    this.complaintService
      .submitComplaint(request)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.alertService.success('Đã gửi khiếu nại. Vui lòng chờ Ban tổ chức phản hồi.');
          this.closeModal();
          this.loadActivities();
        },
        error: (err) => {
          this.alertService.error(err.error?.message || 'Không thể gửi khiếu nại.');
        },
      });
  }

  private handleFile(file: File) {
    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      this.alertService.error('File quá lớn. Vui lòng chọn ảnh dưới 5MB.');
      return;
    }

    if (!file.type.match(/image\/*/)) {
      this.alertService.error('Vui lòng chọn file hình ảnh JPG hoặc PNG.');
      return;
    }

    this.selectedFile.set(file);
    this.selectedFileName.set(file.name);
    this.evidenceUrl.set('');

    const reader = new FileReader();
    reader.onload = (event) => {
      this.previewUrl.set(event.target?.result as string | null);
    };
    reader.readAsDataURL(file);
  }
}
