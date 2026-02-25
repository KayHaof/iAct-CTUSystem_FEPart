export interface Activity {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  status: 'UPCOMING' | 'PENDING' | 'COMPLETED';
  actionRequired?: 'CHECK_IN' | 'SUBMIT_PROOF' | 'NONE';
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
  activities: Activity[];
  pendingProofs: Activity[];
  featuredActivities: Activity[];
  criteriaScores: CriteriaScore[];
}
