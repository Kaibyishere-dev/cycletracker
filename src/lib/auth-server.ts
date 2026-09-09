// Server-only auth helpers — do NOT import this in client components
import { cookies } from 'next/headers';
import type { AdminUser } from './auth';

export async function getSessionFromCookie(): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get('ct_session')?.value;
    if (!raw) return null;
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}
