import type { CandidateProfileRecord } from '@/types';

function hasText(value?: string | null): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function hasCandidateResume(profile: CandidateProfileRecord | null): boolean {
  if (!profile) {
    return false;
  }

  return Boolean(
    hasText(profile.resume) ||
    hasText(profile.resume_generated_pdf) ||
    hasText(profile.resume_generated) ||
    hasText(profile.resume_generated_redacted)
  );
}

export function getApplicantProfileBanner(profile: CandidateProfileRecord | null) {
  if (!profile) {
    return {
      show: true,
      title: 'Complete Your Profile',
      message: 'Create your applicant profile with a headline and resume to increase your chances of getting noticed.',
    };
  }

  const missingParts: string[] = [];

  if (!hasText(profile.headline)) {
    missingParts.push('headline');
  }

  if (!hasCandidateResume(profile)) {
    missingParts.push('resume');
  }

  if (missingParts.length === 0) {
    return {
      show: false,
      title: '',
      message: '',
    };
  }

  const message = missingParts.length === 2
    ? 'Add your headline and resume to increase your chances of getting noticed.'
    : `Add your ${missingParts[0]} to increase your chances of getting noticed.`;

  return {
    show: true,
    title: 'Complete Your Profile',
    message,
  };
}
