import { NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/db';

// GET - جلب الإعدادات
export async function GET() {
  try {
    const settings = await getSettings();
    
    if (!settings) {
      // ❌ خطأ: ما منرجع قيم افتراضية ثابتة
      // ✅ الحل: نرجع error أو ننشئ إعدادات جديدة في DB
      return NextResponse.json(
        { error: 'الإعدادات غير موجودة في قاعدة البيانات' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الإعدادات' },
      { status: 500 }
    );
  }
}

// PUT - تحديث الإعدادات
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    // ✅ نستخدم القيم اللي يبعتها المدير (من admin/settings)
    // وما منحدد أي أرقام ثابتة
    
    await updateSettings({
      storeName: body.storeName ?? body.store_name,
      storeNameEn: body.storeNameEn ?? body.store_name_en,
      currency: body.currency,
      exchangeRate: Number(body.exchangeRate ?? body.exchange_rate ?? 0),
      freeShippingThreshold: Number(
        body.freeShippingThreshold ?? body.free_shipping_threshold ?? 0
      ),
      shippingCost: Number(body.shippingCost ?? body.shipping_cost ?? 0),
      contactEmail: body.contactEmail ?? body.contact_email,
      contactPhone: body.contactPhone ?? body.contact_phone,
      whatsappNumber: body.whatsappNumber ?? body.whatsapp_number,
      instagramUrl: body.instagramUrl ?? body.instagram_url,
      facebookUrl: body.facebookUrl ?? body.facebook_url,
      whatsappUrl: body.whatsappUrl ?? body.whatsapp_url,
      heroTitle: body.heroTitle ?? body.hero_title,
      heroSubtitle: body.heroSubtitle ?? body.hero_subtitle,
      announcement: body.announcement,
      announcementActive: body.announcementActive ?? body.announcement_active ?? false,
    });
    
    const updatedSettings = await getSettings();
    
    return NextResponse.json({ 
      success: true, 
      settings: updatedSettings 
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير معروف';
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث الإعدادات: ' + errorMessage },
      { status: 500 }
    );
  }
}