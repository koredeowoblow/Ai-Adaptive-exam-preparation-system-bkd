/**
 * Academic Level Configuration
 *
 * theoryCap:  Maximum number of THEORY questions allowed in a single session.
 *             Doubles each level (2 → 4 → 8 → 16), giving higher-year students
 *             progressively more free-response practice.
 *
 * totalCap:   Maximum total questions allowed in a single session.
 *             Kept FLAT at 40 for all levels - this ties directly to the per-question
 *             timer budget (~60-120 s/question), meaning a 40-question session already
 *             runs 40-80 minutes. An exponential totalCap would create unrealistic
 *             multi-hour sittings at 300L/400L/500L.
 *
 * MIXED mode note: For MIXED sessions, the theory component is resolved as
 *   Math.min(levelConfig.theoryCap, Math.floor(allowedTotal / 2))
 * This means theory can reach up to the full theoryCap (provided allowedTotal is
 * large enough), while never exceeding half the session. At 100L with 10 questions
 * this caps theory at 2; at 400L/500L with 40 questions it allows up to 16 theory items.
 */
export const ACADEMIC_LEVELS = {
  '100L': { theoryCap: 2,  totalCap: 40 },
  '200L': { theoryCap: 4,  totalCap: 40 },
  '300L': { theoryCap: 8,  totalCap: 40 },
  '400L': { theoryCap: 16, totalCap: 40 },
  '500L': { theoryCap: 16, totalCap: 40 },
} as const;

export type AcademicLevel = keyof typeof ACADEMIC_LEVELS;

export const DEFAULT_LEVEL: AcademicLevel = '100L';

/**
 * Returns the caps for a given level, falling back to 100L if the level is unknown.
 */
export function getLevelConfig(level?: string) {
  return ACADEMIC_LEVELS[(level as AcademicLevel) ?? DEFAULT_LEVEL] ?? ACADEMIC_LEVELS[DEFAULT_LEVEL];
}
