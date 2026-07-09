import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, switchMap, catchError, map } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { BarcodeFormat } from '@zxing/library';
import { ZXingScannerModule } from '@zxing/ngx-scanner';

import { AlertService } from '@my-mfe/ui';
import { CloudinaryService } from '@my-mfe/data-access-media';
import {
  ActivityRecord,
  RawRegistrationDto,
  ActivityTimeResponse,
} from '../../shared/models/activity.model';
import { Semester } from '@my-mfe/interface';

import { AttendanceService, CheckInRequest } from '../../shared/services/attendance.service';
import { RegistrationService } from '../../shared/services/registration.service';
import { ProofService, ProofSubmissionRequest } from '../../shared/services/proof.service';
import { SemesterService } from '../../shared/services/semester.service';
import { ActivityService } from '../../shared/services/activity.service';

type TabMode = 'REGISTERED' | 'ONGOING' | 'PROOF_SUBMITTED' | 'COMPLETED';

export interface UiActivityRecord extends ActivityRecord {
  realStartDate?: Date;
  realEndDate?: Date;
  isStartingSoon?: boolean;
  isMissed?: boolean;
}

@Component({
  selector: 'app-my-records',
  standalone: true,
  imports: [CommonModule, FormsModule, ZXingScannerModule, RouterLink],
  templateUrl: './my-records.component.html',
  styleUrls: ['./my-records.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyRecordsComponent implements OnInit {
  private registrationService = inject(RegistrationService);
  private attendanceService = inject(AttendanceService);
  private proofService = inject(ProofService);
  private semesterService = inject(SemesterService);
  private alertService = inject(AlertService);
  private cloudinaryService = inject(CloudinaryService);
  private activityService = inject(ActivityService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // --- STATE QUẢN LÝ GIAO DIỆN ---
  semesters = signal<Semester[]>([]);
  selectedSemesterId = signal<number | null>(null);
  currentTab = signal<TabMode>('ONGOING');

  isModalOpen = signal(false);
  selectedActivity = signal<UiActivityRecord | null>(null);
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

  activities = signal<UiActivityRecord[]>([]);
  private pendingProofActivityId: number | null = null;
  private hasHandledProofRoute = false;

  allowedFormats = [BarcodeFormat.QR_CODE];

  ngOnInit() {
    const proofActivityId =
      this.route.snapshot.queryParamMap.get('proofActivityId') ||
      this.route.snapshot.queryParamMap.get('activityId');
    this.pendingProofActivityId = proofActivityId ? Number(proofActivityId) : null;

    if (this.pendingProofActivityId) {
      this.currentTab.set('ONGOING');
    }

    this.fetchSemesters();
  }

  fetchSemesters() {
    this.semesterService.getAllSemesters().subscribe({
      next: (res) => {
        const semesterList = res.data || [];
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
      .pipe(
        switchMap((res) => {
          const rawData = (res.data as unknown as RawRegistrationDto[]) || [];
          if (rawData.length === 0) return of([]);

          const timeRequests = rawData.map((item) =>
            this.activityService.getActivityTimes(item.activityId).pipe(catchError(() => of(null))),
          );

          return forkJoin(timeRequests).pipe(
            map((timesArray) => {
              const now = new Date();

              return rawData.map((item, index) => {
                const times: ActivityTimeResponse | null = timesArray[index];

                let realStart: Date | undefined;
                let realEnd: Date | undefined;
                let isStartingSoon = false;
                let isMissed = false;
                let finalLocation = item.activityLocation || 'Chưa cập nhật địa điểm';

                if (times) {
                  realStart = new Date(times.startDate);
                  realEnd = new Date(times.endDate);

                  if (times.location) {
                    finalLocation = times.location;
                  }

                  const diffTime = realStart.getTime() - now.getTime();
                  const diffDays = diffTime / (1000 * 3600 * 24);

                  if (diffDays > 0 && diffDays <= 3) {
                    isStartingSoon = true;
                  }

                  if (item.status === 0 && now > realEnd) {
                    isMissed = true;
                  }
                }

                return {
                  id: item.id,
                  activityId: item.activityId,
                  title: item.activityTitle || 'Chưa có tên',
                  startDate: times?.startDate || item.registeredAt,
                  realStartDate: realStart,
                  realEndDate: realEnd,
                  isStartingSoon: isStartingSoon,
                  isMissed: isMissed,
                  attendedAt: item.attendedAt,
                  studentCode: item.studentCode,
                  location: finalLocation,
                  organizer: 'Đoàn - Hội',
                  status: item.status,
                  proofStatus: item.proofStatus || 0,
                  checkoutAt: item.checkoutAt,
                  attendanceStatus: item.attendanceStatus,
                  participationStatus: item.participationStatus,
                  canSubmitProof: item.canSubmitProof,
                  nextAction: item.nextAction,
                  cancelReason: item.cancelReason || '',
                  point: item.point ?? null,
                } as UiActivityRecord;
              });
            }),
          );
        }),
        finalize(() => this.isLoadingData.set(false)),
      )
      .subscribe({
        next: (mappedData) => {
          this.activities.set(mappedData);
          this.openProofFromRoute(mappedData);
        },
        error: () => {
          this.alertService.error('Không thể tải danh sách hoạt động!');
          this.activities.set([]);
        },
      });
  }

  private openProofFromRoute(records: UiActivityRecord[]): void {
    if (!this.pendingProofActivityId || this.hasHandledProofRoute) {
      return;
    }

    this.hasHandledProofRoute = true;
    const target = records.find((act) => act.activityId === this.pendingProofActivityId);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { proofActivityId: null, activityId: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });

    if (!target) {
      this.alertService.error('Không tìm thấy hoạt động cần nộp minh chứng.');
      return;
    }

    const targetTab = this.getUiTabStatus(target);
    if (targetTab) {
      this.currentTab.set(targetTab);
    }

    this.openModal(target, 'PROOF');
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

  getUiTabStatus(act: UiActivityRecord): TabMode | null {
    const now = new Date();

    if (
      act.participationStatus === 'CANCELLED' ||
      act.participationStatus === 'COMPLETED' ||
      act.participationStatus === 'MISSED' ||
      act.status === 2 ||
      (act.status === 1 && act.proofStatus === 2) ||
      act.isMissed
    ) {
      return 'COMPLETED';
    }

    if (
      act.participationStatus === 'PROOF_PENDING' ||
      (act.status === 1 && act.proofStatus === 1)
    ) {
      return 'PROOF_SUBMITTED';
    }

    const isHappeningNow =
      act.realStartDate && act.realEndDate && now >= act.realStartDate && now <= act.realEndDate;

    const needsProofAction =
      act.canSubmitProof === true ||
      act.participationStatus === 'CHECKED_IN' ||
      act.participationStatus === 'CHECKED_OUT' ||
      act.participationStatus === 'PROOF_REJECTED' ||
      (act.status === 1 && (act.proofStatus === 0 || act.proofStatus === 3));
    if (needsProofAction || (act.status === 0 && isHappeningNow)) {
      return 'ONGOING';
    }

    if (act.status === 0 && act.realStartDate && now < act.realStartDate) {
      return 'REGISTERED';
    }

    return null;
  }

  filteredActivities = computed(() => {
    return this.activities().filter((act) => this.getUiTabStatus(act) === this.currentTab());
  });

  changeTab(tab: TabMode) {
    this.currentTab.set(tab);
  }

  tabCount(tab: TabMode): number {
    return this.activities().filter((act) => this.getUiTabStatus(act) === tab).length;
  }

  getAttendanceLabel(activity: UiActivityRecord): string {
    if (activity.status === 2 || activity.participationStatus === 'CANCELLED') {
      return 'Đã hủy';
    }

    if (activity.isMissed || activity.participationStatus === 'MISSED') {
      return 'Đã bỏ lỡ';
    }

    if (activity.nextAction === 'CHECK_OUT') {
      return 'Đã check-in';
    }

    if (activity.status === 1) {
      return 'Đã check-out';
    }

    return 'Chưa điểm danh';
  }

  getProofLabel(activity: UiActivityRecord): string {
    if (activity.status === 2 || activity.isMissed) {
      return 'Không áp dụng';
    }

    if (activity.proofStatus === 1) {
      return 'Chờ duyệt';
    }

    if (activity.proofStatus === 2) {
      return 'Đã duyệt';
    }

    if (activity.proofStatus === 3) {
      return 'Bị từ chối';
    }

    return activity.status === 1 ? 'Cần nộp' : 'Chưa đến bước';
  }

  getRecordNote(activity: UiActivityRecord): string {
    if (activity.cancelReason) {
      return activity.cancelReason;
    }

    if (activity.isStartingSoon && this.currentTab() === 'REGISTERED') {
      return 'Sắp diễn ra';
    }

    if (activity.nextAction === 'CHECK_OUT') {
      return 'Cần check-out';
    }

    if (this.canOpenProof(activity)) {
      return activity.proofStatus === 3 ? 'Cần nộp lại minh chứng' : 'Cần bổ sung minh chứng';
    }

    return '';
  }

  canOpenProof(activity: UiActivityRecord | null | undefined): boolean {
    return (
      !!activity &&
      (activity.canSubmitProof === true ||
        (activity.status === 1 && (activity.proofStatus === 0 || activity.proofStatus === 3)))
    );
  }

  openModal(activity: UiActivityRecord, mode: 'SCAN' | 'PROOF' | 'INFO' = 'INFO') {
    if (
      mode === 'PROOF' &&
      !this.canOpenProof(activity) &&
      activity.proofStatus !== 1 &&
      activity.proofStatus !== 2
    ) {
      this.alertService.error('Bạn cần hoàn tất check-out trước khi nộp minh chứng.');
      return;
    }

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

    const attendanceRequest =
      act.nextAction === 'CHECK_OUT'
        ? this.attendanceService.checkOut(request)
        : this.attendanceService.checkIn(request);

    attendanceRequest.pipe(finalize(() => this.isSubmittingCheckIn.set(false))).subscribe({
      next: (res) => {
        const successMsg = res.message || 'Điểm danh thành công!';
        this.alertService.success(successMsg);
        this.fetchMyRecords();

        if (res.data?.attendanceStatus === 'CHECKED_OUT') {
          const currentAct = this.selectedActivity();
          if (currentAct) {
            this.selectedActivity.set({
              ...currentAct,
              status: 1,
              attendanceStatus: 'CHECKED_OUT',
              participationStatus: 'CHECKED_OUT',
              proofStatus: 0,
              canSubmitProof: true,
              nextAction: 'SUBMIT_PROOF',
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

    if (!this.canOpenProof(act)) {
      this.alertService.error('Bạn cần hoàn tất check-out trước khi nộp minh chứng.');
      return;
    }

    const fileToUpload = this.selectedFile();
    const textUrl = this.proofImageUrl().trim();

    if (!fileToUpload && !textUrl) {
      this.alertService.error('Vui lòng tải lên ảnh hoặc nhập link minh chứng!');
      return;
    }

    this.isSubmittingProof.set(true);

    if (fileToUpload) {
      this.cloudinaryService.uploadImage(fileToUpload, 'proof-activity').subscribe({
        next: (uploadedUrl) => {
          this.executeSubmitProofApi(act.activityId, uploadedUrl, this.proofDescription().trim());
        },
        error: () => {
          this.isSubmittingProof.set(false);
          this.alertService.error('Lỗi tải ảnh lên hệ thống! Vui lòng thử lại.');
        },
      });
    } else {
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
          this.alertService.success('Đã nộp minh chứng thành công! Vui lòng chờ BTC duyệt.');
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
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.alertService.error('File quá lớn! Vui lòng chọn ảnh dưới 5MB.');
      return;
    }

    if (!file.type.match(/image\/*/)) {
      this.alertService.error('Vui lòng chỉ tải lên file hình ảnh (JPG, PNG)!');
      return;
    }

    this.selectedFile.set(file);
    this.selectedFileName.set(file.name);
    this.proofImageUrl.set('');

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
