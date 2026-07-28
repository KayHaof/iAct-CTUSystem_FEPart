export interface RegistrationResponse {
  id: number;
  studentId: number;
  studentName: string;
  studentCode: string;
  avatarUrl: string;
  activityId: number;
  activityTitle: string;
  registeredAt: string;
  status: number; // 0=registered, 1=attended, 2=cancelled
  cancelReason?: string;
  attendedAt?: string;
  checkoutAt?: string;
  isAttended?: boolean;
  attendanceStatus?: string;
  participationStatus?: string;
  canSubmitProof?: boolean;
  nextAction?: string;
  faceVerificationAttemptCount?: number;
  faceVerificationMaxAttempts?: number;
  faceVerificationRemainingAttempts?: number;
  faceVerificationExhausted?: boolean;
  canSubmitComplaint?: boolean;
  scheduleIds?: number[];
  proofStatus?: number;
}
