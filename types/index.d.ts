import PocketBase from 'pocketbase';
export type UserRole = 'Applicant' | 'Company' | 'recruiter' | 'billing' | 'owner';
export interface UserRecord extends PocketBase.models.Record {
  email: string;
  name?: string;
  role: UserRole;
  verified: boolean;
}
