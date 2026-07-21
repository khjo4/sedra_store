import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getCustomerById } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 });
    }

    const customer = await getCustomerById(session.id);
    if (!customer) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        ordersCount: customer.ordersCount,
        totalSpent: customer.totalSpent,
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب بيانات المستخدم' },
      { status: 500 }
    );
  }
}