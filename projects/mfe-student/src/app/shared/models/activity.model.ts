export interface BenefitDto {
  id?: number;
  type?: number;
  typeLabel?: string;
  categoryId?: number;
  categoryCode?: string;
  categoryName?: string;
  point?: number;
  name?: string;
  description?: string;
}

export interface UserDto {
  id: number;
  username?: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  departmentName?: string;
}

export interface ActivityScheduleDto {
  id?: number;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
}

export interface Activity {
  id: number;
  title: string;
  description: string;
  content: string;
  location: string;
  maxParticipants: number;
  coverImage: string | null;
  thumbnail: string | null;
  sourceLink: string | null;

  // Các cờ phân loại
  isExternal: boolean;
  isFaculty: boolean;

  // Thời gian
  registrationStart: string;
  registrationEnd: string;
  startDate: string;
  endDate: string;

  semesterId: number;
  semesterName?: string | null;
  academicYear?: string | null;
  semesterDisplayName?: string | null;
  statusLabel?: string | null;

  organizer?: {
    id: number;
    fullName: string;
    departmentId?: number | null;
    departmentName?: string | null;
    representativeId?: number | null;
  };

  departmentId?: number | null;
  departmentName?: string | null;
  qrCodeToken?: string;

  status: number;
  createdBy?: UserDto;
  benefits?: BenefitDto[];
  registeredCount?: number;

  schedules?: ActivityScheduleDto[];
}

export interface ActivityRecord {
  id: number;
  activityId: number;
  title: string;
  points?: number | null;
  startDate: string;
  attendedAt?: string;
  studentCode?: string;
  location: string;
  organizer: string;
  status: number; // 0: Đăng ký, 1: Tham gia, 2: Hủy
  proofStatus: number; // 0: Chưa nộp, 1: Chờ duyệt, 2: Đã duyệt, 3: Bị từ chối
  checkoutAt?: string;
  attendanceStatus?: string;
  participationStatus?: string;
  canSubmitProof?: boolean;
  nextAction?: string;
  cancelReason?: string;
  point?: number | null;
}

export interface RawRegistrationDto {
  id: number;
  activityId: number;
  activityTitle?: string;
  points?: number | null;
  point?: number | null;
  registeredAt: string;
  attendedAt?: string;
  studentCode?: string;
  activityLocation?: string;
  status: number;
  proofStatus?: number;
  checkoutAt?: string;
  attendanceStatus?: string;
  participationStatus?: string;
  canSubmitProof?: boolean;
  nextAction?: string;
  cancelReason?: string;
}

export interface ActivityTimeResponse {
  registrationStart: string;
  registrationEnd: string;
  startDate: string;
  endDate: string;
  location: string;
}

export interface PointSummary {
  studentId: number;
  studentCode: string;
  studentName: string;
  semesterId: number;
  semesterName: string;
  totalPoint: number;
  maxPoint: number;
  percentage: number;
  status: 'excellent' | 'good' | 'warning' | 'danger';
}

export interface CategoryPoint {
  categoryId: number;
  categoryName: string;
  maxPoint: number;
  earnedPoint: number;
  children?: CategoryPoint[];
}

export interface PointDetail {
  activityId: number;
  activityTitle: string;
  categoryId: number;
  categoryName: string;
  earnedPoint: number;
  awardedAt: string;
  proofStatus: number;
}
