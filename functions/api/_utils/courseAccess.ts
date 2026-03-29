/**
 * Determines the current access phase and price for a premium course,
 * and whether the user can access it for free.
 */

export type CoursePhase =
  | 'standard'
  | 'premium_launch'
  | 'premium_reduced'
  | 'premium_included';

export interface CourseAccessInfo {
  phase: CoursePhase;
  /** Price in cents for the current phase (null if included/standard) */
  priceCents: number | null;
  /** True if the user gets free access (paid_member/admin or phase=included) */
  isFree: boolean;
  /** True if the course requires purchase */
  requiresPurchase: boolean;
}

interface PremiumCourseFields {
  isPremium?: boolean;
  premiumLaunchDate?: string | null;
  premiumLaunchPriceCents?: number | null;
  premiumReducedPriceCents?: number | null;
  premiumReducedAfterDays?: number | null;
  premiumIncludedAfterDays?: number | null;
}

function daysSince(isoDate: string): number {
  const launch = new Date(isoDate).getTime();
  const now = Date.now();
  return Math.floor((now - launch) / (1000 * 60 * 60 * 24));
}

export function getCourseAccess(
  course: PremiumCourseFields,
  userRole: string | null,
): CourseAccessInfo {
  const isAdminOrMember = userRole === 'paid_member' || userRole === 'admin';

  if (!course.isPremium) {
    return { phase: 'standard', priceCents: null, isFree: true, requiresPurchase: false };
  }

  const launchDate = course.premiumLaunchDate;
  const launchPrice = course.premiumLaunchPriceCents ?? 49700;
  const reducedPrice = course.premiumReducedPriceCents ?? 24700;
  const reducedAfterDays = course.premiumReducedAfterDays ?? 90;
  const includedAfterDays = course.premiumIncludedAfterDays ?? 180;

  if (!launchDate) {
    // Premium but no launch date — treat as not yet available
    return { phase: 'premium_launch', priceCents: launchPrice, isFree: false, requiresPurchase: true };
  }

  const days = daysSince(launchDate);

  let phase: CoursePhase;
  let priceCents: number | null;

  if (days >= includedAfterDays) {
    phase = 'premium_included';
    priceCents = null;
  } else if (days >= reducedAfterDays) {
    phase = 'premium_reduced';
    priceCents = reducedPrice;
  } else {
    phase = 'premium_launch';
    priceCents = launchPrice;
  }

  const isFree = phase === 'premium_included' || isAdminOrMember;
  const requiresPurchase = !isFree;

  return { phase, priceCents, isFree, requiresPurchase };
}

export function formatCoursePrice(cents: number): string {
  return `$${Math.round(cents / 100)}`;
}
