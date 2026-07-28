export type CertificateSubmissionComplaintStatus = 0 | 1 | 2;

export interface CertificateSubmissionComplaintRequest {
  submissionId: number;
  complaintReason: string;
}

export interface CertificateSubmissionComplaint {
  id: number;
  submissionId: number;
  studentId?: number | null;
  studentCode?: string | null;
  studentName?: string | null;
  departmentId?: number | null;
  semesterId?: number | null;
  semesterName?: string | null;
  imageUrl?: string | null;
  certificateTitle?: string | null;
  complaintReason: string;
  status: CertificateSubmissionComplaintStatus;
  statusLabel?: string;
  reviewerId?: number | null;
  reviewerName?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  rejectionReason?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}
