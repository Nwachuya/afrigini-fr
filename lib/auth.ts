import pb from './pocketbase';
import { clearServerSession, syncServerSession } from './session-client';
import { UserRole, UserRecord } from '@/types';

const SESSION_SYNC_ERROR_PREFIX = 'APP_SESSION_SYNC_FAILED';
const REGISTRATION_COMPLETED_PREFIX = 'REGISTRATION_COMPLETED';

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim().length > 0
    ? error.message
    : fallback;
}

async function finalizeClientSession(token: string): Promise<void> {
  try {
    await syncServerSession(token);
  } catch (error) {
    pb.authStore.clear();
    const details = getErrorMessage(error, 'Failed to sync session.');
    throw new Error(`${SESSION_SYNC_ERROR_PREFIX}: ${details}`);
  }
}

export async function login(email: string, password: string): Promise<UserRecord> {
  const authData = await pb.collection('users').authWithPassword(email, password);
  await finalizeClientSession(authData.token);
  return authData.record as unknown as UserRecord;
}

export async function register(email: string, password: string, confirmPassword: string, role: UserRole): Promise<UserRecord> {
  const userData = { email, password, passwordConfirm: confirmPassword, role, verified: false };
  await pb.collection('users').create(userData);

  try {
    return await login(email, password);
  } catch (error) {
    const details = getErrorMessage(error, 'Unable to sign in after registration.');
    throw new Error(
      `${REGISTRATION_COMPLETED_PREFIX}: Your account was created, but the automatic sign-in step failed. ${details}`
    );
  }
}

export async function logout() {
  pb.authStore.clear();
  await clearServerSession();
}
export function getCurrentUser() { return pb.authStore.isValid ? pb.authStore.model as unknown as UserRecord : null; }
export function getUserRole() { const u = getCurrentUser(); return u ? u.role : null; }
export function isSessionSyncError(error: unknown): boolean {
  return error instanceof Error && error.message.startsWith(SESSION_SYNC_ERROR_PREFIX);
}
export function isRegistrationCompletedError(error: unknown): boolean {
  return error instanceof Error && error.message.startsWith(REGISTRATION_COMPLETED_PREFIX);
}
