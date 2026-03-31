export interface ModerationStats {
  pendingReview: number;
  approvedThisTerm: number;
  rejected: number;
}

export interface ModerationFilters {
  departmentId: number | null;
  semesterId: number | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';
  keyword?: string;
}

export interface ActivityApprovalRequest {
  status: number; // 1: Approve, 2: Reject, 3: Cancel
  rejectReason?: string;
  cancelReason?: string;
}
