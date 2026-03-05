import type { UserRole } from '@/types';

function normalizeOrgRole(role?: string | null): string | null {
  if (!role) {
    return null;
  }

  return role.trim().toLowerCase();
}

export function isApplicantRole(role?: UserRole | null): role is 'Applicant' {
  return role === 'Applicant';
}

export function isOrgUserRole(role?: UserRole | null): boolean {
  return !!role && role !== 'Applicant';
}

export function canAccessCandidateNamespace(role?: UserRole | null): boolean {
  return isApplicantRole(role);
}

export function canAccessOrgNamespace(role?: UserRole | null): boolean {
  return isOrgUserRole(role);
}

export function canManageJobs(role?: string | null): boolean {
  const normalizedRole = normalizeOrgRole(role);
  return normalizedRole === 'owner' || normalizedRole === 'recruiter' || normalizedRole === 'billing';
}

export function canReviewApplications(role?: string | null): boolean {
  return canManageJobs(role);
}

export function canInviteCandidates(role?: string | null): boolean {
  return canManageJobs(role);
}

export function canBrowseCandidates(role?: string | null): boolean {
  return canManageJobs(role);
}

export function canViewTeam(role?: string | null): boolean {
  const normalizedRole = normalizeOrgRole(role);
  return normalizedRole === 'owner' || normalizedRole === 'recruiter' || normalizedRole === 'billing';
}

export function canManageTeam(role?: string | null): boolean {
  return normalizeOrgRole(role) === 'owner';
}

export function canManageOrganization(role?: string | null): boolean {
  return normalizeOrgRole(role) === 'owner';
}

export function canAccessBilling(role?: string | null): boolean {
  const normalizedRole = normalizeOrgRole(role);
  return normalizedRole === 'owner' || normalizedRole === 'billing';
}

export function getDefaultOrgPath(role?: string | null): string {
  if (canAccessBilling(role) && !canManageJobs(role) && !canManageOrganization(role)) {
    return '/org/billing';
  }

  return '/org/dashboard';
}

export function getDefaultDashboardPath(
  userRole?: UserRole | null,
  orgMembershipRole?: string | null
): string {
  return isApplicantRole(userRole)
    ? '/candidates/applicant'
    : getDefaultOrgPath(orgMembershipRole);
}
