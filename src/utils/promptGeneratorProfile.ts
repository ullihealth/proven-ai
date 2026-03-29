export interface UserProfile {
  ageRange: string;
  location: string;
  workRole: string;
  employmentStatus: string;
  industry: string;
  mainGoal: string;
  aiExperience: string;
}

const STORAGE_KEY = 'pg_user_profile';

export function getProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function clearProfile(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function profileToText(profile: UserProfile): string {
  const parts = [];
  if (profile.ageRange) parts.push(`Age range: ${profile.ageRange}`);
  if (profile.location) parts.push(`Location: ${profile.location}`);
  if (profile.workRole) parts.push(`Work role: ${profile.workRole}`);
  if (profile.employmentStatus) parts.push(`Employment status: ${profile.employmentStatus}`);
  if (profile.industry) parts.push(`Industry: ${profile.industry}`);
  if (profile.mainGoal) parts.push(`Current main goal: ${profile.mainGoal}`);
  if (profile.aiExperience) parts.push(`AI experience level: ${profile.aiExperience}`);
  return parts.join('\n');
}
