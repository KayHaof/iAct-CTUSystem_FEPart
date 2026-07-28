import { Injectable } from '@angular/core';

export type ChallengeKind = 'BLINK' | 'SMILE' | 'TURN_LEFT' | 'TURN_RIGHT';
export type ChallengeStatus = 'pending' | 'active' | 'done';

export interface ChallengeState {
  kind: ChallengeKind;
  title: string;
  instruction: string;
  icon: string;
  progress: number;
  status: ChallengeStatus;
  blinkCount: number;
  wasClosed: boolean;
  holdStartedAt: number | null;
}

export interface FaceLandmarkerModule {
  FaceLandmarker: {
    createFromOptions: (fileset: unknown, options: unknown) => Promise<FaceLandmarkerInstance>;
  };
  FilesetResolver: {
    forVisionTasks: (wasmPath: string) => Promise<unknown>;
  };
}

export interface FaceLandmarkerInstance {
  detectForVideo: (video: HTMLVideoElement, timestampMs: number) => FaceLandmarkerResult;
  close?: () => void;
}

export interface FaceLandmarkerResult {
  faceLandmarks?: NormalizedLandmark[][];
  faceBlendshapes?: Array<{ categories?: BlendShapeCategory[] }>;
}

export interface BlendShapeCategory {
  categoryName: string;
  score: number;
}

export interface NormalizedLandmark {
  x: number;
  y: number;
  z?: number;
}

export interface LivenessMetrics {
  blinkClosed: boolean;
  blinkOpen: boolean;
  smileScore: number;
  yawScore: number;
}

export interface FaceFrameEvaluation {
  ready: boolean;
  progress: number;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class FaceLivenessService {
  private readonly mediaPipeVersion = '0.10.21';
  private readonly localAssetRoot = new URL('assets/mediapipe/tasks-vision/', import.meta.url).toString();
  private readonly cdnAssetRoot = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${this.mediaPipeVersion}/`;
  private readonly cdnFaceLandmarkerModelUrl =
    'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task';

  async createFaceLandmarker(): Promise<FaceLandmarkerInstance> {
    const localConfig = {
      bundleUrl: this.assetUrl('vision_bundle.mjs'),
      wasmRoot: this.assetUrl('wasm'),
      modelUrl: this.assetUrl('models/face_landmarker.task'),
    };

    try {
      return await this.createFaceLandmarkerFromConfig(localConfig);
    } catch (localError) {
      console.warn('[FaceLiveness] Local MediaPipe assets failed, retrying CDN.', localError);
      return this.createFaceLandmarkerFromConfig({
        bundleUrl: this.cdnAssetRoot,
        wasmRoot: `${this.cdnAssetRoot}wasm`,
        modelUrl: this.cdnFaceLandmarkerModelUrl,
      });
    }
  }

  private async createFaceLandmarkerFromConfig(config: {
    bundleUrl: string;
    wasmRoot: string;
    modelUrl: string;
  }): Promise<FaceLandmarkerInstance> {
    const vision = await this.loadMediaPipeVision(config.bundleUrl);
    const fileset = await vision.FilesetResolver.forVisionTasks(config.wasmRoot);

    try {
      return await this.createFaceLandmarkerWithDelegate(vision, fileset, config.modelUrl, 'GPU');
    } catch (error) {
      console.warn('[FaceLiveness] GPU delegate failed, retrying with CPU.', error);
      return this.createFaceLandmarkerWithDelegate(vision, fileset, config.modelUrl, 'CPU');
    }
  }

  private createFaceLandmarkerWithDelegate(
    vision: FaceLandmarkerModule,
    fileset: unknown,
    modelAssetPath: string,
    delegate: 'GPU' | 'CPU',
  ): Promise<FaceLandmarkerInstance> {
    return vision.FaceLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath,
        delegate,
      },
      runningMode: 'VIDEO',
      numFaces: 1,
      outputFaceBlendshapes: true,
    });
  }

  evaluateFaceFrame(landmarks: NormalizedLandmark[]): FaceFrameEvaluation {
    const bounds = this.getBounds(landmarks);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    const centerDistance = Math.sqrt(
      Math.pow((centerX - 0.5) / 0.16, 2) + Math.pow((centerY - 0.48) / 0.22, 2),
    );
    const centerScore = this.clamp(1 - centerDistance, 0, 1);
    const widthScore = this.rangeScore(width, 0.22, 0.48);
    const heightScore = this.rangeScore(height, 0.28, 0.62);
    const progress = Math.round((centerScore * 0.5 + widthScore * 0.25 + heightScore * 0.25) * 100);

    if (width < 0.22 || height < 0.28) {
      return { ready: false, progress, message: 'Đưa mặt lại gần camera hơn một chút.' };
    }
    if (width > 0.48 || height > 0.62) {
      return { ready: false, progress, message: 'Lùi ra sau để khuôn mặt nằm gọn trong khung.' };
    }
    if (centerDistance > 0.92) {
      return { ready: false, progress, message: 'Canh khuôn mặt vào chính giữa khung oval.' };
    }
    return { ready: true, progress: Math.max(progress, 88), message: 'Vị trí khuôn mặt đã ổn.' };
  }

  extractMetrics(
    landmarks: NormalizedLandmark[],
    result: FaceLandmarkerResult,
  ): LivenessMetrics {
    const leftEar = this.eyeAspectRatio(landmarks, [33, 160, 158, 133, 153, 144]);
    const rightEar = this.eyeAspectRatio(landmarks, [362, 385, 387, 263, 373, 380]);
    const ear = (leftEar + rightEar) / 2;
    const blinkLeft = this.getBlendshapeScore(result, 'eyeBlinkLeft');
    const blinkRight = this.getBlendshapeScore(result, 'eyeBlinkRight');
    const smileLeft = this.getBlendshapeScore(result, 'mouthSmileLeft');
    const smileRight = this.getBlendshapeScore(result, 'mouthSmileRight');
    const bounds = this.getBounds(landmarks);
    const faceWidth = Math.max(bounds.maxX - bounds.minX, 0.001);
    const eyeCenterX = (this.point(landmarks, 33).x + this.point(landmarks, 263).x) / 2;
    const noseX = this.point(landmarks, 1).x;

    return {
      blinkClosed: (blinkLeft > 0.55 && blinkRight > 0.55) || ear < 0.19,
      blinkOpen: (blinkLeft < 0.25 && blinkRight < 0.25) || ear > 0.24,
      smileScore: (smileLeft + smileRight) / 2,
      yawScore: (noseX - eyeCenterX) / faceWidth,
    };
  }

  createRandomChallenges(): ChallengeState[] {
    const sideChallenge: ChallengeKind = Math.random() > 0.5 ? 'TURN_LEFT' : 'TURN_RIGHT';
    const pool: ChallengeKind[] = ['BLINK', 'SMILE', sideChallenge];
    const count = Math.random() > 0.5 ? 2 : 1;
    return pool
      .sort(() => Math.random() - 0.5)
      .slice(0, count)
      .map((kind) => this.createChallenge(kind));
  }

  updateChallenges(
    currentChallenges: ChallengeState[],
    metrics: LivenessMetrics,
    now = performance.now(),
  ): ChallengeState[] {
    return currentChallenges.map((task, index, allTasks) => {
      if (task.status === 'done') {
        return task;
      }

      const firstPendingIndex = allTasks.findIndex((candidate) => candidate.status !== 'done');
      if (index !== firstPendingIndex) {
        return { ...task, status: 'pending' as ChallengeStatus };
      }

      return this.advanceChallenge({ ...task, status: 'active' }, metrics, now);
    });
  }

  private loadMediaPipeVision(bundleUrl: string): Promise<FaceLandmarkerModule> {
    const importer = new Function('url', 'return import(url)') as (
      url: string,
    ) => Promise<FaceLandmarkerModule>;
    return importer(bundleUrl);
  }

  private assetUrl(path: string): string {
    return new URL(path, this.localAssetRoot).toString();
  }

  private advanceChallenge(
    challenge: ChallengeState,
    metrics: LivenessMetrics,
    now: number,
  ): ChallengeState {
    if (challenge.kind === 'BLINK') {
      const next = { ...challenge };
      if (metrics.blinkClosed && !next.wasClosed) {
        next.wasClosed = true;
      }
      if (metrics.blinkOpen && next.wasClosed) {
        next.wasClosed = false;
        next.blinkCount += 1;
      }
      next.progress = this.clamp((next.blinkCount / 2) * 100, 0, 100);
      if (next.blinkCount >= 2) {
        return { ...next, progress: 100, status: 'done' };
      }
      return next;
    }

    if (challenge.kind === 'SMILE') {
      return this.advanceHoldChallenge(challenge, metrics.smileScore > 0.48, now, 900);
    }

    if (challenge.kind === 'TURN_LEFT') {
      return this.advanceHoldChallenge(challenge, metrics.yawScore < -0.08, now, 750);
    }

    return this.advanceHoldChallenge(challenge, metrics.yawScore > 0.08, now, 750);
  }

  private advanceHoldChallenge(
    challenge: ChallengeState,
    isPassing: boolean,
    now: number,
    requiredMs: number,
  ): ChallengeState {
    if (!isPassing) {
      return { ...challenge, holdStartedAt: null, progress: Math.max(challenge.progress - 6, 0) };
    }

    const holdStartedAt = challenge.holdStartedAt ?? now;
    const progress = this.clamp(((now - holdStartedAt) / requiredMs) * 100, 0, 100);
    if (progress >= 100) {
      return { ...challenge, holdStartedAt, progress: 100, status: 'done' };
    }

    return { ...challenge, holdStartedAt, progress };
  }

  private createChallenge(kind: ChallengeKind): ChallengeState {
    const definitions: Record<ChallengeKind, Pick<ChallengeState, 'title' | 'instruction' | 'icon'>> = {
      BLINK: {
        title: 'Nháy mắt 2 lần',
        instruction: 'Nhìn thẳng và nháy mắt tự nhiên hai lần.',
        icon: 'bi-eye',
      },
      SMILE: {
        title: 'Mỉm cười',
        instruction: 'Giữ nụ cười rõ trong khoảng một giây.',
        icon: 'bi-emoji-smile',
      },
      TURN_LEFT: {
        title: 'Quay đầu sang trái',
        instruction: 'Quay nhẹ đầu sang trái rồi giữ trong chốc lát.',
        icon: 'bi-arrow-left-circle',
      },
      TURN_RIGHT: {
        title: 'Quay đầu sang phải',
        instruction: 'Quay nhẹ đầu sang phải rồi giữ trong chốc lát.',
        icon: 'bi-arrow-right-circle',
      },
    };

    return {
      kind,
      ...definitions[kind],
      progress: 0,
      status: 'pending',
      blinkCount: 0,
      wasClosed: false,
      holdStartedAt: null,
    };
  }

  private eyeAspectRatio(landmarks: NormalizedLandmark[], indexes: number[]): number {
    const [p1, p2, p3, p4, p5, p6] = indexes.map((index) => this.point(landmarks, index));
    return (this.distance(p2, p6) + this.distance(p3, p5)) / (2 * this.distance(p1, p4));
  }

  private getBlendshapeScore(result: FaceLandmarkerResult, categoryName: string): number {
    return (
      result.faceBlendshapes?.[0]?.categories?.find((category) => category.categoryName === categoryName)
        ?.score ?? 0
    );
  }

  private getBounds(landmarks: NormalizedLandmark[]) {
    return landmarks.reduce(
      (bounds, point) => ({
        minX: Math.min(bounds.minX, point.x),
        maxX: Math.max(bounds.maxX, point.x),
        minY: Math.min(bounds.minY, point.y),
        maxY: Math.max(bounds.maxY, point.y),
      }),
      { minX: 1, maxX: 0, minY: 1, maxY: 0 },
    );
  }

  private point(landmarks: NormalizedLandmark[], index: number): NormalizedLandmark {
    return landmarks[index] ?? { x: 0, y: 0, z: 0 };
  }

  private distance(a: NormalizedLandmark, b: NormalizedLandmark): number {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  private rangeScore(value: number, min: number, max: number): number {
    const center = (min + max) / 2;
    const radius = (max - min) / 2;
    return this.clamp(1 - Math.abs(value - center) / radius, 0, 1);
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}
