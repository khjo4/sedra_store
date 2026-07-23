import { NextResponse } from 'next/server';
import { getAllOrders, createOrderSecure, createOrUpdateCustomer } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const orders = await getAllOrders();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10000');
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const session = await getSession();

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

    // إن كان مسجّلاً: استخدم بريده إن لم يُرسل بريد في النموذج
    const customerEmail =
      body.customerEmail?.trim() || session?.email || '';

    const newOrder = await createOrderSecure({
      customerName: body.customerName,
      customerEmail,
      customerPhone: body.customerPhone,
      address: body.address,
      city: body.city,
      notes: body.notes || null,
      paymentMethod: body.paymentMethod || 'cod',
      couponCode: body.couponCode || null,
      items: body.items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
      })),
    });

    // حفظ/تحديث العميل (ضيف أو مسجّل) — لا نبتلع الخطأ بصمت
    try {
      const customer = await createOrUpdateCustomer({
        id: session?.id,
        name: body.customerName,
        email: customerEmail || null,
        phone: body.customerPhone,
        address: body.address,
        city: body.city,
        totalSpent: newOrder.total,
      });
      if (!customer) {
        console.error('createOrUpdateCustomer returned null for order', newOrder.id);
      }
    } catch (customerError) {
      console.error('Error updating customer for order', newOrder.id, customerError);
    }

    return NextResponse.json(
      {
        success: true,
        id: newOrder.id,
        total: newOrder.total,
        subtotal: newOrder.subtotal,
        discount: newOrder.discount,
        shipping: newOrder.shipping,
      },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'حدث خطأ في إنشاء الطلب';
    console.error('Error creating order:', error);
    const status =
      message.includes('غير متوفر') ||
      message.includes('غير موجود') ||
      message.includes('كود الخصم') ||
      message.includes('الحد الأدنى') ||
      message.includes('كمية')
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
