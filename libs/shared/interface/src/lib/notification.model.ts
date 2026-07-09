/**
 * Notification type mapping theo backend.
 *   1 = Thành công / Approved / Positive
 *   2 = Thông tin / Cập nhật / Cần xem
 *   3 = Cần chú ý / Rejected / Cancelled / Urgent
 *  99 = System / Admin account event
 */
export type NotificationType = 1 | 2 | 3 | 99;

export interface NotificationItem {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  activityId?: number;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  sourceEventId?: string;
  sourceTopic?: string;
}

export interface NotificationPage {
  pageNumber: number;
  totalPage: number;
  totalRows: number;
  pageSize: number;
  data: NotificationItem[];
  last?: boolean;
}

export interface NotificationQuery {
  page?: number;
  size?: number;
  isRead?: boolean;
}

export interface UrgentNotificationRequest {
  title: string;
  message: string;
  priority?: number;
  targetType: 'ALL_DEPARTMENT' | 'ACTIVITY' | 'CLASS';
  targetId?: number;
  activityId?: number;
  userIds?: string[];
}

export interface NotificationPreferenceSettings {
  newActivityAlert?: boolean;
  reminderAlert?: boolean;
  reminderDaysBefore?: number;
}

/** Helper: label tiếng Việt và màu cho từng notification type */
export const NOTIFICATION_TYPE_CONFIG: Record<
  NotificationType,
  { label: string; colorClass: string; bgClass: string; icon: string }
> = {
  1: {
    label: 'Thành công',
    colorClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50',
    icon: 'bi bi-check2-circle',
  },
  2: {
    label: 'Thông tin',
    colorClass: 'text-blue-700',
    bgClass: 'bg-blue-50',
    icon: 'bi bi-info-circle',
  },
  3: {
    label: 'Cần chú ý',
    colorClass: 'text-red-700',
    bgClass: 'bg-red-50',
    icon: 'bi bi-exclamation-triangle',
  },
  99: {
    label: 'Hệ thống',
    colorClass: 'text-slate-700',
    bgClass: 'bg-slate-100',
    icon: 'bi bi-gear',
  },
};
