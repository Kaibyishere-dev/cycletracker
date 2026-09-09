import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Logout exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
