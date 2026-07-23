import { NextResponse } from 'next/server';
import { registerCustomer, getCustomerByEmail } from '@/lib/db';
import { createToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبة' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' },
        { status: 400 }
      );
    }

    const existingCustomer = await getCustomerByEmail(email);
    if (existingCustomer) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 400 }
      );
    }

    const customer = await registerCustomer({ name, email, phone, password });
    const token = await createToken({
      id: customer.id,
      name: customer.name,
      email: customer.email,
    });

    const response = NextResponse.json(
      {
        success: true,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
        },
      },
      { status: 201 }
    );

    response.cookies.set('customer_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الحساب' },
      { status: 500 }
    );
  }
}
