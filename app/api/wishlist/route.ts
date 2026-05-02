import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

// GET - جلب المفضلة
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerEmail = searchParams.get('email');
    
    if (!customerEmail) {
      return NextResponse.json({ error: 'البريد الإلكتروني مطلوب' }, { status: 400 });
    }
    
    const connection = await getConnection();
    const [rows] = await connection.execute(
      `SELECT w.*, p.name, p.price, p.images 
       FROM wishlist w 
       JOIN products p ON w.product_id = p.id 
       WHERE w.customer_email = ?`,
      [customerEmail]
    );
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب المفضلة' },
      { status: 500 }
    );
  }
}

// POST - إضافة للمفضلة
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerEmail, productId } = body;
    
    if (!customerEmail || !productId) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }
    
    const connection = await getConnection();
    
    // التأكد إذا المنتج موجود بالفعل
    const [existing] = await connection.execute(
      'SELECT * FROM wishlist WHERE customer_email = ? AND product_id = ?',
      [customerEmail, productId]
    );
    
    const existingWishlist = existing as any[];
    
    if (existingWishlist.length === 0) {
      await connection.execute(
        `INSERT INTO wishlist (id, customer_email, product_id)
         VALUES (?, ?, ?)`,
        [`WISH-${Date.now()}`, customerEmail, productId]
      );
    }
    
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إضافة المنتج للمفضلة' },
      { status: 500 }
    );
  }
}

// DELETE - حذف من المفضلة
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerEmail = searchParams.get('email');
    const productId = searchParams.get('productId');
    
    if (!customerEmail || !productId) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }
    
    const connection = await getConnection();
    await connection.execute(
      'DELETE FROM wishlist WHERE customer_email = ? AND product_id = ?',
      [customerEmail, productId]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في حذف المنتج من المفضلة' },
      { status: 500 }
    );
  }
}