import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

// GET - جلب جميع العملاء
export async function GET() {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute(
      'SELECT * FROM customers ORDER BY created_at DESC'
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب العملاء' },
      { status: 500 }
    );
  }
}