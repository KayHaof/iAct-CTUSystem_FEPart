export interface ModerationStats {
  pendingReview: number;
  approvedThisTerm: number;
  rejected: number;
  byDepartment?: ModerationDepartmentStats[];
}

export interface ModerationDepartmentStats {
  departmentId: number | null;
  departmentName: string;
  pendingReview: number;
  approvedThisTerm: number;
  rejected: number;
  total: number;
}

export interface ModerationFilters {
  departmentId: number | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';
  keyword?: string;
}

export interface ActivityApprovalRequest {
  status: number; // 1: Approve, 2: Reject, 3: Cancel
  rejectReason?: string;
  cancelReason?: string;
}
