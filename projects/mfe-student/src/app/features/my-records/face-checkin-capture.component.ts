import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import {
  AttendanceService,
  FaceCheckInResponse,
} from '../../shared/services/attendance.service';
import { AlertService } from '@my-mfe/ui';
import {
  ChallengeState,
  FaceLandmarkerInstance,
  FaceLivenessService,
  NormalizedLandmark,
} from './face-liveness.service';

export interface FaceCheckInActivity {
  activityId: number;
  scheduleId?: number;
  title: string;
  startDate: string;
  realStartDate?: Date;
  studentCode?: string;
  location?: string;
}

type CapturePhase = 'LOADING' | 'SETUP' | 'RUNNING' | 'SUBMITTING' | 'RESULT';

@Component({
  selector: 'app-face-checkin-capture',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './face-checkin-capture.component.html',
  styleUrls: ['./face-checkin-capture.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaceCheckinCaptureComponent implements AfterViewInit, OnDestroy {
  private attendanceService = inject(AttendanceService);
  private alertService = inject(AlertService);
  private livenessService = inject(FaceLivenessService);
  private router = inject(Router);

  @Input({ required: true }) activity!: FaceCheckInActivity;
  @Output() completed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() exhausted = new EventEmitter<FaceCheckInResponse>();

  @ViewChild('cameraVideo') cameraVideo?: ElementRef<HTMLVideoElement>;

  phase = signal<CapturePhase>('LOADING');
  modelStatus = signal('Đang tải bộ nhận diện khuôn mặt...');
  cameraStatus = signal('Đang mở camera trước...');
  guideMessage = signal('Đưa khuôn mặt vào trong khung oval.');
  resultMessage = signal('');
  resultDetail = signal('');
  resultSuccess = signal(false);
  faceFrameProgress = signal(0);
  challenges = signal<ChallengeState[]>([]);
  isSubmitting = signal(false);
  isCameraReady = signal(false);
  isModelReady = signal(false);
  canRetry = signal(true);

  canStart = computed(
    () =>
      this.phase() === 'SETUP' &&
      this.isCameraReady() &&
      this.isModelReady(),
  );
  overallProgress = computed(() => {
    const tasks = this.challenges();
    if (tasks.length === 0) {
      return Math.round(this.faceFrameProgress() * 0.35);
    }
    const taskProgress = tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length;
    return Math.round(this.faceFrameProgress() * 0.25 + taskProgress * 0.75);
  });
  activeChallenge = computed(() => this.challenges().find((task) => task.status !== 'done'));
  remainingChallengeCount = computed(
    () => this.challenges().filter((task) => task.status !== 'done').length,
  );

  private mediaStream: MediaStream | null = null;
  private faceLandmarker: FaceLandmarkerInstance | null = null;
  private animationFrameId: number | null = null;
  private hasSubmittedCurrentRun = false;
  private latestFaceLandmarks: NormalizedLandmark[] | null = null;

  async ngAfterViewInit(): Promise<void> {
    await this.initializeCameraAndModel();
  }

  ngOnDestroy(): void {
    this.stopDetectionLoop();
    this.stopCamera();
    this.faceLandmarker?.close?.();
  }

  async initializeCameraAndModel(): Promise<void> {
    this.phase.set('LOADING');
    try {
      await Promise.all([this.startCamera(), this.loadFaceLandmarker()]);
      this.phase.set('SETUP');
      this.modelStatus.set('Bộ nhận diện đã sẵn sàng.');
      this.cameraStatus.set('Camera đã sẵn sàng.');
      this.startDetectionLoop();
    } catch (error) {
      console.error('[FaceCheckIn] Cannot initialize camera or MediaPipe:', error);
      this.phase.set('RESULT');
      this.resultSuccess.set(false);
      this.canRetry.set(false);
      this.resultMessage.set('Không thể khởi động xác thực khuôn mặt');
      this.resultDetail.set(
        'Vui lòng kiểm tra quyền camera, kết nối mạng để tải MediaPipe và thử lại.',
      );
    }
  }

  startChallenge(): void {
    if (!this.isCameraReady() || !this.isModelReady()) {
      this.alertService.warning('Camera hoặc bộ nhận diện khuôn mặt chưa sẵn sàng.');
      return;
    }

    this.hasSubmittedCurrentRun = false;
    this.canRetry.set(true);
    this.resultMessage.set('');
    this.resultDetail.set('');
    this.resultSuccess.set(false);
    this.challenges.set(this.livenessService.createRandomChallenges());
    this.phase.set('RUNNING');
    this.guideMessage.set('Giữ khuôn mặt nằm gọn trong khung oval và làm theo thử thách.');
  }

  retryChallenge(): void {
    if (!this.canRetry()) {
      this.goToComplaint();
      return;
    }

    this.phase.set('SETUP');
    this.challenges.set([]);
    this.faceFrameProgress.set(0);
    this.resultMessage.set('');
    this.resultDetail.set('');
    this.resultSuccess.set(false);
    this.hasSubmittedCurrentRun = false;
    this.canRetry.set(true);
  }

  cancel(): void {
    this.cancelled.emit();
  }

  goToComplaint(): void {
    const activityId = this.activity?.activityId;
    this.cancelled.emit();
    void this.router.navigate(['/complaints'], {
      queryParams: activityId ? { activityId } : undefined,
    });
  }

  private async startCamera(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Browser does not support camera capture.');
    }

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });

    const video = this.cameraVideo?.nativeElement;
    if (!video) {
      throw new Error('Camera video element is not ready.');
    }

    video.srcObject = this.mediaStream;
    video.muted = true;
    video.playsInline = true;
    await new Promise<void>((resolve) => {
      video.onloadedmetadata = () => resolve();
    });
    await video.play();
    this.isCameraReady.set(true);
  }

  private async loadFaceLandmarker(): Promise<void> {
    this.faceLandmarker = await this.livenessService.createFaceLandmarker();
    this.isModelReady.set(true);
  }

  private startDetectionLoop(): void {
    this.stopDetectionLoop();
    const analyze = () => {
      this.analyzeFrame();
      this.animationFrameId = window.requestAnimationFrame(analyze);
    };
    this.animationFrameId = window.requestAnimationFrame(analyze);
  }

  private stopDetectionLoop(): void {
    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private stopCamera(): void {
    this.mediaStream?.getTracks().forEach((track) => track.stop());
    this.mediaStream = null;
  }

  private analyzeFrame(): void {
    const video = this.cameraVideo?.nativeElement;
    if (!video || !this.faceLandmarker || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return;
    }

    const result = this.faceLandmarker.detectForVideo(video, performance.now());
    const detectedFaces = result.faceLandmarks ?? [];
    if (detectedFaces.length > 1) {
      this.latestFaceLandmarks = null;
      this.faceFrameProgress.set(0);
      this.guideMessage.set('Camera đang thấy nhiều khuôn mặt. Vui lòng chỉ để khuôn mặt sinh viên trong khung.');
      return;
    }

    const landmarks = detectedFaces[0];
    if (!landmarks?.length) {
      this.latestFaceLandmarks = null;
      this.faceFrameProgress.set(0);
      this.guideMessage.set('Chưa thấy khuôn mặt. Hãy nhìn thẳng vào camera.');
      return;
    }
    this.latestFaceLandmarks = landmarks;

    const frame = this.livenessService.evaluateFaceFrame(landmarks);
    this.faceFrameProgress.set(frame.progress);
    this.guideMessage.set(frame.message);

    if (this.phase() !== 'RUNNING' || !frame.ready || this.hasSubmittedCurrentRun) {
      return;
    }

    const metrics = this.livenessService.extractMetrics(landmarks, result);
    this.challenges.set(this.livenessService.updateChallenges(this.challenges(), metrics));

    if (this.challenges().length > 0 && this.challenges().every((task) => task.status === 'done')) {
      this.hasSubmittedCurrentRun = true;
      void this.captureAndSubmit();
    }
  }

  private async captureAndSubmit(): Promise<void> {
    const video = this.cameraVideo?.nativeElement;
    const activity = this.activity;
    if (!video || !activity) {
      return;
    }

    this.phase.set('SUBMITTING');
    this.isSubmitting.set(true);
    this.guideMessage.set('Đã vượt qua thử thách. Đang chụp ảnh và gửi xác thực...');

    try {
      const liveImage = await this.captureVideoFrame(video, this.latestFaceLandmarks);
      const coords = await this.getCurrentLocation().catch(() => null);
      this.attendanceService
        .faceCheckIn({
          activityId: activity.activityId,
          scheduleId: activity.scheduleId,
          liveImage,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
        })
        .pipe(finalize(() => this.isSubmitting.set(false)))
        .subscribe({
          next: (res) => this.handleFaceCheckInResponse(res.data),
          error: (err) => {
            this.hasSubmittedCurrentRun = false;
            this.canRetry.set(true);
            this.phase.set('RESULT');
            this.resultSuccess.set(false);
            this.resultMessage.set('Không thể gửi ảnh xác thực');
            this.resultDetail.set(err.error?.message || 'Vui lòng thử lại sau ít phút.');
          },
        });
    } catch (error) {
      console.error('[FaceCheckIn] Capture error:', error);
      this.phase.set('RESULT');
      this.isSubmitting.set(false);
      this.canRetry.set(true);
      this.resultSuccess.set(false);
      this.resultMessage.set('Không thể chụp ảnh từ camera');
      this.resultDetail.set('Hãy kiểm tra camera và thử xác thực lại.');
    }
  }

  private handleFaceCheckInResponse(response?: FaceCheckInResponse): void {
    const verified = response?.verified === true;
    this.phase.set('RESULT');
    this.resultSuccess.set(verified);
    this.resultMessage.set(
      response?.message || (verified ? 'Xác thực thành công' : 'Ảnh chưa khớp với hồ sơ'),
    );
    this.resultDetail.set(this.buildResultDetail(response));

    if (verified) {
      this.canRetry.set(false);
      this.alertService.success(response?.message || 'Đã xác thực tham gia thành công.');
      window.setTimeout(() => this.completed.emit(), 900);
      return;
    }

    this.hasSubmittedCurrentRun = false;
    const remainingAttempts = this.resolveRemainingAttempts(response);
    const allowRetry = response?.allowRetry !== false && (remainingAttempts === null || remainingAttempts > 0);
    this.canRetry.set(allowRetry);

    if (allowRetry) {
      this.alertService.warning(response?.message || 'Ảnh chưa đạt, vui lòng thử lại.');
    } else {
      if (response) {
        this.exhausted.emit(response);
      }
      this.alertService.error(response?.message || 'Bạn đã hết lượt xác thực tự động.');
    }
  }

  private buildResultDetail(response?: FaceCheckInResponse): string {
    if (!response) {
      return '';
    }

    const parts: string[] = [];
    const attempt = response.attempt ?? response.attemptCount;
    const remainingAttempts = this.resolveRemainingAttempts(response);

    if (attempt && response.maxAttempts) {
      parts.push(`Lượt ${attempt}/${response.maxAttempts}`);
    }
    if (remainingAttempts !== null) {
      parts.push(`Còn ${remainingAttempts} lượt thử`);
    }
    if (response.similarity !== undefined && response.similarity !== null) {
      parts.push(`Độ tương đồng ${Math.round(Number(response.similarity) * 100)}%`);
    }
    return parts.join(' · ');
  }

  private resolveRemainingAttempts(response?: FaceCheckInResponse): number | null {
    if (!response) {
      return null;
    }
    if (response.remainingAttempts !== undefined) {
      return response.remainingAttempts;
    }
    if (response.attemptsRemaining !== undefined) {
      return response.attemptsRemaining;
    }
    if (response.maxAttempts !== undefined) {
      const attempt = response.attempt ?? response.attemptCount ?? 0;
      return Math.max(response.maxAttempts - attempt, 0);
    }
    return null;
  }

  private captureVideoFrame(video: HTMLVideoElement, landmarks: NormalizedLandmark[] | null): Promise<File> {
    const canvas = document.createElement('canvas');
    const crop = landmarks?.length ? this.resolveFaceCrop(video, landmarks) : this.resolveFullFrame(video);
    canvas.width = crop.width;
    canvas.height = crop.height;
    const context = canvas.getContext('2d');
    if (!context) {
      return Promise.reject(new Error('Cannot create canvas context.'));
    }
    context.drawImage(video, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
    return new Promise<File>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Cannot encode camera frame.'));
            return;
          }
          resolve(new File([blob], `face-checkin-${Date.now()}.jpg`, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        0.92,
      );
    });
  }

  private resolveFullFrame(video: HTMLVideoElement): { x: number; y: number; width: number; height: number } {
    return {
      x: 0,
      y: 0,
      width: video.videoWidth || 1280,
      height: video.videoHeight || 720,
    };
  }

  private resolveFaceCrop(
    video: HTMLVideoElement,
    landmarks: NormalizedLandmark[],
  ): { x: number; y: number; width: number; height: number } {
    const frame = this.resolveFullFrame(video);
    const xs = landmarks.map((point) => point.x * frame.width);
    const ys = landmarks.map((point) => point.y * frame.height);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const faceWidth = Math.max(maxX - minX, frame.width * 0.12);
    const faceHeight = Math.max(maxY - minY, frame.height * 0.16);

    const x1 = this.clamp(minX - faceWidth * 0.28, 0, frame.width);
    const y1 = this.clamp(minY - faceHeight * 0.32, 0, frame.height);
    const x2 = this.clamp(maxX + faceWidth * 0.28, 0, frame.width);
    const y2 = this.clamp(maxY + faceHeight * 0.42, 0, frame.height);
    const minCropSize = Math.min(frame.width, frame.height) * 0.28;
    const cropWidth = Math.min(Math.max(x2 - x1, minCropSize), frame.width);
    const cropHeight = Math.min(Math.max(y2 - y1, minCropSize), frame.height);
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;

    return {
      x: Math.round(this.clamp(centerX - cropWidth / 2, 0, frame.width - cropWidth)),
      y: Math.round(this.clamp(centerY - cropHeight / 2, 0, frame.height - cropHeight)),
      width: Math.round(cropWidth),
      height: Math.round(cropHeight),
    };
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not available.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
        reject,
        { enableHighAccuracy: true, timeout: 5000 },
      );
    });
  }
}
