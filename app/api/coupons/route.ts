import { NextResponse } from 'next/server';
import { getAllCoupons, createCoupon, getCouponByCode } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (code) {
      const coupon = await getCouponByCode(code);
      if (!coupon) {
        return NextResponse.json([], { status: 200 });
      }
      // Public validation: only expose fields needed to apply a coupon
      return NextResponse.json([
        {
          id: coupon.id,
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          minPurchase: coupon.minPurchase,
          maxUses: coupon.maxUses,
          usedCount: coupon.usedCount,
          active: coupon.active,
          expiresAt: coupon.expiresAt,
        },
      ]);
    }

    // Full list — admin only (enforced by middleware)
    const coupons = await getAllCoupons();
    return NextResponse.json(coupons);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الكوبونات' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    const type = body.type;
    const value = Number(body.value);

    if (!code || !type || Number.isNaN(value)) {
      return NextResponse.json(
        { error: 'الكود ونوع الخصم والقيمة حقول مطلوبة' },
        { status: 400 }
      );
    }

    const existingCoupon = await getCouponByCode(code);
    if (existingCoupon) {
      return NextResponse.json(
        { error: 'كود الخصم موجود بالفعل' },
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

    const newCoupon = await createCoupon({
      ...body,
      code,
      type,
      value,
      expiresAt: body.expiresAt || null,
    });
    return NextResponse.json({ success: true, coupon: newCoupon }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating coupon:', error);
    return NextResponse.json(
      {
        error: 'حدث خطأ في إضافة الكوبون',
        detail: String(error?.sqlMessage || error?.code || error?.message || 'unknown'),
      },
      { status: 500 }
    );
  }
}
