import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

// GET - جلب جميع الكوبونات
export async function GET() {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute('SELECT * FROM coupons');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الكوبونات' },
      { status: 500 }
    );
  }
}

// POST - إضافة كوبون جديد
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const connection = await getConnection();
    
    const { code, type, value, minPurchase, maxUses, expiresAt, active } = body;
    
    await connection.execute(
      `INSERT INTO coupons (id, code, type, value, min_purchase, max_uses, expires_at, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [`COUP-${Date.now()}`, code.toUpperCase(), type, value, minPurchase || 0, maxUses || 100, expiresAt, active !== false]
    );
    
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إضافة الكوبون' },
      { status: 500 }
    );
  }
}