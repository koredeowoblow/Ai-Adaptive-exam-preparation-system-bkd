/**
 * Africa/Lagos (UTC+1) Date validation and calculation utilities.
 * Ensures zero timezone drift by treating dates as calendar YYYY-MM-DD.
 */

/**
 * Returns today's date in Africa/Lagos timezone as YYYY-MM-DD string.
 */
export function getLagosTodayString(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(new Date());
}

/**
 * Computes maximum allowed date (24 months into future) from Africa/Lagos today.
 */
export function getLagosMaxExamDateString(): string {
  const lagosToday = getLagosTodayString();
  const [year, month, day] = lagosToday.split('-').map(Number);
  const maxYear = year + 2;
  let maxDay = day;
  // Handle Feb 29 leap day edge case
  if (month === 2 && day === 29) {
    maxDay = 28;
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${maxYear}-${pad(month)}-${pad(maxDay)}`;
}

/**
 * Validates date string:
 * - Must be YYYY-MM-DD format
 * - Must be a valid calendar date
 * - Must not be in the past (compared to Africa/Lagos today)
 * - Must be within 24 months from today
 */
export function validateExamDate(dateStr: unknown): { isValid: boolean; error?: string; cleanDate?: string | null } {
  if (dateStr === null || dateStr === undefined || dateStr === '') {
    return { isValid: true, cleanDate: null };
  }

  if (typeof dateStr !== 'string') {
    return { isValid: false, error: 'Exam date must be a string in YYYY-MM-DD format.' };
  }

  const trimmed = dateStr.trim();
  const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
  if (!regex.test(trimmed)) {
    return { isValid: false, error: 'Exam date must be in YYYY-MM-DD format.' };
  }

  const [y, m, d] = trimmed.split('-').map(Number);
  const testDate = new Date(Date.UTC(y, m - 1, d));
  if (
    testDate.getUTCFullYear() !== y ||
    testDate.getUTCMonth() !== m - 1 ||
    testDate.getUTCDate() !== d
  ) {
    return { isValid: false, error: 'Exam date is not a valid calendar day.' };
  }

  const lagosToday = getLagosTodayString();
  if (trimmed < lagosToday) {
    return { isValid: false, error: 'Exam date cannot be in the past.' };
  }

  const maxDate = getLagosMaxExamDateString();
  if (trimmed > maxDate) {
    return { isValid: false, error: 'Exam date cannot be more than 24 months in the future.' };
  }

  return { isValid: true, cleanDate: trimmed };
}

/**
 * Calculates days remaining between Africa/Lagos today and the exam date.
 * Calendar-anchored to UTC midnight to avoid any daylight savings or hourly drift.
 */
export function calculateDaysRemainingInLagos(examDateStr: string): number {
  const lagosToday = getLagosTodayString();
  const [tY, tM, tD] = lagosToday.split('-').map(Number);
  const [eY, eM, eD] = examDateStr.split('-').map(Number);

  const todayMs = Date.UTC(tY, tM - 1, tD);
  const examMs = Date.UTC(eY, eM - 1, eD);

  return Math.round((examMs - todayMs) / (1000 * 60 * 60 * 24));
}

/**
 * 6:00 PM (18:00) Africa/Lagos cutoff hour for study plan start date.
 */
export const PLAN_START_CUTOFF_HOUR = 18;

/**
 * Computes Lagos startDate based on 18:00 (6 PM) cutoff rule:
 * - Before 18:00 Lagos: today (YYYY-MM-DD)
 * - At or after 18:00 Lagos: tomorrow (YYYY-MM-DD)
 */
export function calculatePlanStartDateLagos(now: Date = new Date()): string {
  const lagosHour = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Lagos',
      hour: 'numeric',
      hour12: false,
    }).format(now)
  );

  const lagosDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
  }).format(now);

  if (lagosHour < PLAN_START_CUTOFF_HOUR) {
    return lagosDateStr;
  }

  return addDaysToLagosDate(lagosDateStr, 1);
}

/**
 * Adds integer days to a YYYY-MM-DD calendar date string.
 */
export function addDaysToLagosDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1, d + days));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${target.getUTCFullYear()}-${pad(target.getUTCMonth() + 1)}-${pad(target.getUTCDate())}`;
}

/**
 * Returns integer difference (endDate - startDate) in calendar days.
 */
export function getDaysBetweenDates(startDateStr: string, endDateStr: string): number {
  const [sY, sM, sD] = startDateStr.split('-').map(Number);
  const [eY, eM, eD] = endDateStr.split('-').map(Number);
  const sMs = Date.UTC(sY, sM - 1, sD);
  const eMs = Date.UTC(eY, eM - 1, eD);
  return Math.round((eMs - sMs) / (1000 * 60 * 60 * 24));
}

/**
 * Returns English weekday name (e.g. 'Monday') for a YYYY-MM-DD date.
 */
export function getDayOfWeekName(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long' }).format(date);
}

/**
 * Derives the student's next upcoming exam date dynamically at read time.
 * Single source of truth: earliest date >= Lagos today from courseExamDates.
 * Falls back to legacy nextExamDate only if no future course dates are defined.
 */
export function deriveNextExamDate(
  courseExamDates?: Map<string, string> | Record<string, string> | null,
  legacyNextExamDate?: string | null,
  enrolledCourseIds?: (string | { toString(): string })[]
): string | null {
  const lagosToday = getLagosTodayString();
  const validFutureDates: string[] = [];

  if (courseExamDates) {
    const enrolledSet = enrolledCourseIds
      ? new Set(
          enrolledCourseIds
            .filter(Boolean)
            .map((item: any) => (item._id ? item._id.toString() : item.toString()))
        )
      : null;

    const entries =
      courseExamDates instanceof Map
        ? Array.from(courseExamDates.entries())
        : Object.entries(courseExamDates);

    for (const [courseId, dateStr] of entries) {
      if (typeof dateStr === 'string' && dateStr.trim()) {
        const cleanDate = dateStr.trim();
        // If enrolledCourseIds is provided, key must be in enrolled courses
        if (enrolledSet && !enrolledSet.has(courseId.toString())) {
          continue;
        }
        if (cleanDate >= lagosToday) {
          validFutureDates.push(cleanDate);
        }
      }
    }
  }

  if (validFutureDates.length > 0) {
    validFutureDates.sort(); // Lexicographical sort on YYYY-MM-DD
    return validFutureDates[0];
  }

  // Legacy fallback if valid and >= lagosToday
  if (
    legacyNextExamDate &&
    typeof legacyNextExamDate === 'string' &&
    legacyNextExamDate.trim() >= lagosToday
  ) {
    return legacyNextExamDate.trim();
  }

  return null;
}
