import { NextRequest, NextResponse } from 'next/server';
import { validateCredentials } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username) {
      return NextResponse.json({ error: 'Employee ID wajib diisi.' }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: 'Password wajib diisi.' }, { status: 400 });
    }

    const user = validateCredentials(username, password);

    if (!user) {
      return NextResponse.json({ error: 'Employee ID atau password salah.' }, { status: 401 });
    }

    const response = NextResponse.json({ user });

    // Use sameSite:'none' + secure:true so the cookie works in cross-origin
    // iframe environments (Rocket preview, Vercel production).
    // On plain localhost (http) sameSite:'none' requires secure:true which
    // won't work, so we fall back to 'lax' only when explicitly on localhost.
    const isLocalhost =
      request.headers.get('host')?.startsWith('localhost') ||
      request.headers.get('host')?.startsWith('127.0.0.1');

    response.cookies.set('ct_session', JSON.stringify(user), {
      httpOnly: true,
      secure: !isLocalhost,
      sameSite: isLocalhost ? 'lax' : 'none',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (err: any) {
    console.error('Login exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
