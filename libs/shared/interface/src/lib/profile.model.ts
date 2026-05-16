export interface Department {
  id: number;
  name: string;
  code?: string | null;
  description?: string | null;
  isActive?: boolean;
}

export interface ClassInfo {
  id: number;
  name: string;
  classCode: string;
  departmentId: number;
}

export interface MajorInfo {
  id: number;
  name: string;
  code?: string | null;
  programType?: string;
  departmentId?: number;
  departmentName?: string;
  isActive?: boolean;
}

export interface Semester {
  id: number;
  semesterName: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isLocked: boolean;
  createdAt: string;
}
