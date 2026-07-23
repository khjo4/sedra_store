import { cookies } from 'next/headers';
import {
  createToken,
  verifyToken,
  createAdminToken,
  verifyAdminToken,
  type SessionUser,
  type AdminSession,
} from '@/lib/auth-jwt';

export type { SessionUser, AdminSession };
export {
  createToken,
  verifyToken,
  createAdminToken,
  verifyAdminToken,
};

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
};

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get('customer_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function setSession(user: SessionUser) {
  const token = await createToken(user);
  (await cookies()).set('customer_token', token, {
    ...COOKIE_OPTS,
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function clearSession() {
  (await cookies()).delete('customer_token');
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get('admin_token')?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function setAdminSession(admin: {
  id: string;
  name: string;
  email: string;
}) {
  const token = await createAdminToken(admin);
  (await cookies()).set('admin_token', token, {
    ...COOKIE_OPTS,
    secure: process.env.NODE_ENV === 'production',
  });
  return token;
}

export async function clearAdminSession() {
  (await cookies()).delete('admin_token');
}
