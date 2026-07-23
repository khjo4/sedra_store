import { NextRequest, NextResponse } from 'next/server';
import { getProductById, updateProduct, deleteProduct } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'معرف المنتج غير صحيح' },
        { status: 400 }
      );
    }

    const product = await getProductById(id);

    if (!product) {
      return NextResponse.json(
        { error: 'المنتج غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب المنتج' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingProduct = await getProductById(id);
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'المنتج غير موجود' },
        { status: 404 }
      );
    }

    if (!body.name || body.price == null || !body.category) {
      return NextResponse.json(
        { error: 'الاسم والسعر والقسم حقول مطلوبة' },
        { status: 400 }
      );
    }

    await updateProduct(id, body);
    const updatedProduct = await getProductById(id);
    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث المنتج' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingProduct = await getProductById(id);
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'المنتج غير موجود' },
        { status: 404 }
      );
    }

    await deleteProduct(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في حذف المنتج' },
      { status: 500 }
    );
  }
}
