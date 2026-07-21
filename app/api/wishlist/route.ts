import { NextResponse } from 'next/server';
import { getWishlist, addToWishlist, removeFromWishlist, getProductById } from '@/lib/db';

// ✅ GET - جلب المفضلة
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerEmail = searchParams.get('email');
    
    if (!customerEmail) {
      return NextResponse.json({ error: 'البريد الإلكتروني مطلوب' }, { status: 400 });
    }
    
    // ✅ استخدام الدالة من db.ts (التي تقوم بتحويل البيانات تلقائياً)
    const wishlist = await getWishlist(customerEmail);
    
    return NextResponse.json(wishlist);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب المفضلة' },
      { status: 500 }
    );
  }
}

// ✅ POST - إضافة للمفضلة
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerEmail, productId } = body;
    
    // ✅ التحقق من البيانات الأساسية
    if (!customerEmail || !productId) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني و productId مطلوبان' },
        { status: 400 }
      );
    }
    
    // ✅ التحقق من وجود المنتج
    const product = await getProductById(productId);
    if (!product) {
      return NextResponse.json(
        { error: 'المنتج غير موجود' },
        { status: 404 }
      );
    }
    
    // ✅ استخدام الدالة من db.ts (تتعامل مع حالة التكرار تلقائياً)
    await addToWishlist(customerEmail, productId);
    
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إضافة المنتج للمفضلة' },
      { status: 500 }
    );
  }
}

// ✅ DELETE - حذف من المفضلة
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerEmail = searchParams.get('email');
    const productId = searchParams.get('productId');
    
    if (!customerEmail || !productId) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني و productId مطلوبان' },
        { status: 400 }
      );
    }
    
    // ✅ استخدام الدالة من db.ts
    await removeFromWishlist(customerEmail, productId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في حذف المنتج من المفضلة' },
      { status: 500 }
    );
  }
}