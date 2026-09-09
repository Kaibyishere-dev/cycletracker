// Backend integration point: replace with real session/JWT auth system

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  role: string;
}

export const ADMIN_CREDENTIALS = [
  {
    username: 'admin.cyclecount',
    password: 'CC@dmin2026',
    user: {
      id: 'user-001',
      username: 'admin.cyclecount',
      name: 'Admin Cycle Count',
      role: 'Administrator',
    },
  },
  {
    username: 'supervisor.cc',
    password: 'Sup3rv1sor!',
    user: {
      id: 'user-002',
      username: 'supervisor.cc',
      name: 'Supervisor Cycle Count',
      role: 'Supervisor',
    },
  },
];

export function validateCredentials(
  username: string,
  password: string
): AdminUser | null {
  const match = ADMIN_CREDENTIALS.find(
    (c) => c.username === username && c.password === password
  );
  return match ? match.user : null;
}

export function saveSession(user: AdminUser): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ct_session', JSON.stringify(user));
  }
}

export function getSession(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('ct_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('ct_session');
  }
}