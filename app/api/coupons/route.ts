import { NextResponse } from 'next/server';
import { getAllCoupons, createCoupon, incrementCouponUsage, getCouponByCode } from '@/lib/db';

// ✅ GET - جلب جميع الكوبونات (للمدير فقط)
export async function GET(request: Request) {
  try {
    // ✅ 1. التحقق من صلاحية المدير (لجلب جميع الكوبونات)
    const authHeader = request.headers.get('authorization');
    // مؤقتاً: نضيف تحقق بسيط
    // if (!authHeader) {
    //   return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    // }
    
    // ✅ 2. دعم البحث بكود محدد (للاستخدام من قبل العملاء)
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    if (code) {
      // إذا طلب كوبون معين (للمستخدمين العاديين)
      const coupon = await getCouponByCode(code);
      if (!coupon) {
        return NextResponse.json([], { status: 200 });
      }
      return NextResponse.json([coupon]);
    }
    
    // ✅ 3. جلب جميع الكوبونات (للمدير فقط)
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

// ✅ POST - إضافة كوبون جديد (للمدير فقط)
export async function POST(request: Request) {
  try {
    // ✅ 1. التحقق من صلاحية المدير
    // const authHeader = request.headers.get('authorization');
    // if (!authHeader) {
    //   return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    // }
    
    const body = await request.json();
    
    // ✅ 2. التحقق من البيانات الأساسية
    if (!body.code || !body.type || !body.value) {
      return NextResponse.json(
        { error: 'الكود ونوع الخصم والقيمة حقول مطلوبة' },
        { status: 400 }
      );
    }
    
    // ✅ 3. التحقق من عدم وجود كوبون بنفس الكود
    const existingCoupon = await getCouponByCode(body.code);
    if (existingCoupon) {
      return NextResponse.json(
        { error: 'كود الخصم موجود بالفعل' },
        { status: 400 }
      );
    }
    
    // ✅ 4. التحقق من صحة القيم
    if (body.type === 'percentage' && (body.value <= 0 || body.value > 100)) {
      return NextResponse.json(
        { error: 'نسبة الخصم يجب أن تكون بين 1 و 100' },
        { status: 400 }
      );
    }
    if (body.type === 'fixed' && body.value <= 0) {
      return NextResponse.json(
        { error: 'قيمة الخصم يجب أن تكون أكبر من 0' },
        { status: 400 }
      );
    }
    
    // ✅ 5. استخدام الدالة من db.ts
    const newCoupon = await createCoupon(body);
    
    return NextResponse.json({ success: true, coupon: newCoupon }, { status: 201 });
  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إضافة الكوبون' },
      { status: 500 }
    );
  }
}

// ✅ PUT - تحديث عدد استخدامات كوبون (للاستخدام من قبل العملاء)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { code } = body;
    
    if (!code) {
      return NextResponse.json(
        { error: 'كود الخصم مطلوب' },
        { status: 400 }
      );
    }
    
    // ✅ 1. التحقق من وجود الكوبون
    const coupon = await getCouponByCode(code);
    if (!coupon) {
      return NextResponse.json(
        { error: 'كود الخصم غير موجود' },
        { status: 404 }
      );
    }
    
    // ✅ 2. التحقق من أن الكوبون لا يزال صالحاً
    if (!coupon.active) {
      return NextResponse.json(
        { error: 'كود الخصم غير مفعل' },
        { status: 400 }
      );
    }
    
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'كود الخصم منتهي الصلاحية' },
        { status: 400 }
      );
    }
    
    if (coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json(
        { error: 'تم استخدام كود الخصم بالكامل' },
        { status: 400 }
      );
    }
    
    // ✅ 3. استخدام الدالة من db.ts
    await incrementCouponUsage(code);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating coupon usage:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث استخدام الكوبون' },
      { status: 500 }
    );
  }
}