import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authCookie = request.cookies.get('pb_auth');
  
  const debug = {
    cookieExists: !!authCookie,
    cookieValue: authCookie?.value?.substring(0, 100) + '...',
    allCookies: request.cookies.getAll().map(c => c.name),
  };
  
  // Try to parse
  if (authCookie?.value) {
    try {
      let val = authCookie.value;
      if (val.startsWith('%7B')) {
        val = decodeURIComponent(val);
      }
      const parsed = JSON.parse(val);
      debug['parsed'] = {
        hasToken: !!parsed.token,
        hasModel: !!parsed.model,
        role: parsed.model?.role,
        email: parsed.model?.email,
      };
    } catch (e) {
      debug['parseError'] = e.message;
    }
  }
  
  return NextResponse.json(debug, { status: 200 });
}