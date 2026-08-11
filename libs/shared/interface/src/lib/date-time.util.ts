const UTC_OFFSET_PATTERN = /(Z|[+-]\d{2}:?\d{2})$/i;

/**
 * API date-time values are stored as UTC. Keep support for legacy responses
 * without an offset, while preserving the explicit UTC contract returned now.
 */
export function normalizeApiUtcDateTime(value?: string | Date | null): string | null {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (UTC_OFFSET_PATTERN.test(trimmed)) return trimmed;

  const dateTime = trimmed.includes(' ') ? trimmed.replace(' ', 'T') : trimmed;
  return `${dateTime}Z`;
}

export function parseApiUtcDateTime(value?: string | Date | null): Date | null {
  if (!value) return null;

  const parsed =
    value instanceof Date
      ? new Date(value.getTime())
      : new Date(normalizeApiUtcDateTime(value) || '');

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Convert one browser-local datetime value to the UTC contract sent to the API. */
export function toApiUtcDateTime(value?: string | Date | null): string | null {
  if (!value) return null;

  const parsed = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/** Convert an API UTC value to the browser-local datetime-local input format. */
export function toLocalDateTimeInput(value?: string | null): string {
  const parsed = parseApiUtcDateTime(value);
  if (!parsed) return '';

  const pad = (part: number) => String(part).padStart(2, '0');
  return (
    [parsed.getFullYear(), pad(parsed.getMonth() + 1), pad(parsed.getDate())].join('-') +
    `T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`
  );
}

/** Format a date-only value without letting UTC conversion change its calendar day. */
export function toLocalDateInput(value?: string | Date | null): string {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const parsed = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';

  const pad = (part: number) => String(part).padStart(2, '0');
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
}

export interface ApiActivityDateFields {
  registrationStart?: string | null;
  registrationEnd?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  handledAt?: string | Date | null;
  schedules?: Array<{ startTime?: string | null; endTime?: string | null }>;
  locationBookings?: Array<{ startTime?: string | null; endTime?: string | null }>;
}

/** Normalize all date-time fields of an activity response once at the API boundary. */
export function normalizeActivityDateFields<T extends ApiActivityDateFields>(activity: T): T {
  return {
    ...activity,
    registrationStart: normalizeApiUtcDateTime(activity.registrationStart),
    registrationEnd: normalizeApiUtcDateTime(activity.registrationEnd),
    startDate: normalizeApiUtcDateTime(activity.startDate),
    endDate: normalizeApiUtcDateTime(activity.endDate),
    createdAt: normalizeApiUtcDateTime(activity.createdAt),
    updatedAt: normalizeApiUtcDateTime(activity.updatedAt),
    handledAt: normalizeApiUtcDateTime(activity.handledAt),
    schedules: activity.schedules?.map((schedule) => ({
      ...schedule,
      startTime: normalizeApiUtcDateTime(schedule.startTime),
      endTime: normalizeApiUtcDateTime(schedule.endTime),
    })),
    locationBookings: activity.locationBookings?.map((booking) => ({
      ...booking,
      startTime: normalizeApiUtcDateTime(booking.startTime),
      endTime: normalizeApiUtcDateTime(booking.endTime),
    })),
  } as T;
}

export interface ApiRegistrationDateFields {
  registeredAt?: string | null;
  attendedAt?: string | null;
  checkoutAt?: string | null;
  absenceReviewedAt?: string | null;
  attendanceSessions?: Array<{
    scheduleStartTime?: string | null;
    scheduleEndTime?: string | null;
    checkinTime?: string | null;
    checkoutTime?: string | null;
  }>;
}

export function normalizeRegistrationDateFields<T extends object>(registration: T): T {
  const dateFields = registration as T & ApiRegistrationDateFields;

  return {
    ...registration,
    registeredAt: normalizeApiUtcDateTime(dateFields.registeredAt),
    attendedAt: normalizeApiUtcDateTime(dateFields.attendedAt),
    checkoutAt: normalizeApiUtcDateTime(dateFields.checkoutAt),
    absenceReviewedAt: normalizeApiUtcDateTime(dateFields.absenceReviewedAt),
    attendanceSessions: dateFields.attendanceSessions?.map((session) => ({
      ...session,
      scheduleStartTime: normalizeApiUtcDateTime(session.scheduleStartTime),
      scheduleEndTime: normalizeApiUtcDateTime(session.scheduleEndTime),
      checkinTime: normalizeApiUtcDateTime(session.checkinTime),
      checkoutTime: normalizeApiUtcDateTime(session.checkoutTime),
    })),
  } as T;
}
