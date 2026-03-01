'use client';

let lastSyncedToken: string | null = null;
let syncingToken: string | null = null;
let syncRequest: Promise<void> | null = null;
let clearRequest: Promise<void> | null = null;

export async function syncServerSession(token: string): Promise<void> {
  if (!token) {
    return;
  }

  if (token === lastSyncedToken) {
    return;
  }

  if (syncRequest && syncingToken === token) {
    return syncRequest;
  }

  syncingToken = token;
  clearRequest = null;
  syncRequest = fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  }).then((response) => {
    if (!response.ok) {
      throw new Error('Failed to sync session.');
    }

    lastSyncedToken = token;
    return undefined;
  }).finally(() => {
    syncingToken = null;
    syncRequest = null;
  });

  return syncRequest;
}

export async function clearServerSession(): Promise<void> {
  lastSyncedToken = null;

  if (clearRequest) {
    return clearRequest;
  }

  clearRequest = fetch('/api/session', { method: 'DELETE' })
    .then(() => undefined)
    .finally(() => {
      clearRequest = null;
    });

  return clearRequest;
}
