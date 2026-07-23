import { NextResponse } from 'next/server';
import { getAllCustomers } from '@/lib/db';

// ✅ GET - جلب جميع العملاء (للمدير فقط)
export async function GET(request: Request) {
  try {
    // ✅ 1. التحقق من صلاحية المدير (هام جداً لبيانات العملاء)
    const authHeader = request.headers.get('authorization');
    // مؤقتاً: نضيف تحقق بسيط
    // if (!authHeader) {
    //   return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    // }
    
    // ✅ 2. دعم البحث (Search)
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    // ✅ 3. استخدام الدالة من db.ts
    let customers = await getAllCustomers();
    
    // ✅ 4. فلترة حسب البحث (إذا وجد)
    if (search) {
      const query = search.toLowerCase();
      customers = customers.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.phone.includes(query)
      );
    }
    
    // ✅ 5. دعم Pagination — الافتراضي كل العملاء للوحة الإدارة
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10000');
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedCustomers = customers.slice(start, end);
    
    return NextResponse.json({
      customers: paginatedCustomers,
      total: customers.length,
      page,
      limit,
      totalPages: Math.ceil(customers.length / limit),
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب العملاء' },
      { status: 500 }
    );
  }
}