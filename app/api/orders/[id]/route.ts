import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

// PUT - تحديث حالة الطلب
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;
    
    const connection = await getConnection();
    
    await connection.execute(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, id]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث الطلب' },
      { status: 500 }
    );
  }
}

// GET - جلب طلب معين
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const connection = await getConnection();
    const [rows] = await connection.execute(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );
    
    const orders = rows as any[];
    if (orders.length === 0) {
      return NextResponse.json(
        { error: 'الطلب غير موجود' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(orders[0]);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الطلب' },
      { status: 500 }
    );
  }
}