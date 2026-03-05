function capitalizeSegment(segment: string): string {
  if (!segment) {
    return '';
  }

  return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
}

export function toProperCaseNamePart(value?: string | null): string {
  if (typeof value !== 'string') {
    return '';
  }

  const cleaned = value.trim().replace(/\s+/g, ' ');
  if (!cleaned) {
    return '';
  }

  return cleaned
    .split(' ')
    .map((word) =>
      word
        .split(/([-'’])/)
        .map((part, index) => (index % 2 === 1 ? part : capitalizeSegment(part)))
        .join('')
    )
    .join(' ');
}

export function formatCandidateFullName(
  firstName?: string | null,
  lastName?: string | null,
  fallback = 'Candidate'
): string {
  const fullName = [toProperCaseNamePart(firstName), toProperCaseNamePart(lastName)]
    .filter(Boolean)
    .join(' ')
    .trim();

  return fullName || fallback;
}
