export interface BenefitDto {
  id?: number;
  type?: number;
  categoryId?: number;
  categoryName?: string;
  point?: number;
  name?: string;
  description?: string;
}

export interface BenefitFormValue {
  root_category_id?: number | null;
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
  fullName?: string;
  username?: string;
  email?: string;
  avatarUrl?: string | null;
}

// export interface SemesterMock {
//   id: number;
//   name: string;
// }

export interface ActivityScheduleDto {
  id?: number;
  title: string;
  startTime: string;
  endTime: string;
  location?: string | null;
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
  isFaculty: boolean;
  registrationStart?: string | null;
  registrationEnd?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: number;
  coverImage?: string | null;
  thumbnail?: string | null;
  benefits?: BenefitDto[];
  schedules?: ActivityScheduleDto[];
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
  departmentId?: number | null;
  departmentName: string | null;
  organizer?: {
    id: number;
    fullName: string;
    departmentId?: number | null;
    representativeId?: number | null;
  };
  qrCodeToken: string | null;
  status: number;
  createdBy?: UserDto | null;
  benefits?: BenefitDto[];
  registeredCount?: number;
  createdAt?: string;

  schedules?: ActivityScheduleDto[];

  handledAt?: string | Date | null;
  handledBy?: UserDto | null;
  reason?: string | null;
}
