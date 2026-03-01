import PocketBase from 'pocketbase';
import { clearServerSession, syncServerSession } from './session-client';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

const pb = new PocketBase(PB_URL);

function syncBrowserSession() {
  if (pb.authStore.isValid && pb.authStore.token) {
    void syncServerSession(pb.authStore.token).catch(() => {});
    return;
  }

  void clearServerSession().catch(() => {});
}

if (typeof window !== 'undefined') {
  pb.authStore.onChange(syncBrowserSession);
  syncBrowserSession();
}

export default pb;
