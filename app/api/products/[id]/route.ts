import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

// GET - جلب منتج واحد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ استخدام await لتفريغ params
    const { id } = await params;
    
    const connection = await getConnection();
    const [rows] = await connection.execute(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );
    
    const products = rows as any[];
    if (products.length === 0) {
      return NextResponse.json(
        { error: 'المنتج غير موجود' },
        { status: 404 }
      );
    }
    
    // تحويل price إلى رقم
    const product = {
      ...products[0],
      price: parseFloat(products[0].price),
      originalPrice: products[0].original_price ? parseFloat(products[0].original_price) : undefined,
    };
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب المنتج' },
      { status: 500 }
    );
  }
}

// PUT - تحديث منتج
// PUT - تحديث منتج
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const connection = await getConnection();
    
    const { 
      name, nameEn, price, originalPrice, category, stock, 
      featured, bestSeller, newArrival, images, colors, sizes 
    } = body;
    
    // تحويل undefined إلى null لتجنب الخطأ
    await connection.execute(
      `UPDATE products SET 
        name = ?, name_en = ?, price = ?, original_price = ?, category = ?, 
        stock = ?, featured = ?, best_seller = ?, new_arrival = ?, 
        images = ?, colors = ?, sizes = ?
       WHERE id = ?`,
      [
        name || null, 
        nameEn || null, 
        price || null, 
        originalPrice !== undefined ? originalPrice : null, 
        category || null, 
        stock !== undefined ? stock : null, 
        featured !== undefined ? featured : null, 
        bestSeller !== undefined ? bestSeller : null, 
        newArrival !== undefined ? newArrival : null, 
        images ? JSON.stringify(images) : null, 
        colors ? JSON.stringify(colors) : null, 
        sizes ? JSON.stringify(sizes) : null, 
        id
      ]
    );
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث المنتج' },
      { status: 500 }
    );
  }
}

// DELETE - حذف منتج
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const connection = await getConnection();
    await connection.execute('DELETE FROM products WHERE id = ?', [id]);
    
    return NextResponse.json({ message: 'تم حذف المنتج بنجاح' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في حذف المنتج' },
      { status: 500 }
    );
  }
}