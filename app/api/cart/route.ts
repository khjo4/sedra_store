import { NextResponse } from 'next/server';
import { getCart, addToCart, updateCartItem, clearCart } from '@/lib/db';

// ✅ GET - جلب السلة (حسب session_id)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId مطلوب' }, { status: 400 });
    }
    
    // ✅ استخدام الدالة من db.ts (التي تقوم بتحويل البيانات تلقائياً)
    const cart = await getCart(sessionId);
    
    return NextResponse.json(cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب السلة' },
      { status: 500 }
    );
  }
}

// ✅ POST - إضافة منتج للسلة
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, productId, quantity, selectedColor, selectedSize } = body;
    
    // ✅ التحقق من البيانات الأساسية
    if (!sessionId || !productId) {
      return NextResponse.json(
        { error: 'sessionId و productId مطلوبان' },
        { status: 400 }
      );
    }
    
    // ✅ التحقق من وجود المنتج (اختياري، يمكن إضافته لاحقاً)
    // const { getProductById } = await import('@/lib/db');
    // const product = await getProductById(productId);
    // if (!product) {
    //   return NextResponse.json({ error: 'المنتج غير موجود' }, { status: 404 });
    // }
    
    // ✅ استخدام الدالة من db.ts
    await addToCart({
      sessionId,
      productId,
      quantity: quantity || 1,
      selectedColor,
      selectedSize,
    });
    
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إضافة المنتج للسلة' },
      { status: 500 }
    );
  }
}

// ✅ PUT - تحديث كمية منتج في السلة
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, productId, quantity, selectedColor, selectedSize } = body;
    
    if (!sessionId || !productId) {
      return NextResponse.json(
        { error: 'sessionId و productId مطلوبان' },
        { status: 400 }
      );
    }
    
    if (quantity === undefined) {
      return NextResponse.json(
        { error: 'الكمية مطلوبة' },
        { status: 400 }
      );
    }
    
    // ✅ استخدام الدالة من db.ts (تتعامل مع الحذف إذا quantity <= 0)
    await updateCartItem({
      sessionId,
      productId,
      quantity,
      selectedColor,
      selectedSize,
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating cart:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث السلة' },
      { status: 500 }
    );
  }
}

// ✅ DELETE - تفريغ السلة بالكامل
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId مطلوب' }, { status: 400 });
    }
    
    // ✅ استخدام الدالة من db.ts
    await clearCart(sessionId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تفريغ السلة' },
      { status: 500 }
    );
  }
}