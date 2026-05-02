import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET() {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute('SELECT * FROM orders ORDER BY created_at DESC');
    
    // تحويل البيانات بشكل صحيح
    const safeRows = (rows as any[]).map(row => {
      // تحويل items من JSON إلى مصفوفة
      let itemsArray = [];
      try {
        itemsArray = typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []);
      } catch (e) {
        console.error('Error parsing items:', e);
        itemsArray = [];
      }
      
      return {
        id: row.id,
        customerName: row.customer_name || 'غير معروف',
        customerEmail: row.customer_email,
        customerPhone: row.customer_phone || 'غير متوفر',
        address: row.address,
        city: row.city,
        subtotal: parseFloat(row.subtotal) || 0,
        discount: parseFloat(row.discount) || 0,
        shipping: parseFloat(row.shipping) || 0,
        total: parseFloat(row.total) || 0,
        status: row.status,
        paymentMethod: row.payment_method,
        couponCode: row.coupon_code,
        notes: row.notes,
        items: itemsArray,  // ✅ تأكدي أن items مصفوفة
        createdAt: row.created_at || row.createdAt,
        updatedAt: row.updated_at || row.updatedAt,
      };
    });
    
    return NextResponse.json(safeRows);
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
    console.log('📦 Received order:', body);
    
    const connection = await getConnection();
    
    const {
      id, customerName, customerEmail, customerPhone,
      address, city, subtotal, discount, shipping, total,
      status, paymentMethod, couponCode, notes, items
    } = body;
    
    // ✅ التأكد من وجود جميع البيانات
    const itemsArray = Array.isArray(items) && items.length > 0 ? items : [];
    
    // ✅ التأكد من وجود اسم العميل
    const finalCustomerName = customerName || 'غير معروف';
    const finalCity = city || 'غير محدد';
    
    await connection.execute(
      `INSERT INTO orders 
        (id, customer_name, customer_email, customer_phone, address, city, 
         subtotal, discount, shipping, total, status, payment_method, coupon_code, notes, items)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, finalCustomerName, customerEmail || null, customerPhone,
        address || '', finalCity, subtotal || 0, discount || 0, shipping || 0, total || 0,
        status || 'pending', paymentMethod || 'cod', couponCode || null, notes || null,
        JSON.stringify(itemsArray)
      ]
    );
    
    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الطلب' },
      { status: 500 }
    );
  }
}