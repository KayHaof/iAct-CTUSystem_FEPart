import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { BarcodeFormat } from '@zxing/library';
import { ZXingScannerModule } from '@zxing/ngx-scanner';

import { AlertService } from '@my-mfe/ui';
import { CloudinaryService} from '@my-mfe/data-access-media';
import { ActivityRecord, RawRegistrationDto } from '../../shared/models/activity.model';
import { Semester} from 'interface';

import { AttendanceService, CheckInRequest } from '../../shared/services/attendance.service';
import { RegistrationService } from '../../shared/services/registration.service';
import { ProofService, ProofSubmissionRequest } from '../../shared/services/proof.service';
import { SemesterService } from '../../shared/services/semester.service';

@Component({
  selector: 'app-my-records',
  standalone: true,
  imports: [CommonModule, FormsModule, ZXingScannerModule],
  templateUrl: './my-records.component.html',
  styleUrls: ['./my-records.component.scss'],
})
export class MyRecordsComponent implements OnInit {
  private registrationService = inject(RegistrationService);
  private attendanceService = inject(AttendanceService);
  private proofService = inject(ProofService);
  private semesterService = inject(SemesterService);
  private alertService = inject(AlertService);
  private cloudinaryService = inject(CloudinaryService);

  // --- STATE QUẢN LÝ GIAO DIỆN ---
  semesters = signal<Semester[]>([]);
  selectedSemesterId = signal<number | null>(null);
  currentTab = signal<'ACTION_REQUIRED' | 'UPCOMING' | 'COMPLETED'>('ACTION_REQUIRED');

  isModalOpen = signal(false);
  selectedActivity = signal<ActivityRecord | null>(null);
  isLoadingData = signal(false);

  // --- STATE ĐIỂM DANH ---
  manualCode = signal('');
  isSubmittingCheckIn = signal(false);
  isScanning = signal(false);
  modalMode = signal<'SCAN' | 'PROOF' | 'INFO'>('INFO');

  // --- STATE MINH CHỨNG ---
  proofImageUrl = signal('');
  proofDescription = signal('');
  isSubmittingProof = signal(false);

  // --- STATE UPLOAD FILE KÉO THẢ ---
  isDragging = signal(false);
  previewUrl = signal<string | null>(null);
  selectedFile = signal<File | null>(null);
  selectedFileName = signal<string>('');

  activities = signal<ActivityRecord[]>([]);

  allowedFormats = [BarcodeFormat.QR_CODE];

  ngOnInit() {
    this.fetchSemesters();
  }

  fetchSemesters() {
    this.semesterService.getAllSemesters().subscribe({
      next: (res) => {
        const semesterList = res.result || [];
        this.semesters.set(semesterList);

        const activeSem = semesterList.find((s) => s.isActive);

        if (activeSem) {
          this.selectedSemesterId.set(activeSem.id);
        } else if (semesterList.length > 0) {
          this.selectedSemesterId.set(semesterList[0].id);
        } else {
          this.selectedSemesterId.set(null);
        }

        this.fetchMyRecords();
      },
      error: () => {
        this.alertService.error('Không thể tải danh sách học kỳ!');
        this.fetchMyRecords();
      },
    });
  }

  fetchMyRecords() {
    this.isLoadingData.set(true);
    const semId = this.selectedSemesterId() === null ? undefined : this.selectedSemesterId();

    this.registrationService
      .getMyRecords(semId)
      .pipe(finalize(() => this.isLoadingData.set(false)))
      .subscribe({
        next: (res) => {
          const rawData = (res.result as unknown as RawRegistrationDto[]) || [];
          const mappedData: ActivityRecord[] = rawData.map((item) => ({
            id: item.id,
            activityId: item.activityId,
            title: item.activityTitle || 'Chưa có tên',
            points: item.points || 0,
            startDate: item.registeredAt,
            attendedAt: item.attendedAt,
            studentCode: item.studentCode,
            location: item.activityLocation || 'Chưa cập nhật',
            organizer: 'Đoàn - Hội',
            status: item.status,
            proofStatus: item.proofStatus || 0,
            cancelReason: item.cancelReason || '',
            point: item.point || 0,
          }));

          this.activities.set(mappedData);
        },
        error: () => {
          this.alertService.error('Không thể tải danh sách hoạt động!');
          this.activities.set([]);
        },
      });
  }

  onFilterChange() {
    this.fetchMyRecords();
  }

  async onScanSuccess(resultString: string) {
    this.isScanning.set(false);
    this.manualCode.set(resultString);
    this.alertService.success('Đã quét mã thành công! Đang gửi điểm danh...');
    await this.submitManualCode();
  }

  // --- LOGIC GIAO DIỆN (TABS & MODAL) ---
  getUiTabStatus(act: ActivityRecord): 'ACTION_REQUIRED' | 'UPCOMING' | 'COMPLETED' {
    if (act.status === 0) return 'UPCOMING';
    if (act.status === 1 && act.proofStatus === 0) return 'ACTION_REQUIRED';
    return 'COMPLETED';
  }

  filteredActivities = computed(() => {
    return this.activities().filter((act) => this.getUiTabStatus(act) === this.currentTab());
  });

  totalPoints = computed(() => {
    return this.activities()
      .filter((act) => act.status === 1 && act.proofStatus === 2)
      .reduce((sum, act) => sum + act.point, 0);
  });

  changeTab(tab: 'ACTION_REQUIRED' | 'UPCOMING' | 'COMPLETED') {
    this.currentTab.set(tab);
  }

  openModal(activity: ActivityRecord, mode: 'SCAN' | 'PROOF' | 'INFO' = 'INFO') {
    this.selectedActivity.set(activity);
    this.modalMode.set(mode);
    this.isModalOpen.set(true);
    this.manualCode.set('');
    this.proofImageUrl.set('');
    this.proofDescription.set('');
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedActivity.set(null);
    this.isScanning.set(false);
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.selectedFileName.set('');
  }

  getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject('Trình duyệt không hỗ trợ GPS');
      } else {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => reject('Không thể lấy tọa độ'),
          { enableHighAccuracy: true, timeout: 5000 },
        );
      }
    });
  }

  async submitManualCode() {
    if (!this.manualCode().trim()) {
      this.alertService.error('Vui lòng nhập mã điểm danh!');
      return;
    }

    const act = this.selectedActivity();
    if (!act) return;

    this.isSubmittingCheckIn.set(true);
    let lat = 0,
      lng = 0;

    try {
      const coords = await this.getCurrentLocation();
      lat = coords.lat;
      lng = coords.lng;
    } catch {
      console.warn('Không lấy được GPS, dùng mặc định (0,0)');
    }

    const request: CheckInRequest = {
      activityId: act.activityId,
      latitude: lat,
      longitude: lng,
      method: 2,
      verifyCode: this.manualCode().trim(),
    };

    this.attendanceService
      .checkIn(request)
      .pipe(finalize(() => this.isSubmittingCheckIn.set(false)))
      .subscribe({
        next: (res) => {
          const successMsg = res.result?.message || 'Điểm danh thành công!';
          this.alertService.success(successMsg);
          this.fetchMyRecords();

          if (successMsg.toLowerCase().includes('check-out')) {
            const currentAct = this.selectedActivity();
            if (currentAct) {
              this.selectedActivity.set({
                ...currentAct,
                status: 1,
                proofStatus: 0,
              });
              this.isScanning.set(false);
              this.manualCode.set('');

              this.modalMode.set('PROOF');
            }
          } else {
            this.closeModal();
          }
        },
        error: (err) => {
          this.alertService.error(err.error?.message || 'Mã điểm danh không hợp lệ!');
        },
      });
  }

  submitProofData() {
    const act = this.selectedActivity();
    if (!act) return;

    // Lấy dữ liệu file kéo thả hoặc link text do người dùng dán
    const fileToUpload = this.selectedFile();
    const textUrl = this.proofImageUrl().trim();

    if (!fileToUpload && !textUrl) {
      this.alertService.error('Vui lòng tải lên ảnh hoặc nhập link minh chứng!');
      return;
    }

    this.isSubmittingProof.set(true);

    // TRƯỜNG HỢP 1: NGƯỜI DÙNG KÉO THẢ FILE
    if (fileToUpload) {
      this.cloudinaryService.uploadImage(fileToUpload, 'proof-activity').subscribe({
        next: (uploadedUrl) => {
          // Up ảnh thành công -> lấy URL gọi tiếp API nộp minh chứng
          this.executeSubmitProofApi(act.activityId, uploadedUrl, this.proofDescription().trim());
        },
        error: () => {
          this.isSubmittingProof.set(false);
          this.alertService.error('Lỗi tải ảnh lên hệ thống! Vui lòng thử lại.');
        },
      });
    }
    // TRƯỜNG HỢP 2: NGƯỜI DÙNG DÁN LINK TEXT
    else {
      this.executeSubmitProofApi(act.activityId, textUrl, this.proofDescription().trim());
    }
  }

  private executeSubmitProofApi(activityId: number, imageUrl: string, description: string) {
    const request: ProofSubmissionRequest = {
      activityId: activityId,
      imageUrl: imageUrl,
      description: description,
    };

    this.proofService
      .submitProof(request)
      .pipe(finalize(() => this.isSubmittingProof.set(false)))
      .subscribe({
        next: () => {
          this.alertService.success('Đã nộp minh chứng thành công! Vui lòng chờ cố vấn duyệt.');
          this.closeModal();
          this.fetchMyRecords();
        },
        error: (err) => {
          this.alertService.error(err.error?.message || 'Có lỗi xảy ra khi nộp minh chứng!');
        },
      });
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

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
    input.value = '';
  }

  handleFile(file: File) {
    // 1. Kiểm tra dung lượng (Giới hạn 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.alertService.error('File quá lớn! Vui lòng chọn ảnh dưới 5MB.');
      return;
    }

    // 2. Kiểm tra định dạng ảnh
    if (!file.type.match(/image\/*/)) {
      this.alertService.error('Vui lòng chỉ tải lên file hình ảnh (JPG, PNG)!');
      return;
    }

    // 3. Lưu file vào State
    this.selectedFile.set(file);
    this.selectedFileName.set(file.name);
    this.proofImageUrl.set('');

    // 4. Tạo URL Preview để hiển thị lên HTML
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl.set(e.target?.result as string | null);
    };
    reader.readAsDataURL(file);
  }

  removeFile(event: Event) {
    event.stopPropagation();
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.selectedFileName.set('');
  }
}
