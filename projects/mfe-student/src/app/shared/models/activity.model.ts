export interface BenefitDto {
  id?: number;
  type?: number;
  categoryId?: number;
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

  organizer?: {
    id: number;
    name: string;
    departmentId?: number | null;
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
  points: number;
  startDate: string;
  attendedAt?: string;
  studentCode?: string;
  location: string;
  organizer: string;
  status: number; // 0: Đăng ký, 1: Tham gia, 2: Hủy
  proofStatus: number; // 0: Chưa nộp, 1: Chờ duyệt, 2: Đã duyệt, 3: Bị từ chối
  cancelReason?: string;
  point: number;
}

export interface RawRegistrationDto {
  id: number;
  activityId: number;
  activityTitle?: string;
  points?: number;
  point?: number;
  registeredAt: string;
  attendedAt?: string;
  studentCode?: string;
  activityLocation?: string;
  status: number;
  proofStatus?: number;
  cancelReason?: string;
}
