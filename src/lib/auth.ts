// Backend integration point: replace with real session/JWT auth system

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  role: string;
}

// Authorized Employee IDs — stored server-side only (this file is used by API routes)
// Password for each employee is their Employee ID (temporary policy)
export const AUTHORIZED_EMPLOYEES = [
  {
    employeeId: '2506400',
    password: '2506400',
    user: {
      id: 'emp-2506400',
      username: '2506400',
      name: 'Employee 2506400',
      role: 'Employee',
    },
  },
  {
    employeeId: '250441',
    password: '250441',
    user: {
      id: 'emp-250441',
      username: '250441',
      name: 'Employee 250441',
      role: 'Employee',
    },
  },
  {
    employeeId: '250254',
    password: '250254',
    user: {
      id: 'emp-250254',
      username: '250254',
      name: 'Employee 250254',
      role: 'Employee',
    },
  },
];

export function validateCredentials(
  employeeId: string,
  password: string
): AdminUser | null {
  const match = AUTHORIZED_EMPLOYEES.find(
    (c) => c.employeeId === employeeId && c.password === password
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