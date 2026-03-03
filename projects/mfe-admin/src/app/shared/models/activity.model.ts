export interface BenefitDto {
  id?: number;
  name?: string;
  point?: number;
  description?: string;
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
  registrationStart: string;
  registrationEnd: string;
  startDate: string;
  endDate: string;
  semesterId: number;
  organizerId: number;
  qrCodeToken: string | null;
  status: number;
  createdBy?: UserDto;
  benefits?: BenefitDto[];
  registeredCount?: number;
}
