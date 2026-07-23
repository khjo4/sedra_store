import { SignJWT, jwtVerify } from 'jose';

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required');
    }
    return new TextEncoder().encode('dev-only-secret-key-minimum-32-chars!');
  }
  return new TextEncoder().encode(secret);
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

export interface AdminSession {
  id: string;
  name: string;
  email: string;
  role: 'admin';
}

export async function createToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: 'customer',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(getSecretKey());
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.role === 'admin') return null;
    return {
      id: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

export async function createAdminToken(admin: {
  id: string;
  name: string;
  email: string;
}): Promise<string> {
  return new SignJWT({
    userId: admin.id,
    email: admin.email,
    name: admin.name,
    role: 'admin',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(getSecretKey());
}

export async function verifyAdminToken(
  token: string
): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.role !== 'admin') return null;
    return {
      id: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: 'admin',
    };
  } catch {
    return null;
  }
}
