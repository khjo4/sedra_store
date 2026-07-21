import { NextResponse } from 'next/server';
import { loginCustomer } from '@/lib/db';
import { createToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور مطلوبة' },
        { status: 400 }
      );
    }

    const customer = await loginCustomer(email, password);
    if (!customer) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // ✅ إنشاء التوكن
    const token = await createToken({ id: customer.id, name: customer.name, email: customer.email });

    // ✅ محاولة حفظ الجلسة في cookies (إذا اشتغلت تمام)
    try {
      const { setSession } = await import('@/lib/auth');
      await setSession({ id: customer.id, name: customer.name, email: customer.email });
    } catch (e) {
      console.log('Cookie set failed, relying on localStorage:', e);
    }

    return NextResponse.json({
      success: true,
      customer: { id: customer.id, name: customer.name, email: customer.email },
      token: token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تسجيل الدخول' },
      { status: 500 }
    );
  }
}