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
