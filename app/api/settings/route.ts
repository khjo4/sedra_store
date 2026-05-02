import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

// GET - جلب الإعدادات
export async function GET() {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute('SELECT * FROM settings WHERE id = 1');
    
    const settings = rows as any[];
    if (settings.length === 0) {
      return NextResponse.json({});
    }
    
    return NextResponse.json(settings[0]);
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
    const connection = await getConnection();
    
    await connection.execute(
      `UPDATE settings SET 
        store_name = ?, store_name_en = ?, currency = ?, exchange_rate = ?,
        free_shipping_threshold = ?, shipping_cost = ?, contact_email = ?,
        contact_phone = ?, whatsapp_number = ?, instagram_url = ?,
        facebook_url = ?, whatsapp_url = ?, hero_title = ?,
        hero_subtitle = ?, announcement = ?, announcement_active = ?
       WHERE id = 1`,
      [
        body.store_name, body.store_name_en, body.currency, body.exchange_rate,
        body.free_shipping_threshold, body.shipping_cost, body.contact_email,
        body.contact_phone, body.whatsapp_number, body.instagram_url,
        body.facebook_url, body.whatsapp_url, body.hero_title,
        body.hero_subtitle, body.announcement, body.announcement_active
      ]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث الإعدادات' },
      { status: 500 }
    );
  }
}