export interface Department {
  id: number;
  name: string;
  description: string;
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
  programType?: string;
  departmentId?: number;
  departmentName?: string;
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
