export interface BenefitDto {
  id?: number;
  type?: number;
  categoryId?: number;
  point?: number;
  name?: string;
  description?: string;
}

export interface BenefitFormValue {
  category_id: number | null;
  point: number | null;
  type: number | null;
}

export interface UserDto {
  id: number;
  username?: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  departmentName?: string;
  department?: { id: number; name: string };
}

export interface OrganizerMock {
  id: number;
  name?: string;
  username?: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string | null;
}

export interface SemesterMock {
  id: number;
  name: string;
}

export interface ActivityScheduleDto {
  id?: number;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
}

export interface ActivityRequest {
  title: string;
  description?: string | null;
  content?: string | null;
  location?: string | null;
  maxParticipants?: number | null;
  semesterId?: number | null;
  organizerId?: number | null;
  sourceLink?: string | null;
  isExternal: boolean;
  registrationStart?: string | null;
  registrationEnd?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: number;
  coverImage?: string | null;
  thumbnail?: string | null;
  benefits?: BenefitDto[];
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
  isExternal: boolean;
  isFaculty: boolean;
  registrationStart: string;
  registrationEnd: string;
  startDate: string;
  endDate: string;
  semesterId: number;
  departmentName: string;
  organizer?: {
    id: number;
    name: string;
    departmentId?: number;
  };
  qrCodeToken: string | null;
  status: number;
  createdBy?: UserDto;
  benefits?: BenefitDto[];
  registeredCount?: number;
  createdAt?: string;

  schedules?: ActivityScheduleDto[];

  reason?: string;
}
