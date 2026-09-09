import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const isLocalhost =
      request.headers.get('host')?.startsWith('localhost') ||
      request.headers.get('host')?.startsWith('127.0.0.1');

    const response = NextResponse.json({ success: true });
    response.cookies.set('ct_session', '', {
      httpOnly: true,
      secure: !isLocalhost,
      sameSite: isLocalhost ? 'lax' : 'none',
      path: '/',
      maxAge: 0,
    });
    return response;
  } catch (err: any) {
    console.error('Logout exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
