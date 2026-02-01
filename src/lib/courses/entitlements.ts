import type { Course, CoursePriceTier } from "./types";

/**
 * Course entitlement logic - ready for backend enforcement
 * 
 * Business rules:
 * - Courses become "included" for members 6 months after release
 * - Price tiers: 497 (new), 247 (3-6 months), included (6+ months)
 * - Admins always have access
 */

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;
const THREE_MONTHS_MS = 3 * 30 * 24 * 60 * 60 * 1000;

/**
 * Compute the price tier based on release date
 */
export function computePriceTier(releaseDate?: string): CoursePriceTier {
  if (!releaseDate) return "included";
  
  const releaseMs = new Date(releaseDate).getTime();
  const now = Date.now();
  const ageMs = now - releaseMs;
  
  if (ageMs >= SIX_MONTHS_MS) return "included";
  if (ageMs >= THREE_MONTHS_MS) return "247";
  return "497";
}

/**
 * Check if a course is included for members based on release date
 */
export function isIncludedForMembers(releaseDate?: string): boolean {
  if (!releaseDate) return true;
  
  const releaseMs = new Date(releaseDate).getTime();
  const now = Date.now();
  return (now - releaseMs) >= SIX_MONTHS_MS;
}

/**
 * Calculate when a course will become included
 */
export function getInclusionDate(releaseDate?: string): Date | null {
  if (!releaseDate) return null;
  
  const releaseMs = new Date(releaseDate).getTime();
  return new Date(releaseMs + SIX_MONTHS_MS);
}

/**
 * Format the inclusion date for display
 */
export function formatInclusionDate(releaseDate?: string): string | null {
  const inclusionDate = getInclusionDate(releaseDate);
  if (!inclusionDate) return null;
  
  // If already included, return null
  if (inclusionDate.getTime() <= Date.now()) return null;
  
  return inclusionDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Get the display label for a price tier
 */
export function getPriceTierLabel(tier?: CoursePriceTier): string {
  switch (tier) {
    case "497": return "$497";
    case "247": return "$247";
    case "included":
    default:
      return "Included";
  }
}

/**
 * Check if a user has access to a course
 * 
 * @param course - The course to check
 * @param isAdmin - Whether the user is an admin
 * @param isMember - Whether the user is a member
 * @param purchasedCourseIds - Array of course IDs the user has purchased (for future Stripe integration)
 */
export function hasAccessToCourse(
  course: Course,
  isAdmin: boolean,
  isMember: boolean,
  purchasedCourseIds: string[] = []
): boolean {
  // Admins always have access
  if (isAdmin) return true;
  
  // Not a member, no access
  if (!isMember) return false;
  
  // Member with purchased course
  if (purchasedCourseIds.includes(course.id)) return true;
  
  // Member with included course
  return course.priceTier === "included" || isIncludedForMembers(course.releaseDate);
}

/**
 * Enrich a course with computed entitlement fields
 */
export function enrichCourseWithEntitlements(course: Course): Course {
  const priceTier = course.priceTier || computePriceTier(course.releaseDate);
  const isIncluded = isIncludedForMembers(course.releaseDate);
  
  return {
    ...course,
    priceTier,
    isIncludedForMembers: isIncluded
  };
}
