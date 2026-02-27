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
}

export interface ActivityRequest {
  title: string;
  description: string;
  content: string;
  location: string;
  maxParticipants: number;
  coverImage: string | null;
  thumbnail: string | null;
  sourceLink: string | null;
  isExternal: boolean;
  registrationStart: string | Date;
  registrationEnd: string | Date;
  startDate: string | Date;
  endDate: string | Date;
  semesterId: number;
  organizerId?: number;
  status: number;
  benefits: BenefitDto[];
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
