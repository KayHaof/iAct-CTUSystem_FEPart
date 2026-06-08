export type Activity = ActivityItem;

export interface ActivityItem {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  status: 'UPCOMING' | 'PENDING' | 'COMPLETED' | 'active' | 'upcoming';
  actionRequired?: 'CHECK_IN' | 'SUBMIT_PROOF' | 'REGISTER' | 'NONE';
  department?: string;
  thumbBg?: string;
  thumbIcon?: string;
  badgeClass?: string;
}

export interface ProofItem {
  id: string;
  title: string;
  date: string;
  deadline?: string;
}

export interface CriteriaScore {
  name: string;
  current: number;
  max: number;
  color: string;
}

export interface DashboardData {
  totalScore: number;
  rank: string;
  socialDays: number;
  upcomingCount: number;
  activities: ActivityItem[];
  pendingProofs: ProofItem[];
  featuredActivities: ActivityItem[];
  criteriaScores: CriteriaScore[];
}
