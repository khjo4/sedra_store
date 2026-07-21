import { NextResponse } from 'next/server';
import { getAllOrders, createOrder } from '@/lib/db';
import { query } from '@/lib/db';

// ✅ GET - جلب جميع الطلبات (للمدير فقط)
export async function GET(request: Request) {
  try {
    const orders = await getAllOrders();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedOrders = orders.slice(start, end);
    
    return NextResponse.json({
      orders: paginatedOrders,
      total: orders.length,
      page,
      limit,
      totalPages: Math.ceil(orders.length / limit),
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الطلبات' },
      { status: 500 }
    );
  }
}

// ✅ POST - إنشاء طلب جديد (مع تحديث المخزون)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // ✅ 1. التحقق من البيانات الأساسية
    if (!body.customerName || !body.customerPhone || !body.address || !body.city) {
      return NextResponse.json(
        { error: 'الاسم ورقم الهاتف والعنوان والمدينة حقول مطلوبة' },
        { status: 400 }
      );
    }
    
    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'الطلب يجب أن يحتوي على منتجات' },
        { status: 400 }
      );
    }
    
    // ✅ 2. التحقق من توفر المخزون لكل منتج
    for (const item of body.items) {
      const result = await query(
        'SELECT stock FROM products WHERE id = ?',
        [item.productId]
      ) as any[];
      
      const product = result[0];
      if (!product) {
        return NextResponse.json(
          { error: `المنتج غير موجود: ${item.productId}` },
          { status: 400 }
        );
      }
      
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `المنتج ${item.name || item.productId} غير متوفر بالكمية المطلوبة. المتوفر: ${product.stock}` },
          { status: 400 }
        );
      }
    }
    
    // ✅ 3. إنشاء الطلب
    const newOrder = await createOrder(body);
    
    // ✅ 4. تحديث المخزون (تقليل الكمية)
    for (const item of body.items) {
      await query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.productId]
      );
    }
    
    // ✅ 5. تحديث معلومات العميل
   // ✅ 5. تحديث معلومات العميل
try {
  console.log('📦 Customer data from order:', {
    name: body.customerName,
    email: body.customerEmail,
    phone: body.customerPhone,
    address: body.address,
    city: body.city,
    totalSpent: body.total || 0
  });
  
  const { createOrUpdateCustomer } = await import('@/lib/db');
  const result = await createOrUpdateCustomer({
    name: body.customerName,
    email: body.customerEmail || body.customerPhone,     phone: body.customerPhone,
    address: body.address,
    city: body.city,
    totalSpent: body.total || 0,
  });
  
  console.log('✅ Customer update result:', result);
} catch (customerError) {
  console.error('❌ Error updating customer:', customerError);
}

    return NextResponse.json({ success: true, id: newOrder.id }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الطلب' },
      { status: 500 }
    );
  }
}
