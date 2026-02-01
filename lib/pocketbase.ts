import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

const pb = new PocketBase(PB_URL);

// Cookie helper
function setCookie(name: string, value: string, days: number = 30) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

// Only run cookie logic on client side
if (typeof window !== 'undefined') {
  // Save auth to cookie on every change
  pb.authStore.onChange(() => {
    if (pb.authStore.isValid && pb.authStore.token) {
      const cookieData = JSON.stringify({
        token: pb.authStore.token,
        model: pb.authStore.model,
      });
      setCookie('pb_auth', cookieData);
    } else {
      deleteCookie('pb_auth');
    }
  });

  // If auth exists in authStore but no cookie, set it now
  if (pb.authStore.isValid && pb.authStore.token) {
    const cookieData = JSON.stringify({
      token: pb.authStore.token,
      model: pb.authStore.model,
    });
    setCookie('pb_auth', cookieData);
  }
}

export default pb;