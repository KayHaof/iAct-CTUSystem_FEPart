export interface RegistrationResponse {
  id: number;
  studentId: number;
  studentName: string;
  activityId: number;
  activityTitle: string;
  registeredAt: string;
  status: number; // 0: Đã đăng ký, 1: Đã điểm danh, 2: Đã hủy
  cancelReason?: string;
  attendedAt?: string;
  isAttended: boolean;
  scheduleIds?: number[];
}
