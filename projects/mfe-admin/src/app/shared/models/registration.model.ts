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
  isAttended?: boolean;
  scheduleIds?: number[];
}
