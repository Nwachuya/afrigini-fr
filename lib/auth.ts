import pb from './pocketbase';
import { clearServerSession, syncServerSession } from './session-client';
import { UserRole, UserRecord } from '@/types';

export async function login(email: string, password: string): Promise<UserRecord> {
  const authData = await pb.collection('users').authWithPassword(email, password);
  await syncServerSession(authData.token);
  return authData.record as unknown as UserRecord;
}

export async function register(email: string, password: string, confirmPassword: string, role: UserRole): Promise<UserRecord> {
  const userData = { email, password, passwordConfirm: confirmPassword, role, verified: false };
  const record = await pb.collection('users').create(userData);
  return record as unknown as UserRecord;
}

export async function logout() {
  pb.authStore.clear();
  await clearServerSession();
}
export function getCurrentUser() { return pb.authStore.isValid ? pb.authStore.model as unknown as UserRecord : null; }
export function getUserRole() { const u = getCurrentUser(); return u ? u.role : null; }
