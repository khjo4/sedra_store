import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-key-minimum-32-characters-long'
);

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

export async function createToken(user: SessionUser): Promise<string> {
  const token = await new SignJWT({ userId: user.id, email: user.email, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secretKey);
  return token;
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return {
      id: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('customer_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function setSession(user: SessionUser) {
  const token = await createToken(user);
  const isProduction = process.env.NODE_ENV === 'production';
  
  (await cookies()).set('customer_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export async function clearSession() {
  (await cookies()).delete('customer_token');
}