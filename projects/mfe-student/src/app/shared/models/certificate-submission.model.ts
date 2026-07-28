export type CertificateSubmissionStatus = 0 | 1 | 2 | 3;

export interface CertificateSubmissionRequest {
  imageUrl: string;
  semesterId?: number | null;
  studentNote?: string | null;
}

export interface CertificateSubmission {
  id: number;
  studentId?: number;
  studentCode?: string;
  studentName?: string;
  departmentId?: number;
  semesterId?: number;
  semesterName?: string;
  imageUrl: string;
  studentNote?: string | null;
  rawText?: string | null;
  extractedJson?: string | null;
  extractedStudentName?: string | null;
  extractedStudentCode?: string | null;
  certificateTitle?: string | null;
  issuer?: string | null;
  issuedDate?: string | null;
  achievement?: string | null;
  suggestedCategoryId?: number | null;
  suggestedCategoryName?: string | null;
  suggestedPoint?: number | null;
  suggestionReason?: string | null;
  aiConfidence?: number | null;
  aiWarnings?: string[];
  needsReview?: boolean | null;
  status: CertificateSubmissionStatus;
  statusLabel?: string;
  reviewerId?: number | null;
  reviewerName?: string | null;
  reviewedAt?: string | null;
  approvedCategoryId?: number | null;
  approvedCategoryName?: string | null;
  approvedPoint?: number | null;
  reviewNote?: string | null;
  rejectionReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
