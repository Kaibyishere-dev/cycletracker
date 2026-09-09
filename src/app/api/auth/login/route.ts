import { NextRequest, NextResponse } from 'next/server';
import { validateCredentials } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 });
    }

    const user = validateCredentials(username, password);

    if (!user) {
      return NextResponse.json({ error: 'Kredensial tidak valid' }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (err: any) {
    console.error('Login exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
