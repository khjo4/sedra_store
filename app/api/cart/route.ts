import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

// GET - جلب السلة (حسب session_id)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId مطلوب' }, { status: 400 });
    }
    
    const connection = await getConnection();
    const [rows] = await connection.execute(
      `SELECT c.*, p.name, p.price, p.images 
       FROM cart c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.session_id = ?`,
      [sessionId]
    );
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب السلة' },
      { status: 500 }
    );
  }
}

// POST - إضافة منتج للسلة
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, productId, quantity, selectedColor, selectedSize } = body;
    
    if (!sessionId || !productId) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }
    
    const connection = await getConnection();
    
    // التأكد إذا المنتج موجود بالفعل في السلة
    const [existing] = await connection.execute(
      `SELECT * FROM cart WHERE session_id = ? AND product_id = ? 
       AND selected_color = ? AND selected_size = ?`,
      [sessionId, productId, selectedColor || null, selectedSize || null]
    );
    
    const existingCart = existing as any[];
    
    if (existingCart.length > 0) {
      // تحديث الكمية
      await connection.execute(
        `UPDATE cart SET quantity = quantity + ? 
         WHERE session_id = ? AND product_id = ? 
         AND selected_color = ? AND selected_size = ?`,
        [quantity || 1, sessionId, productId, selectedColor || null, selectedSize || null]
      );
    } else {
      // إضافة منتج جديد
      await connection.execute(
        `INSERT INTO cart (id, session_id, product_id, quantity, selected_color, selected_size)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [`CART-${Date.now()}`, sessionId, productId, quantity || 1, selectedColor || null, selectedSize || null]
      );
    }
    
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إضافة المنتج للسلة' },
      { status: 500 }
    );
  }
}

// PUT - تحديث كمية منتج في السلة
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, productId, quantity, selectedColor, selectedSize } = body;
    
    const connection = await getConnection();
    
    if (quantity <= 0) {
      // حذف المنتج من السلة
      await connection.execute(
        `DELETE FROM cart WHERE session_id = ? AND product_id = ? 
         AND selected_color = ? AND selected_size = ?`,
        [sessionId, productId, selectedColor || null, selectedSize || null]
      );
    } else {
      // تحديث الكمية
      await connection.execute(
        `UPDATE cart SET quantity = ? 
         WHERE session_id = ? AND product_id = ? 
         AND selected_color = ? AND selected_size = ?`,
        [quantity, sessionId, productId, selectedColor || null, selectedSize || null]
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating cart:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث السلة' },
      { status: 500 }
    );
  }
}

// DELETE - تفريغ السلة بالكامل
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId مطلوب' }, { status: 400 });
    }
    
    const connection = await getConnection();
    await connection.execute('DELETE FROM cart WHERE session_id = ?', [sessionId]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تفريغ السلة' },
      { status: 500 }
    );
  }
}