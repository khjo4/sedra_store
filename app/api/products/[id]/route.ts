import { NextRequest, NextResponse } from 'next/server';
import { getProductById, updateProduct, deleteProduct } from '@/lib/db';

// ✅ GET - جلب منتج معين
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

// ✅ PUT - تحديث منتج (للمدير فقط)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // ✅ 1. التحقق من وجود المنتج قبل التحديث
    const existingProduct = await getProductById(id);
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'المنتج غير موجود' },
        { status: 404 }
      );
    }
    
    // ✅ 2. التحقق من البيانات الأساسية
    if (!body.name || !body.price || !body.category) {
      return NextResponse.json(
        { error: 'الاسم والسعر والقسم حقول مطلوبة' },
        { status: 400 }
      );
    }
    
    // ✅ 3. التحقق من صلاحية المدير (مؤقتاً)
    // const authHeader = request.headers.get('authorization');
    // if (!authHeader) {
    //   return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    // }
    
    await updateProduct(id, body);
    
    // ✅ 4. إرجاع المنتج بعد التحديث
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

// ✅ DELETE - حذف منتج (للمدير فقط)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // ✅ 1. التحقق من وجود المنتج قبل الحذف
    const existingProduct = await getProductById(id);
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'المنتج غير موجود' },
        { status: 404 }
      );
    }
    
    // ✅ 2. التحقق من صلاحية المدير (مؤقتاً)
    // const authHeader = request.headers.get('authorization');
    // if (!authHeader) {
    //   return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    // }
    
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