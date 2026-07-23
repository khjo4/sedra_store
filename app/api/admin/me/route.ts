import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }
  return NextResponse.json({
    admin: { id: admin.id, name: admin.name, email: admin.email },
  });
}
