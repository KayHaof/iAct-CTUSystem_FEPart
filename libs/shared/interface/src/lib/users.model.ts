export interface UserInfo {
  id: number;
  keycloakId: string;
  username: string;
  email: string;
  roleType: number;
  status: number;
  studentCode?: string;
  classId?: number;
  departmentId?: number;
  classCode?: string;
  departmentName?: string;
  fullName: string;
  birthday?: string;
  gender?: number;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface ChangePasswordDto {
  currentPassword?: string;
  newPassword?: string;
}
