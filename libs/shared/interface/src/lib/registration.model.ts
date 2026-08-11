export interface RegistrationResponse {
  id: number;
  studentId: number;
  studentName: string;
  studentCode: string;
  classId?: number;
  classCode?: string;
  className?: string;
  academicYear?: string;
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
  attendanceSessions?: AttendanceSessionResponse[];
  registeredSessionCount?: number;
  faceVerifiedSessionCount?: number;
  absentSessionCount?: number;
  proofStatus?: number;
}

export interface AttendanceSessionResponse {
  id: number;
  registrationId: number;
  scheduleId?: number;
  scheduleTitle?: string;
  scheduleStartTime?: string;
  scheduleEndTime?: string;
  checkinTime?: string;
  checkoutTime?: string;
  attendanceStatus?: string;
  status?: number;
  method?: number;
  message?: string;
}
