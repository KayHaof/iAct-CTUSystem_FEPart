export interface SemesterResponse {
  id: number;
  name?: string;
  semesterName?: string;
  academicYear: string;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  isLocked: boolean;
  createdAt?: string | null;
}

export interface SemesterRequest {
  name: string;
  academicYear: string;
  startDate: string | null;
  endDate: string | null;
  isActive?: boolean;
  isLocked?: boolean;
}

export interface CategoryResponse {
  id: number;
  parentId: number | null;
  code?: string | null;
  name: string;
  maxPoint: number;
  isActive?: boolean;
  createdAt?: string | null;
  children?: CategoryResponse[];
}

export interface CategoryRequest {
  parentId: number | null;
  code: string | null;
  name: string;
  maxPoint: number;
  isActive?: boolean;
}

export interface DepartmentResponse {
  id: number;
  name: string;
  code?: string | null;
  description?: string | null;
  profileUserId?: number | null;
  phone?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface DepartmentRequest {
  name: string;
  code: string | null;
  description: string | null;
  phone?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
}

export interface MajorResponse {
  id: number;
  name: string;
  code?: string | null;
  programType?: string | null;
  departmentId?: number | null;
  departmentName?: string | null;
  isActive?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface MajorRequest {
  name: string;
  code: string | null;
  programType: string | null;
  departmentId: number;
  isActive?: boolean;
}

export interface SemesterFilters {
  active: '' | 'true' | 'false';
  locked: '' | 'true' | 'false';
  academicYear: string;
}

export interface CategoryFilters {
  active: '' | 'true' | 'false';
  parentId: '' | number;
}

export interface DepartmentFilters {
  active: '' | 'true' | 'false';
  keyword: string;
}

export interface MajorFilters {
  active: '' | 'true' | 'false';
  departmentId: '' | number;
  keyword: string;
  programType: string;
}

export interface ClassResponse {
  id: number;
  name: string;
  classCode?: string | null;
  majorId?: number | null;
  majorName?: string | null;
  departmentId?: number | null;
  departmentName?: string | null;
  academicYear?: string | null;
  isActive?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ClassRequest {
  name: string;
  classCode: string | null;
  majorId: number;
  academicYear: string | null;
  isActive?: boolean;
}

export interface ClassFilters {
  active: '' | 'true' | 'false';
  departmentId: '' | number;
  majorId: '' | number;
  academicYear: string;
  keyword: string;
}
