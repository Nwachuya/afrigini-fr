import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

const pb = new PocketBase(PB_URL);

// Only run cookie logic on client side
if (typeof window !== 'undefined') {
  // Load auth from cookie on init
  pb.authStore.loadFromCookie(document.cookie);
  
  // Immediately save current auth state to cookie (in case it was from localStorage)
  document.cookie = pb.authStore.exportToCookie({ 
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
  });

  // Save auth to cookie on every change
  pb.authStore.onChange(() => {
    document.cookie = pb.authStore.exportToCookie({ 
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    });
  });
}

export default pb;