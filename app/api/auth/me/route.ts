import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getCustomerById } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      // 200 بدل 401 حتى لا يملأ Console أخطاء للزائر
      return NextResponse.json({ user: null });
    }

    const customer = await getCustomerById(session.id);
    if (!customer) {
      return NextResponse.json({ user: null });
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
