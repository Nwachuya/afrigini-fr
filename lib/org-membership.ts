import pb from '@/lib/pocketbase';
import type { OrgMemberRecord, UserRecord } from '@/types';

export function getAuthenticatedUser(): UserRecord | null {
  return pb.authStore.isValid ? (pb.authStore.model as unknown as UserRecord) : null;
}

export async function getCurrentOrgMembership(
  userId: string,
  expand?: string
): Promise<OrgMemberRecord | null> {
  try {
    return await pb.collection('org_members').getFirstListItem(
      `user = "${userId}"`,
      {
        requestKey: null,
        ...(expand ? { expand } : {}),
      }
    ) as unknown as OrgMemberRecord;
  } catch {
    return null;
  }
}
