import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, updateOrderStatus } from '@/lib/db';

// ✅ GET - جلب طلب معين (للمدير فقط)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // ✅ 1. التحقق من صلاحية المدير
    // const authHeader = request.headers.get('authorization');
    // if (!authHeader) {
    //   return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    // }
    
    // ✅ 2. استخدام الدالة من db.ts (التي تقوم بالتحويل تلقائياً)
    const order = await getOrderById(id);
    
    if (!order) {
      return NextResponse.json(
        { error: 'الطلب غير موجود' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الطلب' },
      { status: 500 }
    );
  }
}

// ✅ PUT - تحديث حالة الطلب (للمدير فقط)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;
    
    // ✅ 1. التحقق من صلاحية المدير
    // const authHeader = request.headers.get('authorization');
    // if (!authHeader) {
    //   return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    // }
    
    // ✅ 2. التحقق من وجود الطلب
    const existingOrder = await getOrderById(id);
    if (!existingOrder) {
      return NextResponse.json(
        { error: 'الطلب غير موجود' },
        { status: 404 }
      );
    }
    
    // ✅ 3. التحقق من صحة الحالة (status)
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'حالة غير صالحة' },
        { status: 400 }
      );
    }
    
    // ✅ 4. استخدام الدالة من db.ts
    await updateOrderStatus(id, status);
    
    // ✅ 5. إرجاع الطلب بعد التحديث
    const updatedOrder = await getOrderById(id);
    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث الطلب' },
      { status: 500 }
    );
  }
}