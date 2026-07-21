import { NextResponse } from 'next/server';
import { registerCustomer, getCustomerByEmail } from '@/lib/db';  // ✅ من db.ts
import { setSession } from '@/lib/auth';

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

    // التحقق من عدم وجود بريد إلكتروني مكرر
    const existingCustomer = await getCustomerByEmail(email);
    if (existingCustomer) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 400 }
      );
    }

    const customer = await registerCustomer({ name, email, phone, password });  // ✅ registerCustomer
    await setSession({ id: customer.id, name: customer.name, email: customer.email });

    return NextResponse.json(
      { success: true, customer: { id: customer.id, name: customer.name, email: customer.email } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الحساب' },
      { status: 500 }
    );
  }
}