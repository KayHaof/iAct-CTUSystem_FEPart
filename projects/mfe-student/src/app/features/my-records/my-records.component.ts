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

import { AlertService } from '@my-mfe/ui';
import { CloudinaryService } from '@my-mfe/data-access-media';
import {
  ActivityRecord,
  RawRegistrationDto,
  ActivityTimeResponse,
} from '../../shared/models/activity.model';
import { Semester } from '@my-mfe/interface';

import { RegistrationService } from '../../shared/services/registration.service';
import { ProofService, ProofSubmissionRequest } from '../../shared/services/proof.service';
import { SemesterService } from '../../shared/services/semester.service';
import { ActivityService } from '../../shared/services/activity.service';
import { FaceCheckInResponse } from '../../shared/services/attendance.service';
import { FaceCheckinCaptureComponent } from './face-checkin-capture.component';

type TabMode = 'REGISTERED' | 'ONGOING' | 'PROOF_SUBMITTED' | 'COMPLETED';
type ProofOpenContext = 'COMPLAINT_APPROVED';

export interface UiActivityRecord extends ActivityRecord {
  realStartDate?: Date;
  realEndDate?: Date;
  isStartingSoon?: boolean;
  isMissed?: boolean;
}

@Component({
  selector: 'app-my-records',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FaceCheckinCaptureComponent],
  templateUrl: './my-records.component.html',
  styleUrls: ['./my-records.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyRecordsComponent implements OnInit {
  private registrationService = inject(RegistrationService);
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
  modalMode = signal<'FACE' | 'PROOF' | 'INFO'>('INFO');

  // --- STATE MINH CHỨNG ---
  proofImageUrl = signal('');
  proofDescription = signal('');
  isSubmittingProof = signal(false);
  proofOpenedFromApprovedComplaint = signal(false);

  // --- STATE UPLOAD FILE KÉO THẢ ---
  isDragging = signal(false);
  previewUrl = signal<string | null>(null);
  selectedFile = signal<File | null>(null);
  selectedFileName = signal<string>('');

  activities = signal<UiActivityRecord[]>([]);
  private pendingProofActivityId: number | null = null;
  private pendingFaceActivityId: number | null = null;
  private pendingRecordActivityId: number | null = null;
  private pendingSemesterId: number | null = null;
  private pendingProofOpenContext: ProofOpenContext | null = null;
  private hasHandledProofRoute = false;
  private hasHandledFaceRoute = false;
  private hasHandledRecordRoute = false;

  ngOnInit() {
    const proofActivityId =
      this.route.snapshot.queryParamMap.get('proofActivityId') ||
      this.route.snapshot.queryParamMap.get('activityId');
    const faceActivityId = this.route.snapshot.queryParamMap.get('faceActivityId');
    const recordActivityId = this.route.snapshot.queryParamMap.get('recordActivityId');
    const semesterId = this.route.snapshot.queryParamMap.get('semesterId');
    const proofSource = this.route.snapshot.queryParamMap.get('proofSource');
    this.pendingProofActivityId = proofActivityId ? Number(proofActivityId) : null;
    this.pendingFaceActivityId = faceActivityId ? Number(faceActivityId) : null;
    this.pendingRecordActivityId = recordActivityId ? Number(recordActivityId) : null;
    this.pendingSemesterId = semesterId ? Number(semesterId) : null;
    this.pendingProofOpenContext =
      proofSource === 'complaint-approved' ? 'COMPLAINT_APPROVED' : null;

    if (this.pendingProofActivityId || this.pendingFaceActivityId || this.pendingRecordActivityId) {
      this.currentTab.set('ONGOING');
    }

    this.fetchSemesters();
  }

  fetchSemesters() {
    this.semesterService.getAllSemesters().subscribe({
      next: (res) => {
        const semesterList = res.data || [];
        this.semesters.set(semesterList);

        const routedSemester = semesterList.find((s) => s.id === this.pendingSemesterId);
        const activeSem = semesterList.find((s) => s.isActive);

        if (routedSemester) {
          this.selectedSemesterId.set(routedSemester.id);
        } else if (activeSem) {
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
                  checkoutAt: item.checkoutAt,
                  studentCode: item.studentCode,
                  location: finalLocation,
                  organizer: 'Đoàn - Hội',
                  status: item.status,
                  proofStatus: item.proofStatus || 0,
                  attendanceStatus: item.attendanceStatus,
                  participationStatus: item.participationStatus,
                  canSubmitProof: item.canSubmitProof,
                  nextAction: item.nextAction,
                  faceVerificationAttemptCount: item.faceVerificationAttemptCount,
                  faceVerificationMaxAttempts: item.faceVerificationMaxAttempts,
                  faceVerificationRemainingAttempts: item.faceVerificationRemainingAttempts,
                  faceVerificationExhausted: item.faceVerificationExhausted,
                  canSubmitComplaint: item.canSubmitComplaint,
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
          this.openFaceFromRoute(mappedData);
          this.openProofFromRoute(mappedData);
          this.openRecordFromRoute(mappedData);
        },
        error: () => {
          this.alertService.error('Không thể tải danh sách hoạt động!');
          this.activities.set([]);
        },
      });
  }

  private openFaceFromRoute(records: UiActivityRecord[]): void {
    if (!this.pendingFaceActivityId || this.hasHandledFaceRoute) {
      return;
    }

    this.hasHandledFaceRoute = true;
    const target = records.find((act) => act.activityId === this.pendingFaceActivityId);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { faceActivityId: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });

    if (!target) {
      this.alertService.error('Không tìm thấy hoạt động cần xác minh khuôn mặt.');
      return;
    }

    const targetTab = this.getUiTabStatus(target);
    if (targetTab) {
      this.currentTab.set(targetTab);
    }

    if (!this.canOpenFace(target)) {
      this.alertService.error('Hoạt động này chưa sẵn sàng để xác minh khuôn mặt.');
      return;
    }

    this.openModal(target, 'FACE');
  }

  private openProofFromRoute(records: UiActivityRecord[]): void {
    if (!this.pendingProofActivityId || this.hasHandledProofRoute) {
      return;
    }

    this.hasHandledProofRoute = true;
    const target = records.find((act) => act.activityId === this.pendingProofActivityId);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { proofActivityId: null, activityId: null, semesterId: null, proofSource: null },
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

    this.openModal(
      target,
      'PROOF',
      this.pendingProofOpenContext === 'COMPLAINT_APPROVED' ? 'COMPLAINT_APPROVED' : undefined,
    );
    this.pendingProofOpenContext = null;
  }

  private openRecordFromRoute(records: UiActivityRecord[]): void {
    if (!this.pendingRecordActivityId || this.hasHandledRecordRoute) {
      return;
    }

    this.hasHandledRecordRoute = true;
    const target = records.find((act) => act.activityId === this.pendingRecordActivityId);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { recordActivityId: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });

    if (!target) {
      this.alertService.error('Không tìm thấy hồ sơ tham gia cần xem.');
      return;
    }

    const targetTab = this.getUiTabStatus(target);
    if (targetTab) {
      this.currentTab.set(targetTab);
    }

    this.openModal(target, 'INFO');
  }

  onFilterChange() {
    this.fetchMyRecords();
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

    const needsParticipationAction =
      act.nextAction === 'QR_CHECK_IN' ||
      act.nextAction === 'QR_CHECK_OUT' ||
      act.nextAction === 'FACE_VERIFY' ||
      act.nextAction === 'SUBMIT_COMPLAINT' ||
      act.participationStatus === 'FACE_VERIFICATION_EXHAUSTED';
    const needsProofAction =
      act.canSubmitProof === true ||
      act.participationStatus === 'FACE_VERIFIED' ||
      act.participationStatus === 'PROOF_REJECTED' ||
      (act.status === 1 && (act.proofStatus === 0 || act.proofStatus === 3));
    if (needsParticipationAction || needsProofAction || (act.status === 0 && isHappeningNow)) {
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

    if (activity.status === 1) {
      return 'Đã xác thực';
    }

    if (activity.nextAction === 'QR_CHECK_IN' || activity.attendanceStatus === 'NOT_CHECKED_IN') {
      return 'Cần check-in';
    }

    if (activity.nextAction === 'QR_CHECK_OUT' || activity.attendanceStatus === 'CHECKED_IN') {
      return 'Cần check-out';
    }

    if (this.isFaceVerificationExhausted(activity)) {
      return 'Hết lượt xác minh';
    }

    if (activity.nextAction === 'FACE_VERIFY' || activity.attendanceStatus === 'CHECKED_OUT') {
      return 'Cần xác minh';
    }

    return 'Chưa xác thực';
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

    if (activity.nextAction === 'QR_CHECK_IN') {
      return 'Quét QR check-in';
    }

    if (activity.nextAction === 'QR_CHECK_OUT') {
      return 'Quét QR check-out';
    }

    if (this.isFaceVerificationExhausted(activity)) {
      return 'Hết lượt xác minh khuôn mặt';
    }

    if (activity.nextAction === 'FACE_VERIFY') {
      return 'Cần xác thực khuôn mặt';
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

  isFaceVerificationExhausted(activity: UiActivityRecord | null | undefined): boolean {
    if (!activity || activity.status === 1 || activity.status === 2 || activity.isMissed) {
      return false;
    }

    return (
      activity.faceVerificationExhausted === true ||
      activity.nextAction === 'SUBMIT_COMPLAINT' ||
      activity.participationStatus === 'FACE_VERIFICATION_EXHAUSTED'
    );
  }

  canSubmitComplaint(activity: UiActivityRecord | null | undefined): boolean {
    return !!activity && (activity.canSubmitComplaint === true || this.isFaceVerificationExhausted(activity));
  }

  canOpenFace(activity: UiActivityRecord | null | undefined): boolean {
    return (
      !!activity &&
      !this.isFaceVerificationExhausted(activity) &&
      (activity.nextAction === 'FACE_VERIFY' || activity.attendanceStatus === 'CHECKED_OUT')
    );
  }

  openComplaint(activity: UiActivityRecord): void {
    void this.router.navigate(['/complaints'], {
      queryParams: { activityId: activity.activityId },
    });
  }

  openModal(
    activity: UiActivityRecord,
    mode: 'FACE' | 'PROOF' | 'INFO' = 'INFO',
    proofContext?: ProofOpenContext,
  ) {
    if (mode === 'FACE' && !this.canOpenFace(activity)) {
      this.alertService.error(
        'Bạn cần check-in và check-out bằng QR trước khi xác minh khuôn mặt.',
      );
      return;
    }

    if (
      mode === 'PROOF' &&
      !this.canOpenProof(activity) &&
      activity.proofStatus !== 1 &&
      activity.proofStatus !== 2
    ) {
      this.alertService.error(
        'Bạn cần check-in, check-out và xác minh khuôn mặt trước khi nộp minh chứng.',
      );
      return;
    }

    this.selectedActivity.set(activity);
    this.modalMode.set(mode);
    this.proofOpenedFromApprovedComplaint.set(
      mode === 'PROOF' && proofContext === 'COMPLAINT_APPROVED',
    );
    this.isModalOpen.set(true);
    this.proofImageUrl.set('');
    this.proofDescription.set('');
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedActivity.set(null);
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.selectedFileName.set('');
    this.proofOpenedFromApprovedComplaint.set(false);
  }

  onFaceCheckInCompleted() {
    const activityId = this.selectedActivity()?.activityId ?? null;
    this.closeModal();
    if (activityId) {
      this.pendingProofActivityId = activityId;
      this.hasHandledProofRoute = false;
    }
    this.fetchMyRecords();
  }

  onFaceCheckInExhausted(response: FaceCheckInResponse) {
    const activity = this.selectedActivity();
    if (!activity) {
      return;
    }

    const attempt = response.attempt ?? response.attemptCount ?? activity.faceVerificationAttemptCount ?? 5;
    const maxAttempts = response.maxAttempts ?? activity.faceVerificationMaxAttempts ?? 5;
    const remainingAttempts =
      response.remainingAttempts ?? response.attemptsRemaining ?? Math.max(maxAttempts - attempt, 0);
    const exhaustedActivity: UiActivityRecord = {
      ...activity,
      participationStatus: 'FACE_VERIFICATION_EXHAUSTED',
      nextAction: 'SUBMIT_COMPLAINT',
      faceVerificationAttemptCount: attempt,
      faceVerificationMaxAttempts: maxAttempts,
      faceVerificationRemainingAttempts: remainingAttempts,
      faceVerificationExhausted: true,
      canSubmitComplaint: true,
    };

    this.selectedActivity.set(exhaustedActivity);
    this.activities.update((items) =>
      items.map((item) => (item.id === exhaustedActivity.id ? { ...item, ...exhaustedActivity } : item)),
    );
  }

  submitProofData() {
    const act = this.selectedActivity();
    if (!act) return;

    if (!this.canOpenProof(act)) {
      this.alertService.error(
        'Bạn cần check-in, check-out và xác minh khuôn mặt trước khi nộp minh chứng.',
      );
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
