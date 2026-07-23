import { NextResponse } from 'next/server';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getProductById,
} from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.email) {
      // زائر بدون حساب — الواجهة تعتمد على localStorage
      return NextResponse.json([]);
    }

    const wishlist = await getWishlist(session.email);
    return NextResponse.json(wishlist);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب المفضلة' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.email) {
      // لا نفشل الطلب للزائر — الحفظ محلي
      return NextResponse.json({ success: true, synced: false }, { status: 200 });
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'productId مطلوب' },
        { status: 400 }
      );
    }

    const product = await getProductById(String(productId));
    if (!product) {
      return NextResponse.json(
        { error: 'المنتج غير موجود' },
        { status: 404 }
      );
    }

    await addToWishlist(session.email, String(productId));
    return NextResponse.json({ success: true, synced: true }, { status: 201 });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إضافة المنتج للمفضلة' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session?.email) {
      return NextResponse.json({ success: true, synced: false });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'productId مطلوب' },
        { status: 400 }
      );
    }

    await removeFromWishlist(session.email, String(productId));
    return NextResponse.json({ success: true, synced: true });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في حذف المنتج من المفضلة' },
      { status: 500 }
    );
  }
}
