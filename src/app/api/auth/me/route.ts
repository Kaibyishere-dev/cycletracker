import { NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth-server';

export async function GET() {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ user: session });
  } catch (err: any) {
    console.error('GET /api/auth/me exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
