export interface ComplaintResponse {
  id: number;
  registrationId: number;
  activityId: number;
  activityTitle: string;
  detail: string;
  evidenceUrl?: string | null;
  response?: string | null;
  status: number;
  statusLabel: string;
  resolvedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ComplaintEligibleActivity {
  registrationId: number;
  activityId: number;
  activityTitle: string;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  checkinTime?: string | null;
  checkoutTime?: string | null;
  complaint?: ComplaintResponse | null;
}

export interface ComplaintRequest {
  registrationId: number;
  detail: string;
  evidenceUrl?: string | null;
}
