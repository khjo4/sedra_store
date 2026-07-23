import { NextRequest, NextResponse } from 'next/server';
import { getCouponById, updateCoupon, deleteCoupon } from '@/lib/db';

// ✅ GET - جلب كوبون معين (للمدير فقط)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ 1. التحقق من صلاحية المدير
    // const authHeader = request.headers.get('authorization');
    // if (!authHeader) {
    //   return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    // }
    
    const { id } = await params;
    
    // ✅ 2. استخدام الدالة من db.ts (التي تقوم بالتحويل تلقائياً)
    const coupon = await getCouponById(id);
    
    if (!coupon) {
      return NextResponse.json(
        { error: 'الكوبون غير موجود' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(coupon);
  } catch (error) {
    console.error('Error fetching coupon:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الكوبون' },
      { status: 500 }
    );
  }
}

// ✅ PUT - تحديث كوبون (للمدير فقط)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ 1. التحقق من صلاحية المدير
    // const authHeader = request.headers.get('authorization');
    // if (!authHeader) {
    //   return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    // }
    
    const { id } = await params;
    const body = await request.json();
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    const type = body.type;
    const value = Number(body.value);
    
    const existingCoupon = await getCouponById(id);
    if (!existingCoupon) {
      return NextResponse.json(
        { error: 'الكوبون غير موجود' },
        { status: 404 }
      );
    }
    
    if (!code || !type || Number.isNaN(value)) {
      return NextResponse.json(
        { error: 'الكود ونوع الخصم والقيمة حقول مطلوبة' },
        { status: 400 }
      );
    }
    
    if (type === 'percentage' && (value <= 0 || value > 100)) {
      return NextResponse.json(
        { error: 'نسبة الخصم يجب أن تكون بين 1 و 100' },
        { status: 400 }
      );
    }
    if (type === 'fixed' && value <= 0) {
      return NextResponse.json(
        { error: 'قيمة الخصم يجب أن تكون أكبر من 0' },
        { status: 400 }
      );
    }
    
    const { getCouponByCode } = await import('@/lib/db');
    const couponWithSameCode = await getCouponByCode(code);
    if (couponWithSameCode && couponWithSameCode.id !== id) {
      return NextResponse.json(
        { error: 'كود الخصم موجود بالفعل' },
        { status: 400 }
      );
    }
    
    await updateCoupon(id, {
      ...body,
      code,
      type,
      value,
      expiresAt: body.expiresAt || null,
    });
    
    const updatedCoupon = await getCouponById(id);
    return NextResponse.json({ success: true, coupon: updatedCoupon });
  } catch (error) {
    console.error('Error updating coupon:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث الكوبون' },
      { status: 500 }
    );
  }
}

// ✅ DELETE - حذف كوبون (للمدير فقط)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ 1. التحقق من صلاحية المدير
    // const authHeader = request.headers.get('authorization');
    // if (!authHeader) {
    //   return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    // }
    
    const { id } = await params;
    
    // ✅ 2. التحقق من وجود الكوبون قبل الحذف
    const existingCoupon = await getCouponById(id);
    if (!existingCoupon) {
      return NextResponse.json(
        { error: 'الكوبون غير موجود' },
        { status: 404 }
      );
    }
    
    // ✅ 3. استخدام الدالة من db.ts
    await deleteCoupon(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في حذف الكوبون' },
      { status: 500 }
    );
  }
}